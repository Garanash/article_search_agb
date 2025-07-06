import sqlite3
import os

# Путь к базе данных (проверьте, что путь совпадает с вашим)
db_path = os.path.join(os.path.dirname(__file__), 'app', 'test1234.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT")
    print("Поле avatar_url успешно добавлено!")
except Exception as e:
    print("Ошибка или поле уже существует:", e)

conn.commit()
conn.close() 