#!/bin/bash

echo "========================================"
echo "Запуск приложения в локальном режиме"
echo "========================================"
echo

# Проверяем, установлен ли Python
if ! command -v python3 &> /dev/null; then
    echo "ОШИБКА: Python3 не установлен"
    echo "Установите Python с https://python.org"
    exit 1
fi

# Проверяем, установлен ли Node.js
if ! command -v node &> /dev/null; then
    echo "ОШИБКА: Node.js не установлен"
    echo "Установите Node.js с https://nodejs.org"
    exit 1
fi

# Проверяем, установлен ли PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "ОШИБКА: PostgreSQL не установлен"
    echo "Установите PostgreSQL с https://postgresql.org"
    exit 1
fi

echo "✓ Python: $(python3 --version)"
echo "✓ Node.js: $(node --version)"
echo "✓ PostgreSQL: $(psql --version)"
echo

# Создаем виртуальное окружение для Python, если его нет
if [ ! -d "venv" ]; then
    echo "Создание виртуального окружения Python..."
    python3 -m venv venv
fi

# Активируем виртуальное окружение
echo "Активация виртуального окружения..."
source venv/bin/activate

# Устанавливаем зависимости Python
echo "Установка зависимостей Python..."
pip install -r backend/requirements.txt

# Устанавливаем зависимости Node.js
echo "Установка зависимостей Node.js..."
cd frontend
npm install
cd ..

# Создаем .env файл для локальной разработки
if [ ! -f ".env" ]; then
    echo "Создание .env файла..."
    cat > .env << EOF
# Локальная конфигурация
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=article_search_agb
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Backend
BACKEND_HOST=localhost
BACKEND_PORT=8000

# Frontend
REACT_APP_API_URL=http://localhost:8000
REACT_APP_BACKEND_URL=http://localhost:8000
EOF
    echo "✓ Создан .env файл"
fi

echo
echo "========================================"
echo "Настройка базы данных"
echo "========================================"
echo

# Проверяем подключение к базе данных
echo "Проверка подключения к PostgreSQL..."
if ! psql -h localhost -U postgres -d article_search_agb -c "SELECT version();" &> /dev/null; then
    echo "Создание базы данных..."
    if ! psql -h localhost -U postgres -c "CREATE DATABASE article_search_agb;" &> /dev/null; then
        echo "ОШИБКА: Не удалось создать базу данных"
        echo "Убедитесь, что PostgreSQL запущен и доступен"
        exit 1
    fi
    echo "✓ База данных создана"
else
    echo "✓ База данных уже существует"
fi

echo
echo "========================================"
echo "Запуск приложения"
echo "========================================"
echo

# Функция для очистки при выходе
cleanup() {
    echo
    echo "Остановка приложения..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Устанавливаем обработчик сигналов
trap cleanup SIGINT SIGTERM

# Запускаем backend в фоне
echo "Запуск backend сервера..."
cd backend
source ../venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

# Ждем немного, чтобы backend запустился
sleep 3

# Запускаем frontend в фоне
echo "Запуск frontend сервера..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo
echo "========================================"
echo "Приложение запущено!"
echo "========================================"
echo
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo
echo "Для остановки нажмите Ctrl+C"
echo

# Ждем завершения процессов
wait
