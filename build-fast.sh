#!/bin/bash

# Скрипт для быстрой сборки с кешированием

echo "🚀 Быстрая сборка с оптимизированным кешированием..."

# Включаем BuildKit для лучшего кеширования
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Очищаем только неиспользуемые кеши (не все!)
echo "🧹 Очистка неиспользуемых кешей..."
docker builder prune -f --filter until=24h

# Предварительно загружаем базовые образы
echo "⬇️ Предзагрузка базовых образов..."
docker pull node:20-alpine &
docker pull nginx:alpine &
wait

# Сборка только измененного сервиса
if [ "$1" = "frontend" ]; then
    echo "🔨 Сборка только frontend..."
    docker-compose build --parallel frontend
elif [ "$1" = "backend" ]; then
    echo "🔨 Сборка только backend..."
    docker-compose build --parallel backend
else
    echo "🔨 Сборка всех сервисов..."
    # Сборка в правильном порядке с максимальным параллелизмом
    docker-compose build --parallel
fi

echo "✅ Сборка завершена!"

# Показываем размеры образов
echo "📊 Размеры образов:"
docker images | grep article_search_agb
