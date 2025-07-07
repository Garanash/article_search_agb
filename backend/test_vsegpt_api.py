#!/usr/bin/env python3
"""
Скрипт для тестирования VseGPT API и диагностики проблем
"""

import requests
import json
import sys

# VseGPT API конфигурация
VSEGPT_API_KEY = "sk-or-vv-0222bdfad78b2ee03399f91527fbd52b36793f8db856f1a7634f423ff6ec6b16"
VSEGPT_BASE_URL = "https://api.vsegpt.ru/v1"

def test_vsegpt_connection():
    """Тестирует подключение к VseGPT API"""
    print("🔗 Тестирование подключения к VseGPT API...")
    
    try:
        # Тест 1: Проверка доступности API
        print("\n1️⃣ Тест доступности API...")
        response = requests.get(f"{VSEGPT_BASE_URL}/models", timeout=10)
        print(f"   Статус: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ API доступен")
        else:
            print(f"   ❌ API недоступен: {response.text}")
            return False
    except requests.exceptions.Timeout:
        print("   ❌ Таймаут подключения к API")
        return False
    except requests.exceptions.ConnectionError:
        print("   ❌ Ошибка подключения к API")
        return False
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return False
    
    return True

def test_api_key():
    """Тестирует API ключ"""
    print("\n2️⃣ Тест API ключа...")
    
    headers = {
        "Authorization": f"Bearer {VSEGPT_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        # Тест получения моделей
        response = requests.get(
            f"{VSEGPT_BASE_URL}/models",
            headers=headers,
            timeout=30
        )
        
        print(f"   Статус: {response.status_code}")
        
        if response.status_code == 200:
            models = response.json()
            print(f"   ✅ API ключ работает")
            print(f"   📋 Доступно моделей: {len(models.get('data', []))}")
            return True
        elif response.status_code == 401:
            print("   ❌ Неверный API ключ")
            return False
        else:
            print(f"   ❌ Ошибка API: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return False

def test_balance():
    """Тестирует получение баланса"""
    print("\n3️⃣ Тест баланса...")
    
    headers = {
        "Authorization": f"Bearer {VSEGPT_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{VSEGPT_BASE_URL}/balance",
            headers=headers,
            timeout=30
        )
        
        print(f"   Статус: {response.status_code}")
        
        if response.status_code == 200:
            balance = response.json()
            print(f"   ✅ Баланс получен")
            print(f"   💰 Баланс: {balance}")
            return True
        else:
            print(f"   ❌ Ошибка получения баланса: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return False

def test_chat_completion():
    """Тестирует отправку сообщения в чат"""
    print("\n4️⃣ Тест отправки сообщения...")
    
    headers = {
        "Authorization": f"Bearer {VSEGPT_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "anthropic/claude-3-haiku",
        "messages": [
            {"role": "user", "content": "Привет! Это тестовое сообщение."}
        ],
        "temperature": 0.7,
        "max_tokens": 100
    }
    
    try:
        response = requests.post(
            f"{VSEGPT_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        
        print(f"   Статус: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Сообщение отправлено успешно")
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message']['content']
                print(f"   🤖 Ответ: {content[:100]}...")
            return True
        else:
            print(f"   ❌ Ошибка отправки: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return False

def test_local_api():
    """Тестирует локальный API"""
    print("\n5️⃣ Тест локального API...")
    
    try:
        # Тест получения моделей через локальный API
        response = requests.get("http://localhost:8000/api/chat/models", timeout=10)
        print(f"   Статус: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ Локальный API работает")
            return True
        elif response.status_code == 401:
            print("   ⚠️ Требуется авторизация")
            return True  # Это нормально
        else:
            print(f"   ❌ Ошибка локального API: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Локальный сервер не запущен")
        return False
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return False

def main():
    print("🧪 Диагностика VseGPT API")
    print("=" * 50)
    
    # Тестируем подключение
    if not test_vsegpt_connection():
        print("\n💥 Проблема с подключением к VseGPT API")
        return
    
    # Тестируем API ключ
    if not test_api_key():
        print("\n💥 Проблема с API ключом")
        return
    
    # Тестируем баланс
    if not test_balance():
        print("\n💥 Проблема с получением баланса")
        return
    
    # Тестируем отправку сообщения
    if not test_chat_completion():
        print("\n💥 Проблема с отправкой сообщений")
        return
    
    # Тестируем локальный API
    test_local_api()
    
    print("\n" + "=" * 50)
    print("✅ Все тесты пройдены успешно!")
    print("💡 Если чат все еще не работает, проверьте:")
    print("   - Запущен ли backend сервер")
    print("   - Правильно ли настроена авторизация")
    print("   - Есть ли токен в localStorage")

if __name__ == "__main__":
    main() 