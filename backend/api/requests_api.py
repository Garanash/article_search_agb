from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import User, Request, Article
from app.schemas import RequestOut, RequestCreate, ArticleOut
from app import auth
from app import crud

get_current_user = auth.get_current_user

router = APIRouter(prefix="/requests", tags=["requests"])

@router.post("/", response_model=RequestOut)
def create_request(
    req: RequestCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Создать новый запрос"""
    request = Request(number=req.number, user_id=current_user.id)
    db.add(request)
    
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Запрос с таким номером уже существует"
        )
    
    db.refresh(request)
    
    # Записываем аналитику
    crud.add_analytics(db, current_user.id, "Создан запрос", f"Номер запроса: {req.number}")
    
    return {
        "id": request.id,
        "number": request.number,
        "created_at": request.created_at.isoformat()
    }

@router.get("/", response_model=List[RequestOut])
def get_requests(db: Session = Depends(get_db)):
    """Получить все запросы"""
    requests = db.query(Request).all()
    return [
        {
            "id": req.id,
            "number": req.number,
            "created_at": req.created_at.isoformat() if req.created_at else None
        }
        for req in requests
    ]

@router.delete("/{request_id}")
def delete_request(
    request_id: int, 
    db: Session = Depends(get_db)
):
    """Удалить запрос"""
    # Сбросить request_id у всех артикулов
    db.query(Article).filter(Article.request_id == request_id).update({Article.request_id: None})
    
    # Удалить сам запрос
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Запрос не найден")
    
    db.delete(request)
    db.commit()
    
    return {"status": "deleted"}

@router.post("/{request_id}/add-article/{article_id}")
def add_article_to_request(
    request_id: int, 
    article_id: int, 
    db: Session = Depends(get_db)
):
    """Добавить артикул в запрос"""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Артикул не найден")
    
    article.request_id = request_id
    db.commit()
    
    return {"status": "added"}

@router.post("/{request_id}/remove-article/{article_id}")
def remove_article_from_request(
    request_id: int, 
    article_id: int, 
    db: Session = Depends(get_db)
):
    """Удалить артикул из запроса"""
    article = db.query(Article).filter(
        Article.id == article_id, 
        Article.request_id == request_id
    ).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Артикул не найден в этом запросе")
    
    article.request_id = None
    db.commit()
    
    return {"status": "removed"}

@router.get("/{request_id}/articles", response_model=List[ArticleOut])
def get_articles_by_request(
    request_id: int, 
    db: Session = Depends(get_db)
):
    """Получить артикулы по запросу"""
    articles = db.query(Article).filter(Article.request_id == request_id).all()
    return [
        {
            "id": a.id,
            "code": a.code,
            "request_id": a.request_id
        }
        for a in articles
    ] 