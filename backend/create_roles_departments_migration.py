#!/usr/bin/env python3
"""
Миграция для создания таблиц ролей и департаментов
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL, get_db, engine
from app.models import Base, Role, Department, Permission, UserRole
import json

def create_tables():
    """Создание новых таблиц"""
    
    # Создаем таблицы
    print("Создание таблиц для ролей и департаментов...")
    Base.metadata.create_all(bind=engine, tables=[
        Role.__table__,
        Department.__table__,
        Permission.__table__,
        UserRole.__table__
    ])
    print("✓ Таблицы созданы успешно")

def populate_initial_data():
    """Заполнение начальными данными"""
    
    with engine.connect() as conn:
        # Проверяем, есть ли уже данные
        result = conn.execute(text("SELECT COUNT(*) FROM roles"))
        if result.scalar() > 0:
            print("Данные уже существуют, пропускаем заполнение...")
            return
        
        print("Добавление базовых ролей...")
        
        # Добавляем базовые роли
        roles_data = [
            {
                'name': 'user',
                'description': 'Обычный пользователь',
                'permissions': json.dumps(['read_own_data', 'create_requests'])
            },
            {
                'name': 'manager',
                'description': 'Менеджер',
                'permissions': json.dumps(['read_department_data', 'approve_documents', 'manage_users'])
            },
            {
                'name': 'admin',
                'description': 'Администратор системы',
                'permissions': json.dumps(['all'])
            }
        ]
        
        for role_data in roles_data:
            conn.execute(text("""
                INSERT INTO roles (name, description, permissions, created_at, updated_at)
                VALUES (:name, :description, :permissions, NOW(), NOW())
            """), role_data)
        
        print("✓ Базовые роли добавлены")
        
        print("Добавление базовых департаментов...")
        
        # Добавляем базовые департаменты
        departments_data = [
            {
                'name': 'Разработка ПО',
                'description': 'Отдел разработки программного обеспечения'
            },
            {
                'name': 'Системный администратор',
                'description': 'Отдел технической поддержки и системных вопросов'
            },
            {
                'name': 'Логистика',
                'description': 'Отдел логистики и поставок'
            },
            {
                'name': 'Общие вопросы',
                'description': 'Общие вопросы и административные задачи'
            },
            {
                'name': 'Бухгалтерия',
                'description': 'Финансовый отдел и бухгалтерский учет'
            },
            {
                'name': 'HR',
                'description': 'Отдел кадров и управления персоналом'
            }
        ]
        
        for dept_data in departments_data:
            conn.execute(text("""
                INSERT INTO departments (name, description, created_at, updated_at)
                VALUES (:name, :description, NOW(), NOW())
            """), dept_data)
        
        print("✓ Базовые департаменты добавлены")
        
        print("Добавление базовых разрешений...")
        
        # Добавляем базовые разрешения
        permissions_data = [
            {'name': 'read_own_data', 'description': 'Чтение собственных данных', 'resource': 'user', 'action': 'read'},
            {'name': 'create_requests', 'description': 'Создание запросов', 'resource': 'requests', 'action': 'create'},
            {'name': 'read_department_data', 'description': 'Чтение данных департамента', 'resource': 'department', 'action': 'read'},
            {'name': 'approve_documents', 'description': 'Одобрение документов', 'resource': 'documents', 'action': 'approve'},
            {'name': 'manage_users', 'description': 'Управление пользователями', 'resource': 'users', 'action': 'manage'},
            {'name': 'view_analytics', 'description': 'Просмотр аналитики', 'resource': 'analytics', 'action': 'read'},
            {'name': 'all', 'description': 'Все права доступа', 'resource': '*', 'action': '*'}
        ]
        
        for perm_data in permissions_data:
            conn.execute(text("""
                INSERT INTO permissions (name, description, resource, action, created_at)
                VALUES (:name, :description, :resource, :action, NOW())
            """), perm_data)
        
        print("✓ Базовые разрешения добавлены")
        
        # Commit all changes
        conn.commit()

def main():
    """Основная функция миграции"""
    print("🚀 Запуск миграции для ролей и департаментов...")
    
    try:
        create_tables()
        populate_initial_data()
        print("✅ Миграция завершена успешно!")
        
    except Exception as e:
        print(f"❌ Ошибка при выполнении миграции: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
