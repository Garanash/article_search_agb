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
from app.models import User
from app.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])

# VseGPT API конфигурация
VSEGPT_API_KEY = "sk-or-vv-0222bdfad78b2ee03399f91527fbd52b36793f8db856f1a7634f423ff6ec6b16"
VSEGPT_BASE_URL = "https://api.vsegpt.ru/v1"

IMAGE_MODELS = ["dall-e-3"]

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    temperature: float = 0.7
    max_tokens: int = 3000
    extra_headers: Dict[str, str] = {}

class ChatResponse(BaseModel):
    choices: List[Dict[str, Any]]
    usage: Dict[str, Any]

@router.post("/completions", response_model=ChatResponse)
async def chat_completions(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Отправить сообщение в VseGPT API"""
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
        payload = {
            "model": request.model,
            "messages": [msg.dict() for msg in request.messages],
            "temperature": request.temperature,
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