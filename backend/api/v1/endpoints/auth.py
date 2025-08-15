from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional

from core.database import get_db
from core.auth import authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
from api.v1.crud import *
from api.v1.schemas import *

router = APIRouter()

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Аутентификация пользователя и получение токена"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # в секундах
        "user_id": user.id,
        "username": user.username,
        "role": user.role
    }

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Аутентификация пользователя и получение токена (алиас для /token)"""
    return await login_for_access_token(form_data, db)

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserOut = Depends(get_current_user), db: Session = Depends(get_db)):
    """Получение информации о текущем пользователе"""
    role = None
    department = None
    
    if current_user.role_id:
        role = get_role(db, current_user.role_id)
    
    if current_user.department_id:
        department = get_department(db, current_user.department_id)
    
    return {
        "user": current_user,
        "role": role,
        "department": department
    }

@router.post("/register", response_model=UserOut)
async def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    """Регистрация нового пользователя"""
    # Проверяем, не существует ли уже пользователь с таким username или email
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    return create_user(db=db, user=user)

@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Смена пароля пользователя"""
    # Проверяем текущий пароль
    if not authenticate_user(db, current_user.username, current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Обновляем пароль
    user_update = UserUpdate(password=new_password)
    updated_user = update_user(db, current_user.id, user_update)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password"
        )
    
    return {"message": "Password updated successfully"}

@router.get("/permissions")
async def get_user_permissions(current_user: UserOut = Depends(get_current_user)):
    """Получение разрешений текущего пользователя"""
    from core.auth import get_user_permissions
    
    permissions = get_user_permissions(current_user)
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "permissions": permissions
    }
