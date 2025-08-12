#!/usr/bin/env bash
set -euo pipefail

echo "[run.sh] Start backend container"
 echo "[run.sh] DB: ${POSTGRES_USER:-appuser}@${POSTGRES_HOST:-postgres}:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-appdb}"

# Доп. ожидание готовности БД с проверкой простого запроса
python - <<'PY'
import os, time, sys
import psycopg2

def wait_db():
    dsn = (
        f"host={os.getenv('POSTGRES_HOST','postgres')} "
        f"port={os.getenv('POSTGRES_PORT','5432')} "
        f"dbname={os.getenv('POSTGRES_DB','appdb')} "
        f"user={os.getenv('POSTGRES_USER','appuser')} "
        f"password={os.getenv('POSTGRES_PASSWORD','apppassword')}"
    )
    for i in range(30):
        try:
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            cur.execute('select 1')
            cur.fetchone()
            conn.close()
            print('[run.sh] DB ready')
            return
        except Exception as e:
            print(f"[run.sh] DB not ready ({i+1}/30): {e}")
            time.sleep(2)
    print('[run.sh] DB not ready, exiting')
    sys.exit(1)

wait_db()
PY

# Создание таблиц
python - <<'PY'
from app.database import Base, engine
# ВАЖНО: импортируем модели, чтобы они были зарегистрированы в Base.metadata
import app.models  # noqa: F401
Base.metadata.create_all(bind=engine)
print('[run.sh] DB migrated')
PY

# Создание/обновление пользователя admin
python - <<'PY'
import os
from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

username = os.getenv('ADMIN_USERNAME', 'admin')
password = os.getenv('ADMIN_PASSWORD', 'admin123')

db = SessionLocal()
try:
    user = db.query(User).filter(User.username == username).first()
    if user:
        user.role = 'admin'
        user.hashed_password = get_password_hash(password)
        user.force_password_change = False
        if not user.email:
            user.email = 'admin@local'
        print('[run.sh] Admin updated')
    else:
        user = User(
            username=username,
            hashed_password=get_password_hash(password),
            role='admin',
            email='admin@local',
            force_password_change=False,
            first_name='Админ',
        )
        db.add(user)
        print('[run.sh] Admin created')
    db.commit()
finally:
    db.close()
PY

# Старт uvicorn
exec uvicorn main:app --host 0.0.0.0 --port 8000
