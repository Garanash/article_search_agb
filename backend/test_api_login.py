#!/usr/bin/env python3
"""
Скрипт для тестирования API входа через HTTP запрос
"""

import requests
import json

def test_api_login():
    """Тестирует API входа через HTTP запрос"""
    print("🔍 Тестирование API входа...")
    
    # URL для входа
    login_url = "http://localhost:8000/api/auth/login"
    
    # Данные для входа (используем пароль из предыдущего теста)
    login_data = {
        "username": "admin",
        "password": "XOv9JBFCH!oT"  # Пароль из предыдущего теста
    }
    
    try:
        print(f"📡 Отправляем запрос на: {login_url}")
        print(f"👤 Логин: {login_data['username']}")
        print(f"🔑 Пароль: {login_data['password']}")
        
        # Отправляем POST запрос
        response = requests.post(
            login_url,
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"\n📊 Статус ответа: {response.status_code}")
        print(f"📋 Заголовки ответа: {dict(response.headers)}")
        
        if response.status_code == 200:
            # Успешный вход
            data = response.json()
            print(f"✅ Вход успешен!")
            print(f"🔑 Токен: {data.get('access_token', '')[:50]}...")
            print(f"📝 Тип токена: {data.get('token_type', '')}")
            print(f"🔄 Force password change: {data.get('force_password_change', '')}")
            
            # Тестируем получение профиля с токеном
            print(f"\n👤 Тестируем получение профиля...")
            profile_url = "http://localhost:8000/api/users/profile"
            headers = {"Authorization": f"Bearer {data['access_token']}"}
            
            profile_response = requests.get(profile_url, headers=headers)
            print(f"📊 Статус профиля: {profile_response.status_code}")
            
            if profile_response.status_code == 200:
                profile_data = profile_response.json()
                print(f"✅ Профиль получен!")
                print(f"👤 Пользователь: {profile_data.get('username', '')}")
                print(f"📧 Email: {profile_data.get('email', '')}")
                print(f"🔒 Force password change: {profile_data.get('force_password_change', '')}")
            else:
                print(f"❌ Ошибка получения профиля: {profile_response.text}")
                
        else:
            # Ошибка входа
            print(f"❌ Ошибка входа: {response.status_code}")
            print(f"📝 Текст ответа: {response.text}")
            
            # Попробуем старый эндпоинт
            print(f"\n🔄 Пробуем старый эндпоинт /token...")
            old_login_url = "http://localhost:8000/token"
            old_response = requests.post(
                old_login_url,
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            print(f"📊 Статус старого эндпоинта: {old_response.status_code}")
            if old_response.status_code == 200:
                print(f"✅ Старый эндпоинт работает!")
                old_data = old_response.json()
                print(f"🔑 Токен: {old_data.get('access_token', '')[:50]}...")
            else:
                print(f"❌ Старый эндпоинт тоже не работает: {old_response.text}")
        
        return response.status_code == 200
        
    except requests.exceptions.ConnectionError:
        print("❌ Не удалось подключиться к серверу. Убедитесь, что бэкенд запущен на порту 8000.")
        return False
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {e}")
        return False

if __name__ == "__main__":
    success = test_api_login()
    if success:
        print("\n🎉 API тест завершен успешно!")
    else:
        print("\n❌ API тест выявил проблемы!")
        import sys
        sys.exit(1) 