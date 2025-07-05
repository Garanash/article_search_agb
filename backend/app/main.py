from fastapi import FastAPI, Form, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base, Session
import os
from . import crud, google_search, schemas, models, auth
from . import chat_api
from fastapi import BackgroundTasks
from typing import List
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from fastapi import status
import sys
sys.path.append('..')
from api import documents_api, users_api, perplexity_api

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
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = auth.datetime.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "force_password_change": user.force_password_change
    }

@app.post("/articles/")
def add_article(code: str = Form(...), current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Проверяем, есть ли уже артикул с таким code и request_id == null
    existing = db.query(models.Article).filter(models.Article.code == code, models.Article.request_id == None).first()
    if existing:
        return {"id": existing.id, "code": existing.code, "request_id": existing.request_id}
    # Если есть артикул с таким code, но он уже в запросе — можно создать новый (или вернуть ошибку, если запрещено)
    article = models.Article(code=code, user_id=current_user.id)
    db.add(article)
    db.commit()
    db.refresh(article)
    
    # Записываем аналитику
    crud.add_analytics(db, current_user.id, "Добавлен артикул", f"Артикул: {code}")
    
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
async def search_suppliers(article_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
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
    
    # Записываем аналитику
    crud.add_analytics(db, current_user.id, "Поиск поставщиков", f"Артикул: {article.code}, найдено: {len(suppliers)} поставщиков")
    
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

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@app.patch("/suppliers/{supplier_id}/email_validated")
def update_supplier_email_validated(supplier_id: int, req: EmailValidatedRequest, db: Session = Depends(get_db)):
    supplier = crud.set_supplier_email_validated(db, supplier_id, req.validated)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"id": supplier.id, "email_validated": supplier.email_validated}

@app.post("/change_password/")
def change_password(
    req: ChangePasswordRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Смена пароля пользователем"""
    # Проверяем текущий пароль
    if not auth.verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный текущий пароль"
        )
    
    # Хешируем новый пароль
    hashed_new_password = auth.get_password_hash(req.new_password)
    
    # Обновляем пароль и сбрасываем флаг принудительной смены
    current_user.hashed_password = hashed_new_password
    current_user.force_password_change = False
    db.commit()
    
    return {"message": "Пароль успешно изменен"}

@app.post("/requests/", response_model=schemas.RequestOut)
def create_request(req: schemas.RequestCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
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
    
    # Записываем аналитику
    crud.add_analytics(db, current_user.id, "Создан запрос", f"Номер запроса: {req.number}")
    
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
    articles = db.query(models.Article).filter(models.Article.request_id == request_id).all()
    return [
        {
            "id": a.id,
            "code": a.code,
            "request_id": a.request_id
        }
        for a in articles
    ]

@app.get("/analytics/")
def get_analytics(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Получить аналитику для текущего пользователя"""
    # Получаем аналитику пользователя
    user_analytics = crud.get_analytics(db, current_user.id)
    
    # Преобразуем в формат для фронтенда
    analytics_data = []
    for analytics in user_analytics:
        analytics_data.append({
            "id": analytics.id,
            "action": analytics.action,
            "timestamp": analytics.timestamp.isoformat() if analytics.timestamp else "",
            "details": analytics.details
        })
    
    return analytics_data

@app.get("/user_bots/", response_model=List[schemas.UserBotOut])
def get_user_bots(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Получить ботов, назначенных текущему пользователю"""
    user_bots = crud.get_user_bots(db, current_user.id)
    return [
        {
            "id": bot.id,
            "bot_id": bot.bot_id,
            "bot_name": bot.bot_name,
            "bot_description": bot.bot_description,
            "bot_avatar": bot.bot_avatar,
            "bot_color": bot.bot_color,
            "is_active": bot.is_active,
            "assigned_at": bot.assigned_at.isoformat() if bot.assigned_at else ""
        }
        for bot in user_bots
    ]

@app.post("/admin/assign_bot/", response_model=schemas.UserBotOut)
def assign_bot_to_user_admin(
    request: schemas.AssignBotRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Назначить бота пользователю (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can assign bots")
    
    user_bot = crud.assign_bot_to_user(
        db, 
        request.user_id, 
        request.bot_id, 
        request.bot_name, 
        request.bot_description, 
        request.bot_avatar, 
        request.bot_color
    )
    
    return {
        "id": user_bot.id,
        "bot_id": user_bot.bot_id,
        "bot_name": user_bot.bot_name,
        "bot_description": user_bot.bot_description,
        "bot_avatar": user_bot.bot_avatar,
        "bot_color": user_bot.bot_color,
        "is_active": user_bot.is_active,
        "assigned_at": user_bot.assigned_at.isoformat() if user_bot.assigned_at else ""
    }

@app.delete("/admin/remove_bot/{user_id}/{bot_id}")
def remove_bot_from_user_admin(
    user_id: int,
    bot_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить бота у пользователя (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can remove bots")
    
    result = crud.remove_bot_from_user(db, user_id, bot_id)
    if not result:
        raise HTTPException(status_code=404, detail="Bot assignment not found")
    
    return {"message": "Bot removed successfully"}

@app.get("/admin/users_with_bots/")
def get_users_with_bots(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Получить всех пользователей с их назначенными ботами (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can view this information")
    
    users = crud.get_all_users_with_bots(db)
    result = []
    
    for user in users:
        user_bots = crud.get_user_bots(db, user.id)
        result.append({
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "bots": [
                {
                    "bot_id": bot.bot_id,
                    "bot_name": bot.bot_name,
                    "bot_description": bot.bot_description,
                    "bot_avatar": bot.bot_avatar,
                    "bot_color": bot.bot_color
                }
                for bot in user_bots
            ]
        })
    
    return result

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(chat_api.router)
app.include_router(documents_api.router, prefix="/api")
app.include_router(users_api.router, prefix="/api")
app.include_router(perplexity_api.router, prefix="/api") 