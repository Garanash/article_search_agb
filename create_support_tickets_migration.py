#!/usr/bin/env python3
"""
Миграция для создания таблиц поддержки обращений
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from sqlalchemy import create_engine, text, MetaData, Table, Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from app.database import SQLALCHEMY_DATABASE_URL

def create_support_tables():
    """Создает таблицы для системы поддержки обращений"""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    try:
        print("🚀 Запуск миграции для создания таблиц поддержки обращений...")
        
        # Проверяем существование таблицы support_tickets
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='support_tickets'
            """))
            if result.fetchone():
                print("✅ Таблица support_tickets уже существует")
            else:
                print("Создание таблицы support_tickets...")
                conn.execute(text("""
                    CREATE TABLE support_tickets (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        title VARCHAR NOT NULL,
                        description TEXT NOT NULL,
                        department VARCHAR,
                        status VARCHAR DEFAULT 'open',
                        priority VARCHAR DEFAULT 'medium',
                        assigned_to INTEGER,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        resolved_at DATETIME,
                        closed_at DATETIME,
                        first_response_at DATETIME,
                        estimated_resolution DATETIME,
                        FOREIGN KEY (user_id) REFERENCES users (id),
                        FOREIGN KEY (assigned_to) REFERENCES users (id)
                    )
                """))
                print("✅ Таблица support_tickets создана")
        
        # Проверяем существование таблицы support_events
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='support_events'
            """))
            if result.fetchone():
                print("✅ Таблица support_events уже существует")
            else:
                print("Создание таблицы support_events...")
                conn.execute(text("""
                    CREATE TABLE support_events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        ticket_id INTEGER NOT NULL,
                        event_type VARCHAR NOT NULL,
                        title VARCHAR NOT NULL,
                        description TEXT,
                        event_date DATETIME NOT NULL,
                        is_completed BOOLEAN DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (ticket_id) REFERENCES support_tickets (id)
                    )
                """))
                print("✅ Таблица support_events создана")
        
        print("✅ Миграция завершена успешно!")
        
    except Exception as e:
        print(f"❌ Ошибка при создании таблиц: {e}")
        return False
    
    return True

if __name__ == "__main__":
    create_support_tables() 