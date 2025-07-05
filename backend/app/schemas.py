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
    ticket_id: int
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
    ticket_id: int
    is_completed: bool
    
    class Config:
        from_attributes = True 