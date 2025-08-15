from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from core.database import get_db
from core.auth import get_current_user
from api.v1.crud import *
from api.v1.schemas import *
from api.v1.models import User

router = APIRouter()

@router.get("/articles/", response_model=List[ArticleOut])
def get_articles(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получение списка статей"""
    from api.v1.crud import get_articles as crud_get_articles
    return crud_get_articles(db=db, skip=skip, limit=limit, category=category)

@router.get("/articles/{article_id}", response_model=ArticleOut)
def get_article(
    article_id: int,
    db: Session = Depends(get_db)
):
    """Получение конкретной статьи"""
    article = get_article(db=db, article_id=article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Статья не найдена"
        )
    return article

@router.post("/articles/", response_model=ArticleOut)
async def create_article(
    article: ArticleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание новой статьи"""
    return create_article(db=db, article=article, author_id=current_user.id)

@router.put("/articles/{article_id}", response_model=ArticleOut)
async def update_article(
    article_id: int,
    article_update: ArticleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновление статьи"""
    article = get_article(db=db, article_id=article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Статья не найдена"
        )
    
    # Проверяем права доступа
    if article.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для редактирования этой статьи"
        )
    
    updated_article = update_article(db=db, article_id=article_id, article_update=article_update)
    if not updated_article:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при обновлении статьи"
        )
    
    return updated_article

@router.delete("/articles/{article_id}")
async def delete_article(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удаление статьи"""
    article = get_article(db=db, article_id=article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Статья не найдена"
        )
    
    # Проверяем права доступа
    if article.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для удаления этой статьи"
        )
    
    success = delete_article(db=db, article_id=article_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при удалении статьи"
        )
    
    return {"message": "Статья успешно удалена"}

@router.get("/articles/{article_id}/suppliers")
async def get_article_suppliers(
    article_id: int,
    db: Session = Depends(get_db)
):
    """Получение поставщиков для артикула"""
    # Здесь можно добавить логику получения поставщиков
    # Пока возвращаем пустой список
    return []

@router.post("/articles/{article_id}/suppliers")
async def add_supplier_to_article(
    article_id: int,
    supplier: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Добавление поставщика к артикулу"""
    # Здесь можно добавить логику добавления поставщика
    return {"message": "Supplier added successfully"}
