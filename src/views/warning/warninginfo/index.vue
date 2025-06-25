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
          >检索结果 <span style="color: #f56c6c">{{ dataList.length }}</span> 条记录</span
        >
        <div class="right">
          <el-button type="danger" :disabled="!selectedItems.length" @click="handleBatchDelete">
            批量删除
          </el-button>
        </div>
      </div>
      <el-row :gutter="20" class="result-list">
        <el-col :span="6" v-for="item in pagedData" :key="item.snap_id">
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
                    :icon="Download"
                    circle
                    size="small"
                    @click="downloadImage(item.snap_imgurl)"
                  />
                </el-tooltip>
              </div>
              <span class="status-tag" v-if="item.process_status === 72">未处理</span>
              <span class="status-tag done" v-else>已处理</span>
            </div>
            <div class="info-box">
              <div :title="item.algo_name">事件类型：{{ item.algo_name }}</div>
              <div :title="item.snap_time">事件时间：{{ item.snap_time }}</div>
              <div :title="item.device_name">事件地点：{{ item.device_name }}</div>
              <div :title="item.device_id">事件设备：{{ item.device_id }}</div>
              <div :title="item.process_remark">事件备注：{{ item.process_remark }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <div class="pager-bar">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[8, 16, 24, 32]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    <el-drawer
      v-model="drawerVisible"
      :title="drawerData ? '告警详情' : ''"
      direction="rtl"
      size="50%"
      :with-header="true"
    >
      <template #default>
        <div v-if="drawerData" class="drawer-detail-content">
          <div class="drawer-imgs">
            <el-image
              :src="drawerData.snap_imgurl"
              :preview-src-list="[drawerData.snap_imgurl]"
              :initial-index="0"
              fit="cover"
              style="width: 60%; border-radius: 8px; box-shadow: 0 2px 8px #0002"
            >
              <template #placeholder>
                <div class="image-slot">加载中<span class="dot">...</span></div>
              </template>
            </el-image>
          </div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="事件类型">{{ drawerData.algo_name }}</el-descriptions-item>
            <el-descriptions-item label="事件时间">{{ drawerData.snap_time }}</el-descriptions-item>
            <el-descriptions-item label="事件地点">
              <span class="ellipsis" :title="drawerData.device_name">{{
                drawerData.device_name
              }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="事件设备">{{ drawerData.device_id }}</el-descriptions-item>
            <el-descriptions-item label="处理等级">{{
              drawerData.process_level
            }}</el-descriptions-item>
            <el-descriptions-item label="处理状态">{{
              drawerData.process_status === 72 ? '未处理' : '已处理'
            }}</el-descriptions-item>
            <el-descriptions-item label="处理人">{{
              drawerData.process_username
            }}</el-descriptions-item>
            <el-descriptions-item label="处理时间">{{
              drawerData.process_time
            }}</el-descriptions-item>
            <el-descriptions-item label="事件备注">
              <span class="ellipsis" :title="drawerData.process_remark">{{
                drawerData.process_remark
              }}</span>
            </el-descriptions-item>
          </el-descriptions>
          <div style="margin-top: 24px">
            <el-table :data="historyList" border class="drawer-history-table">
              <el-table-column prop="time" label="处理时间" width="160" />
              <el-table-column prop="user" label="处理人" width="120" />
              <el-table-column prop="result" label="处理结果" />
              <el-table-column prop="remark" label="备注" />
            </el-table>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, watch, computed, reactive } from 'vue'
  import { Download } from '@element-plus/icons-vue'
  import { WARNING_LIST_MOCK, WarningInfoMock } from '@/mock/temp/warningList'
  import { ElNotification, ElMessageBox, ElMessage } from 'element-plus'
  import { useRoute } from 'vue-router'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import type { SearchFormItem } from '@/types'

  const searchForm = ref({
    startTime: '',
    endTime: '',
    processStatus: '',
    algoName: ''
  })

  const dataList = ref<WarningInfoMock[]>([])

  const drawerVisible = ref(false)
  const drawerData = ref<any>(null)
  const historyList = ref([
    {
      time: '2025-06-18 15:36:02',
      user: '杭若汐',
      result: '告警准确,正在处理事件',
      remark: '首次告警'
    },
    { time: '2025-06-18 16:00:00', user: '张伟', result: '告警准确,已处理完成', remark: '处理完毕' }
  ])

  const route = useRoute()
  let timer: any = null

  const pagination = reactive({
    currentPage: 1,
    pageSize: 8,
    total: dataList.value.length
  })
  watch(
    () => dataList.value.length,
    (len) => {
      pagination.total = len
    }
  )
  const pagedData = computed(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize
    return dataList.value.slice(start, start + pagination.pageSize) as typeof dataList.value
  })
  function handleSizeChange(newPageSize: number) {
    pagination.pageSize = newPageSize
    pagination.currentPage = 1
  }
  function handleCurrentChange(newCurrentPage: number) {
    pagination.currentPage = newCurrentPage
  }

  function handleSearch() {
    // 检索逻辑（模拟）
  }
  function handleReset() {
    searchForm.value = { startTime: '', endTime: '', processStatus: '', algoName: '' }
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
    dataList.value = WARNING_LIST_MOCK.slice()
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
    { value: 'Option1', label: 'Option1' },
    { value: 'Option2', label: 'Option2' },
    { value: 'Option3', label: 'Option3' },
    { value: 'Option4', label: 'Option4' },
    { value: 'Option5', label: 'Option5' }
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
      label: '事件类型',
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

  const selectedItems = ref<string[]>([])

  function downloadImage(url: string) {
    const link = document.createElement('a')
    link.href = url
    link.download = `warning-${Date.now()}.jpg`
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
    })
      .then(() => {
        // 在实际应用中，这里应该调用后端API
        dataList.value = dataList.value.filter(
          (item) => !selectedItems.value.includes(item.snap_id)
        )
        selectedItems.value = []
        ElMessage({
          type: 'success',
          message: '删除成功'
        })
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '已取消删除'
        })
      })
  }
</script>

<style scoped>
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
  .ellipsis {
    max-width: 100%;
    display: inline-block;
    vertical-align: bottom;
  }
  .drawer-detail-content {
    padding: 12px 0;
  }
  .drawer-imgs {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }
  .drawer-imgs img {
    border: 1px solid var(--art-gray-900);
    aspect-ratio: 16/9;
    object-fit: cover;
  }
  .drawer-history-table {
    background: var(--art-root-card-border-color);
    color: var(--art-text-gray-800);
  }
  .drawer-history-table .el-table__header th {
    background: var(--art-main-bg-color);
    color: var(--art-text-gray-800);
  }
  .drawer-history-table .el-table__row {
    background: var(--art-root-card-border-color);
  }
  .pager-bar {
    text-align: center;
  }
  .pager-bar :deep(.el-pagination) {
    display: inline-flex;
    background: var(--art-root-card-border-color);
    border-radius: 8px;
    padding: 12px 24px;
    box-shadow: 0 2px 8px #0002;
    align-items: center;
  }
  .pager-bar :deep(.el-pagination__total),
  .pager-bar :deep(.el-pagination__sizes),
  .pager-bar :deep(.el-pagination__jump) {
    color: var(--art-text-gray-800);
  }
  .pager-bar :deep(.el-pagination__editor.el-input .el-input__inner) {
    /* background: var(--art-main-bg-color); */
    color: var(--art-text-gray-800);
    border-radius: 6px;
  }
  .pager-bar :deep(.el-pager li) {
    background: var(--art-main-bg-color);
    color: var(--art-text-gray-800);
    border-radius: 6px;
    margin: 0 2px;
    transition:
      background 0.2s,
      color 0.2s;
  }
  .pager-bar :deep(.el-pager li.is-active) {
    background: #6c7fff;
    color: #fff;
    border-radius: 6px;
  }
  .pager-bar :deep(.el-pager li:hover) {
    color: var(--art-primary);
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
  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
  }
</style>
