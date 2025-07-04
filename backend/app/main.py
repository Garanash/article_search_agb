from fastapi import FastAPI, Form, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base, Session
import os
from . import crud, google_search, schemas, models
from fastapi import BackgroundTasks
from typing import List
from pydantic import BaseModel

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
    article = Article(code=code)
    db.add(article)
    db.commit()
    db.refresh(article)
    return {"id": article.id, "code": article.code}

@app.get("/articles/")
def get_articles(db: Session = Depends(get_db)):
    articles = db.query(Article).all()
    return [{"id": a.id, "code": a.code} for a in articles]

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
) 