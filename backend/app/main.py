from fastapi import FastAPI, Form, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base, Session
import os
from . import crud, google_search, schemas, models
from fastapi import BackgroundTasks
from typing import List
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from fastapi import status

app = FastAPI()

# Настройка базы данных SQLite
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, '..', 'test1234.db')}"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Article(Base):
    __tablename__ = "articles"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, index=True)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/token")
def login(username: str = Form(...), password: str = Form(...)):
    if username == "User" and password == "pass123":
        return {"access_token": "testtoken", "token_type": "bearer"}
    else:
        return {"error": "Incorrect username or password"}

@app.post("/articles/")
def add_article(code: str = Form(...), db: Session = Depends(get_db)):
    # Проверяем, есть ли уже артикул с таким code и request_id == null
    existing = db.query(models.Article).filter(models.Article.code == code, models.Article.request_id == None).first()
    if existing:
        return {"id": existing.id, "code": existing.code, "request_id": existing.request_id}
    # Если есть артикул с таким code, но он уже в запросе — можно создать новый (или вернуть ошибку, если запрещено)
    article = models.Article(code=code, user_id=1)
    db.add(article)
    db.commit()
    db.refresh(article)
    return {"id": article.id, "code": article.code, "request_id": article.request_id}

@app.get("/articles/")
def get_articles(db: Session = Depends(get_db)):
    articles = db.query(models.Article).all()
    return [{"id": a.id, "code": a.code, "request_id": a.request_id} for a in articles]

@app.delete("/articles/{article_id}")
def delete_article(article_id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(article)
    db.commit()
    return {"status": "deleted"}

@app.get("/suppliers/{article_id}", response_model=List[schemas.SupplierOut])
def get_suppliers(article_id: int, db: Session = Depends(get_db)):
    return crud.get_suppliers_for_article(db, article_id)

@app.post("/search_suppliers/{article_id}", response_model=List[schemas.SupplierOut])
async def search_suppliers(article_id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    # Удаляем старых поставщиков для этого артикула
    db.query(models.Supplier).filter(models.Supplier.article_id == article_id).delete()
    db.commit()
    regions = ["Europe", "North America", "South America", "Russia", "Asia"]
    suppliers = []
    for region in regions:
        found = await google_search.search_suppliers_perplexity(article.code, region)
        for s in found:
            supplier = crud.add_supplier(db, article_id, s["name"], s["website"], s["email"], s["country"])
            suppliers.append(supplier)
    return suppliers

class EmailUpdateRequest(BaseModel):
    email: str

@app.patch("/suppliers/{supplier_id}/email")
def update_supplier_email(supplier_id: int, req: EmailUpdateRequest, db: Session = Depends(get_db)):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    supplier.email = req.email
    db.commit()
    db.refresh(supplier)
    return {"id": supplier.id, "email": supplier.email}

@app.delete("/suppliers/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    success = crud.delete_supplier(db, supplier_id)
    if not success:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"status": "deleted"}

# Pydantic модель для списка сайтов
class WhoisCheckRequest(BaseModel):
    sites: List[str]

# Endpoint для проверки сайтов через whois
@app.post("/whois_check/")
async def whois_check(request: WhoisCheckRequest):
    valid = await google_search.check_websites_whois(request.sites)
    return {"valid": valid}

class EmailSearchRequest(BaseModel):
    company_name: str
    website: str
    region: str

@app.post("/search_email_perplexity/")
async def search_email_perplexity_ep(req: EmailSearchRequest):
    email = await google_search.search_email_perplexity(req.company_name, req.website, req.region)
    return {"email": email}

class EmailValidatedRequest(BaseModel):
    validated: bool

@app.patch("/suppliers/{supplier_id}/email_validated")
def update_supplier_email_validated(supplier_id: int, req: EmailValidatedRequest, db: Session = Depends(get_db)):
    supplier = crud.set_supplier_email_validated(db, supplier_id, req.validated)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"id": supplier.id, "email_validated": supplier.email_validated}

@app.post("/requests/", response_model=schemas.RequestOut)
def create_request(req: schemas.RequestCreate, db: Session = Depends(get_db)):
    request = models.Request(number=req.number)
    db.add(request)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Request with this number already exists"
        )
    db.refresh(request)
    return {
        "id": request.id,
        "number": request.number,
        "created_at": request.created_at.isoformat()
    }

@app.get("/requests/", response_model=List[schemas.RequestOut])
def get_requests(db: Session = Depends(get_db)):
    requests = db.query(models.Request).all()
    return [
        {
            "id": inv.id,
            "number": inv.number,
            "created_at": inv.created_at.isoformat() if inv.created_at else None
        }
        for inv in requests
    ]

@app.delete("/requests/{request_id}")
def delete_request(request_id: int, db: Session = Depends(get_db)):
    # Сбросить request_id у всех артикулов
    db.query(models.Article).filter(models.Article.request_id == request_id).update({models.Article.request_id: None})
    # Удалить сам запрос
    request = db.query(models.Request).filter(models.Request.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    db.delete(request)
    db.commit()
    return {"status": "deleted"}

@app.post("/requests/{request_id}/add_article/{article_id}")
def add_article_to_request(request_id: int, article_id: int, db: Session = Depends(get_db)):
    article = db.query(models.Article).filter(models.Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    article.request_id = request_id
    db.commit()
    return {"status": "added"}

@app.post("/requests/{request_id}/remove_article/{article_id}")
def remove_article_from_request(request_id: int, article_id: int, db: Session = Depends(get_db)):
    article = db.query(models.Article).filter(models.Article.id == article_id, models.Article.request_id == request_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found in this request")
    article.request_id = None
    db.commit()
    return {"status": "removed"}

@app.get("/requests/{request_id}/articles", response_model=List[schemas.ArticleOut])
def get_articles_by_request(request_id: int, db: Session = Depends(get_db)):
    return db.query(models.Article).filter(models.Article.request_id == request_id).all()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
) 