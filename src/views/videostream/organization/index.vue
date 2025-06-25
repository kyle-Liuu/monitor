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
              <ElButton @click="handleAdd" v-ripple>新增</ElButton>
              <ElButton @click="toggleExpand" v-ripple>{{ isExpanded ? '收起' : '展开' }}</ElButton>
            </template>
          </ArtTableHeader>
          <!-- 表格 -->
          <ArtTable row-key="id" :tree-props="{ children: 'children' }" ref="tableRef" :loading="loading"
            :data="pagedTreeData" :marginTop="10" :stripe="false" :showPagination="true"
            :currentPage="pagination.currentPage" :pageSize="pagination.pageSize" :total="treeTotal"
            @size-change="handleSizeChange" @current-change="handleCurrentChange" @expand-change="handleExpandChange">
            <template #default>
              <ElTableColumn v-for="col in columns" :key="col.prop || col.type" v-bind="col" />
            </template>
          </ArtTable>
        </ElCard>
      </div>
    </ArtTableFullScreen>
    <ElDialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增部门' : '编辑部门'" width="420px" align-center>
      <ElForm ref="formRef" :model="formData" label-width="90px" :rules="{
        name: [
          { required: true, message: '请输入名称', trigger: 'blur' },
          { min: 2, max: 30, message: '2-30字符', trigger: 'blur' }
        ],
        sort: [
          { required: true, message: '请输入排序', trigger: 'blur' },
          { type: 'number', min: 1, message: '必须大于0', trigger: 'blur' }
        ]
      }" :validate-on-rule-change="false">
        <ElFormItem label="上级部门">
          <ElTreeSelect v-model="formData.parentId" :data="[{ label: '无', value: '' }, ...parentOptions]"
            :render-after-expand="false" check-strictly clearable placeholder="请选择上级部门" />
        </ElFormItem>
        <ElFormItem label="名称" prop="name">
          <ElInput v-model="formData.name" maxlength="30" show-word-limit placeholder="请输入名称" />
        </ElFormItem>
        <ElFormItem label="排序" prop="sort">
          <ElInputNumber v-model="formData.sort" :min="1" :max="9999" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="formData.desc" type="textarea" maxlength="200" show-word-limit placeholder="请输入描述" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="formData.status" active-value="启用" inactive-value="禁用" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="dialogVisible = false">取消</ElButton>
          <ElButton type="primary" @click="handleDialogOk">确定</ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, nextTick } from 'vue'
import { ElMessage, ElTag, ElMessageBox } from 'element-plus'
import ArtTableFullScreen from '@/components/core/tables/ArtTableFullScreen.vue'
import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
import ArtTableHeader from '@/components/core/tables/ArtTableHeader.vue'
import ArtTable from '@/components/core/tables/ArtTable.vue'
import { useCheckedColumns } from '@/composables/useCheckedColumns'
import type { SearchFormItem } from '@/types'
import ArtButtonTable from '@/components/core/forms/ArtButtonTable.vue'
import { ORG_TREE_MOCK, OrgNode } from '@/mock/temp/orgTree'

const orgTree = ref<OrgNode[]>(ORG_TREE_MOCK)

// 拍平orgTree为表格数据
function flattenOrgTree(nodes: OrgNode[]): OrgNode[] {
  let result: OrgNode[] = []
  for (const node of nodes) {
    result.push({ ...node })
    if (node.children && node.children.length > 0) {
      result = result.concat(flattenOrgTree(node.children))
    }
  }
  return result
}
const flatOrgData = computed(() => flattenOrgTree(orgTree.value))

// 搜索相关
const formFilters = ref({ name: '' })
const formItems: SearchFormItem[] = [
  { label: '组织名称', prop: 'name', type: 'input', config: { clearable: true } }
]
function handleReset() {
  formFilters.value.name = ''
}
function handleSearch() { }

// 分页相关
const loading = ref(false)
const pagination = ref({ currentPage: 1, pageSize: 10 })
const treeTotal = computed(() => {
  const keyword = formFilters.value.name?.toLowerCase() || ''
  function filterNodes(nodes: OrgNode[]): OrgNode[] {
    return nodes
      .map((node) => {
        const children = node.children ? filterNodes(node.children) : undefined
        const match = node.name.toLowerCase().includes(keyword)
        if (match || (children && children.length > 0)) {
          return { ...node, children }
        }
        return null
      })
      .filter(Boolean) as OrgNode[]
  }
  const filtered = keyword ? filterNodes(orgTree.value) : orgTree.value
  return filtered.length
})
const pagedTreeData = computed(() => {
  const keyword = formFilters.value.name?.toLowerCase() || ''
  function filterNodes(nodes: OrgNode[]): OrgNode[] {
    return nodes
      .map((node) => {
        const children = node.children ? filterNodes(node.children) : undefined
        const match = node.name.toLowerCase().includes(keyword)
        if (match || (children && children.length > 0)) {
          return { ...node, children }
        }
        return null
      })
      .filter(Boolean) as OrgNode[]
  }
  const filtered = keyword ? filterNodes(orgTree.value) : orgTree.value
  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return filtered.slice(start, end)
})
function handleSizeChange(size: number) {
  pagination.value.pageSize = size
}
function handleCurrentChange(page: number) {
  pagination.value.currentPage = page
}
function handleRefresh() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
}

// 处理行展开事件
function handleExpandChange(row: OrgNode, expanded: boolean) {
  if (expanded && row.status === '禁用') {
    nextTick(() => {
      ElMessage.warning('禁用的组织不能被展开')
      tableRef.value?.toggleRowExpansion(row, false)
    })
  }
}

// 动态列配置（与菜单管理保持一致）
const { columnChecks, columns } = useCheckedColumns(() => [
  { prop: 'name', label: '名称', minWidth: 180 },
  {
    prop: 'status',
    label: '状态',
    width: 80,
    align: 'center',
    formatter: (row: OrgNode) =>
      h(
        ElTag,
        { type: row.status === '启用' ? 'success' : 'info', size: 'small' },
        () => row.status
      )
  },
  { prop: 'desc', label: '描述', minWidth: 180 },
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
          onClick: (evt: MouseEvent) => handleAdd(evt, row)
        }),
        h(ArtButtonTable as any, {
          type: 'edit',
          onClick: (evt: MouseEvent) => handleEdit(evt, row)
        }),
        h(ArtButtonTable as any, {
          type: 'delete',
          onClick: (evt: MouseEvent) => handleDelete(evt, row)
        })
      ])
  }
])

// 新增弹窗/编辑弹窗相关状态
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref()
const formData = ref({
  id: '',
  parentId: '',
  name: '',
  sort: 1,
  desc: '',
  status: '启用'
})
const parentOptions = computed(() => {
  // 递归生成树形下拉选项
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
  // 编辑时排除自己及子孙
  if (dialogType.value === 'edit' && formData.value.id) {
    const excludeIds: string[] = []
    function collectIds(node: OrgNode) {
      excludeIds.push(node.id)
      node.children?.forEach(collectIds)
    }
    const node = findNodeById(orgTree.value, formData.value.id)
    if (node) collectIds(node)
    return mapTree(orgTree.value, excludeIds)
  }
  return mapTree(orgTree.value)
})

// 操作列事件实现
function handleAdd(evt: MouseEvent, row?: OrgNode) {
  if (row && row.status === '禁用') {
    ElMessage.warning('禁用部门不能添加子部门')
    return
  }
  dialogType.value = 'add'
  dialogVisible.value = true
  formData.value = {
    id: '',
    parentId: row?.id || '',
    name: '',
    sort: getMaxSort(row?.id ?? '') + 1,
    desc: '',
    status: '启用'
  }
  nextTick(() => formRef.value?.clearValidate?.())
}
function handleEdit(evt: MouseEvent, row: OrgNode) {
  dialogType.value = 'edit'
  dialogVisible.value = true
  formData.value = {
    id: row.id,
    parentId: findParentId(orgTree.value, row.id) || '',
    name: row.name,
    sort: row.sort || 1,
    desc: row.desc,
    status: row.status
  }
  nextTick(() => formRef.value?.clearValidate?.())
}
function handleDelete(evt: MouseEvent, row: OrgNode) {
  if (row.children && row.children.length > 0) {
    ElMessageBox.confirm('该部门下有子项，删除将一并移除，是否继续？', '删除确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }).then(() => {
      removeNodeById(orgTree.value, row.id)
      ElMessage.success('删除成功')
    })
  } else {
    ElMessageBox.confirm('确定删除该部门？', '删除确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }).then(() => {
      removeNodeById(orgTree.value, row.id)
      ElMessage.success('删除成功')
    })
  }
}
// 新增/编辑提交
function handleDialogOk() {
  formRef.value.validate((valid: boolean) => {
    if (!valid) return
    if (dialogType.value === 'add') {
      const newId = Date.now().toString()
      const node: OrgNode = {
        id: newId,
        name: formData.value.name,
        status: formData.value.status as any,
        desc: formData.value.desc,
        created_at: new Date().toLocaleString('zh-CN', { hour12: false }),
        sort: formData.value.sort,
        children: []
      }
      if (formData.value.parentId) {
        const parent = findNodeById(orgTree.value, formData.value.parentId)
        if (parent) {
          if (!parent.children) parent.children = []
          parent.children.push(node)
        }
      } else {
        orgTree.value.push(node)
      }
      ElMessage.success('新增成功')
    } else if (dialogType.value === 'edit') {
      const node = findNodeById(orgTree.value, formData.value.id)
      if (node) {
        node.name = formData.value.name
        node.status = formData.value.status as any
        node.desc = formData.value.desc
        node.sort = formData.value.sort
        // 若上级变更，需移动节点
        const oldParentId = findParentId(orgTree.value, formData.value.id)
        if (oldParentId !== formData.value.parentId) {
          moveNode(orgTree.value, formData.value.id, formData.value.parentId)
        }
      }
      ElMessage.success('编辑成功')
    }
    dialogVisible.value = false
  })
}
// 工具函数
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
function removeNodeById(nodes: OrgNode[], id: string): boolean {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      nodes.splice(i, 1)
      return true
    }
    if (nodes[i].children) {
      const removed = removeNodeById(nodes[i].children || [], id)
      if (removed) {
        // 若children删空则移除children属性
        if (nodes[i].children?.length === 0) delete nodes[i].children
        return true
      }
    }
  }
  return false
}
function moveNode(nodes: OrgNode[], id: string, newParentId: string = '') {
  const node = findNodeById(nodes, id)
  if (!node) return
  removeNodeById(nodes, id)
  if (newParentId) {
    const parent = findNodeById(nodes, newParentId)
    if (parent) {
      if (!Array.isArray(parent.children)) parent.children = []
      parent.children.push(node)
    }
  } else {
    nodes.push(node)
  }
}
function getMaxSort(parentId: string = '') {
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
const tableRef = ref()
function toggleExpand() {
  isExpanded.value = !isExpanded.value
  nextTick(() => {
    if (tableRef.value && tableRef.value[isExpanded.value ? 'expandAll' : 'collapseAll']) {
      tableRef.value[isExpanded.value ? 'expandAll' : 'collapseAll']()
    }
  })
}

// 检查orgTree mock数据，确保每个节点都有status字段
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
</script>

<style lang="scss" scoped>
.menu-page {
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
  overflow: hidden;
  padding: 1px !important;
}
</style>
