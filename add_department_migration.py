#!/usr/bin/env python3
"""
Миграция для добавления поля department в таблицу support_messages
"""

import sys
import os
sys.path.append('backend')

from backend.app.database import engine
from sqlalchemy import text

def add_department_column():
    """Добавляет поле department в таблицу support_messages"""
    print("Добавление поля department в таблицу support_messages...")
    
    try:
        with engine.connect() as conn:
            # Проверяем, существует ли уже поле department
            result = conn.execute(text("PRAGMA table_info(support_messages)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'department' not in columns:
                # Добавляем поле department
                conn.execute(text("ALTER TABLE support_messages ADD COLUMN department TEXT"))
                conn.commit()
                print("✅ Поле department успешно добавлено")
            else:
                print("ℹ️ Поле department уже существует")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при добавлении поля department: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Запуск миграции для добавления поля department...")
    
    success = add_department_column()
    
    if success:
        print("✅ Миграция завершена успешно!")
    else:
        print("❌ Миграция завершена с ошибками!")
        sys.exit(1) 