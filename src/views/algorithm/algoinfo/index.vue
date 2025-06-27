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
            <ElButton type="primary" @click="showDialog('add')">新增流</ElButton>
            <ElButton type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">
              批量删除
            </ElButton>
          </template>
        </ArtTableHeader>
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

      <ElDialog
        v-model="dialogVisible"
        :title="dialogType === 'add' ? '新增算法' : '编辑算法'"
        width="30%"
        align-center
      >
        <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px">
          <ElFormItem label="算法名称" prop="label">
            <ElInput v-model="formData.label" />
          </ElFormItem>
          <ElFormItem label="标识符" prop="value">
            <ElInput v-model="formData.value" />
          </ElFormItem>
          <ElFormItem label="ID" prop="id">
            <ElInput v-model="formData.id" />
          </ElFormItem>
          <ElFormItem label="描述" prop="desc">
            <ElInput v-model="formData.desc" type="textarea" :rows="3" />
          </ElFormItem>
          <ElFormItem label="上传文件" prop="files" required>
            <ElUpload
              class="upload-demo"
              drag
              :action="'http://your-server.com/api/upload'"
              :multiple="true"
              :show-file-list="false"
              :before-upload="beforeUpload"
              :on-change="handleFileChange"
              accept=".zip,.rar,.7z"
              style="width: 100%"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text"> 拖拽压缩包到此处，或 <em>点击上传</em> </div>
              <template #tip>
                <div class="el-upload__tip">仅支持 zip/rar/7z 压缩包，单个文件不超过 500MB</div>
              </template>
            </ElUpload>
            <div v-if="formData.files && formData.files.length" class="file-list-box">
              <el-tag
                v-for="(file, idx) in formData.files"
                :key="file.uid || file.name"
                style="
                  margin: 2px 4px 2px 0;
                  max-width: 90%;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  display: inline-block;
                "
                :title="file.name"
              >
                {{ file.name }}
              </el-tag>
            </div>
          </ElFormItem>
        </ElForm>
        <template #footer>
          <div class="dialog-footer">
            <ElButton @click="dialogVisible = false">取消</ElButton>
            <ElButton type="primary" @click="handleSubmit">提交</ElButton>
          </div>
        </template>
      </ElDialog>

      <ElDrawer
        v-model="drawerVisible"
        :title="drawerData ? '布控配置' : ''"
        direction="rtl"
        size="50%"
        :with-header="true"
        :destroy-on-close="true"
        @close="handleDrawerClose"
      >
        <template #default>
          <div v-if="drawerData" class="drawer-content">
            <ElScrollbar>
              <ElTree
                v-if="drawerVisible"
                ref="treeRef"
                :data="processedRuleList"
                show-checkbox
                node-key="name"
                :default-expand-all="isExpandAll"
                :default-checked-keys="[]"
                :props="defaultProps"
                @check="handleTreeCheck"
              >
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
    ElTree,
    ElUpload
  } from 'element-plus'
  import { BgColorEnum } from '@/enums/appEnum'
  import type { SearchFormItem } from '@/types'
  import { STREAM_LIST_MOCK, StreamItem } from '@/mock/temp/streamList'
  import { mockAlgoList } from '@/mock/temp/algoList'
  import { UploadFilled } from '@element-plus/icons-vue'
  import type { UploadRawFile } from 'element-plus'

  defineOptions({ name: 'StreamInfo' })

  const { width } = useWindowSize()
  const loading = ref(false)
  const dialogVisible = ref(false)
  const dialogType = ref('add')
  const selectedRows = ref<any[]>([])

  const formFilters = reactive({
    label: '',
    value: ''
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

  // 算法标签表格数据
  const tableData = ref(mockAlgoList.flatMap((tab) => tab.items))

  const tableRef = ref()

  const formRef = ref<FormInstance>()
  const formData = reactive({
    id: '',
    label: '',
    value: '',
    desc: '',
    createTime: '',
    files: [] as UploadRawFile[]
  })

  const rules: FormRules = {
    label: [{ required: true, message: '请输入算法名称', trigger: 'blur' }],
    value: [{ required: true, message: '请输入标识符', trigger: 'blur' }],
    id: [{ required: true, message: '请输入ID', trigger: 'blur' }],
    desc: [{ required: true, message: '请输入描述', trigger: 'blur' }],
    files: [{ required: true, message: '请上传压缩包文件', trigger: 'change' }]
  }

  // 表格字段
  const { columnChecks, columns } = useCheckedColumns(() => [
    { type: 'selection', width: 50 },
    { type: 'index', label: '序号', width: 60 },
    { prop: 'id', label: 'ID', minWidth: 120 },
    { prop: 'label', label: '算法名称', minWidth: 120 },
    { prop: 'value', label: '标识符', minWidth: 120 },
    { prop: 'desc', label: '描述', minWidth: 180 },
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
            onClick: () => showDialog('edit', row)
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

  const showDialog = (type: string, row?: any) => {
    dialogVisible.value = true
    dialogType.value = type

    if (formRef.value) {
      formRef.value.resetFields()
    }

    if (type === 'edit' && row) {
      Object.assign(formData, row)
      if (!formData.createTime) {
        formData.createTime = new Date().toISOString()
      }
      if (!formData.files) formData.files = []
    } else {
      formData.id = ''
      formData.label = ''
      formData.value = ''
      formData.desc = ''
      formData.createTime = new Date().toISOString()
      formData.files = []
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
      let filtered = mockAlgoList.flatMap((tab) => tab.items)
      if (formFilters.label) {
        filtered = filtered.filter((item) => item.label.includes(formFilters.label))
      }
      if (formFilters.value) {
        filtered = filtered.filter((item) => item.value.includes(formFilters.value))
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

  // 文件类型校验，仅允许压缩包
  function beforeUpload(file: UploadRawFile) {
    const isZip = file.type === 'application/zip' || file.name.endsWith('.zip')
    const isRar = file.name.endsWith('.rar')
    const is7z = file.name.endsWith('.7z')
    if (!isZip && !isRar && !is7z) {
      ElMessage.error('仅支持上传 zip/rar/7z 压缩包文件！')
      return false
    }
    // 可加大小校验
    return true
  }

  // 文件变更处理
  function handleFileChange(file: any, fileList: any[]) {
    // 只保留通过校验的文件
    formData.files = fileList.map((f) => f.raw).filter(Boolean)
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

  .file-list-box {
    margin-top: 8px;
    max-width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    overflow-x: auto;
  }
</style>
