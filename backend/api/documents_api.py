from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from app.database import get_db
from app.models import Document, User
from app.schemas import DocumentCreate, DocumentUpdate, DocumentResponse, DocumentApproval
from app import auth

# Используем правильную функцию аутентификации
get_current_user = auth.get_current_user

router = APIRouter(prefix="/documents", tags=["documents"])

@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    document_type: Optional[str] = None,
    status: Optional[str] = None
):
    """Получить список документов пользователя"""
    query = db.query(Document).filter(Document.created_by == current_user.id)
    
    if document_type:
        query = query.filter(Document.document_type == document_type)
    
    if status:
        query = query.filter(Document.status == status)
    
    documents = query.order_by(Document.created_at.desc()).all()
    return documents

@router.get("/pending-approvals", response_model=List[DocumentResponse])
async def get_pending_approvals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить документы, ожидающие согласования руководителем"""
    # Проверяем, является ли пользователь руководителем
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра документов на согласовании"
        )
    
    # Получаем документы, где текущий пользователь является согласующим
    documents = db.query(Document).filter(
        Document.approver_id == current_user.id,
        Document.status == "pending"
    ).order_by(Document.created_at.desc()).all()
    
    return documents

@router.post("/", response_model=DocumentResponse)
async def create_document(
    document: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать новый документ"""
    # Определяем согласующего (руководителя подразделения)
    approver = db.query(User).filter(
        User.department == current_user.department,
        User.role.in_(['admin', 'manager'])
    ).first()
    
    if not approver:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не найден руководитель подразделения для согласования"
        )
    
    # Создаем документ
    db_document = Document(
        document_type=document.document_type,
        title=document.title,
        data=json.dumps(document.data),
        status="pending",
        created_by=current_user.id,
        approver_id=approver.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    return db_document

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить документ по ID"""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Документ не найден"
        )
    
    # Проверяем права доступа
    if document.created_by != current_user.id and document.approver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет прав для просмотра этого документа"
        )
    
    return document

@router.put("/{document_id}/approve", response_model=DocumentResponse)
async def approve_document(
    document_id: int,
    approval: DocumentApproval,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Согласовать или отклонить документ"""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Документ не найден"
        )
    
    # Проверяем, что пользователь является согласующим
    if document.approver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет прав для согласования этого документа"
        )
    
    # Проверяем, что документ в статусе ожидания
    if document.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Документ уже обработан"
        )
    
    # Обновляем статус документа
    document.status = "approved" if approval.approved else "rejected"
    document.approval_comment = approval.comment
    document.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(document)
    
    return document

@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    document_update: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить документ"""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Документ не найден"
        )
    
    # Проверяем, что пользователь является автором документа
    if document.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет прав для редактирования этого документа"
        )
    
    # Проверяем, что документ можно редактировать
    if document.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Можно редактировать только черновики"
        )
    
    # Обновляем документ
    if document_update.title:
        document.title = document_update.title
    if document_update.data:
        document.data = json.dumps(document_update.data)
    
    document.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(document)
    
    return document

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить документ"""
    document = db.query(Document).filter(Document.id == document_id).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Документ не найден"
        )
    
    # Проверяем, что пользователь является автором документа
    if document.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет прав для удаления этого документа"
        )
    
    # Проверяем, что документ можно удалить
    if document.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Можно удалить только черновики"
        )
    
    db.delete(document)
    db.commit()
    
    return {"message": "Документ удален"}

@router.get("/types/available")
async def get_available_document_types(
    current_user: User = Depends(get_current_user)
):
    """Получить доступные типы документов для пользователя"""
    base_types = [
        {
            "type": "vacation",
            "title": "Заявление на отпуск",
            "icon": "calendar",
            "color": "blue",
            "available_for": ["user", "manager", "admin"]
        },
        {
            "type": "payment",
            "title": "Заявление на выплаты",
            "icon": "dollar",
            "color": "green",
            "available_for": ["user", "manager", "admin"]
        },
        {
            "type": "resignation",
            "title": "Заявление на увольнение",
            "icon": "logout",
            "color": "red",
            "available_for": ["user", "manager", "admin"]
        },
        {
            "type": "instruction",
            "title": "Служебная инструкция",
            "icon": "file-protect",
            "color": "purple",
            "available_for": ["user", "manager", "admin"],
            "is_printable": True
        }
    ]
    
    # Фильтруем типы документов по роли пользователя
    available_types = [
        doc_type for doc_type in base_types 
        if current_user.role in doc_type["available_for"]
    ]
    
    return available_types

@router.get("/statistics")
async def get_document_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить статистику по документам"""
    # Документы пользователя
    my_documents = db.query(Document).filter(Document.created_by == current_user.id).all()
    
    # Документы на согласовании (если пользователь руководитель)
    pending_approvals = []
    if current_user.role in ['admin', 'manager']:
        pending_approvals = db.query(Document).filter(
            Document.approver_id == current_user.id,
            Document.status == "pending"
        ).all()
    
    # Статистика
    stats = {
        "total_my_documents": len(my_documents),
        "pending_my_documents": len([d for d in my_documents if d.status == "pending"]),
        "approved_my_documents": len([d for d in my_documents if d.status == "approved"]),
        "rejected_my_documents": len([d for d in my_documents if d.status == "rejected"]),
        "pending_approvals": len(pending_approvals),
        "by_type": {}
    }
    
    # Статистика по типам документов
    for doc in my_documents:
        doc_type = doc.document_type
        if doc_type not in stats["by_type"]:
            stats["by_type"][doc_type] = {
                "total": 0,
                "pending": 0,
                "approved": 0,
                "rejected": 0
            }
        
        stats["by_type"][doc_type]["total"] += 1
        stats["by_type"][doc_type][doc.status] += 1
    
    return stats 