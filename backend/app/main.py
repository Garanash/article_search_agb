from fastapi import FastAPI, Form, Depends, HTTPException, Body, Security
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base, Session
import os
import datetime
from . import crud, google_search, schemas, models, auth
from . import chat_api
from .routers import support_tickets, admin_dashboard
from fastapi import BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from fastapi import status
import sys
sys.path.append('..')
from api import documents_api, users_api, support_api, auth_api, suppliers_api, requests_api, analytics_api, articles_api, chat_api as new_chat_api
import csv
from fastapi.responses import StreamingResponse, JSONResponse, Response
from io import StringIO
from fastapi import UploadFile, File
import io
import json
import pandas as pd
from fastapi.staticfiles import StaticFiles
from app.models import User, PhoneBook
from fastapi import APIRouter
from sqlalchemy.inspection import inspect

app = FastAPI()

# Раздача аватарок пользователей
AVATAR_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'avatars')
os.makedirs(AVATAR_DIR, exist_ok=True)
app.mount("/static/avatars", StaticFiles(directory=AVATAR_DIR), name="avatars")

# Раздача изображений новостей
NEWS_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'news')
os.makedirs(NEWS_DIR, exist_ok=True)
app.mount("/static/news", StaticFiles(directory=NEWS_DIR), name="news")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Используем настройки базы данных из database.py
from .database import engine, Base, get_db

Base.metadata.create_all(bind=engine)

@app.post("/token")
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = datetime.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "force_password_change": user.force_password_change
    }

# Удаляю старые ручки /articles/ (add_article, get_articles, delete_article)

# --- ARTICLES API ---
api_router = APIRouter()

@api_router.get("/articles/")
def get_articles(db: Session = Depends(get_db)):
    articles = db.query(models.Article).all()
    return [{"id": a.id, "code": a.code, "request_id": a.request_id} for a in articles]

class AddArticleRequest(BaseModel):
    code: str

@api_router.post("/articles/")
def add_article(req: AddArticleRequest, db: Session = Depends(get_db)):
    article = models.Article(code=req.code)
    db.add(article)
    db.commit()
    db.refresh(article)
    return {"id": article.id, "code": article.code, "request_id": article.request_id}

@api_router.delete("/articles/{article_id}")
def delete_article(article_id: int, db: Session = Depends(get_db)):
    article = db.query(models.Article).filter(models.Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(article)
    db.commit()
    return {"status": "deleted"}

@api_router.get("/suppliers/{article_id}", response_model=List[schemas.SupplierOut])
def get_suppliers(article_id: int, db: Session = Depends(get_db)):
    return crud.get_suppliers_for_article(db, article_id)

@api_router.post("/search_suppliers/{article_id}", response_model=List[schemas.SupplierOut])
async def search_suppliers(article_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    article = db.query(models.Article).filter(models.Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    db.query(models.Supplier).filter(models.Supplier.article_id == article_id).delete()
    db.commit()
    regions = ["Europe", "North America", "South America", "Russia", "Asia"]
    suppliers = []
    for region in regions:
        found = await google_search.search_suppliers_perplexity(article.code, region)
        for s in found:
            supplier = crud.add_supplier(db, article_id, s["name"], s["website"], s["email"], s["country"], current_user.id)
            suppliers.append(supplier)
    crud.add_analytics(db, current_user.id, "Поиск поставщиков", f"Артикул: {article.code}, найдено: {len(suppliers)} поставщиков")
    return suppliers

class EmailUpdateRequest(BaseModel):
    email: str

@api_router.patch("/suppliers/{supplier_id}/email")
def update_supplier_email(supplier_id: int, req: EmailUpdateRequest, db: Session = Depends(get_db)):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    supplier.email = req.email
    db.commit()
    db.refresh(supplier)
    return {"id": supplier.id, "email": supplier.email}

@api_router.delete("/suppliers/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    success = crud.delete_supplier(db, supplier_id)
    if not success:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"status": "deleted"}

# Pydantic модель для списка сайтов
class WhoisCheckRequest(BaseModel):
    sites: List[str]

# Endpoint для проверки сайтов через whois
@api_router.post("/whois_check/")
async def whois_check(request: WhoisCheckRequest):
    valid = await google_search.check_websites_whois(request.sites)
    return {"valid": valid}

class EmailSearchRequest(BaseModel):
    company_name: str
    website: str
    region: str

@api_router.post("/search_email_perplexity/")
async def search_email_perplexity_ep(req: EmailSearchRequest):
    email = await google_search.search_email_perplexity(req.company_name, req.website, req.region)
    return {"email": email}

class EmailValidatedRequest(BaseModel):
    validated: bool

class ChangePasswordRequest(BaseModel):
    current_password: Optional[str] = None
    new_password: str

@api_router.post("/change_password/")
def change_password(
    req: ChangePasswordRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Сменить пароль пользователя"""
    if req.current_password is not None:
        # Проверяем текущий пароль
        if not auth.verify_password(req.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    
    # Хешируем новый пароль
    hashed_password = auth.get_password_hash(req.new_password)
    
    # Обновляем пароль в базе
    current_user.hashed_password = hashed_password
    current_user.force_password_change = False
    db.commit()
    
    return {"message": "Пароль успешно изменен"}

@api_router.get("/analytics/")
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

@api_router.get("/user_bots/", response_model=List[schemas.UserBotOut])
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

@api_router.post("/admin/assign_bot/", response_model=schemas.UserBotOut)
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

@api_router.delete("/admin/remove_bot/{user_id}/{bot_id}")
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

@api_router.get("/admin/users_with_bots/")
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

@api_router.get("/admin/table/{table_name}")
def get_table_data(table_name: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Только для администратора")
    model_map = {
        "users": models.User,
        "articles": models.Article,
        "suppliers": models.Supplier,
        "requests": models.Request,
        "analytics": models.Analytics,
        # Добавьте другие таблицы по необходимости
    }
    if table_name not in model_map:
        raise HTTPException(status_code=400, detail="Неизвестная таблица")
    model = model_map[table_name]
    rows = db.query(model).all()
    columns = [c.name for c in inspect(model).c]
    return [{col: getattr(row, col) for col in columns} for row in rows]

@api_router.post("/admin/table/{table_name}")
def add_table_row(table_name: str, row: dict, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Только для администратора")
    model_map = {
        "users": models.User,
        "articles": models.Article,
        "suppliers": models.Supplier,
        "requests": models.Request,
        "analytics": models.Analytics,
        # Добавьте другие таблицы по необходимости
    }
    if table_name not in model_map:
        raise HTTPException(status_code=400, detail="Неизвестная таблица")
    model = model_map[table_name]
    obj = model(**row)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    columns = [c.name for c in inspect(model).c]
    return {col: getattr(obj, col) for col in columns}

@api_router.delete("/admin/table/{table_name}/{row_id}")
def delete_table_row(table_name: str, row_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Только для администратора")
    model_map = {
        "users": models.User,
        "articles": models.Article,
        "suppliers": models.Supplier,
        "requests": models.Request,
        "analytics": models.Analytics,
        # Добавьте другие таблицы по необходимости
    }
    if table_name not in model_map:
        raise HTTPException(status_code=400, detail="Неизвестная таблица")
    model = model_map[table_name]
    obj = db.query(model).get(row_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Строка не найдена")
    db.delete(obj)
    db.commit()
    return {"status": "deleted"}

@api_router.get("/admin/export_xlsx/{table_name}")
def export_table_xlsx(table_name: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Только для администратора")
    model_map = {
        "users": models.User,
        "articles": models.Article,
        "suppliers": models.Supplier,
        "requests": models.Request,
        "analytics": models.Analytics,
    }
    if table_name not in model_map:
        raise HTTPException(status_code=400, detail="Неизвестная таблица")
    model = model_map[table_name]
    rows = db.query(model).all()
    columns = [c.name for c in inspect(model).c]
    data = [{col: getattr(row, col) for col in columns} for row in rows]
    df = pd.DataFrame(data)
    output = io.BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)
    return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f"attachment; filename={table_name}.xlsx"})

@api_router.get("/admin/export_json/{table_name}")
def export_table_json(table_name: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Только для администратора")
    model_map = {
        "users": models.User,
        "articles": models.Article,
        "suppliers": models.Supplier,
        "requests": models.Request,
        "analytics": models.Analytics,
    }
    if table_name not in model_map:
        raise HTTPException(status_code=400, detail="Неизвестная таблица")
    model = model_map[table_name]
    rows = db.query(model).all()
    columns = [c.name for c in inspect(model).c]
    data = [{col: getattr(row, col) for col in columns} for row in rows]
    return JSONResponse(content=data)

@api_router.post("/admin/import_xlsx/{table_name}")
async def import_table_xlsx(table_name: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db), file: UploadFile = File(...)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Только для администратора")
    model_map = {
        "users": models.User,
        "articles": models.Article,
        "suppliers": models.Supplier,
        "requests": models.Request,
        "analytics": models.Analytics,
    }
    if table_name not in model_map:
        raise HTTPException(status_code=400, detail="Неизвестная таблица")
    model = model_map[table_name]
    contents = await file.read()
    df = pd.read_excel(io.BytesIO(contents))
    for _, row in df.iterrows():
        obj = model(**row.to_dict())
        db.add(obj)
    db.commit()
    return {"status": "imported"}

@api_router.post("/admin/import_json/{table_name}")
async def import_table_json(table_name: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db), file: UploadFile = File(...)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Только для администратора")
    model_map = {
        "users": models.User,
        "articles": models.Article,
        "suppliers": models.Supplier,
        "requests": models.Request,
        "analytics": models.Analytics,
    }
    if table_name not in model_map:
        raise HTTPException(status_code=400, detail="Неизвестная таблица")
    model = model_map[table_name]
    contents = await file.read()
    data = json.loads(contents)
    for row in data:
        obj = model(**row)
        db.add(obj)
    db.commit()
    return {"status": "imported"}

# --- USERS API ---
class CreateUserRequest(BaseModel):
    username: str
    email: str
    role: str
    department: str
    position: str
    phone: str
    company: str

@api_router.post("/users/")
def create_user(req: CreateUserRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == req.username).first():
        raise HTTPException(status_code=400, detail="User already exists")
    user = models.User(
        username=req.username,
        email=req.email,
        role=req.role,
        department=req.department,
        position=req.position,
        phone=req.phone,
        company=req.company,
        hashed_password=auth.get_password_hash("default123")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username, "email": user.email}

@api_router.get("/users/profile", response_model=schemas.UserResponse)
def get_user_profile(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

class UpdateUserRoleRequest(BaseModel):
    role: str

@api_router.patch("/users/{user_id}/role")
def update_user_role(user_id: int, req: UpdateUserRoleRequest, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can change roles")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = req.role
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username, "role": user.role}

# --- Монтирую все актуальные роутеры ---
app.include_router(chat_api.router)  # старый чат, если нужен
app.include_router(documents_api.router, prefix="/api")
app.include_router(users_api.router, prefix="/api")
app.include_router(auth_api.router, prefix="/api")
app.include_router(suppliers_api.router, prefix="/api")
app.include_router(requests_api.router, prefix="/api")
app.include_router(analytics_api.router, prefix="/api")
app.include_router(support_api.router, prefix="/api")
app.include_router(support_tickets.router, prefix="/api")
app.include_router(admin_dashboard.router, prefix="/api")
app.include_router(articles_api.router, prefix="/api")
app.include_router(new_chat_api.router, prefix="/api") 