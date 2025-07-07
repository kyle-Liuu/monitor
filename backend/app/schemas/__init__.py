# 导出所有用户相关模型
from app.schemas.user import (
    User, UserCreate, UserUpdate, UserInfo, UserInDB,
    LoginForm, Token, TokenPayload, LoginResponse,
    PaginatedUserList, Message,
    Role, RoleCreate, RoleUpdate, PaginatedRoleList,
    RefreshTokenRequest, RefreshTokenResponse,
    UserAvatarUpdate, PasswordChange
)

# 在此添加其他模型的导出... 

from app.schemas.organization import Organization, OrganizationCreate, OrganizationUpdate, OrganizationWithChildren
from app.schemas.virtual_organization import (
    VirtualOrganization, VirtualOrganizationCreate, 
    VirtualOrganizationUpdate, VirtualOrganizationWithStreams, StreamsUpdate
)
from app.schemas.videostream import (
    VideoStream, VideoStreamCreate, VideoStreamUpdate, 
    VideoStreamWithOrganization, VideoStreamStatus
)
from app.schemas.algorithm import (
    Algorithm, AlgorithmCreate, AlgorithmUpdate, AlgorithmUpload,
    AlgorithmTestResult, AlgorithmMetrics
)
from app.schemas.warning import (
    Warning, WarningCreate, WarningUpdate, WarningWithDetails,
    BatchProcessWarning, BatchProcessResult, WarningStats
)

# 用于导出所有模式
__all__ = [
    # 用户模式
    "User", "UserCreate", "UserUpdate", "UserInfo", "UserInDB",
    "LoginForm", "Token", "TokenPayload", "LoginResponse",
    "PaginatedUserList", "Message",
    "Role", "RoleCreate", "RoleUpdate", "PaginatedRoleList",
    "RefreshTokenRequest", "RefreshTokenResponse", "UserAvatarUpdate", "PasswordChange",
    # 组织模式
    "Organization", "OrganizationCreate", "OrganizationUpdate", "OrganizationWithChildren",
    # 虚拟组织模式
    "VirtualOrganization", "VirtualOrganizationCreate", "VirtualOrganizationUpdate", 
    "VirtualOrganizationWithStreams", "StreamsUpdate",
    # 视频流模式
    "VideoStream", "VideoStreamCreate", "VideoStreamUpdate", 
    "VideoStreamWithOrganization", "VideoStreamStatus",
    # 算法模式
    "Algorithm", "AlgorithmCreate", "AlgorithmUpdate", 
    "AlgorithmUpload", "AlgorithmTestResult", "AlgorithmMetrics",
    # 告警模式
    "Warning", "WarningCreate", "WarningUpdate", "WarningWithDetails",
    "BatchProcessWarning", "BatchProcessResult", "WarningStats"
] 