import os
import logging
from aiogram import Bot, Dispatcher, types, Router
from aiogram.types import ContentType, ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract
import asyncio
from aiogram.filters import Command
import numpy as np
import requests
import base64
from openai import OpenAI
from datetime import datetime
import uuid
import aiohttp
from asyncio import Semaphore
import re

VSEGPT_API_KEY = 'sk-or-vv-e3624330b439fc1e353cb8ce00b513a845cc0e6964c4bec285412a2c6bdc46d3'
API_TOKEN = '7021261890:AAHqWyZb1CAr_Xw7u35C-pyGBJZuisafa_Y'

# Если tesseract не в PATH, укажите путь к исполняемому файлу
if os.name == 'posix':
    pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'
# Для Windows (локально)
else:
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

logging.basicConfig(level=logging.INFO)

bot = Bot(token=API_TOKEN)
dp = Dispatcher()
router = Router()

# Для локальной разработки используем 5158, для Docker - 8080
API_URL = os.getenv("API_URL", "http://localhost:8080/api/ocrphoto")

# Ограничиваем количество одновременных обработок
MAX_CONCURRENT_PROCESSING = 2
processing_semaphore = Semaphore(MAX_CONCURRENT_PROCESSING)

# Очередь для обработки фотографий
processing_queue = asyncio.Queue()

# Счетчики для отслеживания
processed_count = 0
total_count = 0

user_data = {}
waiting_for_phone = {}
waiting_for_city = {}
waiting_for_birth_date = {}
waiting_for_car = {}
waiting_for_spouse = {}
waiting_for_children = {}
waiting_for_email = {}

# --- Главное меню ---
main_menu = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="📷 Отправить фото")],
        [KeyboardButton(text="📊 Статус"), KeyboardButton(text="ℹ️ Помощь")],
    ],
    resize_keyboard=True
)

def get_additional_info_keyboard():
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📞 Добавить телефон")],
            [KeyboardButton(text="📧 Добавить почту")],
            [KeyboardButton(text="📍 Добавить город")],
            [KeyboardButton(text="🚗 Добавить автомобиль")],
            [KeyboardButton(text="✅ Готово")],
        ],
        resize_keyboard=True
    )
    return keyboard

# --- Приветствие ---
@router.message(Command(commands=["start", "help"]))
async def send_welcome(message: types.Message):
    text = (
        "👋 Добро пожаловать в бота для распознавания визиток!\n\n"
        "Отправьте фотографию визитки или воспользуйтесь кнопками меню:\n"
        "\n📷 <b>Отправить фото</b> — загрузить визитку\n"
        "📊 <b>Статус</b> — узнать состояние обработки\n"
        "ℹ️ <b>Помощь</b> — инструкция по использованию\n"
    )
    await message.answer(text, reply_markup=main_menu, parse_mode="HTML")

# --- Обработка кнопок меню ---
@router.message(lambda m: m.text == "ℹ️ Помощь")
async def help_message(message: types.Message):
    await message.answer(
        "ℹ️ <b>Как пользоваться ботом?</b>\n\n"
        "1. Нажмите <b>Отправить фото</b> или просто отправьте фотографию визитки.\n"
        "2. Дождитесь ответа с распознанным текстом.\n"
        "3. Для повторной отправки — снова используйте кнопку или отправьте фото.\n\n",
        parse_mode="HTML",
        reply_markup=main_menu
    )

@router.message(lambda m: m.text == "📊 Статус")
async def status_message(message: types.Message):
    global total_count, processed_count
    queue_size = processing_queue.qsize()
    await message.answer(
        f"📊 <b>Статус обработки:</b>\n"
        f"📸 Всего принято: {total_count}\n"
        f"✅ Обработано: {processed_count}\n"
        f"⏳ В очереди: {queue_size}\n"
        f"🔄 Одновременно обрабатывается: {MAX_CONCURRENT_PROCESSING}",
        parse_mode="HTML",
        reply_markup=main_menu
    )

@router.message(lambda m: m.text == "📷 Отправить фото")
async def ask_for_photo(message: types.Message):
    await message.answer(
        "Пожалуйста, отправьте фотографию визитки одним сообщением.",
        reply_markup=ReplyKeyboardRemove()
    )

def extract_email_from_text(text):
    """Извлекает email адрес из текста"""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    match = re.search(email_pattern, text)
    return match.group(0) if match else None

def extract_phone_from_text(text):
    """Извлекает номер телефона из текста"""
    # Паттерны для российских номеров телефонов
    phone_patterns = [
        r'\+7\s*\(?(\d{3})\)?\s*(\d{3})[-\s]?(\d{2})[-\s]?(\d{2})',  # +7 (999) 123-45-67
        r'8\s*\(?(\d{3})\)?\s*(\d{3})[-\s]?(\d{2})[-\s]?(\d{2})',   # 8 (999) 123-45-67
        r'(\d{3})[-\s]?(\d{3})[-\s]?(\d{2})[-\s]?(\d{2})',          # 999 123-45-67
        r'\+7\s*(\d{10})',                                            # +7 9991234567
        r'8\s*(\d{10})',                                              # 8 9991234567
    ]
    
    for pattern in phone_patterns:
        match = re.search(pattern, text)
        if match:
            if pattern.startswith(r'\+7\s*\(?(\d{3})\)?\s*(\d{3})[-\s]?(\d{2})[-\s]?(\d{2})'):
                # Формат +7 (999) 123-45-67
                return f"+7 ({match.group(1)}) {match.group(2)}-{match.group(3)}-{match.group(4)}"
            elif pattern.startswith(r'8\s*\(?(\d{3})\)?\s*(\d{3})[-\s]?(\d{2})[-\s]?(\d{2})'):
                # Формат 8 (999) 123-45-67
                return f"+7 ({match.group(1)}) {match.group(2)}-{match.group(3)}-{match.group(4)}"
            elif pattern.startswith(r'(\d{3})[-\s]?(\d{3})[-\s]?(\d{2})[-\s]?(\d{2})'):
                # Формат 999 123-45-67
                return f"+7 ({match.group(1)}) {match.group(2)}-{match.group(3)}-{match.group(4)}"
            elif pattern.startswith(r'\+7\s*(\d{10})'):
                # Формат +7 9991234567
                digits = match.group(1)
                return f"+7 ({digits[:3]}) {digits[3:6]}-{digits[6:8]}-{digits[8:]}"
            elif pattern.startswith(r'8\s*(\d{10})'):
                # Формат 8 9991234567
                digits = match.group(1)
                return f"+7 ({digits[:3]}) {digits[3:6]}-{digits[6:8]}-{digits[8:]}"
    
    return None

# --- Обработка фото ---
async def process_photo_async(message: types.Message, photo, temp_file):
    global processed_count
    async with processing_semaphore:
        try:
            if not os.path.exists(temp_file):
                await message.reply("Ошибка: временный файл не найден.")
                return

            image = Image.open(temp_file)
            image = image.convert('L')
            image = ImageEnhance.Contrast(image).enhance(2)
            image = image.filter(ImageFilter.SHARPEN)
            base_width = 1000
            wpercent = (base_width / float(image.size[0]))
            hsize = int((float(image.size[1]) * float(wpercent)))
            image = image.resize((base_width, hsize), Image.LANCZOS)
            image = adaptive_threshold(image)

            custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@.-+()'
            text = pytesseract.image_to_string(image, lang='rus+eng', config=custom_config)
            
            vsegpt_text = await vsegpt_vision(temp_file, text)
            
            if vsegpt_text and vsegpt_text.strip():
                processed_count += 1
                
                # Автоматически извлекаем email и телефон из распознанного текста
                auto_email = extract_email_from_text(vsegpt_text)
                auto_phone = extract_phone_from_text(vsegpt_text)
                
                try:
                    api_response = await send_to_api(
                        telegram_user_id=message.from_user.id,
                        file_id=photo.file_id,
                        extracted_text=vsegpt_text,
                        image_path=temp_file,
                        email=auto_email,
                        representative_phone=auto_phone
                    )
                    
                    # Проверяем, была ли запись обновлена
                    print(f"API Response: {api_response}")
                    is_updated = api_response.get('IsUpdated') or api_response.get('isUpdated')
                    print(f"Is Updated: {is_updated}")
                    
                    # Формируем сообщение с информацией об автоматически найденных данных
                    info_message = f"✅ Вот что я смог распознать:\n{vsegpt_text}\n\n"
                    
                    if auto_email:
                        info_message += f"📧 Email автоматически найден: {auto_email}\n"
                    if auto_phone:
                        info_message += f"📞 Телефон автоматически найден: {auto_phone}\n"
                    
                    if api_response and is_updated:
                        info_message = f"🔄 {api_response.get('Message', 'Запись обновлена')}\n\n" + info_message
                    else:
                        info_message = f"✅ {api_response.get('Message', 'Создана новая запись')}\n\n" + info_message
                    
                    await message.reply(
                        info_message,
                        reply_markup=get_additional_info_keyboard()
                    )
                    
                    # Сохраняем user_data для последующего дополнения
                    user_data[message.from_user.id] = {
                        "file_id": photo.file_id,
                        "text": vsegpt_text,
                        "email": auto_email,
                        "phone": auto_phone
                    }
                except Exception as api_error:
                    logging.error(f"Ошибка при отправке в API: {api_error}")
                    await message.reply("Ошибка при сохранении данных в базу.", reply_markup=main_menu)
            else:
                await message.reply("❌ Я не смог распознать текст на этой фотографии.", reply_markup=main_menu)
        except Exception as e:
            await message.reply(f"❌ Ошибка при распознавании: {e}", reply_markup=main_menu)
            logging.error(f"Ошибка при обработке фотографии: {e}")
        finally:
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
                    print(f"Удален временный файл: {temp_file}")
            except Exception as e:
                logging.error(f"Ошибка при удалении временного файла {temp_file}: {e}")

@router.message(lambda message: message.photo is not None)
async def handle_photo(message: types.Message):
    global total_count
    total_count += 1
    photo = message.photo[-1]
    file_info = await bot.get_file(photo.file_id)
    file_path = file_info.file_path
    file = await bot.download_file(file_path)
    unique_id = str(uuid.uuid4())
    temp_file = f'temp_photo_{unique_id}.jpg'
    try:
        with open(temp_file, 'wb') as f:
            f.write(file.read())
        await processing_queue.put((message, photo, temp_file))
        await message.reply(f"Фотография принята в обработку. Пожалуйста, подождите...", reply_markup=main_menu)
    except Exception as e:
        await message.reply(f"Ошибка при сохранении фотографии: {e}", reply_markup=main_menu)
        logging.error(f"Ошибка при сохранении фотографии: {e}")

# --- Обработчик текстовых сообщений для дополнения информации ---
@router.message(lambda message: message.text and not message.text.startswith('/') and not message.text in [
    "📞 Добавить телефон", "📧 Добавить почту", "📍 Добавить город", "🎂 Добавить дату рождения", 
    "🚗 Добавить автомобиль", "💍 Добавить семью", "👶 Добавить детей", "✅ Готово",
    "📷 Отправить фото", "📊 Статус", "ℹ️ Помощь"
])
async def handle_text_input(message: types.Message):
    user_id = message.from_user.id
    
    if waiting_for_phone.get(user_id):
        await handle_phone_input(message)
    elif waiting_for_email.get(user_id):
        await handle_email_input(message)
    elif waiting_for_city.get(user_id):
        await handle_city_input(message)
    elif waiting_for_birth_date.get(user_id):
        await handle_birth_date_input(message)
    elif waiting_for_car.get(user_id):
        await handle_car_input(message)
    elif waiting_for_spouse.get(user_id):
        await handle_spouse_input(message)
    elif waiting_for_children.get(user_id):
        await handle_children_count_input(message)

# --- Обработчики дополнительной информации ---
@router.message(lambda m: m.text == "✅ Готово")
async def finish_input(message: types.Message):
    user_id = message.from_user.id
    # Очищаем данные пользователя
    user_data.pop(user_id, None)
    waiting_for_phone.pop(user_id, None)
    waiting_for_email.pop(user_id, None)
    waiting_for_city.pop(user_id, None)
    waiting_for_birth_date.pop(user_id, None)
    waiting_for_car.pop(user_id, None)
    waiting_for_spouse.pop(user_id, None)
    waiting_for_children.pop(user_id, None)
    
    await message.answer("Данные сохранены!", reply_markup=main_menu)

@router.message(lambda m: m.text == "📞 Добавить телефон")
async def add_phone(message: types.Message):
    print(f"Нажата кнопка 'Добавить телефон' пользователем {message.from_user.id}")
    user_id = message.from_user.id
    
    # Проверяем, есть ли уже автоматически найденный телефон
    if user_data.get(user_id, {}).get("phone"):
        await message.answer(
            f"📞 У вас уже есть телефон: {user_data[user_id]['phone']}\n\n"
            f"Если хотите изменить его, введите новый номер:",
            reply_markup=ReplyKeyboardRemove()
        )
    else:
        await message.answer("Введите номер телефона:", reply_markup=ReplyKeyboardRemove())
    
    waiting_for_phone[user_id] = True

@router.message(lambda m: m.text == "📧 Добавить почту")
async def add_email(message: types.Message):
    user_id = message.from_user.id
    
    # Проверяем, есть ли уже автоматически найденный email
    if user_data.get(user_id, {}).get("email"):
        await message.answer(
            f"📧 У вас уже есть email: {user_data[user_id]['email']}\n\n"
            f"Если хотите изменить его, введите новый email:",
            reply_markup=ReplyKeyboardRemove()
        )
    else:
        await message.answer("Введите email адрес:", reply_markup=ReplyKeyboardRemove())
    
    waiting_for_email[user_id] = True

@router.message(lambda m: m.text == "📍 Добавить город")
async def add_city(message: types.Message):
    waiting_for_city[message.from_user.id] = True
    await message.answer("Введите название города:", reply_markup=ReplyKeyboardRemove())

@router.message(lambda m: m.text == "🎂 Добавить дату рождения")
async def add_birth_date(message: types.Message):
    waiting_for_birth_date[message.from_user.id] = True
    await message.answer("Введите дату рождения (ДД.ММ.ГГГГ):", reply_markup=ReplyKeyboardRemove())

@router.message(lambda m: m.text == "🚗 Добавить автомобиль")
async def add_car(message: types.Message):
    waiting_for_car[message.from_user.id] = True
    await message.answer("Введите марку и номер автомобиля (например: BMW A123BC):", reply_markup=ReplyKeyboardRemove())

@router.message(lambda m: m.text == "💍 Добавить семью")
async def add_family(message: types.Message):
    waiting_for_spouse[message.from_user.id] = True
    await message.answer("Введите ФИО супруга/супруги:", reply_markup=ReplyKeyboardRemove())

@router.message(lambda m: m.text == "👶 Добавить детей")
async def add_children(message: types.Message):
    waiting_for_children[message.from_user.id] = True
    await message.answer("Введите количество детей:", reply_markup=ReplyKeyboardRemove())

async def handle_phone_input(message: types.Message):
    phone = message.text
    user_id = message.from_user.id
    
    # Если пользователь ввел тот же телефон, что и был найден автоматически, не отправляем повторно
    if phone == user_data[user_id].get("phone"):
        await message.answer("Этот телефон уже сохранен!", reply_markup=get_additional_info_keyboard())
        waiting_for_phone.pop(user_id, None)
        return
    
    user_data[user_id]["phone"] = phone
    await send_to_api(
        telegram_user_id=user_id,
        file_id=user_data[user_id]["file_id"],
        extracted_text=user_data[user_id]["text"],
        image_path=None,  # Не передаем путь к файлу
        representative_phone=phone
    )
    waiting_for_phone.pop(user_id, None)
    await message.answer("Телефон добавлен!", reply_markup=get_additional_info_keyboard())

async def handle_email_input(message: types.Message):
    email = message.text
    user_id = message.from_user.id
    
    # Если пользователь ввел тот же email, что и был найден автоматически, не отправляем повторно
    if email == user_data[user_id].get("email"):
        await message.answer("Этот email уже сохранен!", reply_markup=get_additional_info_keyboard())
        waiting_for_email.pop(user_id, None)
        return
    
    user_data[user_id]["email"] = email
    await send_to_api(
        telegram_user_id=user_id,
        file_id=user_data[user_id]["file_id"],
        extracted_text=user_data[user_id]["text"],
        image_path=None,  # Не передаем путь к файлу
        email=email
    )
    waiting_for_email.pop(user_id, None)
    await message.answer("Email добавлен!", reply_markup=get_additional_info_keyboard())

async def handle_city_input(message: types.Message):
    city = message.text
    user_id = message.from_user.id
    user_data[user_id]["city"] = city
    await send_to_api(
        telegram_user_id=user_id,
        file_id=user_data[user_id]["file_id"],  # тот же file_id!
        extracted_text=user_data[user_id]["text"],
        image_path=None,
        city=city
    )
    waiting_for_city.pop(user_id, None)
    await message.answer("Город добавлен!", reply_markup=get_additional_info_keyboard())

async def handle_birth_date_input(message: types.Message):
    birth_date = message.text
    user_id = message.from_user.id
    user_data[user_id]["birth_date"] = birth_date
    await send_to_api(
        telegram_user_id=user_id,
        file_id=user_data[user_id]["file_id"],
        extracted_text=user_data[user_id]["text"],
        image_path=None,
        birth_date=birth_date
    )
    waiting_for_birth_date.pop(user_id, None)
    await message.answer("Дата рождения добавлена!", reply_markup=get_additional_info_keyboard())

async def handle_car_input(message: types.Message):
    car_info = message.text
    # Пытаемся разделить марку и номер
    parts = car_info.split()
    car_brand = parts[0] if len(parts) > 0 else car_info
    car_number = parts[1] if len(parts) > 1 else None
    
    user_id = message.from_user.id
    user_data[user_id]["car_brand"] = car_brand
    user_data[user_id]["car_number"] = car_number
    
    await send_to_api(
        telegram_user_id=user_id,
        file_id=user_data[user_id]["file_id"],
        extracted_text=user_data[user_id]["text"],
        image_path=None,
        car_brand=car_brand,
        car_number=car_number
    )
    waiting_for_car.pop(user_id, None)
    await message.answer("Автомобиль добавлен!", reply_markup=get_additional_info_keyboard())

async def handle_spouse_input(message: types.Message):
    spouse_name = message.text
    user_id = message.from_user.id
    user_data[user_id]["spouse_name"] = spouse_name
    
    await send_to_api(
        telegram_user_id=user_id,
        file_id=user_data[user_id]["file_id"],
        extracted_text=user_data[user_id]["text"],
        image_path=None,
        is_married=True,
        spouse_full_name=spouse_name
    )
    waiting_for_spouse.pop(user_id, None)
    await message.answer("Семейная информация добавлена!", reply_markup=get_additional_info_keyboard())

async def handle_children_count_input(message: types.Message):
    try:
        children_count = int(message.text)
        user_id = message.from_user.id
        user_data[user_id]["children_count"] = children_count
        
        await send_to_api(
            telegram_user_id=user_id,
            file_id=user_data[user_id]["file_id"],
            extracted_text=user_data[user_id]["text"],
            image_path=None,
            has_children=True,
            children_count=children_count
        )
        waiting_for_children.pop(user_id, None)
        await message.answer("Информация о детях добавлена!", reply_markup=get_additional_info_keyboard())
    except ValueError:
        await message.answer("Пожалуйста, введите число:", reply_markup=ReplyKeyboardRemove())

def adaptive_threshold(image, block_size=15, C=10):
    img = np.array(image)
    mean = np.mean(img)
    img = 255 * (img > mean - C)
    return Image.fromarray(img.astype(np.uint8))

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

async def vsegpt_vision(image_path, ocr_text):
    client = OpenAI(
        api_key=VSEGPT_API_KEY,
        base_url="https://api.vsegpt.ru/v1",
    )
    base64_image = encode_image(image_path)
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": f"Вот текст, который удалось распознать обычным OCR:\n{ocr_text}\nПожалуйста, дополни и исправь его по изображению визитки. Только не нужно писать что именно ты изменил, просто напиши готовый текст."},
                {
                    "type": "image_url",
                    "image_url": f"data:image/jpeg;base64,{base64_image}",
                },
            ],
        }
    ]
    response = client.chat.completions.create(
        model="vis-google/gemini-flash-1.5",
        messages=messages,
        max_tokens=400,
    )
    return response.choices[0].message.content

async def send_to_api(
    telegram_user_id,
    file_id,
    extracted_text,
    image_path=None,
    representative_phone=None,
    email=None,
    city=None,
    birth_date=None,
    car_brand=None,
    car_number=None,
    is_married=False,
    spouse_full_name=None,
    spouse_birth_date=None,
    has_children=False,
    children_count=None,
    children=None
):
    url = API_URL  # адрес вашего API
    image_base64 = None
    if image_path:
        with open(image_path, "rb") as img_file:
            image_base64 = base64.b64encode(img_file.read()).decode("utf-8")
    def to_iso(dt):
        if dt is None:
            return None
        if isinstance(dt, str):
            return dt
        return dt.isoformat()
    children_payload = []
    if children:
        for c in children:
            child = {
                "Name": c.get("Name"),
                "Age": c.get("Age"),
                "BirthDate": to_iso(c.get("BirthDate"))
            }
            children_payload.append(child)
    data = {
        "TelegramUserId": telegram_user_id,
        "FileId": file_id,
        "ExtractedText": extracted_text,
        "RepresentativePhone": representative_phone,
        "Email": email,
        "City": city,
        "BirthDate": to_iso(birth_date),
        "CarBrand": car_brand,
        "CarNumber": car_number,
        "IsMarried": is_married,
        "SpouseFullName": spouse_full_name,
        "SpouseBirthDate": to_iso(spouse_birth_date),
        "HasChildren": has_children,
        "ChildrenCount": children_count,
        "Children": children_payload
    }
    if image_base64 is not None:
        data["ImageBase64"] = image_base64
    print("Вызвана send_to_api")
    print("Данные для отправки:", data)
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json=data) as response:
                print("API status:", response.status)
                response_text = await response.text()
                print("API response:", response_text)
                response.raise_for_status()
                return await response.json()
        except aiohttp.ClientResponseError as e:
            print(f"API error: {e.status} - {e.message}")
            # Можно отправить сообщение пользователю:
            # await message.reply(f"Ошибка API: {e.status} - {e.message}")
            raise

async def patch_to_api(photo_id, patch_data):
    # для докера 8080, локальный 5158.
    url = f"http://localhost:8080/api/ocrphoto/{photo_id}"
    async with aiohttp.ClientSession() as session:
        async with session.patch(url, json=patch_data) as response:
            print("API status:", response.status)
            response_text = await response.text()
            print("API response:", response_text)
            response.raise_for_status()
            return await response.json()

# Обработчик очереди
async def queue_processor():
    while True:
        try:
            message, photo, temp_file = await processing_queue.get()
            await process_photo_async(message, photo, temp_file)
            processing_queue.task_done()
        except Exception as e:
            logging.error(f"Ошибка в обработчике очереди: {e}")

dp.include_router(router)

async def main():
    asyncio.create_task(queue_processor())
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())
