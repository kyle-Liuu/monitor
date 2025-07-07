#!/usr/bin/env python
"""
重置数据库脚本

该脚本会删除现有数据库并创建一个全新的数据库，然后添加初始数据。
在需要重置数据库时使用。

用法:
    python reset_db.py                  # 重置数据库
    python reset_db.py --backup         # 在重置前备份数据库
    python reset_db.py --keep-uploads   # 重置数据库但保留上传文件
"""

import os
import sys
import logging
import shutil
import argparse
import time
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
UPLOADS_DIR = Path("uploads")
AVATARS_DIR = UPLOADS_DIR / "avatars"
MODELS_DIR = UPLOADS_DIR / "models"
WARNINGS_DIR = UPLOADS_DIR / "warnings"
FACES_DIR = UPLOADS_DIR / "faces"
TEST_IMAGES_DIR = UPLOADS_DIR / "test_images"
BACKUP_DIR = SCRIPT_DIR / "backups"

def generate_user_id(prefix: str = "user", length: int = 7) -> str:
    """生成用户ID，格式为user+7位随机字符或数字"""
    chars = string.ascii_letters + string.digits
    random_str = ''.join(random.choice(chars) for _ in range(length))
    return f"{prefix}{random_str}"

def backup_database():
    """备份当前数据库和上传文件"""
    if not DB_FILE.exists():
        logger.warning("没有找到数据库文件，无需备份")
        return False
    
    # 创建备份目录
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / f"backup_{timestamp}"
    backup_path.mkdir(parents=True, exist_ok=True)
    
    try:
        # 备份数据库文件
        if DB_FILE.exists():
            shutil.copy2(DB_FILE, backup_path / DB_FILE.name)
            logger.info(f"数据库已备份到 {backup_path / DB_FILE.name}")
        
        # 备份上传文件目录
        if UPLOADS_DIR.exists():
            uploads_backup = backup_path / UPLOADS_DIR.name
            shutil.copytree(UPLOADS_DIR, uploads_backup, dirs_exist_ok=True)
            logger.info(f"上传文件已备份到 {uploads_backup}")
            
        logger.info(f"备份完成，所有文件已保存到 {backup_path}")
        return True
    except Exception as e:
        logger.error(f"备份过程出错: {e}")
        return False

def clean_directory(directory: Path, keep_uploads: bool = False):
    """清理目录，保留目录结构但删除内容"""
    if not directory.exists():
        directory.mkdir(parents=True, exist_ok=True)
        return
    
    if keep_uploads:
        logger.info(f"保留上传目录内容: {directory}")
        return
    
    try:
        # 删除目录下的所有文件和子目录，但保留目录本身
        for item in directory.iterdir():
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
        logger.info(f"已清空目录: {directory}")
    except Exception as e:
        logger.error(f"清理目录 {directory} 时出错: {e}")

def reset_database(backup: bool = False, keep_uploads: bool = False):
    """删除旧数据库并创建新数据库"""
    logger.info("开始重置数据库...")
    
    # 备份数据库
    if backup:
        logger.info("正在备份现有数据...")
        backup_database()
    
    # 检查并删除旧数据库文件
    if DB_FILE.exists():
        logger.info(f"删除现有数据库文件: {DB_FILE}")
        DB_FILE.unlink()
        logger.info("旧数据库已删除")
    else:
        logger.info("未找到现有数据库文件，将创建新数据库")
    
    # 创建上传目录结构
    logger.info("确保上传目录结构存在...")
    UPLOADS_DIR.mkdir(exist_ok=True)
    
    # 创建或清理各个上传目录
    for directory in [AVATARS_DIR, MODELS_DIR, WARNINGS_DIR, FACES_DIR, TEST_IMAGES_DIR]:
        clean_directory(directory, keep_uploads)
    
    # 确保默认头像目录存在
    default_avatar_dir = AVATARS_DIR / "default"
    default_avatar_dir.mkdir(exist_ok=True)
    
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
                user_avatar_dir = AVATARS_DIR / user.user_id
                user_avatar_dir.mkdir(exist_ok=True)
                logger.info(f"为用户 {user.username} 创建头像目录: {user_avatar_dir}")
        finally:
            db.close()
            
        logger.info("数据库初始化完成")
    except Exception as e:
        logger.error(f"数据库初始化失败: {str(e)}")
        raise
    
    logger.info("数据库重置完成，可以启动应用程序了")
    return True


if __name__ == "__main__":
    # 解析命令行参数
    parser = argparse.ArgumentParser(description="重置数据库工具")
    parser.add_argument("--backup", action="store_true", help="在重置前备份数据库")
    parser.add_argument("--keep-uploads", action="store_true", help="保留上传文件")
    args = parser.parse_args()
    
    try:
        # 确保备份目录存在
        BACKUP_DIR.mkdir(exist_ok=True)
        
        # 执行数据库重置
        success = reset_database(backup=args.backup, keep_uploads=args.keep_uploads)
        
        if success:
            logger.info("\n数据库已成功重置！现在可以启动后端服务了。")
            logger.info("\n可用的测试账户:")
            logger.info("超级管理员: Super / 123456")
            logger.info("管理员: Admin / 123456")
            print("普通用户: User / 123456\n")
    except Exception as e:
        logger.error(f"重置数据库时出错: {str(e)}")
        sys.exit(1) 