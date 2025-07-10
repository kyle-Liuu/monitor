<template>
  <div class="open-repo-root">

    <div class="open-repo-page art-full-height">
      <div class="layout-container">
        <!-- 左侧标签页导航 -->
        <div class="left-tabs">
          <div class="tabs-container">
            <div v-for="tab in openTabs" :key="tab.name" class="tab-item"
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
                <ElButton type="primary" @click="handleAddOpen" v-ripple>
                  <ElIcon>
                    <Plus />
                  </ElIcon>
                  新增
                </ElButton>
                <ElButton type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete" v-ripple>
                  批量删除 ({{ selectedRows.length }})
                </ElButton>
                <ElButton type="warning" @click="handleLoadOpenFeatures" v-ripple>
                  载入特征
                </ElButton>
              </template>
            </ArtTableHeader>
            <ArtTable ref="tableRef" :loading="loading" :pagination="paginationState" :data="tableData"
              :columns="columns" :table-config="{
                emptyHeight: '360px',
                showSummary: false
              }" :layout="{ marginTop: 10, showIndex: false }" @row:selection-change="handleSelectionChange"
              @pagination:size-change="handleSizeChange" @pagination:current-change="handleCurrentChange">
              <!-- 图片列 -->
              <template #image="{ row }">
                <div @click="handleImageClick(row.image)">
                  <ElImage style="width: 50px; height: 50px; border-radius: 4px; cursor: pointer;" :src="row.image"
                    fit="cover" />
                </div>
              </template>

              <!-- 特征图列 -->
              <template #openFeature="{ row }">
                <div @click="handleImageClick(row.openFeature)" v-if="row.openFeature">
                  <ElImage style="width: 50px; height: 50px; border-radius: 4px; cursor: pointer;"
                    :src="row.openFeature" fit="cover" />
                </div>
                <span v-else>暂无特征</span>
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
                      <p>{{ !hasTabData ? '请先创建分类' : !activeTabName ? '请选择一个分类' : '当前分类下暂无数据' }}</p>
                    </template>
                    <ElButton v-if="hasTabData && activeTabName" type="primary" @click="handleAddOpen" v-ripple>添加
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


    <!-- 新增/编辑弹窗 -->
    <ElDialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增信息' : '编辑信息'" width="500px" destroy-on-close
      @close="handleDialogClose">
      <ElForm :model="openForm" :rules="rules" ref="formRef" label-width="100px">
        <ElFormItem label="名称" prop="name">
          <ElInput v-model="openForm.name" placeholder="请输入名称" />
        </ElFormItem>
        <ElFormItem label="描述" prop="desc">
          <ElInput v-model="openForm.desc" type="textarea" :rows="3" placeholder="请输入描述" />
        </ElFormItem>
        <ElFormItem label="图片" prop="image" required>
          <ElUpload class="upload-box" drag action="#" :auto-upload="false" :limit="1" :on-exceed="handleExceed"
            :on-change="handleFileChange" :file-list="fileList" :on-remove="handleFileRemove"
            :before-upload="beforeFileUpload" accept="image/*">
            <ElIcon class="el-icon--upload">
              <Upload />
            </ElIcon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传JPG/PNG图片，且不超过2MB
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

    <!-- 图片预览 -->
    <ElImageViewer v-if="showViewer" @close="showViewer = false" :url-list="previewImages" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, h, computed, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox, ElDialog, ElImageViewer } from 'element-plus'
import { ElCard, ElButton, ElTableColumn, ElForm, ElFormItem, ElInput, ElSelect, ElUpload, ElIcon, ElOption, ElInputNumber, ElImage } from 'element-plus'
import { mockOpenList } from '@/mock/temp/openList'

import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
import ArtTable from '@/components/core/tables/art-table/index.vue'
import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
import ArtMenuRight from '@/components/core/others/art-menu-right/index.vue'
import { useTable } from '@/composables/useTable'
import type { SearchFormItem } from '@/types'
import type { FormInstance, FormRules, UploadFile, UploadUserFile } from 'element-plus'
import type { MenuItemType } from '@/components/core/others/art-menu-right/index.vue'
import { Upload, Delete, ZoomIn, Plus } from '@element-plus/icons-vue'

// 定义标签页数据结构接口
interface OpenItem {
  id: string
  name: string
  desc: string
  image: string
  openFeature: string
  createTime: string
}

interface TabItem {
  name: string
  label: string
  items: OpenItem[]
}

// 使用lodash原生方法，不依赖lodash-es
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

defineOptions({ name: 'RepositoryOpen' })

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
const openTabs = ref<TabItem[]>(mockOpenList || [])
const hasTabData = computed(() => openTabs.value.length > 0)
const activeTabName = ref(hasTabData.value ? openTabs.value[0]?.name || '' : '')
const selectedRows = ref<OpenItem[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const fileList = ref<UploadFile[]>([])
const formRef = ref<FormInstance>()

// 图片预览相关
const showViewer = ref(false)
const previewImages = ref<string[]>([])

// 编辑标签相关
const editingTab = ref<TabItem | null>(null)
const tabEditInputRef = ref<InstanceType<typeof ElInput> | null>(null)
const editingTabOriginalLabel = ref('') // 保存原始标签名，用于取消编辑时恢复

// 右键菜单相关
const tabMenuRef = ref<InstanceType<typeof ArtMenuRight>>()
const currentRightClickTab = ref<TabItem | null>(null)

// 图片点击预览处理
const handleImageClick = (url: string) => {
  if (url) {
    previewImages.value = [url]
    showViewer.value = true
  }
}

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
  name: ''
})

// 表单数据
const openForm = reactive({
  id: '',
  name: '',
  desc: '',
  image: '',
  openFeature: ''
})

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  image: [{ required: true, message: '请上传图片', trigger: 'change' }]
}

// 筛选表单配置
const formItems: SearchFormItem[] = [
  {
    label: '名称',
    prop: 'name',
    type: 'input',
    config: {
      placeholder: '请输入名称',
      clearable: true
    }
  }
]

// 定义数据状态
const loading = ref(false)
// 删除重复声明的tableData
// const tableData = ref<OpenItem[]>([])

// 使用 useTable 管理表格数据
const fetchData = async (params: any) => {
  // 获取当前选中的标签页数据
  const currentTab = openTabs.value.find(tab => tab.name === activeTabName.value)
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
  if (params.name) {
    filteredData = filteredData.filter(item =>
      item.name.toLowerCase().includes(params.name.toLowerCase())
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
  tableData, // 添加tableData
  paginationState, // 添加paginationState
  onPageSizeChange, // 添加分页大小变更处理函数
  onCurrentPageChange // 添加页码变更处理函数
} = useTable<OpenItem>({
  // 核心配置
  core: {
    apiFn: fetchData,
    apiParams: {
      current: 1,
      size: 20,
      name: ''
    } as any,
    immediate: false, // 初始不加载，等待标签页选择
    columnsFactory: () => [
      { type: 'selection', width: 55 },
      { type: 'index', label: '序号', width: 60, checked: false },
      { prop: 'name', label: '名称', minWidth: 100 },
      { prop: 'image', label: '图片', width: 80 },
      { prop: 'openFeature', label: '特征图', width: 80 },
      { prop: 'desc', label: '描述', minWidth: 180 },
      { prop: 'createTime', label: '创建时间', minWidth: 150 },
      {
        prop: 'operation',
        label: '操作',
        width: 240,
        fixed: 'right',
        formatter: (row: OpenItem) => {
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
      loading.value = false;
    },
    onError: (error) => {
      ElMessage.error(`数据加载失败: ${error.message}`)
      loading.value = false;
    }
  }
})

// 表格刷新，增加防抖处理
const handleRefresh = debounce(() => {
  // 获取表格数据
  refreshAll();
}, 300)

// 获取表格数据
const getTableData = () => {
  // 显示加载状态
  loading.value = true

  // 调用refreshAll触发数据刷新
  refreshAll();
}

// 分页处理函数
const handleSizeChange = (size: number) => {
  onPageSizeChange(size);
}

const handleCurrentChange = (current: number) => {
  onCurrentPageChange(current);
}

// 监听标签页切换，更新表格数据
watch(activeTabName, (newVal) => {
  if (newVal) {
    // 重置分页到第一页
    onCurrentPageChange(1)
    // 清空选中行
    selectedRows.value = []
    // 加载新数据
    getTableData()
  }
})

// 处理表单搜索和重置
const handleReset = () => {
  formFilters.value.name = ''
  onCurrentPageChange(1);
  getTableData();
}

const handleSearch = () => {
  onCurrentPageChange(1);
  getTableData();
}

// 选择变更处理
const handleSelectionChange = (selection: OpenItem[]) => {
  selectedRows.value = selection
}

// 获取标签对应图标
const getTabIcon = (tabName: string) => {
  const iconMap = {
    staff: 'iconfont-sys icon-user-monitoring',
    visitor: 'iconfont-sys icon-user',
    vip: 'iconfont-sys icon-crown',
    blacklist: 'iconfont-sys icon-warning'
  }
  return iconMap[tabName as keyof typeof iconMap] || 'iconfont-sys icon-people'
}

// 切换标签页
const handleTabChange = (tabName: string) => {
  // 如果当前有正在编辑的标签，先保存或取消编辑
  if (editingTab.value) {
    handleTabLabelEditComplete()
  }
  activeTabName.value = tabName
}

// 检查是否是默认标签（不能删除）
const isDefaultTab = (tabName: string) => {
  return defaultTabs.includes(tabName)
}

// 标签页右键菜单
const showTabMenu = (e: MouseEvent, tab: TabItem) => {
  currentRightClickTab.value = tab

  nextTick(() => {
    tabMenuRef.value?.show(e)
  })
}

// 处理标签菜单选择
const handleTabMenuSelect = (item: any) => {
  if (!currentRightClickTab.value) return

  if (typeof item === 'string') {
    // 处理字符串类型的参数
    handleTabAction(item)
  } else if (item && typeof item === 'object' && 'key' in item) {
    // 处理对象类型的参数
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

  // 等待DOM更新后，聚焦输入框
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

  ElMessageBox.confirm(`确定要删除标签"${tab.label}"吗？标签下的所有数据将被删除。`, '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 从标签列表中移除
    const index = openTabs.value.findIndex(t => t.name === tab.name)
    if (index !== -1) {
      openTabs.value.splice(index, 1)

      // 如果删除的是当前活动标签，则切换到其他标签
      if (activeTabName.value === tab.name) {
        activeTabName.value = openTabs.value.length > 0 ? openTabs.value[0].name : ''
      }

      ElMessage.success('删除成功')
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
      if (openTabs.value.some(tab => tab.label === value.trim())) return '标签名已存在'
      return true
    }
  }).then(({ value }) => {
    // 生成唯一标识
    const name = 'tab-' + Date.now()

    // 创建新标签
    const newTab: TabItem = {
      name,
      label: value.trim(),
      items: []
    }

    // 添加到标签列表
    openTabs.value.push(newTab)

    // 切换到新标签
    activeTabName.value = name

    ElMessage.success('添加成功')
  }).catch(() => {
    // 用户取消，不做处理
  })
}

// 修改新增信息函数，当没有标签页时，先提示创建分类然后弹出命名对话框
const handleAddOpen = () => {
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
  resetOpenForm()

  // 打开添加对话框
  dialogMode.value = 'add'
  dialogVisible.value = true
}

// 编辑信息
const handleEdit = (row: OpenItem) => {
  // 填充表单数据
  openForm.id = row.id
  openForm.name = row.name
  openForm.desc = row.desc
  openForm.image = row.image
  openForm.openFeature = row.openFeature

  // 清空文件列表
  fileList.value = []

  // 如果有图片，添加到文件列表，用于预览
  if (row.image) {
    fileList.value.push({
      name: 'image.jpg',
      url: row.image
    } as UploadFile)
  }

  // 打开编辑对话框
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

// 删除信息
const handleDelete = (row: OpenItem) => {
  ElMessageBox.confirm(`确定要删除"${row.name}"的信息吗？`, '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 找到当前活动标签
    const activeTab = openTabs.value.find(tab => tab.name === activeTabName.value)
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
    ElMessage.warning('请先选择要删除的数据')
    return
  }

  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条数据吗？`, '批量删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 找到当前活动标签
    const activeTab = openTabs.value.find(tab => tab.name === activeTabName.value)
    if (!activeTab) return

    // 获取要删除的ID列表
    const idsToDelete = selectedRows.value.map(row => row.id)

    // 过滤掉要删除的项
    activeTab.items = activeTab.items.filter(item => !idsToDelete.includes(item.id))

    // 清空选中
    selectedRows.value = []

    // 刷新表格
    refreshAfterRemove()

    ElMessage.success(`成功删除 ${idsToDelete.length} 条数据`)
  }).catch(() => {
    // 用户取消，不做处理
  })
}

// 载入特征（模拟）
const handleLoadOpenFeatures = () => {
  // 找到当前活动标签
  const activeTab = openTabs.value.find(tab => tab.name === activeTabName.value)
  if (!activeTab) {
    ElMessage.warning('请先选择一个分类')
    return
  }

  // 模拟加载特征
  loading.value = true

  setTimeout(() => {
    // 更新所有没有特征的项
    let count = 0
    activeTab.items.forEach(item => {
      if (!item.openFeature) {
        item.openFeature = '/assets/bus.jpg'
        count++
      }
    })

    loading.value = false

    // 刷新表格
    refreshSoft()

    if (count > 0) {
      ElMessage.success(`成功载入 ${count} 条特征`)
    } else {
      ElMessage.info('所有特征已载入，无需重新载入')
    }
  }, 1500)
}

// 重置表单
const resetOpenForm = () => {
  openForm.id = ''
  openForm.name = ''
  openForm.desc = ''
  openForm.image = ''
  openForm.openFeature = ''

  // 清空文件列表
  fileList.value = []

  // 重置表单验证
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 上传相关
const handleExceed = () => {
  ElMessage.warning('最多只能上传1张图片')
}

const handleFileChange = (file: UploadFile) => {
  // 预览图片
  if (file.raw) {
    const url = URL.createObjectURL(file.raw)
    openForm.image = url

    // 记录创建的URL，以便后续释放
    createdObjectUrls.value.push(url)
  }
}

const handleFileRemove = () => {
  openForm.image = ''
}

const beforeFileUpload = (file: File) => {
  // 检查文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }

  // 检查文件大小（2MB）
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB')
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
      const activeTab = openTabs.value.find(tab => tab.name === activeTabName.value)
      if (!activeTab) return

      if (dialogMode.value === 'add') {
        // 创建新数据
        const newItem: OpenItem = {
          id: 'open-' + Date.now(),
          name: openForm.name,
          desc: openForm.desc,
          image: openForm.image,
          openFeature: '',
          createTime: new Date().toLocaleString()
        }

        // 添加到当前标签
        activeTab.items.unshift(newItem)

        ElMessage.success('添加成功')
        refreshAfterCreate()
      } else {
        // 更新现有数据
        const index = activeTab.items.findIndex(item => item.id === openForm.id)
        if (index !== -1) {
          // 保留创建时间
          const createTime = activeTab.items[index].createTime

          // 更新数据
          activeTab.items[index] = {
            ...openForm,
            createTime
          } as OpenItem

          ElMessage.success('更新成功')
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
  resetOpenForm()
}

// 页面初始化
onMounted(() => {
  // 检查是否有标签页数据
  if (openTabs.value.length === 0) {
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
      const name = 'open-' + Date.now()

      // 创建新标签
      const newTab: TabItem = {
        name,
        label: value.trim(),
        items: []
      }

      // 添加到标签列表
      openTabs.value.push(newTab)

      // 切换到新标签
      activeTabName.value = name

      ElMessage.success('创建分类成功')
      getTableData()
    }).catch(() => {
      // 用户取消，不做任何处理
    })
  } else {
    // 有标签页数据，初始加载数据
    if (activeTabName.value) {
      getTableData()
    }
  }
})
</script>

<style lang="scss" scoped>
.open-repo-root {
  width: 100%;
  height: 100%;
}

.open-repo-page {
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

.open-feature-preview {
  display: flex;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 10px;
  border: 1px dashed var(--el-border-color);
  padding: 15px;
  border-radius: 4px;
  background-color: var(--el-fill-color-lighter);
}

/* 添加更多样式 */
:deep(.el-upload-list--picture-card) {
  .el-upload-list__item {
    width: 160px;
    height: 160px;
  }
}

:deep(.el-upload--picture-card) {
  width: 160px;
  height: 160px;
  line-height: 160px;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 100%;
}

:deep(.el-upload-list__item-thumbnail) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

// 添加空数据样式
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
