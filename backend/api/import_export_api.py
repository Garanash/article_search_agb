from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import os
import json
import csv
import zipfile
import shutil
from datetime import datetime
import uuid
from pathlib import Path
import pandas as pd
import tempfile

from app.database import get_db, engine
from app.models import User
from app.auth import get_current_user

router = APIRouter(prefix="/api/import-export", tags=["import-export"])

# Конфигурация путей для импорта/экспорта
IMPORT_EXPORT_DIR = Path("import_export")
IMPORT_EXPORT_DIR.mkdir(exist_ok=True)

# Хранилище задач импорта/экспорта (в реальном приложении используйте Redis или БД)
import_jobs = {}
export_jobs = {}

# Модели данных
class ImportRequest(BaseModel):
    table_name: str
    columns: List[str]
    options: Dict[str, Any]

class ExportRequest(BaseModel):
    table_name: str
    format: str
    columns: List[str]
    filters: Optional[str] = None
    options: Dict[str, Any]

class TableInfo(BaseModel):
    name: str
    display_name: str
    record_count: int
    columns: List[Dict[str, Any]]

class ImportJob(BaseModel):
    id: str
    table_name: str
    file_name: str
    status: str
    progress: int
    created_at: str
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    records_processed: Optional[int] = None
    records_total: Optional[int] = None

class ExportJob(BaseModel):
    id: str
    table_name: str
    format: str
    status: str
    progress: int
    created_at: str
    completed_at: Optional[str] = None
    download_url: Optional[str] = None
    file_size: Optional[int] = None

def get_table_info(table_name: str, db: Session) -> TableInfo:
    """Получение информации о таблице"""
    try:
        # Проверка существования таблицы
        inspector = inspect(engine)
        if table_name not in inspector.get_table_names():
            raise Exception(f"Таблица {table_name} не существует")
        
        # Получение информации о колонках
        columns = []
        for column in inspector.get_columns(table_name):
            columns.append({
                "name": column["name"],
                "display_name": column["name"].replace("_", " ").title(),
                "type": str(column["type"]),
                "nullable": column["nullable"],
                "is_primary": column.get("primary_key", False)
            })
        
        # Подсчет записей
        result = db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
        record_count = result.scalar()
        
        return TableInfo(
            name=table_name,
            display_name=table_name.replace("_", " ").title(),
            record_count=record_count,
            columns=columns
        )
    except Exception as e:
        raise Exception(f"Ошибка получения информации о таблице: {str(e)}")

def import_data_task(job_id: str, table_name: str, file_path: str, columns: List[str], options: Dict[str, Any]):
    """Фоновая задача импорта данных"""
    try:
        import_jobs[job_id]["status"] = "in_progress"
        import_jobs[job_id]["progress"] = 0
        
        # Чтение файла в зависимости от расширения
        file_ext = Path(file_path).suffix.lower()
        
        if file_ext == ".csv":
            df = pd.read_csv(file_path, encoding=options.get("encoding", "utf-8"))
        elif file_ext in [".xlsx", ".xls"]:
            df = pd.read_excel(file_path)
        elif file_ext == ".json":
            df = pd.read_json(file_path)
        else:
            raise Exception(f"Неподдерживаемый формат файла: {file_ext}")
        
        # Пропуск заголовка если нужно
        if options.get("skip_header", False):
            df = df.iloc[1:]
        
        # Выбор только нужных колонок
        if columns:
            df = df[columns]
        
        # Подсчет общего количества записей
        total_records = len(df)
        import_jobs[job_id]["records_total"] = total_records
        
        # В реальном приложении здесь будет логика вставки в БД
        # Здесь просто обновляем прогресс
        
        for i, _ in df.iterrows():
            # Имитация обработки записи
            progress = int((i + 1) / total_records * 100)
            import_jobs[job_id]["progress"] = progress
            import_jobs[job_id]["records_processed"] = i + 1
        
        import_jobs[job_id]["status"] = "completed"
        import_jobs[job_id]["completed_at"] = datetime.now().isoformat()
        
    except Exception as e:
        import_jobs[job_id]["status"] = "failed"
        import_jobs[job_id]["error_message"] = str(e)
        import_jobs[job_id]["completed_at"] = datetime.now().isoformat()

def export_data_task(job_id: str, table_name: str, format: str, columns: List[str], filters: str, options: Dict[str, Any]):
    """Фоновая задача экспорта данных"""
    try:
        export_jobs[job_id]["status"] = "in_progress"
        export_jobs[job_id]["progress"] = 0
        
        # Построение SQL запроса
        columns_str = ", ".join(columns) if columns else "*"
        sql = f"SELECT {columns_str} FROM {table_name}"
        
        if filters:
            sql += f" WHERE {filters}"
        
        # В реальном приложении здесь будет выполнение запроса к БД
        # Здесь создаем заглушку
        
        export_jobs[job_id]["progress"] = 50
        
        # Создание файла экспорта
        export_file = IMPORT_EXPORT_DIR / f"{job_id}_{table_name}.{format}"
        
        if format == "csv":
            # Создание CSV файла
            with open(export_file, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                if options.get("include_headers", True):
                    writer.writerow(columns)
                # Здесь будут данные из БД
                writer.writerow(["sample", "data", "row"])
        
        elif format == "xlsx":
            # Создание Excel файла
            df = pd.DataFrame({"sample": ["data"], "row": ["example"]})
            df.to_excel(export_file, index=False)
        
        elif format == "json":
            # Создание JSON файла
            data = {"table": table_name, "columns": columns, "data": [{"sample": "data", "row": "example"}]}
            with open(export_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        
        export_jobs[job_id]["progress"] = 100
        export_jobs[job_id]["status"] = "completed"
        export_jobs[job_id]["completed_at"] = datetime.now().isoformat()
        export_jobs[job_id]["download_url"] = f"/api/import-export/download-export/{job_id}"
        export_jobs[job_id]["file_size"] = export_file.stat().st_size
        
    except Exception as e:
        export_jobs[job_id]["status"] = "failed"
        export_jobs[job_id]["error_message"] = str(e)
        export_jobs[job_id]["completed_at"] = datetime.now().isoformat()

@router.get("/tables")
async def get_tables(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Получение списка доступных таблиц"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        inspector = inspect(engine)
        tables = []
        
        for table_name in inspector.get_table_names():
            try:
                table_info = get_table_info(table_name, db)
                tables.append(table_info)
            except Exception:
                continue
        
        return {"tables": tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения списка таблиц: {str(e)}")

@router.post("/import")
async def import_data(
    table_name: str = Form(...),
    file: UploadFile = File(...),
    columns: str = Form(...),
    options: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Импорт данных в таблицу"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Парсинг параметров
        columns_list = json.loads(columns)
        options_dict = json.loads(options)
        
        # Проверка существования таблицы
        table_info = get_table_info(table_name, db)
        
        # Сохранение загруженного файла
        job_id = str(uuid.uuid4())
        file_ext = Path(file.filename).suffix
        file_path = IMPORT_EXPORT_DIR / f"{job_id}{file_ext}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Создание задачи импорта
        import_jobs[job_id] = {
            "id": job_id,
            "table_name": table_name,
            "file_name": file.filename,
            "status": "pending",
            "progress": 0,
            "created_at": datetime.now().isoformat(),
            "completed_at": None,
            "error_message": None,
            "records_processed": None,
            "records_total": None
        }
        
        # Запуск фоновой задачи
        background_tasks.add_task(
            import_data_task,
            job_id,
            table_name,
            str(file_path),
            columns_list,
            options_dict
        )
        
        return {
            "message": "Импорт запущен",
            "job_id": job_id,
            "status": "pending"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка запуска импорта: {str(e)}")

@router.post("/export")
async def export_data(
    request: ExportRequest,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Экспорт данных из таблицы"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Проверка существования таблицы
        table_info = get_table_info(request.table_name, db)
        
        # Создание задачи экспорта
        job_id = str(uuid.uuid4())
        export_jobs[job_id] = {
            "id": job_id,
            "table_name": request.table_name,
            "format": request.format,
            "status": "pending",
            "progress": 0,
            "created_at": datetime.now().isoformat(),
            "completed_at": None,
            "download_url": None,
            "file_size": None
        }
        
        # Запуск фоновой задачи
        background_tasks.add_task(
            export_data_task,
            job_id,
            request.table_name,
            request.format,
            request.columns,
            request.filters,
            request.options
        )
        
        return {
            "message": "Экспорт запущен",
            "job_id": job_id,
            "status": "pending"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка запуска экспорта: {str(e)}")

@router.get("/import-jobs")
async def get_import_jobs(current_user: User = Depends(get_current_user)):
    """Получение списка задач импорта"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    return {"jobs": list(import_jobs.values())}

@router.get("/export-jobs")
async def get_export_jobs(current_user: User = Depends(get_current_user)):
    """Получение списка задач экспорта"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    return {"jobs": list(export_jobs.values())}

@router.delete("/import-jobs/{job_id}")
async def delete_import_job(job_id: str, current_user: User = Depends(get_current_user)):
    """Удаление задачи импорта"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    if job_id in import_jobs:
        del import_jobs[job_id]
        return {"message": "Задача импорта удалена"}
    else:
        raise HTTPException(status_code=404, detail="Задача импорта не найдена")

@router.delete("/export-jobs/{job_id}")
async def delete_export_job(job_id: str, current_user: User = Depends(get_current_user)):
    """Удаление задачи экспорта"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    if job_id in export_jobs:
        del export_jobs[job_id]
        return {"message": "Задача экспорта удалена"}
    else:
        raise HTTPException(status_code=404, detail="Задача экспорта не найдена")

@router.get("/download-export/{job_id}")
async def download_export(job_id: str, current_user: User = Depends(get_current_user)):
    """Скачивание экспортированного файла"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    if job_id not in export_jobs:
        raise HTTPException(status_code=404, detail="Задача экспорта не найдена")
    
    job = export_jobs[job_id]
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Экспорт еще не завершен")
    
    # Поиск файла экспорта
    export_file = None
    for file_path in IMPORT_EXPORT_DIR.glob(f"{job_id}_*"):
        if file_path.suffix in [".csv", ".xlsx", ".json", ".xml", ".sql"]:
            export_file = file_path
            break
    
    if not export_file:
        raise HTTPException(status_code=404, detail="Файл экспорта не найден")
    
    return FileResponse(
        path=str(export_file),
        filename=f"{job['table_name']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{export_file.suffix}",
        media_type="application/octet-stream"
    )
п