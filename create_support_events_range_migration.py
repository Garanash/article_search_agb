#!/usr/bin/env python3
"""
Миграция для добавления start_date и end_date в support_events
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))
from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def add_event_range_fields():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    try:
        print("🚀 Запуск миграции для добавления start_date и end_date...")
        with engine.connect() as conn:
            # Проверяем наличие столбца start_date
            result = conn.execute(text("PRAGMA table_info(support_events)")).fetchall()
            columns = [r[1] for r in result]
            if 'start_date' not in columns:
                print("Добавление поля start_date...")
                conn.execute(text("ALTER TABLE support_events ADD COLUMN start_date DATETIME"))
                print("✅ Поле start_date добавлено")
            else:
                print("Поле start_date уже существует")
            if 'end_date' not in columns:
                print("Добавление поля end_date...")
                conn.execute(text("ALTER TABLE support_events ADD COLUMN end_date DATETIME"))
                print("✅ Поле end_date добавлено")
            else:
                print("Поле end_date уже существует")
        print("✅ Миграция завершена успешно!")
    except Exception as e:
        print(f"❌ Ошибка при миграции: {e}")
        return False
    return True

if __name__ == "__main__":
    add_event_range_fields() 