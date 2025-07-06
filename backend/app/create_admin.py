from app.database import SessionLocal
from app.models import User
from app import auth

def main():
    db = SessionLocal()
    hashed_password = auth.get_password_hash("83c-DvA-YB5-RmQ!")
    admin = User(
        username="admin",
        email="admin@company.ru",
        hashed_password=hashed_password,
        role="admin",
        department="IT",
        position="Администратор",
        phone="+7 (495) 123-45-67",
        company='ООО "Алмазгеобур"',
        force_password_change=False
    )
    db.add(admin)
    db.commit()
    db.close()
    print("Администратор создан!")

if __name__ == "__main__":
    main() 