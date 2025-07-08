#!/bin/bash
set -e

# Проверяем, заданы ли переменные окружения для Postgres
if [[ -n "$POSTGRES_HOST" && -n "$POSTGRES_USER" && -n "$POSTGRES_PASSWORD" && -n "$POSTGRES_DB" ]]; then
  # Ожидание готовности Postgres
  until PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\q" 2>/dev/null; do
    echo "Жду готовности Postgres..."
    sleep 2
  done
  echo "Postgres готов!"
else
  echo "Переменные окружения для Postgres не заданы, пропускаю ожидание базы данных."
fi

# Запуск бэкенда (FastAPI) с uvicorn, оптимально для 2 CPU на 100+ пользователей
export PYTHONUNBUFFERED=1
cd /app/backend

# Создаём пользователя admin:admin, если его нет
if [ -f create_admin_user.py ]; then
  python create_admin_user.py || true
fi

nohup uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 > /app/backend.log 2>&1 &

# Ждём, пока backend поднимется
sleep 3

# Запуск nginx
nginx -g 'daemon off;' 