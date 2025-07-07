#!/usr/bin/env python3
"""
Скрипт для тестирования входа с новым паролем после сброса
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User
from app.auth import authenticate_user, create_access_token, generate_random_password, get_password_hash, verify_password
import datetime

def test_login_with_new_password():
    """Тестирует вход с новым паролем после сброса"""
    print("Тестирование входа с новым паролем после сброса...")
    
    db = SessionLocal()
    
    try:
        # Находим пользователя для тестирования
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            print("Пользователь 'admin' не найден")
            return False
        
        print(f"\nПользователь: {user.username}")
        print(f"Email: {user.email}")
        print(f"Текущий флаг force_password_change: {user.force_password_change}")
        
        # Генерируем новый пароль (как это делает администратор)
        new_password = generate_random_password()
        print(f"\nСгенерированный новый пароль: {new_password}")
        
        # Хешируем новый пароль
        hashed_password = get_password_hash(new_password)
        
        # Обновляем пароль пользователя (как это делает администратор)
        user.hashed_password = hashed_password
        user.force_password_change = True  # Принудительная смена пароля
        user.updated_at = datetime.datetime.now(datetime.UTC)
        
        db.commit()
        db.refresh(user)
        
        print(f"Пароль обновлен в базе данных")
        print(f"Новый флаг force_password_change: {user.force_password_change}")
        
        # Симулируем вход пользователя с новым паролем
        print(f"\nСимулируем вход пользователя с новым паролем...")
        
        # Проверяем аутентификацию (как это делает /token endpoint)
        authenticated_user = authenticate_user(db, user.username, new_password)
        if authenticated_user:
            print("✓ Аутентификация прошла успешно")
            
            # Создаем токен доступа (как это делает /token endpoint)
            access_token_expires = datetime.timedelta(minutes=60)
            access_token = create_access_token(
                data={"sub": user.username}, 
                expires_delta=access_token_expires
            )
            print(f"✓ Токен создан: {access_token[:50]}...")
            
            # Проверяем, что флаг force_password_change установлен
            if authenticated_user.force_password_change:
                print("✓ Флаг force_password_change установлен - пользователь должен сменить пароль")
            else:
                print("✗ Флаг force_password_change не установлен")
                
            # Симулируем ответ API для входа
            login_response = {
                "access_token": access_token,
                "token_type": "bearer",
                "force_password_change": authenticated_user.force_password_change
            }
            print(f"✓ Ответ API для входа: {login_response}")
            
        else:
            print("✗ Аутентификация не прошла")
            return False
            
        print("\n✅ Тест входа с новым паролем прошел успешно!")
        print(f"💡 Пользователь может войти с паролем: {new_password}")
        print(f"💡 После входа пользователь должен сменить пароль")
        
        return True
        
    except Exception as e:
        print(f"✗ Ошибка при тестировании: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_login_with_new_password()
    if success:
        print("\n🎉 Тестирование завершено успешно!")
    else:
        print("\n❌ Тестирование завершено с ошибками!")
        sys.exit(1) 