from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Warning(Base):
    __tablename__ = "warnings"

    id = Column(Integer, primary_key=True, index=True)
    warn_id = Column(String(11), unique=True, nullable=False, index=True, comment="警告唯一标识，格式为warn+7位任意字符或数字")
    type = Column(String(50), nullable=False)  # 如：入侵检测、人脸识别、异常行为等
    level = Column(Integer, nullable=False, default=1)  # 1:普通 2:重要 3:紧急
    status = Column(Integer, default=0)  # 0:未处理 1:已处理 2:误报 3:忽略
    videostream_id = Column(Integer, ForeignKey("videostreams.id"), nullable=True)
    algorithm_id = Column(Integer, ForeignKey("algorithms.id"), nullable=True)
    detection_time = Column(DateTime, default=func.now())
    image_path = Column(String(200), nullable=True)  # 告警截图路径
    warning_metadata = Column(Text, nullable=True)  # 告警详细信息 (JSON格式)
    is_processed = Column(Boolean, default=False)
    processed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    processed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # 关系
    videostream = relationship("VideoStream", back_populates="warnings")
    algorithm = relationship("Algorithm", back_populates="warnings")
    processor = relationship("User", backref="processed_warnings") 