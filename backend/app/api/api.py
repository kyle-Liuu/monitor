from fastapi import APIRouter

from app.api.endpoints import auth, users, roles, organizations, virtual_organizations, videostreams, algorithms, warnings, websocket, monitor
from app.api.endpoints import uploads  # 添加上传模块

# 创建API路由器
api_router = APIRouter()

# 认证相关路由
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# 用户和角色管理路由
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])

# 组织和虚拟组织管理路由
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(virtual_organizations.router, prefix="/virtualorganizations", tags=["virtual_organizations"])

# 视频流管理路由
api_router.include_router(videostreams.router, prefix="/videostreams", tags=["videostreams"])

# 算法管理路由
api_router.include_router(algorithms.router, prefix="/algorithms", tags=["algorithms"])

# 告警管理路由
api_router.include_router(warnings.router, prefix="/warnings", tags=["warnings"])

# 监控任务路由
api_router.include_router(monitor.router, prefix="/monitor", tags=["monitor"])

# 文件上传路由
api_router.include_router(uploads.router, prefix="/uploads", tags=["upload"])

# WebSocket路由 - 这些路由不会在Swagger UI中显示，因为它们是WebSocket端点
api_router.include_router(websocket.router, tags=["websocket"])

# 注意：所有路由已经注册，如需进行更新，请直接修改上述注册代码