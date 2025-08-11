# --- Сборка фронтенда ---
FROM node:20 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
# Отключаем проверку SSL для npm
RUN npm config set strict-ssl false
RUN npm ci
COPY frontend ./
RUN npm run build

# --- Сборка бэкенда ---
FROM python:3.11-slim AS backend-build
WORKDIR /app/backend
COPY backend/requirements.txt ./
# Используем китайское зеркало PyPI
RUN mkdir -p /root/.pip && echo "[global]\nindex-url = https://pypi.tuna.tsinghua.edu.cn/simple" > /root/.pip/pip.conf
RUN pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host=files.pythonhosted.org -r requirements.txt
COPY backend ./
RUN pip check

# --- Финальный образ ---
FROM python:3.11-slim
WORKDIR /app

# Копируем бэкенд
COPY --from=backend-build /app/backend ./backend
RUN pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host=files.pythonhosted.org -r backend/requirements.txt
RUN pip check

# Копируем фронтенд-статику
COPY --from=frontend-build /app/frontend/build ./frontend_build

# Устанавливаем nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Устанавливаем bash
RUN apt-get update && apt-get install -y bash

# Копируем nginx конфиг
COPY nginx.conf /etc/nginx/nginx.conf

# Копируем скрипт запуска
COPY run.sh /run.sh
RUN chmod +x /run.sh

# Открываем порты
EXPOSE 80
EXPOSE 8000

CMD ["/bin/bash", "/run.sh"] 