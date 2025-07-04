# Supplier Search App

**Supplier Search App** — современное веб-приложение для поиска поставщиков по артикулу, управления компаниями, группировки артикулов в запросы и аналитики.

---

## 🚀 Возможности
- Поиск поставщиков по артикулу (через Perplexity API)
- Валидация email поставщиков (с галочкой)
- Проверка сайтов через Whois
- Удаление и ручное добавление email
- Группировка артикулов в "запросы" (requests) с уникальным номером (ВЭД-...)
- Импорт артикулов из CSV (только для вкладки "Все артикулы")
- Выбор артикулов через чекбоксы для создания нового запроса
- Современный, компактный и адаптивный интерфейс (React + Ant Design)
- Аналитика действий пользователя (отдельная вкладка)

---

## 🛠️ Технологии
- **Frontend:** React, TypeScript, Ant Design
- **Backend:** FastAPI, SQLite, SQLAlchemy
- **AI/ML:** Perplexity API (OpenAI совместимый)

---

## ⚡ Быстрый старт

### 1. Клонируйте репозиторий
```bash
git clone https://github.com/your-org/supplier-search-app.git
cd supplier-search-app
```

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
# Выполните миграцию для перехода на requests/request_id:
cd ..
python add_invoice_migration.py
cd backend
uvicorn app.main:app --reload
```

### 3. Frontend (React)
```bash
cd ../frontend
npm install
npm start
```

### 4. Откройте в браузере
```
http://localhost:3000
```

---

## 📝 Ключевые изменения (патч 2024)
- Инвойсы полностью заменены на запросы (requests), все связи через request_id
- Импорт CSV теперь работает только для артикулов (в "Все артикулы"), импорт запросов отключён
- Для создания запроса выберите нужные артикулы чекбоксами и нажмите "Создать запрос из этих артикулов"
- Миграция базы данных: invoices → requests, invoice_id → request_id
- Исправлены все баги с отображением, фильтрацией и импортом

---

## 🖼️ Скриншот интерфейса

![Скриншот интерфейса](#) <!-- Добавьте свой скриншот сюда -->

---

## 📬 Контакты
- Автор: [Garanash](mailto:dolgov_am@mail.ru)
- Telegram: @Garanash

---

**NeuroFork ©2025** 