<template>
  <div class="algo-info-root">
    <ArtTableFullScreen>
      <div class="algo-info-page" id="table-full-screen">
        <div class="layout-container">
          <!-- 左侧标签页导航 -->
          <div class="left-tabs">
            <ElTabs tab-position="left" class="algo-tabs" v-model="activeTabName">
              <ElTabPane v-for="tab in algoTabs" :key="tab.name" :name="tab.name">
                <template #label>
                  <div class="custom-tab-label">
                    <i :class="getTabIcon(tab.name)" class="tab-icon"></i>
                    <span>{{ tab.label }}</span>
                  </div>
                </template>
                <!-- 空内容，只用于导航 -->
              </ElTabPane>
            </ElTabs>
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
                <template #default>
                  <ElTableColumn v-for="col in columns" :key="col.prop || col.type" v-bind="col" />
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
          <ElUpload class="upload-box" drag action="#" :auto-upload="false" :limit="1" :on-change="handleFileChange"
            :file-list="fileList" :on-remove="handleFileRemove" :before-upload="beforeFileUpload">
            <ElIcon class="el-icon--upload">
              <Upload />
            </ElIcon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, h, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ElTabs, ElTabPane, ElCard, ElButton, ElTableColumn, ElForm, ElFormItem, ElInput, ElSelect, ElUpload, ElIcon, ElOption } from 'element-plus'
import { mockAlgoList } from '@/mock/temp/algoList'
import ArtTableFullScreen from '@/components/core/tables/ArtTableFullScreen.vue'
import ArtTableHeader from '@/components/core/tables/ArtTableHeader.vue'
import ArtTable from '@/components/core/tables/ArtTable.vue'
import ArtButtonTable from '@/components/core/forms/ArtButtonTable.vue'
import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
import { useCheckedColumns } from '@/composables/useCheckedColumns'
import { BgColorEnum } from '@/enums/appEnum'
import type { SearchFormItem } from '@/types'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'

defineOptions({ name: 'AlgoInfo' })

const algoTabs = ref(mockAlgoList)
const activeTabName = ref(mockAlgoList[0]?.name || '')
const loading = ref(false)
const selectedRows = ref<any[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const fileList = ref<UploadFile[]>([])
const formRef = ref<FormInstance>()

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

const tableData = ref<any[]>([])
const tableRef = ref()

// 表格列定义
const { columnChecks, columns } = useCheckedColumns(() => [
  { type: 'selection', width: 55 },
  { type: 'index', label: '序号', width: 60 },
  { prop: 'id', label: 'ID', minWidth: 120 },
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
    formatter: (row: any) => {
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
watch(activeTabName, () => {
  pagination.currentPage = 1
  selectedRows.value = []
  getTableData()
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

const handleRefresh = () => {
  getTableData()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  getTableData()
}

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  getTableData()
}

const handleSelectionChange = (selection: any[]) => {
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

// 文件上传变更处理
const handleFileChange = (file: UploadFile, uploadFiles: UploadFile[]) => {
  fileList.value = uploadFiles
  algorithmForm.file = file.name

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
  // 在实际应用中可能需要更严格的检查
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
  return true
}

const handleAddAlgo = () => {
  dialogVisible.value = true
  dialogMode.value = 'add'
  resetForm()
}

const handleEdit = (row: any) => {
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

        // 模拟添加算法
        const newAlgo = {
          ...algorithmForm,
          createTime: new Date().toLocaleString()
        }
        // 添加到对应标签的items中
        const currentTab = algoTabs.value.find(tab => tab.name === algorithmForm.type)
        if (currentTab) {
          currentTab.items.unshift(newAlgo)
          ElMessage.success('添加算法成功')
          dialogVisible.value = false
          getTableData()
        }
      } else {
        // 模拟编辑算法
        const currentTab = algoTabs.value.find(tab => tab.name === algorithmForm.type)
        if (currentTab) {
          const idx = currentTab.items.findIndex(item => item.id === algorithmForm.id)
          if (idx >= 0) {
            currentTab.items[idx] = {
              ...(currentTab.items[idx] as any),
              label: algorithmForm.label,
              value: algorithmForm.value,
              desc: algorithmForm.desc,
              file: algorithmForm.file
            }
            ElMessage.success('编辑算法成功')
            dialogVisible.value = false
            getTableData()
          }
        }
      }
    }
  })
}

function getTableData() {
  loading.value = true
  setTimeout(() => {
    // 根据当前选中的标签页和搜索条件筛选数据
    const currentTab = algoTabs.value.find(tab => tab.name === activeTabName.value)
    if (!currentTab) {
      tableData.value = []
      loading.value = false
      return
    }

    let filtered = [...currentTab.items]
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

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除算法"${row.label}"吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const currentTab = algoTabs.value.find(tab => tab.name === activeTabName.value)
    if (currentTab) {
      const idx = currentTab.items.findIndex(item => item.id === row.id)
      if (idx >= 0) {
        currentTab.items.splice(idx, 1)
        ElMessage.success('删除成功')
        getTableData()
      }
    }
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
    if (currentTab) {
      const idsToDelete = selectedRows.value.map(row => row.id)
      currentTab.items = currentTab.items.filter(item => !idsToDelete.includes(item.id))
      ElMessage.success('批量删除成功')
      selectedRows.value = []
      getTableData()
    }
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
  ElMessageBox.confirm('确定要关闭吗？未保存的内容将会丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    dialogVisible.value = false
  }).catch(() => {
    // 用户取消关闭，不做处理
  })
}

onMounted(() => {
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
  border-right: 1px solid var(--el-border-color-light);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.right-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-left: 8px;
  overflow: hidden;
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

.algo-tabs {
  height: 100%;

  :deep(.el-tabs__header) {
    margin: 0;
    height: 100%;

    .el-tabs__nav-wrap::after {
      display: none; // 移除底部线条
    }

    .el-tabs__nav {
      height: 100%;
      border-right: none;
    }

    .el-tabs__item {
      text-align: left;
      padding: 0 20px;
      height: 50px;
      line-height: 50px;
      font-size: 15px;
      border-left: 3px solid transparent;
      transition: all 0.3s;
      margin: 4px 0;
      color: var(--art-text-color-primary);
      position: relative;

      &:hover {
        color: var(--el-color-primary);
        background-color: transparent;
      }

      &.is-active {
        color: var(--el-color-primary);
        background-color: transparent;
        border-left: 3px solid transparent;
        font-weight: normal;
      }
    }
  }

  :deep(.el-tabs__content) {
    display: none; // 不显示内容，只用作导航
  }
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

.custom-tab-label {
  display: flex;
  align-items: center;

  .tab-icon {
    margin-right: 8px;
    font-size: 18px;
  }
}


.upload-box {
  width: 100%;
}


.dialog-footer {
  padding-top: 10px;
  text-align: right;
}

:deep(.el-upload-dragger) {
  // 使用CSS变量控制内边距
  --el-upload-dragger-padding-horizontal: 10px;
  --el-upload-dragger-padding-vertical: 10px;
}
</style>
