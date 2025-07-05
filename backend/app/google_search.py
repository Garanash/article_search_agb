import os
import httpx
import re
import json
import asyncio
from openai import OpenAI
import whois
from typing import List

AGGREGATORS = ["alibaba", "ebay", "amazon", "yandex", "avito", "ozon", "aliexpress"]
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "...")
GOOGLE_CX = os.getenv("GOOGLE_CX", "...")

SEARCH_ROLES = [
    "дилер", "дистрибьютор", "поставщик", "производитель", "официальный сайт", "купить оптом", "distributor", "supplier", "manufacturer"
]

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY", "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")
client = OpenAI(api_key=PERPLEXITY_API_KEY, base_url="https://api.perplexity.ai")

def extract_country_from_url(url):
    tld = url.split('.')[-1].split('/')[0]
    tld_map = {
        "ru": "Россия", "de": "Германия", "cn": "Китай", "jp": "Япония", "us": "США", "fr": "Франция", "it": "Италия",
        "pl": "Польша", "tr": "Турция", "in": "Индия", "uk": "Великобритания", "es": "Испания"
    }
    return tld_map.get(tld, "")

async def search_suppliers(article_code: str, region: str):
    async with httpx.AsyncClient(verify=False) as client:
        results = []
        seen_sites = set()
        article_variants = list(set([
            article_code,
            article_code.upper(),
            article_code.lower()
        ]))
        for variant in article_variants:
            for role in SEARCH_ROLES:
                query = f"{variant} {role} {region}"
                url = (
                    f"https://www.googleapis.com/customsearch/v1?q={query}&key={GOOGLE_API_KEY}&cx={GOOGLE_CX}&num=10"
                )
                resp = await client.get(url)
                data = resp.json()
                if "items" in data:
                    for item in data["items"]:
                        link = item.get("link", "")
                        if not link or any(a in link for a in AGGREGATORS) or link in seen_sites:
                            continue
                        seen_sites.add(link)
                        # Название компании
                        name = item.get("title", link.split('//')[1].split('/')[0])
                        # Email из snippet
                        snippet = item.get("snippet", "")
                        emails = re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+", snippet)
                        email = emails[0] if emails else ""
                        # Если не нашли — ищем на сайте
                        if not email:
                            try:
                                site_resp = await client.get(link, timeout=5)
                                emails = re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+", site_resp.text)
                                email = emails[0] if emails else ""
                            except Exception:
                                pass
                        # Страна
                        country = extract_country_from_url(link)
                        results.append({
                            "name": name,
                            "website": link,
                            "email": email,
                            "country": country or region
                        })
                        if len(results) >= 12:
                            break
                if len(results) >= 12:
                    break
            if len(results) >= 12:
                break
        return results 

async def search_suppliers_perplexity(article_code: str, region: str):
    prompt = (
        f"Найди минимум 10 компаний (дилеров, дистрибьюторов, производителей, поставщиков), которые реально торгуют артикулом {article_code} в регионе {region}. "
        f"Для каждой компании укажи: название, сайт (где найдена информация), email (если есть), страну. Верни только список компаний в формате JSON-массива с ключами name, website, email, country."
    )
    messages = [
        {
            "role": "system",
            "content": (
                "Ты искусственный интеллект, который помогает находить поставщиков электронных компонентов. "
                "Верни только JSON-массив компаний с ключами name, website, email, country."
            ),
        },
        {
            "role": "user",
            "content": prompt,
        },
    ]
    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model="sonar-pro",
                messages=messages,
            )
        )
        content = response.choices[0].message.content
        # Ищем JSON-массив в ответе
        match = re.search(r'(\[.*?\])', content, re.DOTALL)
        if match:
            try:
                companies = json.loads(match.group(1))
                # Возвращаем все компании, найденные Perplexity, только с name и website
                return [
                    {
                        "name": c.get("name", ""),
                        "website": c.get("website", ""),
                        "email": str(c.get("email") or ""),
                        "country": c.get("country", region)
                    }
                    for c in companies if c.get("name") and c.get("website")
                ]
            except Exception:
                return []
        return []
    except Exception as e:
        print(f"Perplexity API error: {e}")
        return [] 

async def search_email_perplexity(company_name: str, website: str, region: str) -> str:
    prompt = (
        f"Найди email для отдела продаж, закупок или оптовых заказов компании {company_name} (сайт: {website}) в регионе {region}. "
        f"Приоритет: sales@, orders@, wholesale@, info@, contact@, закупки@, опт@. "
        f"ВЕРНИ ТОЛЬКО EMAIL АДРЕС БЕЗ КАВЫЧЕК, КОММЕНТАРИЕВ, ПРИМЕЧАНИЙ ИЛИ ДОПОЛНИТЕЛЬНОГО ТЕКСТА. "
        f"Если email не найден - верни пустую строку. "
        f"НЕ ПИШИ НИЧЕГО КРОМЕ EMAIL АДРЕСА."
    )
    messages = [
        {
            "role": "system",
            "content": (
                "Ты помощник для поиска email адресов. "
                "Твоя задача - найти рабочий email для коммерческих запросов. "
                "ВЕРНИ ТОЛЬКО EMAIL АДРЕС (например: sales@company.com) или пустую строку. "
                "НЕ ДОБАВЛЯЙ КОММЕНТАРИИ, ОБЪЯСНЕНИЯ, ПРИМЕЧАНИЯ ИЛИ ДОПОЛНИТЕЛЬНЫЙ ТЕКСТ. "
                "НЕ ИСПОЛЬЗУЙ КАВЫЧКИ ВОКРУГ EMAIL. "
                "НЕ ПИШИ НИЧЕГО КРОМЕ EMAIL АДРЕСА ИЛИ ПУСТОЙ СТРОКИ."
            ),
        },
        {
            "role": "user",
            "content": prompt,
        },
    ]
    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model="sonar-pro",
                messages=messages,
            )
        )
        content = response.choices[0].message.content.strip()
        # Вырезаем email из ответа (или пустую строку)
        # Сначала ищем стандартный email паттерн
        match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", content)
        if match:
            email = match.group(0)
            # Проверяем, что это действительно email, а не часть комментария
            if '@' in email and '.' in email.split('@')[1]:
                return email
        # Если не нашли по паттерну, но есть @ в контенте
        if '@' in content:
            # Разбиваем по строкам и ищем строку с email
            lines = content.split('\n')
            for line in lines:
                line = line.strip()
                if '@' in line and '.' in line.split('@')[1]:
                    # Очищаем от лишних символов
                    email = re.sub(r'[^\w@.-]', '', line)
                    if '@' in email and '.' in email.split('@')[1]:
                        return email
        return ""
    except Exception as e:
        print(f"Perplexity email search error: {e}")
        return ""

# Новый endpoint: проверка сайтов через whois
async def check_websites_whois(sites: List[str]) -> List[str]:
    valid = []
    for url in sites:
        domain = re.sub(r"^https?://", "", url).split("/")[0]
        try:
            w = await asyncio.get_event_loop().run_in_executor(None, lambda: whois.whois(domain))
            if w.domain_name:
                valid.append(url)
        except Exception:
            continue
    return valid 