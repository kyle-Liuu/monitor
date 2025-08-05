# 视频流信息页面修改日志

## 2024-XX-XX

### 添加组织搜索功能和树形组织绑定

**思考过程：** 用户要求在视频流信息页面的搜索栏添加组织搜索，内容为下拉树框，同时视频流信息的绑定组织也改为树形组织。需要集成 useOptions 来获取统一的组织树数据，实现组织搜索和绑定功能。

**修改内容：**

### 1. 集成 useOptions 组织管理

- **导入模块**：添加 `import { useOptions } from '@/composables/useOptions'`
- **数据获取**：使用 `const { orgTreeOptions, fetchOrgs } = useOptions()` 获取组织树选项
- **生命周期**：在 `onMounted` 中调用 `await fetchOrgs()` 确保组织数据先加载

### 2. 搜索栏功能增强

- **搜索条件扩展**：在 `formFilters` 中添加 `orgId: ''` 字段
- **搜索表单配置**：在 `formItems` 中添加组织选择器：
  ```typescript
  {
    label: '所属组织',
    prop: 'orgId',
    type: 'select',
    config: {
      placeholder: '请选择组织',
      clearable: true,
      filterable: true,
      options: computed(() => [
        { label: '全部', value: '' },
        ...orgTreeOptions.value.map(org => ({
          label: org.label,
          value: org.value
        }))
      ])
    }
  }
  ```
- **API调用更新**：在 `fetchStreamList` 中添加 `org_id: params.orgId || undefined` 参数

### 3. 绑定组织功能升级

- **组织选择器更新**：将表单中的"绑定组织"从使用空数组改为使用 `orgTreeOptions`
- **ElTreeSelect 配置更新**：
  ```vue
  <ElTreeSelect
    :data="orgTreeOptions"
    :props="{
      label: 'label',
      value: 'value',
      children: 'children',
      disabled: 'disabled'
    }"
  />
  ```
- **模板适配**：更新模板中的数据绑定从 `data.name/data.id` 改为 `data.label/data.value`

### 4. 路径计算逻辑更新

- **selectedOrgPath 计算属性**：更新路径计算逻辑适配新的数据结构
- **selectedOrgPathIds 计算属性**：更新ID路径计算逻辑
- **getOrgParentKeys 函数**：更新父级键获取逻辑，从 `node.id` 改为 `node.value`

### 5. API参数配置

- **useTable 配置**：在 `apiParams` 中添加 `orgId: ''` 参数
- **搜索状态同步**：确保搜索表单数据与 `searchState` 同步

**核心代码变更：**

```typescript
// 组织数据获取
const { orgTreeOptions, fetchOrgs } = useOptions()

// 生命周期优化
onMounted(async () => {
  await fetchOrgs() // 先获取组织数据
  getTableData()
})

// 搜索筛选器配置
const formFilters = ref({
  streamName: '',
  streamCode: '',
  protocol: '',
  enable: '',
  orgId: '' // 新增组织筛选
})

// API调用参数
const response = await StreamService.getStreamList({
  skip: (params.current - 1) * params.size,
  limit: params.size,
  name: params.streamName,
  stream_type: params.protocol,
  status: params.enable ? 'active' : undefined,
  org_id: params.orgId || undefined // 新增组织筛选
})
```

**功能特性：**

- ✅ 搜索栏支持按组织筛选视频流
- ✅ 组织选择器支持搜索和清空
- ✅ 绑定组织使用树形结构展示
- ✅ 组织路径显示和高亮功能
- ✅ 数据缓存和性能优化
- ✅ 统一的组织数据管理

**优化效果：**

- 用户可以快速按组织筛选视频流
- 绑定组织时可以看到完整的组织层级结构
- 提升了数据查找和管理的效率
- 保持了与其他页面一致的组织选择体验

## 2024-XX-XX (补充修复)

### 修复组织选项数据显示和算法标签默认选择问题

**思考过程：** 用户反馈搜索栏的组织下拉选项只显示"全部"，没有显示具体的组织列表；以及点击算法标签时希望默认选中第一个type，而不是需要手动选择才显示详细信息。

**修复内容：**

### 1. 组织选项数据源统一

**问题根源**：混用 `useOptions` 和 `useOrgs` 导致数据源不一致 **解决方案**：

```typescript
// 修改前：混用两个composable
const { orgTreeOptions, fetchOrgs } = useOptions()
const { orgsList } = useOrgs()

// 修改后：统一使用 useOrgs
const { orgTreeOptions, orgsList, fetchOrgs } = useOrgs()
```

### 2. 算法标签默认选择优化

**问题根源**：

- `algoTab` 初始值为 'basic'，导致自动选择逻辑失效
- `openAlgoDialog()` 没有设置默认选中第一个可用tab

**解决方案**：

```typescript
// 1. 修改初始值
const algoTab = ref('') // 改为空字符串，让它在获取到数据后自动设置

// 2. 修复自动选择逻辑
// fetchAlgorithmList() 中：
if (tabs.length > 0) {
  algoTab.value = tabs[0].name // 总是设置为第一个tab
}

// 3. 对话框打开时确保选中第一个tab
function openAlgoDialog() {
  algoDialogChecked.value = [...selectedAlgos.value]
  // 确保默认选中第一个可用的标签页
  if (algoTabs.value.length > 0) {
    algoTab.value = algoTabs.value[0].name
  }
  algoDialogVisible.value = true
}
```

**核心代码变更：**

```typescript
// 组织数据统一管理
const { orgTreeOptions, orgsList, fetchOrgs } = useOrgs()

// 算法tab默认选择
const algoTab = ref('') // 空字符串初始值

// 自动选择第一个tab
if (tabs.length > 0) {
  algoTab.value = tabs[0].name
}

// 对话框打开时的默认选择
function openAlgoDialog() {
  algoDialogChecked.value = [...selectedAlgos.value]
  if (algoTabs.value.length > 0) {
    algoTab.value = algoTabs.value[0].name
  }
  algoDialogVisible.value = true
}
```

**修复效果：**

- ✅ 搜索栏组织选项正确显示所有组织（包括禁用的）
- ✅ 算法标签对话框打开时自动选中第一个type标签页
- ✅ 用户体验更加流畅，减少手动操作步骤
- ✅ 数据源统一，避免不一致问题
