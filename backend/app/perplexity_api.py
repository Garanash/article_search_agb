import httpx
import json
import base64
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
import os
# from dotenv import load_dotenv

# Загружаем переменные окружения из .env файла
# load_dotenv()

class PerplexityAPI:
    def __init__(self):
        # self.api_key = os.getenv("PERPLEXITY_API_KEY", "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")
        self.api_key = "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"
        self.base_url = "https://api.perplexity.ai"
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        model: str = "sonar",
        max_tokens: int = 1024,
        temperature: float = 0.7,
        top_p: float = 0.9,
        top_k: int = 50,
        presence_penalty: float = 0.0,
        frequency_penalty: float = 0.0
    ) -> Dict[str, Any]:
        """
        Отправляет запрос к Perplexity API для получения ответа
        """
        print(f"PerplexityAPI.chat_completion вызван")
        print(f"API ключ: {self.api_key[:10]}...")
        print(f"URL: {self.base_url}/chat/completions")
        print(f"Модель: {model}")
        print(f"Сообщения: {messages}")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": top_p,
            "top_k": top_k,
            "presence_penalty": presence_penalty,
            "frequency_penalty": frequency_penalty
        }
        
        print(f"Отправляем payload: {payload}")
        
        try:
            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            
            print(f"Получен ответ с кодом: {response.status_code}")
            print(f"Заголовки ответа: {response.headers}")
            
            if response.status_code != 200:
                print(f"Ошибка API: {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Perplexity API error: {response.text}"
                )
            
            response_data = response.json()
            print(f"Успешный ответ: {response_data}")
            return response_data
            
        except httpx.RequestError as e:
            print(f"Ошибка запроса httpx: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Request to Perplexity API failed: {str(e)}"
            )
        except Exception as e:
            print(f"Неожиданная ошибка: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected error: {str(e)}"
            )
    
    async def process_file(
        self, 
        file_content: bytes, 
        file_name: str,
        messages: List[Dict[str, str]],
        model: str = "sonar"
    ) -> Dict[str, Any]:
        """
        Обрабатывает файл с помощью Perplexity API
        """
        # Определяем тип файла по расширению
        file_extension = file_name.lower().split('.')[-1]
        
        # Кодируем файл в base64
        file_base64 = base64.b64encode(file_content).decode('utf-8')
        
        # Определяем MIME тип
        mime_types = {
            'txt': 'text/plain',
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif'
        }
        
        mime_type = mime_types.get(file_extension, 'application/octet-stream')
        
        # Создаем сообщение с файлом
        if file_extension in ['jpg', 'jpeg', 'png', 'gif']:
            # Для изображений используем image_url формат
            file_message = {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"Анализируй это изображение: {file_name}"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{file_base64}"
                        }
                    }
                ]
            }
        elif file_extension == 'pdf':
            # Для PDF файлов используем специальный формат
            file_message = {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"Анализируй этот PDF документ: {file_name}"
                    },
                    {
                        "type": "pdf_url",
                        "pdf_url": {
                            "url": f"data:{mime_type};base64,{file_base64}"
                        }
                    }
                ]
            }
        elif file_extension in ['doc', 'docx']:
            # Для Word документов используем специальный формат
            file_message = {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"Анализируй этот Word документ: {file_name}"
                    },
                    {
                        "type": "file_url",
                        "file_url": {
                            "url": f"data:{mime_type};base64,{file_base64}"
                        }
                    }
                ]
            }
        else:
            # Для текстовых файлов и документов добавляем содержимое как текст
            try:
                if file_extension == 'txt':
                    file_text = file_content.decode('utf-8')
                else:
                    # Для других форматов пока просто указываем, что это документ
                    file_text = f"[Содержимое документа: {file_name}]"
                
                file_message = {
                    "role": "user",
                    "content": f"Анализируй этот документ: {file_name}\n\nСодержимое:\n{file_text}"
                }
            except UnicodeDecodeError:
                file_message = {
                    "role": "user",
                    "content": f"Анализируй этот документ: {file_name}\n\n[Документ содержит бинарные данные]"
                }
        
        # Добавляем файл к сообщениям
        updated_messages = messages + [file_message]
        
        print(f"Отправляем сообщение с файлом: {file_name}")
        print(f"Тип файла: {file_extension}")
        print(f"MIME тип: {mime_type}")
        print(f"Структура сообщения: {json.dumps(file_message, indent=2)}")
        
        return await self.chat_completion(updated_messages, model=model)
    
    async def get_available_models(self) -> List[Dict[str, str]]:
        """
        Получает список доступных моделей Perplexity
        """
        return [
            {
                "id": "sonar",
                "name": "Sonar (Рекомендуется)",
                "description": "Основная модель Perplexity для общих задач"
            },
            {
                "id": "sonar-small",
                "name": "Sonar Small (Быстрая)",
                "description": "Быстрая модель для простых задач"
            },
            {
                "id": "sonar-medium",
                "name": "Sonar Medium (Сбалансированная)",
                "description": "Средняя модель с улучшенными возможностями"
            },
            {
                "id": "sonar-large",
                "name": "Sonar Large (Мощная)",
                "description": "Мощная модель для сложных задач"
            },
            {
                "id": "mixtral-8x7b-instruct",
                "name": "Mixtral 8x7B Instruct",
                "description": "Модель для инструкций и диалогов"
            },
            {
                "id": "codellama-70b-instruct",
                "name": "Code Llama 70B Instruct",
                "description": "Специализированная модель для программирования"
            }
        ]

# Создаем глобальный экземпляр API
perplexity_api = PerplexityAPI() 