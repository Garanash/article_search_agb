# Article Search AGB - Backend

Backend система для поиска артикулов и управления документами.

## Описание

Система предоставляет API для:
- Аутентификации и авторизации пользователей
- Управления артикулами и поиска поставщиков
- Создания и согласования документов
- Управления тикетами поддержки
- Телефонного справочника
- Административных функций

## Технологии

- **FastAPI** - современный веб-фреймворк для Python
- **SQLAlchemy** - ORM для работы с базой данных
- **PostgreSQL** - реляционная база данных
- **Alembic** - система миграций базы данных
- **JWT** - аутентификация пользователей

## Установка и запуск

### Предварительные требования

1. Python 3.8+
2. PostgreSQL 12+
3. pip или poetry

### Установка зависимостей

```bash
pip install -r requirements.txt
```

### Настройка базы данных

1. Создайте базу данных PostgreSQL:
```sql
CREATE DATABASE article_search_agb;
```

2. Настройте переменные окружения в файле `.env`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/article_search_agb
SECRET_KEY=your-secret-key-here
```

### Инициализация базы данных

```bash
python init_db.py
```

Это создаст:
- Базовые роли (admin, manager, user)
- Базовые департаменты
- Администратора по умолчанию (admin/admin123)

### Запуск сервера

```bash
python main.py
```

Или с uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### Аутентификация
- `POST /api/v1/token` - получение JWT токена
- `POST /api/v1/register` - регистрация пользователя

### Артикулы
- `GET /api/v1/articles` - список артикулов
- `POST /api/v1/articles` - создание артикула
- `GET /api/v1/articles/{id}` - получение артикула
- `PUT /api/v1/articles/{id}` - обновление артикула

### Документы
- `GET /api/v1/documents` - список документов
- `POST /api/v1/documents` - создание документа
- `POST /api/v1/documents/{id}/approve` - согласование документа

### Поддержка
- `GET /api/v1/support_tickets` - список тикетов
- `POST /api/v1/support_tickets` - создание тикета
- `POST /api/v1/support_tickets/{id}/attachments` - загрузка вложений

### Телефонный справочник
- `GET /api/v1/phone-directory` - список контактов
- `POST /api/v1/phone-directory` - создание контакта
- `PUT /api/v1/phone-directory/{id}` - обновление контакта

### Администрирование
- `GET /api/v1/admin/stats` - статистика системы
- `GET /api/v1/admin/users` - управление пользователями
- `GET /api/v1/admin/roles` - управление ролями
- `GET /api/v1/admin/departments` - управление департаментами

## Структура проекта

```
backend/
├── app/                    # Основные модули приложения
│   ├── __init__.py
│   ├── auth.py            # Аутентификация и авторизация
│   ├── crud.py            # CRUD операции
│   ├── database.py        # Настройки базы данных
│   └── models.py          # Модели SQLAlchemy
├── api/                    # API роутеры
│   ├── __init__.py
│   ├── auth_api.py        # API аутентификации
│   ├── articles_api.py    # API артикулов
│   ├── documents_api.py   # API документов
│   ├── support_api.py     # API поддержки
│   ├── phone_directory_api.py # API телефонного справочника
│   ├── admin_api.py       # API администрирования
│   ├── news_api.py        # API новостей
│   ├── calendar_api.py    # API календаря
│   └── users_api.py       # API пользователей
├── migrations/             # Миграции базы данных
├── uploads/                # Загруженные файлы
├── main.py                 # Основной файл приложения
├── init_db.py             # Инициализация базы данных
├── alembic.ini            # Конфигурация Alembic
├── requirements.txt        # Зависимости Python
└── README.md              # Этот файл
```

## Разработка

### Создание миграций

```bash
alembic revision --autogenerate -m "Описание изменений"
alembic upgrade head
```

### Тестирование

```bash
pytest tests/
```

### Линтинг

```bash
flake8 .
black .
```

## Безопасность

- Все пароли хешируются с использованием bcrypt
- JWT токены для аутентификации
- Проверка прав доступа на уровне API
- Валидация входных данных с помощью Pydantic

## Лицензия

MIT License
