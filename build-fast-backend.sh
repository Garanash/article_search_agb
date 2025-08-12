#!/bin/bash

# Скрипт для быстрой сборки бэкенда с использованием BuildKit
echo "🚀 Быстрая сборка бэкенда с BuildKit..."

# Включаем BuildKit
export DOCKER_BUILDKIT=1

# Собираем бэкенд с кешированием
echo "📦 Собираем бэкенд..."
docker-compose build --parallel backend

# Запускаем бэкенд
echo "▶️ Запускаем бэкенд..."
docker-compose up -d backend

echo "✅ Бэкенд успешно собран и запущен!"
echo "🌐 Доступен по адресу: http://localhost:8000"
echo "📊 Документация API: http://localhost:8000/docs"
