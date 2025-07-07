from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from pydantic import BaseModel, validator, Field
import json


class VideoStreamInfo(BaseModel):
    id: int
    name: str


class AlgorithmInfo(BaseModel):
    id: int
    name: str


class UserInfo(BaseModel):
    id: int
    username: str


class WarningBase(BaseModel):
    warning_type: str = Field(..., alias="type")  # 如：入侵检测、人脸识别、异常行为等
    warning_level: int = Field(..., alias="level")  # 前端期望数字类型的level
    stream_id: Optional[int] = Field(None, alias="videostream_id")
    algorithm_id: Optional[int] = None
    image_url: Optional[str] = Field(None, alias="image_path")
    details: Optional[Dict[str, Any]] = Field(None, alias="warning_metadata")
    description: Optional[str] = ""  # 前端期望的描述字段

    @validator('details', pre=True)
    def parse_metadata(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return {}
        return v


class WarningCreate(WarningBase):
    pass


class WarningUpdate(BaseModel):
    status: Optional[int] = None  # 0: 未处理, 1: 已处理, 2: 误报
    notes: Optional[str] = None


class WarningInDBBase(WarningBase):
    id: int
    warning_time: datetime = Field(..., alias="detection_time")
    status: int = Field(..., alias="is_processed")  # 0: 未处理, 1: 已处理
    processed_by: Optional[int] = None
    processed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime = Field(..., alias="detection_time")  # 前端期望的created_at字段
    stream_name: Optional[str] = ""  # 前端期望的stream_name字段

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


# 用于返回给API的模型
class Warning(WarningInDBBase):
    @classmethod
    def from_orm(cls, obj):
        # 将布尔值is_processed转换为整数status
        obj.__dict__["status"] = 1 if obj.is_processed else 0
        
        # 如果有关联的视频流，添加stream_name
        if hasattr(obj, "videostream") and obj.videostream:
            obj.__dict__["stream_name"] = obj.videostream.name
        
        # 将level字符串转换为整数warning_level
        if isinstance(obj.level, str):
            level_map = {"info": 0, "warning": 1, "critical": 2}
            obj.__dict__["warning_level"] = level_map.get(obj.level.lower(), 1)
        
        return super().from_orm(obj)


# 包含关联信息的告警模型
class WarningWithDetails(Warning):
    videostream: Optional[VideoStreamInfo] = None
    algorithm: Optional[AlgorithmInfo] = None
    processor: Optional[UserInfo] = None


# 批量处理告警请求
class BatchProcessWarning(BaseModel):
    warning_ids: List[int]
    status: int = Field(..., alias="is_processed")
    notes: Optional[str] = None


# 批量处理告警响应
class BatchProcessResult(BaseModel):
    processed_count: int
    processed_ids: List[int]
    processed_at: datetime


# 告警统计数据
class WarningDateStat(BaseModel):
    date: str
    count: int


class WarningStats(BaseModel):
    total: int
    processed: int
    unprocessed: int
    by_level: Dict[str, int]
    by_type: Dict[str, int]
    by_time: List[WarningDateStat] = Field(..., alias="by_date") 