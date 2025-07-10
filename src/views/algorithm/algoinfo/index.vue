<template>
  <div class="algo-info-root">

    <div class="algo-info-page art-full-height">
      <div class="layout-container">
        <!-- 左侧标签页导航 -->
        <div class="left-tabs">
          <div class="tabs-container">
            <div v-for="tab in algoTabs" :key="tab.name" class="tab-item"
              :class="{ 'active': activeTabName === tab.name }" @click="handleTabChange(tab.name)"
              @contextmenu.prevent="showTabMenu($event, tab)">
              <div class="tab-content">
                <i :class="getTabIcon(tab.name)" class="tab-icon"></i>
                <div class="tab-label" v-if="editingTab?.name !== tab.name">
                  {{ tab.label }}
                </div>
                <div v-else class="tab-edit-container">
                  <ElInput ref="tabEditInputRef" v-model="editingTab.label" size="small" class="edit-tab-input"
                    :maxlength="20" @blur="handleTabLabelEditComplete" @keyup.enter="handleTabLabelEditComplete"
                    @keyup.esc="cancelTabLabelEdit" placeholder="输入分类名称" autofocus />
                </div>
              </div>
            </div>

            <!-- 添加新标签页按钮 -->
            <div class="add-tab-button" @click="handleAddNewTab">
              <ElIcon>
                <Plus />
              </ElIcon>
            </div>
          </div>
        </div>

        <!-- 右侧内容区域 -->
        <div class="right-content">
          <ArtSearchBar v-model:filter="formFilters" :items="formItems" @reset="handleReset" @search="handleSearch" />
          <ElCard shadow="never" class="art-table-card">
            <ArtTableHeader v-model:columns="columnChecks" @refresh="handleRefresh"
              layout="refresh,size,fullscreen,columns,settings" fullClass="art-table-card">
              <template #left>
                <ElButton type="primary" @click="handleAddAlgo" v-ripple>
                  <ElIcon>
                    <Plus />
                  </ElIcon>
                  新增算法
                </ElButton>
                <ElButton type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete" v-ripple>
                  批量删除 ({{ selectedRows.length }})
                </ElButton>
              </template>
            </ArtTableHeader>
            <ArtTable ref="tableRef" :loading="isLoading" :pagination="paginationState" :data="tableData"
              :columns="columns" :table-config="{
                emptyHeight: '360px',
                showSummary: false
              }" :layout="{ marginTop: 10, showIndex: false }" @row:selection-change="handleSelectionChange"
              @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange">
              <!-- 特征信息列 -->
              <template #feature="{ row }">
                <ElTag v-if="row.feature" type="success" effect="light">{{ row.feature }}</ElTag>
                <ElTag v-else type="info" effect="light">未载入</ElTag>
              </template>

              <!-- 操作列 -->
              <template #operation="{ row }">
                <div class="operation-buttons">
                  <ArtButtonTable type="edit" :row="row" @click="handleEdit(row)" />
                  <ArtButtonTable type="delete" :row="row" @click="handleDelete(row)" />
                </div>
              </template>

              <!-- 空数据插槽 -->
              <template #empty>
                <div class="empty-data">
                  <ElEmpty :image-size="120" description="暂无数据">
                    <template #description>
                      <p>{{ !hasTabData ? '请先创建分类' : !activeTabName ? '请选择一个分类' : '当前分类下暂无算法数据' }}</p>
                    </template>
                    <ElButton v-if="hasTabData && activeTabName" type="primary" @click="handleAddAlgo" v-ripple>添加算法
                    </ElButton>
                    <ElButton v-else-if="!hasTabData" type="primary" @click="handleAddNewTab" v-ripple>创建分类</ElButton>
                  </ElEmpty>
                </div>
              </template>
            </ArtTable>
          </ElCard>
        </div>
      </div>
    </div>


    <!-- 算法新增/编辑弹窗 -->
    <ElDialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增算法' : '编辑算法'" width="500px" destroy-on-close
      @close="handleDialogClose">
      <ElForm :model="algorithmForm" :rules="rules" ref="formRef" label-width="100px">
        <ElFormItem label="算法名称" prop="label">
          <ElInput v-model="algorithmForm.label" placeholder="请输入算法名称" />
        </ElFormItem>
        <ElFormItem label="标识符" prop="value">
          <ElInput v-model="algorithmForm.value" placeholder="请输入标识符" @input="generateIdFromValue" />
        </ElFormItem>
        <ElFormItem label="算法描述" prop="desc">
          <ElInput v-model="algorithmForm.desc" type="textarea" :rows="3" placeholder="请输入算法描述" />
        </ElFormItem>
        <ElFormItem label="算法文件" prop="file" required>
          <ElUpload class="upload-box" drag action="#" :auto-upload="false" :limit="1" :on-exceed="handleExceed"
            :on-change="handleFileChange" :file-list="fileList" :on-remove="handleFileRemove"
            :before-upload="beforeFileUpload">
            <ElIcon class="el-icon--upload">
              <Upload />
            </ElIcon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持.zip/.rar/.pt/.pth/.model/.bin等格式，不超过100MB
              </div>
            </template>
          </ElUpload>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="handleCancel">取 消</ElButton>
          <ElButton type="primary" @click="handleSubmit">确 定</ElButton>
        </div>
      </template>
    </ElDialog>

    <!-- 标签页右键菜单 -->
    <ArtMenuRight ref="tabMenuRef" :menu-items="tabMenuItems" :menu-width="120" @select="handleTabMenuSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, h, computed, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox, ElPopconfirm, ElDialog, ElImageViewer } from 'element-plus'
import { ElCard, ElButton, ElTableColumn, ElForm, ElFormItem, ElInput, ElSelect, ElUpload, ElIcon, ElOption, ElTag } from 'element-plus'
import { mockAlgoList } from '@/mock/temp/algoList'

import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
import ArtTable from '@/components/core/tables/art-table/index.vue'
import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
import ArtMenuRight from '@/components/core/others/art-menu-right/index.vue'
import { useTable } from '@/composables/useTable'
import type { SearchFormItem } from '@/types'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import type { MenuItemType } from '@/components/core/others/art-menu-right/index.vue'
import { Upload, Plus, Delete } from '@element-plus/icons-vue'

// 定义算法数据结构接口 - 使更宽松的类型定义来匹配现有数据
interface AlgorithmItem {
  id: string
  label: string
  value: string
  type?: string  // 改为可选字段
  desc: string
  file?: string  // 改为可选字段
  createTime: string
  [key: string]: any  // 添加索引签名以允许其他可能的字段
}

interface TabItem {
  name: string
  label: string
  items: AlgorithmItem[]
}

// 自定义防抖函数
const debounce = (fn: Function, delay: number) => {
  let timer: number | null = null
  return function (this: any, ...args: any[]) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay) as unknown as number
  }
}

// 生成唯一标识符
const generateUniqueId = (prefix: string) => {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

defineOptions({ name: 'AlgoInfo' })

// 保存创建的对象URL，以便在组件卸载时释放
const createdObjectUrls = ref<string[]>([])

// 页面卸载前清理创建的对象URL，避免内存泄漏
onBeforeUnmount(() => {
  createdObjectUrls.value.forEach(url => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  })
})

// 检查是否有标签页数据，使用明确的类型
const algoTabs = ref<TabItem[]>(mockAlgoList || [])
const hasTabData = computed(() => algoTabs.value.length > 0)
const activeTabName = ref(hasTabData.value ? algoTabs.value[0]?.name || '' : '')
const selectedRows = ref<AlgorithmItem[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const fileList = ref<UploadFile[]>([])
const formRef = ref<FormInstance>()

// 编辑标签相关
const editingTab = ref<TabItem | null>(null)
const tabEditInputRef = ref<InstanceType<typeof ElInput> | null>(null)
const editingTabOriginalLabel = ref('') // 保存原始标签名，用于取消编辑时恢复

// 右键菜单相关
const tabMenuRef = ref<InstanceType<typeof ArtMenuRight>>()
const currentRightClickTab = ref<TabItem | null>(null)

// 右键菜单项
const tabMenuItems = computed((): MenuItemType[] => {
  const isDefault = isDefaultTab(currentRightClickTab.value?.name || '')
  return [
    {
      key: 'rename',
      label: '重命名',
      icon: '&#xe706;'
    },
    {
      key: 'delete',
      label: '删除',
      icon: '&#xe850;',
      disabled: isDefault
    }
  ]
})

// 默认标签列表，这些标签不能被删除
const defaultTabs: string[] = []

// 筛选表单
const formFilters = ref({
  label: '',
  value: ''
})

// 表单数据
const algorithmForm = reactive({
  id: '',
  label: '',
  value: '',
  type: '',
  desc: '',
  file: ''
})

// 表单验证规则
const rules: FormRules = {
  label: [
    { required: true, message: '请输入算法名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  value: [
    { required: true, message: '请输入标识符', trigger: 'blur' },
    { pattern: /^[a-z0-9_]+$/, message: '只能包含小写字母、数字和下划线', trigger: 'blur' }
  ],
  file: [{ required: true, message: '请上传算法文件', trigger: 'change' }]
}

// 搜索表单配置
const formItems: SearchFormItem[] = [
  {
    label: '算法名称',
    prop: 'label',
    type: 'input',
    config: {
      placeholder: '请输入算法名称',
      clearable: true
    }
  },
  {
    label: '标识符',
    prop: 'value',
    type: 'input',
    config: {
      placeholder: '请输入标识符',
      clearable: true
    }
  }
]

// 定义数据状态
const loading = ref(false)
const tableData = ref<AlgorithmItem[]>([])
const tableRef = ref()
// 删除自定义的pagination对象
// const pagination = reactive({
//   current: 1,
//   size: 20,
//   total: 0
// })

// 使用 useTable 管理表格数据
const fetchData = async (params: any) => {
  // 获取当前选中的标签页数据
  const currentTab = algoTabs.value.find(tab => tab.name === activeTabName.value)
  if (!currentTab) {
    return {
      records: [],
      total: 0,
      size: params.size,
      current: params.current
    }
  }

  // 延迟模拟API调用
  await new Promise(resolve => setTimeout(resolve, 300))

  // 过滤数据
  let filteredData = [...currentTab.items]

  // 按名称筛选
  if (params.label) {
    filteredData = filteredData.filter(item =>
      item.label.toLowerCase().includes(params.label.toLowerCase())
    )
  }

  // 按标识符筛选
  if (params.value) {
    filteredData = filteredData.filter(item =>
      item.value.toLowerCase().includes(params.value.toLowerCase())
    )
  }

  // 分页
  const total = filteredData.length
  const start = (params.current - 1) * params.size
  const end = start + params.size
  const records = filteredData.slice(start, end)

  return {
    records,
    total,
    size: params.size,
    current: params.current,
    pages: Math.ceil(total / params.size)
  }
}

// 修改useTable的解构，添加paginationState和分页处理函数
const {
  refreshAll,
  refreshSoft,
  refreshAfterCreate,
  refreshAfterUpdate,
  refreshAfterRemove,
  columns,
  columnChecks,
  isLoading,
  searchDataDebounced,
  paginationState, // 添加paginationState
  onPageSizeChange, // 添加分页大小变更处理函数
  onCurrentPageChange // 添加页码变更处理函数
} = useTable<AlgorithmItem>({
  // 核心配置
  core: {
    apiFn: fetchData,
    apiParams: {
      current: 1,
      size: 20,
      label: '',
      value: ''
    } as any,
    immediate: false, // 初始不加载，等待标签页选择
    columnsFactory: () => [
      { type: 'selection', width: 55 },
      { type: 'index', label: '序号', width: 60, checked: false },
      { prop: 'id', label: 'ID', minWidth: 120, checked: false },
      { prop: 'label', label: '算法名称', minWidth: 120 },
      { prop: 'value', label: '标识符', minWidth: 120 },
      { prop: 'desc', label: '描述', minWidth: 180 },
      { prop: 'file', label: '算法文件', minWidth: 120 },
      { prop: 'createTime', label: '创建时间', minWidth: 150 },
      {
        prop: 'operation',
        label: '操作',
        width: 240,
        fixed: 'right',
        formatter: (row: AlgorithmItem) => {
          return h('div', [
            h(ArtButtonTable, {
              type: 'edit',
              onClick: () => handleEdit(row)
            }),
            h(ArtButtonTable, {
              type: 'delete',
              onClick: () => handleDelete(row)
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
      tableData.value = data
    },
    onError: (error) => {
      ElMessage.error(`数据加载失败: ${error.message}`)
    },
    onCacheHit: (data) => {
      console.log('使用缓存数据:', data.length)
      tableData.value = data
    }
  }
})

// 自定义查询
const handleSearch = () => {
  searchDataDebounced({
    ...formFilters.value,
    current: 1
  })
}

// 自定义重置
const handleReset = () => {
  formFilters.value.label = ''
  formFilters.value.value = ''
  searchDataDebounced({
    label: '',
    value: '',
    current: 1
  })
}

// 自定义刷新
const handleRefresh = debounce(() => {
  refreshAll()
}, 300)

// 选择变更处理
const handleSelectionChange = (selection: AlgorithmItem[]) => {
  selectedRows.value = selection
}

// 获取标签对应图标
const getTabIcon = (tabName: string) => {
  const iconMap = {
    car: 'iconfont-sys icon-cheguanjia',
    person: 'iconfont-sys icon-user-monitoring',
    risk_control: 'iconfont-sys icon-alarm-clock',
    industry_specific: 'iconfont-sys icon-settings'
  }
  return iconMap[tabName as keyof typeof iconMap] || 'iconfont-sys icon-data-analysis'
}

// 切换标签页
const handleTabChange = (tabName: string) => {
  // 如果当前有正在编辑的标签，先保存或取消编辑
  if (editingTab.value) {
    handleTabLabelEditComplete()
  }
  activeTabName.value = tabName
  // 刷新数据
  refreshAll()
}

// 检查是否是默认标签（不能删除）
const isDefaultTab = (tabName: string) => {
  return defaultTabs.includes(tabName)
}

// 右键菜单显示
const showTabMenu = (e: MouseEvent, tab: TabItem) => {
  currentRightClickTab.value = tab
  nextTick(() => {
    tabMenuRef.value?.show(e)
  })
}

// 处理右键菜单选择
const handleTabMenuSelect = (item: any) => {
  if (!currentRightClickTab.value) return

  if (typeof item === 'string') {
    handleTabAction(item)
  } else if (item && typeof item === 'object' && 'key' in item) {
    handleTabAction(item.key)
  }
}

// 标签页操作处理
const handleTabAction = (key: string) => {
  if (!currentRightClickTab.value) return

  switch (key) {
    case 'rename':
      startTabLabelEdit(currentRightClickTab.value)
      break
    case 'delete':
      handleDeleteTab(currentRightClickTab.value)
      break
  }
}

// 开始编辑标签名称
const startTabLabelEdit = (tab: TabItem) => {
  editingTab.value = tab
  editingTabOriginalLabel.value = tab.label

  nextTick(() => {
    if (tabEditInputRef.value) {
      tabEditInputRef.value.$el.querySelector('input')?.focus()
    }
  })
}

// 完成标签名称编辑
const handleTabLabelEditComplete = () => {
  if (!editingTab.value) return

  // 验证标签名不为空
  if (!editingTab.value.label.trim()) {
    editingTab.value.label = editingTabOriginalLabel.value
    ElMessage.warning('标签名不能为空')
  }

  // 清除编辑状态
  editingTab.value = null
  editingTabOriginalLabel.value = ''
}

// 取消标签名称编辑
const cancelTabLabelEdit = () => {
  if (!editingTab.value) return

  // 恢复原标签名
  editingTab.value.label = editingTabOriginalLabel.value

  // 清除编辑状态
  editingTab.value = null
  editingTabOriginalLabel.value = ''
}

// 处理删除标签页
const handleDeleteTab = (tab: TabItem) => {
  if (isDefaultTab(tab.name)) {
    ElMessage.warning('默认标签不能删除')
    return
  }

  ElMessageBox.confirm(`确定要删除标签"${tab.label}"吗？标签下的所有算法数据将被删除。`, '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 从标签列表中移除
    const index = algoTabs.value.findIndex(t => t.name === tab.name)
    if (index !== -1) {
      algoTabs.value.splice(index, 1)

      // 如果删除的是当前活动标签，则切换到其他标签
      if (activeTabName.value === tab.name) {
        activeTabName.value = algoTabs.value.length > 0 ? algoTabs.value[0].name : ''
      }

      ElMessage.success('删除成功')
      refreshAll()
    }
  }).catch(() => {
    // 用户取消，不做处理
  })
}

// 添加新标签页
const handleAddNewTab = () => {
  ElMessageBox.prompt('请输入新标签名称（创建分类后右键可编辑）', '添加标签', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: '默认分类', // 默认填写"默认分类"
    inputValidator: (value) => {
      if (!value.trim()) return '标签名不能为空'
      if (algoTabs.value.some(tab => tab.label === value.trim())) return '标签名已存在'
      return true
    }
  }).then(({ value }) => {
    // 生成唯一标识
    const name = 'algo-' + Date.now()

    // 创建新标签
    const newTab: TabItem = {
      name,
      label: value.trim(),
      items: []
    }

    // 添加到标签列表
    algoTabs.value.push(newTab)

    // 切换到新标签
    activeTabName.value = name

    ElMessage.success('添加成功')
    refreshAll()
  }).catch(() => {
    // 用户取消，不做处理
  })
}

// 修改新增算法函数，当没有标签页时，先提示创建分类然后弹出命名对话框
const handleAddAlgo = () => {
  if (!hasTabData.value) {
    // 如果没有标签页，先提示创建分类
    ElMessageBox.confirm('您还没有创建分类，是否立即创建？', '提示', {
      confirmButtonText: '创建分类',
      cancelButtonText: '取消',
      type: 'info'
    }).then(() => {
      // 用户确认后弹出创建分类对话框
      handleAddNewTab()
    }).catch(() => {
      // 用户取消，不做处理
    })
    return
  }

  if (!activeTabName.value) {
    ElMessage.warning('请先选择一个分类')
    return
  }

  // 重置表单
  resetForm()

  // 打开添加对话框
  dialogMode.value = 'add'
  dialogVisible.value = true
}

// 从value生成ID
const generateIdFromValue = () => {
  if (algorithmForm.value && dialogMode.value === 'add') {
    algorithmForm.id = 'algo-' + algorithmForm.value.toLowerCase()
  }
}

// 编辑算法
const handleEdit = (row: AlgorithmItem) => {
  // 填充表单数据
  algorithmForm.id = row.id
  algorithmForm.label = row.label
  algorithmForm.value = row.value
  algorithmForm.desc = row.desc
  algorithmForm.file = row.file || ''

  // 清空文件列表
  fileList.value = []

  // 如果有文件，添加到文件列表，用于预览
  if (row.file) {
    fileList.value.push({
      name: row.file.split('/').pop() || 'algorithm.bin',
      url: row.file
    } as UploadFile)
  }

  // 打开编辑对话框
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

// 删除算法
const handleDelete = (row: AlgorithmItem) => {
  ElMessageBox.confirm(`确定要删除"${row.label}"算法吗？`, '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 找到当前活动标签
    const activeTab = algoTabs.value.find(tab => tab.name === activeTabName.value)
    if (!activeTab) return

    // 从标签项中删除数据
    const index = activeTab.items.findIndex(item => item.id === row.id)
    if (index !== -1) {
      activeTab.items.splice(index, 1)

      // 刷新表格
      refreshAfterRemove()

      ElMessage.success('删除成功')
    }
  }).catch(() => {
    // 用户取消，不做处理
  })
}

// 批量删除
const handleBatchDelete = () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择要删除的算法')
    return
  }

  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个算法吗？`, '批量删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 找到当前活动标签
    const activeTab = algoTabs.value.find(tab => tab.name === activeTabName.value)
    if (!activeTab) return

    // 获取要删除的ID列表
    const idsToDelete = selectedRows.value.map(row => row.id)

    // 过滤掉要删除的项
    activeTab.items = activeTab.items.filter(item => !idsToDelete.includes(item.id))

    // 清空选中
    selectedRows.value = []

    // 刷新表格
    refreshAfterRemove()

    ElMessage.success(`成功删除 ${idsToDelete.length} 个算法`)
  }).catch(() => {
    // 用户取消，不做处理
  })
}

// 当前标签页的标签名
const currentTabLabel = computed(() => {
  const currentTab = algoTabs.value.find(tab => tab.name === activeTabName.value)
  return currentTab?.label || ''
})

// 重置表单
const resetForm = () => {
  algorithmForm.id = ''
  algorithmForm.label = ''
  algorithmForm.value = ''
  algorithmForm.desc = ''
  algorithmForm.file = ''

  // 清空文件列表
  fileList.value = []

  // 重置表单验证
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 上传相关
const handleExceed = () => {
  ElMessage.warning('最多只能上传1个文件')
}

const handleFileChange = (file: UploadFile) => {
  // 预览文件
  if (file.raw) {
    algorithmForm.file = file.name
  }
}

const handleFileRemove = () => {
  algorithmForm.file = ''
}

const beforeFileUpload = (file: File) => {
  // 检查文件类型
  const allowedExtensions = ['.zip', '.rar', '.pt', '.pth', '.model', '.bin']
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
  const isAllowedType = allowedExtensions.includes(extension)

  if (!isAllowedType) {
    ElMessage.error('只能上传指定格式的文件')
    return false
  }

  // 检查文件大小（100MB）
  const isLt100M = file.size / 1024 / 1024 < 100
  if (!isLt100M) {
    ElMessage.error('文件大小不能超过100MB')
    return false
  }

  return true
}

// 处理表单提交
const handleSubmit = () => {
  if (!formRef.value) return

  formRef.value.validate((valid) => {
    if (valid) {
      // 找到当前活动标签
      const activeTab = algoTabs.value.find(tab => tab.name === activeTabName.value)
      if (!activeTab) return

      if (dialogMode.value === 'add') {
        // 创建新数据
        const newItem: AlgorithmItem = {
          id: algorithmForm.id || `algo-${Date.now()}`,
          label: algorithmForm.label,
          value: algorithmForm.value,
          desc: algorithmForm.desc,
          file: algorithmForm.file,
          createTime: new Date().toLocaleString()
        }

        // 添加到当前标签
        activeTab.items.unshift(newItem)

        ElMessage.success('添加算法成功')
        refreshAfterCreate()
      } else {
        // 更新现有数据
        const index = activeTab.items.findIndex(item => item.id === algorithmForm.id)
        if (index !== -1) {
          // 保留创建时间
          const createTime = activeTab.items[index].createTime

          // 更新数据
          activeTab.items[index] = {
            ...algorithmForm,
            createTime
          } as AlgorithmItem

          ElMessage.success('更新算法成功')
          refreshAfterUpdate()
        }
      }

      // 关闭对话框
      dialogVisible.value = false
    }
  })
}

// 取消表单
const handleCancel = () => {
  dialogVisible.value = false
}

// 对话框关闭时的处理
const handleDialogClose = () => {
  // 重置表单
  resetForm()
}

// 页面初始化
onMounted(() => {
  // 检查是否有标签页数据
  if (algoTabs.value.length === 0) {
    // 如果没有标签页，弹出创建默认分类的对话框
    ElMessageBox.prompt('请输入分类名称（创建分类后右键可编辑）', '创建分类', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: '默认分类', // 默认填写"默认分类"
      inputValidator: (value) => {
        if (!value.trim()) return '分类名不能为空'
        return true
      }
    }).then(({ value }) => {
      // 生成唯一标识
      const name = 'algo-' + Date.now()

      // 创建新标签
      const newTab: TabItem = {
        name,
        label: value.trim(),
        items: []
      }

      // 添加到标签列表
      algoTabs.value.push(newTab)

      // 切换到新标签
      activeTabName.value = name

      ElMessage.success('创建分类成功')
      refreshAll()
    }).catch(() => {
      // 用户取消，不做任何处理
    })
  } else {
    // 有标签页数据，初始加载数据
    if (activeTabName.value) {
      refreshAll()
    }
  }
})

// 分页处理函数修改为使用useTable返回的方法
const handleSizeChange = (size: number) => {
  onPageSizeChange(size)
}

const handleCurrentChange = (current: number) => {
  onCurrentPageChange(current)
}
</script>

<style lang="scss" scoped>
.algo-info-root {
  width: 100%;
  height: 100%;
}

.algo-info-page {
  display: flex;
  flex-direction: column;
  // height: 100%;
  background: var(--art-main-bg-color);
}

.layout-container {
  display: flex;
  height: 100%;
  width: 100%;
}

.left-tabs {
  background: var(--art-main-bg-color);
  display: flex;
  flex-direction: column;
  color: var(--art-sidebar-text-color);
  height: 100%;
  width: 150px;
  border: 1px solid var(--art-border-color);
  border-radius: 10px;
  overflow-y: auto;
}

.tabs-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.tab-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 46px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
  color: var(--art-text-color);
  font-size: 14px;

  &:hover {
    background-color: var(--el-color-primary-light-8);
    color: var(--el-color-primary);
  }

  &.active {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }

  .tab-content {
    display: flex;
    align-items: center;
    flex: 1;
    overflow: hidden;
  }

  .tab-icon {
    margin-right: 10px;
    font-size: 16px;
    color: var(--art-text-color-secondary);
    flex-shrink: 0;
  }

  &.active .tab-icon {
    color: var(--el-color-primary);
  }

  .tab-label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
  }

  .tab-edit-container {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .edit-tab-input {
    width: 100%;
  }
}

.add-tab-button {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--el-primary-color);
  transition: all 0.3s;
  margin: 12px auto;
  width: 32px;
  height: 32px;
  border-radius: 50%;

  &:hover {
    background-color: var(--el-color-primary-light-7);
    color: var(--art-primary-hover-color);
    transform: scale(1.05);
  }

  i {
    font-size: 16px;
    font-weight: bold;
  }

  .el-icon-plus {
    &::before {
      content: "+";
      font-weight: bold;
    }
  }
}

.right-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-left: 8px;
  overflow: hidden;
  background-color: var(--art-main-bg-color);
}

// .art-table-card {
//   background: var(--art-root-card-border-color);
//   border-radius: 10px;
//   margin-top: 8px;
//   flex: 1;
//   display: flex;
//   flex-direction: column;
//   overflow: hidden;
// }

:deep(.el-card__body) {
  padding: 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.el-table) {
  border-radius: 8px;
  flex: 1;
}

:deep(.el-table__cell) {
  font-size: 14px;
  color: var(--art-text-gray-800);
  line-height: 1.6;
}

:deep(.el-table__header th) {
  font-weight: 600;
  background: var(--art-main-bg-color);
}

:deep(.el-pagination .el-pagination__total) {
  margin-right: 16px;
}

:deep(.el-pagination .el-pagination__sizes) {
  margin-right: 16px;
}

.upload-box {
  width: 100%;
}

.dialog-footer {
  padding-top: 10px;
  text-align: right;
}

:deep(.el-upload-dragger) {
  --el-upload-dragger-padding-horizontal: 10px;
  --el-upload-dragger-padding-vertical: 10px;
}

// 修改输入框样式
:deep(.el-input.edit-tab-input .el-input__wrapper) {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  border: none;
  border-bottom: 1px dashed var(--el-color-primary);
  border-radius: 0;
}

:deep(.el-input.edit-tab-input .el-input__inner) {
  height: 28px;
  font-size: 14px;
  color: var(--el-color-primary) !important;
  font-family: inherit;
  font-weight: 500;
  padding: 0 !important;
  width: 100%;
}

/* 添加空数据样式 */
.empty-data {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 300px;
  text-align: center;

  p {
    margin: 8px 0;
    color: var(--el-text-color-secondary);
  }

  .el-button {
    margin-top: 16px;
  }
}
</style>
