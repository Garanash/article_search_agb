from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.database import get_db
from app.models import User, Supplier, Article
from app.schemas import SupplierOut
from app import auth
from app import crud, google_search

get_current_user = auth.get_current_user

router = APIRouter(prefix="/suppliers", tags=["suppliers"])

class EmailUpdateRequest(BaseModel):
    email: str

class EmailValidatedRequest(BaseModel):
    validated: bool

@router.get("/{article_id}", response_model=List[SupplierOut])
def get_suppliers(
    article_id: int, 
    db: Session = Depends(get_db)
):
    """Получить поставщиков для артикула"""
    return crud.get_suppliers_for_article(db, article_id)

@router.post("/search/{article_id}", response_model=List[SupplierOut])
async def search_suppliers(
    article_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Поиск поставщиков для артикула"""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Артикул не найден")
    
    # Удаляем старых поставщиков для этого артикула
    db.query(Supplier).filter(Supplier.article_id == article_id).delete()
    db.commit()
    
    regions = ["Europe", "North America", "South America", "Russia", "Asia"]
    suppliers = []
    
    for region in regions:
        found = await google_search.search_suppliers_perplexity(article.code, region)
        for s in found:
            supplier = crud.add_supplier(
                db, 
                article_id, 
                s["name"], 
                s["website"], 
                s["email"], 
                s["country"],
                current_user.id
            )
            suppliers.append(supplier)
    
    # Записываем аналитику
    crud.add_analytics(db, current_user.id, "Поиск поставщиков", f"Артикул: {article.code}, найдено: {len(suppliers)} поставщиков")
    
    return suppliers

@router.patch("/{supplier_id}/email")
def update_supplier_email(
    supplier_id: int, 
    req: EmailUpdateRequest, 
    db: Session = Depends(get_db)
):
    """Обновить email поставщика"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Поставщик не найден")
    
    supplier.email = req.email
    db.commit()
    db.refresh(supplier)
    
    return {"id": supplier.id, "email": supplier.email}

@router.patch("/{supplier_id}/email-validated")
def update_supplier_email_validated(
    supplier_id: int, 
    req: EmailValidatedRequest, 
    db: Session = Depends(get_db)
):
    """Обновить статус валидации email поставщика"""
    supplier = crud.set_supplier_email_validated(db, supplier_id, req.validated)
    if not supplier:
        raise HTTPException(status_code=404, detail="Поставщик не найден")
    
    return {"id": supplier.id, "email_validated": supplier.email_validated}

@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int, 
    db: Session = Depends(get_db)
):
    """Удалить поставщика"""
    success = crud.delete_supplier(db, supplier_id)
    if not success:
        raise HTTPException(status_code=404, detail="Поставщик не найден")
    
    return {"status": "deleted"} 