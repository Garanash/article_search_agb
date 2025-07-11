from sqlalchemy.orm import Session
from . import models, schemas, auth

def create_user(db: Session, username: str, password: str):
    hashed_password = auth.get_password_hash(password)
    db_user = models.User(username=username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_article_by_code(db: Session, code: str, user_id: int):
    return db.query(models.Article).filter(models.Article.code == code, models.Article.user_id == user_id).first()

def create_article(db: Session, code: str, user_id: int):
    db_article = models.Article(code=code, user_id=user_id)
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

def add_supplier(db: Session, article_id: int, name: str, website: str, email: str, country: str, user_id: int):
    supplier = models.Supplier(article_id=article_id, name=name, website=website, email=email, country=country, user_id=user_id)
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

def get_suppliers_for_article(db: Session, article_id: int):
    return db.query(models.Supplier).filter(models.Supplier.article_id == article_id).all()

def get_email_templates(db: Session):
    return db.query(models.EmailTemplate).all()

def add_analytics(db: Session, user_id: int, action: str, details: str):
    analytics = models.Analytics(user_id=user_id, action=action, details=details)
    db.add(analytics)
    db.commit()
    db.refresh(analytics)
    return analytics

def get_analytics(db: Session, user_id: int):
    return db.query(models.Analytics).filter(models.Analytics.user_id == user_id).all()

def get_user_bots(db: Session, user_id: int):
    """Получить всех ботов, назначенных пользователю"""
    return db.query(models.UserBot).filter(models.UserBot.user_id == user_id, models.UserBot.is_active == True).all()

def assign_bot_to_user(db: Session, user_id: int, bot_id: str, bot_name: str, bot_description: str, bot_avatar: str, bot_color: str):
    """Назначить бота пользователю"""
    # Проверяем, не назначен ли уже этот бот пользователю
    existing = db.query(models.UserBot).filter(
        models.UserBot.user_id == user_id, 
        models.UserBot.bot_id == bot_id
    ).first()
    
    if existing:
        # Если бот уже назначен, просто активируем его
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return existing
    
    # Создаем новое назначение
    user_bot = models.UserBot(
        user_id=user_id,
        bot_id=bot_id,
        bot_name=bot_name,
        bot_description=bot_description,
        bot_avatar=bot_avatar,
        bot_color=bot_color
    )
    db.add(user_bot)
    db.commit()
    db.refresh(user_bot)
    return user_bot

def remove_bot_from_user(db: Session, user_id: int, bot_id: str):
    """Удалить бота у пользователя (деактивировать)"""
    user_bot = db.query(models.UserBot).filter(
        models.UserBot.user_id == user_id,
        models.UserBot.bot_id == bot_id
    ).first()
    
    if user_bot:
        user_bot.is_active = False
        db.commit()
        db.refresh(user_bot)
        return user_bot
    return None

def get_all_users_with_bots(db: Session):
    """Получить всех пользователей с их назначенными ботами"""
    return db.query(models.User).all()

def delete_supplier(db: Session, supplier_id: int):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if supplier:
        db.delete(supplier)
        db.commit()
        return True
    return False

def set_supplier_email_validated(db: Session, supplier_id: int, validated: bool):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if supplier:
        supplier.email_validated = 1 if validated else 0
        db.commit()
        db.refresh(supplier)
        return supplier
    return None 