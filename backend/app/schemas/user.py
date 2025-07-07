from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, validator


class UserBase(BaseModel):
    """用户基础信息模型"""
    user_id: Optional[str] = None
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[int] = 1
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False
    description: Optional[str] = None
    tags: Optional[List[str]] = []


class UserCreate(UserBase):
    """创建用户的请求模型"""
    password: str
    avatar: Optional[str] = "/uploads/avatars/default/default.jpeg"
    roles: Optional[List[str]] = None

    @validator("password")
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("密码长度不能少于8位")
        return v


class UserUpdate(BaseModel):
    """更新用户的请求模型"""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[int] = None
    status: Optional[int] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    password: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    roles: Optional[List[str]] = None

    @validator("password")
    def password_min_length(cls, v):
        if v is not None and len(v) < 8:
            raise ValueError("密码长度不能少于8位")
        return v


class UserAvatarUpdate(BaseModel):
    """更新用户头像的请求模型"""
    avatar: str


class RoleBase(BaseModel):
    """角色基础模型"""
    role_code: str
    role_name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    """创建角色模型"""
    pass


class RoleUpdate(BaseModel):
    """更新角色模型"""
    role_name: Optional[str] = None
    description: Optional[str] = None


class RoleInDB(RoleBase):
    """数据库角色模型"""
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class Role(RoleInDB):
    """角色响应模型"""
    pass


class UserInDB(UserBase):
    """数据库中的用户模型"""
    id: int
    user_id: str
    avatar: Optional[str] = None
    status: Optional[int] = 1
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    hashed_password: str
    roles: List[Role] = []

    class Config:
        orm_mode = True


class User(BaseModel):
    """API响应中的用户模型"""
    user_id: str
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[int] = 1
    avatar: Optional[str] = None
    status: Optional[int] = 1
    is_active: bool
    is_superuser: bool
    description: Optional[str] = None
    tags: Optional[List[str]] = []
    created_at: datetime
    updated_at: datetime
    roles: List[Role] = []

    class Config:
        orm_mode = True


class UserInfo(User):
    """用户详细信息模型"""
    pass


class LoginForm(BaseModel):
    """登录表单模型 - 适配前端格式"""
    username: str  # 将userName改为username
    password: str


class Token(BaseModel):
    """JWT Token模型"""
    access_token: str
    refresh_token: str  # 添加刷新令牌字段
    token_type: str
    user: dict


class TokenPayload(BaseModel):
    """JWT Token载荷模型"""
    sub: str  # 用户ID
    exp: int  # 过期时间
    type: Optional[str] = "access"  # 令牌类型：access 或 refresh


class LoginResponse(BaseModel):
    """登录响应模型（与前端对齐）"""
    token: str
    refreshToken: str  # 适配前端命名方式
    user_info: dict


class RefreshTokenRequest(BaseModel):
    """刷新令牌请求模型"""
    refresh_token: str = Field(..., description="刷新令牌")


class RefreshTokenResponse(BaseModel):
    """刷新令牌响应模型（与前端对齐）"""
    token: str
    refreshToken: str


class PaginatedUserList(BaseModel):
    """分页用户列表响应模型"""
    records: List[User]
    current: int
    size: int
    total: int


class Message(BaseModel):
    """通用消息响应模型"""
    message: str


class PaginatedRoleList(BaseModel):
    """分页角色列表响应模型"""
    records: List[Role]
    current: int
    size: int
    total: int


class PasswordChange(BaseModel):
    """修改密码请求模型"""
    current_password: str
    new_password: str

    @validator("new_password")
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("密码长度不能少于8位")
        return v