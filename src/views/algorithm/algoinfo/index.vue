<template>
  <ArtTableFullScreen>
    <div class="streaminfo-page" id="table-full-screen">
      <ArtSearchBar v-model:filter="formFilters" :items="formItems" @reset="handleReset" @search="handleSearch" />
      <ElCard shadow="never" class="art-table-card">
        <ArtTableHeader :columnList="columns" v-model:columns="columnChecks" @refresh="handleRefresh">
          <template #left>
            <ElButton type="primary" @click="showDialog('add')">新增流</ElButton>
            <ElButton type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">
              批量删除
            </ElButton>
          </template>
        </ArtTableHeader>
        <ArtTable ref="tableRef" row-key="streamCode" :data="tableData" :loading="loading"
          :currentPage="pagination.currentPage" :pageSize="pagination.pageSize" :total="pagination.total"
          :marginTop="10" :showPagination="true" @selection-change="handleSelectionChange"
          @size-change="handleSizeChange" @current-change="handleCurrentChange">
          <template #default>
            <ElTableColumn v-for="col in columns" :key="col.prop || col.type" v-bind="col" />
          </template>
          <!-- <template #pagination>
            <div class="pagination-container">
              <el-pagination
                v-model:currentPage="pagination.currentPage"
                v-model:pageSize="pagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="pagination.total"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </template> -->
        </ArtTable>
      </ElCard>

      <ElDialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增流' : '编辑流'" width="30%" align-center>
        <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
          <ElFormItem label="流名称" prop="streamName">
            <ElInput v-model="formData.streamName" />
          </ElFormItem>
          <ElFormItem label="流编码" prop="streamCode">
            <ElInput v-model="formData.streamCode" />
          </ElFormItem>
          <ElFormItem label="协议" prop="protocol">
            <ElSelect v-model="formData.protocol">
              <ElOption label="rtsp" value="rtsp" />
              <ElOption label="GB28181" value="GB28181" disabled />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="描述" prop="description">
            <ElInput v-model="formData.description" type="textarea" :rows="3" />
          </ElFormItem>
          <ElFormItem label="启用">
            <ElSwitch v-model="formData.disable" />
          </ElFormItem>
        </ElForm>
        <template #footer>
          <div class="dialog-footer">
            <ElButton @click="dialogVisible = false">取消</ElButton>
            <ElButton type="primary" @click="handleSubmit">提交</ElButton>
          </div>
        </template>
      </ElDialog>

      <ElDrawer v-model="drawerVisible" :title="drawerData ? '布控配置' : ''" direction="rtl" size="50%" :with-header="true"
        :destroy-on-close="true" @close="handleDrawerClose">
        <template #default>
          <div v-if="drawerData" class="drawer-content">
            <ElScrollbar>
              <ElTree v-if="drawerVisible" ref="treeRef" :data="processedRuleList" show-checkbox node-key="name"
                :default-expand-all="isExpandAll" :default-checked-keys="[]" :props="defaultProps"
                @check="handleTreeCheck">
                <template #default="{ data }">
                  <div style="display: flex; align-items: center">
                    <span>{{ data.label }}</span>
                  </div>
                </template>
              </ElTree>
            </ElScrollbar>
          </div>
        </template>
        <template #footer>
          <div class="drawer-footer">
            <ElButton @click="toggleExpandAll">{{
              isExpandAll ? '全部收起' : '全部展开'
            }}</ElButton>
            <ElButton @click="toggleSelectAll" style="margin-left: 8px">
              {{ isSelectAll ? '取消全选' : '全部选择' }}
            </ElButton>
            <ElButton type="primary" @click="saveRules">保存</ElButton>
          </div>
        </template>
      </ElDrawer>
    </div>
  </ArtTableFullScreen>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useCheckedColumns } from '@/composables/useCheckedColumns'
import { useWindowSize } from '@vueuse/core'
import ArtTableFullScreen from '@/components/core/tables/ArtTableFullScreen.vue'
import ArtTableHeader from '@/components/core/tables/ArtTableHeader.vue'
import ArtTable from '@/components/core/tables/ArtTable.vue'
import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
import ArtButtonTable from '@/components/core/forms/ArtButtonTable.vue'
import {
  ElButton,
  ElCard,
  ElTableColumn,
  ElTag,
  ElDialog,
  ElDrawer,
  ElScrollbar,
  ElTree
} from 'element-plus'
import { BgColorEnum } from '@/enums/appEnum'
import type { SearchFormItem } from '@/types'
import { STREAM_LIST_MOCK, StreamItem } from '@/mock/temp/streamList'

defineOptions({ name: 'StreamInfo' })

const { width } = useWindowSize()
const loading = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('add')
const selectedRows = ref<any[]>([])

const formFilters = reactive({
  streamName: '',
  streamCode: '',
  protocol: '',
  disable: ''
})

const formItems: SearchFormItem[] = [
  { label: '流名称', prop: 'streamName', type: 'input', config: { clearable: true } },
  { label: '流编码', prop: 'streamCode', type: 'input', config: { clearable: true } },
  {
    label: '协议',
    prop: 'protocol',
    type: 'select',
    config: { clearable: true },
    options: () => [
      { label: 'rtsp', value: 'rtsp' },
      { label: 'GB28181', value: 'GB28181', disabled: true }
    ]
  },
  {
    label: '启用',
    prop: 'disable',
    type: 'select',
    config: { clearable: true },
    options: () => [
      { label: '全部', value: '' },
      { label: '启用', value: '0' },
      { label: '禁用', value: '1' }
    ]
  }
]

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref<StreamItem[]>([])
const tableRef = ref()

const formRef = ref<FormInstance>()
const formData = reactive({
  streamName: '',
  streamCode: '',
  protocol: 'rtsp',
  description: '',
  disable: false
})

const rules: FormRules = {
  streamName: [
    { required: true, message: '请输入流名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  streamCode: [
    { required: true, message: '请输入流编码', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  protocol: [{ required: true, message: '请选择协议', trigger: 'change' }]
}

const { columnChecks, columns } = useCheckedColumns(() => [
  { type: 'selection', width: 55 },
  { type: 'index', label: '序号', width: 60 },
  { prop: 'streamName', label: '流名称', minWidth: width.value < 500 ? 150 : '' },
  { prop: 'streamCode', label: '流编码', minWidth: width.value < 500 ? 150 : '' },
  { prop: 'protocol', label: '协议', width: 100 },
  { prop: 'description', label: '描述', minWidth: width.value < 500 ? 220 : '' },
  {
    prop: 'disable',
    label: '启用',
    width: 80,
    formatter: (row: any) => {
      return h(ElTag, { type: row.disable ? 'primary' : 'info' }, () =>
        row.disable ? '启用' : '禁用'
      )
    }
  },
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
          onClick: () => showDialog('edit', row)
        }),
        h(ArtButtonTable, {
          type: 'more',
          iconClass: BgColorEnum.PRIMARY,
          onClick: () => openDrawer(row)
        }),
        h(ArtButtonTable, {
          type: 'delete',
          onClick: () => handleDelete(row)
        })
      ])
    }
  }
])

const drawerVisible = ref(false)
const drawerData = ref<any>(null)
const treeRef = ref()
const isExpandAll = ref(true)
const isSelectAll = ref(false)

// 布控规则列表
const processedRuleList = ref([
  {
    id: 1,
    name: 'rule_1',
    label: '人员闯入',
    children: [
      { id: 11, name: 'rule_1_1', label: '禁区闯入' },
      { id: 12, name: 'rule_1_2', label: '围栏翻越' }
    ]
  },
  {
    id: 2,
    name: 'rule_2',
    label: '物品监控',
    children: [
      { id: 21, name: 'rule_2_1', label: '物品遗留' },
      { id: 22, name: 'rule_2_2', label: '物品移除' }
    ]
  },
  {
    id: 3,
    name: 'rule_3',
    label: '异常行为',
    children: [
      { id: 31, name: 'rule_3_1', label: '奔跑检测' },
      { id: 32, name: 'rule_3_2', label: '徘徊检测' },
      { id: 33, name: 'rule_3_3', label: '打架斗殴' }
    ]
  }
])

const defaultProps = {
  children: 'children',
  label: (data: any) => data.label
}

function openDrawer(row: any) {
  drawerData.value = row
  nextTick(() => {
    drawerVisible.value = true
  })
}

const handleReset = () => {
  formFilters.streamName = ''
  formFilters.streamCode = ''
  formFilters.protocol = ''
  formFilters.disable = ''
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

const showDialog = (type: string, row?: any) => {
  dialogVisible.value = true
  dialogType.value = type

  if (formRef.value) {
    formRef.value.resetFields()
  }

  if (type === 'edit' && row) {
    Object.assign(formData, row)
  } else {
    formData.streamName = ''
    formData.streamCode = ''
    formData.protocol = 'rtsp'
    formData.description = ''
    formData.disable = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success(dialogType.value === 'add' ? '新增成功' : '更新成功')
      dialogVisible.value = false
      getTableData()
    }
  })
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
  setTimeout(() => {
    // 筛选
    let filtered = STREAM_LIST_MOCK.slice()
    if (formFilters.streamName) {
      filtered = filtered.filter((item) => item.streamName.includes(formFilters.streamName))
    }
    if (formFilters.streamCode) {
      filtered = filtered.filter((item) => item.streamCode.includes(formFilters.streamCode))
    }
    if (formFilters.protocol) {
      filtered = filtered.filter((item) => item.protocol === formFilters.protocol)
    }
    if (formFilters.disable !== '') {
      if (formFilters.disable === '1') filtered = filtered.filter((item) => item.disable)
      if (formFilters.disable === '0') filtered = filtered.filter((item) => !item.disable)
    }
    pagination.total = filtered.length
    const start = (pagination.currentPage - 1) * pagination.pageSize
    tableData.value = filtered.slice(start, start + pagination.pageSize)
    loading.value = false
  }, 200)
}

const toggleExpandAll = () => {
  const tree = treeRef.value
  if (!tree) return

  // 使用store.nodesMap直接控制所有节点的展开状态
  const nodes = tree.store.nodesMap
  for (const node in nodes) {
    nodes[node].expanded = !isExpandAll.value
  }

  isExpandAll.value = !isExpandAll.value
}

const toggleSelectAll = () => {
  const tree = treeRef.value
  if (!tree) return

  if (!isSelectAll.value) {
    // 全选：获取所有节点的key并设置为选中
    const allKeys = getAllNodeKeys(processedRuleList.value)
    tree.setCheckedKeys(allKeys)
  } else {
    // 取消全选：清空所有选中
    tree.setCheckedKeys([])
  }

  isSelectAll.value = !isSelectAll.value
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

const handleTreeCheck = () => {
  const tree = treeRef.value
  if (!tree) return

  // 使用树组件的getCheckedKeys方法获取选中的节点
  const checkedKeys = tree.getCheckedKeys()
  const allKeys = getAllNodeKeys(processedRuleList.value)

  // 判断是否全选：选中的节点数量等于总节点数量
  isSelectAll.value = checkedKeys.length === allKeys.length && allKeys.length > 0
}

const saveRules = () => {
  const tree = treeRef.value
  if (!tree) return

  const checkedKeys = tree.getCheckedKeys()
  const checkedNodes = tree.getCheckedNodes()

  console.log('选中的规则:', checkedNodes)
  ElMessage.success('布控规则保存成功')
  drawerVisible.value = false
}

const handleDrawerClose = () => {
  drawerData.value = null
  isExpandAll.value = true
  isSelectAll.value = false
  if (treeRef.value) {
    treeRef.value.setCheckedKeys([])
  }
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

onMounted(() => {
  getTableData()
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
</style>
