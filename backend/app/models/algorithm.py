from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Algorithm(Base):
    __tablename__ = "algorithms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(50), nullable=False)  # 如：目标检测、人脸识别等
    model_path = Column(String(200), nullable=True)  # 模型文件路径
    config_json = Column(Text, nullable=True)  # 配置信息 (JSON格式)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # 关系
    warnings = relationship("Warning", back_populates="algorithm")
    monitor_tasks = relationship("MonitorTask", back_populates="algorithm") 