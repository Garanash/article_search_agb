#!/usr/bin/env python3
"""
Скрипт для тестирования сброса пароля и входа в систему
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User
from app.auth import authenticate_user, create_access_token, generate_random_password, get_password_hash, verify_password
import datetime

def test_reset_password_and_login():
    """Тестирует сброс пароля и вход в систему"""
    print("Тестирование сброса пароля и входа в систему...")
    
    db = SessionLocal()
    
    try:
        # Находим пользователя для тестирования (например, admin)
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            print("Пользователь 'admin' не найден")
            return False
        
        print(f"\nПользователь: {user.username}")
        print(f"Email: {user.email}")
        print(f"Текущий флаг force_password_change: {user.force_password_change}")
        
        # Генерируем новый пароль
        new_password = generate_random_password()
        print(f"\nСгенерированный новый пароль: {new_password}")
        
        # Хешируем новый пароль
        hashed_password = get_password_hash(new_password)
        
        # Обновляем пароль пользователя
        user.hashed_password = hashed_password
        user.force_password_change = True  # Принудительная смена пароля
        user.updated_at = datetime.datetime.utcnow()
        
        db.commit()
        db.refresh(user)
        
        print(f"Пароль обновлен в базе данных")
        print(f"Новый флаг force_password_change: {user.force_password_change}")
        
        # Тестируем аутентификацию с новым паролем
        print(f"\nТестируем аутентификацию с новым паролем...")
        
        # Проверяем хеш пароля
        is_valid_hash = verify_password(new_password, user.hashed_password)
        print(f"Проверка хеша пароля: {is_valid_hash}")
        
        if not is_valid_hash:
            print("✗ Хеш пароля не проходит проверку!")
            return False
        
        # Тестируем полную аутентификацию
        authenticated_user = authenticate_user(db, user.username, new_password)
        if authenticated_user:
            print("✓ Аутентификация с новым паролем прошла успешно")
            
            # Тестируем создание токена
            access_token_expires = datetime.timedelta(minutes=60)
            access_token = create_access_token(
                data={"sub": user.username}, 
                expires_delta=access_token_expires
            )
            print(f"✓ Токен создан: {access_token[:50]}...")
            
            # Проверяем флаг force_password_change
            if authenticated_user.force_password_change:
                print("✓ Флаг force_password_change установлен правильно")
            else:
                print("✗ Флаг force_password_change не установлен")
                
        else:
            print("✗ Аутентификация с новым паролем не прошла")
            return False
            
        # Тестируем с неправильным паролем
        print(f"\nТестируем аутентификацию с неправильным паролем...")
        wrong_auth = authenticate_user(db, user.username, "wrongpassword")
        if not wrong_auth:
            print("✓ Аутентификация с неправильным паролем правильно отклонена")
        else:
            print("✗ Аутентификация с неправильным паролем прошла (это ошибка!)")
            return False
            
        print("\n✅ Все тесты прошли успешно!")
        return True
        
    except Exception as e:
        print(f"✗ Ошибка при тестировании: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_reset_password_and_login()
    if success:
        print("\n🎉 Тестирование завершено успешно!")
    else:
        print("\n❌ Тестирование завершено с ошибками!")
        sys.exit(1) 