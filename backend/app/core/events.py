import logging
import os
from typing import Callable
import json

import redis
from fastapi import FastAPI
import aioredis
import ssl

from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.core.config import settings

logger = logging.getLogger(__name__)

# 创建必要的目录
def create_directories():
    """创建应用所需的目录"""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "models"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "test_images"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "warnings"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "faces"), exist_ok=True)
    logger.info("已创建所需的目录")

# Redis连接
redis_instance = None

async def connect_to_redis() -> None:
    """连接到Redis服务器（如果启用）"""
    global redis_instance
    
    if settings.USE_REDIS:
        try:
            redis_instance = await aioredis.create_redis_pool(
                f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}",
                encoding="utf-8",
                ssl=None,
            )
            logger.info("已连接到Redis服务器")
        except Exception as e:
            logger.error(f"连接Redis失败: {str(e)}")
            redis_instance = None
    else:
        logger.info("Redis未启用")

async def close_redis_connection() -> None:
    """关闭Redis连接"""
    global redis_instance
    if redis_instance:
        redis_instance.close()
        await redis_instance.wait_closed()
        redis_instance = None
        logger.info("Redis连接已关闭")

def init_database():
    """初始化数据库"""
    try:
        db = SessionLocal()
        init_db(db)
        db.close()
        logger.info("数据库初始化完成")
    except Exception as e:
        logger.error(f"数据库初始化失败: {str(e)}")
        raise

async def startup_event() -> None:
    """应用启动时执行的事件"""
    logger.info("启动应用...")
    # 创建必要的目录
    create_directories()
    
    # 初始化数据库
    init_database()
    
    # 连接到Redis（如果启用）
    await connect_to_redis()
    
    logger.info("应用启动完成")

async def shutdown_event() -> None:
    """应用关闭时执行的事件"""
    logger.info("关闭应用...")
    
    # 关闭Redis连接
    await close_redis_connection()
    
    logger.info("应用已关闭")

# 创建Redis连接池
redis_pool = None

def create_redis_pool() -> redis.Redis:
    """创建Redis连接池"""
    if not settings.USE_REDIS:
        return None
        
    global redis_pool
    try:
        redis_pool = redis.ConnectionPool(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            password=settings.REDIS_PASSWORD,
            decode_responses=True
        )
        # 测试连接
        r = redis.Redis(connection_pool=redis_pool)
        r.ping()
        logger.info("Redis连接成功")
        return r
    except Exception as e:
        logger.error(f"Redis连接失败: {e}")
        return None

def get_redis() -> redis.Redis:
    """获取Redis客户端"""
    if not settings.USE_REDIS or redis_pool is None:
        return None
        
    try:
        return redis.Redis(connection_pool=redis_pool)
    except Exception as e:
        logger.error(f"获取Redis客户端失败: {e}")
        return None

def cache_get(key: str) -> dict:
    """
    从缓存中获取数据
    :param key: 缓存键
    :return: 缓存的数据，如果不存在则返回None
    """
    r = get_redis()
    if not r:
        return None
        
    try:
        data = r.get(key)
        if data:
            return json.loads(data)
        return None
    except Exception as e:
        logger.error(f"从Redis获取数据失败: {e}")
        return None

def cache_set(key: str, value: dict, expire: int = 3600) -> bool:
    """
    将数据存入缓存
    :param key: 缓存键
    :param value: 要缓存的数据
    :param expire: 过期时间（秒）
    :return: 是否成功
    """
    r = get_redis()
    if not r:
        return False
        
    try:
        r.set(key, json.dumps(value), ex=expire)
        return True
    except Exception as e:
        logger.error(f"向Redis存入数据失败: {e}")
        return False

def cache_delete(key: str) -> bool:
    """
    从缓存中删除数据
    :param key: 缓存键
    :return: 是否成功
    """
    r = get_redis()
    if not r:
        return False
        
    try:
        r.delete(key)
        return True
    except Exception as e:
        logger.error(f"从Redis删除数据失败: {e}")
        return False

def startup_event_handler(app: FastAPI) -> Callable:
    """
    应用启动事件处理器
    :param app: FastAPI应用实例
    :return: 启动处理函数
    """
    async def startup() -> None:
        # 创建Redis连接
        if settings.USE_REDIS:
            create_redis_pool()
    
    return startup

def shutdown_event_handler(app: FastAPI) -> Callable:
    """
    应用关闭事件处理器
    :param app: FastAPI应用实例
    :return: 关闭处理函数
    """
    async def shutdown() -> None:
        # 关闭Redis连接
        global redis_pool
        if redis_pool:
            redis_pool.disconnect()
            redis_pool = None
            logger.info("Redis连接已关闭")
    
    return shutdown 