from pydantic import BaseModel
from typing import List, Optional

class UserCreate(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    class Config:
        from_attributes = True

class RequestCreate(BaseModel):
    code: str

class RequestOut(BaseModel):
    id: int
    number: str
    created_at: str
    class Config:
        orm_mode = True

class ArticleOut(BaseModel):
    id: int
    code: str
    request_id: Optional[int]
    class Config:
        from_attributes = True

class SupplierOut(BaseModel):
    id: int
    name: str
    website: str
    email: str
    country: str
    email_validated: bool
    class Config:
        from_attributes = True

class EmailTemplateOut(BaseModel):
    id: int
    name: str
    subject: str
    body: str
    class Config:
        from_attributes = True

class AnalyticsOut(BaseModel):
    id: int
    action: str
    timestamp: str
    details: str
    class Config:
        from_attributes = True 