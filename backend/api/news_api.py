from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import User
from app import auth
from pydantic import BaseModel

router = APIRouter(prefix="/news", tags=["news"])

class NewsBase(BaseModel):
    title: str
    text: str
    image_url: Optional[str] = None

class NewsCreate(NewsBase):
    pass

class NewsUpdate(NewsBase):
    pass

class NewsOut(NewsBase):
    id: int
    created_at: datetime
    updated_at: datetime
    author_id: int

@router.get("/", response_model=List[NewsOut])
def get_news(db: Session = Depends(get_db)):
    news = db.execute("SELECT * FROM news ORDER BY created_at DESC").fetchall()
    return [dict(row) for row in news]

@router.post("/", response_model=NewsOut)
def create_news(news: NewsCreate, current_user: User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    result = db.execute(
        "INSERT INTO news (title, text, image_url, created_at, updated_at, author_id) VALUES (:title, :text, :image_url, :created_at, :updated_at, :author_id) RETURNING *",
        {"title": news.title, "text": news.text, "image_url": news.image_url, "created_at": now, "updated_at": now, "author_id": current_user.id}
    )
    db.commit()
    return dict(result.fetchone())

@router.get("/{news_id}", response_model=NewsOut)
def get_one_news(news_id: int, db: Session = Depends(get_db)):
    row = db.execute("SELECT * FROM news WHERE id=:id", {"id": news_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    return dict(row)

@router.put("/{news_id}", response_model=NewsOut)
def update_news(news_id: int, news: NewsUpdate, current_user: User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    row = db.execute("SELECT * FROM news WHERE id=:id", {"id": news_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    db.execute(
        "UPDATE news SET title=:title, text=:text, image_url=:image_url, updated_at=:updated_at WHERE id=:id",
        {"title": news.title, "text": news.text, "image_url": news.image_url, "updated_at": now, "id": news_id}
    )
    db.commit()
    row = db.execute("SELECT * FROM news WHERE id=:id", {"id": news_id}).fetchone()
    return dict(row)

@router.delete("/{news_id}")
def delete_news(news_id: int, current_user: User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db.execute("DELETE FROM news WHERE id=:id", {"id": news_id})
    db.commit()
    return {"ok": True} 