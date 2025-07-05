#!/usr/bin/env python3
"""
Скрипт для тестирования входа в систему
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User
from app.auth import authenticate_user, create_access_token
import datetime

def test_login():
    """Тестирует вход в систему"""
    print("Тестирование входа в систему...")
    
    db = SessionLocal()
    
    try:
        # Получаем всех пользователей
        users = db.query(User).all()
        print(f"Найдено пользователей: {len(users)}")
        
        for user in users:
            print(f"\nПользователь: {user.username}")
            print(f"Email: {user.email}")
            print(f"Роль: {user.role}")
            print(f"Департамент: {user.department}")
            print(f"Должность: {user.position}")
            print(f"Компания: {user.company}")
            print(f"Требуется смена пароля: {user.force_password_change}")
            
            # Тестируем аутентификацию с правильным паролем
            # Для демонстрации используем простой пароль
            test_password = "password123"
            
            # Проверяем, совпадает ли хеш пароля
            from app.auth import verify_password
            if verify_password(test_password, user.hashed_password):
                print("✓ Пароль 'password123' подходит")
                
                # Тестируем создание токена
                access_token_expires = datetime.timedelta(minutes=60)
                access_token = create_access_token(
                    data={"sub": user.username}, 
                    expires_delta=access_token_expires
                )
                print(f"✓ Токен создан: {access_token[:50]}...")
                
                # Тестируем полную аутентификацию
                authenticated_user = authenticate_user(db, user.username, test_password)
                if authenticated_user:
                    print("✓ Аутентификация прошла успешно")
                else:
                    print("✗ Аутентификация не прошла")
            else:
                print("✗ Пароль 'password123' не подходит")
                
    except Exception as e:
        print(f"✗ Ошибка при тестировании: {e}")
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    test_login() 