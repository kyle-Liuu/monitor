from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.utils.deps import get_db, get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[schemas.OrganizationWithChildren])
def get_organizations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    获取所有组织列表，按树形结构返回
    """
    # 获取所有根组织（没有父级）
    root_orgs = db.query(models.Organization).filter(models.Organization.parent_id.is_(None)).all()
    
    # 递归构建树形结构
    def build_org_tree(org):
        children = db.query(models.Organization).filter(models.Organization.parent_id == org.id).all()
        org_dict = schemas.OrganizationWithChildren.from_orm(org)
        org_dict.children = [build_org_tree(child) for child in children]
        return org_dict
    
    return [build_org_tree(org) for org in root_orgs]


@router.post("/", response_model=schemas.Organization, status_code=status.HTTP_201_CREATED)
def create_organization(
    organization: schemas.OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    创建新组织
    """
    # 如果指定了父组织，检查是否存在
    if organization.parent_id:
        parent = db.query(models.Organization).filter(models.Organization.id == organization.parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent organization not found",
            )
    
    db_org = models.Organization(**organization.dict())
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    return db_org


@router.get("/{org_id}", response_model=schemas.Organization)
def get_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    根据ID获取组织信息
    """
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    return org


@router.put("/{org_id}", response_model=schemas.Organization)
def update_organization(
    org_id: int,
    organization: schemas.OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    更新组织信息
    """
    db_org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not db_org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    # 检查更新的父组织是否存在，并避免循环引用
    if organization.parent_id and organization.parent_id != db_org.parent_id:
        if organization.parent_id == org_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization cannot be its own parent",
            )
        
        parent = db.query(models.Organization).filter(models.Organization.id == organization.parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent organization not found",
            )
    
    # 更新数据
    update_data = organization.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_org, key, value)
    
    db.commit()
    db.refresh(db_org)
    return db_org


@router.delete("/{org_id}", status_code=status.HTTP_200_OK)
def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    删除组织
    """
    # 检查是否有子组织
    has_children = db.query(models.Organization).filter(models.Organization.parent_id == org_id).first()
    if has_children:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete organization with children. Remove children first.",
        )
    
    # 检查是否有关联的视频流
    has_videostreams = db.query(models.VideoStream).filter(models.VideoStream.organization_id == org_id).first()
    if has_videostreams:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete organization with associated video streams. Remove associations first.",
        )
    
    db_org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not db_org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    
    db.delete(db_org)
    db.commit()
    
    return {"message": "Organization successfully deleted"} 