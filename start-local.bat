@echo off
echo ========================================
echo Запуск приложения в локальном режиме
echo ========================================
echo.

REM Проверяем, установлен ли Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ОШИБКА: Python не установлен или не добавлен в PATH
    echo Установите Python с https://python.org
    pause
    exit /b 1
)

REM Проверяем, установлен ли Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ОШИБКА: Node.js не установлен или не добавлен в PATH
    echo Установите Node.js с https://nodejs.org
    pause
    exit /b 1
)

REM Проверяем, установлен ли PostgreSQL
psql --version >nul 2>&1
if errorlevel 1 (
    echo ОШИБКА: PostgreSQL не установлен или не добавлен в PATH
    echo Установите PostgreSQL с https://postgresql.org
    pause
    exit /b 1
)

echo ✓ Python: 
python --version
echo ✓ Node.js: 
node --version
echo ✓ PostgreSQL: 
psql --version
echo.

REM Создаем виртуальное окружение для Python, если его нет
if not exist "venv" (
    echo Создание виртуального окружения Python...
    python -m venv venv
)

REM Активируем виртуальное окружение
echo Активация виртуального окружения...
call venv\Scripts\activate.bat

REM Устанавливаем зависимости Python
echo Установка зависимостей Python...
pip install -r backend/requirements.txt

REM Устанавливаем зависимости Node.js
echo Установка зависимостей Node.js...
cd frontend
npm install
cd ..

REM Создаем .env файл для локальной разработки
if not exist ".env" (
    echo Создание .env файла...
    (
        echo # Локальная конфигурация
        echo POSTGRES_USER=postgres
        echo POSTGRES_PASSWORD=postgres
        echo POSTGRES_DB=article_search_agb
        echo POSTGRES_HOST=localhost
        echo POSTGRES_PORT=5432
        echo.
        echo # Backend
        echo BACKEND_HOST=localhost
        echo BACKEND_PORT=8000
        echo.
        echo # Frontend
        echo REACT_APP_API_URL=http://localhost:8000
        echo REACT_APP_BACKEND_URL=http://localhost:8000
    ) > .env
    echo ✓ Создан .env файл
)

echo.
echo ========================================
echo Настройка базы данных
echo ========================================
echo.

REM Проверяем подключение к базе данных
echo Проверка подключения к PostgreSQL...
psql -h localhost -U postgres -d article_search_agb -c "SELECT version();" >nul 2>&1
if errorlevel 1 (
    echo Создание базы данных...
    psql -h localhost -U postgres -c "CREATE DATABASE article_search_agb;" 2>nul
    if errorlevel 1 (
        echo ОШИБКА: Не удалось создать базу данных
        echo Убедитесь, что PostgreSQL запущен и доступен
        pause
        exit /b 1
    )
    echo ✓ База данных создана
) else (
    echo ✓ База данных уже существует
)

echo.
echo ========================================
echo Запуск приложения
echo ========================================
echo.

REM Запускаем backend в отдельном окне
echo Запуск backend сервера...
start "Backend Server" cmd /k "cd backend && call ..\venv\Scripts\activate.bat && python main.py"

REM Ждем немного, чтобы backend запустился
timeout /t 3 /nobreak >nul

REM Запускаем frontend в отдельном окне
echo Запуск frontend сервера...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo Приложение запущено!
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Для остановки закройте окна командной строки
echo или нажмите Ctrl+C в каждом окне
echo.
pause
