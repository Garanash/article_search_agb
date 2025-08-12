import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Загружаем переменные окружения из .env
load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER", "appuser")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "apppassword")
POSTGRES_DB = os.getenv("POSTGRES_DB", "appdb")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

# Отладочный вывод (без пароля)
try:
    masked_password = "***" if POSTGRES_PASSWORD else ""
    print(f"DB env -> host={POSTGRES_HOST} port={POSTGRES_PORT} db={POSTGRES_DB} user={POSTGRES_USER} pwd={masked_password}")
except Exception:
    pass

# Добавляем параметры кодировки для исправления ошибки UnicodeDecodeError
SQLALCHEMY_DATABASE_URL = (
    f"postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

# Еще один отладочный вывод строки подключения (без пароля)
try:
    safe_url = SQLALCHEMY_DATABASE_URL.replace(POSTGRES_PASSWORD, "***") if POSTGRES_PASSWORD else SQLALCHEMY_DATABASE_URL
    print(f"SQLALCHEMY_DATABASE_URL={safe_url}")
except Exception:
    pass

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={
        # Принудительно укажем клиентскую кодировку
        "client_encoding": "utf8",
        "options": "-c client_encoding=utf8",
    },
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 