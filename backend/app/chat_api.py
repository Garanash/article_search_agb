from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer
from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime
import json
import asyncio
from sqlalchemy.orm import Session
from .database import get_db
from .auth import get_current_user
from .models import User
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/chat", tags=["chat"])
security = HTTPBearer()

# Pydantic модели для API
class MessageCreate(BaseModel):
    botId: str
    content: str

class MessageResponse(BaseModel):
    id: str
    content: str
    sender: str  # 'user' или 'bot'
    timestamp: str
    botId: str
    userId: str

class BotResponse(BaseModel):
    id: str
    name: str
    description: str
    avatar: str
    role: str
    isOnline: bool
    lastMessage: Optional[str] = None
    unreadCount: Optional[int] = 0

class ChatSessionResponse(BaseModel):
    id: str
    userId: str
    botId: str
    createdAt: str
    lastActivity: str
    messageCount: int

class SessionCreate(BaseModel):
    botId: str

# Моковые данные для ботов (в реальном приложении будут в базе данных)
BOTS_DATA = {
    'admin': [
        {
            'id': 'admin-support',
            'name': 'Админ Поддержка',
            'description': 'Помощь с административными вопросами',
            'avatar': '🤖',
            'role': 'admin',
            'isOnline': True
        },
        {
            'id': 'system-bot',
            'name': 'Системный Бот',
            'description': 'Техническая поддержка системы',
            'avatar': '⚙️',
            'role': 'admin',
            'isOnline': True
        }
    ],
    'manager': [
        {
            'id': 'sales-bot',
            'name': 'Бот Продаж',
            'description': 'Помощь с вопросами по продажам',
            'avatar': '💰',
            'role': 'manager',
            'isOnline': True
        },
        {
            'id': 'analytics-bot',
            'name': 'Аналитик Бот',
            'description': 'Аналитика и отчеты',
            'avatar': '📊',
            'role': 'manager',
            'isOnline': True
        }
    ],
    'user': [
        {
            'id': 'general-support',
            'name': 'Общая Поддержка',
            'description': 'Общие вопросы и помощь',
            'avatar': '💬',
            'role': 'user',
            'isOnline': True
        }
    ],
    'ved': [
        {
            'id': 'ved-bot-1',
            'name': 'ВЭД Бот 1',
            'description': 'Помощь с внешнеэкономической деятельностью',
            'avatar': '🌍',
            'role': 'ved',
            'isOnline': True
        },
        {
            'id': 'ved-bot-2',
            'name': 'ВЭД Бот 2',
            'description': 'Таможенное оформление и документы',
            'avatar': '📋',
            'role': 'ved',
            'isOnline': True
        },
        {
            'id': 'ved-bot-3',
            'name': 'ВЭД Бот 3',
            'description': 'Логистика и доставка',
            'avatar': '🚚',
            'role': 'ved',
            'isOnline': False
        }
    ],
    'hr': [
        {
            'id': 'hr-bot-1',
            'name': 'HR Бот 1',
            'description': 'Кадровые вопросы и документы',
            'avatar': '👥',
            'role': 'hr',
            'isOnline': True
        },
        {
            'id': 'hr-bot-2',
            'name': 'HR Бот 2',
            'description': 'Обучение и развитие персонала',
            'avatar': '🎓',
            'role': 'hr',
            'isOnline': True
        }
    ]
}

# Хранилище для WebSocket соединений
active_connections: Dict[str, WebSocket] = {}

@router.get("/bots", response_model=List[BotResponse])
async def get_available_bots(
    role: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить список доступных ботов для пользователя в зависимости от роли
    """
    # Получаем ботов для роли пользователя
    user_role = current_user.role.lower()
    bots = BOTS_DATA.get(user_role, [])
    
    # Добавляем общих ботов
    general_bots = BOTS_DATA.get('user', [])
    bots.extend(general_bots)
    
    # Убираем дубликаты
    seen_ids = set()
    unique_bots = []
    for bot in bots:
        if bot['id'] not in seen_ids:
            seen_ids.add(bot['id'])
            unique_bots.append(bot)
    
    return unique_bots

@router.get("/history/{bot_id}", response_model=List[MessageResponse])
async def get_chat_history(
    bot_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить историю сообщений с ботом
    """
    print(f"[DEBUG] get_chat_history: bot_id={bot_id}, user_id={current_user.id}")
    # TODO: Реализовать получение истории из базы данных
    # Пока возвращаем пустой список
    history = []
    # --- здесь должна быть загрузка истории из БД ---
    # Жёсткая валидация:
    if not isinstance(history, list):
        print(f"[ERROR] История не является списком: {history}")
        return JSONResponse(status_code=422, content={"detail": "История не является списком", "history": str(history)})
    valid_msgs = []
    for idx, msg in enumerate(history):
        if not isinstance(msg, dict):
            print(f"[ERROR] Элемент истории не dict: idx={idx}, msg={msg}")
            continue
        if msg.get('role') not in ('user', 'assistant'):
            print(f"[ERROR] Некорректная роль: idx={idx}, msg={msg}")
            continue
        if not isinstance(msg.get('content'), str):
            print(f"[ERROR] content не строка: idx={idx}, msg={msg}")
            continue
        valid_msgs.append(msg)
    print(f"[DEBUG] Возвращаем {len(valid_msgs)} сообщений из истории")
    return valid_msgs

@router.post("/send", response_model=MessageResponse)
async def send_message(
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Отправить сообщение боту
    """
    # TODO: Реализовать отправку сообщения боту
    # Пока возвращаем моковый ответ
    response_message = MessageResponse(
        id=f"msg_{datetime.now().timestamp()}",
        content=f"Ответ от бота {message.botId}: {message.content}",
        sender="bot",
        timestamp=datetime.now().isoformat(),
        botId=message.botId,
        userId=str(current_user.id)
    )
    
    # Отправляем сообщение через WebSocket если соединение активно
    connection_key = f"{current_user.id}_{message.botId}"
    if connection_key in active_connections:
        try:
            await active_connections[connection_key].send_text(response_message.json())
        except:
            pass
    
    return response_message

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить активные чат-сессии пользователя
    """
    # TODO: Реализовать получение сессий из базы данных
    # Пока возвращаем пустой список
    return []

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    session: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Создать новую чат-сессию с ботом
    """
    # TODO: Реализовать создание сессии в базе данных
    new_session = ChatSessionResponse(
        id=f"session_{datetime.now().timestamp()}",
        userId=str(current_user.id),
        botId=session.botId,
        createdAt=datetime.now().isoformat(),
        lastActivity=datetime.now().isoformat(),
        messageCount=0
    )
    return new_session

@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Удалить чат-сессию
    """
    # TODO: Реализовать удаление сессии из базы данных
    return {"message": "Сессия удалена"}

@router.get("/bots/{bot_id}/status")
async def get_bot_status(
    bot_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить статус бота (онлайн/оффлайн)
    """
    # TODO: Реализовать получение реального статуса бота
    # Пока возвращаем моковый статус
    return {"isOnline": True}

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str,
    bot_id: str
):
    """
    WebSocket эндпоинт для получения сообщений в реальном времени
    """
    await websocket.accept()
    
    # TODO: Валидация токена и получение пользователя
    # Пока используем простую логику
    user_id = "1"  # В реальном приложении получаем из токена
    connection_key = f"{user_id}_{bot_id}"
    
    active_connections[connection_key] = websocket
    
    try:
        while True:
            # Ожидаем сообщения от клиента
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # TODO: Обработка сообщения и отправка ответа от бота
            
    except WebSocketDisconnect:
        # Удаляем соединение при отключении
        if connection_key in active_connections:
            del active_connections[connection_key]

@router.get("/unread")
async def get_unread_messages(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить количество непрочитанных сообщений
    """
    # TODO: Реализовать подсчет непрочитанных сообщений
    # Пока возвращаем моковые данные
    return {
        "ved-bot-1": 0,
        "ved-bot-2": 1,
        "hr-bot-2": 3
    }

@router.post("/read/{bot_id}")
async def mark_messages_as_read(
    bot_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Отметить сообщения как прочитанные
    """
    # TODO: Реализовать отметку сообщений как прочитанных
    return {"message": "Сообщения отмечены как прочитанные"} 