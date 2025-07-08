import os
from app.database import engine, Base
Base.metadata.create_all(bind=engine)

from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

def create_admin():
    db = SessionLocal()
    admin = db.query(User).filter(User.username == 'admin').first()
    if not admin:
        user = User(
            username='admin',
            email='admin@admin.com',
            hashed_password=get_password_hash('admin')
        )
        db.add(user)
        db.commit()
        print('Admin user created: admin/admin')
    else:
        admin.hashed_password = get_password_hash('admin')
        db.commit()
        print('Admin user password reset to: admin')
    db.close()

if __name__ == "__main__":
    create_admin() 