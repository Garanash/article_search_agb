#!/usr/bin/env python3
"""
Тест аутентификации, использующий тот же код, что и в приложении
"""
import sys
import os

# Добавляем путь к модулям приложения
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.auth import authenticate_user, get_user
from app.models import User

def test_authentication():
    """Тестирует аутентификацию пользователя"""
    
    print("=" * 60)
    print("ТЕСТ АУТЕНТИФИКАЦИИ")
    print("=" * 60)
    
    # Создаем сессию базы данных
    db = SessionLocal()
    
    try:
        # 1. Проверяем, что пользователь существует
        user = get_user(db, "admin")
        if user:
            print(f"1. Пользователь 'admin' найден:")
            print(f"   ID: {user.id}")
            print(f"   Username: {user.username}")
            print(f"   Role: {user.role}")
            print(f"   Hash: {user.hashed_password[:50]}...")
            print()
        else:
            print("1. Пользователь 'admin' НЕ найден!")
            return
        
        # 2. Тестируем аутентификацию с правильным паролем
        auth_result = authenticate_user(db, "admin", "admin123")
        if auth_result:
            print("2. Аутентификация с паролем 'admin123': УСПЕШНО")
            print(f"   Пользователь: {auth_result.username}")
            print(f"   Роль: {auth_result.role}")
        else:
            print("2. Аутентификация с паролем 'admin123': НЕУДАЧА")
        print()
        
        # 3. Тестируем аутентификацию с неправильным паролем
        auth_result_wrong = authenticate_user(db, "admin", "wrongpassword")
        if auth_result_wrong:
            print("3. Аутентификация с неправильным паролем: УСПЕШНО (ЭТО ПЛОХО!)")
        else:
            print("3. Аутентификация с неправильным паролем: НЕУДАЧА (ЭТО ХОРОШО)")
        print()
        
        # 4. Тестируем с несуществующим пользователем
        auth_result_fake = authenticate_user(db, "fakeuser", "admin123")
        if auth_result_fake:
            print("4. Аутентификация несуществующего пользователя: УСПЕШНО (ЭТО ПЛОХО!)")
        else:
            print("4. Аутентификация несуществующего пользователя: НЕУДАЧА (ЭТО ХОРОШО)")
        print()
        
        # 5. Проверяем все пользователи в базе
        all_users = db.query(User).all()
        print(f"5. Всего пользователей в базе: {len(all_users)}")
        for u in all_users:
            print(f"   - {u.username} (ID: {u.id}, роль: {u.role})")
        
    except Exception as e:
        print(f"Ошибка при тестировании: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_authentication() 