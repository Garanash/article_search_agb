from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from core.database import get_db
from core.auth import get_current_user
from api.v1.crud import *
from api.v1.schemas import *
from api.v1.models import User

router = APIRouter()

@router.get("/news/", response_model=List[NewsResponse])
def get_news(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получение списка новостей"""
    from api.v1.crud import get_news_list
    return get_news_list(db=db, skip=skip, limit=limit, category=category)

@router.get("/news/{news_id}", response_model=NewsResponse)
def get_news_item(
    news_id: int,
    db: Session = Depends(get_db)
):
    """Получение конкретной новости"""
    from api.v1.crud import get_news
    news = get_news(db=db, news_id=news_id)
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Новость не найдена"
        )
    return news
