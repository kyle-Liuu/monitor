import logging
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.security import get_password_hash
from app.db import base  # 导入base以确保所有模型都被加载到
from app.db.session import engine
from app.core.config import settings
from app.models.user import User, Role, UserRole

# 确保所有SQL Alchemy模型都被创建
base.Base.metadata.create_all(bind=engine)

logger = logging.getLogger(__name__)

# 创建初始角色
def create_initial_roles(db: Session) -> None:
    roles = [
        {"role_code": "admin", "role_name": "管理员", "description": "系统管理员"},
        {"role_code": "user", "role_name": "普通用户", "description": "普通用户权限"}
    ]
    
    for role_data in roles:
        role = db.query(Role).filter(Role.role_code == role_data["role_code"]).first()
        if not role:
            role = Role(**role_data)
            db.add(role)
            db.commit()
            logger.info(f"创建角色: {role_data['role_name']}")

# 创建初始超级用户
def create_initial_superuser(db: Session) -> None:
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        user = User(
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            full_name="系统管理员",
            is_active=True,
            is_superuser=True
        )
        db.add(user)
        db.commit()
        logger.info("创建超级管理员用户: admin")
        
        # 为管理员添加admin角色
        admin_role = db.query(Role).filter(Role.role_code == "admin").first()
        if admin_role:
            user_role = UserRole(user_id=user.id, role_id=admin_role.id)
            db.add(user_role)
            db.commit()
            logger.info(f"为用户admin分配角色: {admin_role.role_name}")

# 初始化数据库
def init_db(db: Session) -> None:
    # 创建所有表
    base.Base.metadata.create_all(bind=engine)
    logger.info("数据库表创建完成")
    
    # 创建初始数据
    create_initial_roles(db)
    create_initial_superuser(db)
    logger.info("初始数据创建完成")


def init_test_data(db: Session) -> None:
    """
    初始化测试数据
    
    Args:
        db: 数据库会话
    """
    # 创建测试用户
    test_user = db.query(models.User).filter(models.User.username == "test").first()
    if not test_user:
        user_role = db.query(models.Role).filter(models.Role.role_code == "user").first()
        
        test_user = models.User(
            username="test",
            email="test@example.com",
            hashed_password=get_password_hash("test"),
            full_name="测试用户",
            phone="13800138000",
            gender=1,
            is_active=True
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        # 为测试用户添加角色
        if user_role:
            test_user.roles.append(user_role)
            db.commit()
        
        logger.info("测试用户已创建")


def main() -> None:
    """
    初始化数据库主函数
    """
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    try:
        logger.info("创建初始数据")
        init_db(db)
        init_test_data(db)
        logger.info("初始数据创建完成")
    finally:
        db.close()


if __name__ == "__main__":
    main() 