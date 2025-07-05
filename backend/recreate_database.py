import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models import User, Request, Article, Supplier, EmailTemplate, Analytics, Document
from app import auth
import datetime
import sqlite3

# Удаляем старую базу данных
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test1234.db')
if os.path.exists(db_path):
    os.remove(db_path)
    print("Старая база данных удалена")

# Создаем новую базу данных со всеми таблицами
Base.metadata.create_all(bind=engine)

# Создаем тестового пользователя
from sqlalchemy.orm import sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Создаем тестового пользователя с правильным хешем пароля
hashed_password = auth.get_password_hash("admin123")
test_user = User(
    id=1,
    username="admin",
    hashed_password=hashed_password,
    email="admin@company.ru",
    role="admin",
    department="IT",
    position="Администратор",
    phone="+7 (495) 123-45-67",
    company='ООО "Алмазгеобур"'
)

db.add(test_user)
db.commit()
db.refresh(test_user)

# Создаем тестовые данные аналитики
test_analytics = [
    Analytics(
        user_id=test_user.id,
        action="Вход в систему",
        details="Успешная авторизация",
        timestamp=datetime.datetime.now() - datetime.timedelta(hours=2)
    ),
    Analytics(
        user_id=test_user.id,
        action="Добавлен артикул",
        details="Артикул: ABC123",
        timestamp=datetime.datetime.now() - datetime.timedelta(hours=1, minutes=30)
    ),
    Analytics(
        user_id=test_user.id,
        action="Поиск поставщиков",
        details="Артикул: ABC123, найдено: 15 поставщиков",
        timestamp=datetime.datetime.now() - datetime.timedelta(hours=1)
    ),
    Analytics(
        user_id=test_user.id,
        action="Создан запрос",
        details="Номер запроса: REQ-2024-001",
        timestamp=datetime.datetime.now() - datetime.timedelta(minutes=30)
    ),
    Analytics(
        user_id=test_user.id,
        action="Редактирование профиля",
        details="Обновлены данные пользователя",
        timestamp=datetime.datetime.now() - datetime.timedelta(minutes=15)
    )
]

for analytics in test_analytics:
    db.add(analytics)

db.commit()
db.close()

print("База данных пересоздана успешно!")
print("Создан тестовый пользователь:")
print("- Username: admin")
print("- Email: admin@company.ru")
print("- Role: admin")
print(f"Создано {len(test_analytics)} записей аналитики") 