from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class OrganizationBase(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    contact: Optional[str] = None
    contact_phone: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    parent_id: Optional[int] = None


class OrganizationUpdate(OrganizationBase):
    name: Optional[str] = None
    parent_id: Optional[int] = None


class OrganizationInDBBase(OrganizationBase):
    id: int
    org_id: str
    parent_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# 用于返回给API的模型
class Organization(OrganizationInDBBase):
    pass


# 包含子组织的模型
class OrganizationWithChildren(Organization):
    children: List["OrganizationWithChildren"] = []


# 解决循环引用问题
OrganizationWithChildren.update_forward_refs() 