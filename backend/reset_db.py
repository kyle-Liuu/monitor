#!/usr/bin/env python
"""
重置数据库脚本

该脚本会删除现有数据库并创建一个全新的数据库，然后添加初始数据。
在需要重置数据库时使用。
"""

import os
import sys
import logging
import shutil
from pathlib import Path
import string
import random

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

# 获取项目根目录
SCRIPT_DIR = Path(__file__).resolve().parent
DB_FILE = SCRIPT_DIR / "sql_app.db"
AVATARS_DIR = Path("uploads") / "avatars"

def generate_user_id(prefix: str = "user", length: int = 7) -> str:
    """生成用户ID，格式为user+7位随机字符或数字"""
    chars = string.ascii_letters + string.digits
    random_str = ''.join(random.choice(chars) for _ in range(length))
    return f"{prefix}{random_str}"

def reset_database():
    """删除旧数据库并创建新数据库"""
    logger.info("开始重置数据库...")
    
    # 检查并删除旧数据库文件
    if DB_FILE.exists():
        logger.info(f"删除现有数据库文件: {DB_FILE}")
        DB_FILE.unlink()
        logger.info("旧数据库已删除")
    else:
        logger.info("未找到现有数据库文件，将创建新数据库")
    
    # 创建上传目录
    logger.info("确保上传目录存在...")
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(exist_ok=True)
    
    # 创建头像目录
    avatars_dir = uploads_dir / "avatars"
    avatars_dir.mkdir(exist_ok=True)
    logger.info(f"创建头像上传目录: {avatars_dir}")
    
    # 导入初始化函数并运行
    try:
        logger.info("开始初始化新数据库...")
        from app.db.init_db import main as init_db_main
        init_db_main()
        
        # 为初始用户生成头像目录
        logger.info("创建初始用户的头像目录...")
        from app.db.session import SessionLocal
        from app.models.user import User
        
        db = SessionLocal()
        try:
            users = db.query(User).all()
            for user in users:
                # 确保每个用户都有user_id
                if not user.user_id:
                    user.user_id = generate_user_id()
                    db.commit()
                    logger.info(f"为用户 {user.username} 生成user_id: {user.user_id}")
                
                # 为每个用户创建头像目录
                user_avatar_dir = avatars_dir / user.user_id
                user_avatar_dir.mkdir(exist_ok=True)
                logger.info(f"为用户 {user.username} 创建头像目录: {user_avatar_dir}")
        finally:
            db.close()
            
        logger.info("数据库初始化完成")
    except Exception as e:
        logger.error(f"数据库初始化失败: {str(e)}")
        raise
    
    logger.info("数据库重置完成，可以启动应用程序了")


if __name__ == "__main__":
    try:
        reset_database()
        print("\n数据库已成功重置！现在可以启动后端服务了。")
        print("\n可用的测试账户:")
        print("超级管理员: Super / 123456")
        print("管理员: Admin / 123456")
        print("普通用户: User / 123456\n")
    except Exception as e:
        logger.error(f"重置数据库时出错: {str(e)}")
        sys.exit(1) 