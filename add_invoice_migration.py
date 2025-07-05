#!/usr/bin/env python3
"""
Миграция для добавления поля invoice_number в таблицу requests
"""

DB_PATH = "backend/app/test1234.db"
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

try:
    # Переименовать таблицу invoices в requests, если она есть
    cur.execute("ALTER TABLE invoices RENAME TO requests")
    # Переименовать поле invoice_id в request_id в таблице articles, если оно есть
    cur.execute("PRAGMA foreign_keys=off;")
    cur.execute("CREATE TABLE IF NOT EXISTS articles_new AS SELECT *, invoice_id as request_id FROM articles;")
    cur.execute("DROP TABLE articles;")
    cur.execute("CREATE TABLE articles (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, user_id INTEGER, request_id INTEGER REFERENCES requests(id));")
    cur.execute("INSERT INTO articles (id, code, user_id, request_id) SELECT id, code, user_id, request_id FROM articles_new;")
    cur.execute("DROP TABLE articles_new;")
    cur.execute("PRAGMA foreign_keys=on;")
    print("Миграция для запросов успешно применена!")
except Exception as e:
    print("Ошибка:", e)

conn.commit()
conn.close() 