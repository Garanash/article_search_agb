@echo off
REM Скрипт для быстрой сборки с кешированием в Windows

echo 🚀 Быстрая сборка с оптимизированным кешированием...

REM Включаем BuildKit для лучшего кеширования
set DOCKER_BUILDKIT=1
set COMPOSE_DOCKER_CLI_BUILD=1

REM Очищаем только неиспользуемые кеши (не все!)
echo 🧹 Очистка неиспользуемых кешей...
docker builder prune -f --filter until=24h

REM Предварительно загружаем базовые образы
echo ⬇️ Предзагрузка базовых образов...
start /B docker pull node:20-alpine
start /B docker pull nginx:alpine
timeout /t 5 /nobreak >nul

REM Сборка только измененного сервиса
if "%1"=="frontend" (
    echo 🔨 Сборка только frontend...
    docker-compose build --parallel frontend
) else if "%1"=="backend" (
    echo 🔨 Сборка только backend...
    docker-compose build --parallel backend
) else (
    echo 🔨 Сборка всех сервисов...
    docker-compose build --parallel
)

echo ✅ Сборка завершена!

REM Показываем размеры образов
echo 📊 Размеры образов:
docker images | findstr article_search_agb

pause
