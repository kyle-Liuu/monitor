from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class VideoStreamBase(BaseModel):
    id: int
    name: str


class VirtualOrganizationBase(BaseModel):
    name: str
    description: Optional[str] = None


class VirtualOrganizationCreate(VirtualOrganizationBase):
    videostream_ids: Optional[List[int]] = None


class VirtualOrganizationUpdate(VirtualOrganizationBase):
    name: Optional[str] = None
    videostream_ids: Optional[List[int]] = None


class VirtualOrganizationInDBBase(VirtualOrganizationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# 用于返回给API的模型
class VirtualOrganization(VirtualOrganizationInDBBase):
    pass


# 包含视频流的虚拟组织模型
class VirtualOrganizationWithStreams(VirtualOrganization):
    videostreams: List[VideoStreamBase] = []


# 添加/移除视频流请求
class StreamsUpdate(BaseModel):
    videostream_ids: List[int] 