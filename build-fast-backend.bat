@echo off
REM Скрипт для быстрой сборки бэкенда с BuildKit
echo 🚀 Быстрая сборка бэкенда с BuildKit...

REM Включаем BuildKit
set DOCKER_BUILDKIT=1

REM Собираем бэкенд с кешированием
echo 📦 Собираем бэкенд...
docker-compose build --parallel backend

REM Запускаем бэкенд
echo ▶️ Запускаем бэкенд...
docker-compose up -d backend

echo ✅ Бэкенд успешно собран и запущен!
echo 🌐 Доступен по адресу: http://localhost:8000
echo 📊 Документация API: http://localhost:8000/docs

pause
