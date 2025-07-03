from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.schemas.monitor_task import MonitorTask, MonitorTaskCreate, MonitorTaskUpdate, MonitorTaskInDB
from app.services.monitor_service import MonitorService
from app.models.user import User

router = APIRouter()

@router.get("/tasks", response_model=Dict[str, Any])
async def get_monitor_tasks(
    current: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    videostream_id: Optional[int] = None,
    algorithm_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取监控任务列表
    """
    skip = (current - 1) * size
    tasks = await MonitorService.get_monitor_tasks(
        db=db, 
        skip=skip, 
        limit=size, 
        status=status,
        videostream_id=videostream_id,
        algorithm_id=algorithm_id
    )
    
    # 获取总数
    total_tasks = len(await MonitorService.get_monitor_tasks(
        db=db, 
        status=status,
        videostream_id=videostream_id,
        algorithm_id=algorithm_id
    ))
    
    return {
        "records": tasks,
        "current": current,
        "size": size,
        "total": total_tasks
    }

@router.get("/tasks/{task_id}", response_model=MonitorTaskInDB)
async def get_monitor_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取监控任务详情
    """
    task = await MonitorService.get_monitor_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="监控任务不存在")
    return task

@router.post("/tasks", response_model=MonitorTaskInDB)
async def create_monitor_task(
    task: MonitorTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建监控任务
    """
    return await MonitorService.create_monitor_task(db, task, current_user.id)

@router.put("/tasks/{task_id}", response_model=MonitorTaskInDB)
async def update_monitor_task(
    task_id: int,
    task: MonitorTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新监控任务
    """
    updated_task = await MonitorService.update_monitor_task(db, task_id, task)
    if updated_task is None:
        raise HTTPException(status_code=404, detail="监控任务不存在")
    return updated_task

@router.delete("/tasks/{task_id}", response_model=Dict[str, str])
async def delete_monitor_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    删除监控任务
    """
    deleted = await MonitorService.delete_monitor_task(db, task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="监控任务不存在")
    return {"message": "监控任务已成功删除"}

@router.post("/tasks/{task_id}/start", response_model=Dict[str, Any])
async def start_monitor_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    启动监控任务
    """
    return await MonitorService.start_monitor_task(db, task_id)

@router.post("/tasks/{task_id}/stop", response_model=Dict[str, Any])
async def stop_monitor_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    停止监控任务
    """
    return await MonitorService.stop_monitor_task(db, task_id)

@router.get("/tasks/{task_id}/status", response_model=Dict[str, Any])
async def get_monitor_task_status(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取监控任务实时状态
    """
    return await MonitorService.get_monitor_task_status(db, task_id) 