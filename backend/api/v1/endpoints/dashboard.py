from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from core.database import get_db
from core.auth import get_current_user
from api.v1.crud import *
from api.v1.schemas import *
from api.v1.models import User

router = APIRouter()

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение статистики для дашборда"""
    # Базовая статистика для всех пользователей
    user_stats = {
        "total_articles": 0,
        "total_documents": 0,
        "total_tickets": 0,
        "open_tickets": 0
    }
    
    # Если админ, показываем общую статистику
    if current_user.role == "admin":
        admin_stats = get_admin_stats(db=db)
        user_stats.update(admin_stats)
    
    return user_stats

@router.get("/dashboard/recent-activity")
async def get_recent_activity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение последней активности"""
    # Здесь должна быть логика получения последней активности
    # Пока возвращаем пустой список
    return []
