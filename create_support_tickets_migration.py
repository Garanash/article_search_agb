#!/usr/bin/env python3
"""
Миграция для создания таблиц поддержки обращений
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from app.database import engine, Base
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
import datetime

class SupportTicket(Base):
    __tablename__ = "support_tickets"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    department = Column(String)
    status = Column(String, default="open")
    priority = Column(String, default="medium")
    assigned_to = Column(Integer)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime)
    closed_at = Column(DateTime)
    first_response_at = Column(DateTime)
    estimated_resolution = Column(DateTime)

class SupportEvent(Base):
    __tablename__ = "support_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"), nullable=False)
    event_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    event_date = Column(DateTime, nullable=False)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

Base.metadata.create_all(bind=engine)
print("✅ Таблицы поддержки созданы/обновлены в Postgres!") 