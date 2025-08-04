<template>
  <div class="organization-root">
    <div class="organization-page art-full-height">
      <!-- 搜索栏 -->
      <ArtSearchBar
        v-model:filter="formFilters"
        :items="formItems"
        :showExpand="false"
        @reset="handleReset"
        @search="handleSearch"
      ></ArtSearchBar>
      <ElCard shadow="never" class="art-table-card">
        <!-- 表格头部 -->
        <ArtTableHeader
          v-model:columns="columnChecks"
          @refresh="handleRefresh"
          layout="refresh,size,fullscreen,columns,settings"
          fullClass="art-table-card"
        >
          <template #left>
            <div class="toolbar-left">
              <ElButton type="primary" @click="handleAddClick" v-ripple :loading="btnLoading.add"
                >新增</ElButton
              >
              <!-- 导出导入功能 -->
              <ArtExcelImport
                @import-success="handleImportSuccess"
                @import-error="handleImportError"
              />
              <ArtExcelExport
                :data="tableData as any"
                :columns="exportColumns as any"
                filename="组织数据"
                :auto-index="true"
                button-text="导出"
                @export-success="handleExportSuccess"
              />
              <ElButton @click="toggleExpand" v-ripple>{{ isExpanded ? '收起' : '展开' }}</ElButton>
            </div>
          </template>
        </ArtTableHeader>
        <!-- 表格 -->
        <ArtTable
          row-key="id"
          :tree-props="{ children: 'children' }"
          ref="tableRef"
          :loading="isLoading"
          :data="tableData"
          :columns="columns"
          :table-config="{
            emptyHeight: '360px'
          }"
          :layout="{ marginTop: 16, showIndex: false }"
          @row:expand-change="handleExpandChange"
        >
          <!-- 名称列 -->
          <template #name="{ row }">
            <span :class="{ 'disabled-org': row.status === '禁用' }">{{ row.name }}</span>
          </template>
          <!-- 状态列 -->
          <template #status="{ row }">
            <ElTag :type="row.status === '启用' ? 'primary' : 'info'" effect="light" size="small">
              {{ row.status }}
            </ElTag>
          </template>
        </ArtTable>
      </ElCard>
    </div>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增部门' : '编辑部门'"
      width="420px"
      align-center
      :close-on-click-modal="false"
      destroy-on-close
    >
      <ElForm
        ref="formRef"
        :model="formData"
        label-width="90px"
        :rules="formRules"
        :validate-on-rule-change="false"
        status-icon
      >
        <ElFormItem label="上级部门">
          <ElTreeSelect
            :key="treeSelectKey"
            v-model="formData.parentId"
            :data="[{ label: '无', value: '' }, ...parentOptions]"
            :default-expanded-keys="[]"
            :render-after-expand="false"
            check-strictly
            clearable
            placeholder="请选择上级部门"
          >
            <template #default="{ node, data }">
              <span
                :style="
                  ancestorIds.includes(data.value) ? 'color: #409EFF; font-weight: bold;' : ''
                "
              >
                {{ data.label }}
              </span>
            </template>
          </ElTreeSelect>
          <div v-if="showAncestorPath" class="ancestor-path">
            <span class="org-path-text">组织路径：</span>
            <template v-for="(name, idx) in ancestorNames" :key="idx">
              <ElTag type="info" effect="plain" size="small" style="margin-right: 4px">{{
                name
              }}</ElTag>
              <span v-if="idx < ancestorNames.length - 1" style="color: #aaa; margin-right: 4px"
                >&gt;</span
              >
            </template>
          </div>
        </ElFormItem>
        <ElFormItem label="名称" prop="name">
          <ElInput
            v-model.trim="formData.name"
            maxlength="30"
            show-word-limit
            placeholder="请输入名称"
            clearable
          />
        </ElFormItem>
        <ElFormItem label="排序" prop="sort">
          <ElInputNumber v-model="formData.sort" :min="1" :max="9999" controls-position="right" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput
            v-model.trim="formData.desc"
            type="textarea"
            maxlength="200"
            show-word-limit
            placeholder="请输入描述"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch
            v-model="formData.status"
            active-value="启用"
            inactive-value="禁用"
            active-text="启用"
            inactive-text="禁用"
          />
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
  import { ref, computed, h, nextTick, reactive, watch, onMounted } from 'vue'
  import { ElMessage, ElTag, ElMessageBox } from 'element-plus'

  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import { useTable } from '@/composables/useTable'
  import type { SearchFormItem } from '@/types'
  import type { FormInstance, FormRules } from 'element-plus'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { OrganizationService, type OrganizationNode } from '@/api/organizationApi'
  import ArtExcelExport from '@/components/core/forms/art-excel-export/index.vue'
  import ArtExcelImport from '@/components/core/forms/art-excel-import/index.vue'

  // 定义本地组织节点类型，与前端模板兼容
  interface OrgNode {
    id: string
    name: string
    parentId: string | null
    status: '启用' | '禁用'
    sort: number
    desc?: string
    children?: OrgNode[]
    created_at?: string // 添加可选的创建时间字段
    updated_at?: string // 添加可选的更新时间字段
  }

  // 组织树数据
  const orgTree = ref<OrgNode[]>([])
  const loadingTree = ref(false)

  // 记录是否已确认删除带子部门的组织
  const hasConfirmedDelete = ref(false)

  // 添加按钮点击事件处理函数（用于事件绑定，接收MouseEvent）
  const handleAddClick = (evt?: MouseEvent) => {
    handleAdd()
  }

  // 编辑按钮点击事件（包装函数）
  const handleEditClick = (row: OrgNode) => {
    return (evt?: MouseEvent) => {
      handleEdit(row)
    }
  }

  // 删除按钮点击事件（包装函数）
  const handleDeleteClick = (row: OrgNode) => {
    return (evt?: MouseEvent) => {
      handleDelete(row)
    }
  }

  // 获取组织树数据
  const fetchOrganizationTree = async () => {
    loadingTree.value = true
    try {
      const response = await OrganizationService.getOrganizationTree()

      // 将API返回的数据转换为本地OrgNode格式
      const transformNode = (apiNode: OrganizationNode): OrgNode => ({
        id: apiNode.org_id,
        name: apiNode.name,
        parentId: apiNode.parent_id,
        status: apiNode.status === 'active' ? '启用' : '禁用',
        sort: apiNode.sort_order,
        desc: apiNode.description,
        children: apiNode.children ? apiNode.children.map(transformNode) : undefined
      })

      orgTree.value = response.organizations.map(transformNode)
    } catch (error) {
      console.error('获取组织树失败:', error)
      ElMessage.error('获取组织树数据失败')
    } finally {
      loadingTree.value = false
    }
  }

  // 组件挂载时获取组织树
  onMounted(() => {
    fetchOrganizationTree()
  })

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
    // 不需要分页重置
    // onCurrentPageChange(1);
    refreshAll()
  }

  /**
   * 执行搜索
   */
  function handleSearch() {
    // 不需要分页重置
    // onCurrentPageChange(1);
    refreshAll()
  }

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

  // 删除pagedTreeData计算属性，使用tableData代替
  // /**
  //  * 计算分页后的树形数据
  //  */
  // const pagedTreeData = computed(() => {
  //   const keyword = formFilters.value.name?.trim() || ''
  //   const filtered = filterOrgTree(orgTree.value, keyword)
  //
  //   const start = (paginationState?.current - 1) * paginationState?.size || 0
  //   const end = start + (paginationState?.size || 0)
  //
  //   return filtered.slice(start, end)
  // })

  /**
   * 刷新数据
   */
  function handleRefresh() {
    refreshAll()
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

  // 修改useTable的解构，移除分页相关的属性和方法
  const {
    columnChecks,
    columns,
    refreshAll,
    refreshSoft,
    refreshAfterCreate,
    refreshAfterUpdate,
    refreshAfterRemove,
    isLoading,
    // paginationState, // 删除paginationState
    // onPageSizeChange, // 删除分页大小变更处理函数
    // onCurrentPageChange, // 删除页码变更处理函数
    tableData // 保留tableData
  } = useTable<OrgNode>({
    // 核心配置
    core: {
      apiFn: async (params: any) => {
        // 模拟API请求
        await new Promise((resolve) => setTimeout(resolve, 500))

        // 实际项目中这里应该是调用API
        let filtered = orgTree.value

        // 根据搜索关键词过滤数据
        if (params.name && typeof params.name === 'string') {
          filtered = filterOrgTree(filtered, params.name)
        }

        // 返回符合API规范的响应，不再返回分页信息
        return {
          records: filtered,
          total: filtered.length
        }
      },
      apiParams: {
        name: ''
        // 移除分页参数
        // current: 1,
        // size: 10,
      } as any,
      immediate: true,
      columnsFactory: () => [
        { prop: 'name', label: '名称', minWidth: 180, showOverflowTooltip: true },
        {
          prop: 'status',
          label: '状态',
          width: 80,
          align: 'center',
          useSlot: true
        },
        { prop: 'desc', label: '描述', minWidth: 180, showOverflowTooltip: true },
        { prop: 'created_at', label: '创建时间', width: 170 },
        {
          prop: 'operation',
          label: '操作',
          width: 200,
          fixed: 'right',
          formatter: (row: OrgNode) => {
            // 这里直接返回一个包含按钮的div
            return h('div', [
              h(ArtButtonTable, {
                type: 'add',
                title: '添加子部门',
                onClick: () => handleAdd(row),
                disabled: row.status === '禁用'
              }),
              h(ArtButtonTable, {
                type: 'edit',
                title: '编辑部门',
                onClick: () => handleEdit(row)
              }),
              h(ArtButtonTable, {
                type: 'delete',
                title: '删除部门',
                onClick: () => handleDelete(row),
                disabled: row.children && row.children.length > 0 && !hasConfirmedDelete.value
              })
            ])
          }
        }
      ]
    },

    // 性能优化
    performance: {
      enableCache: true,
      cacheTime: 5 * 60 * 1000, // 5分钟
      debounceTime: 300
    },

    // 生命周期钩子
    hooks: {
      onSuccess: (data) => {
        console.log('数据加载成功:', data.length)
      },
      onError: (error) => {
        ElMessage.error(`数据加载失败: ${error.message}`)
      }
    }
  })

  /**
   * 打开添加组织对话框
   */
  function handleAdd(parentNode?: OrgNode) {
    dialogType.value = 'add'
    dialogVisible.value = true
    formData.value = {
      id: '',
      parentId: parentNode ? parentNode.id : '',
      name: '',
      sort: 1,
      desc: '',
      status: '启用'
    }
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }

  /**
   * 打开编辑组织对话框
   */
  function handleEdit(node: OrgNode) {
    dialogType.value = 'edit'
    dialogVisible.value = true
    formData.value = {
      id: node.id,
      parentId: node.parentId || '',
      name: node.name,
      sort: node.sort,
      desc: node.desc || '',
      status: node.status
    }
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }

  // 已删除重复的handleSubmit函数，使用handleDialogOk代替

  /**
   * 处理删除组织
   */
  function handleDelete(node: OrgNode) {
    // 检查是否有子节点，有子节点不允许删除
    const hasChildren = node.children && node.children.length > 0
    if (hasChildren) {
      ElMessage.warning('该组织下有子组织，不允许删除')
      return
    }

    ElMessageBox.confirm(`确定要删除组织 "${node.name}" 吗?`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          btnLoading.delete = true
          await OrganizationService.deleteOrganization(node.id)
          ElMessage.success('删除组织成功')
          // 重新获取组织树
          await fetchOrganizationTree()
        } catch (error) {
          console.error('删除组织失败:', error)
          ElMessage.error('删除组织失败')
        } finally {
          btnLoading.delete = false
        }
      })
      .catch(() => {
        // 取消删除
      })
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
    })
      .then(() => {
        dialogVisible.value = false
      })
      .catch(() => {
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
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (dialogType.value === 'add') {
        await handleAddOrg()
      } else {
        await handleEditOrg()
      }

      dialogVisible.value = false
      ElMessage.success(dialogType.value === 'add' ? '新增成功' : '编辑成功')

      // 刷新数据
      refreshAll()
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
    try {
      // 调用API创建组织
      await OrganizationService.createOrganization({
        name: formData.value.name.trim(),
        parent_id: formData.value.parentId || null,
        description: formData.value.desc.trim(),
        status: formData.value.status === '启用' ? 'active' : 'inactive',
        sort_order: formData.value.sort
      })

      // 重新获取组织树数据
      await fetchOrganizationTree()

      ElMessage.success('添加组织成功')
    } catch (error) {
      console.error('添加组织失败:', error)
      ElMessage.error('添加组织失败')
      throw error
    }
  }

  /**
   * 处理编辑组织
   */
  async function handleEditOrg() {
    try {
      // 调用API更新组织
      await OrganizationService.updateOrganization(formData.value.id, {
        name: formData.value.name.trim(),
        description: formData.value.desc.trim(),
        status: formData.value.status === '启用' ? 'active' : 'inactive',
        sort_order: formData.value.sort
      })

      // 若上级变更，需移动节点
      const node = findNodeById(orgTree.value, formData.value.id)
      if (node) {
        const oldParentId = await findParentId(orgTree.value, formData.value.id)
        if (oldParentId !== formData.value.parentId) {
          // 调用移动API
          await OrganizationService.moveOrganization({
            org_id: formData.value.id,
            new_parent_id: formData.value.parentId || '',
            update_children_path: false
          })
        }

        // 如果修改了状态为禁用，且有子节点，询问是否级联禁用子节点
        if (formData.value.status === '禁用' && node.children && node.children.length > 0) {
          try {
            await ElMessageBox.confirm('是否将所有子部门也设为禁用状态？', '级联设置', {
              confirmButtonText: '是',
              cancelButtonText: '否',
              type: 'warning',
              closeOnClickModal: false
            })

            // 这里应该有API支持级联更新，暂时在前端模拟
            updateChildrenStatus(node, '禁用')
          } catch (e) {
            // 用户选择不级联设置，不做处理
          }
        }
      }

      // 重新获取组织树数据
      await fetchOrganizationTree()

      ElMessage.success('编辑组织成功')
    } catch (error) {
      console.error('编辑组织失败:', error)
      ElMessage.error('编辑组织失败')
      throw error
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
    // 先添加所有祖先节点名称
    for (const id of ancestorIds.value) {
      const node = findNodeById(orgTree.value, id)
      if (node) {
        names.push(node.name)
      }
    }
    // 添加当前选中的父节点名称
    if (formData.value.parentId) {
      const parentNode = findNodeById(orgTree.value, formData.value.parentId)
      if (parentNode) {
        names.push(parentNode.name)
      }
    }
    return names
  })

  const showAncestorPath = computed(() => ancestorNames.value.length > 0)

  // 监听表单parentId变化，更新选择器key以强制刷新
  watch(
    () => formData.value.parentId,
    () => {
      treeSelectKey.value = Date.now()
    }
  )

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

  // 导出成功回调
  function handleExportSuccess() {
    ElMessage.success('导出成功！')
  }

  // 导入成功回调
  function handleImportSuccess(data: any) {
    ElMessage.success('导入成功！')
    // 导入成功后刷新数据
    refreshAll()
  }

  // 导入失败回调
  function handleImportError(error: any) {
    ElMessage.error(`导入失败: ${error.message}`)
  }

  // 导出列配置
  const exportColumns = computed(() => {
    return [
      { prop: 'name', label: '名称' },
      { prop: 'status', label: '状态' },
      { prop: 'desc', label: '描述' },
      { prop: 'created_at', label: '创建时间' },
      { prop: 'sort', label: '排序' }
    ]
  })
</script>

<style lang="scss" scoped>
  .organization-root {
    height: 100%;
    background: var(--art-main-bg-color);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .organization-page {
    // height: 100%;
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

  .toolbar-left {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .org-path-text {
    color: var(--el-color-primary);
  }

  // .art-table-card {
  //   background: var(--el-bg-color-overlay);
  //   border-radius: 12px;
  //   box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.06);
  //   margin: 6px 0 8px 0;
  //   flex: 1;
  //   display: flex;
  //   flex-direction: column;
  //   overflow: hidden;
  //   padding: 1px !important;

  //   :deep(.el-card__body) {
  //     flex: 1;
  //     display: flex;
  //     flex-direction: column;
  //     overflow: hidden;
  //     padding: 8px;
  //   }

  //   :deep(.art-table-wrapper) {
  //     flex: 1;
  //     overflow: auto;
  //   }
  // }

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
