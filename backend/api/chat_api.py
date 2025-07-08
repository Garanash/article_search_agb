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
from fastapi.responses import StreamingResponse
import io

# Автоматическое создание таблиц (если нет Alembic)
Base.metadata.create_all(bind=engine)

from fastapi import Query
from fastapi import Request

router = APIRouter(prefix="/chat", tags=["chat"])

# VseGPT API конфигурация
VSEGPT_API_KEY = "sk-or-vv-0222bdfad78b2ee03399f91527fbd52b36793f8db856f1a7634f423ff6ec6b16"
VSEGPT_BASE_URL = "https://api.vsegpt.ru/v1"

# Определение типов моделей
IMAGE_MODELS = [
    'openai/dall-e-3',
    'stability/stable-diffusion-xl',
    'stability/stable-diffusion'
]

def is_image_model(model_id: str) -> bool:
    """Проверяет, является ли модель изображением"""
    return model_id in IMAGE_MODELS

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
    db: Session = Depends(get_db),
    http_request: Request = None
):
    """Отправить сообщение в чат"""
    
    try:
        headers = {
            "Authorization": f"Bearer {VSEGPT_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Получаем session_id из заголовков
        session_id = None
        if http_request:
            session_id = http_request.headers.get("session_id")
        
        # Проверяем, является ли модель изображением
        if is_image_model(request.model):
            # Специальная обработка для изображений
            print(f"Processing image generation with model {request.model}")
            
            # Для изображений используем другой endpoint и формат
            payload = {
                "model": request.model,
                "prompt": request.messages[-1].content if request.messages else "",
                "n": 1,
                "size": "1024x1024",  # Стандартный размер для DALL-E 3
                "quality": "standard",
                "style": "vivid"
            }
            
            response = requests.post(
                f"{VSEGPT_BASE_URL}/images/generations",
                headers=headers,
                json=payload,
                timeout=120  # Увеличиваем timeout для генерации изображений
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"VseGPT Image API error: {response.status_code} - {response.text}"
                )
            
            vsegpt_response = response.json()
            
            # Отладочная информация
            print(f"VseGPT Image API response: {vsegpt_response}")
            
            # Преобразуем ответ изображения в формат чата
            image_url = ""
            if vsegpt_response.get("data") and len(vsegpt_response["data"]) > 0:
                image_url = vsegpt_response["data"][0].get("url", "")
            elif vsegpt_response.get("url"):
                image_url = vsegpt_response["url"]
            
            print(f"Extracted image URL: {image_url}")
            
            chat_response = {
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": f"🖼️ Изображение создано!\n\n{image_url}"
                        }
                    }
                ],
                "usage": {}
            }
            
            print(f"User {current_user.username} generated image with model {request.model}")
            
            # Сохраняем сообщения в БД (асинхронно)
            def save_image_history():
                if session_id:
                    session = db.query(ChatSession).filter(ChatSession.id == int(session_id), ChatSession.user_id == current_user.id).first()
                    if session:
                        # Сохраняем пользовательское сообщение
                        if request.messages:
                            last_user_msg = request.messages[-1]
                            db.add(ChatMessage(session_id=session.id, role=last_user_msg.role, content=last_user_msg.content))
                        # Сохраняем ответ ассистента
                        db.add(ChatMessage(session_id=session.id, role="assistant", content=chat_response["choices"][0]["message"]["content"]))
                        session.updated_at = datetime.now()
                        db.commit()
            background_tasks.add_task(save_image_history)
            
            return chat_response
        
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
            error_detail = response.text
            try:
                error_json = response.json()
                if 'error' in error_json:
                    error_detail = error_json['error'].get('message', error_detail)
            except:
                pass
            
            # Специальная обработка для ошибок моделей
            if "not found" in error_detail.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Модель '{request.model}' недоступна. Выберите другую модель."
                )
            elif "quota" in error_detail.lower() or "balance" in error_detail.lower():
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Недостаточно средств на балансе VseGPT. Пополните баланс."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Ошибка VseGPT API: {error_detail}"
                )
        vsegpt_response = response.json()
        print(f"User {current_user.username} used VseGPT API with model {request.model}")
        # Сохраняем сообщения в БД (асинхронно)
        def save_history():
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

@router.get("/test-image-proxy")
async def test_image_proxy(image_url: str):
    """Тестовый endpoint для проверки прокси изображений без авторизации"""
    
    try:
        print(f"=== TEST IMAGE PROXY START ===")
        print(f"Test image URL: {image_url}")
        
        # Базовые заголовки
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        # Для Azure Blob URLs НЕ добавляем Authorization заголовок
        if "blob.core.windows.net" not in image_url:
            print("Non-Azure URL, adding Authorization header")
            headers["Authorization"] = f"Bearer {VSEGPT_API_KEY}"
        else:
            print("Azure Blob URL detected, skipping Authorization header")
        
        print(f"Making test request with headers: {headers}")
        
        response = requests.get(
            image_url,
            headers=headers,
            timeout=30,
            stream=True
        )
        
        print(f"Test response status: {response.status_code}")
        print(f"Test response headers: {dict(response.headers)}")
        
        if response.status_code != 200:
            print(f"Test error: {response.status_code} - {response.text}")
            return {"error": f"HTTP {response.status_code}", "details": response.text}
        
        image_content = response.content
        print(f"Test image content length: {len(image_content)} bytes")
        
        return {
            "success": True,
            "content_length": len(image_content),
            "content_type": response.headers.get('content-type', 'unknown'),
            "status_code": response.status_code
        }
        
    except Exception as e:
        print(f"=== TEST IMAGE PROXY ERROR ===")
        print(f"Test error: {str(e)}")
        import traceback
        print(f"Test traceback: {traceback.format_exc()}")
        return {"error": str(e), "traceback": traceback.format_exc()}

@router.options("/image-proxy")
async def image_proxy_options():
    """CORS preflight для image-proxy"""
    return {
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Max-Age": "86400"
        }
    }

@router.get("/image-proxy")
async def get_image_proxy(
    image_url: str,
    current_user: User = Depends(get_current_user)
):
    """Прокси для получения изображений с авторизацией"""
    
    try:
        print(f"=== IMAGE PROXY START ===")
        print(f"Requested image URL: {image_url}")
        print(f"User: {current_user.username}")
        print(f"User ID: {current_user.id}")
        
        # Базовые заголовки
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        # Для Azure Blob URLs НЕ добавляем Authorization заголовок
        # так как они уже содержат SAS токены в URL
        if "blob.core.windows.net" not in image_url:
            print("Non-Azure URL, adding Authorization header")
            headers["Authorization"] = f"Bearer {VSEGPT_API_KEY}"
        else:
            print("Azure Blob URL detected, skipping Authorization header")
        
        print(f"Making request to image URL with headers: {headers}")
        
        # Проверяем, что URL валидный
        if not image_url or not image_url.startswith('http'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image URL"
            )
        
        response = requests.get(
            image_url,
            headers=headers,
            timeout=30,
            stream=True
        )
        
        print(f"Image proxy response status: {response.status_code}")
        print(f"Image proxy response headers: {dict(response.headers)}")
        
        if response.status_code != 200:
            print(f"Image proxy error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Image not found: {response.status_code} - {response.text}"
            )
        
        # Читаем содержимое изображения
        image_content = response.content
        print(f"Image content length: {len(image_content)} bytes")
        
        if len(image_content) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empty image content"
            )
        
        # Определяем content-type из заголовков
        content_type = response.headers.get('content-type', 'image/png')
        print(f"Content type: {content_type}")
        
        # Возвращаем изображение как поток с CORS заголовками
        print(f"=== IMAGE PROXY SUCCESS ===")
        return StreamingResponse(
            io.BytesIO(image_content),
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Authorization, Content-Type",
                "Access-Control-Expose-Headers": "Content-Length, Content-Type"
            }
        )
        
    except HTTPException:
        # Перебрасываем HTTP исключения как есть
        raise
    except requests.exceptions.Timeout:
        print(f"Timeout error proxying image {image_url}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Image proxy timeout"
        )
    except requests.exceptions.RequestException as e:
        print(f"Request error proxying image {image_url}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image proxy request failed: {str(e)}"
        )
    except Exception as e:
        print(f"=== IMAGE PROXY ERROR ===")
        print(f"Unexpected error proxying image {image_url}: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting image: {str(e)}"
        ) 