from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, validator
import json


class AlgorithmBase(BaseModel):
    name: str
    version: str
    type: str  # 如：目标检测、人脸识别等
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


class AlgorithmCreate(AlgorithmBase):
    model_path: Optional[str] = None
    is_active: bool = True


class AlgorithmUpdate(BaseModel):
    name: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    config_json: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

    @validator('config_json', pre=True)
    def parse_config_json(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return {}
        return v


class AlgorithmInDBBase(AlgorithmBase):
    id: int
    model_path: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# 用于返回给API的模型
class Algorithm(AlgorithmInDBBase):
    pass


# 算法上传响应
class AlgorithmUpload(BaseModel):
    algorithm_id: int
    model_path: str
    file_size: int
    upload_time: datetime


# 算法测试响应中的检测结果
class Detection(BaseModel):
    class_name: str
    confidence: float
    bbox: List[float]  # [x1, y1, x2, y2]


# 算法测试响应
class AlgorithmTestResult(BaseModel):
    algorithm_id: int
    algorithm_name: str
    processing_time_ms: float
    detections: List[Detection]
    result_image: Optional[str] = None  # base64编码的结果图片


# 算法性能指标
class AlgorithmMetric(BaseModel):
    date: str
    avg_processing_time_ms: float
    total_calls: int


class AlgorithmMetrics(BaseModel):
    algorithm_id: int
    algorithm_name: str
    metrics: Dict[str, Any]
    daily_metrics: List[AlgorithmMetric] 