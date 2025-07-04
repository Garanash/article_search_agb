# Supplier Search App

**Supplier Search App** — современное веб-приложение для поиска поставщиков по артикулу, управления компаниями и аналитики.

---

## 🚀 Возможности
- Поиск поставщиков по артикулу (через Perplexity API)
- Валидация email поставщиков (с галочкой)
- Проверка сайтов через Whois
- Удаление и ручное добавление email
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
# Если нужно — выполните миграцию или скрипт add_email_validated.py
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

## 🖼️ Скриншот интерфейса

![Скриншот интерфейса](#) <!-- Добавьте свой скриншот сюда -->

---

## 📬 Контакты
- Автор: [Garanash](mailto:dolgov_am@mail.ru)
- Telegram: @Garanash

---

**NeuroFork ©2025** 