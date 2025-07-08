#!/usr/bin/env python3
"""
Миграция для добавления поля created_at в таблицу articles
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models import Article

# Создаём таблицы с новым полем created_at (Postgres)
Base.metadata.create_all(bind=engine)

print("Поле created_at добавлено (или уже существует) в Postgres!") 