from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.api.deps import get_db, get_current_user
from app.services.algorithm_service import AlgorithmService

router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
async def get_algorithms(
    current: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    获取算法列表
    """
    skip = (current - 1) * size
    algorithms = await AlgorithmService.get_algorithms(
        db=db, 
        skip=skip, 
        limit=size, 
        type=type, 
        is_active=is_active
    )
    total = len(await AlgorithmService.get_algorithms(db, type=type, is_active=is_active))
    
    return {
        "items": algorithms,
        "current": current,
        "size": size,
        "total": total
    }

@router.get("/{algorithm_id}", response_model=schemas.Algorithm)
async def get_algorithm(
    algorithm_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    获取算法详情
    """
    algorithm = await AlgorithmService.get_algorithm(db, algorithm_id)
    if algorithm is None:
        raise HTTPException(status_code=404, detail="算法不存在")
    return algorithm

@router.post("/", response_model=schemas.Algorithm)
async def create_algorithm(
    algorithm: schemas.AlgorithmCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    创建算法
    """
    return await AlgorithmService.create_algorithm(db, algorithm)

@router.put("/{algorithm_id}", response_model=schemas.Algorithm)
async def update_algorithm(
    algorithm_id: int,
    algorithm: schemas.AlgorithmUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    更新算法
    """
    updated_algorithm = await AlgorithmService.update_algorithm(db, algorithm_id, algorithm)
    if updated_algorithm is None:
        raise HTTPException(status_code=404, detail="算法不存在")
    return updated_algorithm

@router.delete("/{algorithm_id}", response_model=Dict[str, str])
async def delete_algorithm(
    algorithm_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    删除算法
    """
    deleted = await AlgorithmService.delete_algorithm(db, algorithm_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="算法不存在")
    return {"message": "算法已成功删除"}

@router.post("/upload-model", response_model=Dict[str, Any])
async def upload_algorithm_model(
    algorithm_id: int = Form(...),
    model_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    上传算法模型
    """
    return await AlgorithmService.upload_model(db, algorithm_id, model_file)

@router.post("/{algorithm_id}/test", response_model=Dict[str, Any])
async def test_algorithm(
    algorithm_id: int,
    test_image: UploadFile = File(...),
    config_override: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    测试算法
    """
    return await AlgorithmService.test_algorithm(db, algorithm_id, test_image, config_override)