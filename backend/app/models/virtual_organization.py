from sqlalchemy import Column, Integer, String, Text, Table, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.db.base import Base

# 虚拟组织与视频流的多对多关系表
virtual_org_streams = Table(
    "virtual_org_streams",
    Base.metadata,
    Column("virtual_org_id", Integer, ForeignKey("virtual_organizations.id"), primary_key=True),
    Column("videostream_id", Integer, ForeignKey("videostreams.id"), primary_key=True)
)


class VirtualOrganization(Base):
    __tablename__ = "virtual_organizations"

    id = Column(Integer, primary_key=True, index=True)
    vorg_id = Column(String(11), unique=True, nullable=False, index=True, comment="虚拟组织唯一标识，格式为vorg+7位任意字符或数字")
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # 与视频流的多对多关系
    videostreams = relationship("VideoStream", secondary=virtual_org_streams, back_populates="virtual_organizations") 