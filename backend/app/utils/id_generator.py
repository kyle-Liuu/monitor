import string
import random
from sqlalchemy.orm import Session


def generate_unique_id(db: Session, model_class, id_field: str, prefix: str, length: int = 7) -> str:
    """
    生成唯一的ID，格式为prefix+length位任意字符或数字
    
    参数:
    - db: 数据库会话
    - model_class: 模型类
    - id_field: ID字段名
    - prefix: ID前缀
    - length: 随机部分长度
    
    返回:
    - 生成的唯一ID
    """
    while True:
        chars = string.ascii_letters + string.digits
        random_str = ''.join(random.choice(chars) for _ in range(length))
        unique_id = f"{prefix}{random_str}"
        
        # 检查生成的ID是否已存在
        existing = db.query(model_class).filter(getattr(model_class, id_field) == unique_id).first()
        if not existing:
            return unique_id


def generate_user_id(db: Session) -> str:
    """生成用户唯一ID"""
    from app.models.user import User
    return generate_unique_id(db, User, "user_id", "user")


def generate_org_id(db: Session) -> str:
    """生成组织唯一ID"""
    from app.models.organization import Organization
    return generate_unique_id(db, Organization, "org_id", "org")


def generate_vorg_id(db: Session) -> str:
    """生成虚拟组织唯一ID"""
    from app.models.virtual_organization import VirtualOrganization
    return generate_unique_id(db, VirtualOrganization, "vorg_id", "vorg")


def generate_stream_id(db: Session) -> str:
    """生成视频流唯一ID"""
    from app.models.videostream import VideoStream
    return generate_unique_id(db, VideoStream, "stream_id", "stream")


def generate_algo_id(db: Session) -> str:
    """生成算法唯一ID"""
    from app.models.algorithm import Algorithm
    return generate_unique_id(db, Algorithm, "algo_id", "algo")


def generate_warn_id(db: Session) -> str:
    """生成警告唯一ID"""
    from app.models.warning import Warning
    return generate_unique_id(db, Warning, "warn_id", "warn")


def generate_task_id(db: Session) -> str:
    """生成任务唯一ID"""
    from app.models.monitor_task import MonitorTask
    return generate_unique_id(db, MonitorTask, "task_id", "task") 