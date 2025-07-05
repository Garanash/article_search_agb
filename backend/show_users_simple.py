#!/usr/bin/env python3
"""
Простой скрипт для вывода пользователей из базы данных
"""
import sqlite3
import os

def show_users():
    """Выводит всех пользователей из SQLite базы данных"""
    
    # Путь к базе данных
    db_path = "app/test1234.db"
    
    if not os.path.exists(db_path):
        print(f"База данных не найдена: {db_path}")
        return
    
    try:
        # Подключаемся к базе данных
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Получаем всех пользователей
        cursor.execute("SELECT id, username, email, role, department, position, company, hashed_password, force_password_change, created_at FROM users")
        users = cursor.fetchall()
        
        print("=" * 80)
        print("ПОЛЬЗОВАТЕЛИ В БАЗЕ ДАННЫХ")
        print("=" * 80)
        
        if not users:
            print("В базе данных нет пользователей.")
            return
        
        for i, user in enumerate(users, 1):
            user_id, username, email, role, department, position, company, hashed_password, force_password_change, created_at = user
            
            print(f"\n{i}. ПОЛЬЗОВАТЕЛЬ:")
            print(f"   ID: {user_id}")
            print(f"   Логин: {username}")
            print(f"   Email: {email or 'Не указан'}")
            print(f"   Роль: {role}")
            print(f"   Департамент: {department or 'Не указан'}")
            print(f"   Должность: {position or 'Не указан'}")
            print(f"   Компания: {company or 'Не указана'}")
            print(f"   Хеш пароля: {hashed_password}")
            print(f"   Принудительная смена пароля: {force_password_change}")
            print(f"   Дата создания: {created_at}")
            print("-" * 50)
        
        print(f"\nВсего пользователей: {len(users)}")
        
        # Закрываем соединение
        conn.close()
        
    except Exception as e:
        print(f"Ошибка при получении пользователей: {e}")

if __name__ == "__main__":
    show_users() 