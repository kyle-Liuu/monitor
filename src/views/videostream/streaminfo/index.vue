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
            <ElButton type="primary" @click="openDrawer('add')">新增流</ElButton>
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

      <ElDrawer
        v-model="drawerVisible"
        :title="drawerTitle"
        size="50%"
        :with-header="true"
        :before-close="handleClose"
      >
        <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px">
          <ElFormItem label="流名称" prop="streamName">
            <ElInput v-model="formData.streamName" />
          </ElFormItem>
          <ElFormItem label="协议" prop="protocol">
            <ElSelect v-model="formData.protocol">
              <ElOption label="rtsp" value="rtsp" />
              <ElOption label="GB28181" value="GB28181" disabled />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="流地址" prop="streamCode">
            <ElInput v-model="formData.streamCode" />
          </ElFormItem>
          <ElFormItem label="检测">
            <div style="display: flex; align-items: center">
              <ElButton type="primary" size="small" @click="handleCheckStream">视频流检测</ElButton>
              <span
                v-if="checkStatus !== ''"
                :style="{
                  marginLeft: '12px',
                  color: checkStatus === '在线' ? '#67C23A' : '#F56C6C'
                }"
              >
                {{ checkStatus }}
              </span>
            </div>
          </ElFormItem>
          <ElFormItem label="描述" prop="description">
            <ElInput v-model="formData.description" type="textarea" :rows="3" />
          </ElFormItem>
          <ElFormItem label="绑定组织" prop="orgId">
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
          <ElFormItem label="算法标签">
            <div
              class="algo-tag-box"
              style="
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                min-height: 40px;
                flex-wrap: wrap;
                border: 1px solid var(--el-border-color);
                border-radius: 4px;
                padding: 4px 8px;
                cursor: pointer;
                background: var(--el-fill-color-blank);
              "
              @click="onAlgoBoxClick"
            >
              <ElTag
                v-for="algo in selectedAlgos"
                :key="algo"
                closable
                @close.stop="removeAlgo(algo)"
                style="margin: 2px 4px 2px 0; user-select: none"
              >
                {{ getAlgoLabel(algo) }}
              </ElTag>
              <span v-if="!selectedAlgos.length" style="color: #aaa">点击选择算法</span>
            </div>
          </ElFormItem>
          <!-- 动态算法配置卡片区 -->
          <div v-for="algo in selectedAlgos" :key="algo" style="margin-bottom: 20px">
            <ElCard>
              <div style="font-weight: bold; margin-bottom: 10px">{{ getAlgoLabel(algo) }}</div>
              <ElFormItem label="标定检测区域" required>
                <ElButton @click="onCalibrateClick">标定检测区域</ElButton>
                <ElButton @click="onViewCalibrateClick">查看检测区域</ElButton>
              </ElFormItem>
              <ElFormItem label="告警间隔">
                <ElInput
                  v-model="algoConfigs[algo].interval"
                  type="number"
                  style="width: 120px"
                  suffix="秒"
                />
              </ElFormItem>
              <ElFormItem label="告警窗口长度">
                <ElInput
                  v-model="algoConfigs[algo].window"
                  type="number"
                  style="width: 120px"
                  suffix="秒"
                />
              </ElFormItem>
              <ElFormItem label="告警阈值">
                <ElInput
                  v-model="algoConfigs[algo].threshold"
                  type="number"
                  style="width: 120px"
                  suffix="秒"
                />
              </ElFormItem>
              <ElFormItem label="浏览器语音播报">
                <ElInput v-model="algoConfigs[algo].voice" />
              </ElFormItem>
              <ElFormItem label="危险等级">
                <ElInput v-model="algoConfigs[algo].level" />
              </ElFormItem>
            </ElCard>
          </div>
          <ElFormItem label="启用">
            <ElSwitch v-model="formData.enable" />
          </ElFormItem>
          <div style="text-align: right; margin-top: 20px">
            <ElButton @click="drawerVisible = false">取消</ElButton>
            <ElButton type="primary" @click="handleSubmit">提交</ElButton>
          </div>
        </ElForm>
        <!-- 算法标签选择弹窗 -->
        <ElDialog v-model="algoDialogVisible" title="选择算法" width="800px" append-to-body>
          <ElTabs v-model="algoTab">
            <ElTabPane v-for="tab in algoTabs" :key="tab.name" :label="tab.label" :name="tab.name">
              <ElCheckboxGroup v-model="algoDialogChecked">
                <ElCheckbox v-for="item in tab.items" :key="item.value" :label="item.value"
                  >{{ item.label }}
                </ElCheckbox>
              </ElCheckboxGroup>
            </ElTabPane>
          </ElTabs>
          <template #footer>
            <ElButton @click="algoDialogVisible = false">取消</ElButton>
            <ElButton type="primary" @click="handleAlgoDialogConfirm">完成</ElButton>
          </template>
        </ElDialog>
      </ElDrawer>

      <ElDialog
        v-model="calibrateDialogVisible"
        width="900px"
        top="40px"
        append-to-body
        :show-close="true"
      >
        <div style="padding: 0 8px">
          <div
            style="
              display: flex;
              justify-content: flex-start;
              align-items: center;
              margin-bottom: 12px;
            "
          >
            <ElButton type="info" icon="el-icon-camera">获取原始图片</ElButton>
          </div>
          <div
            style="
              position: relative;
              background: #fff;
              text-align: center;
              border-radius: 8px;
              padding: 18px 0;
              box-shadow: 0 2px 8px #0001;
              overflow: scroll;
              max-height: 600px;
            "
          >
            <div :style="{ position: 'relative', display: 'inline-block' }">
              <img
                ref="calibrateImg"
                :src="calibrateImgUrl"
                :style="{
                  maxWidth: '95%',
                  borderRadius: '8px',
                  boxShadow: '0 1px 6px #0002',
                  transform: `scale(${imgScale})`,
                  userSelect: 'none',
                  pointerEvents: 'none',
                  position: 'relative',
                  zIndex: 1
                }"
                draggable="false"
                @load="onImgLoad"
              />
              <canvas
                v-show="showCalibrateActions"
                ref="calibrateCanvas"
                :width="imgNaturalWidth"
                :height="imgNaturalHeight"
                :style="{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transform: `scale(${imgScale})`,
                  pointerEvents: editingPolygon ? 'auto' : 'none',
                  zIndex: 10,
                  userSelect: 'none',
                  cursor: editingPolygon ? 'crosshair' : 'default',
                  background: '#00330022'
                }"
                @mousedown="editingPolygon ? onCanvasMouseDown : undefined"
                @dblclick="editingPolygon ? onCanvasDblClick : undefined"
                draggable="false"
              ></canvas>
            </div>
          </div>
          <div
            v-if="showCalibrateActions"
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 24px;
              gap: 12px;
            "
          >
            <div>
              <ElButton type="primary" size="small" @click="startEditPolygon">编辑多边形</ElButton>
              <ElButton type="danger" size="small" @click="clearPolygon">清除</ElButton>
              <ElButton size="small" @click="zoomIn">+</ElButton>
              <ElButton size="small" @click="zoomOut">-</ElButton>
            </div>
            <ElButton type="warning" size="small" @click="savePolygon">保存</ElButton>
          </div>
        </div>
      </ElDialog>
    </div>
  </ArtTableFullScreen>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, h, nextTick, computed, watch } from 'vue'
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
    ElTabs,
    ElTabPane,
    ElCheckboxGroup,
    ElCheckbox,
    ElTreeSelect,
    ElTooltip
  } from 'element-plus'
  import { BgColorEnum } from '@/enums/appEnum'
  import type { SearchFormItem } from '@/types'
  import { STREAM_LIST_MOCK, StreamItem } from '@/mock/temp/streamList'
  import { VueDraggable } from 'vue-draggable-plus'
  import { ORG_TREE_MOCK } from '@/mock/temp/orgTree'
  import { defineProps } from 'vue'

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
    enable: ''
  })

  const formItems: SearchFormItem[] = [
    { label: '流名称', prop: 'streamName', type: 'input', config: { clearable: true } },
    { label: '流地址', prop: 'streamCode', type: 'input', config: { clearable: true } },
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
      prop: 'enable',
      type: 'select',
      config: { clearable: true },
      options: () => [
        { label: '全部', value: '' },
        { label: '启用', value: '1' },
        { label: '禁用', value: '0' }
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
  const orgTree = ref(ORG_TREE_MOCK)
  const expandedOrgKeys = ref<string[]>([])
  const treeSelectKey = ref(0)
  const selectedOrgPath = ref<string[]>([])
  const selectedOrgPathIds = ref<string[]>([])
  const formData = reactive<{
    orgId: string
    streamName: string
    streamCode: string
    protocol: string
    description: string
    enable: boolean
  }>({
    orgId: '',
    streamName: '',
    streamCode: '',
    protocol: 'rtsp',
    description: '',
    enable: false
  })

  const rules: FormRules = {
    streamName: [
      { required: true, message: '请输入流名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    streamCode: [
      { required: true, message: '请输入流地址', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    protocol: [{ required: true, message: '请选择协议', trigger: 'change' }],
    checkStatus: [{ required: true, message: '请先进行视频流检测', trigger: 'change' }]
  }

  const { columnChecks, columns } = useCheckedColumns(() => [
    { type: 'selection', width: 55 },
    { type: 'index', label: '序号', width: 60 },
    { prop: 'streamName', label: '流名称', minWidth: width.value < 500 ? 150 : '' },
    { prop: 'streamCode', label: '流地址', minWidth: width.value < 500 ? 150 : '' },
    { prop: 'protocol', label: '协议', width: 100 },
    { prop: 'orgName', label: '组织', minWidth: 120 },
    { prop: 'description', label: '描述', minWidth: width.value < 500 ? 220 : '' },
    {
      prop: 'algos',
      label: '算法标签',
      minWidth: 200,
      formatter: (row: StreamItem) => {
        const labels = row.algos.map(
          (val) => algoOptions.find((a) => a.value === val)?.label || val
        )
        const tagStyle = 'margin:2px 4px 2px 0;white-space:nowrap;'
        if (labels.length <= 3) {
          return h(
            'div',
            {},
            labels.map((label) => h(ElTag, { style: tagStyle }, () => label))
          )
        }
        const firstThree = labels.slice(0, 3)
        const rest = labels.slice(3)
        return h('div', {}, [
          ...firstThree.map((label) => h(ElTag, { style: tagStyle }, () => label)),
          h(
            ElTooltip,
            {
              placement: 'top',
              effect: 'light',
              popperClass: 'algo-tooltip-popper'
            },
            {
              default: () =>
                h(
                  ElTag,
                  { style: tagStyle + 'cursor:pointer;user-select:none;' },
                  () => `+${rest.length}`
                ),
              content: () =>
                h(
                  'div',
                  { style: 'display:flex;flex-wrap:wrap;gap:4px;max-width:300px;' },
                  rest.map((label) => h(ElTag, { style: tagStyle }, () => label))
                )
            }
          )
        ])
      }
    },
    {
      prop: 'enable',
      label: '启用',
      width: 80,
      formatter: (row: any) => {
        return h(ElTag, { type: row.enable ? 'success' : 'info' }, () =>
          row.enable ? '启用' : '禁用'
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
            onClick: () => openDrawer('edit', row)
          }),
          h(ArtButtonTable, {
            type: 'more',
            iconClass: BgColorEnum.PRIMARY,
            onClick: () => {}
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
  const drawerMode = ref<'add' | 'edit'>('add')
  const drawerTitle = computed(() => (drawerMode.value === 'add' ? '新增流' : '编辑流'))
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

  const props = defineProps<{ orgId?: string }>()

  function openDrawer(mode: 'add' | 'edit', row?: any) {
    drawerMode.value = mode
    drawerVisible.value = true
    if (mode === 'edit' && row) {
      formData.streamName = row.streamName
      formData.streamCode = row.streamCode
      formData.protocol = row.protocol
      formData.description = row.description
      formData.enable = row.enable ?? false
      // 回显算法标签和配置（如有）
      selectedAlgos.value = row.algos || []
      Object.assign(algoConfigs, row.algoConfigs || {})
      formData.orgId = row.orgId
      expandedOrgKeys.value = getOrgParentKeys(orgTree.value, row.orgId)
    } else {
      formData.streamName = ''
      formData.streamCode = ''
      formData.protocol = 'rtsp'
      formData.description = ''
      formData.enable = false
      selectedAlgos.value = []
      Object.keys(algoConfigs).forEach((key) => delete algoConfigs[key])
      expandedOrgKeys.value = []
    }
    treeSelectKey.value = Date.now()
  }

  const handleReset = () => {
    formFilters.streamName = ''
    formFilters.streamCode = ''
    formFilters.protocol = ''
    formFilters.enable = ''
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
    }
  }

  const handleSubmit = () => {
    if (!formRef.value) return
    formRef.value.validate((valid: boolean) => {
      if (valid) {
        const submitData = {
          ...formData,
          algos: selectedAlgos.value,
          algoConfigs: { ...algoConfigs }
        }
        if (drawerMode.value === 'add') {
          ElMessage.success('新增成功')
        } else {
          ElMessage.success('编辑成功')
        }
        drawerVisible.value = false
        // 可在此处发请求
        console.log('提交数据', submitData)
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
      if (formFilters.enable !== '') {
        if (formFilters.enable === '0') filtered = filtered.filter((item) => !item.enable)
        if (formFilters.enable === '1') filtered = filtered.filter((item) => item.enable)
      }
      if (props.orgId) {
        filtered = filtered.filter((item) => item.orgId === props.orgId)
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

  // tagOptions 由 processedRuleList 自动生成所有叶子节点
  function getAllLeafNodes(nodes: any[]): { label: string; value: string }[] {
    const result: { label: string; value: string }[] = []
    nodes.forEach((node: any) => {
      if (node.children && node.children.length > 0) {
        result.push(...getAllLeafNodes(node.children))
      } else {
        result.push({ label: node.label, value: node.name })
      }
    })
    return result
  }
  const tagOptions = ref(getAllLeafNodes(processedRuleList.value))

  function saveRules() {
    const tree = treeRef.value
    if (!tree) return

    const checkedNodes: any[] = tree.getCheckedNodes()
    // 只取叶子节点
    const leafNodes = checkedNodes.filter(
      (node: any) => !node.children || node.children.length === 0
    )
    selectedAlgos.value = leafNodes.map((node: any) => node.name)

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

  // 标签选择相关
  const selectedAlgos = ref<string[]>([])
  const algoDialogVisible = ref(false)
  const algoTab = ref('car')
  const algoTabs = [
    {
      name: 'car',
      label: '车辆管理',
      items: [
        { label: '异常停车检测', value: 'abnormal_park' },
        { label: '车辆计数', value: 'car_count' },
        { label: '车辆违停', value: 'car_illegal_park' },
        { label: '车型识别', value: 'car_type' },
        { label: '电瓶车违停', value: 'ebike_illegal_park' },
        { label: '电瓶车进电梯检测', value: 'ebike_elevator' },
        { label: '机动车走应急车道检测', value: 'car_emergency_lane' },
        { label: '车辆计数超限检测', value: 'car_count_limit' },
        { label: '实线变道检测', value: 'solid_lane_change' },
        { label: '穿越导流线区域检测', value: 'cross_diversion' },
        { label: '车辆识别', value: 'car_recognition' },
        { label: '小汽车违停', value: 'small_car_illegal_park' },
        { label: '车流量检测', value: 'traffic_flow' },
        { label: '大货车计数', value: 'truck_count' },
        { label: '货车走快车道检测', value: 'truck_fast_lane' },
        { label: '货车变道检测', value: 'truck_lane_change' },
        { label: '货车区域违停', value: 'truck_area_illegal_park' },
        { label: '货车逆行检测', value: 'truck_reverse' },
        { label: '车辆属性检测', value: 'car_attribute' },
        { label: '车辆期检检测', value: 'car_periodic_check' },
        { label: '车辆超速检测', value: 'car_speed' }
      ]
    },
    {
      name: 'person',
      label: '人员管理',
      items: [
        { label: '未佩戴安全帽检测', value: 'no_helmet' },
        { label: '人员闯入', value: 'person_intrusion' }
      ]
    }
    // 其他tab ...
  ]
  const algoOptions = algoTabs.flatMap((tab) => tab.items)
  const algoDialogChecked = ref<string[]>([])

  // 算法配置卡片数据
  const algoConfigs = reactive<Record<string, any>>({})
  function getAlgoLabel(val: string) {
    return algoOptions.find((a) => a.value === val)?.label || val
  }

  function handleAlgoDialogConfirm() {
    selectedAlgos.value = [...algoDialogChecked.value]
    // 新增的算法初始化配置
    selectedAlgos.value.forEach((algo) => {
      if (!algoConfigs[algo]) {
        algoConfigs[algo] = {
          interval: '',
          window: '',
          threshold: '',
          voice: '',
          level: ''
        }
      }
    })
    // 移除未选中的算法配置
    Object.keys(algoConfigs).forEach((key) => {
      if (!selectedAlgos.value.includes(key)) delete algoConfigs[key]
    })
    algoDialogVisible.value = false
  }

  function handleClose(done: () => void) {
    ElMessageBox.confirm('确定要关闭吗？')
      .then(() => done())
      .catch(() => {
        // 用户点击取消或关闭弹窗，不做处理，防止Promise未捕获异常
      })
  }

  const checkStatus = ref('')
  function handleCheckStream() {
    checkStatus.value = '检测中...'
    setTimeout(() => {
      checkStatus.value = Math.random() > 0.5 ? '在线' : '离线'
    }, 1500)
  }

  watch(selectedAlgos, (newVal) => {
    // 只保留已选中的算法
    algoDialogChecked.value = algoDialogChecked.value.filter((v) => newVal.includes(v))
  })

  // 递归查找orgId的所有父级id
  function getOrgParentKeys(tree: any[], id: string, path: string[] = []): string[] {
    for (const node of tree) {
      if (node.id === id) return path
      if (node.children) {
        const found = getOrgParentKeys(node.children, id, [...path, node.id])
        if (found.length) return found
      }
    }
    return []
  }

  // 递归查找组织路径，返回{id, name}数组
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

  watch(
    () => formData.orgId,
    (newId) => {
      const pathArr = newId ? getOrgPathWithIds(orgTree.value, newId) : []
      selectedOrgPath.value = pathArr.map((item) => item.name)
      selectedOrgPathIds.value = pathArr.map((item) => item.id)
    }
  )

  watch(
    () => props.orgId,
    () => {
      getTableData()
    }
  )

  const calibrateDialogVisible = ref(false)
  const showCalibrateActions = ref(true)
  const calibrateImgUrl = ref('/assets/image.png')
  const calibrateImg = ref<HTMLImageElement | null>(null)
  const calibrateCanvas = ref<HTMLCanvasElement | null>(null)
  const imgNaturalWidth = ref(0)
  const imgNaturalHeight = ref(0)
  const imgScale = ref(1)
  const editingPolygon = ref(false)
  const polygonPoints = ref<{ x: number; y: number }[]>([])
  const tempPoints = ref<{ x: number; y: number }[]>([])

  function onCalibrateClick() {
    showCalibrateActions.value = true
    calibrateDialogVisible.value = true
  }
  function onViewCalibrateClick() {
    showCalibrateActions.value = false
    calibrateDialogVisible.value = true
  }
  function onImgLoad(e: Event) {
    const target = e.target as HTMLImageElement
    imgNaturalWidth.value = target.naturalWidth
    imgNaturalHeight.value = target.naturalHeight
    drawPolygon()
  }
  function onCanvasMouseDown(e: MouseEvent) {
    if (!editingPolygon.value) return
    if (!calibrateImg.value) return
    const rect = calibrateImg.value.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    tempPoints.value.push({ x, y })
    drawPolygon(tempPoints.value)
  }
  function onCanvasDblClick() {
    if (!editingPolygon.value) return
    polygonPoints.value = [...tempPoints.value]
    editingPolygon.value = false
    drawPolygon()
  }
  function clearPolygon() {
    polygonPoints.value = []
    tempPoints.value = []
    drawPolygon()
  }
  function zoomIn() {
    imgScale.value = Math.min(imgScale.value + 0.1, 2)
    drawPolygon()
  }
  function zoomOut() {
    imgScale.value = Math.max(imgScale.value - 0.1, 0.5)
    drawPolygon()
  }
  function savePolygon() {
    // 输出相对坐标
    console.log('保存多边形:', polygonPoints.value)
  }
  function drawPolygon(points = polygonPoints.value) {
    const canvas = calibrateCanvas.value
    const img = calibrateImg.value
    if (!canvas || !img) return
    canvas.width = imgNaturalWidth.value
    canvas.height = imgNaturalHeight.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!points.length) return
    ctx.save()
    ctx.scale(imgScale.value, imgScale.value)
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 2 / imgScale.value
    ctx.beginPath()
    ctx.moveTo(points[0].x * imgNaturalWidth.value, points[0].y * imgNaturalHeight.value)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x * imgNaturalWidth.value, points[i].y * imgNaturalHeight.value)
    }
    if (!editingPolygon.value && points.length > 2) ctx.closePath()
    ctx.stroke()
    // 画顶点小圆点
    ctx.fillStyle = '#00ff00'
    for (const pt of points) {
      ctx.beginPath()
      ctx.arc(
        pt.x * imgNaturalWidth.value,
        pt.y * imgNaturalHeight.value,
        5 / imgScale.value,
        0,
        2 * Math.PI
      )
      ctx.fill()
    }
    ctx.restore()
  }
  watch(calibrateDialogVisible, (val) => {
    if (val) {
      imgScale.value = 1
      nextTick(() => drawPolygon())
    }
  })

  function onAlgoBoxClick(e: MouseEvent) {
    const target = e.target as HTMLElement
    // 只有点击ElTag的删除按钮（el-tag__close）不弹，其余都弹
    if (target.classList.contains('el-tag__close')) return
    algoDialogVisible.value = true
  }

  function removeAlgo(algo: string) {
    const idx = selectedAlgos.value.indexOf(algo)
    if (idx !== -1) selectedAlgos.value.splice(idx, 1)
    // 同步移除配置
    if (algoConfigs[algo]) delete algoConfigs[algo]
  }

  function startEditPolygon() {
    editingPolygon.value = true
    tempPoints.value = [...polygonPoints.value]
  }

  onMounted(() => {
    getTableData()
  })

  defineExpose({
    checkStatus,
    handleCheckStream,
    algoOptions,
    algoConfigs,
    algoDialogChecked,
    getAlgoLabel,
    handleAlgoDialogConfirm,
    handleClose,
    drawerVisible,
    drawerTitle,
    rules,
    columns,
    columnChecks,
    openDrawer
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
