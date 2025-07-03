import os
import secrets
from typing import Any, Dict, List, Optional, Union
from pydantic import AnyHttpUrl, BaseSettings, PostgresDsn, validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI监控管理系统"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 小时
    
    # CORS配置
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # SQLite数据库配置
    SQLALCHEMY_DATABASE_URI: Optional[str] = "sqlite:///./sql_app.db"
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    
    # Redis配置（可选）
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    USE_REDIS: bool = False  # 是否启用Redis
    
    # JWT配置
    JWT_SECRET: str = "secret-key"  # 开发环境默认密钥，生产环境必须覆盖
    JWT_ALGORITHM: str = "HS256"
    
    # 存储路径配置
    UPLOAD_DIR: str = "uploads"
    MODEL_DIR: str = "models"
    FACE_DIR: str = "faces"
    WARNING_IMG_DIR: str = "warnings"
    
    # 算法配置
    ALGORITHM_SCRIPTS_DIR: str = "app/algorithms"
    TEMP_DIR: str = "temp"
    
    # ZLMedia服务配置
    ZLMEDIA_API_URL: str = "http://localhost:8080"
    ZLMEDIA_SECRET: str = "035c73f7-bb6b-4889-a715-d9eb2d1925cc"
    ZLMEDIA_HOST: str = "localhost"
    ZLMEDIA_RTMP_PORT: int = 1935
    ZLMEDIA_HTTP_PORT: int = 8080
    
    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_PATH: str = "logs"
    
    # ZLMediaKit服务器配置
    ZLMEDIAKIT_API_URL: Optional[str] = None  # 例如："http://localhost:8080"
    ZLMEDIAKIT_SECRET: Optional[str] = None
    
    # YOLO配置
    YOLO_WEIGHTS_PATH: Optional[str] = None
    YOLO_CONF_THRESHOLD: float = 0.25
    YOLO_IOU_THRESHOLD: float = 0.45
    YOLO_DEVICE: str = "cpu"  # 'cpu' 或 'cuda:0'
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()

# 确保存储路径存在
os.makedirs(settings.FACE_DIR, exist_ok=True)
os.makedirs(settings.WARNING_IMG_DIR, exist_ok=True)
os.makedirs(settings.MODEL_DIR, exist_ok=True)
os.makedirs(settings.LOG_PATH, exist_ok=True) 