<template>
  <ArtTableFullScreen>
    <div class="streaminfo-page" id="table-full-screen">
      <ArtSearchBar
        v-model:filter="formFilters"
        :items="formItems"
        @reset="handleReset"
        @search="handleSearch"
      />
      <ElCard shadow="never" class="art-table-card">
        <ArtTableHeader
          :columnList="columns"
          v-model:columns="columnChecks"
          @refresh="handleRefresh"
        >
          <template #left>
            <ElButton @click="openTransfer" v-ripple>新增</ElButton>
            <ElButton type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">
              批量删除
            </ElButton>
          </template>
        </ArtTableHeader>
        <!-- <VueDraggable target="tbody" handle=".handle" v-model="tableData" :animation="150"> -->
        <ArtTable
          ref="tableRef"
          row-key="streamCode"
          :data="tableData"
          :loading="loading"
          :currentPage="pagination.currentPage"
          :pageSize="pagination.pageSize"
          :total="pagination.total"
          :marginTop="10"
          :showPagination="true"
          @selection-change="handleSelectionChange"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        >
          <template #default>
            <ElTableColumn v-for="col in columns" :key="col.prop || col.type" v-bind="col" />
          </template>
        </ArtTable>
        <!-- </VueDraggable> -->
      </ElCard>
      <!-- 新增流穿梭框弹窗 -->
      <ElDialog v-model="transferVisible" title="分配视频流到当前组织" width="520px" align-center>
        <div class="custom-transfer-wrapper">
          <ElTransfer
            v-model="transferValue"
            :data="transferData"
            filterable
            :filter-method="filterMethod"
            filter-placeholder="流名称/拼音"
            :titles="['未分配组织', '当前组织']"
            style="width: 400px; height: 320px"
            class="custom-dark-transfer"
            @change="handleTransferChange"
          />
        </div>
        <template #footer>
          <div class="dialog-footer">
            <ElButton @click="transferVisible = false">取消</ElButton>
            <ElButton type="primary" @click="transferVisible = false">确定</ElButton>
          </div>
        </template>
      </ElDialog>
      <!-- 编辑流弹窗 -->
      <ElDialog
        v-model="dialogVisible"
        :title="dialogType === 'add' ? '新增流' : '编辑流'"
        width="420px"
        align-center
      >
        <ElForm
          ref="formRef"
          :model="formData"
          label-width="90px"
          :rules="formRules"
          :validate-on-rule-change="false"
        >
          <ElFormItem label="流名称" prop="streamName">
            <ElInput
              v-model="formData.streamName"
              maxlength="50"
              show-word-limit
              placeholder="请输入流名称"
            />
          </ElFormItem>
          <ElFormItem label="组织" prop="orgId">
            <ElTreeSelect
              :key="treeSelectKey"
              v-model="formData.orgId"
              :data="orgTree"
              :props="{
                label: 'name',
                value: 'id',
                children: 'children',
                disabled: (node: any) => node.status === '禁用'
              }"
              :default-expanded-keys="expandedOrgKeys"
              placeholder="请选择组织"
              check-strictly
              clearable
              style="width: 100%"
              :render-after-expand="false"
            >
              <template #default="{ node, data }">
                <span
                  :style="
                    selectedOrgPathIds.includes(data.id) ? 'color: #409EFF; font-weight: bold;' : ''
                  "
                >
                  {{ data.name }}
                </span>
              </template>
            </ElTreeSelect>
            <div
              v-if="selectedOrgPath.length"
              style="margin-top: 4px; display: flex; align-items: center; flex-wrap: wrap"
            >
              <span style="color: #409eff">组织路径：</span>
              <template v-for="(name, idx) in selectedOrgPath" :key="idx">
                <ElTag type="info" effect="plain" style="margin-right: 4px">{{ name }}</ElTag>
                <span v-if="idx < selectedOrgPath.length - 1" style="color: #aaa; margin-right: 4px"
                  >&gt;</span
                >
              </template>
            </div>
          </ElFormItem>
          <ElFormItem label="描述">
            <ElInput
              v-model="formData.description"
              type="textarea"
              maxlength="200"
              show-word-limit
              placeholder="请输入描述"
            />
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

  defineOptions({ name: 'StreamInfo' })

  const { width } = useWindowSize()
  const loading = ref(false)
  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const selectedRows = ref<any[]>([])

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
    setTimeout(() => {
      // 筛选
      let filtered = STREAM_LIST_MOCK.slice()
      if (formFilters.streamName) {
        filtered = filtered.filter((item) => item.streamName.includes(formFilters.streamName))
      }
      // 根据所选组织过滤
      if (props.orgId) {
        filtered = filtered.filter((item) => item.orgId === props.orgId)
      }
      pagination.total = filtered.length
      const start = (pagination.currentPage - 1) * pagination.pageSize
      tableData.value = filtered.slice(start, start + pagination.pageSize)
      loading.value = false
    }, 200)
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
      if (dialogType.value === 'add') {
        // 新增本地mock，补全所有字段
        const now = new Date().toLocaleString('zh-CN', { hour12: false })
        const orgName = findOrgNameById(orgTree.value, formData.value.orgId)
        tableData.value.unshift({
          id: Date.now(),
          orgId: formData.value.orgId,
          orgName,
          streamName: formData.value.streamName,
          streamCode: Math.random().toString(36).slice(2, 10),
          protocol: 'rtsp',
          description: formData.value.description,
          disable: false,
          algos: [],
          algoConfigs: {},
          createTime: now
        })
      } else if (dialogType.value === 'edit' && editRowId.value !== null) {
        // 编辑本地mock
        const idx = tableData.value.findIndex((item) => item.id === editRowId.value)
        if (idx !== -1) {
          const orgName = findOrgNameById(orgTree.value, formData.value.orgId)
          tableData.value[idx] = {
            ...tableData.value[idx],
            streamName: formData.value.streamName,
            orgId: formData.value.orgId,
            orgName,
            description: formData.value.description
          }
        }
      }
      dialogVisible.value = false
    })
  }

  onMounted(() => {
    getTableData()
  })

  // 监听orgId变化自动刷新表格
  watch(
    () => props.orgId,
    () => {
      getTableData()
    }
  )

  // 穿梭框数据和逻辑
  const transferVisible = ref(false)
  const transferValue = ref<number[]>([])
  const transferData = computed(() => {
    // 所有流，未分配组织的在左侧
    return tableData.value
      .filter((item) => !item.orgId || item.orgId === '')
      .map((item) => ({
        key: item.id,
        label: item.streamName,
        initial: item.streamName // 可扩展拼音首字母
      }))
  })
  watchEffect(() => {
    // 当前组织下的流 id
    transferValue.value = tableData.value
      .filter((item) => item.orgId === props.orgId)
      .map((item) => item.id)
  })
  const filterMethod = (query: string, item: TransferDataItem) => {
    return (item.label as string).toLowerCase().includes(query.toLowerCase())
  }
  const handleTransferChange = (
    value: TransferKey[],
    direction: TransferDirection,
    movedKeys: TransferKey[]
  ) => {
    if (direction === 'right') {
      movedKeys.forEach((id) => {
        const stream = tableData.value.find((item) => item.id === id)
        if (stream) stream.orgId = props.orgId || ''
      })
    } else {
      movedKeys.forEach((id) => {
        const stream = tableData.value.find((item) => item.id === id)
        if (stream) stream.orgId = ''
      })
    }
    getTableData()
  }

  // 编辑弹窗组织字段联动路径
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
    transferVisible.value = true
  }

  defineExpose({
    columns,
    columnChecks
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
