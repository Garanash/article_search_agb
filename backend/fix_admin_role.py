#!/usr/bin/env python3
"""
Исправление роли пользователя admin
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User

def fix_admin_role():
    """Исправляет роль пользователя admin"""
    print("🔧 Исправление роли пользователя admin...")
    
    db = SessionLocal()
    
    try:
        # Находим пользователя admin
        admin = db.query(User).filter(User.username == 'admin').first()
        if admin:
            if admin.role != 'admin':
                admin.role = 'admin'
                db.commit()
                print("✅ Роль пользователя 'admin' исправлена на 'admin'")
            else:
                print("✅ Роль пользователя 'admin' уже правильная")
        else:
            print("❌ Пользователь 'admin' не найден")
            return
        
        # Проверяем всех пользователей
        users = db.query(User).all()
        print(f"\n📊 Всего пользователей в системе: {len(users)}")
        for u in users:
            print(f"👤 {u.username} - {u.role} - {u.email}")
        
    except Exception as e:
        print(f"❌ Ошибка при исправлении роли: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_admin_role()
