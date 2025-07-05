from fastapi import APIRouter, Depends, HTTPException, Form, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models import User
from app.schemas import UserResponse
from app import auth

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(
    username: str = Form(...), 
    password: str = Form(...), 
    db: Session = Depends(get_db)
):
    """Вход пользователя"""
    user = auth.authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = auth.datetime.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "force_password_change": user.force_password_change
    }

@router.post("/register")
def register(
    username: str = Form(...),
    password: str = Form(...),
    email: str = Form(None),
    db: Session = Depends(get_db)
):
    """Регистрация нового пользователя"""
    # Проверяем, существует ли пользователь
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем уже существует"
        )
    
    # Создаем нового пользователя
    hashed_password = auth.get_password_hash(password)
    user = User(
        username=username,
        hashed_password=hashed_password,
        email=email,
        role="user"
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "Пользователь успешно зарегистрирован"}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(auth.get_current_user)
):
    """Получить информацию о текущем пользователе"""
    return current_user

@router.post("/change-password")
def change_password(
    current_password: str = Form(...),
    new_password: str = Form(...),
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Смена пароля пользователем"""
    # Проверяем текущий пароль
    if not auth.verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный текущий пароль"
        )
    
    # Хешируем новый пароль
    hashed_new_password = auth.get_password_hash(new_password)
    
    # Обновляем пароль и сбрасываем флаг принудительной смены
    current_user.hashed_password = hashed_new_password
    current_user.force_password_change = False
    db.commit()
    
    return {"message": "Пароль успешно изменен"} 