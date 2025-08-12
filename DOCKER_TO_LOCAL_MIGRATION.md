# 🐳 Миграция с Docker на локальный запуск

## 📋 Обзор изменений

При переходе с Docker на локальный запуск:

- **База данных:** SQLite → PostgreSQL
- **Backend:** Docker контейнер → локальный Python
- **Frontend:** Docker контейнер → локальный Node.js
- **Конфигурация:** Docker Compose → .env файл

## 🔄 Пошаговая миграция

### 1. Остановка Docker

```bash
# Остановить все контейнеры
docker-compose down

# Удалить контейнеры (опционально)
docker-compose down --volumes --remove-orphans
```

### 2. Сохранение данных (если нужно)

```bash
# Создать резервную копию SQLite базы
cp backend/app.db backend/app.db.backup

# Экспорт данных (если нужно)
python backend/export_data.py
```

### 3. Установка компонентов

Следуйте инструкциям в:
- `PREREQUISITES_SETUP.md` - Python, Node.js
- `POSTGRESQL_SETUP.md` - PostgreSQL

### 4. Настройка .env файла

Скрипт `start-local.bat` или `start-local.sh` автоматически создаст `.env` файл.

### 5. Запуск локально

```bash
# Windows
start-local.bat

# Linux/macOS
./start-local.sh
```

## 🔧 Настройка базы данных

### Автоматическая настройка
Скрипт запуска автоматически:
- Создаст базу данных `article_search_agb`
- Применит все миграции
- Создаст необходимые таблицы

### Ручная настройка (если нужно)
```bash
# Подключиться к PostgreSQL
psql -h localhost -U postgres -d article_search_agb

# Применить миграции
\i backend/migrations/001_initial.sql
\i backend/migrations/002_add_users.sql
# ... другие миграции

# Выйти
\q
```

## 📊 Сравнение конфигураций

| Компонент | Docker | Локально |
|-----------|--------|----------|
| **База данных** | SQLite в контейнере | PostgreSQL локально |
| **Backend** | `http://backend:8000` | `http://localhost:8000` |
| **Frontend** | `http://localhost:3000` | `http://localhost:3000` |
| **Конфигурация** | `docker-compose.yml` | `.env` файл |
| **Зависимости** | Docker образы | Локальные пакеты |

## 🔍 Проверка миграции

### 1. Проверка статуса
```bash
# Windows
check-status.bat

# Linux/macOS
./check-status.sh
```

### 2. Проверка подключений
- Backend: http://localhost:8000/docs
- Frontend: http://localhost:3000
- База данных: `psql -h localhost -U postgres -d article_search_agb`

### 3. Тестирование функциональности
- Вход в систему
- Создание пользователей
- Поиск поставщиков
- AI чат

## 🚨 Возможные проблемы

### Ошибка подключения к базе данных
```bash
# Проверить статус PostgreSQL
# Windows
services.msc → postgresql-x64-15

# Linux
sudo systemctl status postgresql

# macOS
brew services list | grep postgresql
```

### Ошибка портов
```bash
# Проверить занятые порты
# Windows
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# Linux/macOS
lsof -i :8000
lsof -i :3000
```

### Ошибки зависимостей
```bash
# Python
pip install -r backend/requirements.txt --force-reinstall

# Node.js
cd frontend
npm cache clean --force
npm install
```

## 🔄 Возврат к Docker

Если нужно вернуться к Docker:

```bash
# Остановить локальные процессы
# Windows
stop-local.bat

# Linux/macOS
./stop-local.sh

# Запустить Docker
docker-compose up -d
```

## 📚 Полезные команды

### Локальный запуск
```bash
# Запуск
start-local.bat          # Windows
./start-local.sh         # Linux/macOS

# Остановка
stop-local.bat           # Windows
./stop-local.sh          # Linux/macOS

# Проверка статуса
check-status.bat         # Windows
./check-status.sh        # Linux/macOS
```

### Управление базой данных
```bash
# Подключение
psql -h localhost -U postgres -d article_search_agb

# Список таблиц
\dt

# Выход
\q
```

## 🎯 Преимущества локального запуска

- **Быстрая разработка** - изменения применяются мгновенно
- **Отладка** - прямой доступ к логам и процессам
- **Производительность** - нет накладных расходов Docker
- **Гибкость** - легко модифицировать конфигурацию
- **Отладка** - прямой доступ к файлам и процессам

## 🆘 Получение помощи

При проблемах с миграцией:

1. Проверьте логи в окнах командной строки
2. Убедитесь, что все компоненты установлены
3. Проверьте статус: `check-status.bat` / `./check-status.sh`
4. Обратитесь к документации в `README_LOCAL_SETUP.md`
