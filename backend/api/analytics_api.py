from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, Analytics
from app.schemas import AnalyticsOut
from app import auth
from app import crud

get_current_user = auth.get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/", response_model=List[AnalyticsOut])
def get_analytics(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Получить аналитику для текущего пользователя"""
    # Получаем аналитику пользователя
    user_analytics = crud.get_analytics(db, current_user.id)
    
    # Преобразуем в формат для фронтенда
    analytics_data = []
    for analytics in user_analytics:
        analytics_data.append({
            "id": analytics.id,
            "action": analytics.action,
            "timestamp": analytics.timestamp.isoformat() if analytics.timestamp else "",
            "details": analytics.details
        })
    
    return analytics_data

@router.get("/admin/all")
def get_all_analytics(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Получить всю аналитику (только для администраторов)"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Доступ запрещен"
        )
    
    # Получаем всю аналитику
    all_analytics = db.query(Analytics).join(User).order_by(Analytics.timestamp.desc()).all()
    
    analytics_data = []
    for analytics in all_analytics:
        analytics_data.append({
            "id": analytics.id,
            "user_id": analytics.user_id,
            "username": analytics.user.username,
            "action": analytics.action,
            "timestamp": analytics.timestamp.isoformat() if analytics.timestamp else "",
            "details": analytics.details
        })
    
    return analytics_data

@router.get("/admin/user/{user_id}")
def get_user_analytics(
    user_id: int,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Получить аналитику конкретного пользователя (только для администраторов)"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Доступ запрещен"
        )
    
    # Получаем аналитику пользователя
    user_analytics = crud.get_analytics(db, user_id)
    
    analytics_data = []
    for analytics in user_analytics:
        analytics_data.append({
            "id": analytics.id,
            "action": analytics.action,
            "timestamp": analytics.timestamp.isoformat() if analytics.timestamp else "",
            "details": analytics.details
        })
    
    return analytics_data 