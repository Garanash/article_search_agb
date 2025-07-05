from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
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

class Request(Base):
    __tablename__ = "requests"
    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    articles = relationship("Article", back_populates="request")

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
    name = Column(String)
    website = Column(String)
    email = Column(String)
    country = Column(String)
    email_validated = Column(Boolean, default=False)
    article = relationship("Article", back_populates="suppliers")

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