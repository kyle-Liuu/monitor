<template>
  <div class="open-repo-root">
    <ArtTableFullScreen>
      <div class="open-repo-page" id="table-full-screen">
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

              <!-- 添加新标签页按钮 - 使用只有加号的简洁设计 -->
              <div class="add-tab-button" @click="handleAddNewTab">
                <i class="el-icon-plus"></i>
              </div>
            </div>
          </div>

          <!-- 右侧内容区域 -->
          <div class="right-content">
            <ArtSearchBar v-model:filter="formFilters" :items="formItems" @reset="handleReset" @search="handleSearch" />
            <ElCard shadow="never" class="art-table-card">
              <ArtTableHeader :columnList="columns" v-model:columns="columnChecks" @refresh="handleRefresh">
                <template #left>
                  <ElButton type="primary" @click="handleAddOpen">新增</ElButton>
                  <ElButton type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">
                    批量删除
                  </ElButton>
                  <ElButton type="warning" @click="handleLoadOpenFeatures">载入特征</ElButton>
                </template>
              </ArtTableHeader>
              <ArtTable ref="tableRef" row-key="id" :data="tableData" :loading="loading"
                :currentPage="pagination.currentPage" :pageSize="pagination.pageSize" :total="pagination.total"
                :marginTop="10" :showPagination="true" @selection-change="handleSelectionChange"
                @size-change="handleSizeChange" @current-change="handleCurrentChange">
                <template #empty>
                  <div class="empty-data">
                    <el-empty :image-size="120" description="暂无数据">
                      <template #description>
                        <p>{{ !hasTabData ? '请先创建分类' : !activeTabName ? '请选择一个分类' : '当前分类下暂无数据' }}</p>
                      </template>
                      <el-button v-if="hasTabData && activeTabName" type="primary" @click="handleAddOpen">添加</el-button>
                      <el-button v-else-if="!hasTabData" type="primary" @click="handleAddNewTab">创建分类</el-button>
                    </el-empty>
                  </div>
                </template>
                <template #default>
                  <template v-for="col in columns" :key="col.prop || col.type">
                    <ElTableColumn v-if="col.prop === 'image'" :prop="col.prop" :label="col.label" :width="col.width">
                      <template #default="scope">
                        <div @click="handleImageClick(scope.row.image)">
                          <el-image
                            style="width: 50px; height: 50px; border-radius: 4px; cursor: pointer;"
                            :src="scope.row.image"
                            fit="cover"
                          />
                        </div>
                      </template>
                    </ElTableColumn>
                    <ElTableColumn v-else-if="col.prop === 'openFeature'" :prop="col.prop" :label="col.label" :width="col.width">
                      <template #default="scope">
                        <div @click="handleImageClick(scope.row.openFeature)" v-if="scope.row.openFeature">
                          <el-image
                            style="width: 50px; height: 50px; border-radius: 4px; cursor: pointer;"
                            :src="scope.row.openFeature"
                            fit="cover"
                          />
                        </div>
                        <span v-else>暂无特征</span>
                      </template>
                    </ElTableColumn>
                    <ElTableColumn v-else v-bind="col" />
                  </template>
                </template>
              </ArtTable>
            </ElCard>
          </div>
        </div>
      </div>
    </ArtTableFullScreen>

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
          <ElUpload 
            class="upload-box" 
            drag 
            action="#" 
            :auto-upload="false" 
            :limit="1" 
            :on-exceed="handleExceed"
            :on-change="handleFileChange"
            :file-list="fileList" 
            :on-remove="handleFileRemove" 
            :before-upload="beforeFileUpload"
            accept="image/*">
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
    <el-image-viewer
      v-if="showViewer"
      @close="showViewer = false"
      :url-list="previewImages"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, h, computed, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox, ElDialog, ElImageViewer } from 'element-plus'
import { ElCard, ElButton, ElTableColumn, ElForm, ElFormItem, ElInput, ElSelect, ElUpload, ElIcon, ElOption, ElInputNumber, ElImage } from 'element-plus'
import { mockOpenList } from '@/mock/temp/openList'
import ArtTableFullScreen from '@/components/core/tables/ArtTableFullScreen.vue'
import ArtTableHeader from '@/components/core/tables/ArtTableHeader.vue'
import ArtTable from '@/components/core/tables/ArtTable.vue'
import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
import ArtMenuRight from '@/components/core/others/art-menu-right/index.vue'
import { useCheckedColumns } from '@/composables/useCheckedColumns'
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
  return function(this: any, ...args: any[]) {
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
const loading = ref(false)
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

const formFilters = reactive({
  name: '',
  gender: ''
})

// 表单数据
const openForm = reactive({
  id: '',
  name: '',
  desc: '',
  image: '',
  openFeature: ''
})

const formItems: SearchFormItem[] = [
  { label: '名称', prop: 'name', type: 'input', config: { clearable: true } }
]

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref<OpenItem[]>([])
const tableRef = ref()

// 表格列定义
const { columnChecks, columns } = useCheckedColumns(() => [
  { type: 'selection', width: 55 },
  { type: 'index', label: '序号', width: 60, checked: false },
  { prop: 'name', label: '名称', minWidth: 100 },
  { prop: 'image', label: '图片', width: 80 },
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
])

// 监听标签页切换，更新表格数据
watch(activeTabName, (newVal) => {
  if (newVal) {
    pagination.currentPage = 1
    selectedRows.value = []
    getTableData()
  }
})

const handleReset = () => {
  formFilters.name = ''
  formFilters.gender = ''
  pagination.currentPage = 1
  getTableData()
}

const handleSearch = () => {
  pagination.currentPage = 1
  getTableData()
}

// 增加防抖处理，避免频繁刷新
const handleRefresh = debounce(() => {
  getTableData()
}, 300)

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  getTableData()
}

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  getTableData()
}

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

// 右键菜单显示
const showTabMenu = (e: MouseEvent, tab: TabItem) => {
  // 如果当前有正在编辑的标签，先保存编辑
  if (editingTab.value) {
    handleTabLabelEditComplete()
  }
  
  currentRightClickTab.value = tab
  nextTick(() => {
    tabMenuRef.value?.show(e)
  })
}

// 处理右键菜单选择
const handleTabMenuSelect = (item: MenuItemType) => {
  if (!currentRightClickTab.value) return

  if (item.key === 'rename') {
    startEditTabLabel(currentRightClickTab.value)
  } else if (item.key === 'delete') {
    confirmDeleteTab(currentRightClickTab.value)
  }
}

// 确认删除标签
const confirmDeleteTab = (tab: TabItem) => {
  if (isDefaultTab(tab.name)) {
    ElMessage.warning('默认分类不能删除')
    return
  }

  // 检查标签是否有信息正在使用
  const hasItems = tab.items && tab.items.length > 0

  if (hasItems) {
    ElMessageBox.confirm(`当前分类有信息正在使用，确认删除将影响这些数据。是否继续删除"${tab.label}"？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      deleteTab(tab.name)
    }).catch(() => {
      // 用户取消，不执行操作
    })
  } else {
    ElMessageBox.confirm(`确定要删除分类"${tab.label}"吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      deleteTab(tab.name)
    }).catch(() => {
      // 用户取消，不执行操作
    })
  }
}

// 删除标签页
const deleteTab = (tabName: string) => {
  if (isDefaultTab(tabName)) {
    ElMessage.warning('默认分类不能删除')
    return
  }

  const index = openTabs.value.findIndex(tab => tab.name === tabName)
  if (index === -1) return

  // 获取待删除标签的数据
  const tabToDelete = openTabs.value[index]
  const itemsCount = tabToDelete.items?.length || 0
  
  // 如果删除的是当前激活的标签，需要切换到其他标签
  const isActiveTab = activeTabName.value === tabName
  
  // 删除标签
  openTabs.value.splice(index, 1)
  
  // 清空选中的行数据
  selectedRows.value = []
  
  // 处理激活标签
  if (openTabs.value.length > 0) {
    // 如果还有标签，总是切换到第一个标签
    activeTabName.value = openTabs.value[0].name
  } else {
    // 如果没有标签了，清空激活标签
    activeTabName.value = ''
  }
  
  // 如果删除的是当前激活标签或者切换了标签，则刷新表格数据
  if (isActiveTab || activeTabName.value !== tabName) {
    // 重置分页
    pagination.currentPage = 1
    getTableData()
  }

  // 显示成功消息，包含数据统计
  ElMessage.success(`分类已删除${itemsCount > 0 ? `，同时移除了${itemsCount}条数据` : ''}`)
}

// 开始编辑标签标题
const startEditTabLabel = (tab: TabItem) => {
  if (isDefaultTab(tab.name)) {
    ElMessage.warning('默认分类不能编辑')
    return
  }

  // 检查标签是否有信息
  const hasItems = tab.items && tab.items.length > 0

  if (hasItems) {
    ElMessageBox.confirm('当前分类有信息，确认修改可能影响识别结果', '修改确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      startEditTabLabelInternal(tab)
    }).catch(() => {
      // 用户取消，不执行操作
    })
  } else {
    startEditTabLabelInternal(tab)
  }
}

// 内部函数：开始编辑标签
const startEditTabLabelInternal = (tab: TabItem) => {
  // 保存原始标签名，用于取消编辑时恢复
  editingTabOriginalLabel.value = tab.label
  editingTab.value = { ...tab }

  nextTick(() => {
    // 让输入框自动获得焦点
    focusTabEditInput()
  })
}

// 聚焦标签编辑输入框
const focusTabEditInput = () => {
  setTimeout(() => {
    try {
      const inputEl = document.querySelector('.edit-tab-input input') as HTMLInputElement
      if (inputEl) {
        inputEl.focus()
        // 将光标移动到文本末尾
        const textLength = editingTab.value?.label.length || 0
        inputEl.setSelectionRange(textLength, textLength)
      }
    } catch (e) {
      console.error('聚焦输入框失败:', e)
    }
  }, 100)
}

// 完成标签编辑
const handleTabLabelEditComplete = () => {
  if (!editingTab.value) return

  const label = editingTab.value.label.trim()

  if (!label) {
    ElMessage.warning('分类名称不能为空')
    // 恢复原始名称
    if (editingTab.value) {
      editingTab.value.label = editingTabOriginalLabel.value
    }
    editingTab.value = null
    return
  }

  // 检查名称是否已存在
  const exists = openTabs.value.some(tab =>
    tab.name !== editingTab.value?.name && tab.label === label
  )

  if (exists) {
    ElMessage.warning('该分类名称已存在')
    // 恢复原始名称
    if (editingTab.value) {
      editingTab.value.label = editingTabOriginalLabel.value
    }
    editingTab.value = null
    return
  }

  // 更新标签名称
  const tabToUpdate = openTabs.value.find(tab => tab.name === editingTab.value?.name)
  if (tabToUpdate) {
    tabToUpdate.label = label
    // 如果不是新标签，显示成功消息
    if (editingTabOriginalLabel.value !== '') {
      ElMessage.success('分类名称已更新')
    }
  }

  editingTab.value = null
}

// 取消标签编辑
const cancelTabLabelEdit = () => {
  if (!editingTab.value) return

  // 恢复原始名称
  editingTab.value.label = editingTabOriginalLabel.value
  editingTab.value = null
}

// 生成唯一标识符
const generateUniqueId = (prefix: string) => {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

// 直接添加新标签页
const handleAddNewTab = () => {
  // 生成唯一标识符
  const newName = generateUniqueId('custom')
  const defaultLabel = '右键编辑'  // 中文提示，指导用户使用右键操作

  // 添加新标签
  const newTab: TabItem = {
    name: newName,
    label: defaultLabel,
    items: []
  }
  openTabs.value.push(newTab)

  // 切换到新标签
  activeTabName.value = newName

  // 显示提示消息
  ElMessage({
    message: '右键可以重命名标签',
    type: 'info',
    offset: 60,
    duration: 3000
  })
}

const rules: FormRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 2, max: 20, message: '名称长度应为2-20个字符', trigger: 'blur' }
  ],
  desc: [{ required: false, max: 100, message: '描述不能超过100个字符', trigger: 'blur' }],
  image: [{ required: true, message: '请上传图片', trigger: 'change' }]
}

const resetForm = () => {
  // 重置表单数据
  openForm.id = ''
  openForm.name = ''
  openForm.desc = ''
  openForm.image = ''
  openForm.openFeature = ''
  
  // 清空文件列表
  fileList.value = []
  
  // 重置表单验证状态
  nextTick(() => {
    if (formRef.value) {
      formRef.value.clearValidate()
    }
  })
}

// 创建安全的对象URL，并记录以便后续释放
const createSafeObjectUrl = (file: File): string => {
  const url = URL.createObjectURL(file)
  // 记录创建的URL，以便在组件卸载时释放
  createdObjectUrls.value.push(url)
  return url
}

// 文件上传变更处理
const handleFileChange = (file: UploadFile) => {
  // 保证只有一个文件
  fileList.value = [file]
  
  if (file.raw) {
    // 如果是本地上传的新文件，创建本地预览URL
    const localUrl = createSafeObjectUrl(file.raw)
    file.url = localUrl
    // 保存到表单，使用本地URL预览
    openForm.image = localUrl
    
    ElMessage.info(`已选择新照片"${file.name}"，点击确定后生效`)
  } else if (file.url) {
    // 已有图片（编辑模式）
    openForm.image = file.url
  }
}

// 文件移除处理
const handleFileRemove = (_file?: any) => {
  fileList.value = []
  // 重置为默认图片
  openForm.image = ''
}

// 文件上传前检查
const beforeFileUpload = (file: File) => {
  // 检查是否是允许的图片类型
  const acceptTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
  const isAcceptType = acceptTypes.includes(file.type)
  
  // 检查文件大小
  const maxSize = 2 // MB
  const isValidSize = file.size / 1024 / 1024 < maxSize
  
  if (!isAcceptType) {
    ElMessage.error('只能上传JPG/PNG格式的图片!')
    return false
  }
  
  if (!isValidSize) {
    ElMessage.error(`图片大小不能超过 ${maxSize}MB!`)
    return false
  }
  
  // 如果已有文件，自动替换而不是阻止上传
  if (fileList.value.length > 0) {
    // 清空现有文件列表，让新文件能被添加
    fileList.value = []
    // 只提示一次
    ElMessage.info('新照片将替换当前照片')
  }
  
  return true
}

const handleAddOpen = () => {
  if (!hasTabData.value) {
    ElMessageBox.confirm('当前没有可用的分类，是否创建一个新分类？', '提示', {
      confirmButtonText: '创建分类',
      cancelButtonText: '取消',
      type: 'info'
    }).then(() => {
      // 创建默认分类
      const newName = generateUniqueId('default')
      const defaultTab: TabItem = {
        name: newName,
        label: '右键编辑',
        items: []
      }
      openTabs.value.push(defaultTab)
      activeTabName.value = newName
      ElMessage.success('已创建默认分类')
      
      // 等待标签创建完成后再打开对话框
      nextTick(() => {
        openAddDialog()
      })
    }).catch(() => {
      // 用户取消操作
    })
    return
  }
  
  if (!activeTabName.value) {
    // 没有激活的标签页，自动选择第一个
    if (openTabs.value.length > 0) {
      activeTabName.value = openTabs.value[0].name
    } else {
      ElMessage.warning('没有可用的分类')
      return
    }
  }
  
  openAddDialog()
}

const openAddDialog = () => {
  dialogVisible.value = true
  dialogMode.value = 'add'
  resetForm()
  
  // 新增时不显示默认图片，只提供上传功能
  fileList.value = []
  openForm.image = ''
}

const handleEdit = (row: OpenItem) => {
  dialogVisible.value = true
  dialogMode.value = 'edit'
  
  // 重置表单内容
  resetForm()
  
  // 填充表单数据
  Object.assign(openForm, {
    id: row.id,
    name: row.name,
    desc: row.desc,
    image: row.image || '',
    openFeature: row.openFeature || ''
  })

  // 如果有图片，添加到文件列表中进行回显
  if (row.image) {
    // 创建文件对象用于预览
    const fileName = row.id ? `open_${row.id.split('-').pop()}.jpg` : 'open.jpg'
    const fileItem = { 
      name: fileName,
      url: row.image,
      // 标记为已有文件，非新上传
      status: 'success',
      uid: Date.now()
    }
    fileList.value = [fileItem as unknown as UploadFile]
  } else {
    fileList.value = []
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // 表单验证
    await formRef.value.validate()
    
    // 检查是否有图片
    if (!openForm.image && fileList.value.length === 0) {
      ElMessage.error('请上传图片')
      return
    }

    // 处理上传图片
    let imageUrl = openForm.image
    let needUpload = false
    
    // 检查是否有本地文件需要上传
    if (fileList.value.length > 0 && fileList.value[0].raw) {
      needUpload = true
      
      // 显示上传中状态
      const loadingInstance = ElMessage.info({
        message: '正在上传图片...',
        duration: 0,
        showClose: true
      })
      
      try {
        // 实际项目中，这里应该调用API上传图片到服务器
        // 模拟上传过程
        await new Promise(resolve => setTimeout(resolve, 800)) 
        
        // 保留本地预览URL作为图片路径
        // 在实际项目中，应该使用后端返回的URL
        imageUrl = openForm.image
        
        // 关闭上传提示
        loadingInstance.close()
        ElMessage.success('图片上传成功')
      } catch (err) {
        // 关闭上传提示
        loadingInstance.close()
        ElMessage.error('图片上传失败，请重试')
        return
      }
    }

    // 显示保存中状态
    const savingInstance = ElMessage.info({
      message: dialogMode.value === 'add' ? '正在添加信息...' : '正在保存编辑内容...',
      duration: 0,
      showClose: true
    })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (dialogMode.value === 'add') {
        // 新增模式
        // 生成唯一ID
        const newId = generateUniqueId(`open-${activeTabName.value}`)
        
        // 准备新数据
        const newOpen = {
          id: newId,
          name: openForm.name,
          desc: openForm.desc,
          image: imageUrl,
          openFeature: needUpload ? '/assets/open.jpg' : '', // 新上传图片才生成特征图
          createTime: new Date().toLocaleString()
        }
        
        // 添加到对应标签的items中
        const currentTab = openTabs.value.find(tab => tab.name === activeTabName.value)
        if (currentTab) {
          // 确保items数组存在
          if (!currentTab.items) {
            currentTab.items = []
          }
          currentTab.items.unshift(newOpen)
          savingInstance.close()
          ElMessage.success('添加信息成功')
          dialogVisible.value = false
          getTableData()
        } else {
          savingInstance.close()
          ElMessage.error('找不到当前分类，请重试')
        }
      } else {
        // 编辑模式
        const currentTab = openTabs.value.find(tab => tab.name === activeTabName.value)
        if (currentTab) {
          // 确保items数组存在
          if (!currentTab.items) {
            currentTab.items = []
            savingInstance.close()
            ElMessage.error('找不到数据，请重试')
            return
          }
          
          const idx = currentTab.items.findIndex(item => item.id === openForm.id)
          if (idx >= 0) {
            // 获取旧数据，保留不变的字段
            const oldData = currentTab.items[idx]
            
            // 更新数据
            currentTab.items[idx] = {
              ...oldData,
              name: openForm.name,
              desc: openForm.desc,
              image: imageUrl,
              // 如果上传了新图片，则生成新特征图，否则保留原特征图
              openFeature: needUpload ? '/assets/open.jpg' : oldData.openFeature
            }
            
            savingInstance.close()
            ElMessage.success('编辑信息成功')
            dialogVisible.value = false
            getTableData()
          } else {
            savingInstance.close()
            ElMessage.error('找不到要编辑的信息，请重试')
          }
        } else {
          savingInstance.close()
          ElMessage.error('找不到当前分类，请重试')
        }
      }
    } catch (error) {
      savingInstance.close()
      ElMessage.error('操作失败，请重试')
      console.error('保存出错:', error)
    }
  } catch (error) {
    ElMessage.error('表单验证失败，请检查输入')
    console.error('表单验证出错:', error)
  }
}

function getTableData() {
  loading.value = true
  setTimeout(() => {
    // 检查是否有标签页
    if (!hasTabData.value) {
      tableData.value = []
      pagination.total = 0
      loading.value = false
      return
    }

    // 根据当前选中的标签页和搜索条件筛选数据
    const currentTab = openTabs.value.find(tab => tab.name === activeTabName.value)
    if (!currentTab) {
      tableData.value = []
      pagination.total = 0
      loading.value = false
      return
    }

    // 确保items数组存在
    const items: OpenItem[] = currentTab.items || []
    
    let filtered = [...items]
    // 应用搜索筛选
    if (formFilters.name) {
      filtered = filtered.filter((item) => item.name.includes(formFilters.name))
    }

    // 设置分页
    pagination.total = filtered.length
    const start = (pagination.currentPage - 1) * pagination.pageSize
    tableData.value = filtered.slice(start, start + pagination.pageSize)
    loading.value = false
  }, 300)
}

const handleDelete = (row: OpenItem) => {
  ElMessageBox.confirm(`确定要删除"${row.name}"的信息吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const currentTab = openTabs.value.find(tab => tab.name === activeTabName.value)
    if (currentTab && currentTab.items) {
      const idx = currentTab.items.findIndex((item: OpenItem) => item.id === row.id)
      if (idx >= 0) {
        currentTab.items.splice(idx, 1)
        ElMessage.success('删除成功')
        // 刷新表格数据，同时可能需要更新选中行
        selectedRows.value = selectedRows.value.filter(selected => selected.id !== row.id)
        getTableData()
      } else {
        ElMessage.error('未找到要删除的记录')
      }
    } else {
      ElMessage.error('当前分类不存在或为空')
    }
  }).catch(() => {
    // 用户取消删除操作
  })
}

const handleBatchDelete = () => {
  if (!selectedRows.value.length) return

  ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条记录吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const currentTab = openTabs.value.find(tab => tab.name === activeTabName.value)
    if (currentTab && currentTab.items) {
      const idsToDelete = selectedRows.value.map(row => row.id)
      currentTab.items = currentTab.items.filter((item: OpenItem) => !idsToDelete.includes(item.id))
      ElMessage.success('批量删除成功')
      selectedRows.value = []
      getTableData()
    } else {
      ElMessage.error('当前分类不存在或为空')
    }
  }).catch(() => {
    // 用户取消删除操作
  })
}

// 对话框关闭处理
const handleDialogClose = () => {
  // 重置表单数据和验证状态
  resetForm()
}

// 取消按钮点击处理
const handleCancel = () => {
  // 检查是否有修改
  const hasFileChange = fileList.value.length > 0 && fileList.value[0].raw
  // 简化判断，不检查表单修改状态，只要有上传文件就认为有修改
  const hasModification = hasFileChange || dialogMode.value === 'add'

  // 如果有修改，显示确认对话框
  if (hasModification) {
    ElMessageBox.confirm('确定要取消吗？未保存的修改将会丢失', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '继续编辑',
      type: 'warning',
      closeOnClickModal: false
    }).then(() => {
      // 关闭对话框
      dialogVisible.value = false
    }).catch(() => {
      // 用户取消关闭，继续编辑
    })
  } else {
    // 没有修改，直接关闭
    dialogVisible.value = false
  }
}

// 添加载入特征的处理方法
const handleLoadOpenFeatures = () => {
  if (!activeTabName.value) {
    ElMessage.warning('请先选择一个分类')
    return
  }
  
  const currentTab = openTabs.value.find(tab => tab.name === activeTabName.value)
  if (!currentTab || !currentTab.items || currentTab.items.length === 0) {
    ElMessage.warning('当前分类没有数据')
    return
  }
  
  // 计算需要处理的数量
  const totalOpens = currentTab.items.length
  const needProcessOpens = currentTab.items.filter((item: OpenItem) => !item.openFeature).length
  
  if (needProcessOpens === 0) {
    ElMessage.success('所有特征已经载入')
    return
  }

  ElMessageBox.confirm(`将为当前分类中${needProcessOpens}张图片生成特征，是否继续？`, '载入特征', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    // 显示处理中状态
    const loadingInstance = ElMessage.info({
      message: '正在载入特征...',
      duration: 0,
      showClose: true
    })
    
    try {
      // 模拟处理过程
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 更新没有特征的数据
      currentTab.items.forEach((item: OpenItem) => {
        if (!item.openFeature) {
          item.openFeature = '/assets/open.jpg'
        }
      })
      
      // 刷新表格
      getTableData()
      
      // 关闭处理提示
      loadingInstance.close()
      ElMessage.success(`成功载入${needProcessOpens}张特征`)
    } catch (error) {
      loadingInstance.close()
      ElMessage.error('特征载入失败，请重试')
      console.error('载入特征出错:', error)
    }
  }).catch(() => {
    // 用户取消操作
  })
}

// 添加超出文件数限制的处理函数
const handleExceed = (files: File[]) => {
  // 替换当前文件而不是提示错误
  if (files.length > 0) {
    // 删除已有文件
    fileList.value = []
    // 手动添加新文件
    handleFileChange({raw: files[0], name: files[0].name} as UploadFile)
    ElMessage.info('新上传的照片将替换当前照片')
  }
}

onMounted(() => {
  // 初始检查是否有标签页数据
  if (!hasTabData.value) {
    ElMessage.info('底库中没有分类数据，请先创建分类')
  } else if (openTabs.value.every(tab => !tab.items || tab.items.length === 0)) {
    ElMessage.info('底库中没有数据，请添加')
  }
  getTableData()
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
  height: 100%;
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

.art-table-card {
  background: var(--art-root-card-border-color);
  border-radius: 10px;
  margin-top: 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

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

// 添加更多样式
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
