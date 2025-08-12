# 🚀 Локальный запуск приложения

Этот документ содержит инструкции по запуску приложения на локальной машине без использования Docker.

## 📋 Требования

Перед запуском убедитесь, что у вас установлены:

- **Python 3.8+** - [Скачать](https://python.org)
- **Node.js 16+** - [Скачать](https://nodejs.org)
- **PostgreSQL 12+** - [Скачать](https://postgresql.org)

## 🛠️ Быстрый запуск

### Windows
```bash
# Двойной клик на файл
start-local.bat

# Или запуск из командной строки
start-local.bat
```

### Linux/Mac
```bash
# Сделать скрипт исполняемым (только первый раз)
chmod +x start-local.sh

# Запустить
./start-local.sh
```

## 📝 Пошаговая настройка

### 1. Настройка PostgreSQL

1. Установите PostgreSQL
2. Создайте пользователя `postgres` с паролем `postgres`
3. Убедитесь, что сервис PostgreSQL запущен

### 2. Настройка Python окружения

```bash
# Создание виртуального окружения
python -m venv venv

# Активация (Windows)
venv\Scripts\activate

# Активация (Linux/Mac)
source venv/bin/activate

# Установка зависимостей
pip install -r backend/requirements.txt
```

### 3. Настройка Node.js

```bash
cd frontend
npm install
cd ..
```

### 4. Создание .env файла

Скрипт автоматически создаст файл `.env` со следующими настройками:

```env
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
```

## 🚀 Запуск вручную

Если вы хотите запустить компоненты вручную:

### Backend
```bash
cd backend
source ../venv/bin/activate  # Linux/Mac
# или
call ..\venv\Scripts\activate.bat  # Windows

python main.py
```

### Frontend
```bash
cd frontend
npm start
```

## 🌐 Доступ к приложению

После успешного запуска:

- **Backend API**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **API документация**: http://localhost:8000/docs

## 🔧 Устранение неполадок

### Ошибка подключения к PostgreSQL
- Убедитесь, что PostgreSQL запущен
- Проверьте настройки подключения в `.env`
- Убедитесь, что пользователь `postgres` существует

### Ошибка портов
- Backend использует порт 8000
- Frontend использует порт 3000
- Убедитесь, что порты свободны

### Ошибки зависимостей
```bash
# Обновить pip
pip install --upgrade pip

# Переустановить зависимости
pip install -r backend/requirements.txt --force-reinstall

# Очистить npm кэш
cd frontend
npm cache clean --force
npm install
```

## 📁 Структура проекта

```
article_search_agb/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # Точка входа backend
│   ├── requirements.txt    # Python зависимости
│   └── app/               # Основной код приложения
├── frontend/               # React frontend
│   ├── package.json       # Node.js зависимости
│   └── src/               # Исходный код React
├── start-local.bat        # Скрипт запуска для Windows
├── start-local.sh         # Скрипт запуска для Linux/Mac
└── .env                   # Конфигурация (создается автоматически)
```

## 🆘 Получение помощи

Если у вас возникли проблемы:

1. Проверьте логи в окнах командной строки
2. Убедитесь, что все зависимости установлены
3. Проверьте, что PostgreSQL запущен и доступен
4. Убедитесь, что порты 8000 и 3000 свободны

## 🔄 Остановка приложения

### Windows
- Закройте окна командной строки
- Или нажмите `Ctrl+C` в каждом окне

### Linux/Mac
- Нажмите `Ctrl+C` в терминале
- Скрипт автоматически остановит все процессы
