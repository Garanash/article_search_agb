from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from core.database import get_db
from core.auth import get_current_user
from api.v1.crud import *
from api.v1.schemas import *
from api.v1.models import User

router = APIRouter()

@router.get("/phone-directory", response_model=List[PhoneBookResponse])
def get_phone_contacts(
    skip: int = 0,
    limit: int = 100,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получение списка контактов телефонного справочника"""
    from api.v1.crud import get_phone_contacts as crud_get_phone_contacts
    return crud_get_phone_contacts(db=db, skip=skip, limit=limit, department=department)

@router.get("/phone-directory/{contact_id}", response_model=PhoneBookResponse)
def get_phone_contact(
    contact_id: int,
    db: Session = Depends(get_db)
):
    """Получение конкретного контакта"""
    from api.v1.crud import get_phone_contact as crud_get_phone_contact
    contact = crud_get_phone_contact(db=db, contact_id=contact_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Контакт не найден"
        )
    return contact
