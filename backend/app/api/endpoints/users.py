from typing import Any, List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
import json

from app import models, schemas
from app.api import deps
from app.core.security import get_password_hash, redis_client
from app.models.user import User

router = APIRouter()


@router.get("/info", response_model=schemas.UserInfo)
def get_user_info(
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取当前登录用户信息
    """
    # 使用ORM模式直接从模型创建响应对象
    return schemas.UserInfo.from_orm(current_user)


@router.get("/list", response_model=schemas.PaginatedUserList)
def get_user_list(
    db: Session = Depends(deps.get_db),
    current: int = Query(1, ge=1, description="当前页码"),
    size: int = Query(20, ge=1, le=100, description="每页记录数"),
    name: Optional[str] = Query(None, description="用户名搜索"),
    phone: Optional[str] = Query(None, description="手机号搜索"),
    status: Optional[int] = Query(None, description="用户状态"),
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    获取用户列表（需要管理员权限）
    """
    # 构建缓存键
    cache_key = f"user_list:{current}:{size}:{name}:{phone}:{status}"
    
    # 尝试从Redis缓存获取
    cached_result = None
    if redis_client:
        cached_result = redis_client.get(cache_key)
        if cached_result:
            return json.loads(cached_result)
    
    # 构建查询
    query = db.query(models.User)
    
    # 应用过滤条件
    if name:
        query = query.filter(
            or_(
                models.User.username.contains(name),
                models.User.full_name.contains(name)
            )
        )
    if phone:
        query = query.filter(models.User.phone.contains(phone))
    if status is not None:
        query = query.filter(models.User.status == status)
    
    # 计算总数
    total = query.count()
    
    # 分页查询
    users = query.offset((current - 1) * size).limit(size).all()
    
    # 为每个用户加载角色
    for user in users:
        user.userRoles = [role.role_code for role in user.roles]
    
    # 构建响应
    result = {
        "records": users,
        "current": current,
        "size": size,
        "total": total
    }
    
    # 缓存结果到Redis
    if redis_client:
        redis_client.set(cache_key, json.dumps(result), ex=300)  # 缓存5分钟
    
    return result


@router.post("/", response_model=schemas.User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    创建新用户（需要管理员权限）
    """
    # 检查用户名是否已存在
    user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在",
        )
    
    # 检查邮箱是否已存在
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已存在",
        )
    
    # 创建新用户
    db_user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone=user_in.phone,
        gender=user_in.gender,
        avatar=user_in.avatar,
        status=1,  # 在线
        is_active=user_in.is_active,
        is_superuser=user_in.is_superuser
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # 分配角色
    if user_in.roles:
        for role_code in user_in.roles:
            role = db.query(models.Role).filter(models.Role.role_code == role_code).first()
            if role:
                db_user.roles.append(role)
        db.commit()
        db.refresh(db_user)
    
    # 清除用户列表缓存
    if redis_client:
        # 清除所有以user_list:开头的缓存
        for key in redis_client.scan_iter("user_list:*"):
            redis_client.delete(key)
    
    # 获取用户角色
    db_user.userRoles = [role.role_code for role in db_user.roles]
    
    return db_user


@router.get("/{user_id}", response_model=schemas.User)
def get_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取指定用户的详细信息
    """
    # 普通用户只能查看自己的信息，管理员可以查看所有用户信息
    if not current_user.is_superuser and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    # 尝试从Redis缓存获取
    cached_user = None
    if redis_client:
        cached_user = redis_client.get(f"user:{user_id}")
        if cached_user:
            return json.loads(cached_user)
    
    # 从数据库获取用户
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 获取用户角色
    user.userRoles = [role.role_code for role in user.roles]
    
    # 缓存用户信息到Redis
    if redis_client:
        redis_client.set(f"user:{user_id}", user.json(), ex=3600)  # 缓存1小时
    
    return user


@router.put("/{user_id}", response_model=schemas.User)
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    更新用户信息
    """
    # 普通用户只能更新自己的信息，管理员可以更新所有用户信息
    if not current_user.is_superuser and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    
    # 获取用户
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 如果更新用户名或邮箱，需要检查是否已存在
    if (user_in.username and user_in.username != user.username) or (user_in.email and user_in.email != user.email):
        exists_user = db.query(models.User).filter(
            or_(
                models.User.username == user_in.username,
                models.User.email == user_in.email
            ),
            models.User.id != user_id
        ).first()
        if exists_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名或邮箱已存在"
            )
    
    # 更新用户信息
    update_data = user_in.dict(exclude_unset=True)
    
    # 如果更新密码，需要哈希处理
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    # 仅管理员可以更新用户活跃状态
    if "is_active" in update_data and not current_user.is_superuser:
        del update_data["is_active"]
    
    for key, value in update_data.items():
        if key != "roles" and hasattr(user, key):
            setattr(user, key, value)
    
    user.updated_at = datetime.now()
    db.commit()
    
    # 更新角色
    if current_user.is_superuser and user_in.roles is not None:
        # 清除现有角色
        user.roles = []
        db.flush()
        
        # 添加新角色
        for role_code in user_in.roles:
            role = db.query(models.Role).filter(models.Role.role_code == role_code).first()
            if role:
                user.roles.append(role)
        
        db.commit()
    
    db.refresh(user)
    
    # 获取用户角色
    user.userRoles = [role.role_code for role in user.roles]
    
    # 清除缓存
    if redis_client:
        redis_client.delete(f"user:{user_id}")
        # 清除所有以user_list:开头的缓存
        for key in redis_client.scan_iter("user_list:*"):
            redis_client.delete(key)
    
    return user


@router.delete("/{user_id}", response_model=schemas.Message)
def delete_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    删除用户（逻辑删除，需要管理员权限）
    """
    # 不能删除自己
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除自己"
        )
    
    # 获取用户
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 逻辑删除（将状态设置为注销）
    user.status = 4  # 注销
    user.is_active = False
    user.updated_at = datetime.now()
    db.add(user)
    db.commit()
    
    # 清除用户缓存
    if redis_client:
        redis_client.delete(f"user:{user_id}")
        # 清除所有以user_list:开头的缓存
        for key in redis_client.scan_iter("user_list:*"):
            redis_client.delete(key)
    
    return {"message": "用户已删除"}


@router.get("/", response_model=List[schemas.User])
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    获取用户列表，仅限管理员访问
    """
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users


@router.put("/info", response_model=schemas.User)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    更新当前登录用户信息
    """
    if user_in.email and user_in.email != current_user.email:
        # 检查邮箱是否已被其他用户使用
        user = db.query(User).filter(User.email == user_in.email).first()
        if user and user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被使用",
            )
    
    # 更新用户信息
    for key, value in user_in.dict(exclude_unset=True).items():
        if key == "password" and value:
            setattr(current_user, "hashed_password", get_password_hash(value))
        elif hasattr(current_user, key) and key != "id" and value is not None:
            setattr(current_user, key, value)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=schemas.User)
def read_user_by_id(
    user_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    根据用户ID获取用户信息
    """
    # 只有超级管理员可以获取其他用户的信息
    if user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问其他用户信息",
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在",
        )
    return user


@router.delete("/{user_id}", response_model=schemas.User)
def permanently_delete_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    永久删除用户，仅限管理员访问
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在",
        )
    
    # 不能删除自己
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除当前登录用户",
        )
    
    # 删除用户
    db.delete(user)
    db.commit()
    return user