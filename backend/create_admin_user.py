import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models import User
from app import auth
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

Base.metadata.create_all(bind=engine)
db = SessionLocal()

username = "admin"
password = "admin"
role = "admin"

try:
    user = db.query(User).filter(User.username == username).first()
    hashed_password = auth.get_password_hash(password)
    if user:
        user.hashed_password = hashed_password
        user.role = role
        user.force_password_change = False
        db.commit()
        print(f"Пароль пользователя {username} сброшен на {password}, роль: {role}")
    else:
        new_user = User(
            username=username,
            hashed_password=hashed_password,
            email=f"{username}@company.ru",
            role=role,
            department="Админ",
            position="Администратор",
            phone="",
            company='ООО "Алмазгеобур"',
            force_password_change=False
        )
        db.add(new_user)
        db.commit()
        print(f"Создан пользователь {username} с паролем {password} и ролью {role}")
finally:
    db.close() 