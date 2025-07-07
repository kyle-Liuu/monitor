import logging
import string
import random
import sys
import os

# 将项目根目录添加到系统路径
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from app.db.session import SessionLocal
from app.models.user import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_user_id(length: int = 7) -> str:
    """
    生成唯一的用户ID，格式为user+7位任意字符或数字
    """
    chars = string.ascii_letters + string.digits
    random_str = ''.join(random.choice(chars) for _ in range(length))
    return f"user{random_str}"

def run_migration():
    """执行迁移，为现有用户添加user_id"""
    db = SessionLocal()
    try:
        # 获取所有用户
        users = db.query(User).all()
        logger.info(f"找到 {len(users)} 个用户需要添加user_id")
        
        # 为每个用户添加user_id
        for i, user in enumerate(users):
            if not user.user_id:
                user.user_id = generate_user_id()
                logger.info(f"[{i+1}/{len(users)}] 为用户 {user.username} 添加user_id: {user.user_id}")
            else:
                logger.info(f"[{i+1}/{len(users)}] 用户 {user.username} 已有user_id: {user.user_id}")
        
        # 提交更改
        db.commit()
        logger.info("迁移完成！所有用户已添加user_id")
    except Exception as e:
        db.rollback()
        logger.error(f"迁移失败: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("开始为现有用户添加user_id...")
    run_migration() 