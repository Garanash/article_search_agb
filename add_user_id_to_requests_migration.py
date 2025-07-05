#!/usr/bin/env python3
import sys, os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))
from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def migrate():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA table_info(requests)")).fetchall()
        columns = [r[1] for r in result]
        if 'user_id' not in columns:
            print("Добавляю user_id в requests...")
            conn.execute(text("ALTER TABLE requests ADD COLUMN user_id INTEGER"))
            print("✅ user_id добавлен")
        else:
            print("user_id уже есть")
    print("Миграция завершена")

if __name__ == '__main__':
    migrate() 