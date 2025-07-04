from typing import Generator, Optional
import json
from datetime import datetime

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User
from app.schemas.user import TokenPayload
from app.core.config import settings
from app.core.security import decode_token, redis_client, verify_password

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def get_db() -> Generator:
    """
    获取数据库会话依赖
    
    Yields:
        数据库会话对象
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user_from_token(token: str) -> Optional[User]:
    """
    从令牌获取当前用户（供WebSocket使用的异步版本）
    
    Args:
        token: JWT令牌
        
    Returns:
        当前认证用户对象，如果认证失败则返回None
        
    Raises:
        Exception: 认证过程中发生的异常
    """
    try:
        # 解码JWT
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        
        # 验证令牌数据
        token_data = TokenPayload(user_id=int(user_id))
        
        # 从数据库获取用户
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == token_data.user_id).first()
            if user is None or not user.is_active:
                return None
            return user
        finally:
            db.close()
            
    except (JWTError, ValidationError) as e:
        raise Exception(f"Token validation error: {str(e)}")
    except Exception as e:
        raise Exception(f"Authentication error: {str(e)}")


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """
    获取当前认证用户
    
    Args:
        db: 数据库会话
        token: JWT令牌
        
    Returns:
        当前认证用户对象
        
    Raises:
        HTTPException: 认证失败时抛出
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # 解码JWT
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        # 验证令牌数据
        token_data = TokenPayload(user_id=int(user_id))
    except (JWTError, ValidationError):
        raise credentials_exception
    
    # 从数据库获取用户
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    获取当前活跃用户
    
    Args:
        current_user: 当前认证用户
        
    Returns:
        当前活跃用户对象
        
    Raises:
        HTTPException: 用户不活跃时抛出
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="用户未激活"
        )
    return current_user


def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    获取当前活跃的超级管理员用户
    
    Args:
        current_user: 当前活跃用户
        
    Returns:
        当前超级管理员用户对象
        
    Raises:
        HTTPException: 用户不是超级管理员时抛出
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="权限不足，需要超级管理员权限"
        )
    return current_user


def get_current_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    获取当前管理员用户
    
    Args:
        current_user: 当前活跃用户
        
    Returns:
        当前管理员用户对象
        
    Raises:
        HTTPException: 用户不是管理员时抛出
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="权限不足"
        )
    return current_user


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """
    验证用户名和密码
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user 