import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models import User
from app import auth
import datetime

# Создаем таблицы если их нет
Base.metadata.create_all(bind=engine)

# Создаем тестового пользователя
from sqlalchemy.orm import sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Проверяем, есть ли уже такой пользователь
existing = db.query(User).filter((User.username == "manager") | (User.email == "manager@company.ru")).first()
if not existing:
    hashed_password = auth.get_password_hash("manager123")
    test_user = User(
        username="manager",
        hashed_password=hashed_password,
        email="manager@company.ru",
        role="manager",
        department="Закупки",
        position="Менеджер по закупкам",
        phone="+7 (495) 555-44-33",
        company='ООО "Алмазгеобур"',
        force_password_change=False  # Уже сменил пароль
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    print("Создан тестовый пользователь:")
    print("- Username: manager")
    print("- Email: manager@company.ru")
    print("- Role: manager")
    print("- Password: manager123")
else:
    print("Пользователь manager уже существует")
db.close() 