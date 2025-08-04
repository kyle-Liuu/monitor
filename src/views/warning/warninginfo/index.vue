<template>
  <div class="warning-page">
    <ArtSearchBar
      v-model:filter="searchForm"
      :items="searchItems"
      @reset="handleReset"
      @search="handleSearch"
    />
    <el-card shadow="never" class="art-table-card">
      <div class="result-header">
        <span
          >检索结果 <span style="color: #f56c6c">{{ tableData.length }}</span> 条记录
          <el-tag v-if="hasError" type="danger" style="margin-left: 10px">{{
            hasError.message
          }}</el-tag>
          <el-tag v-else-if="isLoading" type="warning" style="margin-left: 10px">加载中...</el-tag>
        </span>
        <div class="right">
          <el-button type="danger" :disabled="!selectedItems.length" @click="handleBatchDelete">
            批量删除 ({{ selectedItems.length }})
          </el-button>
          <!-- 导出功能 -->
          <ArtExcelExport
            :data="tableData as any"
            :columns="exportColumns as any"
            filename="告警数据"
            :auto-index="true"
            button-text="导出"
            @export-success="handleExportSuccess"
          />
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
          <el-card
            class="warning-card"
            :class="{ 'is-selected': selectedItems.includes(item.snap_id) }"
            @click="openDrawer(item)"
            style="cursor: pointer"
          >
            <div class="img-box" style="aspect-ratio: 16/9">
              <div class="checkbox-wrapper" @click.stop>
                <el-checkbox
                  :model-value="selectedItems.includes(item.snap_id)"
                  @change="
                    (val) =>
                      val
                        ? selectedItems.push(item.snap_id)
                        : selectedItems.splice(selectedItems.indexOf(item.snap_id), 1)
                  "
                />
              </div>
              <img
                :src="item.snap_imgurl"
                alt="snap"
                style="width: 100%; height: 100%; object-fit: cover"
              />
              <div class="img-actions" @click.stop>
                <el-tooltip content="下载图片" placement="top">
                  <el-button
                    type="primary"
                    size="small"
                    :icon="Download"
                    class="action-btn"
                    @click="downloadImage(item.snap_imgurl)"
                  />
                </el-tooltip>
                <el-tooltip content="下载视频" placement="top">
                  <el-button
                    v-if="item.snap_videourl"
                    type="primary"
                    size="small"
                    :icon="VideoPlay"
                    class="action-btn"
                    @click="downloadVideo(item.snap_videourl)"
                  />
                </el-tooltip>
              </div>
              <span class="status-tag" v-if="item.process_status === 72">未处理</span>
              <span class="status-tag done" v-else>已处理</span>
              <div class="level-indicator">
                <el-progress
                  :percentage="item.process_level"
                  :color="getLevelColor(item.process_level)"
                  :show-text="false"
                  :stroke-width="4"
                />
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
        <el-pagination
          v-model:current-page="paginationState.current"
          v-model:page-size="paginationState.size"
          :page-sizes="[8, 16, 24, 32]"
          :total="paginationState.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="onPageSizeChange"
          @current-change="onCurrentPageChange"
        />
      </div>
    </el-card>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="drawerData ? '告警详情' : ''"
      direction="rtl"
      size="50%"
      :with-header="true"
    >
      <template #default>
        <div v-if="drawerData" class="drawer-detail-content drawer-flex-layout">
          <!-- 顶部信息区（三行两列的grid分组） -->
          <div class="drawer-info-header-horizontal info-header-grid-3x2">
            <div class="info-block">
              <span class="info-label">状态：</span>
              <span
                :style="{
                  color: drawerData.process_status === 72 ? '#f56c6c' : '#67c23a',
                  fontWeight: 600
                }"
              >
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
                <ArtVideoPlayer
                  v-if="drawerData && drawerData.snap_videourl"
                  :playerId="'drawer-video-' + drawerData.snap_id"
                  :videoUrl="drawerData.snap_videourl || ''"
                  :posterUrl="drawerData.snap_imgurl"
                  :autoplay="false"
                  :volume="1"
                  :playbackRates="[0.5, 1, 1.5, 2]"
                  style="width: 100%; max-width: 320px; margin: 0 auto; background: transparent"
                />
              </div>
              <el-image
                :src="drawerData.snap_imgurl"
                :preview-src-list="[drawerData.snap_imgurl]"
                :initial-index="0"
                fit="cover"
                style="
                  width: 100%;
                  max-width: 320px;
                  margin: 16px auto 0 auto;
                  background: transparent;
                "
              >
                <template #placeholder>
                  <div class="image-slot">加载中<span class="dot">...</span></div>
                </template>
              </el-image>
              <div class="media-btn-bar media-btn-bar-center">
                <el-button
                  v-if="drawerData && drawerData.snap_videourl"
                  type="primary"
                  :icon="Download"
                  @click="downloadVideo(drawerData.snap_videourl)"
                  >下载视频</el-button
                >
                <el-button
                  type="primary"
                  :icon="Download"
                  @click="downloadImage(drawerData.snap_imgurl)"
                  >下载图片</el-button
                >
              </div>
            </div>
            <!-- 右侧：处理历史+操作 -->
            <div class="drawer-info-ops">
              <div class="drawer-history-block">
                <el-timeline>
                  <el-timeline-item
                    v-for="(h, idx) in drawerData.process_history || []"
                    :key="idx"
                    :timestamp="h.time"
                    :color="
                      h.result === '误报' ? '#f56c6c' : h.result === '确认' ? '#67c23a' : '#409EFF'
                    "
                  >
                    <div>
                      <b>{{ h.user }}</b
                      >：{{ h.result }}
                      <div v-if="h.remark" style="color: #888; font-size: 13px"
                        >意见：{{ h.remark }}</div
                      >
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </div>
              <div class="drawer-process-block">
                <el-input
                  v-model="processRemark"
                  placeholder="处理意见"
                  style="width: 100%; margin-bottom: 12px"
                />
                <div class="process-btn-group">
                  <el-button type="success" @click="handleProcess">确认</el-button>
                  <el-button type="danger" @click="handleProcess">误报</el-button>
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
  import { WarningService, type AlarmItem, type AlarmDetail, AlarmStatus } from '@/api/warningApi'
  import { ElNotification, ElMessageBox, ElMessage } from 'element-plus'
  import { useRoute } from 'vue-router'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import ArtVideoPlayer from '@/components/core/media/art-video-player/index.vue'
  import ArtExcelExport from '@/components/core/forms/art-excel-export/index.vue'
  import type { SearchFormItem } from '@/types'
  import { useTable } from '@/composables/useTable'

  // 定义本地UI组件使用的告警项目类型，与组件期望的格式匹配
  interface WarningUIItem {
    id: string
    snap_id: string
    snap_time: string
    snap_imgurl: string
    snap_videourl?: string
    device_name: string
    device_ip?: string
    algo_name: string
    process_status: number // 72=未处理, 73=已处理, 74=忽略
    process_level: number // 危险等级 0-100
    process_time?: string
    process_username?: string
    remark?: string
    process_history?: Array<{
      time: string
      user: string
      result: string
      remark: string
    }>
  }

  // 将API返回的AlarmItem转换为UI展示需要的格式
  function convertToUIWarning(apiWarning: AlarmItem | AlarmDetail): WarningUIItem {
    // 添加数据验证
    if (!apiWarning || typeof apiWarning !== 'object') {
      console.warn('无效的告警数据:', apiWarning)
      return {
        id: 'unknown',
        snap_id: 'unknown',
        snap_time: new Date().toISOString(),
        snap_imgurl: '',
        snap_videourl: '',
        device_name: '未知设备',
        device_ip: '',
        algo_name: '未知算法',
        process_status: 72,
        process_level: 25,
        process_time: '',
        process_username: '',
        remark: '',
        process_history: []
      }
    }

    // 计算危险等级数值
    let processLevel = 25
    switch (apiWarning.level) {
      case 'low':
        processLevel = 25
        break
      case 'medium':
        processLevel = 50
        break
      case 'high':
        processLevel = 75
        break
      case 'critical':
        processLevel = 100
        break
      default:
        processLevel = 25
        break
    }

    // 转换处理状态
    let processStatus = 72 // 默认未处理
    if (apiWarning.status === 'processed') {
      processStatus = 73
    } else if (apiWarning.status === 'ignored') {
      processStatus = 74
    }

    // 检查是否为AlarmDetail类型，获取扩展信息
    const isDetail = 'task_info' in apiWarning
    const taskInfo = isDetail ? (apiWarning as AlarmDetail).task_info : undefined

    return {
      id: apiWarning.alarm_id || 'unknown',
      snap_id: apiWarning.alarm_id || 'unknown',
      snap_time: apiWarning.created_at || new Date().toISOString(),
      snap_imgurl: apiWarning.media_files?.original_image || '',
      snap_videourl: apiWarning.media_files?.video_clip || '',
      device_name: taskInfo?.stream_name || '未知设备',
      device_ip: '',
      algo_name: taskInfo?.algorithm_name || '未知算法',
      process_status: processStatus,
      process_level: processLevel,
      process_time: apiWarning.processed_at || '',
      process_username: apiWarning.processed_by || '',
      remark: apiWarning.process_comment || '',
      process_history: apiWarning.processed_at
        ? [
            {
              time: apiWarning.processed_at,
              user: apiWarning.processed_by || '未知用户',
              result: apiWarning.status === 'processed' ? '确认' : '忽略',
              remark: apiWarning.process_comment || ''
            }
          ]
        : []
    }
  }

  // 转换多个告警项
  function convertToUIWarnings(apiWarnings: any[]): WarningUIItem[] {
    if (!Array.isArray(apiWarnings)) {
      console.warn('告警数据不是数组格式:', apiWarnings)
      return []
    }

    return apiWarnings
      .filter((item) => item && typeof item === 'object') // 过滤无效数据
      .map((item) => {
        try {
          return convertToUIWarning(item)
        } catch (error) {
          console.error('转换告警数据失败:', error, item)
          return null
        }
      })
      .filter(Boolean) as WarningUIItem[] // 过滤转换失败的项
  }

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
  const drawerData = ref<WarningUIItem | null>(null)
  const processRemark = ref('')

  // 选中的项目ID列表
  const selectedItems = ref<string[]>([])

  // 模拟API函数
  // 修复API调用函数，使用真实接口参数
  const fetchWarningList = async (params: any) => {
    try {
      // 转换参数，匹配真实后端接口
      const apiParams = {
        page: params.current || 1, // 修复：使用page替代skip
        page_size: params.size || 8, // 修复：使用page_size替代limit
        status:
          params.processStatus !== ''
            ? params.processStatus === 0
              ? AlarmStatus.NEW
              : AlarmStatus.PROCESSED
            : undefined,
        task_id: params.algoName || undefined, // 修复：使用task_id
        start_time: params.startTime || undefined,
        end_time: params.endTime || undefined
      }

      // console.log('发送API请求参数:', apiParams)

      // 调用真实API
      const response = await WarningService.getWarningList(apiParams)

      // console.log('API响应数据:', response)

      // 修复：根据实际API响应格式处理数据
      let alarms: any[] = []
      let total = 0

      // 检查实际的响应格式：直接返回数据，不是包装在data字段中
      if (response && typeof response === 'object') {
        // 使用类型断言避免TypeScript错误，因为实际API响应格式与类型定义不匹配
        const responseData = response as any

        if (responseData.alarms && Array.isArray(responseData.alarms)) {
          // 实际API响应格式：{alarms: [], total: number, page: number, page_size: number}
          alarms = responseData.alarms
          total = responseData.total || 0
        } else if (responseData.data && responseData.data.alarms) {
          // 如果是包装格式
          alarms = responseData.data.alarms
          total = responseData.data.total || 0
        } else {
          console.warn('未识别的响应格式:', response)
          alarms = []
          total = 0
        }
      }

      // console.log('解析出的告警数据:', { alarms, total })

      // 转换为UI格式
      const records = convertToUIWarnings(alarms)

      // console.log('转换后的UI数据:', records)

      return {
        records,
        total,
        size: params.size,
        current: params.current,
        pages: Math.ceil(total / params.size)
      }
    } catch (error) {
      console.error('获取告警列表失败:', error)
      ElMessage.error('获取告警列表失败')
      return {
        records: [],
        total: 0,
        size: params.size,
        current: params.current,
        pages: 0
      }
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

    // 表格配置
    columns,
    columnChecks
  } = useTable<WarningUIItem>({
    // 核心配置
    core: {
      apiFn: fetchWarningList,
      apiParams: {
        current: 1,
        size: 8, // 每页8个预警信息
        processStatus: searchForm.value.processStatus,
        algoName: searchForm.value.algoName,
        startTime: searchForm.value.startTime,
        endTime: searchForm.value.endTime
      },
      immediate: true // 立即执行查询
    },

    // 数据处理 - 添加自定义响应适配器
    transform: {
      responseAdapter: (response: any) => {
        // 我们的fetchWarningList已经返回了标准格式
        return {
          records: response.records || [],
          total: response.total || 0,
          current: response.current,
          size: response.size
        }
      }
    },

    // 性能优化
    performance: {
      enableCache: true,
      cacheTime: 5 * 60 * 1000, // 5分钟
      debounceTime: 300 // 300ms防抖
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
      formatter: (value: number) => (value === 72 ? '未处理' : '已处理')
    },
    process_level: { title: '告警级别', width: 10 },
    process_username: { title: '处理人', width: 15 },
    process_time: { title: '处理时间', width: 20 }
  }))

  // 批量处理告警
  async function handleBatchProcess() {
    if (!selectedItems.value.length) {
      ElMessage.warning('请先选择要处理的告警')
      return
    }

    try {
      // 调用批量处理API
      await WarningService.batchHandleWarnings({
        alarm_ids: selectedItems.value,
        status: 'processed',
        comment: '批量处理'
      })

      ElMessage.success(`成功处理 ${selectedItems.value.length} 条告警`)
      selectedItems.value = []
      handleRefresh() // 刷新列表
    } catch (error) {
      console.error('批量处理告警失败:', error)
      ElMessage.error('批量处理告警失败')
    }
  }

  // 批量删除告警
  function handleBatchDelete() {
    if (!selectedItems.value.length) {
      ElMessage.warning('请先选择要删除的告警记录')
      return
    }

    ElMessageBox.confirm(`确认删除选中的 ${selectedItems.value.length} 条告警记录吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          // 调用批量处理API，使用ignored状态表示删除
          await WarningService.batchHandleWarnings({
            alarm_ids: selectedItems.value,
            status: 'ignored',
            comment: '批量忽略'
          })

          ElMessage.success(`成功删除 ${selectedItems.value.length} 条告警`)
          selectedItems.value = []
          handleRefresh() // 刷新列表
        } catch (error) {
          console.error('批量删除告警失败:', error)
          ElMessage.error('批量删除告警失败')
        }
      })
      .catch(() => {
        ElMessage.info('已取消批量删除')
      })
  }

  // 计算级别颜色
  function getLevelColor(level: number): string {
    if (level >= 80) return '#F56C6C' // 危险
    if (level >= 60) return '#E6A23C' // 警告
    if (level >= 40) return '#409EFF' // 普通
    return '#67C23A' // 低风险
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

  // 打开抽屉显示详情
  const openDrawer = (item: WarningUIItem) => {
    handleViewDetail(item)
  }

  // 从数组中获取对象
  function getItemById(id: string): WarningUIItem | undefined {
    return tableData.value.find((item) => item.id === id || item.snap_id === id)
  }

  // 处理批量处理
  function handleProcess() {
    if (!drawerData.value) return
    if (!processRemark.value) {
      ElMessage.warning('请输入处理意见')
      return
    }

    handleProcessWarning()
  }

  // 下载图片
  function downloadImage(imageUrl: string) {
    // 创建一个链接元素
    const link = document.createElement('a')
    link.href = imageUrl
    link.target = '_blank'
    link.download = `alarm-image-${Date.now()}.jpg`

    // 触发点击
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    ElMessage.success('开始下载图片')
  }

  // 下载视频
  function downloadVideo(videoUrl?: string) {
    if (!videoUrl) {
      ElMessage.warning('视频地址为空')
      return
    }

    // 创建一个链接元素
    const link = document.createElement('a')
    link.href = videoUrl
    link.target = '_blank'
    link.download = `alarm-video-${Date.now()}.mp4`

    // 触发点击
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    ElMessage.success('开始下载视频')
  }

  // 处理删除
  function handleDelete(row: WarningUIItem) {
    ElMessageBox.confirm(`确认删除该告警记录吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        // 在实际场景中，这里会调用后端删除API
        await WarningService.handleWarning(row.id, {
          status: 'ignored', // 使用ignored表示删除/忽略告警
          comment: '手动忽略'
        })

        ElMessage.success('删除成功')
        refreshAfterRemove()

        // 如果该项被选中，从选中列表中移除
        if (selectedItems.value.includes(row.snap_id)) {
          selectedItems.value = selectedItems.value.filter((id) => id !== row.snap_id)
        }
      } catch (error) {
        console.error('删除告警失败:', error)
        ElMessage.error('删除失败')
      }
    })
  }

  // 表格选择事件
  const handleSelectionChange = (selection: WarningUIItem[]) => {
    selectedItems.value = selection.map((item) => item.snap_id)
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

  // 处理告警记录
  const handleProcessWarning = async () => {
    if (!drawerData.value) return

    try {
      // 调用处理告警API
      await WarningService.handleWarning(drawerData.value.id, {
        status: 'processed',
        comment: processRemark.value
      })

      ElMessage.success('处理成功')
      drawerVisible.value = false
      handleRefresh() // 刷新列表
    } catch (error) {
      console.error('处理告警失败:', error)
      ElMessage.error('处理告警失败')
    }
  }

  // 修复处理详情查看的函数
  const handleViewDetail = async (row: WarningUIItem) => {
    try {
      drawerVisible.value = true
      drawerData.value = null

      // 获取告警详情
      const response = await WarningService.getWarningDetail(row.id)

      // 修复：正确处理API响应，提取data字段
      drawerData.value = convertToUIWarning(response.data)
    } catch (error) {
      console.error('获取告警详情失败:', error)
      ElMessage.error('获取告警详情失败')
      drawerData.value = null
    }
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

  .info-box > div {
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
