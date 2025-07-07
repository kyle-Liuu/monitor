from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, validator, Field
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
    config: Optional[Dict[str, Any]] = Field(None, alias="config_json")

    @validator('config', pre=True)
    def parse_config(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return {}
        return v


class VideoStreamCreate(VideoStreamBase):
    organization_id: Optional[int] = None
    status: Optional[int] = 0  # 添加状态字段，0表示离线


class VideoStreamUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    status: Optional[int] = None
    organization_id: Optional[int] = None
    location: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

    @validator('config', pre=True)
    def parse_config(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return {}
        return v


class VideoStreamInDBBase(VideoStreamBase):
    id: int
    status: int = Field(..., alias="status")  # 0: offline, 1: online, 2: error
    organization_id: Optional[int] = None
    organization_name: Optional[str] = ""  # 添加组织名称字段
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


# 用于返回给API的模型
class VideoStream(VideoStreamInDBBase):
    @classmethod
    def from_orm(cls, obj):
        # 如果有关联的组织，添加组织名称
        if hasattr(obj, "organization") and obj.organization:
            obj.__dict__["organization_name"] = obj.organization.name
        
        # 将字符串状态转换为整数
        if isinstance(obj.status, str):
            status_map = {"offline": 0, "online": 1, "error": 2}
            obj.__dict__["status"] = status_map.get(obj.status.lower(), 0)
        
        return super().from_orm(obj)


# 添加VideoStreamInDB类，以兼容现有代码
class VideoStreamInDB(VideoStreamInDBBase):
    pass


# 包含组织信息的视频流模型
class VideoStreamWithOrganization(VideoStream):
    organization: Optional[OrganizationInfo] = None


# 视频流状态响应
class VideoStreamStatus(BaseModel):
    id: int
    status: int = Field(..., alias="status")
    latency: Optional[int] = None
    last_checked: datetime 