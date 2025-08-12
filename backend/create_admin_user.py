import sys
from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash


def main() -> int:
    username = "admin"
    password = "admin123"

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if user:
            user.hashed_password = get_password_hash(password)
            user.role = "admin"
            user.force_password_change = False
            if not user.email:
                user.email = "admin@local"
            action = "updated"
        else:
            user = User(
                username=username,
                hashed_password=get_password_hash(password),
                role="admin",
                email="admin@local",
                force_password_change=False,
                first_name="Админ",
            )
            db.add(user)
            action = "created"
        db.commit()
        print(f"Admin user {action}: username=admin, password=admin123")
        return 0
    except Exception as exc:
        db.rollback()
        print(f"Error: {exc}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main()) 