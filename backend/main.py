import logging
from pathlib import Path
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi

from app.api.api import api_router
from app.core.config import settings
from app.core.events import startup_event, shutdown_event

# 设置日志级别
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# 创建FastAPI应用
app = FastAPI(
    title="AI监控管理系统API",
    description="AI监控管理系统后端API接口文档",
    version="0.1.0",
    docs_url=None,  # 禁用默认的docs URL
    redoc_url=None,  # 禁用默认的redoc URL
    openapi_url="/api/openapi.json",
)

# 添加CORS中间件
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# 注册路由
app.include_router(api_router, prefix=settings.API_V1_STR)

# 添加静态文件服务
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# 自定义OpenAPI文档页面
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
    )

@app.get("/redoc", include_in_schema=False)
async def redoc_html():
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title=app.title + " - ReDoc",
    )

# 添加启动和关闭事件
app.add_event_handler("startup", startup_event)
app.add_event_handler("shutdown", shutdown_event)

# 根路由
@app.get("/")
async def root():
    return {
        "message": "AI监控管理系统API",
        "docs": "/docs",
        "version": "0.1.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    ) 