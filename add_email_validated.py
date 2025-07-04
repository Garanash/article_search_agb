import sqlite3

# Путь к вашей базе данных
DB_PATH = "backend/test1234.db"

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
try:
    cur.execute("ALTER TABLE suppliers ADD COLUMN email_validated BOOLEAN DEFAULT 0;")
    print("Поле email_validated успешно добавлено!")
except Exception as e:
    print("Ошибка:", e)
conn.commit()
conn.close() 