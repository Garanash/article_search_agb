#!/usr/bin/env python3
"""
Скрипт для проверки и инициализации базы данных
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models import User, Article, Supplier, Request, Analytics, UserBot, SupportMessage, SupportTicket, SupportEvent, Document, EmailTemplate
from app.auth import get_password_hash
from sqlalchemy.orm import sessionmaker

def check_database():
    """Проверяет состояние базы данных"""
    print("Проверка базы данных...")
    
    # Создаем все таблицы
    Base.metadata.create_all(bind=engine)
    print("✓ Таблицы созданы/обновлены")
    
    # Проверяем подключение
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Проверяем количество пользователей
        user_count = db.query(User).count()
        print(f"✓ Пользователей в базе: {user_count}")
        
        # Проверяем количество артикулов
        article_count = db.query(Article).count()
        print(f"✓ Артикулов в базе: {article_count}")
        
        # Проверяем количество поставщиков
        supplier_count = db.query(Supplier).count()
        print(f"✓ Поставщиков в базе: {supplier_count}")
        
        # Проверяем количество запросов
        request_count = db.query(Request).count()
        print(f"✓ Запросов в базе: {request_count}")
        
        # Проверяем количество аналитики
        analytics_count = db.query(Analytics).count()
        print(f"✓ Записей аналитики в базе: {analytics_count}")
        
        # Проверяем количество ботов
        bot_count = db.query(UserBot).count()
        print(f"✓ Ботов в базе: {bot_count}")
        
        # Проверяем количество сообщений поддержки
        support_count = db.query(SupportMessage).count()
        print(f"✓ Сообщений поддержки в базе: {support_count}")
        
        # Проверяем количество тикетов
        ticket_count = db.query(SupportTicket).count()
        print(f"✓ Тикетов в базе: {ticket_count}")
        
        # Проверяем количество событий
        event_count = db.query(SupportEvent).count()
        print(f"✓ Событий в базе: {event_count}")
        
        # Проверяем количество документов
        document_count = db.query(Document).count()
        print(f"✓ Документов в базе: {document_count}")
        
        # Проверяем количество шаблонов email
        template_count = db.query(EmailTemplate).count()
        print(f"✓ Шаблонов email в базе: {template_count}")
        
        print("\n✓ База данных работает корректно!")
        
    except Exception as e:
        print(f"✗ Ошибка при проверке базы данных: {e}")
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    check_database() 