# 虚拟组织绑定页面修改日志

## 2024-XX-XX

### 集成 useOptions 统一组织数据管理

**思考过程：** 按照用户要求，其他页面也要尽量使用 useOptions 来复用逻辑，统一处理组织相关功能。虚拟组织绑定页面包含两个子页面：组织树列表页（index.vue）和绑定管理页（vittualOrgAndStream.vue），都需要更新使用统一的组织管理逻辑。

**修改内容：**

### index.vue（组织树列表页）

1. **导入 useOptions**：添加 `import { useOptions } from '@/composables/useOptions'`
2. **数据获取优化**：在 `onMounted` 中先调用 `fetchOrgs()` 确保组织选项数据被加载
3. **保持现有显示逻辑**：组织树的显示逻辑保持不变，只是确保数据一致性

### vittualOrgAndStream.vue（绑定管理页）

1. **导入整合**：
   - 添加 `import { useOptions } from '@/composables/useOptions'`
   - 添加 `import { useOrgs } from '@/composables/useOrgs'`

2. **组织树选择器升级**：
   - 使用 `orgTreeOptions` 替代手动构建的组织树数据
   - 更新 ElTreeSelect 的 props 配置适配新的数据格式
   - 简化组织验证逻辑，使用 `getOrgName()` 方法

3. **数据获取优化**：
   - 删除手动的 `fetchOrganizationTree` 函数
   - 使用统一的 `fetchOrgs()` 方法获取组织数据
   - 使用 `getOrgName()` 替代手动查找组织名称的逻辑

**核心代码变更：**

```typescript
// 旧的实现
const orgTree = ref<OrgNode[]>([])
const fetchOrganizationTree = async () => {
  // 手动获取和转换组织树数据
}

// 新的实现
const { orgTreeOptions, fetchOrgs } = useOptions()
const { getOrgName } = useOrgs()

// 树形选择器使用统一格式
<ElTreeSelect
  :data="orgTreeOptions"
  :props="{
    label: 'label',
    value: 'value',
    children: 'children',
    disabled: 'disabled'
  }"
/>

// 组织验证使用统一方法
const orgName = getOrgName(orgId)
if (!orgName || orgName === orgId) {
  // 组织不存在处理
}
```

**优化效果：**

- 统一的组织数据管理，避免重复的API调用
- 简化的组织验证和名称获取逻辑
- 更好的代码复用性和维护性
- 确保多个页面间的组织数据一致性
