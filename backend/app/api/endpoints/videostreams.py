from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.schemas.videostream import VideoStream, VideoStreamCreate, VideoStreamUpdate, VideoStreamInDB
from app.services.videostream_service import VideoStreamService
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
async def get_videostreams(
    current: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    organization_id: Optional[int] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取视频流列表
    """
    skip = (current - 1) * size
    videostreams = await VideoStreamService.get_videostreams(
        db=db, 
        skip=skip, 
        limit=size, 
        status=status,
        organization_id=organization_id,
        type=type
    )
    
    # 获取总数
    total_streams = len(await VideoStreamService.get_videostreams(
        db=db, 
        status=status,
        organization_id=organization_id,
        type=type
    ))
    
    return {
        "records": videostreams,
        "current": current,
        "size": size,
        "total": total_streams
    }

@router.get("/{videostream_id}", response_model=VideoStreamInDB)
async def get_videostream(
    videostream_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取视频流详情
    """
    videostream = await VideoStreamService.get_videostream(db, videostream_id)
    if videostream is None:
        raise HTTPException(status_code=404, detail="视频流不存在")
    return videostream

@router.post("/", response_model=VideoStreamInDB)
async def create_videostream(
    videostream: VideoStreamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建视频流
    """
    return await VideoStreamService.create_videostream(db, videostream)

@router.put("/{videostream_id}", response_model=VideoStreamInDB)
async def update_videostream(
    videostream_id: int,
    videostream: VideoStreamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新视频流
    """
    updated_videostream = await VideoStreamService.update_videostream(db, videostream_id, videostream)
    if updated_videostream is None:
        raise HTTPException(status_code=404, detail="视频流不存在")
    return updated_videostream

@router.delete("/{videostream_id}", response_model=Dict[str, str])
async def delete_videostream(
    videostream_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    删除视频流
    """
    deleted = await VideoStreamService.delete_videostream(db, videostream_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="视频流不存在")
    return {"message": "视频流已成功删除"}

@router.get("/{videostream_id}/status", response_model=Dict[str, Any])
async def check_videostream_status(
    videostream_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    检查视频流状态
    """
    return await VideoStreamService.check_videostream_status(db, videostream_id)

@router.get("/organization/{organization_id}", response_model=List[VideoStreamInDB])
async def get_videostreams_by_organization(
    organization_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取组织下的所有视频流
    """
    return await VideoStreamService.get_videostreams_by_organization(db, organization_id, skip, limit)

@router.get("/virtual-organization/{virtual_org_id}", response_model=List[Dict[str, Any]])
async def get_videostreams_by_virtual_organization(
    virtual_org_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取虚拟组织下的所有视频流
    """
    return await VideoStreamService.get_videostreams_by_virtual_organization(db, virtual_org_id, skip, limit) 