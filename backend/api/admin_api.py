from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import List, Dict, Any
from datetime import datetime, timedelta
import json
import csv
import io
import pandas as pd
from fastapi.responses import StreamingResponse

from app.database import get_db
from app.models import User, Article, Request, Supplier, SupportTicket, Role, Department
from app import auth

router = APIRouter(prefix="/admin", tags=["admin"])

# Используем правильную функцию аутентификации
get_current_user = auth.get_current_user

def check_admin_access(current_user: User):
    """Проверка прав администратора"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав доступа"
        )

@router.get("/metrics")
async def get_admin_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить метрики для админ-дашборда"""
    check_admin_access(current_user)
    
    try:
        # Базовые метрики
        total_users = db.query(User).count()
        total_articles = db.query(Article).count()
        total_requests = db.query(Request).count()
        total_suppliers = db.query(Supplier).count()
        
        # Метрики поддержки
        total_tickets = db.query(SupportTicket).count()
        open_tickets = db.query(SupportTicket).filter(
            SupportTicket.status.in_(['open', 'in_progress'])
        ).count()
        
        # Метрики пользователей по ролям
        users_by_role = db.query(
            User.role, 
            func.count(User.id).label('count')
        ).group_by(User.role).all()
        
        # Недавние пользователи (за последние 30 дней)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_users = db.query(User).filter(
            User.created_at >= thirty_days_ago
        ).count()
        
        # Активные запросы (за последние 7 дней)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_requests = db.query(Request).filter(
            Request.created_at >= week_ago
        ).count()
        
        return {
            "users": total_users,
            "articles": total_articles,
            "requests": total_requests,
            "suppliers": total_suppliers,
            "tickets": total_tickets,
            "open_tickets": open_tickets,
            "recent_users": recent_users,
            "recent_requests": recent_requests,
            "users_by_role": {role: count for role, count in users_by_role},
            "events": 0,  # Добавим позже если нужно
            "documents": 0  # Добавим позже если нужно
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка получения метрик: {str(e)}"
        )

@router.get("/table/{table_name}")
async def get_table_data(
    table_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить данные таблицы для админ-панели"""
    check_admin_access(current_user)
    
    # Маппинг названий таблиц к моделям
    table_models = {
        'users': User,
        'articles': Article,
        'requests': Request,
        'suppliers': Supplier,
        'tickets': SupportTicket,
        'roles': Role,
        'departments': Department
    }
    
    if table_name not in table_models:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Таблица {table_name} не найдена"
        )
    
    try:
        model = table_models[table_name]
        records = db.query(model).all()
        
        # Преобразуем в словари для JSON
        result = []
        for record in records:
            item = {}
            for column in record.__table__.columns:
                value = getattr(record, column.name)
                if isinstance(value, datetime):
                    value = value.isoformat()
                item[column.name] = value
            result.append(item)
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка получения данных таблицы: {str(e)}"
        )

@router.post("/table/{table_name}")
async def add_table_record(
    table_name: str,
    record_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Добавить запись в таблицу"""
    check_admin_access(current_user)
    
    table_models = {
        'users': User,
        'articles': Article,
        'requests': Request,
        'suppliers': Supplier,
        'tickets': SupportTicket,
        'roles': Role,
        'departments': Department
    }
    
    if table_name not in table_models:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Таблица {table_name} не найдена"
        )
    
    try:
        model = table_models[table_name]
        # Удаляем id если он есть (автогенерируется)
        record_data.pop('id', None)
        
        new_record = model(**record_data)
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        
        return {"message": "Запись добавлена", "id": new_record.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка добавления записи: {str(e)}"
        )

@router.delete("/table/{table_name}/{record_id}")
async def delete_table_record(
    table_name: str,
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить запись из таблицы"""
    check_admin_access(current_user)
    
    table_models = {
        'users': User,
        'articles': Article,
        'requests': Request,
        'suppliers': Supplier,
        'tickets': SupportTicket,
        'roles': Role,
        'departments': Department
    }
    
    if table_name not in table_models:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Таблица {table_name} не найдена"
        )
    
    try:
        model = table_models[table_name]
        record = db.query(model).filter(model.id == record_id).first()
        
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Запись не найдена"
            )
        
        # Проверяем, что не удаляем самого себя
        if table_name == 'users' and record_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нельзя удалить самого себя"
            )
        
        db.delete(record)
        db.commit()
        
        return {"message": "Запись удалена"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка удаления записи: {str(e)}"
        )

@router.get("/export_csv/{table_name}")
async def export_table_csv(
    table_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Экспорт таблицы в CSV"""
    check_admin_access(current_user)
    
    # Получаем данные таблицы
    data = await get_table_data(table_name, current_user, db)
    
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Нет данных для экспорта"
        )
    
    # Создаем CSV
    output = io.StringIO()
    if data:
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
    
    # Возвращаем как поток
    def iter_csv():
        yield output.getvalue()
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type='text/csv',
        headers={"Content-Disposition": f"attachment; filename={table_name}.csv"}
    )

@router.get("/export_xlsx/{table_name}")
async def export_table_xlsx(
    table_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Экспорт таблицы в Excel"""
    check_admin_access(current_user)
    
    # Получаем данные таблицы
    data = await get_table_data(table_name, current_user, db)
    
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Нет данных для экспорта"
        )
    
    # Создаем Excel файл
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name=table_name, index=False)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={"Content-Disposition": f"attachment; filename={table_name}.xlsx"}
    )

@router.get("/export_json/{table_name}")
async def export_table_json(
    table_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Экспорт таблицы в JSON"""
    check_admin_access(current_user)
    
    # Получаем данные таблицы
    data = await get_table_data(table_name, current_user, db)
    
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Нет данных для экспорта"
        )
    
    # Возвращаем JSON
    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    
    return StreamingResponse(
        io.BytesIO(json_str.encode('utf-8')),
        media_type='application/json',
        headers={"Content-Disposition": f"attachment; filename={table_name}.json"}
    )

@router.post("/import_csv/{table_name}")
async def import_table_csv(
    table_name: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Импорт таблицы из CSV"""
    check_admin_access(current_user)
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл должен быть в формате CSV"
        )
    
    try:
        # Читаем CSV
        content = await file.read()
        csv_data = pd.read_csv(io.StringIO(content.decode('utf-8')))
        
        # Конвертируем в список словарей
        records = csv_data.to_dict('records')
        
        # Добавляем записи
        added_count = 0
        for record_data in records:
            try:
                await add_table_record(table_name, record_data, current_user, db)
                added_count += 1
            except Exception as e:
                print(f"Ошибка импорта записи: {e}")
                continue
        
        return {"message": f"Импортировано {added_count} записей из {len(records)}"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка импорта CSV: {str(e)}"
        )

@router.post("/import_xlsx/{table_name}")
async def import_table_xlsx(
    table_name: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Импорт таблицы из Excel"""
    check_admin_access(current_user)
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл должен быть в формате Excel"
        )
    
    try:
        # Читаем Excel
        content = await file.read()
        xlsx_data = pd.read_excel(io.BytesIO(content))
        
        # Конвертируем в список словарей
        records = xlsx_data.to_dict('records')
        
        # Добавляем записи
        added_count = 0
        for record_data in records:
            try:
                await add_table_record(table_name, record_data, current_user, db)
                added_count += 1
            except Exception as e:
                print(f"Ошибка импорта записи: {e}")
                continue
        
        return {"message": f"Импортировано {added_count} записей из {len(records)}"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка импорта Excel: {str(e)}"
        )

@router.post("/import_json/{table_name}")
async def import_table_json(
    table_name: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Импорт таблицы из JSON"""
    check_admin_access(current_user)
    
    if not file.filename.endswith('.json'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл должен быть в формате JSON"
        )
    
    try:
        # Читаем JSON
        content = await file.read()
        json_data = json.loads(content.decode('utf-8'))
        
        if not isinstance(json_data, list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="JSON должен содержать массив объектов"
            )
        
        # Добавляем записи
        added_count = 0
        for record_data in json_data:
            try:
                await add_table_record(table_name, record_data, current_user, db)
                added_count += 1
            except Exception as e:
                print(f"Ошибка импорта записи: {e}")
                continue
        
        return {"message": f"Импортировано {added_count} записей из {len(json_data)}"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка импорта JSON: {str(e)}"
        )
