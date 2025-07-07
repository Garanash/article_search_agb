#!/usr/bin/env python3
"""
Скрипт для тестирования чата с авторизацией
"""

import requests
import json
import sys
import os

def test_login():
    """Тестирует вход в систему"""
    print("🔐 Тестирование входа в систему...")
    
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/auth/login",
            data=login_data,
            timeout=10
        )
        
        print(f"   Статус входа: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            if token:
                print("   ✅ Вход успешен")
                print(f"   🔑 Токен получен: {token[:50]}...")
                return token
            else:
                print("   ❌ Токен не найден в ответе")
                return None
        else:
            print(f"   ❌ Ошибка входа: {response.text}")
            return None
            
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return None

def test_chat_with_token(token):
    """Тестирует чат с токеном авторизации"""
    print("\n💬 Тестирование чата с авторизацией...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "anthropic/claude-3-haiku",
        "messages": [
            {"role": "user", "content": "Привет! Это тестовое сообщение."}
        ],
        "temperature": 0.7,
        "max_tokens": 100,
        "extra_headers": {"X-Title": "Test"}
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        
        print(f"   Статус чата: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("   ✅ Чат работает")
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message']['content']
                print(f"   🤖 Ответ: {content[:100]}...")
            return True
        else:
            print(f"   ❌ Ошибка чата: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return False

def test_balance_with_token(token):
    """Тестирует получение баланса с токеном"""
    print("\n💰 Тестирование баланса с авторизацией...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            "http://localhost:8000/api/chat/balance",
            headers=headers,
            timeout=30
        )
        
        print(f"   Статус баланса: {response.status_code}")
        
        if response.status_code == 200:
            balance = response.json()
            print("   ✅ Баланс получен")
            print(f"   💰 Баланс: {balance}")
            return True
        else:
            print(f"   ❌ Ошибка баланса: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return False

def main():
    print("🧪 Диагностика чата с авторизацией")
    print("=" * 50)
    
    # Тестируем вход
    token = test_login()
    if not token:
        print("\n💥 Не удалось войти в систему")
        return
    
    # Тестируем чат
    if not test_chat_with_token(token):
        print("\n💥 Проблема с чатом")
        return
    
    # Тестируем баланс
    test_balance_with_token(token)
    
    print("\n" + "=" * 50)
    print("✅ Все тесты пройдены успешно!")
    print("💡 Если чат в браузере не работает:")
    print("   - Проверьте токен в localStorage")
    print("   - Очистите кэш браузера")
    print("   - Попробуйте войти заново")

if __name__ == "__main__":
    main() 