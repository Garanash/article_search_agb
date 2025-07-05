from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models import SupportTicket, SupportEvent, User
from ..schemas import (
    SupportTicketCreate, SupportTicketResponse, SupportTicketUpdate,
    SupportEventCreate, SupportEventResponse, SupportEventUpdate,
    SupportAnalytics, CalendarEvent
)
from ..auth import get_current_user

router = APIRouter(prefix="/support_tickets", tags=["support-tickets"])

@router.post("/", response_model=SupportTicketResponse)
def create_ticket(
    ticket: SupportTicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать новое обращение"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администраторы могут создавать обращения")
    
    db_ticket = SupportTicket(
        user_id=ticket.user_id or current_user.id,
        title=ticket.title,
        description=ticket.description,
        department=ticket.department,
        priority=ticket.priority,
        assigned_to=current_user.id
    )
    
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    
    # Добавляем информацию о пользователях
    db_ticket.user_username = db.query(User).filter(User.id == db_ticket.user_id).first().username
    if db_ticket.assigned_to:
        assigned_admin = db.query(User).filter(User.id == db_ticket.assigned_to).first()
        db_ticket.assigned_admin_username = assigned_admin.username if assigned_admin else None
    
    return db_ticket

@router.get("/", response_model=List[SupportTicketResponse])
def get_tickets(
    status: Optional[str] = None,
    department: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить список обращений"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администраторы могут просматривать обращения")
    
    query = db.query(SupportTicket)
    
    if status:
        query = query.filter(SupportTicket.status == status)
    if department:
        query = query.filter(SupportTicket.department == department)
    if priority:
        query = query.filter(SupportTicket.priority == priority)
    
    tickets = query.order_by(SupportTicket.created_at.desc()).all()
    
    # Добавляем информацию о пользователях
    for ticket in tickets:
        ticket.user_username = db.query(User).filter(User.id == ticket.user_id).first().username
        if ticket.assigned_to:
            assigned_admin = db.query(User).filter(User.id == ticket.assigned_to).first()
            ticket.assigned_admin_username = assigned_admin.username if assigned_admin else None
    
    return tickets

@router.get("/{ticket_id}", response_model=SupportTicketResponse)
def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить конкретное обращение"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администраторы могут просматривать обращения")
    
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Обращение не найдено")
    
    # Добавляем информацию о пользователях
    ticket.user_username = db.query(User).filter(User.id == ticket.user_id).first().username
    if ticket.assigned_to:
        assigned_admin = db.query(User).filter(User.id == ticket.assigned_to).first()
        ticket.assigned_admin_username = assigned_admin.username if assigned_admin else None
    
    return ticket

@router.put("/{ticket_id}", response_model=SupportTicketResponse)
def update_ticket(
    ticket_id: int,
    ticket_update: SupportTicketUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить обращение"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администраторы могут обновлять обращения")
    
    db_ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Обращение не найдено")
    
    # Обновляем поля
    update_data = ticket_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_ticket, field, value)
    
    # Обновляем статус и временные метки
    if ticket_update.status:
        if ticket_update.status == "resolved" and not db_ticket.resolved_at:
            db_ticket.resolved_at = datetime.utcnow()
        elif ticket_update.status == "closed" and not db_ticket.closed_at:
            db_ticket.closed_at = datetime.utcnow()
    
    db_ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_ticket)
    
    # Добавляем информацию о пользователях
    db_ticket.user_username = db.query(User).filter(User.id == db_ticket.user_id).first().username
    if db_ticket.assigned_to:
        assigned_admin = db.query(User).filter(User.id == db_ticket.assigned_to).first()
        db_ticket.assigned_admin_username = assigned_admin.username if assigned_admin else None
    
    return db_ticket

@router.post("/{ticket_id}/close")
def close_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Закрыть обращение"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администраторы могут закрывать обращения")
    
    db_ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Обращение не найдено")
    
    db_ticket.status = "closed"
    db_ticket.closed_at = datetime.utcnow()
    db_ticket.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Обращение закрыто"}

@router.post("/{ticket_id}/events", response_model=SupportEventResponse)
def create_event(
    ticket_id: int,
    event: SupportEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать событие для обращения или общее событие (ticket_id=None)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администраторы могут создавать события")
    
    if ticket_id == 0:
        db_event = SupportEvent(
            ticket_id=None,
            event_type=event.event_type,
            title=event.title,
            description=event.description,
            event_date=event.event_date or event.start_date or event.end_date,
            start_date=event.start_date,
            end_date=event.end_date
        )
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return db_event
    # Проверяем существование обращения
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Обращение не найдено")
    db_event = SupportEvent(
        ticket_id=ticket_id,
        event_type=event.event_type,
        title=event.title,
        description=event.description,
        event_date=event.event_date or event.start_date or event.end_date,
        start_date=event.start_date,
        end_date=event.end_date
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.get("/{ticket_id}/events", response_model=List[SupportEventResponse])
def get_ticket_events(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить события обращения"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администраторы могут просматривать события")
    
    events = db.query(SupportEvent).filter(SupportEvent.ticket_id == ticket_id).order_by(SupportEvent.event_date).all()
    return events

@router.put("/events/{event_id}", response_model=SupportEventResponse)
def update_event(
    event_id: int,
    event_update: SupportEventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить событие"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администраторы могут обновлять события")
    
    db_event = db.query(SupportEvent).filter(SupportEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    
    update_data = event_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_event, field, value)
    # Для совместимости
    if 'start_date' in update_data or 'end_date' in update_data:
        db_event.event_date = update_data.get('start_date') or update_data.get('end_date') or db_event.event_date
    
    db.commit()
    db.refresh(db_event)
    
    return db_event

@router.get("/calendar/events", response_model=List[CalendarEvent])
def get_calendar_events(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить события для календаря"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администраторы могут просматривать календарь")
    
    query = db.query(SupportEvent)
    
    if start_date:
        query = query.filter((SupportEvent.start_date >= start_date) | (SupportEvent.event_date >= start_date))
    if end_date:
        query = query.filter((SupportEvent.end_date <= end_date) | (SupportEvent.event_date <= end_date))
    
    events = query.order_by(SupportEvent.start_date, SupportEvent.event_date).all()
    
    # Преобразуем в формат календаря
    calendar_events = []
    for event in events:
        calendar_events.append(CalendarEvent(
            id=event.id,
            title=event.title,
            description=event.description,
            event_date=event.event_date,
            start_date=event.start_date,
            end_date=event.end_date,
            event_type=event.event_type,
            ticket_id=event.ticket_id,
            is_completed=event.is_completed
        ))
    
    return calendar_events

@router.get("/analytics/overview", response_model=SupportAnalytics)
def get_support_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить аналитику по обращениям"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администраторы могут просматривать аналитику")
    
    # Общая статистика
    total_tickets = db.query(SupportTicket).count()
    open_tickets = db.query(SupportTicket).filter(SupportTicket.status == "open").count()
    closed_tickets = db.query(SupportTicket).filter(SupportTicket.status == "closed").count()
    in_progress_tickets = db.query(SupportTicket).filter(SupportTicket.status == "in_progress").count()
    resolved_tickets = db.query(SupportTicket).filter(SupportTicket.status == "resolved").count()
    
    # Статистика по департаментам
    tickets_by_department = {}
    departments = db.query(SupportTicket.department).distinct().all()
    for dept in departments:
        if dept[0]:
            count = db.query(SupportTicket).filter(SupportTicket.department == dept[0]).count()
            tickets_by_department[dept[0]] = count
    
    # Статистика по приоритетам
    tickets_by_priority = {}
    priorities = db.query(SupportTicket.priority).distinct().all()
    for priority in priorities:
        if priority[0]:
            count = db.query(SupportTicket).filter(SupportTicket.priority == priority[0]).count()
            tickets_by_priority[priority[0]] = count
    
    # Статистика по статусам
    tickets_by_status = {
        "open": open_tickets,
        "in_progress": in_progress_tickets,
        "resolved": resolved_tickets,
        "closed": closed_tickets
    }
    
    # Среднее время ответа и решения
    resolved_tickets_with_response = db.query(SupportTicket).filter(
        SupportTicket.first_response_at.isnot(None),
        SupportTicket.resolved_at.isnot(None)
    ).all()
    
    average_response_time_hours = None
    average_resolution_time_hours = None
    
    if resolved_tickets_with_response:
        total_response_time = timedelta()
        total_resolution_time = timedelta()
        
        for ticket in resolved_tickets_with_response:
            if ticket.first_response_at and ticket.created_at:
                response_time = ticket.first_response_at - ticket.created_at
                total_response_time += response_time
            
            if ticket.resolved_at and ticket.created_at:
                resolution_time = ticket.resolved_at - ticket.created_at
                total_resolution_time += resolution_time
        
        if total_response_time:
            average_response_time_hours = total_response_time.total_seconds() / 3600 / len(resolved_tickets_with_response)
        if total_resolution_time:
            average_resolution_time_hours = total_resolution_time.total_seconds() / 3600 / len(resolved_tickets_with_response)
    
    return SupportAnalytics(
        total_tickets=total_tickets,
        open_tickets=open_tickets,
        closed_tickets=closed_tickets,
        in_progress_tickets=in_progress_tickets,
        resolved_tickets=resolved_tickets,
        average_response_time_hours=average_response_time_hours,
        average_resolution_time_hours=average_resolution_time_hours,
        tickets_by_department=tickets_by_department,
        tickets_by_priority=tickets_by_priority,
        tickets_by_status=tickets_by_status
    ) 