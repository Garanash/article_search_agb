from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Базовые схемы
class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user_id: int
    username: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None

class MessageResponse(BaseModel):
    message: str

# Пользователи
class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    role: Optional[str] = "user"
    department: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    avatar_url: Optional[str] = None

class UserOut(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    user: UserOut
    role: Optional[Dict[str, Any]] = None
    department: Optional[Dict[str, Any]] = None

# Роли
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleUpdate(RoleBase):
    pass

class RoleResponse(RoleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Отделы
class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    manager_id: Optional[int] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Статьи
class ArticleBase(BaseModel):
    title: str
    content: str
    category: Optional[str] = None
    tags: Optional[str] = None
    status: str = "draft"

class ArticleCreate(ArticleBase):
    pass

class ArticleUpdate(ArticleBase):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    status: Optional[str] = None

class ArticleOut(ArticleBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: datetime
    views_count: int
    rating: float

    class Config:
        from_attributes = True

# Поставщики
class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    rating: float = 0.0
    is_active: bool = True

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(SupplierBase):
    name: Optional[str] = None
    rating: Optional[float] = None
    is_active: Optional[bool] = None

class SupplierOut(SupplierBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Заявки
class RequestBase(BaseModel):
    title: str
    description: str
    supplier_id: Optional[int] = None
    status: str = "pending"
    priority: str = "medium"
    deadline: Optional[datetime] = None

class RequestCreate(RequestBase):
    pass

class RequestUpdate(RequestBase):
    title: Optional[str] = None
    description: Optional[str] = None
    supplier_id: Optional[int] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[datetime] = None

class RequestOut(RequestBase):
    id: int
    requester_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Документы
class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    file_path: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    category: Optional[str] = None
    status: str = "draft"

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(DocumentBase):
    title: Optional[str] = None
    description: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentWithUser(DocumentResponse):
    user: UserOut

# Вложения документов
class DocumentAttachmentBase(BaseModel):
    file_path: str
    file_name: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None

class DocumentAttachmentCreate(DocumentAttachmentBase):
    pass

class DocumentAttachmentResponse(DocumentAttachmentBase):
    id: int
    document_id: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

# Тикеты поддержки
class SupportTicketBase(BaseModel):
    title: str
    description: str
    status: str = "open"
    priority: str = "medium"
    category: Optional[str] = None
    assigned_to: Optional[int] = None

class SupportTicketCreate(SupportTicketBase):
    pass

class SupportTicketUpdate(SupportTicketBase):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    assigned_to: Optional[int] = None

class SupportTicketResponse(SupportTicketBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SupportTicketWithUser(SupportTicketResponse):
    user: UserOut

# Вложения тикетов
class TicketAttachmentBase(BaseModel):
    file_path: str
    file_name: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None

class TicketAttachmentCreate(TicketAttachmentBase):
    pass

class TicketAttachmentResponse(TicketAttachmentBase):
    id: int
    ticket_id: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

# Комментарии
class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(CommentBase):
    content: Optional[str] = None

class CommentResponse(CommentBase):
    id: int
    user_id: int
    ticket_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CommentWithUser(CommentResponse):
    user: UserOut

# Новости
class NewsBase(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    category: Optional[str] = None
    status: str = "draft"

class NewsCreate(NewsBase):
    pass

class NewsUpdate(NewsBase):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None

class NewsResponse(NewsBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: datetime
    views_count: int

    class Config:
        from_attributes = True

# Календарные события
class CalendarEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    event_type: Optional[str] = None
    priority: str = "medium"

class CalendarEventCreate(CalendarEventBase):
    pass

class CalendarEventUpdate(CalendarEventBase):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    event_type: Optional[str] = None
    priority: Optional[str] = None

class CalendarEventResponse(CalendarEventBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Телефонный справочник
class PhoneBookBase(BaseModel):
    name: str
    position: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    extension: Optional[str] = None

class PhoneBookCreate(PhoneBookBase):
    pass

class PhoneBookUpdate(PhoneBookBase):
    name: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    extension: Optional[str] = None

class PhoneBookResponse(PhoneBookBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Аналитика
class AnalyticsBase(BaseModel):
    period: str
    data: Dict[str, Any]

class AnalyticsCreate(AnalyticsBase):
    pass

class AnalyticsResponse(AnalyticsBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Настройки уведомлений
class NotificationSettingsBase(BaseModel):
    email_notifications: bool = True
    push_notifications: bool = True
    sms_notifications: bool = False
    notification_types: List[str] = ["important", "reminder", "update"]

class NotificationSettingsCreate(NotificationSettingsBase):
    pass

class NotificationSettingsUpdate(NotificationSettingsBase):
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    notification_types: Optional[List[str]] = None

class NotificationSettingsResponse(NotificationSettingsBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Экспорт данных
class ExportRequest(BaseModel):
    data_type: str  # users, articles, documents, tickets
    format: str = "excel"  # excel, csv, json
    filters: Optional[Dict[str, Any]] = None
    date_range: Optional[Dict[str, datetime]] = None

class ExportResponse(BaseModel):
    file_url: str
    file_name: str
    file_size: int
    expires_at: datetime
