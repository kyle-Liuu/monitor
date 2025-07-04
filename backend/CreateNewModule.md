# 创建新模块指南

## 数据库表创建流程

系统使用SQLAlchemy ORM框架管理数据库模型和表结构。`init_db.py`能够创建多张表是因为它使用了以下机制:

```python
base.Base.metadata.create_all(bind=engine)
```

这行代码会创建所有继承自Base的模型类对应的表。系统通过以下步骤创建表:

1. 在`app.db.base`中导入所有模型类
2. 执行`create_all`方法自动创建数据库表结构

## 创建新表的具体步骤

要在数据库中新建一张表，请按照以下步骤操作:

### 1. 创建模型文件

在`app/models/`目录下创建新的模型文件，例如`new_table.py`，定义模型类继承自Base基类：

```python
from sqlalchemy import Column, Integer, String, DateTime, func
from app.db.base_class import Base

class NewTable(Base):
    __tablename__ = "new_table"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255))
    created_at = Column(DateTime, default=func.now())
    # 添加其他需要的字段
```

### 2. 更新模型导入

将新模型导入到`app/models/__init__.py`中:

```python
from .new_table import NewTable
```

### 3. 确保模型被加载

检查`app/db/base.py`文件，确保它导入了新模型或导入了整个models模块。通常它会有类似以下的导入:

```python
from app.db.base_class import Base
from app.models import User, Role, UserRole, ... # 确保这里导入了所有模型，或者直接导入整个models模块
```

### 4. 创建数据库表

运行初始化脚本创建表:

```bash
python -m app.db.init_db
```

这样新表就会随其他表一起被创建。

### 5. 单独创建表（可选）

如果只想创建这一张表而不影响其他表，可以使用:

```python
from app.db.session import engine
from app.models.new_table import NewTable

NewTable.__table__.create(bind=engine)
```

## 完整功能开发流程

以下是从零开始开发一个完整功能模块的详细步骤，涵盖从数据库设计到前端实现的全过程：

### 第1步：需求分析和数据模型设计

1. **明确功能需求**：确定功能的核心业务逻辑、数据结构和用户交互流程
2. **设计数据模型**：确定需要哪些数据表、字段和它们之间的关系
3. **设计API接口**：规划需要哪些API端点，以及它们的请求和响应格式

### 第2步：创建数据库模型 (Backend)

1. 在`app/models/`目录下创建新的模型文件（如`feature.py`）
2. 定义SQLAlchemy模型类，设置字段和关系
3. 在`app/models/__init__.py`中导入并导出新模型
4. 确保`app/db/base.py`中导入了新模型
5. 运行数据库初始化脚本创建表结构

### 第3步：创建Pydantic模式 (Backend)

1. 在`app/schemas/`目录下创建新的模式文件（如`feature.py`）
2. 定义数据验证和序列化的Pydantic模型：
   - Base类：基础字段
   - Create类：创建对象所需字段
   - Update类：更新对象所需字段（通常是可选的）
   - Response类：API响应的字段
3. 在`app/schemas/__init__.py`中导入并导出这些模式类

### 第4步：创建服务层 (Backend)

1. 在`app/services/`目录下创建服务文件（如`feature_service.py`）
2. 实现CRUD操作和业务逻辑的服务函数：
   - create_feature：创建新记录
   - get_feature：获取单个记录
   - get_features：获取记录列表（可能带分页和过滤）
   - update_feature：更新记录
   - delete_feature：删除记录
   - 其他业务逻辑函数

### 第5步：创建API端点 (Backend)

1. 在`app/api/endpoints/`目录下创建API文件（如`features.py`）
2. 定义API路由和处理函数：
   - POST：创建资源
   - GET：获取单个或多个资源
   - PUT/PATCH：更新资源
   - DELETE：删除资源
3. 在`app/api/api.py`中导入和注册新的路由

### 第6步：测试后端API (Backend)

1. 使用Swagger/OpenAPI文档测试API
2. 使用Postman或类似工具测试各个端点
3. 修复发现的任何问题

### 第7步：创建前端组件 (Frontend)

1. 在`src/api/`目录下创建API调用函数（如`featureApi.ts`）
2. 在`src/views/`目录下创建功能页面组件：
   - 列表页面：显示数据表格
   - 详情页面：显示详细信息
   - 表单页面：用于创建和编辑
3. 实现前端路由，在`src/router/routes/`下添加新路由

### 第8步：实现前端逻辑 (Frontend)

1. 实现数据获取和提交逻辑
2. 实现表单验证
3. 实现状态管理（如需要）
4. 实现用户交互和UI组件

### 第9步：集成和测试 (Integration)

1. 测试前后端交互
2. 验证数据流程
3. 验证错误处理
4. 优化用户体验

### 第10步：部署和文档 (Deployment)

1. 更新API文档
2. 更新数据库迁移脚本（如有必要）
3. 部署更新

## 实例：组织管理功能开发流程

下面以组织管理功能为例，演示完整的开发流程：

### 1. 需求分析和数据模型设计

**功能需求**:

- 创建、查看、更新和删除组织
- 组织可以有层级结构（父子关系）
- 每个组织有名称、描述、地址和联系人信息
- 组织可以关联视频流

**数据模型设计**:

- 组织表：id、名称、父组织ID、描述、地址、联系人、联系电话、创建时间、更新时间
- 与视频流表的一对多关系

### 2. 创建数据库模型

**创建`app/models/organization.py`**:

```python
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.db.base import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    parent_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    description = Column(Text, nullable=True)
    address = Column(String(200), nullable=True)
    contact = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # 自引用关系
    parent = relationship("Organization", remote_side=[id], backref="children")
    # 反向关系
    videostreams = relationship("VideoStream", back_populates="organization")
```

**更新`app/models/__init__.py`**:

```python
# 添加导入
from .organization import Organization

# 更新__all__列表
__all__ = [
    # ...其他模型
    "Organization",
]
```

### 3. 创建Pydantic模式

**创建`app/schemas/organization.py`**:

```python
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

# 基础模型
class OrganizationBase(BaseModel):
    name: str
    parent_id: Optional[int] = None
    description: Optional[str] = None
    address: Optional[str] = None
    contact: Optional[str] = None
    contact_phone: Optional[str] = None

# 创建请求模型
class OrganizationCreate(OrganizationBase):
    pass

# 更新请求模型
class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None
    description: Optional[str] = None
    address: Optional[str] = None
    contact: Optional[str] = None
    contact_phone: Optional[str] = None

# 数据库模型
class OrganizationInDB(OrganizationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# API响应模型
class Organization(OrganizationInDB):
    children: Optional[List["Organization"]] = []

    class Config:
        orm_mode = True

# 树形结构模型
class OrganizationTree(BaseModel):
    id: int
    name: str
    children: Optional[List["OrganizationTree"]] = []

    class Config:
        orm_mode = True

# 分页模型
class PaginatedOrganizationList(BaseModel):
    records: List[Organization]
    current: int
    size: int
    total: int
```

**更新`app/schemas/__init__.py`**:

```python
# 添加导入
from .organization import (
    OrganizationBase,
    OrganizationCreate,
    OrganizationUpdate,
    Organization,
    OrganizationTree,
    PaginatedOrganizationList
)

# 导出模型
__all__ = [
    # ...其他模式
    "OrganizationBase",
    "OrganizationCreate",
    "OrganizationUpdate",
    "Organization",
    "OrganizationTree",
    "PaginatedOrganizationList",
]
```

### 4. 创建服务层

**创建`app/services/organization_service.py`**:

```python
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate, OrganizationUpdate


def get_organization(db: Session, organization_id: int) -> Optional[Organization]:
    """获取单个组织"""
    return db.query(Organization).filter(Organization.id == organization_id).first()


def get_organizations(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    name: Optional[str] = None
) -> Dict[str, Any]:
    """获取组织列表（分页）"""
    query = db.query(Organization)

    # 应用过滤条件
    if name:
        query = query.filter(Organization.name.contains(name))

    # 计算总数
    total = query.count()

    # 获取分页数据
    organizations = query.offset(skip).limit(limit).all()

    return {
        "records": organizations,
        "current": skip // limit + 1,
        "size": limit,
        "total": total
    }


def get_organization_tree(db: Session) -> List[Organization]:
    """获取组织树结构"""
    # 只获取顶级组织（没有父组织的）
    return db.query(Organization).filter(Organization.parent_id == None).all()


def create_organization(db: Session, organization_in: OrganizationCreate) -> Organization:
    """创建新组织"""
    db_organization = Organization(
        name=organization_in.name,
        parent_id=organization_in.parent_id,
        description=organization_in.description,
        address=organization_in.address,
        contact=organization_in.contact,
        contact_phone=organization_in.contact_phone
    )
    db.add(db_organization)
    db.commit()
    db.refresh(db_organization)
    return db_organization


def update_organization(
    db: Session,
    organization: Organization,
    organization_in: OrganizationUpdate
) -> Organization:
    """更新组织信息"""
    # 将更新的数据转换为字典
    update_data = organization_in.dict(exclude_unset=True)

    # 更新字段
    for field, value in update_data.items():
        setattr(organization, field, value)

    db.add(organization)
    db.commit()
    db.refresh(organization)
    return organization


def delete_organization(db: Session, organization: Organization) -> None:
    """删除组织"""
    db.delete(organization)
    db.commit()
```

### 5. 创建API端点

**创建`app/api/endpoints/organizations.py`**:

```python
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.services import organization_service

router = APIRouter()


@router.get("/", response_model=schemas.PaginatedOrganizationList)
def get_organizations(
    db: Session = Depends(deps.get_db),
    current: int = Query(1, ge=1, description="当前页码"),
    size: int = Query(20, ge=1, le=100, description="每页记录数"),
    name: Optional[str] = Query(None, description="组织名称搜索"),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取组织列表
    """
    skip = (current - 1) * size
    return organization_service.get_organizations(db, skip=skip, limit=size, name=name)


@router.get("/tree", response_model=List[schemas.OrganizationTree])
def get_organization_tree(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取组织树结构
    """
    return organization_service.get_organization_tree(db)


@router.get("/{organization_id}", response_model=schemas.Organization)
def get_organization(
    organization_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取单个组织详情
    """
    organization = organization_service.get_organization(db, organization_id=organization_id)
    if not organization:
        raise HTTPException(status_code=404, detail="组织不存在")
    return organization


@router.post("/", response_model=schemas.Organization)
def create_organization(
    *,
    db: Session = Depends(deps.get_db),
    organization_in: schemas.OrganizationCreate,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    创建新组织（需要管理员权限）
    """
    return organization_service.create_organization(db=db, organization_in=organization_in)


@router.put("/{organization_id}", response_model=schemas.Organization)
def update_organization(
    *,
    db: Session = Depends(deps.get_db),
    organization_id: int,
    organization_in: schemas.OrganizationUpdate,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    更新组织信息（需要管理员权限）
    """
    organization = organization_service.get_organization(db, organization_id=organization_id)
    if not organization:
        raise HTTPException(status_code=404, detail="组织不存在")
    return organization_service.update_organization(
        db=db, organization=organization, organization_in=organization_in
    )


@router.delete("/{organization_id}", response_model=schemas.Message)
def delete_organization(
    *,
    db: Session = Depends(deps.get_db),
    organization_id: int,
    current_user: models.User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    删除组织（需要管理员权限）
    """
    organization = organization_service.get_organization(db, organization_id=organization_id)
    if not organization:
        raise HTTPException(status_code=404, detail="组织不存在")
    organization_service.delete_organization(db=db, organization=organization)
    return {"message": "组织已成功删除"}
```

**更新`app/api/api.py`**:

```python
from fastapi import APIRouter

from app.api.endpoints import (
    users, auth, algorithms,
    videostreams, monitor_tasks, warnings,
    organizations  # 新增组织模块
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(users.router, prefix="/users", tags=["用户管理"])
api_router.include_router(algorithms.router, prefix="/algorithms", tags=["算法管理"])
api_router.include_router(videostreams.router, prefix="/videostreams", tags=["视频流管理"])
api_router.include_router(monitor_tasks.router, prefix="/monitor_tasks", tags=["监控任务"])
api_router.include_router(warnings.router, prefix="/warnings", tags=["预警管理"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["组织管理"])  # 新增组织路由
```

### 6. 前端API调用

**创建`src/api/organizationApi.ts`**:

```typescript
import http from '@/utils/http'
import { Organization, OrganizationTree } from '@/types/api'

const BASE_URL = '/organizations'

// 获取组织分页列表
export const getOrganizationList = async (params: {
  current: number
  size: number
  name?: string
}) => {
  return await http.get(BASE_URL, { params })
}

// 获取组织树
export const getOrganizationTree = async () => {
  return await http.get<OrganizationTree[]>(`${BASE_URL}/tree`)
}

// 获取单个组织
export const getOrganization = async (id: number) => {
  return await http.get<Organization>(`${BASE_URL}/${id}`)
}

// 创建组织
export const createOrganization = async (
  data: Omit<Organization, 'id' | 'created_at' | 'updated_at' | 'children'>
) => {
  return await http.post<Organization>(BASE_URL, data)
}

// 更新组织
export const updateOrganization = async (id: number, data: Partial<Organization>) => {
  return await http.put<Organization>(`${BASE_URL}/${id}`, data)
}

// 删除组织
export const deleteOrganization = async (id: number) => {
  return await http.delete(`${BASE_URL}/${id}`)
}
```

### 7. 前端组件

**创建组织管理页面 `src/views/system/organization/index.vue`**:

```vue
<template>
  <div class="organization-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>组织管理</span>
          <el-button type="primary" @click="handleCreate">添加组织</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchName"
          placeholder="组织名称"
          style="width: 200px;"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="tableData" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="组织名称" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="150" />
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column prop="contact" label="联系人" min-width="100" />
        <el-table-column prop="contact_phone" label="联系电话" min-width="120" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '添加组织' : '编辑组织'"
      width="500px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="组织名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入组织名称" />
        </el-form-item>
        <el-form-item label="上级组织" prop="parent_id">
          <el-tree-select
            v-model="form.parent_id"
            :data="organizationTree"
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            check-strictly
            clearable
            placeholder="请选择上级组织"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contact_phone">
          <el-input v-model="form.contact_phone" placeholder="请输入联系电话" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, reactive } from 'vue'
  import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
  import {
    getOrganizationList,
    getOrganizationTree,
    createOrganization,
    updateOrganization,
    deleteOrganization
  } from '@/api/organizationApi'
  import type { Organization, OrganizationTree } from '@/types/api'

  // 表格数据
  const tableData = ref<Organization[]>([])
  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const searchName = ref('')

  // 组织树数据
  const organizationTree = ref<OrganizationTree[]>([])

  // 对话框
  const dialogVisible = ref(false)
  const dialogType = ref<'create' | 'edit'>('create')
  const form = reactive({
    id: 0,
    name: '',
    parent_id: null as number | null,
    description: '',
    address: '',
    contact: '',
    contact_phone: ''
  })
  const formRef = ref<FormInstance>()
  const rules = {
    name: [
      { required: true, message: '请输入组织名称', trigger: 'blur' },
      { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
    ]
  }

  // 获取组织列表
  const fetchOrganizationList = async () => {
    loading.value = true
    try {
      const res = await getOrganizationList({
        current: currentPage.value,
        size: pageSize.value,
        name: searchName.value
      })
      tableData.value = res.data.records
      total.value = res.data.total
    } catch (error) {
      console.error('获取组织列表失败:', error)
      ElMessage.error('获取组织列表失败')
    } finally {
      loading.value = false
    }
  }

  // 获取组织树
  const fetchOrganizationTree = async () => {
    try {
      const res = await getOrganizationTree()
      organizationTree.value = res.data
    } catch (error) {
      console.error('获取组织树失败:', error)
      ElMessage.error('获取组织树失败')
    }
  }

  // 搜索
  const handleSearch = () => {
    currentPage.value = 1
    fetchOrganizationList()
  }

  // 重置搜索
  const resetSearch = () => {
    searchName.value = ''
    currentPage.value = 1
    fetchOrganizationList()
  }

  // 分页大小变化
  const handleSizeChange = (val: number) => {
    pageSize.value = val
    fetchOrganizationList()
  }

  // 分页页码变化
  const handleCurrentChange = (val: number) => {
    currentPage.value = val
    fetchOrganizationList()
  }

  // 添加组织
  const handleCreate = () => {
    dialogType.value = 'create'
    resetForm()
    dialogVisible.value = true
  }

  // 编辑组织
  const handleEdit = (row: Organization) => {
    dialogType.value = 'edit'
    form.id = row.id
    form.name = row.name
    form.parent_id = row.parent_id
    form.description = row.description || ''
    form.address = row.address || ''
    form.contact = row.contact || ''
    form.contact_phone = row.contact_phone || ''
    dialogVisible.value = true
  }

  // 提交表单
  const submitForm = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (!valid) return

      try {
        if (dialogType.value === 'create') {
          await createOrganization(form)
          ElMessage.success('组织创建成功')
        } else {
          await updateOrganization(form.id, form)
          ElMessage.success('组织更新成功')
        }
        dialogVisible.value = false
        fetchOrganizationList()
        fetchOrganizationTree()
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error('操作失败')
      }
    })
  }

  // 删除组织
  const handleDelete = (row: Organization) => {
    ElMessageBox.confirm('确认删除该组织吗？删除后不可恢复！', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          await deleteOrganization(row.id)
          ElMessage.success('组织删除成功')
          fetchOrganizationList()
          fetchOrganizationTree()
        } catch (error) {
          console.error('删除失败:', error)
          ElMessage.error('删除失败')
        }
      })
      .catch(() => {
        // 用户点击取消按钮
      })
  }

  // 重置表单
  const resetForm = () => {
    form.id = 0
    form.name = ''
    form.parent_id = null
    form.description = ''
    form.address = ''
    form.contact = ''
    form.contact_phone = ''
    formRef.value?.resetFields()
  }

  // 初始化
  onMounted(() => {
    fetchOrganizationList()
    fetchOrganizationTree()
  })
</script>

<style scoped>
  .organization-container {
    padding: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .search-bar {
    margin-bottom: 20px;
  }

  .el-button {
    margin-left: 10px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
</style>
```

### 8. 添加路由

**更新路由配置 `src/router/routes/asyncRoutes.ts`**:

```typescript
// 添加组织管理路由
{
  path: '/system/organization',
  name: 'Organization',
  component: () => import('@/views/system/organization/index.vue'),
  meta: {
    title: '组织管理',
    icon: 'Organization',
    roles: ['admin']
  }
}
```

### 9. 添加类型定义

**更新 `src/types/api.d.ts`**:

```typescript
// 组织类型定义
export interface Organization {
  id: number
  name: string
  parent_id: number | null
  description: string | null
  address: string | null
  contact: string | null
  contact_phone: string | null
  created_at: string
  updated_at: string
  children?: Organization[]
}

export interface OrganizationTree {
  id: number
  name: string
  children: OrganizationTree[]
}
```

这个完整的流程展示了从数据库表设计到前端实现的全过程。通过遵循这些步骤，可以确保新功能的开发符合项目的结构和最佳实践。
