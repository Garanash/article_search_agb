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
    number: str

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
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    patronymic: Optional[str] = None
    avatar_url: Optional[str] = None

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
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    patronymic: Optional[str] = None

    class Config:
        from_attributes = True 

class SupportMessageBase(BaseModel):
    message: str
    department: Optional[str] = None

class SupportMessageCreate(SupportMessageBase):
    pass

class SupportMessageResponse(SupportMessageBase):
    id: int
    user_id: int
    is_from_admin: bool
    is_read: bool
    created_at: datetime
    user_username: str = None
    
    class Config:
        from_attributes = True

class SupportMessageList(BaseModel):
    messages: List[SupportMessageResponse]
    total: int 

class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    role: str
    department: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    force_password_change: bool
    created_at: datetime
    updated_at: datetime
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    patronymic: Optional[str] = None
    avatar_url: Optional[str] = None
    
    @property
    def is_admin(self) -> bool:
        return self.role == "admin"
    
    class Config:
        from_attributes = True 

# Схемы для системы управления обращениями
class SupportTicketBase(BaseModel):
    title: str
    description: str
    department: Optional[str] = None
    priority: Optional[str] = "medium"

class SupportTicketCreate(SupportTicketBase):
    user_id: Optional[int] = None

class SupportTicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[int] = None
    estimated_resolution: Optional[datetime] = None

class SupportTicketResponse(SupportTicketBase):
    id: int
    user_id: int
    status: str
    priority: str
    assigned_to: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    first_response_at: Optional[datetime] = None
    estimated_resolution: Optional[datetime] = None
    user_username: str = None
    assigned_admin_username: Optional[str] = None
    
    class Config:
        from_attributes = True

class SupportEventBase(BaseModel):
    event_type: str
    title: str
    description: Optional[str] = None
    event_date: Optional[datetime] = None  # deprecated
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class SupportEventCreate(SupportEventBase):
    pass

class SupportEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_completed: Optional[bool] = None

class SupportEventResponse(SupportEventBase):
    id: int
    ticket_id: Optional[int] = None
    is_completed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class SupportAnalytics(BaseModel):
    total_tickets: int
    open_tickets: int
    closed_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    average_response_time_hours: Optional[float] = None
    average_resolution_time_hours: Optional[float] = None
    tickets_by_department: dict
    tickets_by_priority: dict
    tickets_by_status: dict

class CalendarEvent(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    event_type: str
    ticket_id: Optional[int] = None
    is_completed: bool
    
    class Config:
        from_attributes = True 

class PhoneBookCreate(BaseModel):
    full_name: str
    department: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class PhoneBookUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class PhoneBookResponse(BaseModel):
    id: int
    full_name: str
    department: Optional[str]
    position: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 

class NewsCreate(BaseModel):
    title: str
    text: str
    image_url: Optional[str] = None

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None
    image_url: Optional[str] = None

class NewsResponse(BaseModel):
    id: int
    title: str
    text: str
    image_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Схемы для системы писем
class EmailCampaignCreate(BaseModel):
    name: str
    supplier_email: str
    supplier_name: str
    supplier_website: Optional[str] = None
    supplier_country: Optional[str] = None
    subject: str
    body: str
    article_ids: List[int]  # Список ID артикулов

class EmailCampaignUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    status: Optional[str] = None

class EmailCampaignResponse(BaseModel):
    id: int
    name: str
    supplier_email: str
    supplier_name: str
    supplier_website: Optional[str] = None
    supplier_country: Optional[str] = None
    status: str
    subject: str
    body: str
    user_id: int
    created_at: datetime
    updated_at: datetime
    sent_at: Optional[datetime] = None
    last_reply_at: Optional[datetime] = None
    articles_count: int
    messages_count: int
    
    class Config:
        from_attributes = True

class EmailCampaignArticleResponse(BaseModel):
    id: int
    campaign_id: int
    article_id: int
    request_id: int
    quantity: int
    notes: Optional[str] = None
    article_code: str
    
    class Config:
        from_attributes = True

class EmailMessageCreate(BaseModel):
    message_type: str  # "sent" или "received"
    subject: str
    body: str
    from_email: str
    to_email: str
    external_id: Optional[str] = None

class EmailMessageResponse(BaseModel):
    id: int
    campaign_id: int
    message_type: str
    subject: str
    body: str
    from_email: str
    to_email: str
    external_id: Optional[str] = None
    sent_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class EmailAttachmentResponse(BaseModel):
    id: int
    message_id: int
    filename: str
    file_path: str
    file_size: Optional[int]
    mime_type: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class SupplierGroupingRequest(BaseModel):
    request_ids: List[int]  # Список ID запросов для группировки
    template_id: Optional[int] = None  # ID шаблона письма

class SupplierGroupingArticle(BaseModel):
    code: str
    quantity: int
    requests: List[int]

class SupplierGroupingResponse(BaseModel):
    supplier_email: str
    supplier_name: str
    supplier_website: Optional[str] = None
    supplier_country: Optional[str] = None
    articles: List[SupplierGroupingArticle]
    requests: List[int]
    total_articles: int 

class ChatMessageBase(BaseModel):
    role: str
    content: str

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class ChatSessionBase(BaseModel):
    title: Optional[str] = None
    model: str
    system: Optional[str] = None
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 1.0
    max_tokens: Optional[int] = 2048

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
    model: Optional[str] = None
    system: Optional[str] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    max_tokens: Optional[int] = None

class ChatSessionResponse(ChatSessionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True 