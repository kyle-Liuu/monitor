from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base

# 用户角色关联表
UserRole = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
)

# 角色表
class Role(Base):
    """角色表"""
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    role_code = Column(String(50), unique=True, nullable=False)
    role_name = Column(String(50), nullable=False)
    description = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    users = relationship("User", secondary=UserRole, back_populates="roles")
    
    def __repr__(self):
        return f"<Role {self.role_name}>"

# 用户表
class User(Base):
    """用户表"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(100), nullable=False)
    full_name = Column(String(100))
    phone = Column(String(20))
    gender = Column(Integer, default=1)  # 1:男 2:女
    avatar = Column(String(255))
    status = Column(Integer, default=1)  # 1:在线 2:离线 3:异常 4:注销
    last_login = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 关系
    roles = relationship("Role", secondary=UserRole, back_populates="users")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.username}>" 