import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models import User

# Создаем таблицы с новыми полями
Base.metadata.create_all(bind=engine)

print("Таблица пользователей обновлена успешно!")

import sqlite3

conn = sqlite3.connect('app/test1234.db')
cursor = conn.cursor()

# Добавляем новые поля, если их нет
try:
    cursor.execute("ALTER TABLE users ADD COLUMN first_name TEXT")
except Exception as e:
    print('first_name:', e)
try:
    cursor.execute("ALTER TABLE users ADD COLUMN last_name TEXT")
except Exception as e:
    print('last_name:', e)
try:
    cursor.execute("ALTER TABLE users ADD COLUMN patronymic TEXT")
except Exception as e:
    print('patronymic:', e)

conn.commit()
conn.close()
print('Миграция users: поля first_name, last_name, patronymic добавлены (или уже существуют)') 