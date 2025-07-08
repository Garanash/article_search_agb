from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import User
from app import auth
from pydantic import BaseModel

router = APIRouter(prefix="/calendar/events", tags=["calendar"])

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime

class EventCreate(EventBase):
    pass

class EventUpdate(EventBase):
    pass

class EventOut(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: int

@router.get("/", response_model=List[EventOut])
def get_events(db: Session = Depends(get_db)):
    events = db.execute("SELECT * FROM calendar_events ORDER BY start_date DESC").fetchall()
    return [dict(row) for row in events]

@router.post("/", response_model=EventOut)
def create_event(event: EventCreate, current_user: User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    result = db.execute(
        "INSERT INTO calendar_events (title, description, start_date, end_date, created_at, updated_at, user_id) VALUES (:title, :description, :start_date, :end_date, :created_at, :updated_at, :user_id) RETURNING *",
        {"title": event.title, "description": event.description, "start_date": event.start_date, "end_date": event.end_date, "created_at": now, "updated_at": now, "user_id": current_user.id}
    )
    db.commit()
    return dict(result.fetchone())

@router.get("/{event_id}", response_model=EventOut)
def get_one_event(event_id: int, db: Session = Depends(get_db)):
    row = db.execute("SELECT * FROM calendar_events WHERE id=:id", {"id": event_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    return dict(row)

@router.put("/{event_id}", response_model=EventOut)
def update_event(event_id: int, event: EventUpdate, current_user: User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    row = db.execute("SELECT * FROM calendar_events WHERE id=:id", {"id": event_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    db.execute(
        "UPDATE calendar_events SET title=:title, description=:description, start_date=:start_date, end_date=:end_date, updated_at=:updated_at WHERE id=:id",
        {"title": event.title, "description": event.description, "start_date": event.start_date, "end_date": event.end_date, "updated_at": now, "id": event_id}
    )
    db.commit()
    row = db.execute("SELECT * FROM calendar_events WHERE id=:id", {"id": event_id}).fetchone()
    return dict(row)

@router.delete("/{event_id}")
def delete_event(event_id: int, current_user: User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db.execute("DELETE FROM calendar_events WHERE id=:id", {"id": event_id})
    db.commit()
    return {"ok": True} 