from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, validator
import json


class MonitorTaskBase(BaseModel):
    """监控任务基础模型"""
    name: str
    videostream_id: int
    algorithm_id: int
    config_json: Optional[Dict[str, Any]] = None
    schedule_type: Optional[str] = None  # realtime, scheduled
    schedule_config: Optional[Dict[str, Any]] = None

    @validator('config_json', 'schedule_config', pre=True)
    def parse_json(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return {}
        return v


class MonitorTaskCreate(MonitorTaskBase):
    """创建监控任务模型"""
    pass


class MonitorTaskUpdate(BaseModel):
    """更新监控任务模型"""
    name: Optional[str] = None
    videostream_id: Optional[int] = None
    algorithm_id: Optional[int] = None
    status: Optional[str] = None
    config_json: Optional[Dict[str, Any]] = None
    schedule_type: Optional[str] = None
    schedule_config: Optional[Dict[str, Any]] = None

    @validator('config_json', 'schedule_config', pre=True)
    def parse_json(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return {}
        return v


class MonitorTaskInDBBase(MonitorTaskBase):
    """数据库中的监控任务基础模型"""
    id: int
    status: str
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# 返回给API的模型
class MonitorTask(MonitorTaskInDBBase):
    """API响应的监控任务模型"""
    pass


# 监控任务状态响应
class MonitorTaskStatus(BaseModel):
    """监控任务状态模型"""
    id: int
    name: str
    status: str
    current_fps: Optional[float] = None
    cpu_usage: Optional[float] = None
    gpu_usage: Optional[float] = None
    memory_usage: Optional[int] = None
    uptime_seconds: Optional[int] = None
    detected_objects: Optional[List[Dict[str, Any]]] = None
    last_frame_time: Optional[str] = None


# 启动任务响应
class MonitorTaskStartResponse(BaseModel):
    """启动监控任务响应"""
    id: int
    name: str
    status: str
    start_time: str


# 停止任务响应
class MonitorTaskStopResponse(BaseModel):
    """停止监控任务响应"""
    id: int
    name: str
    status: str
    stop_time: str
    duration_seconds: Optional[float] = None 