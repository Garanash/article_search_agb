import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models import Document, User

# Создаем таблицы
Base.metadata.create_all(bind=engine)

print("Таблица документов создана успешно!") 