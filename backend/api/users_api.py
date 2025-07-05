from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models import User
from app.schemas import UserProfileUpdate, UserProfileResponse
from app import auth

# Используем правильную функцию аутентификации
get_current_user = auth.get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить профиль текущего пользователя"""
    user = db.query(User).filter(User.id == current_user.id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    return user

@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить профиль текущего пользователя"""
    user = db.query(User).filter(User.id == current_user.id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Обновляем разрешенные поля
    if profile_update.username:
        # Проверяем, что username уникален
        existing_user = db.query(User).filter(
            User.username == profile_update.username,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким именем уже существует"
            )
        user.username = profile_update.username
    
    if profile_update.department:
        user.department = profile_update.department
    
    if profile_update.position:
        user.position = profile_update.position
    
    if profile_update.phone is not None:
        user.phone = profile_update.phone
    
    if profile_update.company is not None:
        user.company = profile_update.company
    
    # Обновляем время последнего изменения
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    return user

@router.get("/", response_model=List[UserProfileResponse])
async def get_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить список всех пользователей (только для админов)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра списка пользователей"
        )
    
    users = db.query(User).all()
    return users 

class CreateUserRequest(BaseModel):
    username: str
    email: str
    role: str = "user"
    department: str = ""
    position: str = ""
    phone: str = ""
    company: str = 'ООО "Алмазгеобур"'

class CreateUserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    department: str
    position: str
    phone: str
    company: str
    generated_password: str

@router.post("/", response_model=CreateUserResponse)
async def create_user(
    user_data: CreateUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать нового пользователя (только для админов)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для создания пользователей"
        )
    
    # Проверяем, что username уникален
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем уже существует"
        )
    
    # Проверяем, что email уникален
    if user_data.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже существует"
            )
    
    # Генерируем случайный пароль
    generated_password = auth.generate_random_password()
    hashed_password = auth.get_password_hash(generated_password)
    
    # Создаем нового пользователя
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role,
        department=user_data.department,
        position=user_data.position,
        phone=user_data.phone,
        company=user_data.company,
        force_password_change=True  # Принудительная смена пароля при первом входе
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return CreateUserResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        role=new_user.role,
        department=new_user.department,
        position=new_user.position,
        phone=new_user.phone,
        company=new_user.company,
        generated_password=generated_password
    ) 