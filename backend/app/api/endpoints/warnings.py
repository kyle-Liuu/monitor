from typing import List, Optional, Dict
from datetime import datetime, timedelta
import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app import models, schemas
from app.utils.deps import get_db, get_current_active_user

router = APIRouter()


@router.get("/", response_model=Dict)
def get_warnings(
    type: Optional[str] = None,
    level: Optional[str] = None,
    videostream_id: Optional[int] = None,
    algorithm_id: Optional[int] = None,
    is_processed: Optional[bool] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current: int = Query(1, gt=0),
    size: int = Query(20, gt=0, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    获取告警列表，支持多种过滤条件
    """
    # 计算跳过的记录数
    skip = (current - 1) * size
    
    # 构建查询
    query = db.query(models.Warning)
    
    # 应用过滤条件
    if type:
        query = query.filter(models.Warning.type == type)
    if level:
        query = query.filter(models.Warning.level == level)
    if videostream_id:
        query = query.filter(models.Warning.videostream_id == videostream_id)
    if algorithm_id:
        query = query.filter(models.Warning.algorithm_id == algorithm_id)
    if is_processed is not None:
        query = query.filter(models.Warning.is_processed == is_processed)
    if start_date:
        query = query.filter(models.Warning.detection_time >= start_date)
    if end_date:
        query = query.filter(models.Warning.detection_time <= end_date)
    
    # 获取总记录数
    total = query.count()
    
    # 获取分页数据
    warnings = query.order_by(models.Warning.detection_time.desc()).offset(skip).limit(size).all()
    
    # 构建响应
    return {
        "records": warnings,
        "current": current,
        "size": size,
        "total": total
    }


@router.get("/{warning_id}", response_model=schemas.WarningWithDetails)
def get_warning_detail(
    warning_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    根据ID获取告警详情
    """
    warning = db.query(models.Warning).filter(models.Warning.id == warning_id).first()
    if not warning:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warning not found",
        )
    return warning


@router.put("/{warning_id}/process", response_model=Dict)
def process_warning(
    warning_id: int,
    warning_update: schemas.WarningUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    处理告警（标记为已处理或未处理）
    """
    warning = db.query(models.Warning).filter(models.Warning.id == warning_id).first()
    if not warning:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warning not found",
        )
    
    # 更新处理状态
    warning.is_processed = warning_update.is_processed
    warning.notes = warning_update.notes
    
    # 如果标记为已处理，记录处理人和时间
    if warning_update.is_processed:
        warning.processed_by = current_user.id
        warning.processed_at = datetime.now()
    else:
        warning.processed_by = None
        warning.processed_at = None
    
    db.commit()
    db.refresh(warning)
    
    return {
        "id": warning.id,
        "is_processed": warning.is_processed,
        "processed_by": {
            "id": current_user.id,
            "username": current_user.username
        } if warning.is_processed else None,
        "processed_at": warning.processed_at,
        "notes": warning.notes
    }


@router.put("/batch-process", response_model=schemas.BatchProcessResult)
def batch_process_warnings(
    batch_process: schemas.BatchProcessWarning,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    批量处理告警
    """
    # 查询指定ID的告警
    warnings = db.query(models.Warning).filter(models.Warning.id.in_(batch_process.warning_ids)).all()
    
    # 获取实际找到的ID列表
    found_ids = [warning.id for warning in warnings]
    
    # 当前处理时间
    now = datetime.now()
    
    # 更新所有找到的告警
    for warning in warnings:
        warning.is_processed = batch_process.is_processed
        warning.notes = batch_process.notes
        
        # 如果标记为已处理，记录处理人和时间
        if batch_process.is_processed:
            warning.processed_by = current_user.id
            warning.processed_at = now
        else:
            warning.processed_by = None
            warning.processed_at = None
    
    db.commit()
    
    return {
        "processed_count": len(found_ids),
        "processed_ids": found_ids,
        "processed_at": now
    }


@router.get("/statistics", response_model=schemas.WarningStats)
def get_warning_statistics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    group_by: str = Query("day", regex="^(day|week|month|type|level)$"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    获取告警统计信息
    """
    # 设置默认日期范围（如果未提供）
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)  # 默认30天
    
    # 基本查询条件
    base_query = db.query(models.Warning).filter(
        models.Warning.detection_time >= start_date,
        models.Warning.detection_time <= end_date
    )
    
    # 总告警数
    total = base_query.count()
    
    # 已处理和未处理的告警数
    processed = base_query.filter(models.Warning.is_processed == True).count()
    unprocessed = total - processed
    
    # 按级别统计
    level_stats = {}
    level_query = db.query(
        models.Warning.level, 
        func.count(models.Warning.id)
    ).filter(
        models.Warning.detection_time >= start_date,
        models.Warning.detection_time <= end_date
    ).group_by(models.Warning.level).all()
    
    for level, count in level_query:
        level_stats[level] = count
    
    # 按类型统计
    type_stats = {}
    type_query = db.query(
        models.Warning.type, 
        func.count(models.Warning.id)
    ).filter(
        models.Warning.detection_time >= start_date,
        models.Warning.detection_time <= end_date
    ).group_by(models.Warning.type).all()
    
    for warning_type, count in type_query:
        type_stats[warning_type] = count
    
    # 按日期统计
    date_stats = []
    
    # 根据group_by参数确定日期格式和分组方式
    if group_by == "day":
        # 按天统计
        date_query = db.query(
            func.date(models.Warning.detection_time).label('date'),
            func.count(models.Warning.id)
        ).filter(
            models.Warning.detection_time >= start_date,
            models.Warning.detection_time <= end_date
        ).group_by('date').order_by('date').all()
        
        for date_str, count in date_query:
            date_stats.append({"date": str(date_str), "count": count})
            
    elif group_by == "week":
        # 按周统计
        # 注意：这里的实现会根据数据库类型有所不同
        # 这是SQLite的简化实现
        current_date = start_date
        while current_date <= end_date:
            week_start = current_date
            week_end = current_date + timedelta(days=6)
            
            if week_end > end_date:
                week_end = end_date
                
            count = base_query.filter(
                models.Warning.detection_time >= week_start,
                models.Warning.detection_time <= week_end
            ).count()
            
            date_stats.append({
                "date": f"{week_start.strftime('%Y-%m-%d')} to {week_end.strftime('%Y-%m-%d')}",
                "count": count
            })
            
            current_date += timedelta(days=7)
            
    elif group_by == "month":
        # 按月统计
        # 这是一个简化实现
        months = {}
        date_query = db.query(
            func.strftime('%Y-%m', models.Warning.detection_time).label('month'),
            func.count(models.Warning.id)
        ).filter(
            models.Warning.detection_time >= start_date,
            models.Warning.detection_time <= end_date
        ).group_by('month').order_by('month').all()
        
        for month, count in date_query:
            date_stats.append({"date": month, "count": count})
    
    return {
        "total": total,
        "processed": processed,
        "unprocessed": unprocessed,
        "by_level": level_stats,
        "by_type": type_stats,
        "by_date": date_stats
    } 