from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, validator
import json


class OrganizationInfo(BaseModel):
    id: int
    name: str


class VideoStreamBase(BaseModel):
    name: str
    url: str
    type: str  # 如：RTSP、RTMP、HLS等
    location: Optional[str] = None
    description: Optional[str] = None
    config_json: Optional[Dict[str, Any]] = None

    @validator('config_json', pre=True)
    def parse_config_json(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return {}
        return v


class VideoStreamCreate(VideoStreamBase):
    organization_id: Optional[int] = None
    status: Optional[str] = "offline"  # 添加状态字段，默认为offline


class VideoStreamUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    status: Optional[str] = None
    organization_id: Optional[int] = None
    location: Optional[str] = None
    description: Optional[str] = None
    config_json: Optional[Dict[str, Any]] = None

    @validator('config_json', pre=True)
    def parse_config_json(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return {}
        return v


class VideoStreamInDBBase(VideoStreamBase):
    id: int
    status: str  # online, offline, error
    organization_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# 用于返回给API的模型
class VideoStream(VideoStreamInDBBase):
    pass


# 添加VideoStreamInDB类，以兼容现有代码
class VideoStreamInDB(VideoStreamInDBBase):
    pass


# 包含组织信息的视频流模型
class VideoStreamWithOrganization(VideoStream):
    organization: Optional[OrganizationInfo] = None


# 视频流状态响应
class VideoStreamStatus(BaseModel):
    id: int
    status: str
    latency: Optional[int] = None
    last_checked: datetime 