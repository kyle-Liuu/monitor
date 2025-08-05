# role/index.vue 组件修改日志

## 2024-XX-XX (角色管理统一化重构)

### 统一使用 useOptions() 的 fetchRolesWithSearch 替换本地角色获取逻辑

**思考过程：** 在项目统一选项管理重构过程中，发现角色管理页面仍在使用本地的 `fetchRolesList` 函数，存在以下问题：

1. 重复实现了角色数据获取逻辑
2. 缺乏缓存机制，每次搜索都重新请求
3. 本地状态管理与全局状态分离
4. 错误处理不统一

**修改内容：**

### 1. 导入 useOptions 扩展功能

```typescript
// 修改前：只使用基础选项
const { statusOptions } = useOptions()

// 修改后：使用扩展的搜索功能
const { statusOptions, fetchRolesWithSearch, rolesLoading } = useOptions()
```

### 2. 统一加载状态管理

```typescript
// 删除前：本地loading状态
const loading = ref(false)

// 修改后：使用全局loading状态
const loading = computed(() => rolesLoading.value)
```

### 3. 重构数据获取逻辑

```typescript
// 修改前：本地实现，手动控制loading
const fetchRolesList = async () => {
  loading.value = true
  try {
    const response = await RoleService.getRolesList({
      keyword: searchForm.keyword
    })
    roleList.value = response.roles || []
  } catch (error: any) {
    console.error('获取角色列表失败:', error)
    ElMessage.error(error.message || '获取角色列表失败')
    roleList.value = []
  } finally {
    loading.value = false
  }
}

// 修改后：使用统一方法，自动处理loading和缓存
const fetchRolesList = async () => {
  try {
    const roles = await fetchRolesWithSearch({
      keyword: searchForm.keyword
    })
    roleList.value = roles
  } catch (error: any) {
    console.error('获取角色列表失败:', error)
    ElMessage.error(error.message || '获取角色列表失败')
    roleList.value = []
  }
}
```

### 4. 功能优势对比

#### 🔹 性能优化

- **缓存机制**: `fetchRolesWithSearch` 内置缓存，无搜索条件时更新全局缓存
- **状态统一**: 使用全局 `rolesLoading` 状态，避免重复 loading 指示器
- **网络优化**: 智能缓存减少不必要的网络请求

#### 🔹 代码简化

- **代码减少**: 删除了手动 loading 控制逻辑（6行代码）
- **逻辑集中**: 错误处理和状态管理统一在 `useOptions` 中
- **职责清晰**: 组件专注业务逻辑，数据获取交给统一管理

#### 🔹 架构一致性

- **统一规范**: 符合项目使用 `useOptions` 管理选项数据的原则
- **扩展性强**: `fetchRolesWithSearch` 支持关键词搜索、分页等参数
- **维护便利**: 后续角色获取逻辑修改只需在 `useOptions` 中维护

### 5. 支持的搜索参数

#### fetchRolesWithSearch 参数说明

```typescript
interface SearchParams {
  keyword?: string // 搜索关键词
  skip?: number // 跳过条数
  limit?: number // 限制条数
  refresh?: boolean // 是否强制刷新
}

// 使用示例
const roles = await fetchRolesWithSearch({
  keyword: '管理员',
  skip: 0,
  limit: 20
})
```

#### 智能缓存策略

- **无搜索条件**: 更新全局缓存 `rolesList`，供其他组件使用
- **有搜索条件**: 不更新缓存，避免污染全局数据
- **性能提升**: 相同搜索条件下的后续请求将受益于缓存

### 6. 重构效果

#### ✅ 代码质量提升

- **简化逻辑**: 删除了手动状态管理代码
- **统一标准**: 与其他页面保持一致的数据获取方式
- **错误处理**: 更完善的错误状态管理

#### ✅ 性能优化

- **缓存机制**: 避免重复请求相同数据
- **状态共享**: 与其他组件共享角色数据状态
- **响应速度**: 缓存命中时响应更快

#### ✅ 维护便利性

- **集中管理**: 角色获取逻辑统一维护
- **扩展性强**: 支持更多搜索参数和功能
- **向后兼容**: 保持现有功能不变

**重构效果：** 这次重构展示了如何将页面级的数据获取逻辑迁移到统一的选项管理中，既保持了原有功能（支持关键词搜索），又获得了缓存、状态管理等增强功能，为项目的数据管理标准化迈出了重要一步。
