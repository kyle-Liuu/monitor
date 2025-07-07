from typing import List, Optional, Dict, Any
import os
import json
import torch
import cv2
import numpy as np
from datetime import datetime
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.models.algorithm import Algorithm
from app.schemas.algorithm import AlgorithmCreate, AlgorithmUpdate
from app.core.config import settings

class AlgorithmService:
    """算法服务类，提供算法管理和执行功能"""
    
    @staticmethod
    async def get_algorithm(db: Session, algorithm_id: int) -> Optional[Algorithm]:
        """获取算法详情"""
        return db.query(Algorithm).filter(Algorithm.id == algorithm_id).first()
    
    @staticmethod
    async def get_algorithms(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        is_active: Optional[bool] = None,
        type: Optional[str] = None
    ) -> List[Algorithm]:
        """获取算法列表"""
        query = db.query(Algorithm)
        
        if is_active is not None:
            query = query.filter(Algorithm.is_active == is_active)
            
        if type:
            query = query.filter(Algorithm.type == type)
            
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    async def create_algorithm(db: Session, algorithm: AlgorithmCreate) -> Algorithm:
        """创建算法"""
        # 将status转换为is_active
        is_active = algorithm.status > 0 if hasattr(algorithm, "status") else True
        
        db_algorithm = Algorithm(
            name=algorithm.name,
            version=algorithm.version,
            description=algorithm.description,
            type=algorithm.type,
            model_path=algorithm.model_path,
            config_json=json.dumps(algorithm.config) if algorithm.config else None,
            is_active=is_active
        )
        db.add(db_algorithm)
        db.commit()
        db.refresh(db_algorithm)
        return db_algorithm
    
    @staticmethod
    async def update_algorithm(
        db: Session, 
        algorithm_id: int, 
        algorithm_update: AlgorithmUpdate
    ) -> Optional[Algorithm]:
        """更新算法"""
        db_algorithm = await AlgorithmService.get_algorithm(db, algorithm_id)
        if not db_algorithm:
            return None
            
        update_data = algorithm_update.dict(exclude_unset=True)
        
        # 特殊处理config字段，转换为JSON字符串
        if "config" in update_data and update_data["config"] is not None:
            update_data["config_json"] = json.dumps(update_data.pop("config"))
        
        # 特殊处理status字段，将数字转换为布尔值
        if "status" in update_data and update_data["status"] is not None:
            update_data["is_active"] = update_data.pop("status") > 0
        
        for key, value in update_data.items():
            setattr(db_algorithm, key, value)
            
        db.commit()
        db.refresh(db_algorithm)
        return db_algorithm
    
    @staticmethod
    async def delete_algorithm(db: Session, algorithm_id: int) -> bool:
        """删除算法"""
        db_algorithm = await AlgorithmService.get_algorithm(db, algorithm_id)
        if not db_algorithm:
            return False
            
        db.delete(db_algorithm)
        db.commit()
        return True
    
    @staticmethod
    async def upload_model(
        db: Session, 
        algorithm_id: int,
        model_file: UploadFile
    ) -> Dict[str, Any]:
        """上传算法模型文件"""
        db_algorithm = await AlgorithmService.get_algorithm(db, algorithm_id)
        if not db_algorithm:
            raise HTTPException(status_code=404, detail="算法不存在")
        
        # 创建上传目录
        os.makedirs(os.path.join(settings.UPLOAD_DIR, "models"), exist_ok=True)
        
        # 生成文件路径
        file_extension = os.path.splitext(model_file.filename)[1]
        model_filename = f"{db_algorithm.name}_{db_algorithm.version}{file_extension}"
        model_path = os.path.join("models", model_filename)
        full_path = os.path.join(settings.UPLOAD_DIR, model_path)
        
        # 保存文件
        with open(full_path, "wb") as f:
            content = await model_file.read()
            f.write(content)
        
        # 更新算法模型路径
        db_algorithm.model_path = model_path
        db_algorithm.updated_at = datetime.now()
        db.commit()
        
        return {
            "algorithm_id": db_algorithm.id,
            "model_path": model_path,
            "file_size": os.path.getsize(full_path),
            "upload_time": db_algorithm.updated_at
        }
    
    @staticmethod
    async def test_algorithm(
        db: Session,
        algorithm_id: int,
        test_image: UploadFile,
        config_override: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """测试算法性能"""
        db_algorithm = await AlgorithmService.get_algorithm(db, algorithm_id)
        if not db_algorithm:
            raise HTTPException(status_code=404, detail="算法不存在")
            
        if not db_algorithm.model_path:
            raise HTTPException(status_code=400, detail="算法模型路径未设置")
            
        # 读取和处理图像
        content = await test_image.read()
        nparr = np.frombuffer(content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # 这里应该调用真实的YOLO模型执行检测
        # 以下代码仅为示例，实际项目中应该加载真实的模型
        try:
            # 获取算法配置
            algo_config = json.loads(db_algorithm.config_json) if db_algorithm.config_json else {}
            
            # 应用配置覆盖
            if config_override:
                algo_config.update(config_override)
                
            # 这里应该是实际的模型加载和推理代码
            # 示例: model = torch.hub.load('ultralytics/yolov5', 'custom', path=model_path)
            # result = model(img)
            
            # 模拟检测结果
            import time
            start_time = time.time()
            time.sleep(0.1)  # 模拟处理时间
            processing_time = (time.time() - start_time) * 1000
            
            # 模拟检测结果
            detections = [
                {"class": "person", "confidence": 0.92, "bbox": [120, 30, 350, 540]},
                {"class": "car", "confidence": 0.88, "bbox": [450, 200, 650, 380]}
            ]
            
            # 在图像上绘制检测框
            for det in detections:
                x1, y1, x2, y2 = det["bbox"]
                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(img, f"{det['class']} {det['confidence']:.2f}", 
                           (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            # 将结果图像编码为base64
            _, buffer = cv2.imencode('.jpg', img)
            import base64
            result_image = base64.b64encode(buffer).decode('utf-8')
            
            return {
                "algorithm_id": db_algorithm.id,
                "algorithm_name": db_algorithm.name,
                "processing_time_ms": processing_time,
                "detections": detections,
                "result_image": result_image
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"算法测试失败: {str(e)}")
    
    @staticmethod
    def run_detection(
        image: np.ndarray,
        model_path: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        在图像上执行目标检测
        
        Args:
            image: 要处理的图像
            model_path: 模型文件路径
            config: 算法配置
            
        Returns:
            检测结果和处理后的图像
        """
        # 在实际项目中，这里应该加载YOLO模型并执行推理
        # 示例: model = torch.hub.load('ultralytics/yolov5', 'custom', path=model_path)
        # result = model(image)
        
        # 模拟检测结果
        import time
        start_time = time.time()
        time.sleep(0.05)  # 模拟处理时间
        processing_time = (time.time() - start_time) * 1000
        
        # 获取置信度阈值
        conf_threshold = config.get("confidence_threshold", 0.5)
        
        # 模拟检测结果
        height, width = image.shape[:2]
        detections = [
            {"class": "person", "confidence": 0.92, "bbox": [int(width*0.2), int(height*0.1), 
                                                             int(width*0.6), int(height*0.9)]},
            {"class": "car", "confidence": 0.88, "bbox": [int(width*0.7), int(height*0.3), 
                                                          int(width*0.9), int(height*0.6)]}
        ]
        
        # 过滤低置信度检测结果
        detections = [d for d in detections if d["confidence"] >= conf_threshold]
        
        # 在图像上绘制检测框
        result_img = image.copy()
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            cv2.rectangle(result_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(result_img, f"{det['class']} {det['confidence']:.2f}", 
                       (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        return {
            "processing_time_ms": processing_time,
            "detections": detections,
            "result_image": result_img
        } 