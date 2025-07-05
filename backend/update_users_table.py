import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models import User

# Создаем таблицы с новыми полями
Base.metadata.create_all(bind=engine)

print("Таблица пользователей обновлена успешно!") 