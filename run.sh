#!/bin/bash
set -e

# Запуск бэкенда (FastAPI) с uvicorn, оптимально для 2 CPU на 100+ пользователей
# Можно увеличить число воркеров (workers) при необходимости
export PYTHONUNBUFFERED=1
cd /app/backend
nohup uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 > /app/backend.log 2>&1 &

# Ждём, пока backend поднимется
sleep 3

# Запуск nginx
nginx -g 'daemon off;' 