#!/usr/bin/env python3
"""
Скрипт для инициализации базы данных
Создает базовые роли, департаменты и администратора
"""

import os
import sys
from sqlalchemy.orm import Session

# Добавляем путь к корневой директории проекта
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal
from app.models import Base, Role, Department, User
from app.auth import get_password_hash

def init_db():
    """Инициализация базы данных"""
    # Создаем все таблицы
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Создаем базовые роли
        roles = [
            {
                "name": "admin",
                "description": "Администратор системы",
                "permissions": {
                    "users": ["read", "write", "delete"],
                    "articles": ["read", "write", "delete"],
                    "documents": ["read", "write", "delete", "approve"],
                    "support": ["read", "write", "delete"],
                    "admin": ["read", "write", "delete"]
                }
            },
            {
                "name": "manager",
                "description": "Руководитель отдела",
                "permissions": {
                    "users": ["read"],
                    "articles": ["read", "write"],
                    "documents": ["read", "write", "approve"],
                    "support": ["read", "write"],
                    "admin": ["read"]
                }
            },
            {
                "name": "user",
                "description": "Обычный пользователь",
                "permissions": {
                    "users": ["read"],
                    "articles": ["read", "write"],
                    "documents": ["read", "write"],
                    "support": ["read", "write"],
                    "admin": []
                }
            }
        ]
        
        for role_data in roles:
            existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
            if not existing_role:
                role = Role(**role_data)
                db.add(role)
                print(f"Создана роль: {role_data['name']}")
            else:
                print(f"Роль {role_data['name']} уже существует")
        
        # Создаем базовые департаменты
        departments = [
            {
                "name": "IT отдел",
                "description": "Отдел информационных технологий"
            },
            {
                "name": "Логистика",
                "description": "Отдел логистики и поставок"
            },
            {
                "name": "Бухгалтерия",
                "description": "Бухгалтерский отдел"
            },
            {
                "name": "HR",
                "description": "Отдел кадров"
            }
        ]
        
        for dept_data in departments:
            existing_dept = db.query(Department).filter(Department.name == dept_data["name"]).first()
            if not existing_dept:
                dept = Department(**dept_data)
                db.add(dept)
                print(f"Создан департамент: {dept_data['name']}")
            else:
                print(f"Департамент {dept_data['name']} уже существует")
        
        db.commit()
        
        # Создаем администратора по умолчанию
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        it_dept = db.query(Department).filter(Department.name == "IT отдел").first()
        
        if admin_role and it_dept:
            existing_admin = db.query(User).filter(User.username == "admin").first()
            if not existing_admin:
                admin_user = User(
                    username="admin",
                    email="admin@example.com",
                    hashed_password=get_password_hash("admin123"),
                    full_name="Администратор системы",
                    role_id=admin_role.id,
                    department_id=it_dept.id,
                    is_active=True
                )
                db.add(admin_user)
                db.commit()
                print("Создан администратор по умолчанию:")
                print("Логин: admin")
                print("Пароль: admin123")
                print("Email: admin@example.com")
            else:
                print("Администратор уже существует")
        else:
            print("Ошибка: не найдены роль admin или департамент IT отдел")
        
    except Exception as e:
        print(f"Ошибка при инициализации базы данных: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Инициализация базы данных...")
    init_db()
    print("Инициализация завершена!")
