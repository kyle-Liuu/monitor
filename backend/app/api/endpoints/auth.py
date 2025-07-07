from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
import json
from sqlalchemy.orm import Session
from sqlalchemy import or_

from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app import schemas, models
from app.api import deps
from app.core.config import settings
from app.core.security import authenticate_user, create_access_token, create_refresh_token, get_password_hash, redis_client, verify_refresh_token
from app.utils.deps import get_db
from app.models.refresh_token import RefreshToken

router = APIRouter()


@router.post("/login", response_model=schemas.LoginResponse)
def login_access_token(
    db: Session = Depends(get_db), form_data: schemas.LoginForm = Body(...)
) -> Any:
    """
    登录接口，获取JWT访问令牌和刷新令牌
    
    Args:
        db: 数据库会话
        form_data: 登录表单数据
        
    Returns:
        包含访问令牌、刷新令牌和用户信息的响应
    """
    # 使用username字段进行认证
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 创建访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    # 创建刷新令牌
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(
        subject=user.id, expires_delta=refresh_token_expires
    )
    
    # 保存刷新令牌到数据库
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=datetime.utcnow() + refresh_token_expires
    )
    db.add(db_refresh_token)
    db.commit()
    
    # 更新用户最后登录时间
    user.last_login = datetime.utcnow()
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # 转换用户对象为字典，避免响应验证错误
    user_dict = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name or "",
        "phone": user.phone or "",
        "gender": user.gender or 1,
        "avatar": user.avatar or "",
        "status": int(user.status) if user.status else 1,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "roles": [{"role_code": role.role_code, "role_name": role.role_name} for role in user.roles]
    }
    
    return {
        "token": access_token,  # 适配前端命名方式
        "refreshToken": refresh_token,  # 适配前端命名方式
        "user_info": user_dict
    }


@router.post("/token", response_model=schemas.Token)
def login_for_swagger(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 兼容的令牌登录，用于Swagger UI认证
    
    Args:
        db: 数据库会话
        form_data: OAuth2表单数据
        
    Returns:
        包含访问令牌的响应
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    # 创建刷新令牌
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(
        subject=user.id, expires_delta=refresh_token_expires
    )
    
    # 保存刷新令牌到数据库
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=datetime.utcnow() + refresh_token_expires
    )
    db.add(db_refresh_token)
    db.commit()
    
    # 更新用户最后登录时间
    user.last_login = datetime.utcnow()
    db.add(user)
    db.commit()
    
    # 转换用户对象为字典
    user_dict = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser
    }
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_dict
    }


@router.post("/refresh", response_model=schemas.RefreshTokenResponse)
def refresh_access_token(
    db: Session = Depends(get_db), 
    refresh_request: schemas.RefreshTokenRequest = Body(...)
) -> Any:
    """
    使用刷新令牌获取新的访问令牌
    
    Args:
        db: 数据库会话
        refresh_request: 刷新令牌请求
        
    Returns:
        包含新访问令牌和新刷新令牌的响应
    """
    # 验证刷新令牌
    payload = verify_refresh_token(refresh_request.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 获取用户ID
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="令牌中无用户标识",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 查询数据库中的刷新令牌
    db_refresh_token = db.query(RefreshToken).filter(
        RefreshToken.user_id == int(user_id),
        RefreshToken.token == refresh_request.refresh_token,
        RefreshToken.expires_at > datetime.utcnow()
    ).first()
    
    if not db_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="刷新令牌已过期或不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 查询用户
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在或已禁用",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 创建新的访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    # 创建新的刷新令牌（令牌轮换增加安全性）
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    new_refresh_token = create_refresh_token(
        subject=user.id, expires_delta=refresh_token_expires
    )
    
    # 更新数据库中的刷新令牌
    db_refresh_token.token = new_refresh_token
    db_refresh_token.expires_at = datetime.utcnow() + refresh_token_expires
    db_refresh_token.updated_at = datetime.utcnow()
    db.add(db_refresh_token)
    db.commit()
    
    return {
        "token": new_access_token,
        "refreshToken": new_refresh_token
    }


@router.post("/register", response_model=schemas.User)
def register_user(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """
    创建新用户
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
    user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone=user_in.phone,
        gender=user_in.gender,
        is_active=user_in.is_active,
        is_superuser=user_in.is_superuser
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user