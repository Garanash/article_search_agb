from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    patronymic = Column(String, nullable=True)
    hashed_password = Column(String)
    email = Column(String, unique=True, nullable=True)
    role = Column(String, default="user")
    department = Column(String, nullable=True)
    position = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    company = Column(String, nullable=True, default='ООО "Алмазгеобур"')
    force_password_change = Column(Boolean, default=True)  # Принудительная смена пароля
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    avatar_url = Column(String, nullable=True)

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    # Связи
    suppliers = relationship("Supplier", back_populates="user")
    requests = relationship("Request", back_populates="user")
    analytics = relationship("Analytics", back_populates="user")
    support_messages = relationship("SupportMessage", back_populates="user")

class Request(Base):
    __tablename__ = "requests"
    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    articles = relationship("Article", back_populates="request")
    user = relationship("User", back_populates="requests")

class Article(Base):
    __tablename__ = "articles"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=True)
    suppliers = relationship("Supplier", back_populates="article")
    request = relationship("Request", back_populates="articles")

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String)
    website = Column(String)
    email = Column(String)
    country = Column(String)
    email_validated = Column(Boolean, default=False)
    article = relationship("Article", back_populates="suppliers")
    user = relationship("User", back_populates="suppliers")

class EmailTemplate(Base):
    __tablename__ = "email_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    subject = Column(String)
    body = Column(Text)

class Analytics(Base):
    __tablename__ = "analytics"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    details = Column(Text)
    user = relationship("User", back_populates="analytics")

class UserBot(Base):
    __tablename__ = "user_bots"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bot_id = Column(String, nullable=False)  # ID бота (например, "ved-bot-1")
    bot_name = Column(String, nullable=False)  # Название бота
    bot_description = Column(Text)  # Описание бота
    bot_avatar = Column(String)  # URL аватара бота
    bot_color = Column(String)  # Цвет бота для UI
    is_active = Column(Boolean, default=True)  # Активен ли бот для пользователя
    assigned_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Связь с пользователем
    user = relationship("User", back_populates="assigned_bots")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    document_type = Column(String, nullable=False)  # vacation, payment, resignation, instruction
    title = Column(String, nullable=False)
    data = Column(Text, nullable=False)  # JSON данные документа
    status = Column(String, default="draft")  # draft, pending, approved, rejected
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    approval_comment = Column(Text, nullable=True)

    # Связи
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_documents")
    approver = relationship("User", foreign_keys=[approver_id], back_populates="approving_documents")

# Добавляем обратные связи в модель User
User.created_documents = relationship("Document", foreign_keys=[Document.created_by], back_populates="creator")
User.approving_documents = relationship("Document", foreign_keys=[Document.approver_id], back_populates="approver") 

# Добавляем обратную связь в модель User
User.assigned_bots = relationship("UserBot", back_populates="user") 

class SupportMessage(Base):
    __tablename__ = "support_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    department = Column(String, nullable=True)  # Департамент для адресации
    is_from_admin = Column(Boolean, default=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Связи
    user = relationship("User", back_populates="support_messages")

class SupportTicket(Base):
    __tablename__ = "support_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)  # Краткое описание проблемы
    description = Column(Text, nullable=False)  # Подробное описание
    department = Column(String, nullable=True)  # Департамент
    status = Column(String, default="open")  # open, in_progress, resolved, closed
    priority = Column(String, default="medium")  # low, medium, high, urgent
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)  # Назначенный админ
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)  # Время решения
    closed_at = Column(DateTime, nullable=True)  # Время закрытия
    first_response_at = Column(DateTime, nullable=True)  # Время первого ответа
    estimated_resolution = Column(DateTime, nullable=True)  # Ожидаемое время решения
    
    # Связи
    user = relationship("User", foreign_keys=[user_id], back_populates="support_tickets")
    assigned_admin = relationship("User", foreign_keys=[assigned_to])
    events = relationship("SupportEvent", back_populates="ticket")

class SupportEvent(Base):
    __tablename__ = "support_events"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"), nullable=True)  # теперь nullable
    event_type = Column(String, nullable=False)  # deadline, reminder, milestone
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    event_date = Column(DateTime, nullable=False)  # Дата события (deprecated, для совместимости)
    start_date = Column(DateTime, nullable=True)  # Начало события
    end_date = Column(DateTime, nullable=True)    # Конец события
    is_completed = Column(Boolean, default=False)  # Выполнено ли событие
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Связи
    ticket = relationship("SupportTicket", back_populates="events")

# Добавляем обратные связи в модель User
User.support_tickets = relationship("SupportTicket", foreign_keys=[SupportTicket.user_id], back_populates="user") 

class PhoneBook(Base):
    __tablename__ = "phonebook"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    department = Column(String, nullable=True)
    position = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow) 

class News(Base):
    __tablename__ = "news"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow) 