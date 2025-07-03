from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class MonitorTask(Base):
    __tablename__ = "monitor_tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    videostream_id = Column(Integer, ForeignKey("videostreams.id"), nullable=True)
    algorithm_id = Column(Integer, ForeignKey("algorithms.id"), nullable=True)
    status = Column(String(20), default="stopped")  # running, stopped, error
    config_json = Column(Text, nullable=True)  # 任务配置 (JSON格式)
    schedule_type = Column(String(20), nullable=True)  # 如：realtime, scheduled
    schedule_config = Column(Text, nullable=True)  # 调度配置 (JSON格式)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # 关系
    videostream = relationship("VideoStream", back_populates="monitor_tasks")
    algorithm = relationship("Algorithm", back_populates="monitor_tasks")
    creator = relationship("User", backref="created_tasks") 