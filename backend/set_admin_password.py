#!/usr/bin/env python3
import os
import sqlite3
from passlib.hash import bcrypt

def set_admin_password(new_password):
    db_path = "app/test1234.db"
    if not os.path.exists(db_path):
        print(f"База данных не найдена: {db_path}")
        return

    # Хешируем новый пароль
    hashed = bcrypt.hash(new_password)

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET hashed_password = ? WHERE username = ?", (hashed, "admin"))
        conn.commit()
        print("Пароль для пользователя 'admin' успешно обновлён!")
        conn.close()
    except Exception as e:
        print(f"Ошибка при обновлении пароля: {e}")

if __name__ == "__main__":
    set_admin_password("admin123") 