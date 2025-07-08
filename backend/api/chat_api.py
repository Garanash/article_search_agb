from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
import requests
import json
import os
from datetime import datetime
import traceback

from app.database import get_db
from app.models import User, ChatSession, ChatMessage
from app.schemas import ChatSessionCreate, ChatSessionResponse, ChatSessionUpdate, ChatMessageCreate, ChatMessageResponse
from app.database import Base, engine
from app.auth import get_current_user

# Автоматическое создание таблиц (если нет Alembic)
Base.metadata.create_all(bind=engine)

from fastapi import Query

router = APIRouter(prefix="/chat", tags=["chat"])

# VseGPT API конфигурация
VSEGPT_API_KEY = "sk-or-vv-0222bdfad78b2ee03399f91527fbd52b36793f8db856f1a7634f423ff6ec6b16"
VSEGPT_BASE_URL = "https://api.vsegpt.ru/v1"

IMAGE_MODELS = ["dall-e-3"]

# --- Pydantic-схема для сообщений (чтобы не конфликтовать с ORM) ---
class ChatMessageSchema(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    messages: List[ChatMessageSchema]
    temperature: float = 0.7
    max_tokens: int = 3000
    extra_headers: Dict[str, str] = {}

class ChatResponse(BaseModel):
    choices: List[Dict[str, Any]]
    usage: Dict[str, Any]

def fix_param(val, default):
    if val is None:
        return default
    if isinstance(val, int) and val > 2:
        return val / 100
    return float(val)

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Получить список чатов пользователя"""
    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.updated_at.desc()).all()
    # Преобразуем temperature/top_p к float для фронта
    for s in sessions:
        if isinstance(s.temperature, int) and s.temperature > 2:
            s.temperature = s.temperature / 100
        if isinstance(s.top_p, int) and s.top_p > 2:
            s.top_p = s.top_p / 100
    return sessions

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(session_in: ChatSessionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Создать новый чат"""
    session = ChatSession(
        user_id=current_user.id,
        title=session_in.title,
        model=session_in.model,
        system=session_in.system,
        temperature=int((session_in.temperature or 0.7) * 100),
        top_p=int((session_in.top_p or 1.0) * 100),
        max_tokens=session_in.max_tokens or 2048
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    # Преобразуем для фронта
    if isinstance(session.temperature, int) and session.temperature > 2:
        session.temperature = session.temperature / 100
    if isinstance(session.top_p, int) and session.top_p > 2:
        session.top_p = session.top_p / 100
    return session

@router.get("/history/{session_id}", response_model=List[ChatMessageResponse])
async def get_chat_history(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Получить историю сообщений чата"""
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Чат не найден")
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).order_by(ChatMessage.created_at).all()
    return messages

@router.delete("/sessions/{session_id}")
async def delete_chat_session(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Удалить чат"""
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Чат не найден")
    db.delete(session)
    db.commit()
    return {"ok": True}

@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_chat_session(session_id: int, session_in: ChatSessionUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Обновить параметры чата"""
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Чат не найден")
    if session_in.title is not None:
        session.title = session_in.title
    if session_in.model is not None:
        session.model = session_in.model
    if session_in.system is not None:
        session.system = session_in.system
    if session_in.temperature is not None:
        session.temperature = int(session_in.temperature * 100)
    if session_in.top_p is not None:
        session.top_p = int(session_in.top_p * 100)
    if session_in.max_tokens is not None:
        session.max_tokens = session_in.max_tokens
    db.commit()
    db.refresh(session)
    # Преобразуем для фронта
    if isinstance(session.temperature, int) and session.temperature > 2:
        session.temperature = session.temperature / 100
    if isinstance(session.top_p, int) and session.top_p > 2:
        session.top_p = session.top_p / 100
    return session

from fastapi import BackgroundTasks

@router.post("/completions", response_model=ChatResponse)
async def chat_completions(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Отправить сообщение в VseGPT API и сохранить историю"""
    try:
        headers = {
            "Authorization": f"Bearer {VSEGPT_API_KEY}",
            "Content-Type": "application/json"
        }
        if request.extra_headers:
            headers.update(request.extra_headers)

        # --- Ветка для генерации изображений ---
        if request.model in IMAGE_MODELS:
            prompt = ""
            for msg in reversed(request.messages):
                if msg.role == "user":
                    prompt = msg.content
                    break
            payload = {
                "model": request.model,
                "prompt": prompt,
                "n": 1,
                "size": "1024x1024"
            }
            response = requests.post(
                f"{VSEGPT_BASE_URL}/images/generations",
                headers=headers,
                json=payload,
                timeout=60
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"VseGPT Image API error: {response.status_code} - {response.text}"
                )
            data = response.json()
            image_url = data["data"][0]["url"]
            content = f"![Сгенерированное изображение]({image_url})"
            return {
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": content
                        }
                    }
                ],
                "usage": {}
            }

        # --- Обычный чат ---
        temperature = fix_param(request.temperature, 0.7)
        top_p = fix_param(getattr(request, 'top_p', 1.0), 1.0)
        payload = {
            "model": request.model,
            "messages": [msg.dict() for msg in request.messages],
            "temperature": temperature,
            "top_p": top_p,
            "max_tokens": request.max_tokens
        }
        response = requests.post(
            f"{VSEGPT_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"VseGPT API error: {response.status_code} - {response.text}"
            )
        vsegpt_response = response.json()
        print(f"User {current_user.username} used VseGPT API with model {request.model}")
        # Сохраняем сообщения в БД (асинхронно)
        def save_history():
            session_id = request.extra_headers.get("session_id")
            if session_id:
                session = db.query(ChatSession).filter(ChatSession.id == int(session_id), ChatSession.user_id == current_user.id).first()
                if session:
                    # Сохраняем пользовательское сообщение
                    if request.messages:
                        last_user_msg = request.messages[-1]
                        db.add(ChatMessage(session_id=session.id, role=last_user_msg.role, content=last_user_msg.content))
                    # Сохраняем ответ ассистента
                    if vsegpt_response.get("choices"):
                        content = vsegpt_response["choices"][0]["message"]["content"]
                        db.add(ChatMessage(session_id=session.id, role="assistant", content=content))
                    session.updated_at = datetime.now()
                    db.commit()
        background_tasks.add_task(save_history)
        return vsegpt_response

    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="VseGPT API timeout"
        )
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"VseGPT API request failed: {str(e)}"
        )
    except Exception as e:
        print('--- ОШИБКА В /chat/completions ---')
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/models")
async def get_available_models(
    current_user: User = Depends(get_current_user)
):
    """Получить список доступных моделей"""
    
    try:
        headers = {
            "Authorization": f"Bearer {VSEGPT_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{VSEGPT_BASE_URL}/models",
            headers=headers,
            timeout=30
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get models: {response.status_code}"
            )
        
        return response.json()
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting models: {str(e)}"
        )

@router.get("/balance")
async def get_balance(
    current_user: User = Depends(get_current_user)
):
    """Получить баланс VseGPT аккаунта"""
    
    try:
        headers = {
            "Authorization": f"Bearer {VSEGPT_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{VSEGPT_BASE_URL}/balance",
            headers=headers,
            timeout=30
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get balance: {response.status_code}"
            )
        
        return response.json()
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting balance: {str(e)}"
        ) 