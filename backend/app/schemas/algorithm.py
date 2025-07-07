from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, validator, Field
import json


class AlgorithmBase(BaseModel):
    name: str
    version: str
    type: str  # 如：目标检测、人脸识别等
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


class AlgorithmCreate(AlgorithmBase):
    model_path: Optional[str] = None
    status: int = Field(1, alias="is_active")  # 1表示激活，0表示未激活


class AlgorithmUpdate(BaseModel):
    name: Optional[str] = None
    version: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    status: Optional[int] = None

    @validator('config', pre=True)
    def parse_config(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return {}
        return v


class AlgorithmInDBBase(AlgorithmBase):
    id: int
    model_path: Optional[str] = None
    status: int = Field(..., alias="is_active")  # 将布尔值转换为整数
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


# 用于返回给API的模型
class Algorithm(AlgorithmInDBBase):
    @classmethod
    def from_orm(cls, obj):
        # 将is_active布尔值转换为status整数
        obj.__dict__["status"] = 1 if obj.is_active else 0
        return super().from_orm(obj)


# 添加AlgorithmInDB类，以兼容现有代码
class AlgorithmInDB(AlgorithmInDBBase):
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