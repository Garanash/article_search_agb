#!/usr/bin/env python3
"""
Скрипт для исправления пароля администратора
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash, verify_password
import datetime

def fix_admin_password(new_password="admin123"):
    """Исправляет пароль администратора"""
    print(f"🔧 Исправление пароля администратора на '{new_password}'...")
    
    db = SessionLocal()
    
    try:
        # Находим пользователя admin
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            print("❌ Пользователь 'admin' не найден")
            return False
        
        print(f"✅ Пользователь найден: {user.username}")
        print(f"📧 Email: {user.email}")
        print(f"👤 Роль: {user.role}")
        
        # Хешируем новый пароль
        print("🔐 Хеширование нового пароля...")
        hashed_password = get_password_hash(new_password)
        
        # Обновляем пароль
        user.hashed_password = hashed_password
        user.force_password_change = False  # Не требуем смену пароля
        user.updated_at = datetime.datetime.utcnow()
        
        db.commit()
        db.refresh(user)
        
        print("✅ Пароль обновлен в базе данных")
        
        # Проверяем, что пароль работает
        print("🔍 Проверка нового пароля...")
        if verify_password(new_password, user.hashed_password):
            print("✅ Пароль работает корректно!")
            return True
        else:
            print("❌ Пароль не работает после обновления")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при обновлении пароля: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def test_login_after_fix():
    """Тестирует вход после исправления"""
    print("\n🧪 Тестирование входа после исправления...")
    
    import requests
    
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
                print("   ✅ Вход успешен!")
                print(f"   🔑 Токен получен: {token[:50]}...")
                return True
            else:
                print("   ❌ Токен не найден в ответе")
                return False
        else:
            print(f"   ❌ Ошибка входа: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Исправление пароля администратора")
    print("=" * 50)
    
    # Исправляем пароль
    if fix_admin_password():
        print("\n✅ Пароль исправлен успешно!")
        
        # Тестируем вход
        if test_login_after_fix():
            print("\n🎉 Все исправлено! Администратор может войти с паролем 'admin123'")
        else:
            print("\n⚠️ Пароль исправлен, но вход не работает. Проверьте сервер.")
    else:
        print("\n💥 Не удалось исправить пароль") 