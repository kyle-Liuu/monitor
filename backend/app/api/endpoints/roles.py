from typing import Any, List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.core.security import redis_client
from app.models.user import Role
from app.utils.deps import get_current_active_superuser, get_current_active_user, get_db

router = APIRouter()


@router.get("/", response_model=List[schemas.Role])
def read_roles(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: schemas.User = Depends(get_current_active_user),
) -> Any:
    """
    获取角色列表
    """
    roles = db.query(Role).offset(skip).limit(limit).all()
    return roles


@router.post("/", response_model=schemas.Role)
def create_role(
    *,
    db: Session = Depends(get_db),
    role_in: schemas.RoleCreate,
    current_user: schemas.User = Depends(get_current_active_superuser),
) -> Any:
    """
    创建新角色，仅限管理员访问
    """
    # 检查角色代码是否已存在
    role = db.query(Role).filter(Role.role_code == role_in.role_code).first()
    if role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="角色代码已存在",
        )
    
    # 创建新角色
    role = Role(**role_in.dict())
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.get("/{role_id}", response_model=schemas.Role)
def read_role(
    *,
    db: Session = Depends(get_db),
    role_id: int,
    current_user: schemas.User = Depends(get_current_active_user),
) -> Any:
    """
    根据ID获取角色
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="角色不存在",
        )
    return role


@router.put("/{role_id}", response_model=schemas.Role)
def update_role(
    *,
    db: Session = Depends(get_db),
    role_id: int,
    role_in: schemas.RoleUpdate,
    current_user: schemas.User = Depends(get_current_active_superuser),
) -> Any:
    """
    更新角色，仅限管理员访问
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="角色不存在",
        )
    
    # 更新角色信息
    for key, value in role_in.dict(exclude_unset=True).items():
        if hasattr(role, key) and value is not None:
            setattr(role, key, value)
    
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.delete("/{role_id}", response_model=schemas.Role)
def delete_role(
    *,
    db: Session = Depends(get_db),
    role_id: int,
    current_user: schemas.User = Depends(get_current_active_superuser),
) -> Any:
    """
    删除角色，仅限管理员访问
    """
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="角色不存在",
        )
    
    # 检查是否有用户正在使用该角色
    if role.users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="角色正在被使用，无法删除",
        )
    
    # 删除角色
    db.delete(role)
    db.commit()
    return role 