#!/usr/bin/env python3
"""
Скрипт для добавления поля email_validated в таблицу suppliers
"""

DB_PATH = "backend/app/test1234.db"

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
try:
    cur.execute("ALTER TABLE suppliers ADD COLUMN email_validated BOOLEAN DEFAULT 0;")
    print("Поле email_validated успешно добавлено!")
except Exception as e:
    print("Ошибка:", e)
conn.commit()
conn.close() 