from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import get_db
from .password import verify_password
from api.v1.crud import get_user_by_username
from api.v1.models import User

# Настройки JWT
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 схема
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Аутентификация пользователя"""
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Создание JWT токена"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    """Проверка JWT токена"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Получение текущего пользователя из токена"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    username = verify_token(token)
    if username is None:
        raise credentials_exception
    
    user = get_user_by_username(db, username)
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Получение текущего активного пользователя"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def is_admin(user: User) -> bool:
    """Проверка, является ли пользователь администратором"""
    if not user.role:
        return False
    # user.role - это строка, а не объект
    return user.role.lower() in ["admin", "administrator", "директор", "руководитель"]

def is_manager(user: User) -> bool:
    """Проверка, является ли пользователь руководителем"""
    if not user.role:
        return False
    # user.role - это строка, а не объект
    return user.role.lower() in ["manager", "руководитель", "менеджер", "директор"]

def can_approve_documents(user: User) -> bool:
    """Проверка, может ли пользователь согласовывать документы"""
    return is_admin(user) or is_manager(user)

def get_user_permissions(user: User) -> dict:
    """Получение разрешений пользователя"""
    if not user.role:
        return {}
    
    base_permissions = {
        "can_read": True,
        "can_create": True,
        "can_edit_own": True,
        "can_delete_own": True,
    }
    
    if is_admin(user):
        base_permissions.update({
            "can_edit_all": True,
            "can_delete_all": True,
            "can_approve": True,
            "can_manage_users": True,
            "can_manage_roles": True,
            "can_manage_departments": True,
            "can_view_analytics": True,
        })
    elif is_manager(user):
        base_permissions.update({
            "can_edit_department": True,
            "can_approve": True,
            "can_view_department_analytics": True,
        })
    
    return base_permissions 