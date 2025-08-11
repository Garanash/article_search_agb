from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import User
from app.auth import get_current_user
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# Модели для API
class NewsCreate(BaseModel):
    title: str
    content: str
    type: str = "info"  # info, warning, success, error

class NewsResponse(BaseModel):
    id: int
    title: str
    content: str
    author: str
    type: str
    created_at: datetime

class EventCreate(BaseModel):
    title: str
    description: str
    date: datetime
    type: str = "event"  # meeting, deadline, event, holiday

class EventResponse(BaseModel):
    id: int
    title: str
    description: str
    date: datetime
    type: str
    created_at: datetime

# Временные данные (в реальном проекте это должно быть в базе данных)
# Для демонстрации используем в памяти
news_data = [
    {
        "id": 1,
        "title": "Обновление системы",
        "content": "Запланировано техническое обслуживание системы на 25 января 2025 с 02:00 до 04:00. В это время доступ к некоторым функциям может быть ограничен.",
        "author": "Администратор",
        "type": "warning",
        "created_at": "2025-01-20T10:00:00"
    },
    {
        "id": 2,
        "title": "Новые возможности платформы",
        "content": "Добавлен новый дашборд пользователя с улучшенным интерфейсом, системой обращений и календарем событий. Ознакомьтесь с новым функционалом!",
        "author": "Команда разработки",
        "type": "success",
        "created_at": "2025-01-19T14:30:00"
    },
    {
        "id": 3,
        "title": "Изменения в политике безопасности",
        "content": "С 1 февраля 2025 года вводятся новые требования к паролям. Убедитесь, что ваш пароль соответствует требованиям безопасности.",
        "author": "Служба безопасности",
        "type": "info",
        "created_at": "2025-01-18T09:15:00"
    },
    {
        "id": 4,
        "title": "Собрание отдела",
        "content": "Еженедельное собрание отдела состоится 22 января в 15:00 в конференц-зале. Повестка дня: обсуждение текущих проектов и планов на следующую неделю.",
        "author": "HR отдел",
        "type": "info",
        "created_at": "2025-01-17T16:45:00"
    }
]

events_data = [
    {
        "id": 1,
        "title": "Встреча с клиентом",
        "description": "Презентация нового продукта для ключевого клиента",
        "date": "2025-01-22T14:00:00",
        "type": "meeting",
        "created_at": "2025-01-20T10:00:00"
    },
    {
        "id": 2,
        "title": "Дедлайн проекта Alpha",
        "description": "Финальная сдача проекта Alpha",
        "date": "2025-01-25T18:00:00",
        "type": "deadline",
        "created_at": "2025-01-20T10:00:00"
    },
    {
        "id": 3,
        "title": "День рождения компании",
        "description": "Празднование 10-летия компании",
        "date": "2025-01-30T12:00:00",
        "type": "holiday",
        "created_at": "2025-01-20T10:00:00"
    },
    {
        "id": 4,
        "title": "Тренинг по безопасности",
        "description": "Обучение сотрудников основам кибербезопасности",
        "date": "2025-01-28T10:00:00",
        "type": "event",
        "created_at": "2025-01-20T10:00:00"
    },
    {
        "id": 5,
        "title": "Планерка отдела",
        "description": "Еженедельная планерка отдела разработки",
        "date": "2025-01-24T09:00:00",
        "type": "meeting",
        "created_at": "2025-01-20T10:00:00"
    },
    {
        "id": 6,
        "title": "Техническое обслуживание",
        "description": "Плановое обслуживание серверов",
        "date": "2025-01-25T02:00:00",
        "type": "event",
        "created_at": "2025-01-20T10:00:00"
    }
]

@router.get("/news", response_model=List[NewsResponse])
async def get_news(
    limit: Optional[int] = 10,
    current_user: User = Depends(get_current_user)
):
    """Получить список новостей"""
    try:
        # Сортируем по дате создания (новые сначала)
        sorted_news = sorted(news_data, key=lambda x: x["created_at"], reverse=True)
        return sorted_news[:limit] if limit else sorted_news
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения новостей: {str(e)}")

@router.post("/news", response_model=NewsResponse)
async def create_news(
    news: NewsCreate,
    current_user: User = Depends(get_current_user)
):
    """Создать новость (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    try:
        new_news = {
            "id": len(news_data) + 1,
            "title": news.title,
            "content": news.content,
            "author": current_user.username,
            "type": news.type,
            "created_at": datetime.now().isoformat()
        }
        news_data.append(new_news)
        return new_news
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка создания новости: {str(e)}")

@router.get("/events", response_model=List[EventResponse])
async def get_events(
    limit: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """Получить список событий"""
    try:
        # Сортируем по дате события
        sorted_events = sorted(events_data, key=lambda x: x["date"])
        return sorted_events[:limit] if limit else sorted_events
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения событий: {str(e)}")

@router.post("/events", response_model=EventResponse)
async def create_event(
    event: EventCreate,
    current_user: User = Depends(get_current_user)
):
    """Создать событие (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    try:
        new_event = {
            "id": len(events_data) + 1,
            "title": event.title,
            "description": event.description,
            "date": event.date.isoformat(),
            "type": event.type,
            "created_at": datetime.now().isoformat()
        }
        events_data.append(new_event)
        return new_event
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка создания события: {str(e)}")

@router.delete("/news/{news_id}")
async def delete_news(
    news_id: int,
    current_user: User = Depends(get_current_user)
):
    """Удалить новость (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    try:
        global news_data
        news_data = [news for news in news_data if news["id"] != news_id]
        return {"message": "Новость удалена"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления новости: {str(e)}")

@router.delete("/events/{event_id}")
async def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_user)
):
    """Удалить событие (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    try:
        global events_data
        events_data = [event for event in events_data if event["id"] != event_id]
        return {"message": "Событие удалено"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления события: {str(e)}")
