<template>
  <div class="warning-page">
    <ArtSearchBar v-model:filter="searchForm" :items="searchItems" @reset="handleReset" @search="handleSearch" />
    <el-card shadow="never" class="art-table-card">
      <div class="result-header">
        <span>检索结果
          <span style="color: #f56c6c">{{ tableData.length }}</span> 条记录
          <el-tag v-if="hasError" type="danger" style="margin-left: 10px">{{ hasError.message }}</el-tag>
          <el-tag v-else-if="isLoading" type="warning" style="margin-left: 10px">加载中...</el-tag>
        </span>
        <div class="right">
          <el-button type="danger" :disabled="!selectedItems.length" @click="handleBatchDelete">
            批量删除 ({{ selectedItems.length }})
          </el-button>
          <!-- 导出功能 -->
          <ArtExcelExport :data="tableData as any" :columns="exportColumns as any" filename="告警数据" :auto-index="true"
            button-text="导出" @export-success="handleExportSuccess" />
          <el-button type="primary" @click="handleRefresh">
            <el-icon>
              <Refresh />
            </el-icon>
            刷新
          </el-button>
        </div>
      </div>
      <el-row :gutter="20" class="result-list">
        <el-col :span="6" v-for="item in tableData" :key="item.snap_id">
          <el-card class="warning-card" :class="{ 'is-selected': selectedItems.includes(item.snap_id) }"
            @click="openDrawer(item)" style="cursor: pointer">
            <div class="img-box" style="aspect-ratio: 16/9">
              <div class="checkbox-wrapper" @click.stop>
                <el-checkbox :model-value="selectedItems.includes(item.snap_id)" @change="
                  (val) =>
                    val
                      ? selectedItems.push(item.snap_id)
                      : selectedItems.splice(selectedItems.indexOf(item.snap_id), 1)
                " />
              </div>
              <img :src="item.snap_imgurl" alt="snap" style="width: 100%; height: 100%; object-fit: cover" />
              <div class="img-actions" @click.stop>
                <el-tooltip content="下载图片" placement="top">
                  <el-button type="primary" :icon="Download" circle size="small"
                    @click="downloadImage(item.snap_imgurl)" />
                </el-tooltip>
                <el-tooltip v-if="item.snap_videourl" content="下载视频" placement="top">
                  <el-button type="primary" :icon="VideoPlay" circle size="small"
                    @click="downloadVideo(item.snap_videourl)" />
                </el-tooltip>
              </div>
              <span class="status-tag" v-if="item.process_status === 72">未处理</span>
              <span class="status-tag done" v-else>已处理</span>
              <div class="level-indicator">
                <el-progress :percentage="item.process_level" :color="getLevelColor(item.process_level)"
                  :show-text="false" :stroke-width="4" />
              </div>
            </div>
            <div class="info-box">
              <div :title="item.algo_name">告警类型：{{ item.algo_name }}</div>
              <div :title="item.snap_time">告警时间：{{ item.snap_time }}</div>
              <div :title="item.device_name">设备名称：{{ item.device_name }}</div>
              <div :title="item.process_username">处理人：{{ item.process_username || '-' }}</div>
              <div :title="item.process_time">处理时间：{{ item.process_time || '-' }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <div class="pager-bar">
        <el-pagination v-model:current-page="paginationState.current" v-model:page-size="paginationState.size"
          :page-sizes="[8, 16, 24, 32]" :total="paginationState.total" layout="total, sizes, prev, pager, next, jumper"
          background @size-change="onPageSizeChange" @current-change="onCurrentPageChange" />
      </div>
    </el-card>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" :title="drawerData ? '告警详情' : ''" direction="rtl" size="50%" :with-header="true">
      <template #default>
        <div v-if="drawerData" class="drawer-detail-content drawer-flex-layout">
          <!-- 顶部信息区（三行两列的grid分组） -->
          <div class="drawer-info-header-horizontal info-header-grid-3x2">
            <div class="info-block">
              <span class="info-label">状态：</span>
              <span :style="{
                color: drawerData.process_status === 72 ? '#f56c6c' : '#67c23a',
                fontWeight: 600
              }">
                {{ drawerData.process_status === 72 ? '未处理' : '已处理' }}
              </span>
            </div>
            <div class="info-block">
              <span class="info-label">等级：</span>
              <span style="color: #e6a23c; font-weight: 600">{{ drawerData.process_level }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">类型：</span>
              <span style="color: #409eff; font-weight: 600">{{ drawerData.algo_name }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">时间：</span>
              <span>{{ drawerData.snap_time }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">数据源：</span>
              <span>{{ drawerData.device_name }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">IP：</span>
              <span>{{ drawerData.device_ip || '-' }}</span>
            </div>
          </div>
          <div class="drawer-main-flex drawer-main-2col">
            <!-- 左侧：视频+图片 -->
            <div class="drawer-imgs">
              <div class="drawer-video-box">
                <ArtVideoPlayer v-if="true" :playerId="'drawer-video-' + drawerData.snap_id"
                  :videoUrl="drawerData.snap_videourl" :posterUrl="drawerData.snap_imgurl" :autoplay="false" :volume="1"
                  :playbackRates="[0.5, 1, 1.5, 2]"
                  style="width: 100%; max-width: 320px; margin: 0 auto; background: transparent" />
              </div>
              <el-image :src="drawerData.snap_imgurl" :preview-src-list="[drawerData.snap_imgurl]" :initial-index="0"
                fit="cover" style="
                  width: 100%;
                  max-width: 320px;
                  margin: 16px auto 0 auto;
                  background: transparent;
                ">
                <template #placeholder>
                  <div class="image-slot">加载中<span class="dot">...</span></div>
                </template>
              </el-image>
              <div class="media-btn-bar media-btn-bar-center">
                <el-button v-if="drawerData.snap_videourl" type="primary" :icon="Download"
                  @click="downloadVideo(drawerData.snap_videourl, 'warning-video.mp4')">下载视频</el-button>
                <el-button type="primary" :icon="Download"
                  @click="downloadImage(drawerData.snap_imgurl, 'warning-image.jpg')">下载图片</el-button>
              </div>
            </div>
            <!-- 右侧：处理历史+操作 -->
            <div class="drawer-info-ops">
              <div class="drawer-history-block">
                <el-timeline>
                  <el-timeline-item v-for="(h, idx) in drawerData.process_history || []" :key="idx" :timestamp="h.time"
                    :color="h.result === '误报' ? '#f56c6c' : h.result === '确认' ? '#67c23a' : '#409EFF'
                      ">
                    <div>
                      <b>{{ h.user }}</b>：{{ h.result }}
                      <div v-if="h.remark" style="color: #888; font-size: 13px">意见：{{ h.remark }}</div>
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </div>
              <div class="drawer-process-block">
                <el-input v-model="processRemark" placeholder="处理意见" style="width: 100%; margin-bottom: 12px" />
                <div class="process-btn-group">
                  <el-button type="success" @click="handleProcess('确认')">确认</el-button>
                  <el-button type="danger" @click="handleProcess('误报')">误报</el-button>
                  <el-button @click="resetProcessInput">重置</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, reactive } from 'vue'
import { Download, Delete, VideoPlay, Refresh } from '@element-plus/icons-vue'
import { WARNING_LIST_MOCK, WarningInfoMock } from '@/mock/temp/warningList'
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
import ArtVideoPlayer from '@/components/core/media/art-video-player/index.vue'
import ArtExcelExport from '@/components/core/forms/art-excel-export/index.vue'
import type { SearchFormItem } from '@/types'
import { useTable } from '@/composables/useTable'

const searchForm = ref({
  startTime: '',
  endTime: '',
  processStatus: '',
  algoName: ''
})

const route = useRoute()
let timer: any = null

// 处理抽屉相关
const drawerVisible = ref(false)
const drawerData = ref<any>(null)
const processRemark = ref('')

// 选中的项目ID列表
const selectedItems = ref<string[]>([])

// 模拟API函数
const fetchWarningList = async (params: any) => {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 500))

  // 模拟根据条件过滤数据
  let filteredData = WARNING_LIST_MOCK.slice()

  if (params.processStatus !== '') {
    filteredData = filteredData.filter(item =>
      params.processStatus === 0 ? item.process_status === 72 : item.process_status !== 72
    )
  }

  if (params.algoName !== '') {
    filteredData = filteredData.filter(item =>
      item.algo_name.includes(params.algoName)
    )
  }

  // 模拟分页
  const total = filteredData.length
  const start = (params.current - 1) * params.size
  const end = start + params.size
  const records = filteredData.slice(start, end)

  // 返回标准格式的响应
  return {
    records,
    total,
    size: params.size,
    current: params.current,
    pages: Math.ceil(total / params.size)
  }
}

// 使用useTable Hook管理数据
const {
  // 数据相关
  tableData,
  isLoading,
  hasError,

  // 分页相关
  paginationState,
  onPageSizeChange,
  onCurrentPageChange,

  // 搜索相关
  searchState,
  resetSearch,

  // 数据操作
  searchData,
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
} = useTable<WarningInfoMock>({
  // 核心配置
  core: {
    apiFn: fetchWarningList,
    apiParams: {
      current: 1,
      size: 8, // 默认每页8条
      startTime: '',
      endTime: '',
      processStatus: '',
      algoName: ''
    } as any,
    immediate: true,
    columnsFactory: () => [
      { type: 'selection', width: 50 },
      { type: 'index', width: 60, label: '序号' },
      {
        prop: 'snap_imgurl',
        label: '告警图像',
        minWidth: 120,
        useSlot: true
      },
      {
        prop: 'algo_name',
        label: '告警类型',
        minWidth: 100,
        sortable: true
      },
      {
        prop: 'snap_time',
        label: '告警时间',
        minWidth: 150,
        sortable: true
      },
      {
        prop: 'device_name',
        label: '设备名称',
        minWidth: 120
      },
      {
        prop: 'process_status',
        label: '处理状态',
        minWidth: 100,
        useSlot: true,
        sortable: true
      },
      {
        prop: 'process_level',
        label: '告警级别',
        minWidth: 100,
        useSlot: true,
        sortable: true
      },
      {
        prop: 'process_username',
        label: '处理人',
        minWidth: 100
      },
      {
        prop: 'process_time',
        label: '处理时间',
        minWidth: 150,
        sortable: true
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
      ElMessage.success(`加载 ${data.length} 条数据成功`)
      // 刷新时清空选中项
      selectedItems.value = []
    },
    onError: (error) => {
      ElMessage.error(error.message)
    }
  }
})

// 导出列配置
const exportColumns = computed(() => ({
  algo_name: { title: '告警类型', width: 15 },
  snap_time: { title: '告警时间', width: 20 },
  device_name: { title: '设备名称', width: 15 },
  process_status: {
    title: '处理状态',
    width: 10,
    formatter: (value: number) => value === 72 ? '未处理' : '已处理'
  },
  process_level: { title: '告警级别', width: 10 },
  process_username: { title: '处理人', width: 15 },
  process_time: { title: '处理时间', width: 20 }
}))

function getLevelColor(level: number) {
  if (level < 30) return '#67c23a'
  if (level < 60) return '#e6a23c'
  return '#f56c6c'
}

function handleSearch() {
  // 将搜索表单的值应用到 searchState
  Object.assign(searchState, searchForm.value)
  searchData()
}

function handleReset() {
  searchForm.value = { startTime: '', endTime: '', processStatus: '', algoName: '' }
  resetSearch()
}

function openDrawer(item: any) {
  drawerData.value = item
  drawerVisible.value = true
}

function startTimer() {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    ElNotification({
      title: 'Primary',
      message: '有一条新的警告记录，请及时处理！',
      type: 'primary',
      position: 'top-left',
      duration: 6000
    })
  }, 5000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(() => {
  startTimer()
})

watch(
  () => route.fullPath,
  (newPath) => {
    if (!newPath.includes('/warning/warninginfo')) {
      stopTimer()
    } else {
      startTimer()
    }
  }
)

onUnmounted(() => {
  stopTimer()
})

const algoOptions = [
  { value: '', label: '全部' },
  { value: '速佳琪', label: '速佳琪' },
  { value: '区域入侵', label: '区域入侵' },
  { value: '烟雾检测', label: '烟雾检测' },
  { value: '火焰检测', label: '火焰检测' }
]

const processOptions = [
  { value: '', label: '全部' },
  { value: 0, label: '未处理' },
  { value: 1, label: '已处理' }
]

const searchItems: SearchFormItem[] = [
  {
    label: '开始时间',
    prop: 'startTime',
    type: 'date',
    config: { type: 'datetime', placeholder: '选择开始时间' }
  },
  {
    label: '截止时间',
    prop: 'endTime',
    type: 'date',
    config: { type: 'datetime', placeholder: '选择截止时间' }
  },
  {
    label: '告警类型',
    prop: 'algoName',
    type: 'select',
    config: { clearable: true },
    options: () => algoOptions
  },
  {
    label: '处理结果',
    prop: 'processStatus',
    type: 'select',
    config: { clearable: true },
    options: () => processOptions
  }
]

function downloadImage(url: string, filename = `warning-${Date.now()}.jpg`) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function downloadVideo(url: string, filename = `warning-${Date.now()}.mp4`) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function handleBatchDelete() {
  if (!selectedItems.value.length) return

  ElMessageBox.confirm(`确认删除选中的 ${selectedItems.value.length} 条记录吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 在实际应用中，这里应该调用后端API
    selectedItems.value = []
    ElMessage.success('批量删除成功')
    refreshAfterRemove()
  }).catch(() => {
    ElMessage.info('已取消删除操作')
  })
}

function handleDelete(row: WarningInfoMock) {
  ElMessageBox.confirm(`确认删除该告警记录吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 在实际应用中，这里应该调用后端API
    ElMessage.success('删除成功')
    refreshAfterRemove()
  }).catch(() => {
    ElMessage.info('已取消删除操作')
  })
}

function handleProcess(result: string) {
  if (!drawerData.value) return
  if (!processRemark.value) {
    ElMessage.warning('请输入处理意见')
    return
  }

  // 在实际应用中，这里应该调用后端API
  ElMessage.success(`${result}处理成功`)

  // 更新状态
  if (!drawerData.value.process_history) {
    drawerData.value.process_history = []
  }

  drawerData.value.process_history.push({
    time: new Date().toLocaleString(),
    user: '当前用户',
    result,
    remark: processRemark.value
  })

  if (result === '确认') {
    drawerData.value.process_status = 1
  }

  refreshAfterUpdate()
  resetProcessInput()
}

function resetProcessInput() {
  processRemark.value = ''
}

function handleExportSuccess(filename: string, count: number) {
  ElMessage.success(`导出 ${count} 条数据成功`)
}
</script>

<style lang="scss" scoped>
.warning-page {
  padding: 24px;
  background: var(--art-main-bg-color);
  min-height: 100vh;
}

.art-table-card {
  background: var(--art-root-card-border-color);
  border-radius: 10px;
  margin-top: 16px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.result-list {
  margin-top: 8px;
}

.warning-card {
  margin-bottom: 16px;
  background: var(--art-root-card-border-color);
  color: var(--art-text-gray-800);
  position: relative;
  transition: all 0.3s;
}

.warning-card.is-selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.3);
}

.img-box {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 6px;
  margin-bottom: 12px;
  background: var(--art-gray-900);
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16/9;
}

.img-box img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.status-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #f56c6c;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-tag.done {
  background: #67c23a;
}

.level-indicator {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.5);
  padding: 3px 6px;
  border-radius: 4px;
}

.info-box {
  font-size: 14px;
  line-height: 2;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-box>div {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawer-detail-content {
  padding: 12px 0;
}

.drawer-flex-layout {
  display: block;
}

.drawer-main-flex {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.drawer-imgs {
  width: 100%;
  max-width: 500px;
  margin: 0 auto 24px auto;
}

.drawer-info-ops {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

@media (min-width: 900px) {
  .drawer-flex-layout {
    display: flex;
    flex-direction: column;
  }

  .drawer-main-flex {
    flex-direction: row;
    gap: 48px;
    align-items: flex-start;
    justify-content: flex-start;
  }

  .drawer-imgs {
    width: 320px;
    margin: 0 0 0 0;
  }

  .drawer-info-ops {
    width: 400px;
    margin: 0;
  }
}

.drawer-info-header-horizontal.info-header-grid-3x2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 1fr));
  grid-template-rows: repeat(3, auto);
  gap: 14px 32px;
  align-items: center;
  padding: 18px 24px 12px 24px;
  margin-bottom: 24px;
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 900px) {
  .drawer-info-header-horizontal.info-header-grid-3x2 {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    gap: 10px 0;
    padding: 14px 10px 8px 10px;
  }
}

.drawer-info-header-horizontal .info-block {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drawer-info-header-horizontal .info-label {
  color: #888;
  font-weight: 500;
}

.drawer-main-2col {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

@media (min-width: 900px) {
  .drawer-main-2col {
    flex-direction: row;
    gap: 48px;
    align-items: flex-start;
    justify-content: center;
  }
}

.drawer-imgs-card {
  padding: 24px 18px 18px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.media-btn-bar-center {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-top: 18px;
  margin-bottom: 0;
}

.drawer-info-ops-card {
  padding: 24px 18px 18px 18px;
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: stretch;
}

.drawer-history-block {
  margin-bottom: 0;
  max-height: 300px;
  overflow-y: auto;
}

.drawer-process-block {
  margin-top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.process-btn-group {
  display: flex;
  gap: 16px;
  justify-content: center;
  width: 100%;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.checkbox-wrapper {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  transition: all 0.3s;
}

.checkbox-wrapper :deep(.el-checkbox__inner) {
  background-color: transparent;
  border-color: #fff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
}

.checkbox-wrapper :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.checkbox-wrapper :deep(.el-checkbox__inner:hover) {
  border-color: var(--el-color-primary);
}

.checkbox-wrapper :deep(.el-checkbox__input.is-focus .el-checkbox__inner) {
  border-color: var(--el-color-primary);
}

.img-actions {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.3s;
  display: flex;
  gap: 6px;
}

.img-box:hover .img-actions {
  opacity: 1;
}

.img-actions .el-button {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  color: var(--el-text-color-primary);
}

.img-actions .el-button:hover {
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-hover);
  color: var(--el-color-primary);
}

.media-btn-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
  margin-bottom: 0;
}

.pager-bar {
  text-align: center;
  margin-top: 16px;
}

.pager-bar :deep(.el-pagination) {
  display: inline-flex;
  justify-content: center;
  align-items: center;
}
</style>
