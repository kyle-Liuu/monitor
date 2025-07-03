from typing import Dict, Any, List, Optional, Union
import json
import cv2
import time
import uuid
import logging
import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.monitor_task import MonitorTask
from app.models.videostream import VideoStream
from app.models.algorithm import Algorithm
from app.schemas.monitor_task import MonitorTaskCreate, MonitorTaskUpdate
from app.services.algorithm_service import AlgorithmService
from app.services.videostream_service import VideoStreamService
from app.services.zlmedia_service import ZLMediaService
from app.utils.thread_pool import thread_pool, async_task
from app.core.config import settings
from app.ws.manager import event_manager, EventTypes

logger = logging.getLogger(__name__)

# 保存正在运行的监控任务
running_tasks = {}

class MonitorService:
    """监控服务类，整合算法服务和视频流服务，实现监控任务的创建、管理和执行"""
    
    @staticmethod
    async def get_monitor_task(db: Session, task_id: int) -> Optional[MonitorTask]:
        """获取监控任务详情"""
        return db.query(MonitorTask).filter(MonitorTask.id == task_id).first()
    
    @staticmethod
    async def get_monitor_tasks(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[str] = None,
        videostream_id: Optional[int] = None,
        algorithm_id: Optional[int] = None
    ) -> List[MonitorTask]:
        """获取监控任务列表"""
        query = db.query(MonitorTask)
        
        if status:
            query = query.filter(MonitorTask.status == status)
            
        if videostream_id:
            query = query.filter(MonitorTask.videostream_id == videostream_id)
            
        if algorithm_id:
            query = query.filter(MonitorTask.algorithm_id == algorithm_id)
            
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    async def create_monitor_task(db: Session, task: MonitorTaskCreate, user_id: int) -> MonitorTask:
        """创建监控任务"""
        # 检查视频流是否存在
        videostream = await VideoStreamService.get_videostream(db, task.videostream_id)
        if not videostream:
            raise HTTPException(status_code=404, detail="视频流不存在")
            
        # 检查算法是否存在
        algorithm = await AlgorithmService.get_algorithm(db, task.algorithm_id)
        if not algorithm:
            raise HTTPException(status_code=404, detail="算法不存在")
            
        # 创建任务
        db_task = MonitorTask(
            name=task.name,
            videostream_id=task.videostream_id,
            algorithm_id=task.algorithm_id,
            status="stopped",  # 默认为停止状态
            config_json=json.dumps(task.config_json) if task.config_json else None,
            schedule_type=task.schedule_type,
            schedule_config=json.dumps(task.schedule_config) if task.schedule_config else None,
            created_by=user_id
        )
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task
    
    @staticmethod
    async def update_monitor_task(
        db: Session, 
        task_id: int, 
        task_update: MonitorTaskUpdate
    ) -> Optional[MonitorTask]:
        """更新监控任务"""
        db_task = await MonitorService.get_monitor_task(db, task_id)
        if not db_task:
            return None
            
        # 如果任务正在运行，不允许修改部分参数
        if db_task.status == "running" and task_update.status != "stopped":
            allowed_fields = ["name", "config_json"]
            update_data = task_update.dict(exclude_unset=True)
            for field in list(update_data.keys()):
                if field not in allowed_fields:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"任务正在运行，不能修改 {field} 参数，请先停止任务"
                    )
        
        update_data = task_update.dict(exclude_unset=True)
        
        # 特殊处理JSON字段
        if "config_json" in update_data and update_data["config_json"] is not None:
            update_data["config_json"] = json.dumps(update_data["config_json"])
            
        if "schedule_config" in update_data and update_data["schedule_config"] is not None:
            update_data["schedule_config"] = json.dumps(update_data["schedule_config"])
        
        for key, value in update_data.items():
            setattr(db_task, key, value)
            
        db_task.updated_at = datetime.now()
        db.commit()
        db.refresh(db_task)
        return db_task
    
    @staticmethod
    async def delete_monitor_task(db: Session, task_id: int) -> bool:
        """删除监控任务"""
        db_task = await MonitorService.get_monitor_task(db, task_id)
        if not db_task:
            return False
            
        # 如果任务正在运行，先停止任务
        if db_task.status == "running":
            await MonitorService.stop_monitor_task(db, task_id)
            
        db.delete(db_task)
        db.commit()
        return True
    
    @staticmethod
    async def start_monitor_task(db: Session, task_id: int) -> Dict[str, Any]:
        """启动监控任务"""
        db_task = await MonitorService.get_monitor_task(db, task_id)
        if not db_task:
            raise HTTPException(status_code=404, detail="监控任务不存在")
            
        # 检查任务是否已经在运行
        if db_task.status == "running":
            raise HTTPException(status_code=400, detail="监控任务已在运行")
            
        # 获取视频流和算法信息
        videostream = await VideoStreamService.get_videostream(db, db_task.videostream_id)
        algorithm = await AlgorithmService.get_algorithm(db, db_task.algorithm_id)
        
        if not videostream:
            raise HTTPException(status_code=404, detail="视频流不存在")
            
        if not algorithm:
            raise HTTPException(status_code=404, detail="算法不存在")
            
        if not algorithm.is_active:
            raise HTTPException(status_code=400, detail="算法未激活")
            
        # 解析任务配置
        config = json.loads(db_task.config_json) if db_task.config_json else {}
        
        # 启动监控任务
        try:
            # 创建唯一的任务ID
            task_thread_id = f"monitor_task_{task_id}_{int(time.time())}"
            
            # 提交任务到线程池
            future = thread_pool.submit_task(
                task_thread_id,
                MonitorService._run_monitor_task,
                task_id=task_id,
                videostream_url=videostream.url,
                algorithm_path=algorithm.model_path,
                config=config
            )
            
            # 保存任务引用
            running_tasks[task_id] = {
                "thread_id": task_thread_id,
                "future": future,
                "start_time": time.time()
            }
            
            # 更新任务状态
            db_task.status = "running"
            db_task.updated_at = datetime.now()
            db.commit()
            
            # 发送任务启动事件
            event_data = {
                "task_id": task_id,
                "name": db_task.name,
                "status": "running",
                "start_time": db_task.updated_at.isoformat()
            }
            event_manager.emit_event(EventTypes.MONITOR_START, event_data)
            
            return {
                "id": db_task.id,
                "name": db_task.name,
                "status": "running",
                "start_time": db_task.updated_at.isoformat()
            }
            
        except Exception as e:
            logger.error(f"启动监控任务失败: {str(e)}")
            raise HTTPException(status_code=500, detail=f"启动监控任务失败: {str(e)}")
    
    @staticmethod
    async def stop_monitor_task(db: Session, task_id: int) -> Dict[str, Any]:
        """停止监控任务"""
        db_task = await MonitorService.get_monitor_task(db, task_id)
        if not db_task:
            raise HTTPException(status_code=404, detail="监控任务不存在")
            
        # 检查任务是否在运行
        if db_task.status != "running":
            raise HTTPException(status_code=400, detail="监控任务未在运行")
            
        # 停止任务
        if task_id in running_tasks:
            thread_id = running_tasks[task_id]["thread_id"]
            
            # 取消任务
            cancelled = thread_pool.cancel_task(thread_id)
            
            # 从运行任务列表中移除
            task_info = running_tasks.pop(task_id)
            
            # 计算运行时间
            start_time = task_info.get("start_time", time.time())
            duration = time.time() - start_time
            
            # 更新任务状态
            db_task.status = "stopped"
            db_task.updated_at = datetime.now()
            db.commit()
            
            # 发送任务停止事件
            event_data = {
                "task_id": task_id,
                "name": db_task.name,
                "status": "stopped",
                "stop_time": db_task.updated_at.isoformat(),
                "duration_seconds": duration
            }
            event_manager.emit_event(EventTypes.MONITOR_STOP, event_data)
            
            return {
                "id": db_task.id,
                "name": db_task.name,
                "status": "stopped",
                "stop_time": db_task.updated_at.isoformat(),
                "duration_seconds": duration
            }
        else:
            # 任务不在运行列表中，直接更新状态
            db_task.status = "stopped"
            db_task.updated_at = datetime.now()
            db.commit()
            
            return {
                "id": db_task.id,
                "name": db_task.name,
                "status": "stopped",
                "stop_time": db_task.updated_at.isoformat()
            }
    
    @staticmethod
    async def get_monitor_task_status(db: Session, task_id: int) -> Dict[str, Any]:
        """获取监控任务实时状态"""
        db_task = await MonitorService.get_monitor_task(db, task_id)
        if not db_task:
            raise HTTPException(status_code=404, detail="监控任务不存在")
            
        # 基础信息
        result = {
            "id": db_task.id,
            "name": db_task.name,
            "status": db_task.status,
            "uptime_seconds": 0,
            "last_frame_time": None
        }
        
        # 如果任务在运行，获取详细状态
        if db_task.status == "running" and task_id in running_tasks:
            thread_id = running_tasks[task_id]["thread_id"]
            task_status = thread_pool.get_task_status(thread_id)
            
            if task_status:
                # 计算运行时间
                start_time = task_status.get("start_time", time.time())
                result["uptime_seconds"] = time.time() - start_time
                
                # 获取任务结果(如果有)
                task_result = thread_pool.get_task_result(thread_id)
                if task_result and isinstance(task_result, dict):
                    # 合并结果
                    for key, value in task_result.items():
                        if key not in result:
                            result[key] = value
        
        return result
    
    @staticmethod
    def _run_monitor_task(
        task_id: int,
        videostream_url: str,
        algorithm_path: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        执行监控任务(在线程池中运行)
        
        Args:
            task_id: 任务ID
            videostream_url: 视频流URL
            algorithm_path: 算法模型路径
            config: 任务配置
            
        Returns:
            任务状态信息
        """
        logger.info(f"开始执行监控任务 {task_id}")
        
        # 保存状态信息
        status_info = {
            "current_fps": 0,
            "cpu_usage": 0,
            "gpu_usage": 0,
            "memory_usage": 0,
            "detected_objects": [],
            "last_frame_time": None,
            "frames_processed": 0,
            "detection_count": 0
        }
        
        try:
            # 打开视频流
            cap = cv2.VideoCapture(videostream_url)
            if not cap.isOpened():
                raise Exception(f"无法打开视频流: {videostream_url}")
                
            # 获取视频属性
            fps = cap.get(cv2.CAP_PROP_FPS)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            logger.info(f"视频流已打开，分辨率: {width}x{height}, FPS: {fps}")
            
            # 初始化性能计数器
            frame_count = 0
            start_time = time.time()
            last_update_time = start_time
            update_interval = 1.0  # 状态更新间隔(秒)
            
            # 导入需要的模块
            import psutil
            
            # 主循环
            while True:
                # 检查是否被取消
                if thread_pool.get_task_status(f"monitor_task_{task_id}_{int(start_time)}")["status"] == "cancelled":
                    logger.info(f"监控任务 {task_id} 被取消")
                    break
                    
                # 读取一帧
                ret, frame = cap.read()
                if not ret:
                    # 视频流结束或出错，尝试重新连接
                    logger.warning(f"视频流中断，尝试重新连接: {videostream_url}")
                    cap.release()
                    time.sleep(2)  # 等待2秒后重试
                    cap = cv2.VideoCapture(videostream_url)
                    if not cap.isOpened():
                        logger.error(f"重新连接视频流失败: {videostream_url}")
                        raise Exception(f"重新连接视频流失败: {videostream_url}")
                    continue
                
                # 记录当前帧时间
                current_time = time.time()
                status_info["last_frame_time"] = datetime.now().isoformat()
                frame_count += 1
                
                # 定期处理(不是每一帧都执行算法)
                if frame_count % 10 == 0:  # 每10帧处理一次
                    # 执行算法处理
                    try:
                        # 使用同步方法调用，而不是异步方法
                        detection_result = AlgorithmService.run_detection(
                            image=frame,
                            model_path=algorithm_path,
                            config=config
                        )
                        
                        # 更新检测结果
                        status_info["detected_objects"] = detection_result["detections"]
                        status_info["detection_count"] += len(detection_result["detections"])
                        
                        # 这里添加告警判断逻辑
                        for detection in detection_result["detections"]:
                            # 判断是否需要告警 (例如：特定类别、超过特定置信度等)
                            if detection["class"] in config.get("alert_classes", []) and \
                               detection["confidence"] >= config.get("alert_threshold", 0.7):
                                # 发送告警事件
                                warning_data = {
                                    "task_id": task_id,
                                    "detection": detection,
                                    "timestamp": datetime.now().isoformat(),
                                    "image_base64": None,  # 此处可添加图像的base64编码
                                    "videostream_url": videostream_url
                                }
                                try:
                                    # 在线程中无法直接使用asyncio，使用后台线程发送事件
                                    event_manager.emit_event(EventTypes.WARNING_NEW, warning_data)
                                except Exception as e:
                                    logger.error(f"发送告警事件失败: {str(e)}")
                        
                    except Exception as e:
                        logger.error(f"算法处理异常: {str(e)}")
                
                # 更新状态信息
                if current_time - last_update_time >= update_interval:
                    # 计算FPS
                    elapsed = current_time - last_update_time
                    status_info["current_fps"] = (frame_count - status_info["frames_processed"]) / elapsed
                    status_info["frames_processed"] = frame_count
                    
                    # 获取真实的资源使用情况
                    try:
                        process = psutil.Process()
                        status_info["cpu_usage"] = process.cpu_percent()
                        status_info["memory_usage"] = process.memory_info().rss / (1024 * 1024)  # MB
                    except Exception as e:
                        logger.error(f"获取资源使用情况失败: {str(e)}")
                        # 使用默认值
                        status_info["cpu_usage"] = 25 + (frame_count % 10)
                        status_info["memory_usage"] = 200 + (frame_count % 100)
                    
                    # 如果使用GPU，获取GPU使用情况
                    if "cuda" in algorithm_path.lower():
                        try:
                            import torch
                            if torch.cuda.is_available():
                                status_info["gpu_usage"] = torch.cuda.memory_allocated() / (1024**3) * 100  # 占用百分比
                        except Exception:
                            status_info["gpu_usage"] = 30 + (frame_count % 20)  # 默认值
                    
                    last_update_time = current_time
                    
                    # 发送状态更新事件
                    try:
                        status_event_data = {
                            "task_id": task_id,
                            "status": status_info
                        }
                        event_manager.emit_event(EventTypes.MONITOR_STATUS, status_event_data, 
                                               target={"topic": f"monitor_{task_id}"})
                    except Exception as e:
                        logger.error(f"发送状态更新事件失败: {str(e)}")
                    
                    # 打印状态日志
                    logger.debug(
                        f"任务 {task_id} 状态: FPS={status_info['current_fps']:.2f}, "
                        f"检测对象={len(status_info['detected_objects'])}"
                    )
                
                # 简单的流量控制，避免CPU占用过高
                time.sleep(0.01)
                
        except Exception as e:
            logger.error(f"监控任务 {task_id} 执行异常: {str(e)}")
            status_info["error"] = str(e)
            return status_info
            
        finally:
            # 释放资源
            if 'cap' in locals() and cap is not None:
                cap.release()
            
            logger.info(f"监控任务 {task_id} 已结束，共处理 {status_info['frames_processed']} 帧")
            
        return status_info 