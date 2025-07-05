from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, SupportTicket, SupportEvent
from ..schemas import UserResponse
from ..auth import get_current_user
from sqlalchemy import func, and_

router = APIRouter(prefix="/admin/dashboard", tags=["admin-dashboard"])

@router.get("/users/stats")
def get_users_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить статистику пользователей"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администраторы могут просматривать статистику")
    
    # Общее количество пользователей
    total_users = db.query(User).count()
    
    # Пользователи по ролям
    users_by_role = db.query(
        User.role,
        func.count(User.id).label('count')
    ).group_by(User.role).all()
    
    # Новые пользователи за последние 30 дней
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_users = db.query(User).filter(User.created_at >= thirty_days_ago).count()
    
    return {
        "total_users": total_users,
        "users_by_role": {role: count for role, count in users_by_role},
        "new_users_30_days": new_users
    }

@router.get("/tickets/stats")
def get_tickets_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить статистику тикетов"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администраторы могут просматривать статистику")
    
    # Общая статистика тикетов
    total_tickets = db.query(SupportTicket).count()
    open_tickets = db.query(SupportTicket).filter(SupportTicket.status == "open").count()
    in_progress_tickets = db.query(SupportTicket).filter(SupportTicket.status == "in_progress").count()
    resolved_tickets = db.query(SupportTicket).filter(SupportTicket.status == "resolved").count()
    closed_tickets = db.query(SupportTicket).filter(SupportTicket.status == "closed").count()
    
    # Текеты по приоритетам
    tickets_by_priority = db.query(
        SupportTicket.priority,
        func.count(SupportTicket.id).label('count')
    ).group_by(SupportTicket.priority).all()
    
    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "in_progress_tickets": in_progress_tickets,
        "resolved_tickets": resolved_tickets,
        "closed_tickets": closed_tickets,
        "tickets_by_priority": {priority: count for priority, count in tickets_by_priority}
    }

@router.get("/events/upcoming")
def get_upcoming_events(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить ближайшие события"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администраторы могут просматривать события")
    
    end_date = datetime.utcnow() + timedelta(days=days)
    
    # Ближайшие события
    upcoming_events = db.query(SupportEvent).filter(
        and_(
            SupportEvent.event_date >= datetime.utcnow(),
            SupportEvent.event_date <= end_date,
            SupportEvent.event_type.in_(["deadline", "milestone"])
        )
    ).order_by(SupportEvent.event_date).limit(10).all()
    
    events = []
    for event in upcoming_events:
        event_date = event.start_date or event.event_date
        if event_date:
            events.append({
                "id": event.id,
                "title": event.title,
                "description": event.description,
                "event_date": event_date,
                "event_type": event.event_type,
                "is_completed": event.is_completed,
                "ticket_id": event.ticket_id
            })
    
    return sorted(events, key=lambda x: x["event_date"])[:10]

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить всех пользователей"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администраторы могут просматривать пользователей")
    
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Изменить роль пользователя"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администраторы могут изменять роли")
    
    if role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Недопустимая роль")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Нельзя изменить роль самому себе
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя изменить свою собственную роль")
    
    user.role = role
    db.commit()
    db.refresh(user)
    
    return {"message": f"Роль пользователя {user.username} изменена на {role}"}

@router.get("/overview")
def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить общий обзор дашборда"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администраторы могут просматривать дашборд")
    
    # Статистика пользователей
    total_users = db.query(User).count()
    admin_users = db.query(User).filter(User.role == "admin").count()
    regular_users = total_users - admin_users
    
    # Статистика тикетов
    total_tickets = db.query(SupportTicket).count()
    open_tickets = db.query(SupportTicket).filter(SupportTicket.status == "open").count()
    urgent_tickets = db.query(SupportTicket).filter(
        SupportTicket.priority == "urgent",
        SupportTicket.status.in_(["open", "in_progress"])
    ).count()
    
    # Ближайшие дедлайны (следующие 3 дня)
    three_days_from_now = datetime.utcnow() + timedelta(days=3)
    upcoming_deadlines = db.query(SupportEvent).filter(
        and_(
            SupportEvent.event_type == "deadline",
            SupportEvent.event_date >= datetime.utcnow(),
            SupportEvent.event_date <= three_days_from_now,
            SupportEvent.is_completed == False
        )
    ).count()
    
    return {
        "users": {
            "total": total_users,
            "admins": admin_users,
            "regular": regular_users
        },
        "tickets": {
            "total": total_tickets,
            "open": open_tickets,
            "urgent": urgent_tickets
        },
        "deadlines": {
            "upcoming_3_days": upcoming_deadlines
        }
    } 