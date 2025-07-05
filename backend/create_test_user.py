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

# Создаем тестового пользователя с ролью "user"
hashed_password = auth.get_password_hash("user123")
test_user = User(
    username="user",
    hashed_password=hashed_password,
    email="user@company.ru",
    role="user",
    department="Закупки",
    position="Специалист по закупкам",
    phone="+7 (495) 987-65-43",
    company='ООО "Алмазгеобур"',
    force_password_change=False  # Уже сменил пароль
)

db.add(test_user)
db.commit()
db.refresh(test_user)

print("Создан тестовый пользователь:")
print("- Username: user")
print("- Email: user@company.ru")
print("- Role: user")
print("- Password: user123")

db.close() 