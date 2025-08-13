from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PhoneBook, User
from app.schemas import PhoneBookOut
from typing import List, Optional
from pydantic import BaseModel
from app.auth import get_current_user

class PhoneBookCreate(BaseModel):
    name: str
    position: str
    department: str
    phone: str
    mobile: Optional[str] = None
    email: Optional[str] = None
    office: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None
    extension: Optional[str] = None
    status: str = "online"
    is_favorite: bool = False

class PhoneBookUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    office: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None
    extension: Optional[str] = None
    status: Optional[str] = None
    is_favorite: Optional[bool] = None

router = APIRouter(prefix="/phone-directory", tags=["phone-directory"])

@router.post("/", response_model=PhoneBookOut)
def create_contact(contact: PhoneBookCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_contact = PhoneBook(
        name=contact.name,
        position=contact.position,
        department=contact.department,
        phone=contact.phone,
        mobile=contact.mobile,
        email=contact.email,
        office=contact.office,
        floor=contact.floor,
        room=contact.room,
        extension=contact.extension,
        status=contact.status,
        is_favorite=contact.is_favorite,
        user_id=current_user.id
    )
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

@router.get("/", response_model=List[PhoneBookOut])
def get_contacts(db: Session = Depends(get_db)):
    return db.query(PhoneBook).all()

@router.get("/{contact_id}", response_model=PhoneBookOut)
def get_contact(contact_id: int, db: Session = Depends(get_db)):
    contact = db.query(PhoneBook).filter(PhoneBook.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

@router.put("/{contact_id}", response_model=PhoneBookOut)
def update_contact(contact_id: int, contact: PhoneBookUpdate, db: Session = Depends(get_db)):
    db_contact = db.query(PhoneBook).filter(PhoneBook.id == contact_id).first()
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    for key, value in contact.dict(exclude_unset=True).items():
        setattr(db_contact, key, value)
    
    db.commit()
    db.refresh(db_contact)
    return db_contact

@router.delete("/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    contact = db.query(PhoneBook).filter(PhoneBook.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(contact)
    db.commit()
    return {"ok": True}

@router.patch("/{contact_id}/favorite")
def toggle_favorite(contact_id: int, db: Session = Depends(get_db)):
    contact = db.query(PhoneBook).filter(PhoneBook.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    contact.is_favorite = not contact.is_favorite
    db.commit()
    return {"id": contact.id, "is_favorite": contact.is_favorite}
