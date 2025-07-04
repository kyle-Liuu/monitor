# 导出用户模型
from app.models.user import User, Role, UserRole
from app.models.organization import Organization
from app.models.virtual_organization import VirtualOrganization, virtual_org_streams
from app.models.videostream import VideoStream
from app.models.algorithm import Algorithm
from app.models.warning import Warning
from app.models.monitor_task import MonitorTask

# 在此添加其他模型的导出... 

# 使所有模型在导入 models 包时可用
__all__ = [
    "User", 
    "Role",
    "UserRole",
    "Organization", 
    "VirtualOrganization", 
    "VideoStream", 
    "Algorithm", 
    "Warning", 
    "MonitorTask",
    "virtual_org_streams"
] 