from datetime import datetime, timedelta
from typing import Any
import json
from sqlalchemy.orm import Session
from sqlalchemy import or_

from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app import schemas, models
from app.api import deps
from app.core.config import settings
from app.core.security import authenticate_user, create_access_token, get_password_hash, redis_client
from app.utils.deps import get_db

router = APIRouter()


@router.post("/login", response_model=schemas.Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    使用OAuth2密码流获取JWT访问令牌
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    # 转换用户对象为字典，避免响应验证错误
    user_dict = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name or "",
        "phone": user.phone or "",
        "gender": user.gender or 1,
        "avatar": user.avatar or "",
        "status": user.status or "1",
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "roles": [{"role_code": role.role_code, "role_name": role.role_name} for role in user.roles]
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
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