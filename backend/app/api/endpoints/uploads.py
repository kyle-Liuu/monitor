import os
import shutil
import logging
from pathlib import Path
from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps

logger = logging.getLogger(__name__)

router = APIRouter()

# 确保上传目录存在
UPLOADS_DIR = Path("uploads")
AVATARS_DIR = UPLOADS_DIR / "avatars"
AVATARS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/avatar", status_code=status.HTTP_200_OK)
async def upload_avatar(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    file: UploadFile = File(...),
    userId: str = Form(...),
) -> Any:
    """
    上传用户头像
    
    参数:
    - file: 头像文件
    - userId: 用户ID
    
    返回:
    - 成功响应：包含头像路径的JSON对象
    """
    try:
        # 检查文件类型
        content_type = file.content_type
        if not content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="只允许上传图片文件"
            )
        
        # 检查用户ID是否存在
        user = db.query(models.User).filter(models.User.user_id == userId).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"用户ID {userId} 不存在"
            )
        
        # 普通用户只能上传自己的头像，管理员可以上传任何用户的头像
        if not current_user.is_superuser and current_user.user_id != userId:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="没有权限上传其他用户的头像"
            )
        
        # 创建用户头像目录
        user_avatar_dir = AVATARS_DIR / userId
        user_avatar_dir.mkdir(exist_ok=True)
        
        # 使用用户ID作为文件名
        file_extension = os.path.splitext(file.filename)[1].lower()
        filename = f"{userId}{file_extension}"
        file_path = user_avatar_dir / filename
        
        # 如果已存在同名文件，先删除
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # 保存文件
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 生成相对路径 (用于返回给前端)
        relative_path = f"/uploads/avatars/{userId}/{filename}"
        
        # 注意：这里不再更新用户头像路径，需要前端调用单独的API更新用户信息
        
        return {
            "code": 0,
            "message": "头像上传成功",
            "data": {
                "avatarPath": relative_path
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"上传头像时发生错误: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"上传头像失败: {str(e)}"
        ) 