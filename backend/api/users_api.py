from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import os
from fastapi.responses import JSONResponse
from fastapi import Path
from sqlalchemy import func

from app.database import get_db
from app.models import User, PhoneBook, Article, Supplier, Request
from app.models import News
from app.schemas import UserProfileUpdate, UserProfileResponse
from app.schemas import PhoneBookCreate, PhoneBookUpdate, PhoneBookResponse
from app.schemas import NewsCreate, NewsUpdate, NewsResponse
from app import auth

# Используем правильную функцию аутентификации
get_current_user = auth.get_current_user

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'avatars')
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить профиль текущего пользователя"""
    user = db.query(User).filter(User.id == current_user.id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    return user

@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить профиль текущего пользователя"""
    user = db.query(User).filter(User.id == current_user.id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Обновляем разрешенные поля
    if profile_update.username:
        # Проверяем, что username уникален
        existing_user = db.query(User).filter(
            User.username == profile_update.username,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким именем уже существует"
            )
        user.username = profile_update.username
    
    if profile_update.department:
        user.department = profile_update.department
    
    if profile_update.position:
        user.position = profile_update.position
    
    if profile_update.phone is not None:
        user.phone = profile_update.phone
    
    if profile_update.company is not None:
        user.company = profile_update.company

    # Обновляем ФИО
    if profile_update.first_name is not None:
        user.first_name = profile_update.first_name
    if profile_update.last_name is not None:
        user.last_name = profile_update.last_name
    if profile_update.patronymic is not None:
        user.patronymic = profile_update.patronymic
    # Обновляем аватар
    if profile_update.avatar_url is not None:
        user.avatar_url = profile_update.avatar_url
    
    # Обновляем время последнего изменения
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    return user

@router.get("/", response_model=List[UserProfileResponse])
async def get_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить список всех пользователей (только для админов)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра списка пользователей"
        )
    
    users = db.query(User).all()
    return users

@router.get("/users", response_model=List[UserProfileResponse])
async def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить всех пользователей (только для админов)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра пользователей"
        )
    
    users = db.query(User).all()
    return users

@router.get("/{user_id}/password")
async def get_user_password(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить пароль пользователя (только для админов)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра паролей"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Возвращаем информацию о пароле
    return {
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "hashed_password": user.hashed_password,
        "password_status": "encrypted",
        "message": "Пароль зашифрован в базе данных",
        "force_password_change": user.force_password_change
    }

@router.get("/{user_id}/password/decrypt")
async def decrypt_user_password(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Попытаться расшифровать пароль пользователя (только для админов)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для расшифровки паролей"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Пароли хешируются с помощью bcrypt, их нельзя расшифровать
    # Но можно попробовать сгенерировать новый пароль
    return {
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "hashed_password": user.hashed_password,
        "password_status": "cannot_decrypt",
        "message": "Пароль зашифрован с помощью bcrypt и не может быть расшифрован. Используйте генерацию нового пароля.",
        "force_password_change": user.force_password_change,
        "suggestion": "Используйте эндпоинт /generate-password для создания нового пароля"
    }

@router.post("/{user_id}/generate-password")
async def generate_new_password(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Сгенерировать новый пароль для пользователя (только для админов)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для генерации паролей"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Генерируем новый пароль
    new_password = auth.generate_random_password()
    hashed_password = auth.get_password_hash(new_password)
    
    # Обновляем пароль пользователя
    user.hashed_password = hashed_password
    user.force_password_change = True  # Принудительная смена пароля при следующем входе
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    return {
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "new_password": new_password,
        "message": "Новый пароль сгенерирован и установлен"
    }

class CreateUserRequest(BaseModel):
    username: str
    email: str
    role: str = "user"
    department: str = ""
    position: str = ""
    phone: str = ""
    company: str = 'ООО "Алмазгеобур"'
    first_name: str = ""
    last_name: str = ""
    patronymic: str = ""

class CreateUserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    department: str
    position: str
    phone: str
    company: str
    first_name: str
    last_name: str
    patronymic: str
    generated_password: str

@router.post("/", response_model=CreateUserResponse)
async def create_user(
    user_data: CreateUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать нового пользователя (только для админов)"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для создания пользователей"
        )
    
    # Проверяем, что username уникален
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем уже существует"
        )
    
    # Проверяем, что email уникален
    if user_data.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже существует"
            )
    
    # Генерируем username из ФИО
    username = user_data.username
    if user_data.first_name and user_data.last_name:
        # Транслитерация для латинской раскладки
        translit_map = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
            'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        }
        
        def transliterate(text):
            if not text:
                return ''
            text = text.lower()
            result = ''
            for char in text:
                result += translit_map.get(char, char)
            return result
        
        # Генерируем логин: первая буква имени + первая буква отчества + вся фамилия
        first_name_initial = transliterate(user_data.first_name)[0] if user_data.first_name else ''
        patronymic_initial = transliterate(user_data.patronymic)[0] if user_data.patronymic else ''
        last_name_full = transliterate(user_data.last_name) if user_data.last_name else ''
        
        username = f"{first_name_initial}{patronymic_initial}{last_name_full}".lower()
        
        # Убираем лишние символы, оставляем только буквы и цифры
        username = ''.join(c for c in username if c.isalnum())
        
        # Если логин пустой, используем email
        if not username:
            username = user_data.email.split('@')[0]
    
    # Генерируем случайный пароль
    generated_password = auth.generate_random_password()
    hashed_password = auth.get_password_hash(generated_password)
    
    # Создаем нового пользователя
    new_user = User(
        username=username,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role,
        department=user_data.department,
        position=user_data.position,
        phone=user_data.phone,
        company=user_data.company,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        patronymic=user_data.patronymic,
        force_password_change=True  # Принудительная смена пароля при первом входе
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return CreateUserResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        role=new_user.role,
        department=new_user.department,
        position=new_user.position,
        phone=new_user.phone,
        company=new_user.company,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        patronymic=new_user.patronymic,
        generated_password=generated_password
    ) 

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Загрузить аватар пользователя"""
    # Проверяем расширение
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
        return JSONResponse(status_code=400, content={"error": "Недопустимый формат файла"})
    # Имя файла: user_<id>_<timestamp>.ext
    import time
    filename = f"user_{current_user.id}_{int(time.time())}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    # Сохраняем файл
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    # Формируем url (пусть будет /static/avatars/filename)
    avatar_url = f"/static/avatars/{filename}"
    # Обновляем пользователя
    user = db.query(User).filter(User.id == current_user.id).first()
    user.avatar_url = avatar_url
    db.commit()
    db.refresh(user)
    return {"avatar_url": avatar_url} 

# --- CRUD для телефонного справочника ---
@router.get("/phonebook", response_model=List[PhoneBookResponse])
async def get_phonebook(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить все записи телефонного справочника"""
    return db.query(PhoneBook).order_by(PhoneBook.full_name).all()

@router.post("/phonebook", response_model=PhoneBookResponse)
async def add_phonebook_entry(
    entry: PhoneBookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Добавить запись в телефонный справочник"""
    obj = PhoneBook(**entry.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/phonebook/{entry_id}", response_model=PhoneBookResponse)
async def update_phonebook_entry(
    entry_id: int = Path(...),
    entry: PhoneBookUpdate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить запись телефонного справочника"""
    obj = db.query(PhoneBook).filter(PhoneBook.id == entry_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    for k, v in entry.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/phonebook/{entry_id}")
async def delete_phonebook_entry(
    entry_id: int = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить запись телефонного справочника"""
    obj = db.query(PhoneBook).filter(PhoneBook.id == entry_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    db.delete(obj)
    db.commit()
    return {"status": "deleted"} 

# --- CRUD для новостей ---
@router.get("/news", response_model=List[NewsResponse])
async def get_news(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить все новости"""
    return db.query(News).order_by(News.created_at.desc()).all()

@router.post("/news", response_model=NewsResponse)
async def add_news(
    news: NewsCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Добавить новость"""
    obj = News(**news.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/news/{news_id}", response_model=NewsResponse)
async def update_news(
    news_id: int = Path(...),
    news: NewsUpdate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить новость"""
    obj = db.query(News).filter(News.id == news_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    for k, v in news.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/news/{news_id}")
async def delete_news(
    news_id: int = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить новость"""
    obj = db.query(News).filter(News.id == news_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    db.delete(obj)
    db.commit()
    return {"status": "deleted"}

@router.post("/news/upload-image")
async def upload_news_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Загрузить изображение для новости"""
    # Проверяем расширение
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg']
    if ext not in allowed_extensions:
        return JSONResponse(
            status_code=400, 
            content={"error": f"Недопустимый формат файла. Разрешены: {', '.join(allowed_extensions)}"}
        )
    
    # Проверяем размер файла (максимум 10MB)
    if file.size and file.size > 10 * 1024 * 1024:
        return JSONResponse(
            status_code=400, 
            content={"error": "Файл слишком большой. Максимальный размер: 10MB"}
        )
    
    # Создаем папку для изображений новостей
    NEWS_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'news')
    os.makedirs(NEWS_UPLOAD_DIR, exist_ok=True)
    
    # Имя файла: news_<timestamp>_<random>.ext
    import time
    import random
    filename = f"news_{int(time.time())}_{random.randint(1000, 9999)}{ext}"
    file_path = os.path.join(NEWS_UPLOAD_DIR, filename)
    
    try:
        # Сохраняем файл
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Формируем url
        image_url = f"/static/news/{filename}"
        return {"image_url": image_url, "filename": filename}
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"error": f"Ошибка сохранения файла: {str(e)}"}
        ) 

# --- Управление ролями и департаментами ---

class RoleCreate(BaseModel):
    name: str
    description: str = ""
    permissions: List[str] = []

class RoleUpdate(BaseModel):
    name: str = None
    description: str = None
    permissions: List[str] = None

class RoleResponse(BaseModel):
    id: int
    name: str
    description: str
    permissions: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DepartmentCreate(BaseModel):
    name: str
    description: str = ""
    manager_id: Optional[int] = None

class DepartmentUpdate(BaseModel):
    name: str = None
    description: str = None
    manager_id: Optional[int] = None

class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: str
    manager_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.get("/roles", response_model=List[RoleResponse])
async def get_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить все роли"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра ролей"
        )
    
    # Возвращаем базовые роли (можно расширить моделью Role в будущем)
    roles = [
        {
            "id": 1,
            "name": "user",
            "description": "Обычный пользователь",
            "permissions": ["read_own_data", "create_requests"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 2,
            "name": "admin",
            "description": "Администратор системы",
            "permissions": ["all"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 3,
            "name": "manager",
            "description": "Менеджер",
            "permissions": ["read_department_data", "approve_documents", "manage_users"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    return roles

@router.post("/roles", response_model=RoleResponse)
async def create_role(
    role: RoleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать новую роль"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для создания ролей"
        )
    
    # В будущем можно добавить модель Role в БД
    # Пока возвращаем заглушку
    new_role = {
        "id": 999,
        "name": role.name,
        "description": role.description,
        "permissions": role.permissions,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    return new_role

@router.get("/departments", response_model=List[DepartmentResponse])
async def get_departments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить все департаменты"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра департаментов"
        )
    
    # Возвращаем базовые департаменты (можно расширить моделью Department в будущем)
    departments = [
        {
            "id": 1,
            "name": "Разработка ПО",
            "description": "Отдел разработки программного обеспечения",
            "manager_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 2,
            "name": "Системный администратор",
            "description": "Отдел технической поддержки и системных вопросов",
            "manager_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 3,
            "name": "Логистика",
            "description": "Отдел логистики и поставок",
            "manager_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 4,
            "name": "Общие вопросы",
            "description": "Общие вопросы и административные задачи",
            "manager_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    return departments

@router.post("/departments", response_model=DepartmentResponse)
async def create_department(
    department: DepartmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать новый департамент"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для создания департаментов"
        )
    
    # В будущем можно добавить модель Department в БД
    # Пока возвращаем заглушку
    new_department = {
        "id": 999,
        "name": department.name,
        "description": department.description,
        "manager_id": department.manager_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    return new_department

@router.get("/available-roles")
async def get_available_roles():
    """Получить доступные роли для выбора"""
    return [
        {"value": "user", "label": "Пользователь"},
        {"value": "admin", "label": "Администратор"},
        {"value": "manager", "label": "Менеджер"},
        {"value": "director", "label": "Директор"},
        {"value": "ceo", "label": "CEO"}
    ]

@router.get("/available-departments")
async def get_available_departments():
    """Получить доступные департаменты для выбора"""
    return [
        {"value": "development", "label": "Разработка ПО"},
        {"value": "system_admin", "label": "Системный администратор"},
        {"value": "logistics", "label": "Логистика"},
        {"value": "general", "label": "Общие вопросы"},
        {"value": "hr", "label": "HR"},
        {"value": "finance", "label": "Финансы"},
        {"value": "marketing", "label": "Маркетинг"},
        {"value": "sales", "label": "Продажи"}
    ] 

@router.get("/available-data")
async def get_available_data():
    """Получить доступные роли и департаменты для выбора"""
    return {
        "roles": [
            {"value": "user", "label": "Пользователь"},
            {"value": "admin", "label": "Администратор"},
            {"value": "manager", "label": "Менеджер"},
            {"value": "director", "label": "Директор"},
            {"value": "ceo", "label": "CEO"}
        ],
        "departments": [
            {"value": "development", "label": "Разработка ПО"},
            {"value": "system_admin", "label": "Системный администратор"},
            {"value": "logistics", "label": "Логистика"},
            {"value": "general", "label": "Общие вопросы"},
            {"value": "hr", "label": "HR"},
            {"value": "finance", "label": "Финансы"},
            {"value": "marketing", "label": "Маркетинг"},
            {"value": "sales", "label": "Продажи"}
        ]
    }

@router.get("/roles-and-departments")
async def get_roles_and_departments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить роли и департаменты"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра ролей и департаментов"
        )
    
    # Возвращаем базовые роли
    roles = [
        {
            "id": 1,
            "name": "user",
            "description": "Обычный пользователь",
            "permissions": ["read_own_data", "create_requests"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 2,
            "name": "admin",
            "description": "Администратор системы",
            "permissions": ["all"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 3,
            "name": "manager",
            "description": "Менеджер",
            "permissions": ["read_department_data", "approve_documents", "manage_users"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    # Возвращаем базовые департаменты
    departments = [
        {
            "id": 1,
            "name": "Разработка ПО",
            "description": "Отдел разработки программного обеспечения",
            "manager_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 2,
            "name": "Системный администратор",
            "description": "Отдел технической поддержки и системных вопросов",
            "manager_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 3,
            "name": "Логистика",
            "description": "Отдел логистики и поставок",
            "manager_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": 4,
            "name": "Общие вопросы",
            "description": "Общие вопросы и административные задачи",
            "manager_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    return {
        "roles": roles,
        "departments": departments
    } 

@router.get("/statistics")
async def get_user_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить статистику активности текущего пользователя"""
    
    # Подсчитываем артикулы, добавленные пользователем
    total_articles = db.query(Article).filter(Article.user_id == current_user.id).count()
    
    # Подсчитываем поставщиков, найденных для артикулов пользователя
    total_suppliers = db.query(Supplier).join(Article).filter(Article.user_id == current_user.id).count()
    
    # Подсчитываем запросы, созданные пользователем
    total_requests = db.query(Request).filter(Request.user_id == current_user.id).count()
    
    # Получаем последнюю активность (последнее действие пользователя)
    last_activity = db.query(func.max(Article.created_at)).filter(Article.user_id == current_user.id).scalar()
    
    # Если нет артикулов, используем дату создания пользователя
    if not last_activity:
        last_activity = current_user.created_at
    
    return {
        "total_articles": total_articles,
        "total_suppliers": total_suppliers,
        "total_requests": total_requests,
        "last_activity": last_activity.isoformat() if last_activity else None
    } 