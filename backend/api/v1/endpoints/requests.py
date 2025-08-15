from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from core.database import get_db
from core.auth import get_current_user
from api.v1.crud import *
from api.v1.schemas import *
from api.v1.models import User

router = APIRouter()

@router.get("/requests/", response_model=List[RequestOut])
def get_requests(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка заявок"""
    from api.v1.crud import get_requests as crud_get_requests
    return crud_get_requests(db=db, skip=skip, limit=limit, user_id=current_user.id)

@router.get("/requests/{request_id}", response_model=RequestOut)
def get_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение конкретной заявки"""
    request = get_request(db=db, request_id=request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена"
        )
    
    # Проверяем права доступа
    if request.requester_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра этой заявки"
        )
    
    return request

@router.post("/requests/", response_model=RequestOut)
async def create_request(
    request: RequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание новой заявки"""
    return create_request(db=db, request=request, requester_id=current_user.id)

@router.post("/requests/{request_id}/articles/{article_id}")
async def add_article_to_request(
    request_id: int,
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Добавление артикула к запросу"""
    # Здесь можно добавить логику добавления артикула к запросу
    return {"message": "Article added to request successfully"}
