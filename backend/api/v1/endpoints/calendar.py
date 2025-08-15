from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from core.database import get_db
from core.auth import get_current_user
from api.v1.crud import *
from api.v1.schemas import *
from api.v1.models import User

router = APIRouter()

@router.get("/events/", response_model=List[CalendarEventResponse])
def get_calendar_events(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка календарных событий"""
    # Пользователи могут видеть только свои события, админы - все
    if not current_user.role == "admin":
        user_id = current_user.id
    
    from api.v1.crud import get_calendar_events as crud_get_calendar_events
    return crud_get_calendar_events(
        db=db, 
        skip=skip, 
        limit=limit, 
        user_id=user_id,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/events/{event_id}", response_model=CalendarEventResponse)
def get_calendar_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение конкретного календарного события"""
    event = get_calendar_event(db=db, event_id=event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Событие не найдено"
        )
    
    # Проверяем права доступа
    if event.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра этого события"
        )
    
    return event

@router.post("/events/", response_model=CalendarEventResponse)
async def create_calendar_event(
    event: CalendarEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание нового календарного события"""
    return create_calendar_event(db=db, event=event, created_by=current_user.id)

@router.put("/events/{event_id}", response_model=CalendarEventResponse)
async def update_calendar_event(
    event_id: int,
    event_update: CalendarEventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновление календарного события"""
    event = get_calendar_event(db=db, event_id=event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Событие не найдено"
        )
    
    # Проверяем права доступа
    if event.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для редактирования этого события"
        )
    
    updated_event = update_calendar_event(db=db, event_id=event_id, event_update=event_update)
    if not updated_event:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при обновлении события"
        )
    
    return updated_event

@router.delete("/events/{event_id}")
async def delete_calendar_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удаление календарного события"""
    event = get_calendar_event(db=db, event_id=event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Событие не найдено"
        )
    
    # Проверяем права доступа
    if event.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для удаления этого события"
        )
    
    success = delete_calendar_event(db=db, event_id=event_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при удалении события"
        )
    
    return {"message": "Событие успешно удалено"}

@router.get("/events/user/{user_id}", response_model=List[CalendarEventResponse])
async def get_user_calendar_events(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение календарных событий конкретного пользователя"""
    # Проверяем права доступа
    if user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра событий другого пользователя"
        )
    
    return get_calendar_events(db=db, skip=skip, limit=limit, user_id=user_id)
