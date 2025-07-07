# --- Сборка фронтенда ---
FROM node:20 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# --- Сборка бэкенда ---
FROM python:3.11-slim AS backend-build
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend ./

# --- Финальный образ ---
FROM python:3.11-slim
WORKDIR /app

# Копируем бэкенд
COPY --from=backend-build /app/backend ./backend
RUN pip install --no-cache-dir -r backend/requirements.txt

# Копируем фронтенд-статику
COPY --from=frontend-build /app/frontend/build ./frontend_build

# Устанавливаем nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Копируем nginx конфиг
COPY nginx.conf /etc/nginx/nginx.conf

# Копируем скрипт запуска
COPY run.sh /run.sh
RUN chmod +x /run.sh

# Открываем порты
EXPOSE 80
EXPOSE 8000

CMD ["/run.sh"] 