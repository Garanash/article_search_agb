#!/bin/bash

echo "========================================"
echo "Остановка локального приложения"
echo "========================================"
echo

echo "Остановка процессов на портах 8000 и 3000..."

# Находим и останавливаем процессы на порту 8000 (Backend)
BACKEND_PIDS=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$BACKEND_PIDS" ]; then
    echo "Остановка процессов Backend (PIDs: $BACKEND_PIDS)..."
    kill -9 $BACKEND_PIDS 2>/dev/null
else
    echo "Процессы Backend не найдены"
fi

# Находим и останавливаем процессы на порту 3000 (Frontend)
FRONTEND_PIDS=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$FRONTEND_PIDS" ]; then
    echo "Остановка процессов Frontend (PIDs: $FRONTEND_PIDS)..."
    kill -9 $FRONTEND_PIDS 2>/dev/null
else
    echo "Процессы Frontend не найдены"
fi

echo
echo "✓ Приложение остановлено"
echo
echo "Если процессы все еще запущены, используйте:"
echo "  lsof -ti:8000 | xargs kill -9  # для Backend"
echo "  lsof -ti:3000 | xargs kill -9  # для Frontend"
echo
