import logging
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_admin_password():
    """更新admin用户的密码哈希"""
    db = SessionLocal()
    try:
        # 查找admin用户
        admin_user = db.query(User).filter(User.username == "admin").first()
        
        if admin_user:
            # 使用新的哈希算法更新密码
            admin_user.hashed_password = get_password_hash("admin123")
            db.commit()
            logger.info("成功更新admin用户密码哈希")
        else:
            logger.warning("未找到admin用户，请先初始化数据库")
            
    finally:
        db.close()

if __name__ == "__main__":
    update_admin_password()
    print("密码哈希更新完成，请尝试使用admin/admin123登录")