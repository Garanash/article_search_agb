#!/bin/bash
set -e

echo "[run.sh] Жду инициализации базы и запускаю миграции..."
python init_db.py

echo "[run.sh] Запускаю backend (uvicorn)..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 