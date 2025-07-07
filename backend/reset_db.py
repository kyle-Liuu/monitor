#!/usr/bin/env python
"""
重置数据库脚本

该脚本会删除现有数据库并创建一个全新的数据库，然后添加初始数据。
在需要重置数据库时使用。
"""

import os
import sys
import logging
from pathlib import Path

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
    
    # 导入初始化函数并运行
    try:
        logger.info("开始初始化新数据库...")
        from app.db.init_db import main as init_db_main
        init_db_main()
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