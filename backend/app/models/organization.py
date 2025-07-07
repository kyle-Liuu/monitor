from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(String(10), unique=True, nullable=False, index=True, comment="组织唯一标识，格式为org+7位任意字符或数字")
    name = Column(String(100), nullable=False)
    parent_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    description = Column(Text, nullable=True)
    address = Column(String(200), nullable=True)
    contact = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # 自引用关系
    parent = relationship("Organization", remote_side=[id], backref="children")
    # 反向关系
    videostreams = relationship("VideoStream", back_populates="organization") 