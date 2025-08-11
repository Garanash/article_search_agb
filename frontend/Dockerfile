# Стадия 1: Кеширование зависимостей
FROM node:20-alpine as deps
WORKDIR /app

# Копируем только файлы с зависимостями для лучшего кеширования
COPY package.json package-lock.json ./
RUN npm config set strict-ssl false && \
    npm ci --only=production --no-audit --no-fund

# Стадия 2: Установка всех зависимостей (включая dev)
FROM node:20-alpine as deps-full
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm config set strict-ssl false && \
    npm ci --no-audit --no-fund

# Стадия 3: Сборка приложения
FROM node:20-alpine as build
WORKDIR /app

# Копируем зависимости из предыдущей стадии
COPY --from=deps-full /app/node_modules ./node_modules
COPY . .

# Сборка с оптимизацией
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV DISABLE_ESLINT_PLUGIN=true
RUN npm run build

# Стадия 4: Production образ
FROM nginx:alpine
# Устанавливаем dumb-init для правильной обработки сигналов
RUN apk add dumb-init

# Копируем только собранные файлы
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

# Создаем необходимые директории и настраиваем права
RUN mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/cache/nginx/proxy_temp && \
    mkdir -p /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp && \
    mkdir -p /var/cache/nginx/scgi_temp && \
    mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /var/cache/nginx && \
    chmod -R 755 /var/log/nginx

EXPOSE 80
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"] 