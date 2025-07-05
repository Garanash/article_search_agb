from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import base64
import json

from app.database import get_db
from app.models import User
from app.schemas import PerplexityChatRequest, PerplexityChatResponse, PerplexityModel
from app import auth
from app.perplexity_api import perplexity_api

# Используем правильную функцию аутентификации
get_current_user = auth.get_current_user

router = APIRouter(prefix="/perplexity", tags=["perplexity"])

@router.post("/chat", response_model=PerplexityChatResponse)
async def chat_with_perplexity(
    request: PerplexityChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Отправить сообщение в Perplexity и получить ответ
    """
    try:
        print(f"Получен запрос от пользователя {current_user.username}")
        print(f"Модель: {request.model}")
        print(f"Количество сообщений: {len(request.messages)}")
        
        # Преобразуем сообщения в формат для Perplexity API
        messages = [
            {
                "role": msg.role,
                "content": msg.content
            }
            for msg in request.messages
        ]
        
        print(f"Отправляем запрос к Perplexity API...")
        
        # Отправляем запрос к Perplexity
        response = await perplexity_api.chat_completion(
            messages=messages,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            top_p=request.top_p,
            top_k=request.top_k,
            presence_penalty=request.presence_penalty,
            frequency_penalty=request.frequency_penalty
        )
        
        print(f"Получен ответ от Perplexity API")
        return response
        
    except Exception as e:
        print(f"Ошибка в chat_with_perplexity: {str(e)}")
        print(f"Тип ошибки: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при обращении к Perplexity API: {str(e)}"
        )

@router.post("/chat-with-file", response_model=PerplexityChatResponse)
async def chat_with_file(
    file: UploadFile = File(...),
    messages: str = Form(...),  # JSON string
    model: str = Form("sonar"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Отправить сообщение с файлом в Perplexity
    """
    try:
        # Читаем содержимое файла
        file_content = await file.read()
        
        # Парсим сообщения из JSON
        try:
            messages_list = json.loads(messages)
            print(f"Получены сообщения: {json.dumps(messages_list, indent=2)}")
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Неверный формат сообщений"
            )
        
        # Преобразуем сообщения в формат для Perplexity API
        perplexity_messages = [
            {
                "role": msg["role"],
                "content": msg["content"]
            }
            for msg in messages_list
        ]
        
        # Обрабатываем файл с помощью Perplexity
        response = await perplexity_api.process_file(
            file_content=file_content,
            file_name=file.filename,
            messages=perplexity_messages,
            model=model
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при обработке файла: {str(e)}"
        )

@router.get("/models", response_model=List[PerplexityModel])
async def get_available_models(
    current_user: User = Depends(get_current_user)
):
    """
    Получить список доступных моделей Perplexity
    """
    try:
        models = await perplexity_api.get_available_models()
        return models
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении списка моделей: {str(e)}"
        )

@router.post("/test-connection")
async def test_connection(
    current_user: User = Depends(get_current_user)
):
    """
    Проверить подключение к Perplexity API
    """
    try:
        # Отправляем тестовое сообщение
        test_messages = [
            {
                "role": "user",
                "content": "Привет! Это тестовое сообщение."
            }
        ]
        
        response = await perplexity_api.chat_completion(
            messages=test_messages,
            model='sonar',
            max_tokens=50
        )
        
        return {
            "status": "success",
            "message": "Подключение к Perplexity API работает",
            "response": response
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка подключения к Perplexity API: {str(e)}"
        ) 