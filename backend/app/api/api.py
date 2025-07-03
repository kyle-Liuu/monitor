from fastapi import APIRouter

from app.api.endpoints import auth, users, roles, organizations, virtual_organizations, videostreams, algorithms, warnings, websocket, monitor

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

# WebSocket路由
api_router.include_router(websocket.router, tags=["websocket"])

# 以下是未实现的路由，可以按需解开注释
# api_router.include_router(algorithms.router, prefix="/algorithms", tags=["算法"])
# api_router.include_router(videostreams.router, prefix="/videostreams", tags=["视频流"])
# api_router.include_router(organizations.router, prefix="/organizations", tags=["组织"])
# api_router.include_router(virtual_orgs.router, prefix="/virtualorganizations", tags=["虚拟组织"])
# api_router.include_router(warnings.router, prefix="/warnings", tags=["告警"])
# api_router.include_router(repository.router, prefix="/repository", tags=["资源库"]) 