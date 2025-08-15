from passlib.context import CryptContext
import hashlib

# Хеширование паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля"""
    # Для совместимости с существующими хешами SHA256
    if hashed_password.startswith('$2b$'):
        return pwd_context.verify(plain_password, hashed_password)
    else:
        # SHA256 хеш
        return hashed_password == hashlib.sha256(plain_password.encode()).hexdigest()

def get_password_hash(password: str) -> str:
    """Хеширование пароля"""
    return pwd_context.hash(password)

