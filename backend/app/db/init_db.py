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
        {"role_code": "R_SUPER", "role_name": "超级管理员", "description": "拥有系统全部权限"},
        {"role_code": "R_ADMIN", "role_name": "管理员", "description": "拥有系统管理权限"},
        {"role_code": "R_USER", "role_name": "普通用户", "description": "拥有系统普通权限"},
        {"role_code": "R_FINANCE", "role_name": "财务管理员", "description": "管理财务相关权限"},
        {"role_code": "R_ANALYST", "role_name": "数据分析师", "description": "拥有数据分析权限"},
        {"role_code": "R_SUPPORT", "role_name": "客服专员", "description": "处理客户支持请求"},
        {"role_code": "R_MARKETING", "role_name": "营销经理", "description": "管理营销活动权限"},
        {"role_code": "R_GUEST", "role_name": "访客用户", "description": "仅限浏览权限"},
        {"role_code": "R_MAINTAINER", "role_name": "系统维护员", "description": "负责系统维护和更新"},
        {"role_code": "R_PM", "role_name": "项目经理", "description": "管理项目相关权限"}
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
    admin_user = db.query(User).filter(User.username == "Super").first()
    if not admin_user:
        user = User(
            username="Super",
            email="admin@example.com",
            hashed_password=get_password_hash("123456"),
            full_name="超级管理员",
            is_active=True,
            is_superuser=True
        )
        db.add(user)
        db.commit()
        logger.info("创建超级管理员用户: Super")
        
        # 为超级管理员添加R_SUPER角色
        super_role = db.query(Role).filter(Role.role_code == "R_SUPER").first()
        if super_role:
            user.roles.append(super_role)
            db.commit()
            logger.info(f"为用户Super分配角色: {super_role.role_name}")
        
    # 创建普通管理员用户
    admin_user = db.query(User).filter(User.username == "Admin").first()
    if not admin_user:
        user = User(
            username="Admin",
            email="admin2@example.com",
            hashed_password=get_password_hash("123456"),
            full_name="管理员",
            is_active=True,
            is_superuser=False
        )
        db.add(user)
        db.commit()
        logger.info("创建管理员用户: Admin")
        
        # 为管理员添加R_ADMIN角色
        admin_role = db.query(Role).filter(Role.role_code == "R_ADMIN").first()
        if admin_role:
            user.roles.append(admin_role)
            db.commit()
            logger.info(f"为用户Admin分配角色: {admin_role.role_name}")
            
    # 创建普通用户
    user_account = db.query(User).filter(User.username == "User").first()
    if not user_account:
        user = User(
            username="User",
            email="user@example.com",
            hashed_password=get_password_hash("123456"),
            full_name="普通用户",
            is_active=True,
            is_superuser=False
        )
        db.add(user)
        db.commit()
        logger.info("创建普通用户: User")
        
        # 为用户添加R_USER角色
        user_role = db.query(Role).filter(Role.role_code == "R_USER").first()
        if user_role:
            user.roles.append(user_role)
            db.commit()
            logger.info(f"为用户User分配角色: {user_role.role_name}")

# 初始化数据库
def init_db(db: Session) -> None:
    # 创建所有表
    base.Base.metadata.create_all(bind=engine)
    logger.info("数据库表创建完成")
    
    # 创建初始数据
    create_initial_roles(db)
    create_initial_superuser(db)
    logger.info("初始数据创建完成")


def main() -> None:
    """
    初始化数据库主函数
    """
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    try:
        logger.info("创建初始数据")
        init_db(db)
        logger.info("初始数据创建完成")
    finally:
        db.close()


if __name__ == "__main__":
    main() 