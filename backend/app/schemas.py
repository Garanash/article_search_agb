from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    class Config:
        from_attributes = True

class RequestCreate(BaseModel):
    code: str

class RequestOut(BaseModel):
    id: int
    number: str
    created_at: str
    class Config:
        from_attributes = True

class ArticleOut(BaseModel):
    id: int
    code: str
    request_id: Optional[int]
    class Config:
        from_attributes = True

class SupplierOut(BaseModel):
    id: int
    name: str
    website: str
    email: str
    country: str
    email_validated: bool
    class Config:
        from_attributes = True

class EmailTemplateOut(BaseModel):
    id: int
    name: str
    subject: str
    body: str
    class Config:
        from_attributes = True

class AnalyticsOut(BaseModel):
    id: int
    action: str
    timestamp: str
    details: str
    class Config:
        from_attributes = True

class UserBotCreate(BaseModel):
    bot_id: str
    bot_name: str
    bot_description: str
    bot_avatar: str
    bot_color: str

class UserBotOut(BaseModel):
    id: int
    bot_id: str
    bot_name: str
    bot_description: str
    bot_avatar: str
    bot_color: str
    is_active: bool
    assigned_at: str
    class Config:
        from_attributes = True

class AssignBotRequest(BaseModel):
    user_id: int
    bot_id: str
    bot_name: str
    bot_description: str
    bot_avatar: str
    bot_color: str

# Document schemas
class DocumentBase(BaseModel):
    document_type: str
    title: str
    data: dict

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    data: Optional[dict] = None

class DocumentApproval(BaseModel):
    approved: bool
    comment: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: int
    status: str
    created_by: int
    approver_id: int
    created_at: datetime
    updated_at: datetime
    approval_comment: Optional[str] = None

    class Config:
        from_attributes = True

# User Profile schemas
class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    role: str
    department: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 

# Схемы для Perplexity чата
class PerplexityMessage(BaseModel):
    role: str
    content: str

class PerplexityChatRequest(BaseModel):
    messages: List[PerplexityMessage]
    model: Optional[str] = "sonar"
    max_tokens: Optional[int] = 1024
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.9
    top_k: Optional[int] = 50
    presence_penalty: Optional[float] = 0.0
    frequency_penalty: Optional[float] = 0.0

class PerplexityChatResponse(BaseModel):
    id: str
    model: str
    created: int
    choices: List[dict]
    usage: dict

class PerplexityModel(BaseModel):
    id: str
    name: str
    description: str

class FileUploadRequest(BaseModel):
    file_name: str
    file_content: str  # base64 encoded
    messages: List[PerplexityMessage]
    model: Optional[str] = "sonar" 