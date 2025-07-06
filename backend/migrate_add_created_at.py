#!/usr/bin/env python3
"""
Миграция для добавления поля created_at в таблицу articles
"""

import sqlite3
import datetime
from pathlib import Path

def migrate_articles_table():
    """Добавляет поле created_at в таблицу articles"""
    
    # Путь к базе данных
    db_path = Path(__file__).parent / "app" / "test1234.db"
    
    if not db_path.exists():
        print("База данных не найдена!")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Проверяем, есть ли уже поле created_at
        cursor.execute("PRAGMA table_info(articles)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'created_at' not in columns:
            print("Добавляем поле created_at в таблицу articles...")
            
            # Добавляем поле created_at
            cursor.execute("ALTER TABLE articles ADD COLUMN created_at DATETIME")
            
            # Устанавливаем текущее время для всех существующих записей
            current_time = datetime.datetime.utcnow().isoformat()
            cursor.execute("UPDATE articles SET created_at = ? WHERE created_at IS NULL", (current_time,))
            
            conn.commit()
            print("Поле created_at успешно добавлено!")
        else:
            print("Поле created_at уже существует в таблице articles")
            
    except Exception as e:
        print(f"Ошибка при миграции: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_articles_table() 