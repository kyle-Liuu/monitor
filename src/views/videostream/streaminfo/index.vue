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
            <ElInput v-model="formData.streamName" name="streamName" />
          </ElFormItem>
          <ElFormItem label="协议" prop="protocol">
            <ElSelect v-model="formData.protocol" name="protocol">
              <ElOption label="rtsp" value="rtsp" />
              <ElOption label="GB28181" value="GB28181" disabled />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="流地址" prop="streamCode">
            <ElInput v-model="formData.streamCode" name="streamCode" />
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
            <ElInput v-model="formData.description" type="textarea" :rows="3" name="description" />
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
              name="orgId"
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
                flex-wrap: wrap;
                border: 1px solid var(--el-border-color);
                border-radius: 4px;
                padding: 4px 12px;
                cursor: pointer;
                background: var(--el-fill-color-blank);
              "
              @click="openAlgoDialog"
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
              <span class="algo-tag-icon" @click.stop="openAlgoDialog">
                <i class="iconfont-sys">&#xe70b;</i>
              </span>
              <span v-if="!selectedAlgos.length" style="color: #aaa">点击选择算法</span>
            </div>
          </ElFormItem>
          <!-- 动态算法配置卡片区 -->
          <div v-for="algo in selectedAlgos" :key="algo" style="margin-bottom: 20px">
            <ElCard>
              <div style="font-weight: bold; margin-bottom: 10px">{{ getAlgoLabel(algo) }}</div>
              <ElFormItem label="标定检测区域" required>
                <ElButton @click="openCalibrateDialog('edit', algo)">标定检测区域</ElButton>
                <ElButton @click="openCalibrateDialog('view', algo)">查看检测区域</ElButton>
              </ElFormItem>
              <ElFormItem label="告警间隔">
                <ElInput
                  v-model="algoConfigs[algo].interval"
                  type="number"
                  style="width: 120px"
                  suffix="秒"
                  :name="`algo-interval-${algo}`"
                />
              </ElFormItem>
              <ElFormItem label="告警窗口长度">
                <ElInput
                  v-model="algoConfigs[algo].window"
                  type="number"
                  style="width: 120px"
                  suffix="秒"
                  :name="`algo-window-${algo}`"
                />
              </ElFormItem>
              <ElFormItem label="告警阈值">
                <ElInput
                  v-model="algoConfigs[algo].threshold"
                  type="number"
                  style="width: 120px"
                  suffix="秒"
                  :name="`algo-threshold-${algo}`"
                />
              </ElFormItem>
              <ElFormItem label="浏览器语音播报">
                <ElInput v-model="algoConfigs[algo].voice" :name="`algo-voice-${algo}`" />
              </ElFormItem>
              <ElFormItem label="危险等级">
                <ElInput v-model="algoConfigs[algo].level" :name="`algo-level-${algo}`" />
              </ElFormItem>
            </ElCard>
          </div>
          <ElFormItem label="启用">
            <ElSwitch v-model="formData.enable" name="enable" />
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
                <ElCheckbox
                  v-for="item in tab.items"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                  :id="item.id"
                >
                  {{ item.label }}
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

      <ElDialog v-model="calibrateDialogVisible" width="900px" append-to-body :show-close="true">
        <div class="calibrate-dialog-content">
          <!-- 调试：显示 polygons 数据 -->
          <!-- <div style="color: red; font-size: 12px; word-break: break-all">{{ polygons }}</div> -->
          <!-- 顶部按钮 -->
          <div class="calibrate-dialog-header">
            <ElButton type="info">获取原始图片</ElButton>
          </div>
          <!-- 图片区域 -->
          <div
            class="calibrate-dialog-image"
            ref="imgBoxRef"
            @click="onImgBoxClick"
            @mousemove="onImgBoxMouseMove"
            @dblclick="onImgBoxDblClick"
            @contextmenu="onImgBoxContextMenu"
          >
            <img
              ref="imgRef"
              src="/assets/bus.jpg"
              alt="检测区域图片"
              loading="lazy"
              @load="onImgLoaded"
              style="display: block; width: 100%"
            />
            <div
              v-if="calibrateImgLoading"
              class="calibrate-img-loading"
              style="
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;
                background: rgba(255, 255, 255, 0.7);
              "
            >
              <span class="el-loading-spinner" style="font-size: 32px"
                ><svg viewBox="25 25 50 50" class="circular" width="40" height="40">
                  <circle
                    class="path"
                    cx="50"
                    cy="50"
                    r="20"
                    fill="none"
                    stroke-width="5"
                    stroke="#409EFF"
                  ></circle></svg
              ></span>
            </div>
            <svg
              v-if="
                !calibrateImgLoading &&
                imgBoxRef &&
                imgBoxRef.offsetWidth > 0 &&
                imgBoxRef.offsetHeight > 0
              "
              :width="imgBoxRef.offsetWidth"
              :height="imgBoxRef.offsetHeight"
              class="polygon-svg"
              style="
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 2;
              "
              :key="imgResizeTrigger"
            >
              <!-- 已保存多边形始终渲染 -->
              <g v-for="(poly, idx) in polygons" :key="'poly-' + idx">
                <polygon
                  :points="
                    getPixelPoints(poly.normalizedPoints)
                      .map((p) => `${p.x},${p.y}`)
                      .join(' ')
                  "
                  :fill="
                    viewMode === 'edit'
                      ? selectedPolygonIdx === idx
                        ? 'rgba(255,128,0,0.25)'
                        : 'rgba(0,128,255,0.15)'
                      : 'rgba(0,128,255,0.15)'
                  "
                  :stroke="
                    viewMode === 'edit'
                      ? selectedPolygonIdx === idx
                        ? '#ff8000'
                        : '#0080ff'
                      : '#0080ff'
                  "
                  stroke-width="2"
                  style="cursor: pointer; pointer-events: auto"
                  @click.stop="viewMode === 'edit' ? handleSelectPolygon(idx) : null"
                />
                <text
                  v-if="poly.normalizedPoints.length"
                  :x="getPixelPoints(poly.normalizedPoints)[0]?.x"
                  :y="getPixelPoints(poly.normalizedPoints)[0]?.y - 8"
                  :fill="
                    viewMode === 'edit'
                      ? selectedPolygonIdx === idx
                        ? '#ff8000'
                        : '#0080ff'
                      : '#0080ff'
                  "
                  font-size="14"
                  font-weight="bold"
                >
                  {{ poly.name }}
                </text>
                <circle
                  v-for="(p, pidx) in getPixelPoints(poly.normalizedPoints)"
                  :key="'polypt-' + idx + '-' + pidx"
                  :cx="p.x"
                  :cy="p.y"
                  r="4"
                  fill="#fff"
                  :stroke="
                    viewMode === 'edit'
                      ? selectedPolygonIdx === idx
                        ? '#ff8000'
                        : '#0080ff'
                      : '#0080ff'
                  "
                  stroke-width="2"
                />
              </g>
              <!-- 当前正在绘制的多边形只在edit模式下显示 -->
              <polyline
                v-if="currentPolygon.length && viewMode === 'edit'"
                :points="currentPolygonPath"
                fill="rgba(255,0,0,0.15)"
                stroke="red"
                stroke-width="2"
              />
              <!-- 鼠标预览线 -->
              <line
                v-if="drawing && currentPolygon.length && mousePos && viewMode === 'edit'"
                :x1="currentPolygon[currentPolygon.length - 1].x"
                :y1="currentPolygon[currentPolygon.length - 1].y"
                :x2="mousePos.x"
                :y2="mousePos.y"
                stroke="red"
                stroke-dasharray="4,2"
                stroke-width="2"
              />
              <!-- 自动闭合线（绘制中预览） -->
              <line
                v-if="drawing && currentPolygon.length > 1 && mousePos && viewMode === 'edit'"
                :x1="mousePos.x"
                :y1="mousePos.y"
                :x2="currentPolygon[0].x"
                :y2="currentPolygon[0].y"
                stroke="red"
                stroke-dasharray="2,2"
                stroke-width="1"
              />
              <!-- 当前多边形顶点小圆点 -->
              <circle
                v-for="(p, idx) in currentPolygon"
                v-if="viewMode === 'edit'"
                :key="'curpt-' + idx"
                :cx="p.x"
                :cy="p.y"
                r="4"
                fill="#fff"
                stroke="red"
                stroke-width="2"
              />
            </svg>
          </div>
          <!-- 底部操作栏，仅edit模式显示 -->
          <div
            v-if="calibrateMode === 'edit' && viewMode === 'edit'"
            class="calibrate-dialog-footer"
          >
            <div class="calibrate-dialog-footer-left">
              <ElButton
                type="primary"
                size="small"
                style="margin-right: 10px"
                @click="handleEditPolygon"
              >
                *编辑多边形
              </ElButton>
              <ElButton
                type="danger"
                size="small"
                style="margin-right: 10px"
                @click="handleClearAllPolygons"
                >清除</ElButton
              >
              <ElButton
                type="danger"
                size="small"
                style="margin-right: 10px"
                @click="handleRemovePolygon"
                >删除选中多边形</ElButton
              >
              <span
                v-if="drawing && !finished"
                style="margin-left: 12px; color: #ff8000; font-size: 14px; user-select: none"
                >右键完成绘制</span
              >
            </div>
            <ElButton type="warning" size="small" @click="handleSaveAllPolygons">保存</ElButton>
          </div>
          <!-- 多边形命名弹窗 -->
          <el-dialog
            v-model="showNameInput"
            title="多边形命名"
            width="300px"
            :close-on-click-modal="false"
            :show-close="false"
          >
            <el-input v-model="newPolygonName" placeholder="请输入区域名称" />
            <template #footer>
              <el-button @click="showNameInput = false">取消</el-button>
              <el-button type="primary" @click="savePolygonName">保存</el-button>
            </template>
          </el-dialog>
        </div>
      </ElDialog>
    </div>
  </ArtTableFullScreen>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, onBeforeUnmount, h, nextTick, computed, watch } from 'vue'
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
  import { ORG_TREE_MOCK } from '@/mock/temp/orgTree'
  import { mockAlgoList } from '@/mock/temp/algoList'
  import { defineProps } from 'vue'

  const props = defineProps<{ orgId?: string }>()

  const { width } = useWindowSize()
  const loading = ref(false)
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
      // 调试：打印回显的 algoConfigs
      console.log('openDrawer 回显 algoConfigs:', row.algoConfigs)
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
  const algoTab = ref('car')
  // 直接使用 mockAlgoList 作为算法标签数据源
  const algoTabs = mockAlgoList.map((tab) => ({
    ...tab,
    items: tab.items.map((item) => ({ ...item }))
  }))
  const algoOptions = algoTabs.flatMap((tab) => tab.items)
  const algoDialogVisible = ref(false)
  const algoDialogChecked = ref<string[]>([])
  const algoConfigs = reactive<Record<string, any>>({})
  const calibrateDialogVisible = ref(false)
  const calibrateMode = ref<'edit' | 'view'>('edit')
  const currentAlgo = ref<string>('')
  const calibrateImgLoading = ref(true)

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

  function openCalibrateDialog(mode: 'edit' | 'view', algo: string) {
    calibrateDialogVisible.value = true
    viewMode.value = mode
    drawing.value = false
    finished.value = false
    currentPolygon.value = []
    mousePos.value = null
    currentAlgo.value = algo
    calibrateImgLoading.value = true // 打开弹窗时重置 loading
    // 关键：加载历史多边形
    const polys = (algoConfigs[algo]?.polygons || []).map((p: PolygonData) => ({
      ...p,
      normalizedPoints: p.normalizedPoints.map((pt: { x: number; y: number }) => ({ ...pt }))
    }))
    polygons.value = polys
    // 调试：打印 polygons 数据
    console.log(
      'openCalibrateDialog algo:',
      algo,
      'algoConfigs[algo].polygons:',
      algoConfigs[algo]?.polygons,
      'polygons.value:',
      polygons.value
    )
    // 修正：弹窗打开后，图片已加载则强制刷新 SVG
    nextTick(() => {
      if (imgRef.value) {
        // 重新绑定 ResizeObserver，确保每次弹窗都能监听
        if (resizeObserver) resizeObserver.disconnect()
        resizeObserver = new ResizeObserver(() => {
          imgResizeTrigger.value++
        })
        resizeObserver.observe(imgRef.value)
      }
      if (imgRef.value && imgRef.value.complete) {
        setTimeout(() => {
          calibrateImgLoading.value = false
          imgResizeTrigger.value++
        }, 600)
      }
    })
  }

  function openAlgoDialog() {
    algoDialogChecked.value = [...selectedAlgos.value]
    algoDialogVisible.value = true
  }

  function onImgBoxClick(e: MouseEvent) {
    if (viewMode.value === 'edit' && !drawing.value && selectedPolygonIdx.value !== null) {
      selectedPolygonIdx.value = null
    }
    if (!drawing.value || finished.value || viewMode.value === 'view') return
    const pos = getRelativePos(e)
    currentPolygon.value.push(pos)
  }

  function removeAlgo(algo: string) {
    const idx = selectedAlgos.value.indexOf(algo)
    if (idx !== -1) selectedAlgos.value.splice(idx, 1)
    // 同步移除配置
    if (algoConfigs[algo]) delete algoConfigs[algo]
  }

  // 多边形绘制相关
  interface PolygonData {
    name: string
    normalizedPoints: { x: number; y: number }[]
  }
  const polygons = ref<PolygonData[]>([])
  const currentPolygon = ref<{ x: number; y: number }[]>([])
  const drawing = ref(false)
  const finished = ref(false)
  const mousePos = ref<{ x: number; y: number } | null>(null)
  const showNameInput = ref(false)
  const newPolygonName = ref('')
  const viewMode = ref<'edit' | 'view'>('edit')
  const imgBoxRef = ref<HTMLDivElement | null>(null)
  const imgRef = ref<HTMLImageElement | null>(null)
  const selectedPolygonIdx = ref<number | null>(null)
  const imgResizeTrigger = ref(0)
  let resizeObserver: ResizeObserver | null = null

  function handleEditPolygon() {
    drawing.value = true
    finished.value = false
    currentPolygon.value = []
    mousePos.value = null
    viewMode.value = 'edit'
  }

  function getRelativePos(e: MouseEvent) {
    const rect = imgBoxRef.value!.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  function onImgBoxMouseMove(e: MouseEvent) {
    if (!drawing.value || finished.value || viewMode.value === 'view') return
    mousePos.value = getRelativePos(e)
  }

  function onImgBoxDblClick(e: MouseEvent) {
    if (!drawing.value || finished.value || viewMode.value === 'view') return
    if (currentPolygon.value.length >= 3) {
      finished.value = true
      drawing.value = false
      mousePos.value = null
      showNameInput.value = true
    }
  }

  function onImgBoxContextMenu(e: MouseEvent) {
    if (drawing.value && !finished.value && viewMode.value === 'edit') {
      e.preventDefault()
      if (currentPolygon.value.length >= 3) {
        finished.value = true
        drawing.value = false
        mousePos.value = null
        showNameInput.value = true
      }
    } else {
      e.preventDefault()
    }
  }

  function getNormalizedPoints(points: { x: number; y: number }[]) {
    const img = imgRef.value
    if (!img) return []
    const rect = img.getBoundingClientRect()
    const width = rect.width || 1
    const height = rect.height || 1
    return points.map((p) => ({
      x: +(p.x / width).toFixed(6),
      y: +(p.y / height).toFixed(6)
    }))
  }

  function getPixelPoints(normalizedPoints: { x: number; y: number }[]) {
    const img = imgRef.value
    if (!img) return []
    const rect = img.getBoundingClientRect()
    const width = rect.width || 1
    const height = rect.height || 1
    return normalizedPoints.map((p) => ({
      x: p.x * width,
      y: p.y * height
    }))
  }

  function savePolygonName() {
    if (newPolygonName.value.trim() && currentPolygon.value.length >= 3) {
      const normalizedPoints = getNormalizedPoints(currentPolygon.value)
      const poly = {
        name: newPolygonName.value.trim(),
        normalizedPoints
      }
      polygons.value.push(poly)
      showNameInput.value = false
      newPolygonName.value = ''
      currentPolygon.value = []
      finished.value = false
      drawing.value = false
      // 输出到控制台
      console.log('新建多边形（归一化）：', poly)
    }
  }

  function handleSaveAllPolygons() {
    if (currentAlgo.value) {
      algoConfigs[currentAlgo.value].polygons = polygons.value.map((p: PolygonData) => ({
        ...p,
        normalizedPoints: p.normalizedPoints.map((pt: { x: number; y: number }) => ({ ...pt }))
      }))
    }
    console.log('全部多边形信息（归一化）：', polygons.value)
    calibrateDialogVisible.value = false
  }

  function handleSelectPolygon(idx: number) {
    if (viewMode.value !== 'edit') return
    if (selectedPolygonIdx.value === idx) {
      selectedPolygonIdx.value = null // 再次点击取消选中
    } else {
      selectedPolygonIdx.value = idx
    }
  }

  function handleRemovePolygon() {
    if (selectedPolygonIdx.value === null) {
      ElMessage.warning('请选中要删除的区域')
      return
    }
    polygons.value.splice(selectedPolygonIdx.value, 1)
    selectedPolygonIdx.value = null
  }

  // polyline自动闭合
  const currentPolygonPath = computed(() => {
    if (currentPolygon.value.length === 0) return ''
    // 只用于渲染闭合，不影响数据
    let points = currentPolygon.value.map((p) => `${p.x},${p.y}`)
    if (finished.value && currentPolygon.value.length) {
      points = [...points, `${currentPolygon.value[0].x},${currentPolygon.value[0].y}`]
    }
    return points.join(' ')
  })

  function handleClearAllPolygons() {
    polygons.value = []
    selectedPolygonIdx.value = null
  }

  function onImgLoaded() {
    // 延长 loading 动画时间，图片加载后再延迟 600ms 隐藏 loading
    setTimeout(() => {
      calibrateImgLoading.value = false
      imgResizeTrigger.value++
    }, 600)
  }

  onMounted(() => {
    getTableData()
    nextTick(() => {
      if (imgRef.value) {
        resizeObserver = new ResizeObserver(() => {
          imgResizeTrigger.value++
        })
        resizeObserver.observe(imgRef.value)
      }
    })
  })

  onBeforeUnmount(() => {
    if (resizeObserver && imgRef.value) {
      resizeObserver.unobserve(imgRef.value)
    }
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
    openDrawer,
    onImgBoxClick,
    removeAlgo,
    onImgLoaded
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

  .calibrate-dialog-content {
    padding: 0 8px;
  }
  .calibrate-dialog-header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 12px;
  }
  .calibrate-dialog-image {
    position: relative;
    text-align: center;
    user-select: none;
  }
  .calibrate-dialog-image img {
    width: 100%;
    display: block;
    user-select: none;
  }
  .calibrate-dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24px;
  }
  .calibrate-dialog-footer-left {
    display: flex;
    align-items: center;
  }
  .polygon-svg {
    pointer-events: none;
  }
  .calibrate-img-loading .el-loading-spinner .circular {
    animation: rotate 2s linear infinite;
  }
  .calibrate-img-loading .el-loading-spinner .path {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: 0;
    stroke-linecap: round;
    animation: dash 1.5s ease-in-out infinite;
  }
  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }
  @keyframes dash {
    0% {
      stroke-dasharray: 1, 200;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -35;
    }
    100% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -124;
    }
  }
</style>
