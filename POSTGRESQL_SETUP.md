# 🐘 Установка PostgreSQL для локального запуска

## 📥 Скачивание и установка

### Windows
1. Скачайте PostgreSQL с [официального сайта](https://www.postgresql.org/download/windows/)
2. Запустите установщик
3. **Важно:** Запомните пароль для пользователя `postgres`
4. Оставьте порт по умолчанию (5432)
5. Установите все компоненты (PostgreSQL Server, pgAdmin, Stack Builder)

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### macOS
```bash
# Через Homebrew
brew install postgresql
brew services start postgresql

# Или скачайте с официального сайта
```

## ⚙️ Настройка

### 1. Запуск службы

#### Windows
- Служба запускается автоматически после установки
- Проверить: `Службы` → `postgresql-x64-15` (или ваша версия)

#### Linux
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS
```bash
brew services start postgresql
```

### 2. Создание пользователя и базы данных

#### Windows
1. Откройте **pgAdmin** (установлен вместе с PostgreSQL)
2. Подключитесь к серверу (пароль, который вы задали при установке)
3. Правый клик на `Login/Group Roles` → `Create` → `Login/Group Role`
4. Имя: `postgres`, пароль: `postgres`
5. Правый клик на `Databases` → `Create` → `Database`
6. Имя: `article_search_agb`

#### Linux/macOS
```bash
# Подключиться к PostgreSQL
sudo -u postgres psql

# Создать пользователя (если нужно)
CREATE USER postgres WITH PASSWORD 'postgres';

# Сделать пользователя суперпользователем
ALTER USER postgres WITH SUPERUSER;

# Создать базу данных
CREATE DATABASE article_search_agb;

# Выйти
\q
```

### 3. Проверка подключения

```bash
# Windows (если psql добавлен в PATH)
psql -h localhost -U postgres -d article_search_agb

# Linux/macOS
psql -h localhost -U postgres -d article_search_agb
```

## 🔧 Устранение неполадок

### Ошибка "connection refused"
- Убедитесь, что служба PostgreSQL запущена
- Проверьте, что порт 5432 не занят другим приложением

### Ошибка "authentication failed"
- Проверьте правильность пароля
- Убедитесь, что пользователь `postgres` существует

### Ошибка "database does not exist"
- Создайте базу данных `article_search_agb`
- Проверьте права доступа пользователя

### Порт занят
```bash
# Windows
netstat -ano | findstr :5432

# Linux/macOS
lsof -i :5432
```

## 📋 Быстрая проверка

После установки выполните:

```bash
# Проверка версии
psql --version

# Проверка подключения
psql -h localhost -U postgres -d article_search_agb -c "SELECT version();"
```

Если все работает, вы увидите версию PostgreSQL.

## 🚀 Следующий шаг

После успешной установки PostgreSQL запустите приложение:

```bash
# Windows
start-local.bat

# Linux/macOS
./start-local.sh
```

Скрипт автоматически настроит базу данных и запустит приложение!
