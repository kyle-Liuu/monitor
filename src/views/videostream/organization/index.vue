<template>
  <div class="organization-root">
    <ArtTableFullScreen>
      <div class="menu-page" id="table-full-screen">
        <!-- 搜索栏 -->
        <ArtSearchBar v-model:filter="formFilters" :items="formItems" :showExpand="false" @reset="handleReset"
          @search="handleSearch"></ArtSearchBar>
        <ElCard shadow="never" class="art-table-card">
          <!-- 表格头部 -->
          <ArtTableHeader :showZebra="false" v-model:columns="columnChecks" @refresh="handleRefresh">
            <template #left>
              <ElButton type="primary" @click="handleAdd" v-ripple :loading="btnLoading.add">新增</ElButton>
              <ElButton @click="toggleExpand" v-ripple>{{ isExpanded ? '收起' : '展开' }}</ElButton>
            </template>
          </ArtTableHeader>
          <!-- 表格 -->
          <ArtTable row-key="id" :tree-props="{ children: 'children' }" ref="tableRef" :loading="loading"
            :data="pagedTreeData" :marginTop="10" :stripe="false" :showPagination="true"
            :currentPage="pagination.currentPage" :pageSize="pagination.pageSize" :total="treeTotal"
            @size-change="handleSizeChange" @current-change="handleCurrentChange" @expand-change="handleExpandChange"
            empty-text="暂无数据">
            <template #default>
              <ElTableColumn v-for="col in columns" :key="col.prop || col.type" v-bind="col">
                <template #default="scope" v-if="col.prop === 'name'">
                  <span :class="{ 'disabled-org': scope.row.status === '禁用' }">{{ scope.row.name }}</span>
                </template>
              </ElTableColumn>
            </template>
          </ArtTable>
        </ElCard>
      </div>
    </ArtTableFullScreen>
    <ElDialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增部门' : '编辑部门'" width="420px" align-center
      :close-on-click-modal="false" destroy-on-close>
      <ElForm ref="formRef" :model="formData" label-width="90px" :rules="formRules" :validate-on-rule-change="false"
        status-icon>
        <ElFormItem label="上级部门">
          <ElTreeSelect :key="treeSelectKey" v-model="formData.parentId"
            :data="[{ label: '无', value: '' }, ...parentOptions]" :default-expanded-keys="[]"
            :render-after-expand="false" check-strictly clearable placeholder="请选择上级部门">
            <template #default="{ node, data }">
              <span :style="ancestorIds.includes(data.value) ? 'color: #409EFF; font-weight: bold;' : ''
                ">
                {{ data.label }}
              </span>
            </template>
          </ElTreeSelect>
          <div v-if="showAncestorPath" class="ancestor-path">
            <span style="color: #409eff">组织路径：</span>
            <template v-for="(name, idx) in ancestorNames" :key="idx">
              <ElTag type="info" effect="plain" size="small" style="margin-right: 4px">{{ name }}</ElTag>
              <span v-if="idx < ancestorNames.length - 1" style="color: #aaa; margin-right: 4px">&gt;</span>
            </template>
          </div>
        </ElFormItem>
        <ElFormItem label="名称" prop="name">
          <ElInput v-model.trim="formData.name" maxlength="30" show-word-limit placeholder="请输入名称" clearable />
        </ElFormItem>
        <ElFormItem label="排序" prop="sort">
          <ElInputNumber v-model="formData.sort" :min="1" :max="9999" controls-position="right" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model.trim="formData.desc" type="textarea" maxlength="200" show-word-limit placeholder="请输入描述" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="formData.status" active-value="启用" inactive-value="禁用" active-text="启用"
            inactive-text="禁用" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="handleCancel">取消</ElButton>
          <ElButton type="primary" @click="handleDialogOk" :loading="isSubmitting">确定</ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, nextTick, reactive, watch } from 'vue'
import { ElMessage, ElTag, ElMessageBox } from 'element-plus'
import ArtTableFullScreen from '@/components/core/tables/ArtTableFullScreen.vue'
import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
import ArtTableHeader from '@/components/core/tables/ArtTableHeader.vue'
import ArtTable from '@/components/core/tables/ArtTable.vue'
import { useCheckedColumns } from '@/composables/useCheckedColumns'
import type { SearchFormItem } from '@/types'
import type { FormInstance, FormRules } from 'element-plus'
import ArtButtonTable from '@/components/core/forms/ArtButtonTable.vue'
import { ORG_TREE_MOCK, OrgNode } from '@/mock/temp/orgTree'

// 组织树数据
const orgTree = ref<OrgNode[]>(structuredClone(ORG_TREE_MOCK))

// 状态变量
const loading = ref(false)
const isSubmitting = ref(false)
const btnLoading = reactive({
  add: false,
  edit: false,
  delete: false
})

// 表单相关
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const treeSelectKey = ref(Date.now())
const formData = ref({
  id: '',
  parentId: '',
  name: '',
  sort: 1,
  desc: '',
  status: '启用' as '启用' | '禁用'
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 2, max: 30, message: '名称长度为2-30字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' },
    { type: 'number', min: 1, message: '排序必须大于0', trigger: 'blur' }
  ]
}

/**
 * 将树形结构拍平为表格数据
 */
function flattenOrgTree(nodes: OrgNode[]): OrgNode[] {
  const result: OrgNode[] = []
  const traverse = (items: OrgNode[]) => {
    for (const node of items) {
      result.push({ ...node })
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    }
  }
  traverse(nodes)
  return result
}

// 拍平后的组织数据
const flatOrgData = computed(() => flattenOrgTree(orgTree.value))

// 搜索相关
const formFilters = ref({ name: '' })
const formItems: SearchFormItem[] = [
  { label: '组织名称', prop: 'name', type: 'input', config: { clearable: true } }
]

/**
 * 重置搜索条件
 */
function handleReset() {
  formFilters.value.name = ''
  pagination.value.currentPage = 1
}

/**
 * 执行搜索
 */
function handleSearch() {
  pagination.value.currentPage = 1
}

// 分页相关
const pagination = ref({ currentPage: 1, pageSize: 10 })

/**
 * 根据搜索关键词过滤组织树
 */
function filterOrgTree(nodes: OrgNode[], keyword: string): OrgNode[] {
  if (!keyword) return nodes

  return nodes
    .map((node) => {
      const match = node.name.toLowerCase().includes(keyword.toLowerCase())
      const children = node.children ? filterOrgTree(node.children, keyword) : undefined

      if (match || (children && children.length > 0)) {
        return { ...node, children }
      }
      return null
    })
    .filter(Boolean) as OrgNode[]
}

/**
 * 计算过滤后的数据总量
 */
const treeTotal = computed(() => {
  const keyword = formFilters.value.name?.trim() || ''
  const filtered = filterOrgTree(orgTree.value, keyword)
  return filtered.length
})

/**
 * 计算分页后的树形数据
 */
const pagedTreeData = computed(() => {
  const keyword = formFilters.value.name?.trim() || ''
  const filtered = filterOrgTree(orgTree.value, keyword)

  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize

  return filtered.slice(start, end)
})

/**
 * 处理分页大小变化
 */
function handleSizeChange(size: number) {
  pagination.value.pageSize = size
}

/**
 * 处理页码变化
 */
function handleCurrentChange(page: number) {
  pagination.value.currentPage = page
}

/**
 * 刷新数据
 */
function handleRefresh() {
  loading.value = true
  try {
    // 模拟API请求
    setTimeout(() => {
      // 实际项目中这里应该是调用API
      loading.value = false
    }, 500)
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新数据失败，请重试')
    loading.value = false
  }
}

// 表格实例引用
const tableRef = ref()

/**
 * 处理行展开事件
 */
function handleExpandChange(row: OrgNode, expanded: boolean) {
  if (expanded && row.status === '禁用') {
    nextTick(() => {
      ElMessage.warning('禁用的组织不能被展开')
      tableRef.value?.toggleRowExpansion(row, false)
    })
  }
}

// 动态列配置
const { columnChecks, columns } = useCheckedColumns(() => [
  { prop: 'name', label: '名称', minWidth: 180, showOverflowTooltip: true },
  {
    prop: 'status',
    label: '状态',
    width: 80,
    align: 'center',
    formatter: (row: OrgNode) =>
      h(
        ElTag,
        {
          type: row.status === '启用' ? 'primary' : 'info',
          size: 'small'
        },
        () => row.status
      )
  },
  { prop: 'desc', label: '描述', minWidth: 180, showOverflowTooltip: true },
  { prop: 'created_at', label: '创建时间', width: 170 },
  {
    prop: 'operation',
    label: '操作',
    width: 200,
    fixed: 'right',
    formatter: (row: OrgNode) =>
      h('div', [
        h(ArtButtonTable as any, {
          type: 'add',
          title: '添加子部门',
          onClick: (evt: MouseEvent) => handleAdd(evt, row),
          disabled: row.status === '禁用'
        }),
        h(ArtButtonTable as any, {
          type: 'edit',
          title: '编辑部门',
          onClick: (evt: MouseEvent) => handleEdit(evt, row)
        }),
        h(ArtButtonTable as any, {
          type: 'delete',
          title: '删除部门',
          onClick: (evt: MouseEvent) => handleDelete(evt, row),
          disabled: row.children && row.children.length > 0 && !hasConfirmedDelete.value
        })
      ])
  }
])

/**
 * 添加新部门
 */
async function handleAdd(evt?: MouseEvent, row?: OrgNode) {
  if (row && row.status === '禁用') {
    ElMessage.warning('禁用部门不能添加子部门')
    return
  }

  btnLoading.add = true
  try {
    dialogType.value = 'add'

    // 重置表单数据
    formData.value = {
      id: '',
      parentId: row?.id || '',
      name: '',
      sort: await getMaxSort(row?.id ?? '') + 1,
      desc: '',
      status: '启用'
    }

    treeSelectKey.value = Date.now()
    dialogVisible.value = true

    // 等待DOM更新后清除验证
    nextTick(() => {
      if (formRef.value) {
        formRef.value.clearValidate()
      }
    })
  } catch (error) {
    console.error('准备添加部门失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    btnLoading.add = false
  }
}

/**
 * 编辑部门
 */
async function handleEdit(evt: MouseEvent, row: OrgNode) {
  btnLoading.edit = true
  try {
    dialogType.value = 'edit'

    // 设置表单数据
    formData.value = {
      id: row.id,
      parentId: '',
      name: row.name,
      sort: row.sort || 1,
      desc: row.desc || '',
      status: row.status as '启用' | '禁用'
    }

    treeSelectKey.value = Date.now()
    dialogVisible.value = true

    // 等待DOM更新后设置parentId并清除验证
    nextTick(async () => {
      formData.value.parentId = await findParentId(orgTree.value, row.id) || ''
      if (formRef.value) {
        formRef.value.clearValidate()
      }
    })
  } catch (error) {
    console.error('准备编辑部门失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    btnLoading.edit = false
  }
}

// 记录是否已确认删除带子部门的组织
const hasConfirmedDelete = ref(false)

/**
 * 删除部门
 */
async function handleDelete(evt: MouseEvent, row: OrgNode) {
  btnLoading.delete = true
  try {
    if (row.children && row.children.length > 0) {
      await ElMessageBox.confirm('该部门下有子部门，删除将一并移除，是否继续？', '删除确认', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        closeOnClickModal: false
      })
      // 用户已确认删除带子部门的组织
      hasConfirmedDelete.value = true
    } else {
      await ElMessageBox.confirm('确定删除该部门？', '删除确认', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        closeOnClickModal: false
      })
    }

    // 执行删除操作
    removeNodeById(orgTree.value, row.id)
    ElMessage.success('删除成功')

    // 如果当前页空了且不是第一页，回到上一页
    const currentPageData = pagedTreeData.value
    if (currentPageData.length === 0 && pagination.value.currentPage > 1) {
      pagination.value.currentPage--
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除部门失败:', error)
      ElMessage.error('删除失败，请重试')
    }
  } finally {
    btnLoading.delete = false
    // 重置确认状态
    hasConfirmedDelete.value = false
  }
}

/**
 * 取消编辑
 */
function handleCancel() {
  if (isSubmitting.value) return

  ElMessageBox.confirm('确定要取消吗？未保存的内容将会丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '继续编辑',
    type: 'warning',
    closeOnClickModal: false
  }).then(() => {
    dialogVisible.value = false
  }).catch(() => {
    // 用户选择继续编辑，不做任何操作
  })
}

/**
 * 提交表单
 */
async function handleDialogOk() {
  if (!formRef.value) return

  try {
    // 表单验证
    await formRef.value.validate()
    isSubmitting.value = true

    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    if (dialogType.value === 'add') {
      await handleAddOrg()
    } else {
      await handleEditOrg()
    }

    dialogVisible.value = false
    ElMessage.success(dialogType.value === 'add' ? '新增成功' : '编辑成功')
  } catch (error) {
    if (error !== 'cancel' && error !== false) {
      console.error('表单提交失败:', error)
      ElMessage.error('操作失败，请检查表单并重试')
    }
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 处理添加组织
 */
async function handleAddOrg() {
  // 创建新节点
  const newId = Date.now().toString()
  const node: OrgNode = {
    id: newId,
    name: formData.value.name.trim(),
    status: formData.value.status,
    desc: formData.value.desc.trim(),
    created_at: new Date().toLocaleString('zh-CN', { hour12: false }),
    sort: formData.value.sort,
    children: []
  }

  // 添加到组织树中
  if (formData.value.parentId) {
    const parent = findNodeById(orgTree.value, formData.value.parentId)
    if (parent) {
      if (!parent.children) parent.children = []
      parent.children.push(node)
      // 按排序值排序
      parent.children.sort((a, b) => (a.sort || 0) - (b.sort || 0))
    }
  } else {
    orgTree.value.push(node)
    // 根级组织按排序值排序
    orgTree.value.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  }
}

/**
 * 处理编辑组织
 */
async function handleEditOrg() {
  // 查找并更新节点
  const node = findNodeById(orgTree.value, formData.value.id)
  if (!node) {
    ElMessage.error('未找到要编辑的部门，请刷新页面重试')
    return Promise.reject('未找到节点')
  }

  // 更新节点属性
  node.name = formData.value.name.trim()
  node.status = formData.value.status
  node.desc = formData.value.desc.trim()
  node.sort = formData.value.sort

  // 若上级变更，需移动节点
  const oldParentId = await findParentId(orgTree.value, formData.value.id)
  if (oldParentId !== formData.value.parentId) {
    await moveNode(orgTree.value, formData.value.id, formData.value.parentId)
  }

  // 如果修改了状态为禁用，且有子节点，询问是否级联禁用子节点
  if (node.status === '禁用' && node.children && node.children.length > 0) {
    try {
      await ElMessageBox.confirm(
        '是否将所有子部门也设为禁用状态？',
        '级联设置',
        {
          confirmButtonText: '是',
          cancelButtonText: '否',
          type: 'warning',
          closeOnClickModal: false
        }
      )
      // 级联设置子节点状态
      updateChildrenStatus(node, '禁用')
    } catch (e) {
      // 用户选择不级联设置，不做处理
    }
  }
}

/**
 * 根据ID查找节点
 */
function findNodeById(nodes: OrgNode[], id: string): OrgNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

/**
 * 查找节点的父级ID
 */
function findParentId(nodes: OrgNode[], id: string, parentId = ''): string | null {
  for (const node of nodes) {
    if (node.children?.some((c) => c.id === id)) return node.id
    if (node.children) {
      const found = findParentId(node.children, id, node.id)
      if (found) return found
    }
  }
  return null
}

/**
 * 从组织树中删除节点
 */
function removeNodeById(nodes: OrgNode[], id: string): boolean {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      nodes.splice(i, 1)
      return true
    }
    // 使用类型守卫确保children存在且是数组
    const children = nodes[i].children
    if (children && Array.isArray(children) && children.length > 0) {
      const removed = removeNodeById(children, id)
      if (removed) {
        // 若children删空则移除children属性
        if (children.length === 0) {
          delete nodes[i].children
        }
        return true
      }
    }
  }
  return false
}

/**
 * 移动节点到新的父节点下
 */
async function moveNode(nodes: OrgNode[], id: string, newParentId: string = '') {
  // 查找要移动的节点
  const node = findNodeById(nodes, id)
  if (!node) return

  // 检查是否是将节点移到其子节点下，这会导致循环引用
  if (newParentId) {
    const childrenIds = getDescendantIds(node)
    if (childrenIds.includes(newParentId)) {
      ElMessage.error('不能将部门移动到其子部门下')
      return Promise.reject('循环引用')
    }
  }

  // 从原位置移除
  removeNodeById(nodes, id)

  // 添加到新位置
  if (newParentId) {
    const parent = findNodeById(nodes, newParentId)
    if (parent) {
      if (!parent.children) parent.children = []
      parent.children.push(node)
      // 按排序值排序
      parent.children.sort((a, b) => (a.sort || 0) - (b.sort || 0))
    }
  } else {
    nodes.push(node)
    // 根级组织按排序值排序
    nodes.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  }
}

/**
 * 获取节点下所有子节点的ID
 */
function getDescendantIds(node: OrgNode): string[] {
  const ids: string[] = []

  const collectIds = (n: OrgNode): void => {
    if (n.children && n.children.length > 0) {
      n.children.forEach((child) => {
        ids.push(child.id)
        collectIds(child)
      })
    }
  }

  collectIds(node)
  return ids
}

/**
 * 获取同级最大排序值
 */
async function getMaxSort(parentId: string = '') {
  let children: OrgNode[] = []
  if (!parentId) {
    children = orgTree.value
  } else {
    const parent = findNodeById(orgTree.value, parentId)
    if (parent && Array.isArray(parent.children)) children = parent.children
  }
  if (!children || !children.length) return 0
  return Math.max(...children.map((c) => c.sort || 1))
}

// 展开/收起功能
const isExpanded = ref(false)

/**
 * 切换展开/收起状态
 */
function toggleExpand() {
  isExpanded.value = !isExpanded.value
  nextTick(() => {
    if (!tableRef.value) return

    const method = isExpanded.value ? 'expandAll' : 'collapseAll'
    if (typeof tableRef.value[method] === 'function') {
      tableRef.value[method]()
    }
  })
}

/**
 * 级联更新子节点状态
 */
function updateChildrenStatus(node: OrgNode, status: '启用' | '禁用') {
  if (!node.children || node.children.length === 0) return

  for (const child of node.children) {
    child.status = status
    if (child.children && child.children.length > 0) {
      updateChildrenStatus(child, status)
    }
  }
}

/**
 * 确保每个节点都有status字段
 */
function ensureStatusField(nodes: OrgNode[]) {
  for (const node of nodes) {
    if (!('status' in node) || (node.status !== '启用' && node.status !== '禁用')) {
      node.status = '启用'
    }
    if (node.children && node.children.length > 0) {
      ensureStatusField(node.children)
    }
  }
}
ensureStatusField(orgTree.value)

/**
 * 计算可选的父部门选项
 */
const parentOptions = computed(() => {
  function mapTree(nodes: OrgNode[], excludeIds: string[] = []): any[] {
    const safeNodes = Array.isArray(nodes) ? nodes : []
    return safeNodes
      .filter((n) => !excludeIds.includes(n.id))
      .map((node) => ({
        label: node.name,
        value: node.id,
        disabled: node.status === '禁用',
        children:
          Array.isArray(node.children) && node.children.length > 0
            ? mapTree(node.children, excludeIds)
            : []
      }))
  }

  // 编辑模式下，需要排除当前节点及其所有子节点
  if (dialogType.value === 'edit' && formData.value.id) {
    const excludeIds: string[] = []
    const node = findNodeById(orgTree.value, formData.value.id)
    if (node) {
      excludeIds.push(node.id)
      const childrenIds = getDescendantIds(node)
      excludeIds.push(...childrenIds)
    }
    return mapTree(orgTree.value, excludeIds)
  }
  return mapTree(orgTree.value)
})

/**
 * 递归查找ID的所有祖先ID
 */
function getAncestorIds(tree: OrgNode[], id: string, path: string[] = []): string[] {
  for (const node of tree) {
    if (node.id === id) return path
    if (node.children) {
      const found = getAncestorIds(node.children, id, [...path, node.id])
      if (found.length) return found
    }
  }
  return []
}

// 计算祖先ID和名称
const ancestorIds = computed(() => {
  if (!formData.value.parentId) return []
  return getAncestorIds(orgTree.value, formData.value.parentId)
})

const ancestorNames = computed(() => {
  const names: string[] = []
  for (const id of ancestorIds.value) {
    const node = findNodeById(orgTree.value, id)
    if (node) {
      names.push(node.name)
    }
  }
  return names
})

const showAncestorPath = computed(() => ancestorNames.value.length > 0)

// 监听表单parentId变化，更新选择器key以强制刷新
watch(() => formData.value.parentId, () => {
  treeSelectKey.value = Date.now()
})

// 关闭对话框时重置表单
watch(dialogVisible, (val) => {
  if (!val) {
    nextTick(() => {
      formData.value = {
        id: '',
        parentId: '',
        name: '',
        sort: 1,
        desc: '',
        status: '启用'
      }
    })
  }
})
</script>

<style lang="scss" scoped>
.organization-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.menu-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .svg-icon {
    width: 1.8em;
    height: 1.8em;
    overflow: hidden;
    vertical-align: -8px;
    fill: currentcolor;
  }

  :deep(.small-btn) {
    height: 30px !important;
    padding: 0 10px !important;
    font-size: 12px !important;
  }
}

.art-table-card {
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.06);
  margin: 6px 0 8px 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 1px !important;

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 8px;
  }

  :deep(.art-table-wrapper) {
    flex: 1;
    overflow: auto;
  }
}

.disabled-org {
  color: #909399;
  text-decoration: line-through;
  opacity: 0.8;
}

.ancestor-path {
  margin-top: 4px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 12px;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
