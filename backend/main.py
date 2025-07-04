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
    openapi_tags=[
        {"name": "auth", "description": "认证相关操作"},
        {"name": "users", "description": "用户管理"},
        {"name": "roles", "description": "角色管理"},
        {"name": "organizations", "description": "组织管理"},
        {"name": "virtual_organizations", "description": "虚拟组织管理"},
        {"name": "videostreams", "description": "视频流管理"},
        {"name": "algorithms", "description": "算法管理"},
        {"name": "warnings", "description": "告警管理"},
        {"name": "monitor", "description": "监控任务管理"},
        {"name": "websocket", "description": "WebSocket连接"},
    ]
)

# 添加CORS中间件
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # 允许所有来源
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # 即使没有配置CORS来源，也添加CORS中间件
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # 允许所有来源
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# 注册路由
app.include_router(
    api_router, 
    prefix=settings.API_V1_STR,
    responses={404: {"description": "未找到"}},
)

# 添加静态文件服务
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

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