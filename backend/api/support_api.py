from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models import User, SupportMessage
from app.schemas import SupportMessageCreate, SupportMessageResponse, SupportMessageList
from app import auth

get_current_user = auth.get_current_user

router = APIRouter(prefix="/support", tags=["support"])

@router.post("/send", response_model=SupportMessageResponse)
async def send_support_message(
    message_data: SupportMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Отправить сообщение в поддержку
    """
    try:
        support_message = SupportMessage(
            user_id=current_user.id,
            message=message_data.message,
            department=message_data.department,
            is_from_admin=False,
            is_read=False
        )
        
        db.add(support_message)
        db.commit()
        db.refresh(support_message)
        
        # Добавляем имя пользователя для ответа
        response_data = SupportMessageResponse(
            id=support_message.id,
            user_id=support_message.user_id,
            message=support_message.message,
            department=support_message.department,
            is_from_admin=support_message.is_from_admin,
            is_read=support_message.is_read,
            created_at=support_message.created_at,
            user_username=current_user.username
        )
        
        return response_data
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при отправке сообщения: {str(e)}"
        )

@router.get("/messages", response_model=SupportMessageList)
async def get_support_messages(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """
    Получить сообщения поддержки для пользователя
    """
    try:
        # Получаем сообщения пользователя
        messages = db.query(SupportMessage).filter(
            SupportMessage.user_id == current_user.id
        ).order_by(SupportMessage.created_at.desc()).offset(skip).limit(limit).all()
        
        # Получаем общее количество
        total = db.query(SupportMessage).filter(
            SupportMessage.user_id == current_user.id
        ).count()
        
        # Формируем ответ
        response_messages = []
        for msg in messages:
            response_messages.append(SupportMessageResponse(
                id=msg.id,
                user_id=msg.user_id,
                message=msg.message,
                department=msg.department,
                is_from_admin=msg.is_from_admin,
                is_read=msg.is_read,
                created_at=msg.created_at,
                user_username=current_user.username
            ))
        
        return SupportMessageList(
            messages=response_messages,
            total=total
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении сообщений: {str(e)}"
        )

@router.post("/mark-read/{message_id}")
async def mark_message_as_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Отметить сообщение как прочитанное
    """
    try:
        message = db.query(SupportMessage).filter(
            SupportMessage.id == message_id,
            SupportMessage.user_id == current_user.id
        ).first()
        
        if not message:
            raise HTTPException(
                status_code=404,
                detail="Сообщение не найдено"
            )
        
        message.is_read = True
        db.commit()
        
        return {"message": "Сообщение отмечено как прочитанное"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при обновлении сообщения: {str(e)}"
        )

# Админские эндпоинты
@router.get("/admin/messages", response_model=List[SupportMessageResponse])
async def get_all_support_messages(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить все сообщения поддержки (только для админов)
    """
    # Проверяем, что пользователь админ
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Доступ запрещен"
        )
    
    try:
        messages = db.query(SupportMessage).join(User).order_by(
            SupportMessage.created_at.desc()
        ).all()
        
        response_messages = []
        for msg in messages:
            response_messages.append(SupportMessageResponse(
                id=msg.id,
                user_id=msg.user_id,
                message=msg.message,
                department=msg.department,
                is_from_admin=msg.is_from_admin,
                is_read=msg.is_read,
                created_at=msg.created_at,
                user_username=msg.user.username
            ))
        
        return response_messages
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении сообщений: {str(e)}"
        )

@router.post("/admin/reply/{user_id}", response_model=SupportMessageResponse)
async def admin_reply(
    user_id: int,
    message_data: SupportMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ответить пользователю от имени администратора
    """
    # Проверяем, что пользователь админ
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Доступ запрещен"
        )
    
    try:
        # Проверяем, что пользователь существует
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=404,
                detail="Пользователь не найден"
            )
        
        support_message = SupportMessage(
            user_id=user_id,
            message=message_data.message,
            department=message_data.department,
            is_from_admin=True,
            is_read=False
        )
        
        db.add(support_message)
        db.commit()
        db.refresh(support_message)
        
        return SupportMessageResponse(
            id=support_message.id,
            user_id=support_message.user_id,
            message=support_message.message,
            department=support_message.department,
            is_from_admin=support_message.is_from_admin,
            is_read=support_message.is_read,
            created_at=support_message.created_at,
            user_username=user.username
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при отправке ответа: {str(e)}"
        ) 

@router.get("/departments")
async def get_departments():
    """
    Получить список доступных департаментов
    """
    departments = [
        {
            "id": "development",
            "name": "Разработка ПО",
            "description": "Вопросы по разработке программного обеспечения"
        },
        {
            "id": "system_admin",
            "name": "Системный администратор",
            "description": "Техническая поддержка и системные вопросы"
        },
        {
            "id": "logistics",
            "name": "Логистика",
            "description": "Вопросы по поставкам и логистике"
        },
        {
            "id": "general",
            "name": "Общие вопросы",
            "description": "Общие вопросы и административные задачи"
        }
    ]
    
    return {"departments": departments} 