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
existing = db.query(User).filter((User.username == "newuser") | (User.email == "newuser@company.ru")).first()
if not existing:
    generated_password = auth.generate_random_password()
    hashed_password = auth.get_password_hash(generated_password)
    new_user = User(
        username="newuser",
        hashed_password=hashed_password,
        email="newuser@company.ru",
        role="user",
        department="Маркетинг",
        position="Маркетолог",
        phone="+7 (495) 111-22-33",
        company='ООО "Алмазгеобур"',
        force_password_change=True  # Требуется смена пароля при первом входе
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    print("Создан новый пользователь с принудительной сменой пароля:")
    print("- Username: newuser")
    print("- Email: newuser@company.ru")
    print("- Role: user")
    print(f"- Generated Password: {generated_password}")
    print("- При первом входе потребуется сменить пароль")
else:
    print("Пользователь newuser уже существует")
db.close() 