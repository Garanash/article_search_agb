#!/usr/bin/env python3
import sys, os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))
from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def migrate():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        # Удаляем временную таблицу, если она осталась после сбоя
        conn.execute(text('DROP TABLE IF EXISTS support_events_new'))
        # Проверяем, есть ли уже нужная структура
        result = conn.execute(text("PRAGMA table_info(support_events)")).fetchall()
        columns = {r[1]: r for r in result}
        if columns['ticket_id'][3] == 0:
            print("✅ ticket_id уже nullable")
            return
        print("Создаю новую таблицу support_events_new с ticket_id nullable...")
        conn.execute(text('''
            CREATE TABLE support_events_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id INTEGER,
                event_type VARCHAR NOT NULL,
                title VARCHAR NOT NULL,
                description TEXT,
                event_date DATETIME NOT NULL,
                start_date DATETIME,
                end_date DATETIME,
                is_completed BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES support_tickets (id)
            )
        '''))
        print("Копирую данные...")
        conn.execute(text('''
            INSERT INTO support_events_new (id, ticket_id, event_type, title, description, event_date, start_date, end_date, is_completed, created_at)
            SELECT id, ticket_id, event_type, title, description, event_date, start_date, end_date, is_completed, created_at FROM support_events
        '''))
        print("Удаляю старую таблицу...")
        conn.execute(text('DROP TABLE support_events'))
        print("Переименовываю support_events_new -> support_events...")
        conn.execute(text('ALTER TABLE support_events_new RENAME TO support_events'))
        print("✅ Миграция завершена успешно!")

if __name__ == '__main__':
    migrate() 