#!/usr/bin/env python3
"""
Миграция для добавления таблицы поддержки
"""

import sys
import os
sys.path.append('backend')

from backend.app.database import engine, Base
from backend.app.models import SupportMessage

def add_support_table():
    """Добавляет таблицу поддержки"""
    print("Создание таблицы support_messages...")
    
    try:
        # Создаем таблицу
        SupportMessage.__table__.create(engine, checkfirst=True)
        print("✅ Таблица support_messages успешно создана")
        
    except Exception as e:
        print(f"❌ Ошибка при создании таблицы: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Запуск миграции для добавления таблицы поддержки...")
    
    success = add_support_table()
    
    if success:
        print("✅ Миграция завершена успешно!")
    else:
        print("❌ Миграция завершена с ошибками!")
        sys.exit(1) 