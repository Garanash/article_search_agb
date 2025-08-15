from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Добавляем текущую директорию в Python path
sys.path.append('.')

# Создаем приложение FastAPI
app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Импортируем и регистрируем все API роутеры
from api.v1.endpoints.auth import router as auth_router
from api.v1.endpoints.articles import router as articles_router
from api.v1.endpoints.documents import router as documents_router
from api.v1.endpoints.support import router as support_router
from api.v1.endpoints.phone_directory import router as phone_directory_router
from api.v1.endpoints.admin import router as admin_router
from api.v1.endpoints.news import router as news_router
from api.v1.endpoints.calendar import router as calendar_router
from api.v1.endpoints.users import router as users_router
from api.v1.endpoints.suppliers import router as suppliers_router
from api.v1.endpoints.requests import router as requests_router
from api.v1.endpoints.analytics import router as analytics_router
from api.v1.endpoints.dashboard import router as dashboard_router
from api.v1.endpoints.support_tickets import router as support_tickets_router
from api.v1.endpoints.chat import router as chat_router

# Регистрируем все роутеры с префиксом /api
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(articles_router, prefix="/api", tags=["articles"])
app.include_router(documents_router, prefix="/api", tags=["documents"])
app.include_router(support_router, prefix="/api", tags=["support"])
app.include_router(phone_directory_router, prefix="/api", tags=["phone-directory"])
app.include_router(admin_router, prefix="/api", tags=["admin"])
app.include_router(news_router, prefix="/api", tags=["news"])
app.include_router(calendar_router, prefix="/api/calendar", tags=["calendar"])
app.include_router(users_router, prefix="/api", tags=["users"])
app.include_router(suppliers_router, prefix="/api", tags=["suppliers"])
app.include_router(requests_router, prefix="/api", tags=["requests"])
app.include_router(analytics_router, prefix="/api", tags=["analytics"])
app.include_router(dashboard_router, prefix="/api", tags=["dashboard"])
app.include_router(support_tickets_router, prefix="/api", tags=["support-tickets"])
app.include_router(chat_router, prefix="/api", tags=["chat"])

@app.get("/")
async def root():
    return {"message": "Article Search AGB Backend API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
