from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from api import auth_api, users_api, suppliers_api, chat_api, documents_api, email_campaigns_api
from api import news_api, calendar_api, requests_api, support_api, analytics_api

app = FastAPI()

# Авто-создание всех таблиц ORM (PostgreSQL)
from app.database import engine, Base
Base.metadata.create_all(bind=engine)

app.include_router(auth_api.router, prefix="/api")
app.include_router(users_api.router, prefix="/api")
app.include_router(suppliers_api.router, prefix="/api")
app.include_router(chat_api.router, prefix="/api")
app.include_router(documents_api.router, prefix="/api")
app.include_router(email_campaigns_api.router, prefix="/api")
app.include_router(news_api.router, prefix="/api")
app.include_router(calendar_api.router, prefix="/api")
app.include_router(requests_api.router, prefix="/api")
app.include_router(support_api.router, prefix="/api")
app.include_router(analytics_api.router, prefix="/api")

# --- Глобальный обработчик ошибок ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print('--- GLOBAL ERROR ---')
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "trace": traceback.format_exc()}
    ) 