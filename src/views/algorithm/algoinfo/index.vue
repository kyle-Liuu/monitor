<template>
  <div class="algo-info-root">
    <ArtTableFullScreen>
      <div class="algo-info-page" id="table-full-screen">
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

              <!-- 添加新标签页按钮 - 使用只有加号的简洁设计 -->
              <div class="add-tab-button" @click="handleAddNewTab">
                <i class="el-icon-plus"></i>
              </div>
            </div>
          </div>

          <!-- 右侧内容区域，保留原有的搜索和表格功能 -->
          <div class="right-content">
            <ArtSearchBar v-model:filter="formFilters" :items="formItems" @reset="handleReset" @search="handleSearch" />
            <ElCard shadow="never" class="art-table-card">
              <ArtTableHeader :columnList="columns" v-model:columns="columnChecks" @refresh="handleRefresh">
                <template #left>
                  <ElButton type="primary" @click="handleAddAlgo">新增算法</ElButton>
                  <ElButton type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">
                    批量删除
                  </ElButton>
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
                        <p>{{ !hasTabData ? '请先创建分类' : !activeTabName ? '请选择一个分类' : '当前分类下暂无算法数据' }}</p>
                      </template>
                      <el-button v-if="hasTabData && activeTabName" type="primary" @click="handleAddAlgo">添加算法</el-button>
                      <el-button v-else-if="!hasTabData" type="primary" @click="handleAddNewTab">创建分类</el-button>
                    </el-empty>
                  </div>
                </template>
                <template #default>
                  <template v-for="col in columns" :key="col.prop || col.type">
                    <ElTableColumn v-if="col.prop === 'feature'" :prop="col.prop" :label="col.label" :width="col.width">
                      <template #default="scope">
                        <el-tag v-if="scope.row.feature" type="success" effect="light">{{ scope.row.feature }}</el-tag>
                        <el-tag v-else type="info" effect="light">未载入</el-tag>
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
          <ElUpload class="upload-box" drag action="#" :auto-upload="false" :limit="1" 
            :on-exceed="handleExceed"
            :on-change="handleFileChange"
            :file-list="fileList" 
            :on-remove="handleFileRemove" 
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
import { ElMessage, ElMessageBox, ElPopconfirm, ElDialog } from 'element-plus'
import { ElCard, ElButton, ElTableColumn, ElForm, ElFormItem, ElInput, ElSelect, ElUpload, ElIcon, ElOption } from 'element-plus'
import { mockAlgoList } from '@/mock/temp/algoList'
import ArtTableFullScreen from '@/components/core/tables/ArtTableFullScreen.vue'
import ArtTableHeader from '@/components/core/tables/ArtTableHeader.vue'
import ArtTable from '@/components/core/tables/ArtTable.vue'
import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
import ArtMenuRight from '@/components/core/others/art-menu-right/index.vue'
import { useCheckedColumns } from '@/composables/useCheckedColumns'
import type { SearchFormItem } from '@/types'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import type { MenuItemType } from '@/components/core/others/art-menu-right/index.vue'
import { Upload, Plus } from '@element-plus/icons-vue'

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
  return function(this: any, ...args: any[]) {
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
const loading = ref(false)
const selectedRows = ref<AlgorithmItem[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const fileList = ref<UploadFile[]>([])
const formRef = ref<FormInstance>()
const tableData = ref<AlgorithmItem[]>([])
const tableRef = ref()

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

const formFilters = reactive({
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

const formItems: SearchFormItem[] = [
  { label: '算法名称', prop: 'label', type: 'input', config: { clearable: true } },
  { label: '标识符', prop: 'value', type: 'input', config: { clearable: true } }
]

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const { columnChecks, columns } = useCheckedColumns(() => [
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
  formFilters.label = ''
  formFilters.value = ''
  pagination.currentPage = 1
  getTableData()
}

const handleSearch = () => {
  pagination.currentPage = 1
  getTableData()
}

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
  activeTabName.value = tabName
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
const handleTabMenuSelect = (item: MenuItemType) => {
  if (!currentRightClickTab.value) return

  if (item.key === 'rename') {
    startEditTabLabel(currentRightClickTab.value)
  } else if (item.key === 'delete') {
    confirmDeleteTab(currentRightClickTab.value)
  }
}

// 删除标签页
const deleteTab = (tabName: string) => {
  if (isDefaultTab(tabName)) {
    ElMessage.warning('默认分类不能删除')
    return
  }

  const index = algoTabs.value.findIndex(tab => tab.name === tabName)
  if (index === -1) return

  // 获取待删除标签的数据
  const tabToDelete = algoTabs.value[index]
  const itemsCount = tabToDelete.items?.length || 0
  
  // 如果删除的是当前激活的标签，需要切换到其他标签
  const isActiveTab = activeTabName.value === tabName
  
  // 删除标签
  algoTabs.value.splice(index, 1)
  
  // 清空选中的行数据
  selectedRows.value = []
  
  // 处理激活标签
  if (algoTabs.value.length > 0) {
    // 如果还有标签，总是切换到第一个标签
    activeTabName.value = algoTabs.value[0].name
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
  ElMessage.success(`分类已删除${itemsCount > 0 ? `，同时移除了${itemsCount}条算法数据` : ''}`)
}

// 确认删除标签
const confirmDeleteTab = (tab: TabItem) => {
  if (isDefaultTab(tab.name)) {
    ElMessage.warning('默认分类不能删除')
    return
  }

  // 检查标签是否有算法正在使用
  const hasAlgorithms = tab.items && tab.items.length > 0

  if (hasAlgorithms) {
    ElMessageBox.confirm(`当前标签有算法正在使用，确认删除将影响这些算法的配置。是否继续删除"${tab.label}"？`, '删除确认', {
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

// 开始编辑标签标题 - 修改为使用内部函数
const startEditTabLabel = (tab: TabItem) => {
  if (isDefaultTab(tab.name)) {
    ElMessage.warning('默认分类不能编辑')
    return
  }

  // 检查标签是否有算法正在使用
  const hasAlgorithms = tab.items && tab.items.length > 0

  if (hasAlgorithms) {
    ElMessageBox.confirm('当前标签有算法正在执行，确认修改将重启布控', '修改确认', {
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

// 完成标签编辑 - 修复空值检查错误
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
  const exists = algoTabs.value.some(tab =>
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
  const tabToUpdate = algoTabs.value.find(tab => tab.name === editingTab.value?.name)
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
  algoTabs.value.push(newTab)

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
  label: [{ required: true, message: '请输入算法名称', trigger: 'blur' }],
  value: [{ required: true, message: '请输入标识符', trigger: 'blur' }],
  desc: [{ required: false, message: '请输入算法描述', trigger: 'blur' }],
  file: [{ required: true, message: '请上传算法文件', trigger: 'change' }]
}

const resetForm = () => {
  algorithmForm.id = ''
  algorithmForm.label = ''
  algorithmForm.value = ''
  algorithmForm.type = activeTabName.value
  algorithmForm.desc = ''
  algorithmForm.file = ''
  fileList.value = []
}

// 创建安全的对象URL，并记录以便后续释放
const createSafeObjectUrl = (file: File): string => {
  const url = URL.createObjectURL(file)
  // 记录创建的URL，以便在组件卸载时释放
  createdObjectUrls.value.push(url)
  return url
}

// 文件上传变更处理
const handleFileChange = (file: UploadFile, uploadFiles: UploadFile[]) => {
  fileList.value = uploadFiles
  algorithmForm.file = file.name

  // 如果是本地上传的新文件，创建本地预览URL
  if (file.raw) {
    const localUrl = createSafeObjectUrl(file.raw)
    file.url = localUrl
  }

  // 显示文件类型信息
  const fileName = file.name.toLowerCase()
  const fileExt = fileName.substring(fileName.lastIndexOf('.'))

  // 根据文件类型显示不同的提示
  let fileTypeMsg = ''
  if (['.zip', '.rar'].includes(fileExt)) {
    fileTypeMsg = '压缩包文件'
  } else if (['.pt', '.pth'].includes(fileExt)) {
    fileTypeMsg = 'PyTorch模型文件'
  } else if (['.model', '.bin'].includes(fileExt)) {
    fileTypeMsg = '模型文件'
  } else if (['.enc', '.dat'].includes(fileExt)) {
    fileTypeMsg = '加密数据文件'
  } else {
    fileTypeMsg = '自定义格式文件'
  }

  ElMessage.success(`已选择${fileTypeMsg}：${file.name}`)
}

// 文件移除处理
const handleFileRemove = () => {
  fileList.value = []
  algorithmForm.file = ''
}

// 文件上传前检查
const beforeFileUpload = (file: File) => {
  // 允许的文件扩展名列表
  const allowedExtensions = ['.zip', '.rar', '.pt', '.pth', '.model', '.bin', '.enc', '.dat', '.algo', '.weights']
  const fileName = file.name.toLowerCase()
  const hasAllowedExtension = allowedExtensions.some(ext => fileName.endsWith(ext))

  // 如果没有匹配到允许的扩展名，检查MIME类型
  const allowedMimeTypes = [
    'application/zip',
    'application/x-rar-compressed',
    'application/octet-stream',
    'application/x-model',
    'application/x-binary'
  ]
  const hasAllowedMimeType = allowedMimeTypes.includes(file.type)

  // 对于没有明确类型的文件，只要大小合适就允许上传
  const isValidFile = hasAllowedExtension || hasAllowedMimeType || file.type === ''
  const isLt100M = file.size / 1024 / 1024 < 100

  if (!isValidFile) {
    ElMessage.error('文件格式不支持，请上传有效的算法文件!')
    return false
  }
  if (!isLt100M) {
    ElMessage.error('文件大小不能超过 100MB!')
    return false
  }
  
  // 如果已有文件，自动替换而不是阻止上传
  if (fileList.value.length > 0) {
    // 清空现有文件列表，让新文件能被添加
    fileList.value = []
    // 只提示一次
    ElMessage.info('新文件将替换当前文件')
  }
  
  return true
}

// 超出文件数限制的处理函数
const handleExceed = (files: File[]) => {
  // 替换当前文件而不是提示错误
  if (files.length > 0) {
    // 删除已有文件
    fileList.value = []
    // 手动添加新文件
    handleFileChange({raw: files[0], name: files[0].name} as UploadFile, [{raw: files[0], name: files[0].name}] as UploadFile[])
    ElMessage.info('新上传的文件将替换当前文件')
  }
}

const handleAddAlgo = () => {
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
      algoTabs.value.push(defaultTab)
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
    if (algoTabs.value.length > 0) {
      activeTabName.value = algoTabs.value[0].name
    } else {
      ElMessage.warning('没有可用的分类')
      return
    }
  }
  
  openAddDialog()
}

// 抽取对话框打开逻辑为独立函数
const openAddDialog = () => {
  dialogVisible.value = true
  dialogMode.value = 'add'
  resetForm()
  
  // 新增时设置当前分类
  algorithmForm.type = activeTabName.value
}

const handleEdit = (row: AlgorithmItem) => {
  dialogVisible.value = true
  dialogMode.value = 'edit'
  Object.assign(algorithmForm, {
    id: row.id,
    label: row.label,
    value: row.value,
    type: activeTabName.value,
    desc: row.desc,
    file: row.file || ''
  })

  // 如果有文件，添加到文件列表中进行回显
  fileList.value = row.file ? [{ name: row.file, url: '' }] as UploadFile[] : []
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      // 这里实际应用中需要调用API保存数据
      if (dialogMode.value === 'add') {
        // 检查ID是否已存在
        const isDuplicate = algoTabs.value.some(tab =>
          tab.items.some(item => item.id === algorithmForm.id)
        )

        if (isDuplicate) {
          ElMessage.error('该标识符已存在，请修改标识符')
          return
        }

        // 显示保存中状态
        const savingInstance = ElMessage.info({
          message: '正在添加算法信息...',
          duration: 0,
          showClose: true
        })

        try {
          // 模拟API调用延迟
          setTimeout(() => {
            // 模拟添加算法
            const newAlgo = {
              ...algorithmForm,
              createTime: new Date().toLocaleString()
            }
            // 添加到对应标签的items中
            const currentTab = algoTabs.value.find(tab => tab.name === algorithmForm.type)
            if (currentTab) {
              currentTab.items.unshift(newAlgo)
              savingInstance.close()
              ElMessage.success('添加算法成功')
              dialogVisible.value = false
              getTableData()
            } else {
              savingInstance.close()
              ElMessage.error('找不到当前分类，请重试')
            }
          }, 500)
        } catch (error) {
          savingInstance.close()
          ElMessage.error('添加失败，请重试')
          console.error('添加出错:', error)
        }
      } else {
        // 显示保存中状态
        const savingInstance = ElMessage.info({
          message: '正在保存编辑内容...',
          duration: 0,
          showClose: true
        })

        try {
          // 模拟API调用延迟
          setTimeout(() => {
            // 模拟编辑算法
            const currentTab = algoTabs.value.find(tab => tab.name === algorithmForm.type)
            if (currentTab) {
              const idx = currentTab.items.findIndex(item => item.id === algorithmForm.id)
              if (idx >= 0) {
                // 获取旧数据，保留不变的字段
                const oldData = currentTab.items[idx]
                
                // 更新数据
                currentTab.items[idx] = {
                  ...oldData,
                  label: algorithmForm.label,
                  value: algorithmForm.value,
                  desc: algorithmForm.desc,
                  file: algorithmForm.file
                }
                savingInstance.close()
                ElMessage.success('编辑算法成功')
                dialogVisible.value = false
                getTableData()
              } else {
                savingInstance.close()
                ElMessage.error('找不到要编辑的算法信息，请重试')
              }
            } else {
              savingInstance.close()
              ElMessage.error('找不到当前分类，请重试')
            }
          }, 500)
        } catch (error) {
          savingInstance.close()
          ElMessage.error('保存失败，请重试')
          console.error('保存出错:', error)
        }
      }
    }
  })
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
    const currentTab = algoTabs.value.find(tab => tab.name === activeTabName.value)
    if (!currentTab) {
      tableData.value = []
      pagination.total = 0
      loading.value = false
      return
    }

    // 确保items数组存在
    const items: AlgorithmItem[] = currentTab.items || []
    
    let filtered = [...items]
    // 应用搜索筛选
    if (formFilters.label) {
      filtered = filtered.filter((item) => item.label.includes(formFilters.label))
    }
    if (formFilters.value) {
      filtered = filtered.filter((item) => item.value.includes(formFilters.value))
    }

    // 设置分页
    pagination.total = filtered.length
    const start = (pagination.currentPage - 1) * pagination.pageSize
    tableData.value = filtered.slice(start, start + pagination.pageSize)
    loading.value = false
  }, 300)
}

const handleDelete = (row: AlgorithmItem) => {
  ElMessageBox.confirm(`确定要删除算法"${row.label}"吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const currentTab = algoTabs.value.find(tab => tab.name === activeTabName.value)
    if (currentTab && currentTab.items) {
      const idx = currentTab.items.findIndex(item => item.id === row.id)
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
    const currentTab = algoTabs.value.find(tab => tab.name === activeTabName.value)
    if (currentTab && currentTab.items) {
      const idsToDelete = selectedRows.value.map(row => row.id)
      currentTab.items = currentTab.items.filter(item => !idsToDelete.includes(item.id))
      ElMessage.success(`批量删除成功，已删除${idsToDelete.length}条记录`)
      selectedRows.value = []
      getTableData()
    } else {
      ElMessage.error('当前分类不存在或为空')
    }
  }).catch(() => {
    // 用户取消删除操作
  })
}

// 当前标签页的标签名
const currentTabLabel = computed(() => {
  const currentTab = algoTabs.value.find(tab => tab.name === activeTabName.value)
  return currentTab?.label || ''
})

// 根据标识符生成ID并检查唯一性
const generateIdFromValue = () => {
  if (algorithmForm.value) {
    const newId = `algo-${algorithmForm.value.toLowerCase()}`
    algorithmForm.id = newId

    // 如果是添加模式，检查ID是否已存在
    if (dialogMode.value === 'add') {
      const isDuplicate = algoTabs.value.some(tab =>
        tab.items.some(item => item.id === newId)
      )

      if (isDuplicate) {
        ElMessage.warning('该标识符已存在，请修改标识符')
      }
    }
  } else {
    algorithmForm.id = ''
  }
}

// 对话框关闭处理
const handleDialogClose = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
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

onMounted(() => {
  // 初始检查是否有标签页数据
  if (!hasTabData.value) {
    ElMessage.info('算法库中没有分类数据，请先创建分类')
  } else if (algoTabs.value.every(tab => !tab.items || tab.items.length === 0)) {
    ElMessage.info('算法库中没有算法数据，请添加算法')
  }
  getTableData()
})
</script>

<style lang="scss" scoped>
.algo-info-root {
  width: 100%;
  height: 100%;
}

.algo-info-page {
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
