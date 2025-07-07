#!/usr/bin/env python3
"""
Скрипт для тестирования входа администратора с новым паролем
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User
from app.auth import authenticate_user, verify_password

def test_admin_login():
    """Тестирует вход администратора с новым паролем"""
    print("🔐 Тестирование входа администратора...")
    
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
        print(f"🔒 Флаг смены пароля: {user.force_password_change}")
        
        # Тестируем новый пароль
        new_password = "admin123"
        print(f"\n🔑 Тестируем пароль: {new_password}")
        
        # Проверяем пароль
        if verify_password(new_password, user.hashed_password):
            print("✅ Пароль 'admin123' работает корректно!")
            
            # Тестируем аутентификацию
            authenticated_user = authenticate_user(db, user.username, new_password)
            if authenticated_user:
                print("✅ Аутентификация прошла успешно!")
                print(f"👤 Аутентифицированный пользователь: {authenticated_user.username}")
                return True
            else:
                print("❌ Ошибка аутентификации")
                return False
        else:
            print("❌ Пароль 'admin123' не работает")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_admin_login()
    if success:
        print("\n🎉 Тест пройден успешно! Администратор может войти с паролем 'admin123'")
    else:
        print("\n💥 Тест не пройден. Проверьте настройки.") 