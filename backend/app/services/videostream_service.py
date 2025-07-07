from typing import List, Optional, Dict, Any
import json
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.videostream import VideoStream
from app.schemas.videostream import VideoStreamCreate, VideoStreamUpdate

class VideoStreamService:
    """视频流服务类，提供视频流管理和处理功能"""
    
    @staticmethod
    async def get_videostream(db: Session, videostream_id: int) -> Optional[VideoStream]:
        """获取视频流详情"""
        return db.query(VideoStream).filter(VideoStream.id == videostream_id).first()
    
    @staticmethod
    async def get_videostreams(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[int] = None,
        organization_id: Optional[int] = None,
        type: Optional[str] = None
    ) -> List[VideoStream]:
        """获取视频流列表"""
        query = db.query(VideoStream)
        
        if status is not None:
            # 将数字状态转换为字符串状态
            status_map = {0: "offline", 1: "online", 2: "error"}
            str_status = status_map.get(status)
            if str_status:
                query = query.filter(VideoStream.status == str_status)
            
        if organization_id:
            query = query.filter(VideoStream.organization_id == organization_id)
            
        if type:
            query = query.filter(VideoStream.type == type)
            
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    async def create_videostream(db: Session, videostream: VideoStreamCreate) -> VideoStream:
        """创建视频流"""
        # 将数字状态转换为字符串状态
        status_map = {0: "offline", 1: "online", 2: "error"}
        str_status = status_map.get(videostream.status, "offline")
        
        db_videostream = VideoStream(
            name=videostream.name,
            url=videostream.url,
            type=videostream.type,
            status=str_status,
            organization_id=videostream.organization_id,
            location=videostream.location,
            description=videostream.description,
            config_json=json.dumps(videostream.config) if videostream.config else None
        )
        db.add(db_videostream)
        db.commit()
        db.refresh(db_videostream)
        return db_videostream
    
    @staticmethod
    async def update_videostream(
        db: Session, 
        videostream_id: int, 
        videostream_update: VideoStreamUpdate
    ) -> Optional[VideoStream]:
        """更新视频流"""
        db_videostream = await VideoStreamService.get_videostream(db, videostream_id)
        if not db_videostream:
            return None
            
        update_data = videostream_update.dict(exclude_unset=True)
        
        # 特殊处理config字段，转换为JSON字符串
        if "config" in update_data and update_data["config"] is not None:
            update_data["config_json"] = json.dumps(update_data.pop("config"))
        
        # 特殊处理status字段，将数字转换为字符串
        if "status" in update_data and update_data["status"] is not None:
            status_map = {0: "offline", 1: "online", 2: "error"}
            update_data["status"] = status_map.get(update_data["status"], "offline")
        
        for key, value in update_data.items():
            setattr(db_videostream, key, value)
            
        db_videostream.updated_at = datetime.now()
        db.commit()
        db.refresh(db_videostream)
        return db_videostream
    
    @staticmethod
    async def delete_videostream(db: Session, videostream_id: int) -> bool:
        """删除视频流"""
        db_videostream = await VideoStreamService.get_videostream(db, videostream_id)
        if not db_videostream:
            return False
            
        db.delete(db_videostream)
        db.commit()
        return True
    
    @staticmethod
    async def check_videostream_status(db: Session, videostream_id: int) -> Dict[str, Any]:
        """检查视频流状态"""
        db_videostream = await VideoStreamService.get_videostream(db, videostream_id)
        if not db_videostream:
            raise HTTPException(status_code=404, detail="视频流不存在")
        
        # 这里应该使用ZLMediaKit API检查视频流状态
        # 以下代码仅为示例，实际项目中应该调用ZLMediaKit API
        import random
        
        # 模拟检查状态
        is_online = random.random() > 0.2  # 80%概率在线
        latency = random.randint(50, 300) if is_online else None
        
        # 更新数据库中的状态
        str_status = "online" if is_online else "offline"
        db_videostream.status = str_status
        db_videostream.updated_at = datetime.now()
        db.commit()
        
        # 返回前端期望的格式，将字符串状态转换为数字
        status_map = {"offline": 0, "online": 1, "error": 2}
        status_num = status_map.get(str_status, 0)
        
        return {
            "id": db_videostream.id,
            "status": status_num,
            "latency": latency,
            "last_checked": db_videostream.updated_at
        }
    
    @staticmethod
    async def get_videostreams_by_organization(
        db: Session, 
        organization_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[VideoStream]:
        """获取组织下的所有视频流"""
        return db.query(VideoStream)\
                 .filter(VideoStream.organization_id == organization_id)\
                 .offset(skip).limit(limit).all()
    
    @staticmethod
    async def get_videostreams_by_virtual_organization(
        db: Session,
        virtual_org_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """获取虚拟组织下的所有视频流"""
        # 这里需要连接虚拟组织和视频流的关联表
        # 以下是SQL示例，实际项目中应该根据ORM模型调整
        sql = """
        SELECT v.* FROM videostreams v
        JOIN virtual_org_streams vos ON v.id = vos.videostream_id
        WHERE vos.virtual_org_id = :virtual_org_id
        LIMIT :limit OFFSET :skip
        """
        
        result = db.execute(sql, {
            "virtual_org_id": virtual_org_id,
            "limit": limit,
            "skip": skip
        })
        
        # 将结果转换为字典列表
        streams = [dict(row) for row in result]
        
        # 将字符串状态转换为数字
        status_map = {"offline": 0, "online": 1, "error": 2}
        for stream in streams:
            if "status" in stream and isinstance(stream["status"], str):
                stream["status"] = status_map.get(stream["status"].lower(), 0)
        
        return streams 