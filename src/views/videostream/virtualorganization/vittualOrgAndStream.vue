<template>
  <ArtTableFullScreen>
    <div class="streaminfo-page" id="table-full-screen">
      <ArtSearchBar v-model:filter="formFilters" :items="formItems" @reset="handleReset" @search="handleSearch" />
      <ElCard shadow="never" class="art-table-card">
        <ArtTableHeader :columnList="columns" v-model:columns="columnChecks" @refresh="handleRefresh">
          <template #left>
            <ElButton @click="openTransfer" v-ripple>新增</ElButton>
            <ElButton type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">
              批量删除
            </ElButton>
          </template>
        </ArtTableHeader>
        <!-- <VueDraggable target="tbody" handle=".handle" v-model="tableData" :animation="150"> -->
        <ArtTable ref="tableRef" row-key="streamCode" :data="tableData" :loading="loading"
          :currentPage="pagination.currentPage" :pageSize="pagination.pageSize" :total="pagination.total"
          :marginTop="10" :showPagination="true" @selection-change="handleSelectionChange"
          @size-change="handleSizeChange" @current-change="handleCurrentChange">
          <template #default>
            <ElTableColumn v-for="col in columns" :key="col.prop || col.type" v-bind="col" />
          </template>
        </ArtTable>
        <!-- </VueDraggable> -->
      </ElCard>
      <!-- 新增流穿梭框弹窗 -->
      <ElDialog v-model="transferVisible" title="分配视频流到当前组织" align-center>
        <div class="custom-transfer-wrapper">
          <ElTransfer v-model="transferValue" :data="transferData" filterable :filter-method="filterMethod"
            filter-placeholder="流名称/拼音" :titles="['未分配组织', '当前组织']" class="custom-dark-transfer"
            @change="handleTransferChange" />
        </div>
        <template #footer>
          <div class="dialog-footer">
            <ElButton @click="transferVisible = false">取消</ElButton>
            <ElButton type="primary" @click="handleTransferOk">确定</ElButton>
          </div>
        </template>
      </ElDialog>
      <!-- 编辑流弹窗 -->
      <ElDialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增' : '编辑'" width="420px" align-center>
        <ElForm ref="formRef" :model="formData" label-width="90px" :rules="formRules" :validate-on-rule-change="false">
          <ElFormItem label="流名称" prop="streamName">
            <ElInput v-model="formData.streamName" maxlength="50" show-word-limit placeholder="请输入流名称" />
          </ElFormItem>
          <ElFormItem label="组织" prop="orgId">
            <ElTreeSelect :key="treeSelectKey" v-model="formData.orgId" :data="orgTree" :props="{
              label: 'name',
              value: 'id',
              children: 'children',
              disabled: (node: any) => node.status === '禁用'
            }" :default-expanded-keys="expandedOrgKeys" placeholder="请选择组织" check-strictly clearable
              style="width: 100%" :render-after-expand="false">
              <template #default="{ node, data }">
                <span :style="selectedOrgPathIds.includes(data.id) ? 'color: #409EFF; font-weight: bold;' : ''
                  ">
                  {{ data.name }}
                </span>
              </template>
            </ElTreeSelect>
            <div v-if="selectedOrgPath.length"
              style="margin-top: 4px; display: flex; align-items: center; flex-wrap: wrap">
              <span style="color: #409eff">组织路径：</span>
              <template v-for="(name, idx) in selectedOrgPath" :key="idx">
                <ElTag type="info" effect="plain" style="margin-right: 4px">{{ name }}</ElTag>
                <span v-if="idx < selectedOrgPath.length - 1" style="color: #aaa; margin-right: 4px">&gt;</span>
              </template>
            </div>
          </ElFormItem>
          <ElFormItem label="描述">
            <ElInput v-model="formData.description" type="textarea" maxlength="200" show-word-limit
              placeholder="请输入描述" />
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
  </ArtTableFullScreen>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h, nextTick, computed, watch, watchEffect } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useCheckedColumns } from '@/composables/useCheckedColumns'
import { useWindowSize } from '@vueuse/core'
import ArtTableFullScreen from '@/components/core/tables/ArtTableFullScreen.vue'
import ArtTableHeader from '@/components/core/tables/ArtTableHeader.vue'
import ArtTable from '@/components/core/tables/ArtTable.vue'
import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
import ArtButtonTable from '@/components/core/forms/ArtButtonTable.vue'
import { ElButton, ElCard, ElTableColumn, ElTransfer, ElTreeSelect, ElTag } from 'element-plus'
import { BgColorEnum } from '@/enums/appEnum'
import type { SearchFormItem } from '@/types'
import { STREAM_LIST_MOCK, StreamItem, findOrgNameById } from '@/mock/temp/streamList'
import { ORG_TREE_MOCK } from '@/mock/temp/orgTree'
import { defineProps } from 'vue'
import type { TransferDataItem, TransferKey, TransferDirection } from 'element-plus'

const props = defineProps<{ orgId?: string }>()

defineOptions({ name: 'VirtualOrgAndStream' })

const { width } = useWindowSize()
const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const selectedRows = ref<any[]>([])
const errorMessage = ref<string>('')
const isSubmitting = ref(false)

const formFilters = reactive({
  streamName: '',
  streamCode: '',
  protocol: '',
  disable: ''
})

const formItems: SearchFormItem[] = [
  { label: '流名称', prop: 'streamName', type: 'input', config: { clearable: true } }
]

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref<StreamItem[]>([])
const tableRef = ref()

const formRef = ref<FormInstance>()
const orgTree = ref(ORG_TREE_MOCK)
const expandedOrgKeys = ref<string[]>([])
const treeSelectKey = ref(0)
const selectedOrgPath = ref<string[]>([])
const selectedOrgPathIds = ref<string[]>([])
const formData = ref({
  streamName: '',
  orgId: '',
  description: ''
})
const formRules = {
  streamName: [
    { required: true, message: '请输入流名称', trigger: 'blur' },
    { min: 2, max: 50, message: '2-50字符', trigger: 'blur' }
  ],
  orgId: [{ required: true, message: '请选择组织', trigger: 'blur' }]
}

const { columnChecks, columns } = useCheckedColumns(() => [
  { type: 'selection', width: 55 },
  { type: 'index', label: '序号', width: 60 },
  { prop: 'streamName', label: '流名称', minWidth: width.value < 500 ? 150 : '' },
  { prop: 'orgName', label: '组织', minWidth: 120 },
  { prop: 'description', label: '描述', minWidth: width.value < 500 ? 220 : '' },
  {
    prop: 'createTime',
    label: '创建时间',
    formatter: (row: any) => formatDate(row.createTime)
  },
  {
    prop: 'operation',
    label: '操作',
    width: 200,
    fixed: 'right',
    formatter: (row: any) => {
      return h('div', [
        h(ArtButtonTable, {
          type: 'edit',
          onClick: () => openDialog('edit', row)
        }),
        h(ArtButtonTable, {
          type: 'delete',
          onClick: () => handleDelete(row)
        })
      ])
    }
  }
])

const handleReset = () => {
  formFilters.streamName = ''
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

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该流吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
    getTableData()
  })
}

const handleBatchDelete = () => {
  if (!selectedRows.value.length) return

  ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条记录吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    getTableData()
  })
}

function getTableData() {
  loading.value = true
  errorMessage.value = ''

  try {
    setTimeout(() => {
      try {
        let filtered = STREAM_LIST_MOCK.slice()
        if (formFilters.streamName) {
          filtered = filtered.filter((item) =>
            item.streamName.toLowerCase().includes(formFilters.streamName.toLowerCase())
          )
        }
        if (props.orgId) {
          filtered = filtered.filter((item) => item.orgId === props.orgId)
        }
        pagination.total = filtered.length
        const start = (pagination.currentPage - 1) * pagination.pageSize
        tableData.value = filtered.slice(start, start + pagination.pageSize)
      } catch (err) {
        console.error('数据处理错误:', err)
        errorMessage.value = '数据处理出错，请刷新重试'
        ElMessage.error('数据处理出错，请刷新重试')
      } finally {
        loading.value = false
      }
    }, 200)
  } catch (err) {
    console.error('获取数据错误:', err)
    loading.value = false
    errorMessage.value = '获取数据失败，请刷新重试'
    ElMessage.error('获取数据失败，请刷新重试')
  }
}

const getAllNodeKeys = (nodes: any[]): string[] => {
  const keys: string[] = []
  const traverse = (nodeList: any[]) => {
    nodeList.forEach((node) => {
      if (node.name) {
        keys.push(node.name)
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  traverse(nodes)
  return keys
}

function formatDate(date: string | number | Date) {
  if (!date) return ''
  const d = new Date(date)
  return d
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    .replace(/\//g, '-')
}

const editRowId = ref<number | null>(null)

function openDialog(type: 'add' | 'edit', row?: any) {
  dialogType.value = type
  dialogVisible.value = true
  if (type === 'edit' && row) {
    formData.value = {
      streamName: row.streamName,
      orgId: row.orgId,
      description: row.description
    }
    editRowId.value = row.id
  } else {
    formData.value = { streamName: '', orgId: '', description: '' }
    editRowId.value = null
  }
  nextTick(() => formRef.value && formRef.value.clearValidate && formRef.value.clearValidate())
}

function handleDialogOk() {
  if (!formRef.value) return

  formRef.value.validate((valid: boolean) => {
    if (!valid) return

    isSubmitting.value = true

    try {
      if (dialogType.value === 'add') {
        const now = new Date().toLocaleString('zh-CN', { hour12: false })
        const orgName = findOrgNameById(orgTree.value, formData.value.orgId)

        if (!orgName) {
          ElMessage.warning('选择的组织不存在，请重新选择')
          isSubmitting.value = false
          return
        }

        const newItem = {
          id: Date.now(),
          orgId: formData.value.orgId,
          orgName,
          streamName: formData.value.streamName.trim(),
          streamCode: Math.random().toString(36).slice(2, 10),
          protocol: 'rtsp',
          description: formData.value.description.trim(),
          enable: false,
          algos: [],
          algoConfigs: {},
          createTime: now
        }

        const existingStream = STREAM_LIST_MOCK.find(
          item => item.streamName.toLowerCase() === newItem.streamName.toLowerCase()
        )

        if (existingStream) {
          ElMessage.warning('已存在同名流，请修改名称')
          isSubmitting.value = false
          return
        }

        tableData.value.unshift(newItem)
        STREAM_LIST_MOCK.unshift(newItem)

        ElMessage.success('添加成功')
      } else if (dialogType.value === 'edit' && editRowId.value !== null) {
        const idx = tableData.value.findIndex((item) => item.id === editRowId.value)
        if (idx !== -1) {
          const orgName = findOrgNameById(orgTree.value, formData.value.orgId)

          if (!orgName) {
            ElMessage.warning('选择的组织不存在，请重新选择')
            isSubmitting.value = false
            return
          }

          const updatedName = formData.value.streamName.trim()

          const existingStream = STREAM_LIST_MOCK.find(
            item => item.streamName.toLowerCase() === updatedName.toLowerCase() &&
              item.id !== editRowId.value
          )

          if (existingStream) {
            ElMessage.warning('已存在同名流，请修改名称')
            isSubmitting.value = false
            return
          }

          tableData.value[idx] = {
            ...tableData.value[idx],
            streamName: updatedName,
            orgId: formData.value.orgId,
            orgName,
            description: formData.value.description.trim()
          }

          const mockItem = STREAM_LIST_MOCK.find((item) => item.id === editRowId.value)
          if (mockItem) {
            mockItem.streamName = updatedName
            mockItem.orgId = formData.value.orgId
            mockItem.orgName = orgName
            mockItem.description = formData.value.description.trim()
          }

          ElMessage.success('更新成功')
        }
        getTableData()
      }

      dialogVisible.value = false
    } catch (err) {
      console.error('操作失败:', err)
      ElMessage.error('操作失败，请重试')
    } finally {
      isSubmitting.value = false
    }
  })
}

onMounted(() => {
  getTableData()
})

watch(
  () => props.orgId,
  () => {
    getTableData()
  }
)

const transferVisible = ref(false)
const transferValue = ref<number[]>([])
const transferLoading = ref(false)
const transferData = computed(() => {
  return STREAM_LIST_MOCK.filter(
    (item) => !item.orgId || item.orgId === '' || item.orgId === props.orgId
  ).map((item) => ({
    key: item.id,
    label: item.streamName,
    initial: item.streamName,
    disabled: false
  }))
})

function initTransferValue() {
  transferValue.value = STREAM_LIST_MOCK.filter((item) => item.orgId === props.orgId)
    .map((item) => item.id)
}

watch(tableData, () => {
  if (transferVisible.value) {
    initTransferValue()
  }
})

const filterMethod = (query: string, item: TransferDataItem) => {
  if (!query) return true
  const label = item.label as string
  return label.toLowerCase().includes(query.toLowerCase())
}

const handleTransferChange = (
  value: TransferKey[],
  direction: TransferDirection,
  movedKeys: TransferKey[]
) => {
  console.log(`${direction === 'right' ? '添加' : '移除'}了${movedKeys.length}个流`)
}

watch(
  () => formData.value.orgId,
  (newId: string) => {
    const pathArr = newId ? getOrgPathWithIds(orgTree.value, newId) : []
    selectedOrgPath.value = pathArr.map((item: { id: string; name: string }) => item.name)
    selectedOrgPathIds.value = pathArr.map((item: { id: string; name: string }) => item.id)
  }
)
function getOrgPathWithIds(
  tree: any[],
  id: string,
  path: { id: string; name: string }[] = []
): { id: string; name: string }[] {
  for (const node of tree) {
    if (node.id === id) return [...path, { id: node.id, name: node.name }]
    if (node.children) {
      const found = getOrgPathWithIds(node.children, id, [
        ...path,
        { id: node.id, name: node.name }
      ])
      if (found.length) return found
    }
  }
  return []
}

function openTransfer() {
  if (!props.orgId) {
    ElMessage.warning('请先选择组织')
    return
  }

  transferLoading.value = true
  initTransferValue()
  transferVisible.value = true
  transferLoading.value = false
}

function handleTransferOk() {
  if (transferLoading.value) return

  transferLoading.value = true

  try {
    const newIds = transferValue.value.filter((id) => {
      const stream = STREAM_LIST_MOCK.find((item) => item.id === id)
      return stream && stream.orgId !== props.orgId
    })

    const removedIds = STREAM_LIST_MOCK.filter(
      (item) => item.orgId === props.orgId && !transferValue.value.includes(item.id)
    ).map((item) => item.id)

    if (newIds.length === 0 && removedIds.length === 0) {
      ElMessage.info('未做任何更改')
      transferVisible.value = false
      transferLoading.value = false
      return
    }

    newIds.forEach((id) => {
      const stream = STREAM_LIST_MOCK.find((item) => item.id === id)
      if (stream) {
        stream.orgId = props.orgId || ''
        stream.orgName = findOrgNameById(ORG_TREE_MOCK, props.orgId || '')
      }
    })

    removedIds.forEach((id) => {
      const stream = STREAM_LIST_MOCK.find((item) => item.id === id)
      if (stream) {
        stream.orgId = ''
        stream.orgName = ''
      }
    })

    ElMessage.success(`成功添加${newIds.length}个流，移除${removedIds.length}个流`)
    transferVisible.value = false
    getTableData()
  } catch (err) {
    console.error('分配流错误:', err)
    ElMessage.error('操作失败，请重试')
  } finally {
    transferLoading.value = false
  }
}

function handleCancel(type: 'dialog' | 'transfer') {
  if (type === 'dialog') {
    ElMessageBox.confirm('确定要取消吗？未保存的内容将会丢失', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '继续编辑',
      type: 'warning'
    }).then(() => {
      dialogVisible.value = false
    }).catch(() => {
      // 用户选择继续编辑，不做任何操作
    })
  } else {
    transferVisible.value = false
  }
}

defineExpose({
  columns,
  columnChecks,
  getTableData,
  errorMessage
})
</script>

<style lang="scss" scoped>
.streaminfo-page {
  background: var(--art-main-bg-color);
  display: flex;
  flex-direction: column;
  height: 100%;
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

.dialog-footer {
  text-align: right;
  margin-top: 20px;
}

.custom-transfer-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 360px;
}

.custom-dark-transfer {
  border-radius: 8px;

  .el-transfer-panel {
    margin: 10px;
    background: #232323;
    color: #fff;
    border: 1px solid #333;
  }

  .el-transfer-panel__header {
    background: #232323;
    color: #fff;
    border-bottom: 1px solid #333;
  }

  .el-transfer-panel__body {
    background: #232323;
    color: #fff;
  }

  .el-transfer__buttons {
    .el-button {
      background: #333;
      color: #fff;
      border: none;
      border-radius: 4px;
    }
  }
}
</style>
