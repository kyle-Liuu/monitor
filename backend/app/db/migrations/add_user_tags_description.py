#!/usr/bin/env python
"""
为用户表添加tags和description字段的迁移脚本
"""

import logging
import sys
import sqlite3
from pathlib import Path

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

# 获取项目根目录
SCRIPT_DIR = Path(__file__).resolve().parent.parent.parent.parent
DB_FILE = SCRIPT_DIR / "sql_app.db"

def add_user_tags_description():
    """添加用户标签和描述字段"""
    if not DB_FILE.exists():
        logger.error(f"数据库文件不存在: {DB_FILE}")
        return False
    
    try:
        # 连接到SQLite数据库
        conn = sqlite3.connect(str(DB_FILE))
        cursor = conn.cursor()
        
        # 检查tags列是否存在
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        # 添加tags列（如果不存在）
        if "tags" not in column_names:
            logger.info("添加tags列到users表...")
            cursor.execute("ALTER TABLE users ADD COLUMN tags TEXT DEFAULT '[]'")
            logger.info("tags列添加成功")
        else:
            logger.info("tags列已存在，跳过")
        
        # 添加description列（如果不存在）
        if "description" not in column_names:
            logger.info("添加description列到users表...")
            cursor.execute("ALTER TABLE users ADD COLUMN description TEXT")
            logger.info("description列添加成功")
        else:
            logger.info("description列已存在，跳过")
        
        # 提交更改
        conn.commit()
        logger.info("迁移完成")
        
        # 关闭连接
        conn.close()
        return True
    
    except Exception as e:
        logger.error(f"迁移失败: {str(e)}")
        return False

def main():
    """主函数"""
    logger.info("开始迁移: 添加用户标签和描述字段")
    success = add_user_tags_description()
    
    if success:
        logger.info("迁移成功完成")
    else:
        logger.error("迁移失败")
        sys.exit(1)

if __name__ == "__main__":
    main() 