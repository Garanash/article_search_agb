import asyncio
import httpx
import json

async def test_perplexity_api():
    """Тестирует подключение к Perplexity API"""
    
    api_key = "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"
    base_url = "https://api.perplexity.ai"
    
    print(f"Тестируем Perplexity API...")
    print(f"API ключ: {api_key[:10]}...")
    print(f"URL: {base_url}")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "sonar-small-online",
        "messages": [
            {
                "role": "user",
                "content": "Привет! Это тестовое сообщение."
            }
        ],
        "max_tokens": 50
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("Отправляем запрос...")
            response = await client.post(
                f"{base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            
            print(f"Код ответа: {response.status_code}")
            print(f"Заголовки: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Успешно!")
                print(f"Ответ: {data}")
            else:
                print("❌ Ошибка!")
                print(f"Текст ответа: {response.text}")
                
    except Exception as e:
        print(f"❌ Ошибка подключения: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    asyncio.run(test_perplexity_api()) 