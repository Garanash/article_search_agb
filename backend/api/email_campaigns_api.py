from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Dict, Any
from datetime import datetime

from app.database import get_db
from app.models import User, Request, Article, Supplier, EmailCampaign, EmailCampaignArticle, EmailMessage, EmailAttachment
from app.schemas import (
    EmailCampaignCreate, EmailCampaignUpdate, EmailCampaignResponse, 
    EmailCampaignArticleResponse, EmailMessageCreate, EmailMessageResponse,
    SupplierGroupingRequest, SupplierGroupingResponse
)
from app import auth
from app import crud

get_current_user = auth.get_current_user

router = APIRouter(prefix="/email-campaigns", tags=["email-campaigns"])

@router.post("/group-suppliers", response_model=List[SupplierGroupingResponse])
def group_suppliers_by_email(
    request: SupplierGroupingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Группировка поставщиков по email для выбранных запросов"""
    
    # Получаем все артикулы из выбранных запросов
    articles = db.query(Article).filter(
        Article.request_id.in_(request.request_ids)
    ).all()
    
    if not articles:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Артикулы не найдены в выбранных запросах"
        )
    
    article_ids = [a.id for a in articles]
    
    # Получаем всех поставщиков для этих артикулов
    suppliers = db.query(Supplier).filter(
        Supplier.article_id.in_(article_ids),
        Supplier.email.isnot(None),
        Supplier.email != ""
    ).all()
    
    # Группируем поставщиков по email
    supplier_groups: Dict[str, Dict[str, Any]] = {}
    
    for supplier in suppliers:
        email = supplier.email.lower().strip()
        if email not in supplier_groups:
            supplier_groups[email] = {
                "supplier_email": email,
                "supplier_name": supplier.name,
                "supplier_website": supplier.website,
                "supplier_country": supplier.country,
                "articles": {},
                "requests": set(),
                "total_articles": 0
            }
        
        # Добавляем артикул
        article = db.query(Article).filter(Article.id == supplier.article_id).first()
        if article:
            if article.code not in supplier_groups[email]["articles"]:
                supplier_groups[email]["articles"][article.code] = {
                    "code": article.code,
                    "quantity": 0,
                    "requests": set()
                }
            supplier_groups[email]["articles"][article.code]["quantity"] += 1
            supplier_groups[email]["articles"][article.code]["requests"].add(article.request_id)
            supplier_groups[email]["requests"].add(article.request_id)
            supplier_groups[email]["total_articles"] += 1
    
    # Преобразуем в список ответов
    result = []
    for email, group in supplier_groups.items():
        articles_list = [
            {
                "code": article_data["code"],
                "quantity": article_data["quantity"],
                "requests": list(article_data["requests"])
            }
            for article_data in group["articles"].values()
        ]
        
        result.append(SupplierGroupingResponse(
            supplier_email=email,
            supplier_name=group["supplier_name"],
            supplier_website=group["supplier_website"],
            supplier_country=group["supplier_country"],
            articles=articles_list,
            requests=list(group["requests"]),
            total_articles=group["total_articles"]
        ))
    
    return result

@router.post("/", response_model=EmailCampaignResponse)
def create_email_campaign(
    campaign: EmailCampaignCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать новую email кампанию"""
    
    # Создаем кампанию
    db_campaign = EmailCampaign(
        name=campaign.name,
        supplier_email=campaign.supplier_email,
        supplier_name=campaign.supplier_name,
        supplier_website=campaign.supplier_website,
        supplier_country=campaign.supplier_country,
        subject=campaign.subject,
        body=campaign.body,
        user_id=current_user.id
    )
    
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    
    # Добавляем артикулы в кампанию
    for article_id in campaign.article_ids:
        article = db.query(Article).filter(Article.id == article_id).first()
        if article:
            campaign_article = EmailCampaignArticle(
                campaign_id=db_campaign.id,
                article_id=article_id,
                request_id=article.request_id,
                quantity=1
            )
            db.add(campaign_article)
    
    db.commit()
    
    # Записываем аналитику
    crud.add_analytics(db, current_user.id, "Создана email кампания", f"Кампания: {campaign.name}")
    
    return db_campaign

@router.get("/", response_model=List[EmailCampaignResponse])
def get_email_campaigns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить список email кампаний пользователя"""
    
    campaigns = db.query(EmailCampaign).filter(
        EmailCampaign.user_id == current_user.id
    ).order_by(EmailCampaign.created_at.desc()).all()
    
    result = []
    for campaign in campaigns:
        # Подсчитываем количество артикулов и сообщений
        articles_count = db.query(EmailCampaignArticle).filter(
            EmailCampaignArticle.campaign_id == campaign.id
        ).count()
        
        messages_count = db.query(EmailMessage).filter(
            EmailMessage.campaign_id == campaign.id
        ).count()
        
        campaign_dict = {
            "id": campaign.id,
            "name": campaign.name,
            "supplier_email": campaign.supplier_email,
            "supplier_name": campaign.supplier_name,
            "supplier_website": campaign.supplier_website,
            "supplier_country": campaign.supplier_country,
            "status": campaign.status,
            "subject": campaign.subject,
            "body": campaign.body,
            "user_id": campaign.user_id,
            "created_at": campaign.created_at,
            "updated_at": campaign.updated_at,
            "sent_at": campaign.sent_at,
            "last_reply_at": campaign.last_reply_at,
            "articles_count": articles_count,
            "messages_count": messages_count
        }
        result.append(campaign_dict)
    
    return result

@router.get("/{campaign_id}", response_model=EmailCampaignResponse)
def get_email_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить email кампанию по ID"""
    
    campaign = db.query(EmailCampaign).filter(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Кампания не найдена"
        )
    
    # Подсчитываем количество артикулов и сообщений
    articles_count = db.query(EmailCampaignArticle).filter(
        EmailCampaignArticle.campaign_id == campaign.id
    ).count()
    
    messages_count = db.query(EmailMessage).filter(
        EmailMessage.campaign_id == campaign.id
    ).count()
    
    campaign_dict = {
        "id": campaign.id,
        "name": campaign.name,
        "supplier_email": campaign.supplier_email,
        "supplier_name": campaign.supplier_name,
        "supplier_website": campaign.supplier_website,
        "supplier_country": campaign.supplier_country,
        "status": campaign.status,
        "subject": campaign.subject,
        "body": campaign.body,
        "user_id": campaign.user_id,
        "created_at": campaign.created_at,
        "updated_at": campaign.updated_at,
        "sent_at": campaign.sent_at,
        "last_reply_at": campaign.last_reply_at,
        "articles_count": articles_count,
        "messages_count": messages_count
    }
    
    return campaign_dict

@router.put("/{campaign_id}", response_model=EmailCampaignResponse)
def update_email_campaign(
    campaign_id: int,
    campaign_update: EmailCampaignUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить email кампанию"""
    
    campaign = db.query(EmailCampaign).filter(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Кампания не найдена"
        )
    
    # Обновляем поля
    update_data = campaign_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(campaign, field, value)
    
    campaign.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(campaign)
    
    return campaign

@router.delete("/{campaign_id}")
def delete_email_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить email кампанию"""
    
    campaign = db.query(EmailCampaign).filter(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Кампания не найдена"
        )
    
    # Удаляем связанные записи
    db.query(EmailCampaignArticle).filter(
        EmailCampaignArticle.campaign_id == campaign_id
    ).delete()
    
    db.query(EmailMessage).filter(
        EmailMessage.campaign_id == campaign_id
    ).delete()
    
    db.delete(campaign)
    db.commit()
    
    return {"status": "deleted"}

@router.get("/{campaign_id}/articles", response_model=List[EmailCampaignArticleResponse])
def get_campaign_articles(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить артикулы кампании"""
    
    # Проверяем доступ к кампании
    campaign = db.query(EmailCampaign).filter(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Кампания не найдена"
        )
    
    articles = db.query(EmailCampaignArticle, Article).join(
        Article, EmailCampaignArticle.article_id == Article.id
    ).filter(
        EmailCampaignArticle.campaign_id == campaign_id
    ).all()
    
    result = []
    for campaign_article, article in articles:
        result.append(EmailCampaignArticleResponse(
            id=campaign_article.id,
            campaign_id=campaign_article.campaign_id,
            article_id=campaign_article.article_id,
            request_id=campaign_article.request_id,
            quantity=campaign_article.quantity,
            notes=campaign_article.notes,
            article_code=article.code
        ))
    
    return result

@router.get("/{campaign_id}/messages", response_model=List[EmailMessageResponse])
def get_campaign_messages(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить сообщения кампании"""
    
    # Проверяем доступ к кампании
    campaign = db.query(EmailCampaign).filter(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Кампания не найдена"
        )
    
    messages = db.query(EmailMessage).filter(
        EmailMessage.campaign_id == campaign_id
    ).order_by(EmailMessage.sent_at).all()
    
    return messages

@router.post("/{campaign_id}/messages", response_model=EmailMessageResponse)
def add_campaign_message(
    campaign_id: int,
    message: EmailMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Добавить сообщение в кампанию"""
    
    # Проверяем доступ к кампании
    campaign = db.query(EmailCampaign).filter(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Кампания не найдена"
        )
    
    # Создаем сообщение
    db_message = EmailMessage(
        campaign_id=campaign_id,
        message_type=message.message_type,
        subject=message.subject,
        body=message.body,
        from_email=message.from_email,
        to_email=message.to_email,
        external_id=message.external_id
    )
    
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    # Обновляем статус кампании
    if message.message_type == "sent":
        campaign.status = "sent"
        campaign.sent_at = datetime.utcnow()
    elif message.message_type == "received":
        campaign.status = "replied"
        campaign.last_reply_at = datetime.utcnow()
    
    campaign.updated_at = datetime.utcnow()
    db.commit()
    
    return db_message

@router.post("/{campaign_id}/send")
def send_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Отправить кампанию (симуляция отправки)"""
    
    campaign = db.query(EmailCampaign).filter(
        EmailCampaign.id == campaign_id,
        EmailCampaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Кампания не найдена"
        )
    
    if campaign.status == "sent":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Кампания уже отправлена"
        )
    
    # Создаем сообщение об отправке
    sent_message = EmailMessage(
        campaign_id=campaign_id,
        message_type="sent",
        subject=campaign.subject,
        body=campaign.body,
        from_email=current_user.email or "noreply@company.com",
        to_email=campaign.supplier_email,
        external_id=f"sent_{campaign_id}_{datetime.utcnow().timestamp()}"
    )
    
    db.add(sent_message)
    
    # Обновляем статус кампании
    campaign.status = "sent"
    campaign.sent_at = datetime.utcnow()
    campaign.updated_at = datetime.utcnow()
    
    db.commit()
    
    # Записываем аналитику
    crud.add_analytics(db, current_user.id, "Отправлена email кампания", f"Кампания: {campaign.name}")
    
    return {"status": "sent", "message_id": sent_message.id} 