#!/usr/bin/env python3
"""
Тестовый скрипт для проверки хеширования паролей
"""
import os
import sqlite3
from passlib.context import CryptContext

def test_password_hash():
    """Тестирует хеширование и проверку паролей"""
    
    # Используем тот же контекст, что и в приложении
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Тестовый пароль
    test_password = "admin123"
    
    print("=" * 60)
    print("ТЕСТ ХЕШИРОВАНИЯ ПАРОЛЕЙ")
    print("=" * 60)
    
    # 1. Генерируем новый хеш
    new_hash = pwd_context.hash(test_password)
    print(f"1. Новый хеш для пароля '{test_password}':")
    print(f"   {new_hash}")
    print()
    
    # 2. Проверяем, что новый хеш работает
    is_valid_new = pwd_context.verify(test_password, new_hash)
    print(f"2. Проверка нового хеша: {is_valid_new}")
    print()
    
    # 3. Получаем текущий хеш из базы
    db_path = "app/test1234.db"
    if not os.path.exists(db_path):
        print(f"База данных не найдена: {db_path}")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT hashed_password FROM users WHERE username = ?", ("admin",))
        result = cursor.fetchone()
        conn.close()
        
        if result:
            current_hash = result[0]
            print(f"3. Текущий хеш в базе для пользователя 'admin':")
            print(f"   {current_hash}")
            print()
            
            # 4. Проверяем текущий хеш
            is_valid_current = pwd_context.verify(test_password, current_hash)
            print(f"4. Проверка текущего хеша: {is_valid_current}")
            print()
            
            # 5. Проверяем с неправильным паролем
            is_valid_wrong = pwd_context.verify("wrongpassword", current_hash)
            print(f"5. Проверка с неправильным паролем: {is_valid_wrong}")
            print()
            
            # 6. Сравниваем хеши
            print(f"6. Хеши одинаковые: {new_hash == current_hash}")
            print()
            
            if not is_valid_current:
                print("ПРОБЛЕМА: Текущий хеш в базе не проходит проверку!")
                print("Нужно обновить хеш в базе данных.")
            else:
                print("Хеш в базе корректен. Проблема может быть в другом месте.")
                
        else:
            print("Пользователь 'admin' не найден в базе данных!")
            
    except Exception as e:
        print(f"Ошибка при работе с базой данных: {e}")

if __name__ == "__main__":
    test_password_hash() 