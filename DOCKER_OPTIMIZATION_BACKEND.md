# Оптимизация Docker для бэкенда

## Проблема
При каждой сборке бэкенда Docker заново скачивал все Python зависимости, что значительно замедляло процесс сборки.

## Решение

### 1. Многоэтапная сборка (Multi-stage build)
Используем два этапа:
- **deps** - установка зависимостей
- **runtime** - финальный образ

### 2. Кеширование pip
```dockerfile
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
```

### 3. Оптимизация слоев
- Сначала копируем `requirements.txt`
- Устанавливаем зависимости
- Затем копируем исходный код

## Файлы

### Dockerfile.optimized
```dockerfile
# syntax=docker/dockerfile:1.4
FROM python:3.11-slim as deps

WORKDIR /app
COPY requirements.txt ./

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --timeout=120 \
    --disable-pip-version-check \
    -r requirements.txt

FROM python:3.11-slim as runtime
WORKDIR /app

COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

COPY . .
CMD ["/wait-for-it.sh", "postgres:5432", "--", "/bin/bash", "/app/run.sh"]
```

### docker-compose.yml
```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile.optimized
    cache_from:
      - python:3.11-slim
    args:
      BUILDKIT_INLINE_CACHE: 1
```

## Скрипты для быстрой сборки

### Linux/Mac (build-fast-backend.sh)
```bash
#!/bin/bash
export DOCKER_BUILDKIT=1
docker-compose build --parallel backend
docker-compose up -d backend
```

### Windows (build-fast-backend.bat)
```batch
set DOCKER_BUILDKIT=1
docker-compose build --parallel backend
docker-compose up -d backend
```

## Результаты оптимизации

### До оптимизации
- Каждая сборка: 2-3 минуты
- Скачивание зависимостей при каждой сборке
- Нет кеширования

### После оптимизации
- Первая сборка: 2-3 минуты
- Последующие сборки: 30-60 секунд
- Кеширование зависимостей
- Многоэтапная сборка

## Использование

1. **Первая сборка:**
   ```bash
   ./build-fast-backend.sh  # Linux/Mac
   build-fast-backend.bat   # Windows
   ```

2. **Последующие сборки:**
   - Docker автоматически использует кеш
   - Сборка происходит в разы быстрее

3. **При изменении requirements.txt:**
   - Кеш автоматически инвалидируется
   - Зависимости переустанавливаются

## Дополнительные оптимизации

### 1. Использование .dockerignore
```
__pycache__
*.pyc
*.pyo
*.pyd
.Python
env
pip-log.txt
pip-delete-this-directory.txt
.tox
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git
.mypy_cache
.pytest_cache
.hypothesis
```

### 2. Оптимизация requirements.txt
- Фиксировать версии пакетов
- Убирать неиспользуемые зависимости
- Группировать по важности

### 3. Использование BuildKit
```bash
export DOCKER_BUILDKIT=1
docker-compose build
```

## Мониторинг

### Проверка размера образа
```bash
docker images | grep backend
```

### Проверка слоев
```bash
docker history article_search_agb-backend
```

### Время сборки
```bash
time docker-compose build backend
```
