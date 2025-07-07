# Деплой приложения в Docker

## Быстрый старт

1. **Соберите образ:**

```bash
docker build -t article_search_agb .
```

2. **Запустите контейнер:**

```bash
docker run -d --name article_search_agb -p 80:80 --restart unless-stopped article_search_agb
```

3. **Весь процесс запуска автоматизирован в run.sh**

---

## Описание архитектуры
- **nginx** отдаёт фронт (React) и проксирует /api/ на FastAPI backend
- **backend** (FastAPI + uvicorn, 4 воркера, можно увеличить)
- **frontend** (React, статика)

---

## Масштабирование и нагрузка
- Конфиг nginx и uvicorn оптимизирован для 100+ одновременных пользователей
- Для большей нагрузки увеличьте `--workers` в run.sh и worker_connections в nginx.conf
- Для продакшн используйте сервер с 2+ CPU и 2+ ГБ RAM

---

## Переменные окружения
- Можно использовать .env для backend (уже поддерживается)
- Для HTTPS настройте nginx.conf и пробросьте сертификаты внутрь контейнера

---

## Логи
- backend: /app/backend.log внутри контейнера
- nginx: стандартные логи /var/log/nginx/

---

## Обновление
1. Остановите контейнер: `docker stop article_search_agb && docker rm article_search_agb`
2. Пересоберите образ: `docker build -t article_search_agb .`
3. Запустите снова (см. выше) 