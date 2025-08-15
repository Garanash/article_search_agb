from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from core.database import get_db
from core.auth import get_current_user
from api.v1.crud import *
from api.v1.schemas import *
from api.v1.models import User

router = APIRouter()

@router.get("/support_tickets/", response_model=List[SupportTicketResponse])
def get_support_tickets(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка тикетов поддержки"""
    from api.v1.crud import get_support_tickets as crud_get_support_tickets
    if current_user.role == "admin":
        tickets = crud_get_support_tickets(db=db, skip=skip, limit=limit)
    else:
        tickets = crud_get_support_tickets(db=db, skip=skip, limit=limit, user_id=current_user.id)
    return tickets

@router.post("/support_tickets/", response_model=SupportTicketResponse)
async def create_support_ticket(
    ticket: SupportTicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание нового тикета поддержки"""
    return create_support_ticket(db=db, ticket=ticket, user_id=current_user.id)

@router.put("/support_tickets/{ticket_id}", response_model=SupportTicketResponse)
async def update_support_ticket(
    ticket_id: int,
    ticket_update: SupportTicketUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновление тикета поддержки"""
    ticket = get_support_ticket(db=db, ticket_id=ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return update_support_ticket(db=db, ticket_id=ticket_id, ticket_update=ticket_update)

@router.post("/support_tickets/{ticket_id}/comments", response_model=CommentResponse)
async def add_comment_to_ticket(
    ticket_id: int,
    comment: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Добавление комментария к тикету"""
    ticket = get_support_ticket(db=db, ticket_id=ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return create_comment(db=db, comment=comment, user_id=current_user.id, ticket_id=ticket_id)
