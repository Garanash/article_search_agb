#!/usr/bin/env python3
"""
Скрипт для диагностики проблемы с входом после генерации пароля
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User
from app.auth import authenticate_user, generate_random_password, get_password_hash, verify_password
import datetime

def test_login_issue():
    """Диагностирует проблему с входом после генерации пароля"""
    print("🔍 Диагностика проблемы с входом после генерации пароля...")
    
    db = SessionLocal()
    
    try:
        # Находим пользователя для тестирования
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            print("❌ Пользователь 'admin' не найден")
            return False
        
        print(f"\n👤 Пользователь: {user.username}")
        print(f"📧 Email: {user.email}")
        print(f"🔒 Текущий флаг force_password_change: {user.force_password_change}")
        print(f"📅 Дата обновления: {user.updated_at}")
        
        # Генерируем новый пароль (как это делает администратор)
        new_password = generate_random_password()
        print(f"\n🔑 Сгенерированный новый пароль: {new_password}")
        
        # Хешируем новый пароль
        hashed_password = get_password_hash(new_password)
        print(f"🔐 Хеш пароля: {hashed_password[:50]}...")
        
        # Обновляем пароль пользователя (как это делает администратор)
        user.hashed_password = hashed_password
        user.force_password_change = True  # Принудительная смена пароля
        user.updated_at = datetime.datetime.now(datetime.UTC)
        
        db.commit()
        db.refresh(user)
        
        print(f"✅ Пароль обновлен в базе данных")
        print(f"🔄 Новый флаг force_password_change: {user.force_password_change}")
        
        # Тестируем проверку пароля
        print(f"\n🧪 Тестируем проверку пароля...")
        
        # Проверяем хеш пароля
        is_valid_hash = verify_password(new_password, user.hashed_password)
        print(f"🔍 Проверка хеша пароля: {'✅ Успешно' if is_valid_hash else '❌ Ошибка'}")
        
        if not is_valid_hash:
            print("❌ Хеш пароля не проходит проверку!")
            return False
        
        # Тестируем полную аутентификацию
        print(f"\n🔐 Тестируем полную аутентификацию...")
        authenticated_user = authenticate_user(db, user.username, new_password)
        
        if authenticated_user:
            print("✅ Аутентификация прошла успешно")
            print(f"👤 Аутентифицированный пользователь: {authenticated_user.username}")
            print(f"📧 Email: {authenticated_user.email}")
            print(f"🔒 force_password_change: {authenticated_user.force_password_change}")
            
            # Проверяем, что это тот же пользователь
            if authenticated_user.id == user.id:
                print("✅ ID пользователя совпадает")
            else:
                print("❌ ID пользователя не совпадает!")
                return False
                
        else:
            print("❌ Аутентификация не прошла")
            return False
            
        # Тестируем с неправильным паролем
        print(f"\n🚫 Тестируем аутентификацию с неправильным паролем...")
        wrong_auth = authenticate_user(db, user.username, "wrongpassword")
        if not wrong_auth:
            print("✅ Аутентификация с неправильным паролем правильно отклонена")
        else:
            print("❌ Аутентификация с неправильным паролем прошла (это ошибка!)")
            return False
            
        print("\n🎉 Все тесты прошли успешно!")
        print(f"💡 Пользователь может войти с паролем: {new_password}")
        print(f"💡 После входа пользователь должен сменить пароль")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_login_issue()
    if success:
        print("\n🎉 Диагностика завершена успешно!")
    else:
        print("\n❌ Диагностика выявила проблемы!")
        sys.exit(1) 