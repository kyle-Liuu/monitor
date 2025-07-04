from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, validator
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
    type: str  # 如：入侵检测、人脸识别、异常行为等
    level: str  # 如：info, warning, critical
    videostream_id: Optional[int] = None
    algorithm_id: Optional[int] = None
    image_path: Optional[str] = None
    warning_metadata: Optional[Dict[str, Any]] = None

    @validator('warning_metadata', pre=True)
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
    is_processed: Optional[bool] = None
    notes: Optional[str] = None


class WarningInDBBase(WarningBase):
    id: int
    detection_time: datetime
    is_processed: bool
    processed_by: Optional[int] = None
    processed_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        orm_mode = True


# 用于返回给API的模型
class Warning(WarningInDBBase):
    pass


# 包含关联信息的告警模型
class WarningWithDetails(Warning):
    videostream: Optional[VideoStreamInfo] = None
    algorithm: Optional[AlgorithmInfo] = None
    processor: Optional[UserInfo] = None


# 批量处理告警请求
class BatchProcessWarning(BaseModel):
    warning_ids: List[int]
    is_processed: bool
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
    by_date: List[WarningDateStat] 