from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import hashlib

from api.v1.models import *
from api.v1.schemas import *
from core.password import get_password_hash, verify_password

# Пользователи
def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate) -> User:
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role,
        department=user.department
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    
    # Если обновляется пароль, хешируем его
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    
    db.delete(db_user)
    db.commit()
    return True

# Роли
def get_role(db: Session, role_id: int) -> Optional[Role]:
    return db.query(Role).filter(Role.id == role_id).first()

def get_roles(db: Session, skip: int = 0, limit: int = 100) -> List[Role]:
    return db.query(Role).offset(skip).limit(limit).all()

def create_role(db: Session, role: RoleCreate) -> Role:
    db_role = Role(**role.dict())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

# Отделы
def get_department(db: Session, department_id: int) -> Optional[Department]:
    return db.query(Department).filter(Department.id == department_id).first()

def get_departments(db: Session, skip: int = 0, limit: int = 100) -> List[Department]:
    return db.query(Department).offset(skip).limit(limit).all()

def create_department(db: Session, department: DepartmentCreate) -> Department:
    db_department = Department(**department.dict())
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department

# Статьи
def get_article(db: Session, article_id: int) -> Optional[Article]:
    return db.query(Article).filter(Article.id == article_id).first()

def get_articles(db: Session, skip: int = 0, limit: int = 100, category: Optional[str] = None) -> List[Article]:
    query = db.query(Article)
    if category:
        query = query.filter(Article.category == category)
    return query.offset(skip).limit(limit).all()

def create_article(db: Session, article: ArticleCreate, author_id: int) -> Article:
    db_article = Article(**article.dict(), author_id=author_id)
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

def update_article(db: Session, article_id: int, article_update: ArticleUpdate) -> Optional[Article]:
    db_article = get_article(db, article_id)
    if not db_article:
        return None
    
    update_data = article_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_article, field, value)
    
    db_article.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_article)
    return db_article

def delete_article(db: Session, article_id: int) -> bool:
    db_article = get_article(db, article_id)
    if not db_article:
        return False
    
    db.delete(db_article)
    db.commit()
    return True

# Поставщики
def get_supplier(db: Session, supplier_id: int) -> Optional[Supplier]:
    return db.query(Supplier).filter(Supplier.id == supplier_id).first()

def get_suppliers(db: Session, skip: int = 0, limit: int = 100) -> List[Supplier]:
    return db.query(Supplier).filter(Supplier.is_active == True).offset(skip).limit(limit).all()

def create_supplier(db: Session, supplier: SupplierCreate) -> Supplier:
    db_supplier = Supplier(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

def update_supplier(db: Session, supplier_id: int, supplier_update: SupplierUpdate) -> Optional[Supplier]:
    db_supplier = get_supplier(db, supplier_id)
    if not db_supplier:
        return None
    
    update_data = supplier_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_supplier, field, value)
    
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

# Заявки
def get_request(db: Session, request_id: int) -> Optional[Request]:
    return db.query(Request).filter(Request.id == request_id).first()

def get_requests(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None) -> List[Request]:
    query = db.query(Request)
    if user_id:
        query = query.filter(Request.requester_id == user_id)
    return query.offset(skip).limit(limit).all()

def create_request(db: Session, request: RequestCreate, requester_id: int) -> Request:
    db_request = Request(**request.dict(), requester_id=requester_id)
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

def update_request(db: Session, request_id: int, request_update: RequestUpdate) -> Optional[Request]:
    db_request = get_request(db, request_id)
    if not db_request:
        return None
    
    update_data = request_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_request, field, value)
    
    db_request.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_request)
    return db_request

# Документы
def get_document(db: Session, document_id: int) -> Optional[Document]:
    return db.query(Document).filter(Document.id == document_id).first()

def get_documents(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None) -> List[Document]:
    query = db.query(Document)
    if user_id:
        query = query.filter(Document.user_id == user_id)
    return query.offset(skip).limit(limit).all()

def create_document(db: Session, document: DocumentCreate, user_id: int) -> Document:
    db_document = Document(**document.dict(), user_id=user_id)
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

def update_document(db: Session, document_id: int, document_update: DocumentUpdate) -> Optional[Document]:
    db_document = get_document(db, document_id)
    if not db_document:
        return None
    
    update_data = document_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_document, field, value)
    
    db_document.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_document)
    return db_document

def delete_document(db: Session, document_id: int) -> bool:
    db_document = get_document(db, document_id)
    if not db_document:
        return False
    
    db.delete(db_document)
    db.commit()
    return True

# Тикеты поддержки
def get_support_ticket(db: Session, ticket_id: int) -> Optional[SupportTicket]:
    return db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()

def get_support_tickets(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None) -> List[SupportTicket]:
    query = db.query(SupportTicket)
    if user_id:
        query = query.filter(SupportTicket.user_id == user_id)
    return query.offset(skip).limit(limit).all()

def create_support_ticket(db: Session, ticket: SupportTicketCreate, user_id: int) -> SupportTicket:
    db_ticket = SupportTicket(**ticket.dict(), user_id=user_id)
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

def update_support_ticket(db: Session, ticket_id: int, ticket_update: SupportTicketUpdate) -> Optional[SupportTicket]:
    db_ticket = get_support_ticket(db, ticket_id)
    if not db_ticket:
        return None
    
    update_data = ticket_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_ticket, field, value)
    
    # Если статус изменен на resolved, устанавливаем время решения
    if "status" in update_data and update_data["status"] == "resolved":
        db_ticket.resolved_at = datetime.utcnow()
    
    db_ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

def delete_support_ticket(db: Session, ticket_id: int) -> bool:
    db_ticket = get_support_ticket(db, ticket_id)
    if not db_ticket:
        return False
    
    db.delete(db_ticket)
    db.commit()
    return True

# Комментарии
def get_comment(db: Session, comment_id: int) -> Optional[Comment]:
    return db.query(Comment).filter(Comment.id == comment_id).first()

def get_comments_by_ticket(db: Session, ticket_id: int, skip: int = 0, limit: int = 100) -> List[Comment]:
    return db.query(Comment).filter(Comment.ticket_id == ticket_id).offset(skip).limit(limit).all()

def create_comment(db: Session, comment: CommentCreate, user_id: int, ticket_id: int) -> Comment:
    db_comment = Comment(**comment.dict(), user_id=user_id, ticket_id=ticket_id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

def update_comment(db: Session, comment_id: int, comment_update: CommentUpdate) -> Optional[Comment]:
    db_comment = get_comment(db, comment_id)
    if not db_comment:
        return None
    
    update_data = comment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_comment, field, value)
    
    db_comment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_comment)
    return db_comment

def delete_comment(db: Session, comment_id: int) -> bool:
    db_comment = get_comment(db, comment_id)
    if not db_comment:
        return False
    
    db.delete(db_comment)
    db.commit()
    return True

# Новости
def get_news(db: Session, news_id: int) -> Optional[News]:
    return db.query(News).filter(News.id == news_id).first()

def get_news_list(db: Session, skip: int = 0, limit: int = 100, category: Optional[str] = None) -> List[News]:
    query = db.query(News).filter(News.status == "published")
    if category:
        query = query.filter(News.category == category)
    return query.order_by(desc(News.created_at)).offset(skip).limit(limit).all()

def create_news(db: Session, news: NewsCreate, author_id: int) -> News:
    db_news = News(**news.dict(), author_id=author_id)
    db.add(db_news)
    db.commit()
    db.refresh(db_news)
    return db_news

def update_news(db: Session, news_id: int, news_update: NewsUpdate) -> Optional[News]:
    db_news = get_news(db, news_id)
    if not db_news:
        return None
    
    update_data = news_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_news, field, value)
    
    db_news.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_news)
    return db_news

def delete_news(db: Session, news_id: int) -> bool:
    db_news = get_news(db, news_id)
    if not db_news:
        return False
    
    db.delete(db_news)
    db.commit()
    return True

# Календарные события
def get_calendar_event(db: Session, event_id: int) -> Optional[CalendarEvent]:
    return db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()

def get_calendar_events(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None, 
                       start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[CalendarEvent]:
    query = db.query(CalendarEvent)
    
    if user_id:
        query = query.filter(CalendarEvent.created_by == user_id)
    
    if start_date:
        query = query.filter(CalendarEvent.start_time >= start_date)
    
    if end_date:
        query = query.filter(CalendarEvent.end_time <= end_date)
    
    return query.order_by(asc(CalendarEvent.start_time)).offset(skip).limit(limit).all()

def create_calendar_event(db: Session, event: CalendarEventCreate, created_by: int) -> CalendarEvent:
    db_event = CalendarEvent(**event.dict(), created_by=created_by)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def update_calendar_event(db: Session, event_id: int, event_update: CalendarEventUpdate) -> Optional[CalendarEvent]:
    db_event = get_calendar_event(db, event_id)
    if not db_event:
        return None
    
    update_data = event_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_event, field, value)
    
    db_event.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_event)
    return db_event

def delete_calendar_event(db: Session, event_id: int) -> bool:
    db_event = get_calendar_event(db, event_id)
    if not db_event:
        return False
    
    db.delete(db_event)
    db.commit()
    return True

# Телефонный справочник
def get_phone_contact(db: Session, contact_id: int) -> Optional[PhoneBook]:
    return db.query(PhoneBook).filter(PhoneBook.id == contact_id).first()

def get_phone_contacts(db: Session, skip: int = 0, limit: int = 100, department: Optional[str] = None) -> List[PhoneBook]:
    query = db.query(PhoneBook)
    if department:
        query = query.filter(PhoneBook.department == department)
    return query.offset(skip).limit(limit).all()

def create_phone_contact(db: Session, contact: PhoneBookCreate) -> PhoneBook:
    db_contact = PhoneBook(**contact.dict())
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

def update_phone_contact(db: Session, contact_id: int, contact_update: PhoneBookUpdate) -> Optional[PhoneBook]:
    db_contact = get_phone_contact(db, contact_id)
    if not db_contact:
        return None
    
    update_data = contact_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_contact, field, value)
    
    db_contact.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_contact)
    return db_contact

def delete_phone_contact(db: Session, contact_id: int) -> bool:
    db_contact = get_phone_contact(db, contact_id)
    if not db_contact:
        return False
    
    db.delete(db_contact)
    db.commit()
    return True

# Аналитика
def get_admin_stats(db: Session) -> Dict[str, Any]:
    """Получение административной статистики"""
    total_users = db.query(func.count(User.id)).scalar()
    total_articles = db.query(func.count(Article.id)).scalar()
    total_documents = db.query(func.count(Document.id)).scalar()
    total_tickets = db.query(func.count(SupportTicket.id)).scalar()
    
    # Статистика по статусам тикетов
    open_tickets = db.query(func.count(SupportTicket.id)).filter(SupportTicket.status == "open").scalar()
    resolved_tickets = db.query(func.count(SupportTicket.id)).filter(SupportTicket.status == "resolved").scalar()
    
    # Статистика по пользователям
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_articles": total_articles,
        "total_documents": total_documents,
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "resolved_tickets": resolved_tickets,
        "resolution_rate": (resolved_tickets / total_tickets * 100) if total_tickets > 0 else 0
    }
