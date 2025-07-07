from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.utils.deps import get_db, get_current_active_user

router = APIRouter()


@router.get("/", response_model=Dict[str, Any])
def get_virtual_organizations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    获取所有虚拟组织列表
    """
    virtual_orgs = db.query(models.VirtualOrganization).all()
    
    # 返回前端期望的格式
    return {
        "items": virtual_orgs,
        "total": len(virtual_orgs)
    }


@router.post("/", response_model=schemas.VirtualOrganizationWithStreams, status_code=status.HTTP_201_CREATED)
def create_virtual_organization(
    virtual_org: schemas.VirtualOrganizationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    创建新的虚拟组织
    """
    db_virtual_org = models.VirtualOrganization(
        name=virtual_org.name,
        description=virtual_org.description
    )
    db.add(db_virtual_org)
    db.commit()
    db.refresh(db_virtual_org)

    # 如果提供了视频流ID，添加关联
    if virtual_org.videostream_ids:
        # 获取所有存在的视频流
        streams = db.query(models.VideoStream).filter(
            models.VideoStream.id.in_(virtual_org.videostream_ids)
        ).all()
        
        if streams:
            db_virtual_org.videostreams = streams
            db.commit()
            db.refresh(db_virtual_org)

    return db_virtual_org


@router.get("/{virtual_org_id}", response_model=schemas.VirtualOrganizationWithStreams)
def get_virtual_organization(
    virtual_org_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    根据ID获取虚拟组织信息
    """
    virtual_org = db.query(models.VirtualOrganization).filter(models.VirtualOrganization.id == virtual_org_id).first()
    if not virtual_org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Virtual organization not found",
        )
    return virtual_org


@router.put("/{virtual_org_id}", response_model=schemas.VirtualOrganizationWithStreams)
def update_virtual_organization(
    virtual_org_id: int,
    virtual_org: schemas.VirtualOrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    更新虚拟组织信息
    """
    db_virtual_org = db.query(models.VirtualOrganization).filter(
        models.VirtualOrganization.id == virtual_org_id
    ).first()
    
    if not db_virtual_org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Virtual organization not found",
        )
    
    # 更新基本信息
    if virtual_org.name is not None:
        db_virtual_org.name = virtual_org.name
    if virtual_org.description is not None:
        db_virtual_org.description = virtual_org.description
    
    # 如果提供了视频流ID，更新关联
    if virtual_org.videostream_ids is not None:
        # 获取所有存在的视频流
        streams = db.query(models.VideoStream).filter(
            models.VideoStream.id.in_(virtual_org.videostream_ids)
        ).all()
        
        # 清除现有关联并添加新关联
        db_virtual_org.videostreams = streams
    
    db.commit()
    db.refresh(db_virtual_org)
    return db_virtual_org


@router.delete("/{virtual_org_id}", status_code=status.HTTP_200_OK, response_model=Dict[str, str])
def delete_virtual_organization(
    virtual_org_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    删除虚拟组织
    """
    db_virtual_org = db.query(models.VirtualOrganization).filter(
        models.VirtualOrganization.id == virtual_org_id
    ).first()
    
    if not db_virtual_org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Virtual organization not found",
        )
    
    # 删除关联关系（多对多关系表中的记录会自动删除）
    db.delete(db_virtual_org)
    db.commit()
    
    return {"message": "Virtual organization successfully deleted"}


@router.post("/{virtual_org_id}/streams", response_model=Dict[str, str])
def add_streams_to_virtual_org(
    virtual_org_id: int,
    streams_update: schemas.StreamsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    为虚拟组织添加视频流
    """
    db_virtual_org = db.query(models.VirtualOrganization).filter(
        models.VirtualOrganization.id == virtual_org_id
    ).first()
    
    if not db_virtual_org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Virtual organization not found",
        )
    
    # 获取所有存在的视频流
    streams = db.query(models.VideoStream).filter(
        models.VideoStream.id.in_(streams_update.videostream_ids)
    ).all()
    
    # 检查是否找到所有请求的视频流
    found_ids = [stream.id for stream in streams]
    not_found_ids = [id for id in streams_update.videostream_ids if id not in found_ids]
    
    if not_found_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video streams with IDs {not_found_ids} not found",
        )
    
    # 将现有的视频流与新的视频流合并
    current_stream_ids = [stream.id for stream in db_virtual_org.videostreams]
    new_streams = [stream for stream in streams if stream.id not in current_stream_ids]
    
    db_virtual_org.videostreams.extend(new_streams)
    db.commit()
    
    return {
        "message": f"Successfully added {len(new_streams)} video streams to virtual organization"
    }


@router.delete("/{virtual_org_id}/streams/{stream_id}", status_code=status.HTTP_200_OK, response_model=Dict[str, str])
def remove_stream_from_virtual_org(
    virtual_org_id: int,
    stream_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    从虚拟组织移除视频流
    """
    db_virtual_org = db.query(models.VirtualOrganization).filter(
        models.VirtualOrganization.id == virtual_org_id
    ).first()
    
    if not db_virtual_org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Virtual organization not found",
        )
    
    # 查找要移除的视频流
    stream = db.query(models.VideoStream).filter(models.VideoStream.id == stream_id).first()
    if not stream:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video stream not found",
        )
    
    # 检查视频流是否在虚拟组织中
    if stream not in db_virtual_org.videostreams:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Video stream not associated with this virtual organization",
        )
    
    # 移除关联
    db_virtual_org.videostreams.remove(stream)
    db.commit()
    
    return {"message": "Video stream successfully removed from virtual organization"} 