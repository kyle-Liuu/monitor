from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Warning(Base):
    __tablename__ = "warnings"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)  # 如：入侵检测、人脸识别、异常行为等
    level = Column(String(20), nullable=False)  # 如：info, warning, critical
    videostream_id = Column(Integer, ForeignKey("videostreams.id"), nullable=True)
    algorithm_id = Column(Integer, ForeignKey("algorithms.id"), nullable=True)
    detection_time = Column(DateTime, default=func.now())
    image_path = Column(String(200), nullable=True)  # 告警截图路径
    metadata = Column(Text, nullable=True)  # 告警详细信息 (JSON格式)
    is_processed = Column(Boolean, default=False)
    processed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    processed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    # 关系
    videostream = relationship("VideoStream", back_populates="warnings")
    algorithm = relationship("Algorithm", back_populates="warnings")
    processor = relationship("User", backref="processed_warnings") 