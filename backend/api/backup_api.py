from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import os
import shutil
import zipfile
import json
import subprocess
from datetime import datetime
import uuid
from pathlib import Path

from app.database import get_db
from app.models import User
from app.auth import get_current_user

router = APIRouter(prefix="/api/backup", tags=["backup"])

# Конфигурация путей для резервных копий
BACKUP_DIR = Path("backups")
BACKUP_DIR.mkdir(exist_ok=True)

# Модели данных
class BackupCreateRequest(BaseModel):
    name: str
    type: str  # 'full', 'database', 'files', 'system'
    description: Optional[str] = None

class BackupInfo(BaseModel):
    id: str
    name: str
    type: str
    size: int
    status: str
    created_at: str
    description: Optional[str] = None
    compression_ratio: Optional[float] = None
    backup_path: Optional[str] = None

class BackupStats(BaseModel):
    total_backups: int
    total_size: int
    last_backup: str
    next_scheduled: str
    success_rate: float

# Хранилище задач резервного копирования (в реальном приложении используйте Redis или БД)
backup_jobs = {}

def create_backup_task(backup_id: str, backup_type: str, name: str, description: str = None):
    """Фоновая задача создания резервной копии"""
    try:
        backup_jobs[backup_id] = {
            "status": "in_progress",
            "progress": 0,
            "error": None
        }
        
        backup_path = BACKUP_DIR / f"{backup_id}_{name.replace(' ', '_')}"
        backup_path.mkdir(exist_ok=True)
        
        # Создание резервной копии в зависимости от типа
        if backup_type == "full":
            create_full_backup(backup_path, backup_id)
        elif backup_type == "database":
            create_database_backup(backup_path, backup_id)
        elif backup_type == "files":
            create_files_backup(backup_path, backup_id)
        elif backup_type == "system":
            create_system_backup(backup_path, backup_id)
        
        # Создание ZIP архива
        zip_path = BACKUP_DIR / f"{backup_id}_{name.replace(' ', '_')}.zip"
        create_zip_archive(backup_path, zip_path)
        
        # Очистка временных файлов
        shutil.rmtree(backup_path)
        
        # Обновление статуса
        backup_jobs[backup_id]["status"] = "completed"
        backup_jobs[backup_id]["progress"] = 100
        
    except Exception as e:
        backup_jobs[backup_id]["status"] = "failed"
        backup_jobs[backup_id]["error"] = str(e)

def create_full_backup(backup_path: Path, backup_id: str):
    """Создание полной резервной копии"""
    # Создание резервной копии базы данных
    create_database_backup(backup_path, backup_id)
    
    # Создание резервной копии файлов
    create_files_backup(backup_path, backup_id)
    
    # Создание резервной копии системных файлов
    create_system_backup(backup_path, backup_id)

def create_database_backup(backup_path: Path, backup_id: str):
    """Создание резервной копии базы данных"""
    try:
        # В реальном приложении используйте pg_dump для PostgreSQL
        # Здесь создаем заглушку
        db_backup_file = backup_path / "database_backup.sql"
        with open(db_backup_file, 'w', encoding='utf-8') as f:
            f.write(f"-- Резервная копия базы данных\n")
            f.write(f"-- Создано: {datetime.now().isoformat()}\n")
            f.write(f"-- ID: {backup_id}\n")
            f.write(f"-- Это заглушка для демонстрации\n")
        
        backup_jobs[backup_id]["progress"] = 50
        
    except Exception as e:
        raise Exception(f"Ошибка создания резервной копии БД: {str(e)}")

def create_files_backup(backup_path: Path, backup_id: str):
    """Создание резервной копии файлов"""
    try:
        files_backup_dir = backup_path / "files"
        files_backup_dir.mkdir(exist_ok=True)
        
        # В реальном приложении копируйте файлы из uploads/ и других директорий
        # Здесь создаем заглушку
        with open(files_backup_dir / "files_info.txt", 'w', encoding='utf-8') as f:
            f.write(f"Резервная копия файлов\n")
            f.write(f"Создано: {datetime.now().isoformat()}\n")
            f.write(f"ID: {backup_id}\n")
        
        backup_jobs[backup_id]["progress"] = 75
        
    except Exception as e:
        raise Exception(f"Ошибка создания резервной копии файлов: {str(e)}")

def create_system_backup(backup_path: Path, backup_id: str):
    """Создание резервной копии системных файлов"""
    try:
        system_backup_dir = backup_path / "system"
        system_backup_dir.mkdir(exist_ok=True)
        
        # В реальном приложении копируйте конфигурационные файлы
        # Здесь создаем заглушку
        with open(system_backup_dir / "system_info.txt", 'w', encoding='utf-8') as f:
            f.write(f"Резервная копия системы\n")
            f.write(f"Создано: {datetime.now().isoformat()}\n")
            f.write(f"ID: {backup_id}\n")
        
        backup_jobs[backup_id]["progress"] = 90
        
    except Exception as e:
        raise Exception(f"Ошибка создания резервной копии системы: {str(e)}")

def create_zip_archive(source_path: Path, zip_path: Path):
    """Создание ZIP архива из резервной копии"""
    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(source_path):
                for file in files:
                    file_path = Path(root) / file
                    arcname = file_path.relative_to(source_path)
                    zipf.write(file_path, arcname)
    except Exception as e:
        raise Exception(f"Ошибка создания ZIP архива: {str(e)}")

@router.post("/create")
async def create_backup(
    request: BackupCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Создание новой резервной копии"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    backup_id = str(uuid.uuid4())
    
    # Запуск фоновой задачи
    background_tasks.add_task(
        create_backup_task,
        backup_id,
        request.type,
        request.name,
        request.description
    )
    
    return {
        "message": "Резервная копия создается",
        "backup_id": backup_id,
        "status": "pending"
    }

@router.get("/list")
async def list_backups(current_user: User = Depends(get_current_user)):
    """Получение списка резервных копий"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    backups = []
    
    # Сканирование директории с резервными копиями
    for zip_file in BACKUP_DIR.glob("*.zip"):
        try:
            stat = zip_file.stat()
            backup_info = {
                "id": zip_file.stem.split('_', 1)[0],
                "name": zip_file.stem.split('_', 1)[1].replace('_', ' '),
                "type": "full",  # В реальном приложении определяйте тип из метаданных
                "size": stat.st_size,
                "status": "completed",
                "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "description": None,
                "compression_ratio": None,
                "backup_path": str(zip_file)
            }
            backups.append(backup_info)
        except Exception as e:
            continue
    
    return {"backups": backups}

@router.get("/stats")
async def get_backup_stats(current_user: User = Depends(get_current_user)):
    """Получение статистики резервных копий"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    backups = []
    total_size = 0
    
    for zip_file in BACKUP_DIR.glob("*.zip"):
        try:
            stat = zip_file.stat()
            total_size += stat.st_size
            backups.append({
                "created_at": stat.st_mtime,
                "size": stat.st_size
            })
        except Exception:
            continue
    
    if not backups:
        return {
            "total_backups": 0,
            "total_size": 0,
            "last_backup": "",
            "next_scheduled": "",
            "success_rate": 0.0
        }
    
    # Сортировка по дате создания
    backups.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {
        "total_backups": len(backups),
        "total_size": total_size,
        "last_backup": datetime.fromtimestamp(backups[0]["created_at"]).isoformat(),
        "next_scheduled": "",  # В реальном приложении планируйте следующее резервное копирование
        "success_rate": 100.0  # Упрощенная логика
    }

@router.post("/restore/{backup_id}")
async def restore_backup(
    backup_id: str,
    request: dict,
    current_user: User = Depends(get_current_user)
):
    """Восстановление из резервной копии"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    if request.get("confirm") != "ВОССТАНОВИТЬ":
        raise HTTPException(status_code=400, detail="Неверное подтверждение")
    
    # Поиск файла резервной копии
    backup_file = None
    for zip_file in BACKUP_DIR.glob("*.zip"):
        if zip_file.stem.startswith(backup_id):
            backup_file = zip_file
            break
    
    if not backup_file:
        raise HTTPException(status_code=404, detail="Резервная копия не найдена")
    
    # В реальном приложении здесь будет логика восстановления
    # Здесь просто возвращаем успех
    
    return {"message": "Восстановление запущено"}

@router.get("/download/{backup_id}")
async def download_backup(
    backup_id: str,
    current_user: User = Depends(get_current_user)
):
    """Скачивание резервной копии"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Поиск файла резервной копии
    backup_file = None
    for zip_file in BACKUP_DIR.glob("*.zip"):
        if zip_file.stem.startswith(backup_id):
            backup_file = zip_file
            break
    
    if not backup_file:
        raise HTTPException(status_code=404, detail="Резервная копия не найдена")
    
    return FileResponse(
        path=str(backup_file),
        filename=backup_file.name,
        media_type="application/zip"
    )

@router.delete("/delete/{backup_id}")
async def delete_backup(
    backup_id: str,
    current_user: User = Depends(get_current_user)
):
    """Удаление резервной копии"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Поиск и удаление файла резервной копии
    deleted = False
    for zip_file in BACKUP_DIR.glob("*.zip"):
        if zip_file.stem.startswith(backup_id):
            zip_file.unlink()
            deleted = True
            break
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Резервная копия не найдена")
    
    return {"message": "Резервная копия удалена"}
