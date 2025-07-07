from api import auth_api, users_api, articles_api, suppliers_api, chat_api, documents_api, email_campaigns_api

app.include_router(auth_api.router, prefix="/api")
app.include_router(users_api.router, prefix="/api")
app.include_router(articles_api.router, prefix="/api")
app.include_router(suppliers_api.router, prefix="/api")
app.include_router(chat_api.router, prefix="/api")
app.include_router(documents_api.router, prefix="/api")
app.include_router(email_campaigns_api.router, prefix="/api") 