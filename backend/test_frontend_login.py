#!/usr/bin/env python3
"""
Тест входа, имитирующий запрос от фронтенда
"""
import requests
import json

def test_frontend_login():
    """Тестирует вход, имитируя запрос от фронтенда"""
    
    print("=" * 60)
    print("ТЕСТ ВХОДА ЧЕРЕЗ ФРОНТЕНД")
    print("=" * 60)
    
    # URL для входа
    login_url = "http://localhost:8000/token"
    
    # Данные для входа (как отправляет фронтенд)
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    # Заголовки (как отправляет фронтенд)
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    try:
        print("1. Отправляем запрос на вход...")
        print(f"   URL: {login_url}")
        print(f"   Данные: {login_data}")
        print(f"   Заголовки: {headers}")
        print()
        
        # Отправляем запрос
        response = requests.post(login_url, data=login_data, headers=headers)
        
        print(f"2. Статус ответа: {response.status_code}")
        print(f"   Заголовки ответа: {dict(response.headers)}")
        print()
        
        if response.status_code == 200:
            print("3. УСПЕШНЫЙ ВХОД!")
            response_data = response.json()
            print(f"   Токен: {response_data.get('access_token', 'Нет токена')[:50]}...")
            print(f"   Тип токена: {response_data.get('token_type', 'Нет типа')}")
            print(f"   Принудительная смена пароля: {response_data.get('force_password_change', 'Нет флага')}")
        else:
            print("3. ОШИБКА ВХОДА!")
            print(f"   Текст ответа: {response.text}")
            
            # Попробуем с неправильным паролем
            print("\n4. Тест с неправильным паролем...")
            wrong_data = {"username": "admin", "password": "wrongpassword"}
            wrong_response = requests.post(login_url, data=wrong_data, headers=headers)
            print(f"   Статус: {wrong_response.status_code}")
            print(f"   Ответ: {wrong_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("ОШИБКА: Не удается подключиться к серверу!")
        print("Убедитесь, что бэкенд запущен на http://localhost:8000")
    except Exception as e:
        print(f"ОШИБКА: {e}")

if __name__ == "__main__":
    test_frontend_login() 