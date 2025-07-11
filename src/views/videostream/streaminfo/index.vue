<template>
  <div class="streaminfo-page art-full-height">
    <ArtSearchBar
      v-model:filter="formFilters"
      :items="formItems"
      @reset="handleReset"
      @search="handleSearch"
    />
    <ElCard shadow="never" class="art-table-card">
      <ArtTableHeader :columnList="columns" v-model:columns="columnChecks" @refresh="handleRefresh">
        <template #left>
          <div class="toolbar-left">
            <ElButton type="primary" @click="openDrawer('add')">新增流</ElButton>
            <!-- 导出导入功能 -->
            <ArtExcelImport
              @import-success="handleImportSuccess"
              @import-error="handleImportError"
            />
            <ArtExcelExport
              :data="tableData as any"
              :columns="exportColumns as any"
              filename="视频流数据"
              :auto-index="true"
              button-text="导出"
              @export-success="handleExportSuccess"
            />
            <ElButton type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">
              批量删除
            </ElButton>
          </div>
        </template>
      </ArtTableHeader>
      <!-- <VueDraggable target="tbody" handle=".handle" v-model="tableData" :animation="150"> -->
      <ArtTable
        ref="tableRef"
        row-key="streamCode"
        :data="tableData"
        :loading="loading"
        :pagination="paginationState"
        :columns="columns"
        :layout="{ marginTop: 10 }"
        :table-config="{ emptyHeight: '360px' }"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <!-- 状态列插槽 -->
        <template #enable="{ row }">
          <ElTag :type="row.enable ? 'primary' : 'info'" effect="light" size="small">
            {{ row.enable ? '启用' : '禁用' }}
          </ElTag>
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
        <ElFormItem label="检测" required>
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
            <span class="org-path-text">组织路径：</span>
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
          <ElButton @click="handleCancelDrawer">取消</ElButton>
          <ElButton type="primary" @click="handleSubmit">提交</ElButton>
        </div>
      </ElForm>
      <!-- 算法标签选择弹窗 -->
      <ElDialog v-model="algoDialogVisible" title="选择算法" width="800px" append-to-body>
        <div class="algo-search-box" style="margin-bottom: 15px">
          <ElInput
            v-model="algoSearchKeyword"
            placeholder="搜索算法"
            clearable
            @input="filterAlgorithms"
            class="algo-search-input"
          >
            <template #prefix>
              <ElIcon class="el-input__icon" style="color: var(--el-color-primary)">
                <Search />
              </ElIcon>
            </template>
          </ElInput>
        </div>
        <ElTabs v-model="algoTab">
          <ElTabPane v-for="tab in algoTabs" :key="tab.name" :label="tab.label" :name="tab.name">
            <ElCheckboxGroup v-model="algoDialogChecked">
              <ElCheckbox
                v-for="item in filteredAlgoItemsByTab(tab.name)"
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

    <ElDialog
      v-model="calibrateDialogVisible"
      :title="calibrateDialogTitle"
      width="900px"
      top="20px"
      append-to-body
      :show-close="true"
    >
      <div class="calibrate-dialog-content">
        <!-- 调试：显示 polygons 数据 -->
        <!-- <div style="color: red; font-size: 12px; word-break: break-all">{{ polygons }}</div> -->
        <!-- 顶部按钮 -->
        <div class="calibrate-dialog-header">
          <ElButton type="primary" @click="handleRefreshImage">刷新图像</ElButton>
        </div>
        <!-- 图片区域 -->
        <div
          class="calibrate-dialog-image"
          ref="imgBoxRef"
          @click="onImgBoxClick"
          @mousemove="onImgBoxMouseMove"
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
          <div
            v-if="!calibrateImgLoading && (!formData.streamCode || streamOffline)"
            class="stream-offline-placeholder"
          >
            <ElIcon style="font-size: 48px; margin-bottom: 16px; color: #909399">
              <VideoCamera />
            </ElIcon>
            <p>{{ !formData.streamCode ? '未设置视频流地址' : '视频流离线，无法获取图像' }}</p>
            <p class="hint">{{
              !formData.streamCode ? '请先设置视频流地址' : '请检查视频流地址是否正确'
            }}</p>
          </div>
          <svg
            v-if="
              !calibrateImgLoading &&
              imgBoxRef &&
              imgBoxRef.offsetWidth > 0 &&
              imgBoxRef.offsetHeight > 0 &&
              !((!formData.streamCode || streamOffline) && !hasImage)
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
              <!-- 顶点，支持拖拽 -->
              <circle
                v-for="(p, pidx) in getPixelPoints(poly.normalizedPoints)"
                :key="'polypt-' + idx + '-' + pidx"
                :cx="p.x"
                :cy="p.y"
                r="5"
                :fill="
                  viewMode === 'edit' &&
                  (selectedPolygonIdx === idx ||
                    (draggingPointInfo.polygonIndex === idx &&
                      draggingPointInfo.pointIndex === pidx))
                    ? '#fff'
                    : '#eee'
                "
                :stroke="
                  viewMode === 'edit'
                    ? selectedPolygonIdx === idx
                      ? '#ff8000'
                      : '#0080ff'
                    : '#0080ff'
                "
                stroke-width="2"
                style="cursor: move; pointer-events: auto"
                @mousedown.stop="viewMode === 'edit' ? startDragPoint(idx, pidx, $event) : null"
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
        <div v-if="calibrateMode === 'edit' && viewMode === 'edit'" class="calibrate-dialog-footer">
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
              >清除
            </ElButton>
            <ElButton
              type="danger"
              size="small"
              style="margin-right: 10px"
              @click="handleRemovePolygon"
              >删除选中多边形
            </ElButton>
            <span
              v-if="drawing && !finished"
              style="margin-left: 12px; color: #ff8000; font-size: 14px; user-select: none"
              >右键完成绘制</span
            >
          </div>
          <ElButton type="warning" size="small" @click="handleSaveAllPolygons">保存</ElButton>
        </div>
        <!-- 多边形命名弹窗 -->
        <ElDialog
          v-model="showNameInput"
          title="区域命名"
          width="300px"
          :close-on-click-modal="false"
          :show-close="false"
          destroy-on-close
        >
          <ElInput v-model="newPolygonName" placeholder="请输入区域名称" />
          <template #footer>
            <ElButton @click="handleCancelNameInput">取消</ElButton>
            <ElButton type="primary" @click="savePolygonName">保存</ElButton>
          </template>
        </ElDialog>
      </div>
    </ElDialog>
    <!-- </ElCard> -->
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, reactive, onMounted, watch, nextTick, onUnmounted } from 'vue'
  import { ElMessage, ElMessageBox, ElTag, ElTooltip } from 'element-plus'
  import { Search, VideoCamera } from '@element-plus/icons-vue'

  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import { BgColorEnum } from '@/enums/appEnum'
  import type { FormInstance } from 'element-plus'
  import { STREAM_LIST_MOCK, StreamItem } from '@/mock/temp/streamList'
  import { ORG_TREE_MOCK } from '@/mock/temp/orgTree'
  import { mockAlgoList } from '@/mock/temp/algoList'
  import { h } from 'vue'
  import { findOrgNameById } from '@/mock/temp/streamList'
  import { useDebounce } from '@vueuse/core'
  import { useTable } from '@/composables/useTable'
  import type { SearchFormItem } from '@/types'
  import ArtExcelExport from '@/components/core/forms/art-excel-export/index.vue'
  import ArtExcelImport from '@/components/core/forms/art-excel-import/index.vue'

  // 定义坐标点类型
  interface Point {
    x: number
    y: number
  }

  // 定义多边形数据类型
  interface PolygonData {
    name: string
    normalizedPoints: Point[]
  }

  // 定义算法配置类型
  interface AlgoConfig {
    interval: number
    window: number
    threshold: number
    voice: string
    level: string
    polygons: PolygonData[]
  }

  const tableRef = ref()
  const formRef = ref<FormInstance>()

  // 表单筛选项
  const formFilters = ref({
    streamName: '',
    streamCode: '',
    protocol: '',
    enable: ''
  })

  // 筛选表单配置
  const formItems: SearchFormItem[] = [
    {
      label: '流名称',
      prop: 'streamName',
      type: 'input',
      config: { placeholder: '请输入流名称', clearable: true }
    },
    {
      label: '流地址',
      prop: 'streamCode',
      type: 'input',
      config: { placeholder: '请输入流地址', clearable: true }
    },
    {
      label: '协议',
      prop: 'protocol',
      type: 'select',
      config: { placeholder: '请选择协议', clearable: true },
      options: [
        { label: '全部', value: '' },
        { label: 'rtsp', value: 'rtsp' },
        { label: 'GB28181', value: 'GB28181' },
        { label: 'rtmp', value: 'rtmp' },
        { label: 'hls', value: 'hls' }
      ]
    },
    {
      label: '状态',
      prop: 'enable',
      type: 'select',
      config: { placeholder: '请选择状态', clearable: true },
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 'true' },
        { label: '禁用', value: 'false' }
      ]
    }
  ]

  // 导出列配置
  const exportColumns = computed(() => {
    return [
      { prop: 'streamName', label: '流名称' },
      { prop: 'protocol', label: '协议' },
      { prop: 'streamCode', label: '流地址' },
      { prop: 'orgName', label: '所属组织' },
      { prop: 'algos', label: '算法标签' },
      { prop: 'description', label: '描述' },
      { prop: 'enable', label: '状态' },
      { prop: 'createTime', label: '创建时间' }
    ]
  })

  // 使用useTable获取表格数据
  const fetchStreamList = async (params: any) => {
    console.log('获取视频流列表，参数:', params)

    // 延迟模拟接口调用
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 过滤数据
    let filteredData = STREAM_LIST_MOCK.slice()

    // 按流名称筛选
    if (params.streamName) {
      filteredData = filteredData.filter((item) =>
        item.streamName.toLowerCase().includes(params.streamName.toLowerCase())
      )
    }

    // 按流地址筛选
    if (params.streamCode) {
      filteredData = filteredData.filter((item) =>
        item.streamCode.toLowerCase().includes(params.streamCode.toLowerCase())
      )
    }

    // 按协议筛选
    if (params.protocol) {
      filteredData = filteredData.filter((item) => item.protocol === params.protocol)
    }

    // 按启用状态筛选
    if (params.enable !== '' && params.enable !== undefined) {
      const enableStatus = params.enable === 'true' || params.enable === true
      filteredData = filteredData.filter((item) => item.enable === enableStatus)
    }

    // 分页
    const total = filteredData.length
    const start = (params.current - 1) * params.size
    const end = start + params.size
    const records = filteredData.slice(start, end)

    return {
      records,
      total,
      size: params.size,
      current: params.current,
      pages: Math.ceil(total / params.size)
    }
  }

  const {
    // 数据相关
    tableData,
    isLoading: loading,
    hasError,

    // 分页相关
    paginationState,
    onPageSizeChange: handleSizeChange,
    onCurrentPageChange: handleCurrentChange,

    // 搜索相关
    searchState,
    resetSearch,

    // 数据操作
    searchData: getTableData,
    searchDataDebounced,

    // 刷新策略
    refreshAll: handleRefresh,
    refreshSoft,
    refreshAfterCreate,
    refreshAfterUpdate,
    refreshAfterRemove,

    // 列配置
    columns,
    columnChecks
  } = useTable<StreamItem>({
    // 核心配置
    core: {
      apiFn: fetchStreamList,
      apiParams: {
        current: 1,
        size: 20,
        streamName: '',
        streamCode: '',
        protocol: '',
        enable: ''
      } as any,
      immediate: true,
      columnsFactory: () => [
        { type: 'selection' },
        { type: 'index', label: '序号', width: 60 },
        {
          prop: 'streamName',
          label: '流名称',
          width: 180,
          showOverflowTooltip: true,
          sortable: true
        },
        {
          prop: 'protocol',
          label: '协议',
          width: 100,
          sortable: true
        },
        {
          prop: 'streamCode',
          label: '流地址',
          minWidth: 250,
          showOverflowTooltip: true
        },
        {
          prop: 'orgName',
          label: '所属组织',
          minWidth: 120,
          showOverflowTooltip: true,
          formatter: (row: StreamItem) => row.orgName || '未分配'
        },
        {
          prop: 'algos',
          label: '算法标签',
          minWidth: 200,
          formatter: (row: StreamItem) => {
            if (!row.algos || !row.algos.length) return '-'

            const labels = row.algos.map((algo) => getAlgoLabel(algo))
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
          prop: 'description',
          label: '描述',
          minWidth: 200,
          showOverflowTooltip: true
        },
        {
          prop: 'enable',
          label: '状态',
          width: 80,
          useSlot: true
        },
        {
          prop: 'createTime',
          label: '创建时间',
          width: 180,
          sortable: true
        },
        {
          prop: 'operation',
          label: '操作',
          width: 190,
          fixed: 'right',
          formatter: (row: StreamItem) => {
            return h('div', [
              h(ArtButtonTable, {
                type: 'edit',
                onClick: () => openDrawer('edit', row)
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
        // 数据加载成功后的处理
        console.log('数据加载成功:', data.length)
      },
      onError: (error) => {
        // 错误处理
        ElMessage.error(`数据加载失败: ${error.message}`)
      }
    }
  })

  // 当表单数据变化时，同步到searchState
  watch(
    formFilters,
    (newFilters) => {
      Object.assign(searchState, newFilters)
    },
    { deep: true }
  )

  const selectedRows = ref<StreamItem[]>([])

  // 表单数据
  const formData = reactive({
    streamName: '',
    streamCode: '',
    protocol: 'rtsp',
    description: '',
    enable: false,
    orgId: ''
  })

  // 表单验证规则
  const rules = {
    streamName: [
      { required: true, message: '请输入流名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    streamCode: [
      { required: true, message: '请输入流地址', trigger: 'blur' },
      { min: 5, max: 200, message: '长度在 5 到 200 个字符', trigger: 'blur' }
    ],
    protocol: [{ required: true, message: '请选择协议', trigger: 'change' }]
  }

  // 组织树
  const orgTree = ref(ORG_TREE_MOCK)
  const expandedOrgKeys = ref<string[]>([])
  const treeSelectKey = ref(Date.now())

  // 获取组织路径信息
  const selectedOrgPath = computed(() => {
    if (!formData.orgId) return []

    const path: string[] = []
    const getPath = (tree: any[], id: string, currentPath: string[] = []) => {
      for (const node of tree) {
        const newPath = [...currentPath, node.name]
        if (node.id === id) {
          path.push(...newPath)
          return true
        }
        if (node.children && getPath(node.children, id, newPath)) {
          return true
        }
      }
      return false
    }

    getPath(orgTree.value, formData.orgId)
    return path
  })

  // 获取组织路径ID列表
  const selectedOrgPathIds = computed(() => {
    if (!formData.orgId) return []

    const ids: string[] = []
    const getPathIds = (tree: any[], id: string, currentIds: string[] = []) => {
      for (const node of tree) {
        const newIds = [...currentIds, node.id]
        if (node.id === id) {
          ids.push(...newIds)
          return true
        }
        if (node.children && getPathIds(node.children, id, newIds)) {
          return true
        }
      }
      return false
    }

    getPathIds(orgTree.value, formData.orgId)
    return ids
  })

  // 视频流检测状态
  const checkStatus = ref('')
  const streamOffline = ref(false)

  // 获取组织父级ID列表
  function getOrgParentKeys(tree: any[], id: string, path: string[] = []): string[] {
    for (const node of tree) {
      const currentPath = [...path, node.id]
      if (node.id === id) return path
      if (node.children) {
        const result = getOrgParentKeys(node.children, id, currentPath)
        if (result.length) return result
      }
    }
    return []
  }

  // 算法配置
  const algoConfigs: Record<string, AlgoConfig> = reactive({})

  // 选中的算法
  const selectedAlgos = ref<string[]>([])

  // 算法对话框
  const algoDialogVisible = ref(false)
  const algoTab = ref('basic')
  const algoTabs = mockAlgoList
  const algoSearchKeyword = ref('')
  const algoDialogChecked = ref<string[]>([])

  // 所有算法项
  const allAlgoItems = computed(() => {
    return mockAlgoList.flatMap((tab) =>
      tab.items.map((item) => ({
        ...item,
        tabName: tab.name
      }))
    )
  })

  // 根据关键词筛选算法
  const filteredAlgoItems = computed(() => {
    if (!algoSearchKeyword.value) return allAlgoItems.value
    const keyword = algoSearchKeyword.value.toLowerCase()
    return allAlgoItems.value.filter(
      (item) =>
        item.label.toLowerCase().includes(keyword) || item.value.toLowerCase().includes(keyword)
    )
  })

  /**
   * 根据标签名过滤算法项
   */
  function filteredAlgoItemsByTab(tabName: string) {
    try {
      return filteredAlgoItems.value.filter((item) => item.tabName === tabName)
    } catch (error) {
      console.error('过滤算法项出错:', error)
      return []
    }
  }

  // 防抖处理的算法搜索 - 不使用useDebounce，而是使用ref+定时器模式
  const debouncedFilterAlgorithms = ref<() => void>(() => {
    console.log('搜索算法:', algoSearchKeyword.value)
  })

  // 搜索算法的处理函数
  function filterAlgorithms() {
    // 直接调用通过ref包装的函数
    debouncedFilterAlgorithms.value()
  }

  // 处理算法选择确认
  function handleAlgoDialogConfirm() {
    selectedAlgos.value = [...algoDialogChecked.value]

    // 初始化新选中的算法配置
    selectedAlgos.value.forEach((algo) => {
      if (!algoConfigs[algo]) {
        algoConfigs[algo] = createDefaultAlgoConfig()
      }
    })

    // 移除未选中的算法配置
    Object.keys(algoConfigs).forEach((key) => {
      if (!selectedAlgos.value.includes(key)) {
        delete algoConfigs[key]
      }
    })

    algoDialogVisible.value = false
  }

  // 移除算法
  function removeAlgo(algo: string) {
    const index = selectedAlgos.value.indexOf(algo)
    if (index !== -1) {
      selectedAlgos.value.splice(index, 1)
      delete algoConfigs[algo] // 清除配置
    }
  }

  // 初始化算法配置
  function createDefaultAlgoConfig(): AlgoConfig {
    return {
      interval: 5,
      window: 3,
      threshold: 2,
      voice: '检测到异常',
      level: '中',
      polygons: []
    }
  }

  // 获取算法名称
  function getAlgoLabel(value: string): string {
    const item = allAlgoItems.value.find((item) => item.value === value)
    return item ? item.label : value
  }

  // 打开算法选择对话框
  function openAlgoDialog() {
    algoDialogChecked.value = [...selectedAlgos.value]
    algoDialogVisible.value = true
  }

  // 多边形绘制相关状态
  const calibrateDialogVisible = ref(false)
  const calibrateMode = ref<'view' | 'edit'>('view')
  const currentAlgo = ref('')
  const imgBoxRef = ref<HTMLElement | null>(null)
  const imgRef = ref<HTMLImageElement | null>(null)
  const calibrateImgLoading = ref(false)
  const hasImage = ref(false)

  // 标定检测区域弹窗标题
  const calibrateDialogTitle = computed(() => {
    const algoLabel = getAlgoLabel(currentAlgo.value)
    return calibrateMode.value === 'edit'
      ? `标定检测区域 - ${algoLabel}`
      : `查看检测区域 - ${algoLabel}`
  })

  // ResizeObserver实例
  let resizeObserver: ResizeObserver | null = null

  // Drawer 相关
  const drawerVisible = ref(false)
  const drawerMode = ref<'add' | 'edit'>('add')
  const drawerTitle = computed(() => (drawerMode.value === 'add' ? '新增流' : '编辑流'))

  // 打开抽屉
  function openDrawer(mode: 'add' | 'edit', row?: any) {
    drawerMode.value = mode
    drawerVisible.value = true

    // 重置表单数据
    resetFormData()

    if (mode === 'edit' && row) {
      // 回显表单数据
      Object.keys(formData).forEach((key) => {
        if (key in row) {
          // @ts-ignore - 动态属性赋值
          formData[key] = row[key]
        }
      })

      // 回显算法标签和配置
      selectedAlgos.value = Array.isArray(row.algos) ? [...row.algos] : []

      // 深拷贝算法配置，避免引用问题
      if (row.algoConfigs) {
        Object.keys(row.algoConfigs).forEach((key) => {
          algoConfigs[key] = JSON.parse(JSON.stringify(row.algoConfigs[key] || {}))
        })
      }

      // 设置组织树展开状态
      if (row.orgId) {
        expandedOrgKeys.value = getOrgParentKeys(orgTree.value, row.orgId)
      }

      // 编辑模式下，自动检测视频流是否在线
      if (formData.streamCode) {
        nextTick(() => {
          autoCheckStreamStatus()
        })
      }
    }

    // 强制更新树选择器
    treeSelectKey.value = Date.now()
  }

  // 重置表单数据
  function resetFormData() {
    formData.streamName = ''
    formData.streamCode = ''
    formData.protocol = 'rtsp'
    formData.description = ''
    formData.enable = false
    formData.orgId = ''
    selectedAlgos.value = []
    checkStatus.value = ''

    // 清空算法配置
    Object.keys(algoConfigs).forEach((key) => delete algoConfigs[key])
    expandedOrgKeys.value = []
  }

  function handleClose(done: () => void) {
    ElMessageBox.confirm('确定要关闭吗？')
      .then(() => done())
      .catch(() => {
        // 用户点击取消，不做处理
      })
  }

  function handleCancelDrawer() {
    ElMessageBox.confirm('确定要关闭吗？未保存的内容将会丢失', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        drawerVisible.value = false
        if (formRef.value) {
          formRef.value.resetFields()
        }
      })
      .catch(() => {
        // 用户取消关闭，不做处理
      })
  }

  function handleSearch() {
    // 将搜索表单的值应用到 searchState
    Object.assign(searchState, formFilters.value)
    getTableData()
  }

  function handleReset() {
    resetSearch()
  }

  function handleSelectionChange(selection: StreamItem[]) {
    selectedRows.value = selection
  }

  // 自动检测视频流状态
  function autoCheckStreamStatus() {
    if (!formData.streamCode.trim()) return

    checkStatus.value = '检测中...'

    // 模拟API调用检测流状态
    setTimeout(() => {
      checkStatus.value = Math.random() > 0.5 ? '在线' : '离线'
      streamOffline.value = checkStatus.value === '离线'

      // 如果流离线，给出明确提示
      if (streamOffline.value) {
        ElMessage.warning(`视频流 ${formData.streamCode} 当前离线，请检查地址是否正确`)
      }
    }, 1000)
  }

  // 手动检测视频流状态
  function handleCheckStream() {
    if (!formData.streamCode.trim()) {
      ElMessage.error('请先输入流地址')
      return
    }

    autoCheckStreamStatus()
  }

  // 处理表单提交
  const handleSubmit = () => {
    if (!formRef.value) return

    // 检查是否已进行视频流检测
    if (!checkStatus.value) {
      ElMessage.warning('请先进行视频流检测')
      return
    }

    // 检查视频流是否在线
    if (checkStatus.value === '离线') {
      ElMessageBox.confirm('视频流当前离线，是否继续提交？', '警告', {
        confirmButtonText: '继续提交',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          // 用户确认继续提交
          submitForm()
        })
        .catch(() => {
          // 用户取消提交，不做处理
        })
    } else {
      // 视频流在线，直接提交
      submitForm()
    }
  }

  const submitForm = () => {
    if (!formRef.value) {
      ElMessage.error('表单实例不存在，请稍后重试')
      return
    }

    formRef.value
      .validate((valid: boolean, fields?: any) => {
        if (valid) {
          try {
            const submitData = {
              ...formData,
              algos: selectedAlgos.value,
              algoConfigs: { ...algoConfigs }
            }
            if (drawerMode.value === 'add') {
              ElMessage.success('新增成功')
              refreshAfterCreate()
            } else {
              ElMessage.success('编辑成功')
              refreshAfterUpdate()
            }
            drawerVisible.value = false
            // 可在此处发请求
            console.log('提交数据', submitData)
          } catch (error) {
            console.error('提交表单时发生错误:', error)
            ElMessage.error('提交失败，请稍后重试')
          }
        } else {
          console.error('表单验证失败:', fields)
          ElMessage.error('表单填写有误，请检查')
        }
      })
      .catch((error) => {
        console.error('表单验证异常:', error)
        ElMessage.error('表单验证异常，请稍后重试')
      })
  }

  const handleDelete = (row: any) => {
    ElMessageBox.confirm('确定要删除该流吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      ElMessage.success('删除成功')
      refreshAfterRemove()
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
      refreshAfterRemove()
    })
  }

  // 多边形绘制相关
  interface Point {
    x: number
    y: number
  }

  interface PolygonData {
    name: string
    normalizedPoints: Point[]
  }

  interface AlgoConfig {
    interval: number
    window: number
    threshold: number
    voice: string
    level: string
    polygons: PolygonData[]
  }

  const polygons = ref<PolygonData[]>([])
  const currentPolygon = ref<Point[]>([])
  const drawing = ref(false)
  const finished = ref(false)
  const mousePos = ref<Point | null>(null)
  const showNameInput = ref(false)
  const newPolygonName = ref('')
  const viewMode = ref<'edit' | 'view'>('edit')
  const selectedPolygonIdx = ref<number | null>(null)
  const imgResizeTrigger = ref(0)

  // 绘制防抖相关变量
  const DEBOUNCE_DELAY = 300 // 防抖时间间隔（毫秒）
  let lastClickTime = 0 // 最后一次点击时间
  let lastRightClickTime = 0 // 最后一次右键点击时间

  // 拖拽相关
  const draggingPointInfo = reactive({
    isDragging: false,
    polygonIndex: -1,
    pointIndex: -1
  })

  // 开始拖拽顶点
  function startDragPoint(polygonIndex: number, pointIndex: number, event: MouseEvent) {
    if (viewMode.value !== 'edit') return

    // 设置当前选中的多边形
    selectedPolygonIdx.value = polygonIndex

    // 设置拖拽信息
    draggingPointInfo.isDragging = true
    draggingPointInfo.polygonIndex = polygonIndex
    draggingPointInfo.pointIndex = pointIndex

    // 添加全局事件监听
    document.addEventListener('mousemove', handleDragPointMove)
    document.addEventListener('mouseup', stopDragPoint)

    // 阻止事件冒泡和默认行为
    event.stopPropagation()
    event.preventDefault()
  }

  // 拖拽移动处理
  function handleDragPointMove(event: MouseEvent) {
    if (!draggingPointInfo.isDragging) return

    const { polygonIndex, pointIndex } = draggingPointInfo

    // 获取鼠标相对于图像容器的位置
    const pos = getRelativePos(event)

    // 更新多边形顶点位置
    if (polygons.value[polygonIndex] && polygons.value[polygonIndex].normalizedPoints[pointIndex]) {
      // 先更新像素位置，再转换回归一化坐标
      const normalizedPos = getNormalizedPoint(pos)
      polygons.value[polygonIndex].normalizedPoints[pointIndex] = normalizedPos

      // 触发视图更新
      imgResizeTrigger.value++
    }
  }

  // 停止拖拽
  function stopDragPoint() {
    draggingPointInfo.isDragging = false

    // 移除全局事件监听
    document.removeEventListener('mousemove', handleDragPointMove)
    document.removeEventListener('mouseup', stopDragPoint)
  }

  // 将单个点转换为归一化坐标
  function getNormalizedPoint(point: Point): Point {
    const img = imgRef.value
    if (!img) return { x: 0, y: 0 }

    const rect = img.getBoundingClientRect()
    const width = Math.max(rect.width, 1)
    const height = Math.max(rect.height, 1)

    return {
      x: +(point.x / width).toFixed(6),
      y: +(point.y / height).toFixed(6)
    }
  }

  function handleEditPolygon() {
    drawing.value = true
    finished.value = false
    currentPolygon.value = []
    mousePos.value = null
    viewMode.value = 'edit'
    ElMessage.info('点击图片添加多边形顶点，右键完成绘制')
  }

  // 处理取消多边形命名
  function handleCancelNameInput() {
    showNameInput.value = false
    currentPolygon.value = []
    finished.value = false
    drawing.value = false
    ElMessage.info('已取消添加多边形')
  }

  function getRelativePos(e: MouseEvent): Point {
    if (!imgBoxRef.value) {
      return { x: 0, y: 0 }
    }

    const rect = imgBoxRef.value.getBoundingClientRect()
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
    // 禁用双击完成绘制功能
    return
  }

  function onImgBoxContextMenu(e: MouseEvent) {
    e.preventDefault() // 始终阻止上下文菜单

    if (drawing.value && !finished.value && viewMode.value === 'edit') {
      // 检查防抖
      const now = Date.now()
      if (now - lastRightClickTime < DEBOUNCE_DELAY) {
        return
      }
      lastRightClickTime = now

      if (currentPolygon.value.length >= 3) {
        finished.value = true
        drawing.value = false
        mousePos.value = null
        showNameInput.value = true
      } else if (currentPolygon.value.length > 0) {
        ElMessage.warning('多边形至少需要3个顶点才能完成绘制')
      }
    }
  }

  function getNormalizedPoints(points: Point[]): Point[] {
    const img = imgRef.value
    if (!img) return []

    const rect = img.getBoundingClientRect()
    const width = Math.max(rect.width, 1) // 避免除以零
    const height = Math.max(rect.height, 1)

    return points.map((p) => ({
      x: +(p.x / width).toFixed(6),
      y: +(p.y / height).toFixed(6)
    }))
  }

  function getPixelPoints(normalizedPoints: Point[]): Point[] {
    const img = imgRef.value
    if (!img) return []

    const rect = img.getBoundingClientRect()
    const width = Math.max(rect.width, 1)
    const height = Math.max(rect.height, 1)

    return normalizedPoints.map((p) => ({
      x: p.x * width,
      y: p.y * height
    }))
  }

  function savePolygonName() {
    if (!newPolygonName.value.trim()) {
      ElMessage.warning('请输入区域名称')
      return
    }

    if (currentPolygon.value.length < 3) {
      ElMessage.warning('多边形至少需要3个顶点')
      return
    }

    // 检查名称是否重复
    const existingName = polygons.value.find((p) => p.name === newPolygonName.value.trim())
    if (existingName) {
      ElMessage.warning('区域名称已存在，请使用其他名称')
      return
    }

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
    ElMessage.success(`区域"${poly.name}"创建成功`)
    // 输出到控制台
    console.log('新建多边形（归一化）：', poly)
  }

  function handleSaveAllPolygons() {
    if (!currentAlgo.value) {
      ElMessage.warning('未指定算法')
      return
    }

    // 检查是否有绘制中但未完成的多边形
    if (drawing.value && currentPolygon.value.length > 0) {
      ElMessageBox.confirm('有一个多边形正在绘制中但尚未完成，是否放弃该多边形？', '提示', {
        confirmButtonText: '放弃并保存其他区域',
        cancelButtonText: '返回继续编辑',
        type: 'warning'
      })
        .then(() => {
          // 用户确认放弃，重置当前多边形
          currentPolygon.value = []
          drawing.value = false
          savePolygons()
        })
        .catch(() => {
          // 用户取消，不做操作
        })
      return
    }

    savePolygons()
  }

  function savePolygons() {
    // 确保算法配置存在
    if (!algoConfigs[currentAlgo.value]) {
      algoConfigs[currentAlgo.value] = createDefaultAlgoConfig()
    }

    // 深拷贝多边形数据保存到算法配置
    algoConfigs[currentAlgo.value].polygons = JSON.parse(JSON.stringify(polygons.value))

    ElMessage.success(`算法"${getAlgoLabel(currentAlgo.value)}"的检测区域已保存`)
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
    calibrateImgLoading.value = false
    hasImage.value = true

    // 设置ResizeObserver监听图片尺寸变化
    setupResizeObserver()
  }

  // 刷新图像
  function handleRefreshImage() {
    try {
      calibrateImgLoading.value = true
      streamOffline.value = false

      // 判断是否在标定弹窗中设置了流地址
      if (!formData.streamCode) {
        ElMessage.error('未设置视频流地址，无法获取图像')
        calibrateImgLoading.value = false
        streamOffline.value = true
        return
      }

      // 先检查流是否在线
      ElMessage.info(`正在检测流 ${formData.streamCode} 是否在线...`)

      // 模拟API调用检查流状态
      setTimeout(() => {
        try {
          // 模拟流状态检测结果，实际应从API获取
          const isOnline = Math.random() > 0.3

          if (isOnline) {
            ElMessage.success(`流 ${formData.streamCode} 在线，正在获取图像...`)
            streamOffline.value = false

            // 流在线，获取图像
            setTimeout(() => {
              try {
                calibrateImgLoading.value = false
                imgResizeTrigger.value++
                hasImage.value = true
                ElMessage.success('图像获取成功')
              } catch (error) {
                console.error('图像处理错误:', error)
                ElMessage.error('图像处理失败，请重试')
                calibrateImgLoading.value = false
              }
            }, 1000)
          } else {
            // 流离线，显示错误信息并清空图像区域
            calibrateImgLoading.value = false
            streamOffline.value = true
            hasImage.value = false
            ElMessage.error({
              message: `流 ${formData.streamCode} 离线，无法获取图像`,
              duration: 5000,
              showClose: true
            })
          }
        } catch (error) {
          console.error('流状态检测错误:', error)
          calibrateImgLoading.value = false
          ElMessage.error('流状态检测失败，请重试')
        }
      }, 800)
    } catch (error) {
      console.error('刷新图像错误:', error)
      calibrateImgLoading.value = false
      ElMessage.error('操作失败，请重试')
    }
  }

  // 处理图片加载错误
  function handleImageError() {
    calibrateImgLoading.value = false
    hasImage.value = false
    ElMessage.error({
      message: '图片加载失败，请重试',
      duration: 5000,
      showClose: true
    })
  }

  // 图片预加载
  function preloadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(e)
      img.src = src
    })
  }

  // 使用预加载图片
  async function loadImageWithPreload(src: string) {
    try {
      calibrateImgLoading.value = true
      await preloadImage(src)
      // 图片预加载成功，可以设置到img元素
      if (imgRef.value) {
        imgRef.value.src = src
      }
    } catch (error) {
      console.error('图片加载失败:', error)
      ElMessage.error({
        message: '图片加载失败，请检查网络连接',
        duration: 5000,
        showClose: true
      })
      calibrateImgLoading.value = false
    }
  }

  // 设置ResizeObserver监听图片尺寸变化
  function setupResizeObserver() {
    if (imgRef.value) {
      // 清理旧的observer
      if (resizeObserver) {
        resizeObserver.disconnect()
      }

      // 创建新的observer
      resizeObserver = new ResizeObserver(() => {
        imgResizeTrigger.value++
      })

      resizeObserver.observe(imgRef.value)
    }
  }

  // 处理图片点击事件
  function onImgBoxClick(e: MouseEvent) {
    // 点击已选择多边形外的区域时，取消选择
    if (viewMode.value === 'edit' && !drawing.value && selectedPolygonIdx.value !== null) {
      selectedPolygonIdx.value = null
    }

    // 如果不是在绘制过程中或者已经完成绘制，则不处理
    if (!drawing.value || finished.value || viewMode.value === 'view') return

    // 检查图像是否已加载
    if (
      calibrateImgLoading.value ||
      (!formData.streamCode && !hasImage.value) ||
      (streamOffline.value && !hasImage.value)
    ) {
      ElMessage.warning('没有可用的图像，无法绘制多边形')
      return
    }

    // 获取当前时间
    const now = Date.now()

    // 如果两次点击间隔小于防抖延迟，则忽略本次点击
    if (now - lastClickTime < DEBOUNCE_DELAY) {
      console.log('防抖：忽略快速点击')
      return
    }

    // 更新最后一次点击时间
    lastClickTime = now

    // 获取点击位置并添加到多边形顶点
    const pos = getRelativePos(e)
    currentPolygon.value.push(pos)
  }

  // 打开标定弹窗
  function openCalibrateDialog(mode: 'view' | 'edit', algo: string) {
    if (!algo) {
      ElMessage.warning('未指定算法')
      return
    }

    currentAlgo.value = algo
    calibrateMode.value = mode
    calibrateDialogVisible.value = true

    // 初始化多边形数据
    if (algoConfigs[algo] && algoConfigs[algo].polygons) {
      polygons.value = JSON.parse(JSON.stringify(algoConfigs[algo].polygons || []))
    } else {
      polygons.value = []
    }

    // 确保当前多边形为空
    currentPolygon.value = []
    drawing.value = false
    finished.value = false
    mousePos.value = null
    viewMode.value = mode
    selectedPolygonIdx.value = null
    calibrateImgLoading.value = true
    streamOffline.value = false

    // 设置ResizeObserver监听图片尺寸变化
    nextTick(() => {
      setupResizeObserver()

      // 如果图片已加载完成，更新状态
      if (imgRef.value?.complete) {
        setTimeout(() => {
          calibrateImgLoading.value = false
          imgResizeTrigger.value++
          hasImage.value = true
        }, 600)
      }
    })
  }

  // 导出成功处理
  function handleExportSuccess() {
    ElMessage.success('导出成功')
  }

  // 导入成功处理
  function handleImportSuccess(data: any) {
    ElMessage.success('导入成功')
    // 导入数据后刷新表格
    getTableData()
  }

  // 导入失败处理
  function handleImportError(error: any) {
    ElMessage.error(`导入失败: ${error.message}`)
  }

  // 监听流地址变化，自动检测状态
  watch(
    () => formData.streamCode,
    (newVal, oldVal) => {
      // 当流地址发生变化且不为空时，自动检测
      if (newVal && newVal !== oldVal && drawerVisible.value) {
        // 延迟执行，避免频繁调用
        setTimeout(() => {
          autoCheckStreamStatus()
        }, 500)
      } else if (!newVal) {
        // 当流地址被清空时，重置检测状态
        checkStatus.value = ''
      }
    },
    { flush: 'post' }
  )

  // 使用watchEffect监听组件挂载和卸载，确保资源正确清理
  watchEffect((onCleanup) => {
    if (!imgRef.value) return

    // 添加图片错误处理
    const imgElement = imgRef.value
    imgElement.addEventListener('error', handleImageError)

    // 组件挂载后设置ResizeObserver
    const observer = new ResizeObserver(() => {
      try {
        imgResizeTrigger.value++
      } catch (error) {
        console.error('ResizeObserver错误:', error)
      }
    })

    try {
      observer.observe(imgRef.value)
    } catch (error) {
      console.error('ResizeObserver初始化错误:', error)
    }

    // 清理函数
    onCleanup(() => {
      try {
        observer.disconnect()
        imgElement.removeEventListener('error', handleImageError)

        // 清理拖拽相关事件
        document.removeEventListener('mousemove', handleDragPointMove)
        document.removeEventListener('mouseup', stopDragPoint)
      } catch (error) {
        console.error('资源清理错误:', error)
      }
    })
  })

  // 页面初始化时加载数据
  onMounted(() => {
    getTableData()
  })

  // 组件销毁时清理资源
  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  })

  defineExpose({
    checkStatus,
    handleCheckStream,
    algoConfigs,
    algoDialogChecked,
    getAlgoLabel,
    handleClose,
    drawerVisible,
    drawerTitle,
    rules,
    columns,
    columnChecks,
    openDrawer,
    onImgBoxClick,
    removeAlgo,
    onImgLoaded,
    handleRefreshImage
  })
</script>

<style lang="scss" scoped>
  .streaminfo-page {
    background: var(--art-main-bg-color);
    display: flex;
    flex-direction: column;
    // height: 100%;
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

  .org-path-text {
    color: var(--el-color-primary);
  }

  .toolbar-left {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  :deep(.algo-search-input) {
    .el-input__wrapper {
      box-shadow: 0 0 0 1px var(--el-border-color) inset;
      padding-left: 5px;
      transition: all 0.2s;

      &:hover,
      &:focus-within {
        box-shadow: 0 0 0 1px var(--el-color-primary) inset;
      }
    }

    .el-input__icon {
      font-size: 16px;
      margin-right: 4px;
      transition: transform 0.3s ease;
    }

    &:hover .el-input__icon,
    &:focus-within .el-input__icon {
      transform: scale(1.1);
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

  .stream-offline-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #f5f7fa;
    color: #909399;

    p {
      margin: 4px 0;
      font-size: 16px;
    }

    .hint {
      font-size: 14px;
      opacity: 0.8;
    }
  }
</style>
