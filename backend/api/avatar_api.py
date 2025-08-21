from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import os
import shutil
from datetime import datetime
import uuid

from ..database import get_db
from ..models import User
from ..auth import get_current_user

router = APIRouter(prefix="/api/avatar", tags=["avatar"])

# Папка для хранения аватаров
AVATAR_UPLOAD_DIR = "uploads/avatars"
os.makedirs(AVATAR_UPLOAD_DIR, exist_ok=True)

# Разрешенные типы файлов
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def is_valid_image_file(filename: str) -> bool:
    """Проверяет, является ли файл допустимым изображением"""
    return any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)

@router.post("/upload")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Загрузить аватар пользователя"""
    
    # Проверяем тип файла
    if not is_valid_image_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимый тип файла. Разрешены только: jpg, jpeg, png, gif, webp"
        )
    
    # Проверяем размер файла
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Файл слишком большой. Максимальный размер: {MAX_FILE_SIZE // (1024 * 1024)}MB"
        )
    
    try:
        # Генерируем уникальное имя файла
        file_extension = os.path.splitext(file.filename)[1].lower()
        unique_filename = f"{current_user.id}_{uuid.uuid4().hex}{file_extension}"
        file_path = os.path.join(AVATAR_UPLOAD_DIR, unique_filename)
        
        # Удаляем старый аватар, если есть
        if current_user.avatar_url:
            old_avatar_path = os.path.join(AVATAR_UPLOAD_DIR, os.path.basename(current_user.avatar_url))
            if os.path.exists(old_avatar_path):
                os.remove(old_avatar_path)
        
        # Сохраняем новый файл
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Обновляем URL аватара в базе данных
        avatar_url = f"/api/avatar/{unique_filename}"
        current_user.avatar_url = avatar_url
        current_user.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "message": "Аватар успешно загружен",
            "avatar_url": avatar_url,
            "filename": unique_filename
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при загрузке аватара: {str(e)}"
        )

@router.get("/{filename}")
async def get_avatar(filename: str):
    """Получить аватар по имени файла"""
    file_path = os.path.join(AVATAR_UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Аватар не найден"
        )
    
    return FileResponse(file_path)

@router.delete("/")
async def delete_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить аватар пользователя"""
    
    if not current_user.avatar_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="У пользователя нет аватара"
        )
    
    try:
        # Удаляем файл
        avatar_filename = os.path.basename(current_user.avatar_url)
        avatar_path = os.path.join(AVATAR_UPLOAD_DIR, avatar_filename)
        
        if os.path.exists(avatar_path):
            os.remove(avatar_path)
        
        # Очищаем URL в базе данных
        current_user.avatar_url = None
        current_user.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {"message": "Аватар успешно удален"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при удалении аватара: {str(e)}"
        )

@router.get("/user/{user_id}")
async def get_user_avatar(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Получить аватар пользователя по ID"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    if not user.avatar_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="У пользователя нет аватара"
        )
    
    return {"avatar_url": user.avatar_url}
