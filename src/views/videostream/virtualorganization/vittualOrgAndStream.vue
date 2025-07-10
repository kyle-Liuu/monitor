<template>

  <div class="streaminfo-page">
    <!-- 搜索区域 -->
    <ArtSearchBar v-model:filter="formFilters" :items="formItems" @reset="handleReset" @search="handleSearch" />
    <ElCard shadow="never" class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" @refresh="handleRefresh"
        layout="refresh,size,fullscreen,columns,settings" fullClass="art-table-card">
        <template #left>
          <ElButton @click="openTransfer" v-ripple type="primary">新增</ElButton>
          <ElButton type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete"
            :loading="batchOperationLoading">
            批量删除
          </ElButton>
          <ElButton type="success" :disabled="!selectedRows.length" @click="handleBatchEnable(true)"
            :loading="batchOperationLoading">
            批量启用
          </ElButton>
          <ElButton type="warning" :disabled="!selectedRows.length" @click="handleBatchEnable(false)"
            :loading="batchOperationLoading">
            批量禁用
          </ElButton>
        </template>
      </ArtTableHeader>
      <ArtTable ref="tableRef" row-key="id" :data="streamData" :loading="isLoading" :pagination="paginationState"
        :columns="columns" :table-config="{ emptyHeight: '360px' }" :layout="{ marginTop: 10, showIndex: false }"
        @selection-change="handleSelectionChange" @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange">
        <!-- 状态列插槽 -->
        <template #enable="{ row }">
          <ElTag :type="row.enable ? 'primary' : 'info'" effect="light" size="small">
            {{ row.enable ? '启用' : '禁用' }}
          </ElTag>
        </template>
      </ArtTable>
    </ElCard>
    <!-- 新增流穿梭框弹窗 -->
    <ElDialog v-model="transferVisible" title="分配视频流到当前组织" align-center :close-on-click-modal="false" destroy-on-close>
      <div class="custom-transfer-wrapper" v-loading="transferLoading">
        <ElTransfer v-model="transferValue" :data="transferData" filterable :filter-method="filterMethod"
          filter-placeholder="流名称" :titles="['未分配组织', '当前组织']" class="custom-dark-transfer"
          @change="handleTransferChange" />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="handleCancel('transfer')">取消</ElButton>
          <ElButton type="primary" @click="handleTransferOk" :loading="transferSubmitting" :disabled="transferLoading">
            确定</ElButton>
        </div>
      </template>
    </ElDialog>
    <!-- 编辑流弹窗 -->
    <ElDialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增' : '编辑'" width="420px" align-center
      :close-on-click-modal="false" destroy-on-close>
      <ElForm ref="formRef" :model="formData" label-width="90px" :rules="formRules" :validate-on-rule-change="false"
        status-icon>
        <ElFormItem label="流名称" prop="streamName">
          <ElInput v-model.trim="formData.streamName" maxlength="50" show-word-limit placeholder="请输入流名称" clearable />
        </ElFormItem>
        <ElFormItem label="组织" prop="orgId">
          <ElTreeSelect :key="treeSelectKey" v-model="formData.orgId" :data="orgTree" :props="{
            label: 'name',
            value: 'id',
            children: 'children',
            disabled: (node: any) => node.status === '禁用'
          }" :default-expanded-keys="expandedOrgKeys" placeholder="请选择组织" check-strictly clearable style="width: 100%"
            :render-after-expand="false">
            <template #default="{ node, data }">
              <span :style="selectedOrgPathIds.includes(data.id) ? 'color: #409EFF; font-weight: bold;' : ''">
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
        <ElFormItem label="状态">
          <ElSwitch v-model="formData.enable" active-text="启用" inactive-text="禁用" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model.trim="formData.description" type="textarea" maxlength="200" show-word-limit
            placeholder="请输入描述" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="handleCancel('dialog')">取消</ElButton>
          <ElButton type="primary" @click="handleDialogOk" :loading="isSubmitting">确定</ElButton>
        </div>
      </template>
    </ElDialog>
  </div>

</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h, nextTick, computed, watch, watchEffect } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useTable } from '@/composables/useTable'
import { useWindowSize } from '@vueuse/core'

import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
import ArtTable from '@/components/core/tables/art-table/index.vue'
import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
import { ElButton, ElCard, ElTableColumn, ElTransfer, ElTreeSelect, ElTag, ElSwitch } from 'element-plus'
import { BgColorEnum } from '@/enums/appEnum'
import type { SearchFormItem } from '@/types'
import { STREAM_LIST_MOCK, StreamItem, findOrgNameById } from '@/mock/temp/streamList'
import { ORG_TREE_MOCK } from '@/mock/temp/orgTree'
import { defineProps } from 'vue'
import type { TransferDataItem, TransferKey, TransferDirection } from 'element-plus'

interface Props {
  orgId?: string
}

const props = defineProps<Props>()

defineOptions({ name: 'VirtualOrgAndStream' })

const { width } = useWindowSize()
const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const selectedRows = ref<StreamItem[]>([])
const errorMessage = ref<string>('')
const isSubmitting = ref(false)
const batchOperationLoading = ref(false)
const transferSubmitting = ref(false)
// 删除重复声明的tableData
// const tableData = ref<StreamItem[]>([])

const formFilters = reactive({
  streamName: '',
  streamCode: '',
  protocol: '',
  disable: ''
})

const formItems: SearchFormItem[] = [
  {
    label: '流名称',
    prop: 'streamName',
    type: 'input',
    config: { clearable: true }
  },
  {
    label: '状态',
    prop: 'disable',
    type: 'select',
    config: {
      clearable: true,
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 'true' },
        { label: '禁用', value: 'false' }
      ]
    }
  }
]

// 删除自定义的pagination对象
// const pagination = reactive({
//   currentPage: 1,
//   pageSize: 20,
//   total: 0
// })

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
  description: '',
  enable: false
})
const formRules = {
  streamName: [
    { required: true, message: '请输入流名称', trigger: 'blur' },
    { min: 2, max: 50, message: '流名称长度为2-50字符', trigger: 'blur' }
  ],
  orgId: [{ required: true, message: '请选择组织', trigger: 'change' }]
}

// useTable Hook实现
const {
  columnChecks,
  columns,
  tableData: streamData,
  isLoading,
  paginationState,
  onPageSizeChange,
  onCurrentPageChange,
  refreshAll,
  refreshSoft,
  refreshAfterCreate,
  refreshAfterUpdate,
  refreshAfterRemove,
  searchState,
  searchData,
  resetSearch
} = useTable<StreamItem>({
  // 核心配置
  core: {
    apiFn: async (params: any) => {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        let filtered = [...STREAM_LIST_MOCK];

        // 应用筛选条件
        if (params.streamName && typeof params.streamName === 'string') {
          const searchTerm = params.streamName.toLowerCase().trim();
          filtered = filtered.filter((item) =>
            item.streamName.toLowerCase().includes(searchTerm)
          );
        }

        // 按组织筛选
        if (params.orgId) {
          filtered = filtered.filter((item) => item.orgId === params.orgId);
        }

        // 根据启用状态筛选
        if (params.disable === 'true') {
          filtered = filtered.filter(item => item.enable === true);
        } else if (params.disable === 'false') {
          filtered = filtered.filter(item => item.enable === false);
        }

        // 分页处理
        const start = (params.current - 1) * params.size;
        const end = start + params.size;
        const pageData = filtered.slice(start, end);

        return {
          records: pageData,
          total: filtered.length,
          size: params.size,
          current: params.current
        };
      } catch (err) {
        console.error('数据处理错误:', err);
        throw new Error('数据处理出错，请刷新重试');
      }
    },
    apiParams: {
      current: 1,
      size: 20,
      streamName: '',
      disable: ''
    } as any,
    immediate: false,
    columnsFactory: () => [
      { type: 'selection', width: 55 },
      { type: 'index', label: '序号', width: 60 },
      { prop: 'streamName', label: '流名称', minWidth: width.value < 500 ? 150 : 120, showOverflowTooltip: true },
      { prop: 'orgName', label: '组织', minWidth: 120, showOverflowTooltip: true },
      {
        prop: 'enable',
        label: '状态',
        width: 90,
        useSlot: true
      },
      { prop: 'description', label: '描述', minWidth: width.value < 500 ? 220 : 180, showOverflowTooltip: true },
      {
        prop: 'createTime',
        label: '创建时间',
        width: 160,
        formatter: (row: StreamItem) => formatDate(row.createTime)
      },
      {
        prop: 'operation',
        label: '操作',
        width: 150,
        fixed: 'right',
        formatter: (row: StreamItem) => {
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
      console.log('数据加载成功:', data.length);
      // tableData.value = data; // This line is removed as per the edit hint
    },
    onError: (error) => {
      console.error('获取数据错误:', error);
      errorMessage.value = error.message;
      ElMessage.error(error.message);
      // tableData.value = []; // This line is removed as per the edit hint
    }
  }
});

/**
 * 重置筛选条件并刷新数据
 */
const handleReset = () => {
  resetSearch();
}

/**
 * 执行筛选并刷新数据
 */
const handleSearch = () => {
  // 将表单筛选值传递给搜索状态
  Object.assign(searchState, formFilters);
  searchData();
}

/**
 * 刷新数据
 */
const handleRefresh = () => {
  refreshAll();
}

/**
 * 处理每页显示数量变化 - 使用useTable提供的方法
 */
const handleSizeChange = (size: number) => {
  onPageSizeChange(size);
}

/**
 * 处理页码变化 - 使用useTable提供的方法
 */
const handleCurrentChange = (page: number) => {
  onCurrentPageChange(page);
}

/**
 * 处理表格选择变化
 */
const handleSelectionChange = (selection: StreamItem[]) => {
  selectedRows.value = selection
}

/**
 * 批量启用/禁用流
 */
const handleBatchEnable = async (enableStatus: boolean) => {
  if (!selectedRows.value.length) return

  const actionText = enableStatus ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确认${actionText}选中的 ${selectedRows.value.length} 条记录吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: enableStatus ? 'success' : 'warning',
      closeOnClickModal: false
    })

    batchOperationLoading.value = true

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))

    const ids = selectedRows.value.map(row => row.id)
    let count = 0

    // 更新表格数据
    streamData.value.forEach(item => {
      if (ids.includes(item.id)) {
        item.enable = enableStatus
        count++
      }
    })

    // 同步更新Mock数据
    ids.forEach(id => {
      const mockItem = STREAM_LIST_MOCK.find(item => item.id === id)
      if (mockItem) {
        mockItem.enable = enableStatus
      }
    })

    ElMessage.success(`批量${actionText}成功，共处理${count}条记录`)
  } catch (err) {
    // 用户取消操作，不做任何处理
    console.log('操作已取消')
  } finally {
    batchOperationLoading.value = false
  }
}

/**
 * 删除单条记录
 */
const handleDelete = async (row: StreamItem) => {
  try {
    await ElMessageBox.confirm('确定要删除该流吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      closeOnClickModal: false
    })

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))

    const index = STREAM_LIST_MOCK.findIndex(item => item.id === row.id)
    if (index !== -1) {
      STREAM_LIST_MOCK.splice(index, 1)
    }

    // 同步更新表格数据
    const tableIndex = streamData.value.findIndex(item => item.id === row.id)
    if (tableIndex !== -1) {
      streamData.value.splice(tableIndex, 1)
    }

    ElMessage.success('删除成功')

    // 如果当前页删除完了，且不是第一页，则回到上一页
    if (streamData.value.length === 0 && paginationState.current > 1) {
      onCurrentPageChange(paginationState.current - 1); // 使用onCurrentPageChange方法
    } else if (streamData.value.length === 0) {
      // 如果是第一页且已删空，重新获取数据
      getTableData()
    }
  } catch (err) {
    // 用户取消操作，不做任何处理
    console.log('操作已取消')
  }
}

/**
 * 批量删除记录
 */
const handleBatchDelete = async () => {
  if (!selectedRows.value.length) return

  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条记录吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      closeOnClickModal: false
    })

    batchOperationLoading.value = true

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))

    const ids = selectedRows.value.map(row => row.id)

    // 从Mock数据中删除
    ids.forEach(id => {
      const index = STREAM_LIST_MOCK.findIndex(item => item.id === id)
      if (index !== -1) {
        STREAM_LIST_MOCK.splice(index, 1)
      }
    })

    ElMessage.success(`批量删除成功，共删除${ids.length}条记录`)
    selectedRows.value = []

    // 重新获取数据
    getTableData()
  } catch (err) {
    // 用户取消操作，不做任何处理
    console.log('操作已取消')
  } finally {
    batchOperationLoading.value = false
  }
}

/**
 * 获取表格数据 - 使用useTable提供的方法
 */
function getTableData() {
  // 将当前组织ID传入搜索参数
  if (props.orgId) {
    searchState.orgId = props.orgId;
  } else {
    delete searchState.orgId;
  }

  // 刷新数据
  refreshAll();
}

/**
 * 获取所有节点键
 */
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

/**
 * 格式化日期
 */
function formatDate(date: string | number | Date) {
  if (!date) return ''
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

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
  } catch (err) {
    console.error('日期格式化错误:', err)
    return ''
  }
}

const editRowId = ref<number | null>(null)

/**
 * 打开编辑/新增对话框
 */
function openDialog(type: 'add' | 'edit', row?: StreamItem) {
  dialogType.value = type

  // 重置表单数据
  if (type === 'edit' && row) {
    formData.value = {
      streamName: row.streamName || '',
      orgId: row.orgId || '',
      description: row.description || '',
      enable: row.enable || false
    }
    editRowId.value = row.id
  } else {
    formData.value = {
      streamName: '',
      orgId: props.orgId || '', // 默认使用当前组织ID
      description: '',
      enable: false
    }
    editRowId.value = null
  }

  // 打开对话框，使用nextTick确保DOM更新后再清除验证
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

/**
 * 处理对话框确认
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
      await handleAddStream()
    } else if (dialogType.value === 'edit' && editRowId.value !== null) {
      await handleEditStream()
    }

    dialogVisible.value = false

  } catch (err) {
    console.log('表单验证未通过或操作被取消')
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 处理新增流
 */
async function handleAddStream() {
  const now = new Date().toLocaleString('zh-CN', { hour12: false })
  const orgName = findOrgNameById(orgTree.value, formData.value.orgId)

  if (!orgName) {
    ElMessage.warning('选择的组织不存在，请重新选择')
    return Promise.reject(new Error('组织不存在'))
  }

  // 检查是否存在同名流
  const streamName = formData.value.streamName.trim()
  const existingStream = STREAM_LIST_MOCK.find(
    item => item.streamName.toLowerCase() === streamName.toLowerCase()
  )

  if (existingStream) {
    ElMessage.warning('已存在同名流，请修改名称')
    return Promise.reject(new Error('流名称重复'))
  }

  // 创建新流
  const newItem: StreamItem = {
    id: Date.now(),
    orgId: formData.value.orgId,
    orgName,
    streamName,
    streamCode: Math.random().toString(36).slice(2, 10),
    protocol: 'rtsp',
    description: formData.value.description.trim(),
    enable: formData.value.enable,
    algos: [],
    algoConfigs: {},
    createTime: now
  }

  // 更新数据
  streamData.value.unshift(newItem)
  STREAM_LIST_MOCK.unshift(newItem)

  ElMessage.success('添加成功')
  return Promise.resolve()
}

/**
 * 处理编辑流
 */
async function handleEditStream() {
  if (editRowId.value === null) return Promise.reject(new Error('无效的编辑ID'))

  const idx = streamData.value.findIndex((item) => item.id === editRowId.value)
  if (idx === -1) {
    ElMessage.error('要编辑的流不存在，请刷新页面')
    return Promise.reject(new Error('流不存在'))
  }

  const orgName = findOrgNameById(orgTree.value, formData.value.orgId)
  if (!orgName) {
    ElMessage.warning('选择的组织不存在，请重新选择')
    return Promise.reject(new Error('组织不存在'))
  }

  const updatedName = formData.value.streamName.trim()

  // 检查是否有同名流（排除自身）
  const existingStream = STREAM_LIST_MOCK.find(
    item => item.streamName.toLowerCase() === updatedName.toLowerCase() &&
      item.id !== editRowId.value
  )

  if (existingStream) {
    ElMessage.warning('已存在同名流，请修改名称')
    return Promise.reject(new Error('流名称重复'))
  }

  // 更新表格数据
  streamData.value[idx] = {
    ...streamData.value[idx],
    streamName: updatedName,
    orgId: formData.value.orgId,
    orgName,
    description: formData.value.description.trim(),
    enable: formData.value.enable
  }

  // 更新Mock数据源
  const mockItem = STREAM_LIST_MOCK.find((item) => item.id === editRowId.value)
  if (mockItem) {
    mockItem.streamName = updatedName
    mockItem.orgId = formData.value.orgId
    mockItem.orgName = orgName
    mockItem.description = formData.value.description.trim()
    mockItem.enable = formData.value.enable
  }

  ElMessage.success('更新成功')
  getTableData() // 刷新数据，确保与筛选条件一致
  return Promise.resolve()
}

onMounted(() => {
  getTableData()
})

watch(
  () => props.orgId,
  (newOrgId) => {
    if (newOrgId !== undefined) {
      onCurrentPageChange(1); // 使用onCurrentPageChange方法
      getTableData();
    }
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

/**
 * 初始化穿梭框选中值
 */
function initTransferValue() {
  transferValue.value = STREAM_LIST_MOCK.filter((item) => item.orgId === props.orgId)
    .map((item) => item.id)
}

watch(streamData, () => {
  if (transferVisible.value) {
    initTransferValue()
  }
})

/**
 * 穿梭框过滤方法
 */
const filterMethod = (query: string, item: TransferDataItem) => {
  if (!query) return true
  const label = item.label as string
  return label.toLowerCase().includes(query.toLowerCase())
}

/**
 * 穿梭框变更回调
 */
const handleTransferChange = (
  value: TransferKey[],
  direction: TransferDirection,
  movedKeys: TransferKey[]
) => {
  console.log(`${direction === 'right' ? '添加' : '移除'}了${movedKeys.length}个流`)
}

/**
 * 监听组织ID变化，更新组织路径
 */
watch(
  () => formData.value.orgId,
  (newId: string) => {
    if (!newId) {
      selectedOrgPath.value = []
      selectedOrgPathIds.value = []
      return
    }

    const pathArr = getOrgPathWithIds(orgTree.value, newId)
    selectedOrgPath.value = pathArr.map((item: { id: string; name: string }) => item.name)
    selectedOrgPathIds.value = pathArr.map((item: { id: string; name: string }) => item.id)
  }
)

/**
 * 获取组织路径
 */
function getOrgPathWithIds(
  tree: any[],
  id: string,
  path: { id: string; name: string }[] = []
): { id: string; name: string }[] {
  for (const node of tree) {
    if (node.id === id) return [...path, { id: node.id, name: node.name }]
    if (node.children && node.children.length) {
      const found = getOrgPathWithIds(node.children, id, [
        ...path,
        { id: node.id, name: node.name }
      ])
      if (found.length) return found
    }
  }
  return []
}

/**
 * 打开穿梭框
 */
function openTransfer() {
  if (!props.orgId) {
    ElMessage.warning('请先选择组织')
    return
  }

  transferLoading.value = true
  initTransferValue()
  transferVisible.value = true

  // 模拟加载延迟
  setTimeout(() => {
    transferLoading.value = false
  }, 300)
}

/**
 * 处理穿梭框确认
 */
async function handleTransferOk() {
  if (transferLoading.value || transferSubmitting.value) return

  transferSubmitting.value = true

  try {
    // 找出新增的和移除的ID
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
      return
    }

    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    // 处理新增的流
    newIds.forEach((id) => {
      const stream = STREAM_LIST_MOCK.find((item) => item.id === id)
      if (stream) {
        stream.orgId = props.orgId || ''
        stream.orgName = findOrgNameById(ORG_TREE_MOCK, props.orgId || '') || '未知组织'
      }
    })

    // 处理移除的流
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
    transferSubmitting.value = false
  }
}

/**
 * 处理取消
 */
function handleCancel(type: 'dialog' | 'transfer') {
  if (type === 'dialog' && isSubmitting.value) return
  if (type === 'transfer' && transferSubmitting.value) return

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
