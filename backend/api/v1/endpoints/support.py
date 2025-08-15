from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from core.database import get_db
from core.auth import get_current_user
from api.v1.crud import *
from api.v1.schemas import *
from api.v1.models import User

router = APIRouter()

@router.get("/support-tickets/", response_model=List[SupportTicketResponse])
async def get_support_tickets(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка тикетов поддержки"""
    return get_support_tickets(db=db, skip=skip, limit=limit, user_id=current_user.id)

@router.get("/support-tickets/{ticket_id}", response_model=SupportTicketResponse)
async def get_support_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение конкретного тикета поддержки"""
    ticket = get_support_ticket(db=db, ticket_id=ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тикет не найден"
        )
    
    # Проверяем права доступа
    if ticket.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра этого тикета"
        )
    
    return ticket

@router.post("/support-tickets/", response_model=SupportTicketResponse)
async def create_support_ticket(
    ticket: SupportTicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание нового тикета поддержки"""
    return create_support_ticket(db=db, ticket=ticket, user_id=current_user.id)

@router.put("/support-tickets/{ticket_id}", response_model=SupportTicketResponse)
async def update_support_ticket(
    ticket_id: int,
    ticket_update: SupportTicketUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновление тикета поддержки"""
    ticket = get_support_ticket(db=db, ticket_id=ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тикет не найден"
        )
    
    # Проверяем права доступа
    if ticket.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для редактирования этого тикета"
        )
    
    updated_ticket = update_support_ticket(db=db, ticket_id=ticket_id, ticket_update=ticket_update)
    if not updated_ticket:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при обновлении тикета"
        )
    
    return updated_ticket

@router.delete("/support-tickets/{ticket_id}")
async def delete_support_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удаление тикета поддержки"""
    ticket = get_support_ticket(db=db, ticket_id=ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тикет не найден"
        )
    
    # Проверяем права доступа
    if ticket.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для удаления этого тикета"
        )
    
    success = delete_support_ticket(db=db, ticket_id=ticket_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при удалении тикета"
        )
    
    return {"message": "Тикет успешно удален"}
