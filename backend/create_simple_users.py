#!/usr/bin/env python3
"""
Простой скрипт для создания пользователей user и admin
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models import User
from app.auth import get_password_hash

def create_simple_users():
    """Создает пользователей user и admin с простыми паролями"""
    print("🔐 Создание простых пользователей...")
    
    # Создаем таблицы если их нет
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Создаем пользователя user
        user = db.query(User).filter(User.username == 'user').first()
        if not user:
            user = User(
                username='user',
                email='user@example.com',
                hashed_password=get_password_hash('user'),
                role='user',
                first_name='Пользователь',
                last_name='Тестовый',
                department='IT',
                position='Разработчик'
            )
            db.add(user)
            print("✅ Пользователь 'user' создан с паролем 'user'")
        else:
            user.hashed_password = get_password_hash('user')
            print("✅ Пароль пользователя 'user' обновлен на 'user'")
        
        # Создаем пользователя admin
        admin = db.query(User).filter(User.username == 'admin').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@example.com',
                hashed_password=get_password_hash('admin'),
                role='admin',
                first_name='Администратор',
                last_name='Системный',
                department='IT',
                position='Администратор'
            )
            db.add(admin)
            print("✅ Пользователь 'admin' создан с паролем 'admin'")
        else:
            admin.hashed_password = get_password_hash('admin')
            print("✅ Пароль пользователя 'admin' обновлен на 'admin'")
        
        # Сохраняем изменения
        db.commit()
        
        # Проверяем созданных пользователей
        users = db.query(User).all()
        print(f"\n📊 Всего пользователей в системе: {len(users)}")
        for u in users:
            print(f"👤 {u.username} - {u.role} - {u.email}")
        
        print("\n🎉 Пользователи созданы успешно!")
        print("🔑 Логины для входа:")
        print("   user/user")
        print("   admin/admin")
        
    except Exception as e:
        print(f"❌ Ошибка при создании пользователей: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_simple_users()
