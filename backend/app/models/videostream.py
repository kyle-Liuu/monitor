from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.models.virtual_organization import virtual_org_streams


class VideoStream(Base):
    __tablename__ = "videostreams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    url = Column(String(200), nullable=False)
    type = Column(String(20), nullable=False)  # 如：RTSP、RTMP、HLS等
    status = Column(String(20), default="offline")  # online, offline, error
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    location = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    config_json = Column(Text, nullable=True)  # 配置信息 (JSON格式)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # 关系
    organization = relationship("Organization", back_populates="videostreams")
    virtual_organizations = relationship(
        "VirtualOrganization", 
        secondary=virtual_org_streams, 
        back_populates="videostreams"
    )
    warnings = relationship("Warning", back_populates="videostream")
    monitor_tasks = relationship("MonitorTask", back_populates="videostream") 