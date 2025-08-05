<template>
  <div class="container" id="app">
    <div class="header">
      <button class="back-button" @click="goBackToDashboard">后台调度</button>
      <h1>智能监控平台</h1>
    </div>
    <div class="left-panel">
      <div class="module-section device-list-module">
        <div class="section-title">设备列表</div>
        <div class="tree-view-wrapper">
          <div class="tree-view">
            <ul id="org-tree-root"></ul>
          </div>
        </div>
      </div>
      <div class="module-section cpu-module-section">
        <div
          class="section-title"
          style="display: flex; gap: 50px; align-items: center; justify-content: flex-start"
        >
          内存/CPU
        </div>
        <div id="cpu-chart" class="cpu-chart-container"></div>
      </div>
      <div class="module-section storage-module-section">
        <div class="section-title">存储</div>
        <div class="storage-bar-outer">
          <div class="storage-bar-inner" id="storage-bar-inner"></div>
          <div class="storage-bar-label" id="storage-bar-label">45%</div>
        </div>
      </div>
    </div>
    <div class="main-content">
      <div class="video-section">
        <div class="section-title video-title-bar">
          <span>实时调阅</span>
          <span class="time-display" style="margin-left: 20px">{{ currentTime }}</span>
          <div class="screen-switch" style="margin-left: auto">
            <span class="control-icon" @click="onPlayer">
              <svg
                t="1750127183805"
                class="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="2667"
                width="200"
                height="200"
              >
                <path
                  d="M772.096 875.52l87.04-1.536 2.048 102.4-256.512 4.608-4.608-256.512 102.4-1.536 1.536 75.776c156.16-122.88 182.784-348.672 60.416-504.32-69.632-88.576-176.128-139.264-288.256-137.216l4.096-102.912c254.976-1.024 462.848 204.8 463.872 459.776 0.512 140.8-62.976 273.408-172.032 361.472zM203.264 147.456l-87.04 1.536-1.536-102.4 256.512-4.608 4.608 256.512-102.4 1.536-2.048-75.776c-156.16 122.88-182.784 348.672-60.416 504.32 69.632 88.064 176.128 139.264 288.256 137.216l-4.096 102.912c-254.976 1.024-462.848-204.8-463.872-459.776C31.232 368.64 94.208 235.52 203.264 147.456z"
                  p-id="2668"
                ></path>
              </svg>
            </span>
            <span class="control-icon" @click="onStop">
              <svg
                t="1750127118511"
                class="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="1594"
                width="200"
                height="200"
              >
                <path
                  d="M567.02 36.49H456.98v558.04h110.04V36.49z m199.11 136.23l-81.22 81.22c50.65 29.69 90.38 69.86 119.21 120.52 28.82 50.65 43.23 106.11 43.23 166.36 0 60.26-14.85 116.15-44.54 167.68-29.69 51.52-70.3 92.13-121.82 121.82-51.53 29.69-107.85 44.54-168.98 44.54-61.13 0-117.46-14.85-168.98-44.54-51.53-29.69-92.13-70.3-121.83-121.82-29.69-51.53-44.54-107.42-44.54-167.68 0-60.26 14.41-115.71 43.23-166.36s67.68-90.82 116.59-120.52l-78.6-81.22c-59.39 41.92-106.54 94.75-141.48 158.5C81.47 394.98 64 464.41 64 539.51c0 80.34 20.08 155.01 60.26 224S219.01 887.08 288 927.25c68.99 40.17 143.66 60.26 224 60.26s155.01-20.09 224-60.26c68.99-40.17 123.57-94.75 163.74-163.74 40.17-68.99 60.26-143.66 60.26-224 0-75.1-17.47-144.53-52.4-208.28s-82.09-116.59-141.47-158.51z"
                  p-id="1595"
                ></path>
              </svg>
            </span>
            <div class="divider"></div>
            <span
              v-for="item in [1, 4, 9]"
              :key="item"
              :class="['screen-btn', { active: screenCount === item }]"
              @click="switchScreen(item)"
            >
              <svg
                v-if="item === 1"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M960 920c0 22-18 40-40 40H104c-22 0-40-18-40-40V104c0-22 18-40 40-40h816c22 0 40 18 40 40v816z"
                ></path>
              </svg>
              <svg
                v-else-if="item === 4"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M480 96v288c0 53-43 96-96 96H96c-53 0-96-43-96-96V96C0 43 43 0 96 0h288c53 0 96 43 96 96zM1024 96v288c0 53-43 96-96 96H640c-53 0-96-43-96-96V96c0-53 43-96 96-96h288c53 0 96 43 96 96zM480 640v288c0 53-43 96-96 96H96c-53 0-96-43-96-96V640c0-53 43-96 96-96h288c53 0 96 43 96 96zM1024 640v288c0 53-43 96-96 96H640c-53 0-96-43-96-96V640c0-53 43-96 96-96h288c53 0 96 43 96 96z"
                ></path>
              </svg>
              <svg
                v-else-if="item === 9"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M267.094423 22.942738c15.17106 15.217597 22.75659 33.73932 22.756589 55.56517v133.188874c0 21.872387-7.58553 40.347573-22.803126 55.56517-15.17106 15.17106-33.646246 22.803127-55.518633 22.803127H78.340378c-21.872387 0-40.347573-7.632067-55.518633-22.803127A75.576077 75.576077 0 0 1 0.018618 211.696782V78.507908C0.018618 56.635521 7.604148 38.160334 22.821745 22.942738 37.992805 7.771678 56.514528 0.186148 78.340378 0.186148h133.188875c21.872387 0 40.347573 7.58553 55.56517 22.75659z m369.271041 0c15.217597 15.217597 22.803127 33.73932 22.803127 55.56517v133.188874c0 21.872387-7.58553 40.347573-22.803127 55.56517-15.17106 15.17106-33.692783 22.803127-55.472096 22.803127H445.28457c-21.779313 0-40.301036-7.632067-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.56517V78.507908c0-21.872387 7.632067-40.347573 22.803127-55.56517C404.983534 7.771678 423.505257 0.186148 445.28457 0.186148h135.608798c21.779313 0 40.301036 7.58553 55.472096 22.75659z m364.66388 0c15.217597 15.217597 22.803127 33.73932 22.803126 55.56517v133.188874c0 21.872387-7.58553 40.347573-22.803126 55.56517-15.17106 15.17106-33.692783 22.803127-55.518633 22.803127h-135.562262c-21.82585 0-40.301036-7.632067-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.56517V78.507908c0-21.872387 7.632067-40.347573 22.803127-55.56517 15.217597-15.17106 33.692783-22.75659 55.518633-22.75659h135.562262c21.872387 0 40.347573 7.58553 55.518633 22.75659zM267.14096 389.933467c15.17106 15.217597 22.75659 33.692783 22.756589 55.518633v133.235411c0 21.82585-7.58553 40.347573-22.803126 55.518633-15.17106 15.217597-33.646246 22.803127-55.518633 22.803127H78.340378c-21.872387 0-40.347573-7.58553-55.518633-22.803127A75.576077 75.576077 0 0 1 0.018618 578.687511V445.4521c0-21.82585 7.58553-40.301036 22.803127-55.518633a75.669151 75.669151 0 0 1 55.518633-22.75659h133.188875c21.872387 0 40.347573 7.58553 55.56517 22.803127z m369.271041 0c15.217597 15.217597 22.803127 33.692783 22.803127 55.518633v133.235411c0 21.82585-7.58553 40.347573-22.803127 55.518633-15.17106 15.217597-33.692783 22.803127-55.472096 22.803127H445.28457c-21.779313 0-40.301036-7.58553-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.518633V445.4521c0-21.82585 7.632067-40.301036 22.803127-55.518633a75.669151 75.669151 0 0 1 55.518633-22.75659h135.608798c21.779313 0 40.301036 7.58553 55.472096 22.803127z m364.663879 0c15.217597 15.217597 22.803127 33.692783 22.803127 55.518633v133.235411c0 21.82585-7.58553 40.347573-22.803127 55.518633-15.17106 15.217597-33.692783 22.803127-55.518632 22.803127h-135.562262c-21.82585 0-40.301036-7.632067-55.518633-22.803127a75.576077 75.576077 0 0 1-22.803127-55.518633v-133.235411c0-21.872387 7.632067-40.301036 22.803127-55.518633a75.669151 75.669151 0 0 1 55.518633-22.75659h135.562262c21.872387 0 40.347573 7.58553 55.518633 22.75659z"
                ></path>
              </svg>
            </span>
            <div class="divider"></div>
            <span class="fullscreen-btn" @click="setFullscreen">
              <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M368.896 192H224a32 32 0 0 0-32 32v137.888a32 32 0 0 0 64 0V256h112.896a32 32 0 0 0 0-64zM784.864 192H640a32 32 0 1 0 0 64h112.864v105.888a32 32 0 1 0 64 0V224a32 32 0 0 0-32-32zM368.896 777.92H256V672a32 32 0 1 0-64 0v137.92a32 32 0 0 0 32 32h144.896a32 32 0 1 0 0-64zM784.864 640a32 32 0 0 0-32 32v105.92H640a32 32 0 1 0 0 64h144.864a32 32 0 0 0 32-32V672a32 32 0 0 0-32-32z"
                ></path>
                <path
                  d="M912 48h-800c-35.296 0-64 28.704-64 64v800c0 35.296 28.704 64 64 64h800c35.296 0 64-28.704 64-64v-800c0-35.296-28.704-64-64-64z m-800 864v-800h800l0.064 800H112z"
                ></path>
              </svg>
            </span>
          </div>
        </div>
        <div class="video-frame" :class="'screen-' + screenCount">
          <div
            v-for="n in screenCount"
            :key="n"
            :id="'easyplayer-container-' + n"
            class="player-box"
            @click="handleScreenClick(n - 1)"
          ></div>
        </div>
      </div>
    </div>
    <div class="right-panel">
      <div class="module-section device-status-module">
        <div class="section-title">设备状态</div>
        <div
          style="display: flex; align-items: flex-start; justify-content: space-around; padding: 0"
        >
          <div class="gauge-wrapper">
            <div id="gauge-startup" class="gauge-container"></div>
            <div class="stat-text" style="display: flex; gap: 10px; justify-content: center">
              <span>启动: {{ deviceStats.started }}</span>
              <span>待机: {{ deviceStats.online - deviceStats.started }}</span>
            </div>
          </div>
          <div class="gauge-wrapper">
            <div id="gauge-online" class="gauge-container"></div>
            <div class="stat-text" style="display: flex; gap: 10px; justify-content: center">
              <span>在线: {{ deviceStats.online }}</span>
              <span>离线: {{ deviceStats.total - deviceStats.online }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="module-section alert-capture-module">
        <div class="section-title">预警抓拍</div>
        <div class="alert-list-wrapper">
          <div
            class="alert-item"
            v-for="(item, idx) in alertList"
            :key="idx"
            @click="showAlertDrawer(item)"
          >
            <div class="alert-icon">
              <img :src="item.icon" alt="Alert Icon" />
            </div>
            <div class="alert-info">
              <div class="alert-title">{{ item.title }}</div>
              <div class="alert-time">{{ item.time }}</div>
              <div class="alert-location">{{ item.location }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="drawerVisible" class="alert-drawer-overlay" @click.self="closeAlertDrawer">
      <div class="alert-drawer monitor-alert-drawer">
        <div class="monitor-alert-header">
          <div class="monitor-alert-title">告警详情</div>
        </div>
        <div class="monitor-alert-info-grid">
          <div class="info-block"
            ><span class="info-label">状态：</span
            ><span
              :style="{
                color: drawerData.status === '未处理' ? '#f56c6c' : '#67c23a',
                fontWeight: 600
              }"
              >{{ drawerData.status || '未处理' }}</span
            ></div
          >
          <div class="info-block"
            ><span class="info-label">数据源：</span><span>{{ drawerData.location || '-' }}</span>
          </div>
          <div class="info-block"
            ><span class="info-label">IP：</span><span>{{ drawerData.ip || '-' }}</span></div
          >
          <div class="info-block"
            ><span class="info-label">危险等级：</span
            ><span style="font-weight: 600; color: #e6a23c">{{
              drawerData.level || '-'
            }}</span></div
          >
          <div class="info-block"
            ><span class="info-label">告警类型：</span
            ><span style="font-weight: 600; color: #409eff">{{ drawerData.type || '-' }}</span></div
          >
          <div class="info-block"
            ><span class="info-label">检测时间：</span
            ><span>{{ drawerData.time || '-' }}</span></div
          >
        </div>
        <div class="monitor-alert-img-box">
          <img :src="drawerData.img" alt="抓拍图片" class="monitor-alert-img" />
        </div>
        <div class="monitor-alert-bottom-bar">
          <input class="monitor-alert-input" v-model="drawerRemark" placeholder="处理意见" />
          <div class="monitor-alert-btns">
            <button class="monitor-btn confirm" @click="onAlertActionConfirm(drawerData)"
              >确认</button
            >
            <button class="monitor-btn error" @click="onAlertActionError(drawerData)">误报</button>
            <button class="monitor-btn reset" @click="drawerRemark = ''">重置</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, nextTick, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useOptions } from '../../composables/useOptions'
  import * as echarts from 'echarts'

  defineOptions({ name: 'MonitorIndex' })

  const router = useRouter()
  const { fetchOrgs, orgsTree } = useOptions()

  // 配置项 - 完全复制原版
  const CONFIG = {
    API_BASE_URL: 'http://192.168.1.186:5001',
    TOKEN: '123456',
    UPDATE_INTERVALS: {
      DEVICE_LIST: 30000,
      CPU_MEMORY: 3000,
      STORAGE: 5000
    }
  }

  // 响应式数据
  const currentTime = ref('')
  const screenCount = ref(1)
  const selectedScreenId = ref(0)
  const selectedOrgId = ref<string | null>(null)
  const isPlay = ref(false)
  const videoUrl = ref('ws://127.0.0.1/live/test.live.mp4')
  const drawerVisible = ref(false)
  const drawerRemark = ref('')
  const drawerData = ref<any>({})

  // 播放器相关
  const playerList = ref<any[]>([])
  const config = {
    stretch: true,
    isRtcZLM: true,
    hasAudio: false,
    isMute: true,
    gpuDecoder: true,
    canvasRender: true,
    webGPU: true,
    bufferTime: 0.05,
    isLive: true,
    MSE: true,
    loadTimeOut: 5,
    debug: false
  }

  // 设备统计数据
  const deviceStats = reactive({
    total: 0,
    started: 0,
    online: 0
  })

  // 图表实例
  let cpuChartInstance: any = null
  let startupGaugeChartInstance: any = null
  let onlineGaugeChartInstance: any = null

  // CPU/内存图表数据
  const cpuData = ref<number[]>([])
  const memoryData = ref<number[]>([])
  const timeData = ref<string[]>([])

  // 定时器
  const intervals = reactive({
    deviceList: null as any,
    cpuMemory: null as any,
    storage: null as any,
    time: null as any
  })

  // 告警列表数据 - 完全复制原版
  const alertList = ref([
    {
      icon: '/assets/bus.jpg',
      title: '烟火告警',
      type: '火灾',
      level: '紧急',
      img: '/assets/bus.jpg',
      time: '抓拍时间: 2025-04-07 14:44:19',
      location: '布点名称: 告警设备',
      status: '未处理',
      handler: '',
      handleTime: '',
      desc: '检测到烟火异常，请及时处理。',
      remark: '请第一时间核查现场。'
    },
    {
      icon: '/assets/bus.jpg',
      title: '安全帽告警',
      type: '安全',
      level: '一般',
      img: '/assets/bus.jpg',
      time: '抓拍时间: 2025-04-07 14:39:30',
      location: '布点名称: 告警设备',
      status: '未处理',
      handler: '',
      handleTime: '',
      desc: '未佩戴安全帽，存在安全隐患。',
      remark: ''
    },
    {
      icon: '/assets/bus.jpg',
      title: '烟火告警',
      type: '火灾',
      level: '紧急',
      img: '/assets/bus.jpg',
      time: '抓拍时间: 2025-04-07 14:34:19',
      location: '布点名称: 告警设备',
      status: '未处理',
      handler: '',
      handleTime: '',
      desc: '检测到烟火异常，请及时处理。',
      remark: ''
    },
    {
      icon: '/assets/bus.jpg',
      title: '安全帽告警',
      type: '安全',
      level: '一般',
      img: '/assets/bus.jpg',
      time: '抓拍时间: 2025-04-07 14:29:30',
      location: '布点名称: 告警设备',
      status: '未处理',
      handler: '',
      handleTime: '',
      desc: '未佩戴安全帽，存在安全隐患。',
      remark: ''
    },
    {
      icon: '/assets/bus.jpg',
      title: '烟火告警',
      type: '火灾',
      level: '紧急',
      img: '/assets/bus.jpg',
      time: '抓拍时间: 2025-04-07 14:24:17',
      location: '布点名称: 告警设备',
      status: '未处理',
      handler: '',
      handleTime: '',
      desc: '检测到烟火异常，请及时处理。',
      remark: ''
    },
    {
      icon: '/assets/bus.jpg',
      title: '入侵告警',
      type: '入侵',
      level: '重要',
      img: '/assets/bus.jpg',
      time: '抓拍时间: 2025-04-07 14:20:00',
      location: '布点名称: 告警设备',
      status: '未处理',
      handler: '',
      handleTime: '',
      desc: '检测到异常入侵，请注意安全。',
      remark: '夜间巡查加强。'
    },
    {
      icon: '/assets/bus.jpg',
      title: '入侵告警',
      type: '入侵',
      level: '重要',
      img: '/assets/bus.jpg',
      time: '抓拍时间: 2025-04-07 14:15:00',
      location: '布点名称: 告警设备',
      status: '未处理',
      handler: '',
      handleTime: '',
      desc: '检测到异常入侵，请注意安全。',
      remark: ''
    }
  ])

  // 工具函数 - 完全复制原版
  const formatTime = (date: Date) => {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${weekdays[date.getDay()]} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
  }

  const createGaugeOption = (value: number, color: string) => ({
    series: [
      {
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        min: 0,
        max: 100,
        axisLine: {
          lineStyle: {
            width: 7,
            color: [
              [value / 100, color],
              [1, 'rgba(0, 212, 255, 0.1)']
            ]
          }
        },
        pointer: { show: false },
        progress: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          fontSize: 12,
          offsetCenter: [0, '0%'],
          formatter: '{value}%',
          color: color
        },
        data: [{ value: parseFloat(value.toString()) }]
      }
    ]
  })

  // 方法 - 完全复制原版逻辑
  const goBackToDashboard = () => {
    router.push('/dashboard/console')
  }

  const handleScreenClick = (screenId: number) => {
    selectedScreenId.value = screenId
    console.log('当前选中屏ID:', screenId)
    // 更新选中屏幕的样式
    document.querySelectorAll('.player-box').forEach((box: any, index: number) => {
      if (index === screenId) {
        box.style.border = '2px solid #ff0000'
      } else {
        box.style.border = '1px solid #00d4ff'
      }
    })
  }

  const switchScreen = (count: number) => {
    if (screenCount.value === count) return

    playerList.value.forEach((p) => {
      if (p && p.destroy) {
        try {
          p.destroy()
        } catch (e) {
          console.warn('销毁播放器时出错:', e)
        }
      }
    })
    playerList.value = []
    screenCount.value = count
    selectedScreenId.value = 0

    nextTick(() => {
      setTimeout(() => {
        createPlayers()
        if (isPlay.value && videoUrl.value) {
          setTimeout(() => {
            onPlayer()
          }, 200)
        }
      }, 100)
    })
  }

  const createPlayers = () => {
    playerList.value = []
    nextTick(() => {
      for (let i = 1; i <= screenCount.value; i++) {
        const container = document.getElementById('easyplayer-container-' + i)
        if (container) {
          try {
            container.innerHTML = ''
            const player = createPlayer(container, config)
            playerList.value.push(player)
          } catch (error) {
            console.error(`创建播放器${i}失败:`, error)
            playerList.value.push(null)
          }
        } else {
          playerList.value.push(null)
        }
      }
      handleScreenClick(selectedScreenId.value)
    })
  }

  const createPlayer = (container: HTMLElement, config: any) => {
    try {
      container.innerHTML = ''
      if (typeof (window as any).EasyPlayerPro !== 'undefined') {
        return new (window as any).EasyPlayerPro(container, {
          ...config,
          watermark: {
            text: { content: 'easyplayer-pro' },
            right: 10,
            top: 10
          }
        })
      }
      return null
    } catch (error) {
      console.error('创建播放器失败:', error)
      return null
    }
  }

  const onPlayer = async () => {
    if (!videoUrl.value) {
      console.error('没有可播放的视频URL')
      return
    }

    try {
      const selectedPlayer = playerList.value[selectedScreenId.value]
      const container = document.getElementById(
        'easyplayer-container-' + (selectedScreenId.value + 1)
      )

      if (selectedPlayer?.destroy) {
        await selectedPlayer.destroy()
      }

      if (container) {
        const newPlayer = createPlayer(container, config)
        if (newPlayer) {
          playerList.value[selectedScreenId.value] = newPlayer
          await newPlayer.play(videoUrl.value)
          isPlay.value = true
        }
      }
    } catch (error) {
      console.error('播放失败:', error)
      isPlay.value = false
    }
  }

  const onStop = async () => {
    try {
      const selectedPlayer = playerList.value[selectedScreenId.value]
      if (selectedPlayer?.destroy) {
        await selectedPlayer.destroy()
        isPlay.value = false
        playerList.value[selectedScreenId.value] = null

        const container = document.getElementById(
          'easyplayer-container-' + (selectedScreenId.value + 1)
        )
        if (container) {
          const newPlayer = createPlayer(container, config)
          playerList.value[selectedScreenId.value] = newPlayer
        }
      }
    } catch (error) {
      console.error('停止播放失败:', error)
    }
  }

  const setFullscreen = () => {
    const videoSection = document.querySelector('.video-section')
    if (videoSection) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        ;(videoSection as any).requestFullscreen()
      }
    }
  }

  const updateTime = () => {
    currentTime.value = formatTime(new Date())
  }

  const generateCpuMemoryData = (shouldUpdateChart = true) => {
    const now = new Date()
    const timeStr =
      String(now.getHours()).padStart(2, '0') +
      ':' +
      String(now.getMinutes()).padStart(2, '0') +
      ':' +
      String(now.getSeconds()).padStart(2, '0')

    timeData.value.push(timeStr)
    cpuData.value.push(parseFloat((Math.random() * 30 + 30).toFixed(1)))
    memoryData.value.push(parseFloat((Math.random() * 40 + 40).toFixed(1)))

    if (timeData.value.length > 10) {
      timeData.value.shift()
      cpuData.value.shift()
      memoryData.value.shift()
    }

    if (shouldUpdateChart && cpuChartInstance) {
      const option = {
        xAxis: {
          data: timeData.value
        },
        series: [
          {
            name: '内存',
            data: memoryData.value
          },
          {
            name: 'CPU',
            data: cpuData.value
          }
        ]
      }
      cpuChartInstance.setOption(option)
    }
  }

  const initCpuChart = () => {
    const cpuChartDom = document.getElementById('cpu-chart')
    if (cpuChartDom) {
      cpuChartInstance = echarts.init(cpuChartDom, null, {
        renderer: 'canvas',
        useDirtyRect: false
      })

      for (let i = 0; i < 10; i++) {
        generateCpuMemoryData(false)
      }

      const cpuOption = {
        color: ['#00ff00', '#ffff00'],
        tooltip: {
          trigger: 'axis',
          confine: true,
          textStyle: {
            color: '#fff',
            fontSize: 10
          },
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          formatter: function (params: any) {
            let tooltipContent = params[0].name + '<br />'
            params.forEach(function (item: any) {
              const colorSpan = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${item.color};"></span>`
              tooltipContent += colorSpan + item.seriesName + ': ' + item.value + '%<br />'
            })
            return tooltipContent
          }
        },
        legend: {
          data: ['内存', 'CPU'],
          textStyle: {
            color: '#fff',
            fontSize: 10
          }
        },
        toolbox: {
          feature: {
            saveAsImage: {
              title: ''
            }
          }
        },
        grid: {
          top: '15%',
          left: '3%',
          right: '10%',
          bottom: '5%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: timeData.value,
          axisLabel: {
            color: '#00d4ff',
            fontSize: 10,
            formatter: function (value: string) {
              return value.substring(3)
            }
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(0, 212, 255, 0.5)'
            }
          },
          axisTick: {
            show: false
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value} %',
            color: '#00d4ff',
            fontSize: 10
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(0, 212, 255, 0.2)'
            }
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(0, 212, 255, 0.5)'
            }
          },
          min: 0,
          max: 100
        },
        series: [
          {
            name: '内存',
            type: 'line',
            smooth: true,
            symbol: 'none',
            lineStyle: { color: '#00ff00' },
            areaStyle: {
              opacity: 0.5,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(0, 255, 0, 0.4)' },
                { offset: 1, color: 'rgba(0, 255, 0, 0)' }
              ])
            },
            data: memoryData.value
          },
          {
            name: 'CPU',
            type: 'line',
            smooth: true,
            symbol: 'none',
            lineStyle: { color: '#ffff00' },
            areaStyle: {
              opacity: 0.5,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(255, 255, 0, 0.4)' },
                { offset: 1, color: 'rgba(255, 255, 0, 0)' }
              ])
            },
            data: cpuData.value
          }
        ]
      }

      cpuChartInstance.setOption(cpuOption)

      setInterval(() => {
        generateCpuMemoryData(true)
      }, 3000)

      window.addEventListener('resize', () => {
        if (cpuChartInstance) {
          cpuChartInstance.resize()
        }
      })
    }
  }

  const initGaugeCharts = () => {
    const startupGaugeDom = document.getElementById('gauge-startup')
    const onlineGaugeDom = document.getElementById('gauge-online')

    if (startupGaugeDom && onlineGaugeDom) {
      startupGaugeChartInstance = echarts.init(startupGaugeDom)
      onlineGaugeChartInstance = echarts.init(onlineGaugeDom)

      startupGaugeChartInstance.setOption(createGaugeOption(0, '#00d4ff'))
      onlineGaugeChartInstance.setOption(createGaugeOption(0, '#00ff00'))

      window.addEventListener('resize', () => {
        if (startupGaugeChartInstance) {
          startupGaugeChartInstance.resize()
        }
        if (onlineGaugeChartInstance) {
          onlineGaugeChartInstance.resize()
        }
      })
    }
  }

  const updateStorageBar = (percent: number) => {
    const bar = document.getElementById('storage-bar-inner')
    const label = document.getElementById('storage-bar-label')
    if (bar && label) {
      bar.style.width = percent + '%'
      label.textContent = percent + '%'
    }
  }

  const showAlertDrawer = (item: any) => {
    drawerData.value = item
    drawerVisible.value = true
  }

  const closeAlertDrawer = () => {
    drawerVisible.value = false
  }

  const onAlertActionConfirm = (item: any) => {
    console.log('确认告警:', item.title || '')
    closeAlertDrawer()
  }

  const onAlertActionError = (item: any) => {
    console.log('误报告警:', item.title || '')
    closeAlertDrawer()
  }

  // 组织树渲染逻辑 - 使用真实数据
  const renderOrgTree = () => {
    const rootUl = document.getElementById('org-tree-root')
    const orgStates: Record<string, any> = {}

    function renderTree(nodes: any[], parentUl: HTMLElement) {
      nodes.forEach((node) => {
        const li = document.createElement('li')
        const nodeDiv = document.createElement('div')
        nodeDiv.className = 'node-content parent'
        if (node.status === '禁用') nodeDiv.classList.add('disabled')
        if (selectedOrgId.value === node.org_id) nodeDiv.classList.add('selected')

        if (node.children && node.children.length) {
          const indicator = document.createElement('span')
          indicator.className = 'indicator'
          indicator.textContent =
            orgStates[node.org_id] && orgStates[node.org_id].expanded ? '▼' : '▶'

          const expandHandler = function (e: Event) {
            e.stopPropagation()
            orgStates[node.org_id] = orgStates[node.org_id] || { expanded: false }
            orgStates[node.org_id].expanded = !orgStates[node.org_id].expanded
            updateTree()
          }
          indicator.onclick = expandHandler
          nodeDiv.appendChild(indicator)

          const nameSpan = document.createElement('span')
          nameSpan.textContent = node.name
          nameSpan.style.cursor = 'pointer'
          nameSpan.onclick = expandHandler
          nodeDiv.appendChild(nameSpan)
        } else {
          const nameSpan = document.createElement('span')
          nameSpan.textContent = node.name
          nodeDiv.appendChild(nameSpan)
        }

        nodeDiv.onclick = function (e: Event) {
          e.stopPropagation()
          if (node.status === '禁用') return
          selectedOrgId.value = node.org_id
          updateTree()
        }
        li.appendChild(nodeDiv)

        if (
          node.children &&
          node.children.length &&
          orgStates[node.org_id] &&
          orgStates[node.org_id].expanded
        ) {
          const childUl = document.createElement('ul')
          renderTree(node.children, childUl)
          li.appendChild(childUl)
        }
        parentUl.appendChild(li)
      })
    }

    function updateTree() {
      if (rootUl) {
        rootUl.innerHTML = ''
        renderTree(orgsTree.value, rootUl)
      }
    }

    // 初始化全部收起
    const initOrgStates = (nodes: any[]) => {
      nodes.forEach((node) => {
        orgStates[node.org_id] = { expanded: false }
        if (node.children && node.children.length) {
          initOrgStates(node.children)
        }
      })
    }

    initOrgStates(orgsTree.value)
    updateTree()
  }

  // 窗口调整处理函数
  const handleResize = () => {
    if (cpuChartInstance) cpuChartInstance.resize()
    if (startupGaugeChartInstance) startupGaugeChartInstance.resize()
    if (onlineGaugeChartInstance) onlineGaugeChartInstance.resize()
  }

  // 生命周期钩子
  onMounted(() => {
    nextTick(async () => {
      // 先获取组织数据
      await fetchOrgs()

      initCpuChart()
      initGaugeCharts()
      createPlayers()
      updateTime()
      renderOrgTree()

      // 启动定时器
      intervals.time = setInterval(updateTime, 1000)
      intervals.cpuMemory = setInterval(
        () => generateCpuMemoryData(true),
        CONFIG.UPDATE_INTERVALS.CPU_MEMORY
      )
      intervals.storage = setInterval(() => {
        const percent = Math.floor(Math.random() * 31) + 40
        updateStorageBar(percent)
      }, CONFIG.UPDATE_INTERVALS.STORAGE)

      // 添加窗口调整事件监听器
      window.addEventListener('resize', handleResize)
    })
  })

  onUnmounted(() => {
    // 清理定时器
    Object.values(intervals).forEach((interval) => {
      if (interval) clearInterval(interval)
    })

    // 清理图表实例
    if (cpuChartInstance) cpuChartInstance.dispose()
    if (startupGaugeChartInstance) startupGaugeChartInstance.dispose()
    if (onlineGaugeChartInstance) onlineGaugeChartInstance.dispose()

    // 清理播放器
    playerList.value.forEach((player) => {
      if (player?.destroy) player.destroy()
    })

    // 清理窗口事件
    window.removeEventListener('resize', handleResize)
  })
</script>

<style lang="scss" scoped>
  /* 完全复制原版monitor.css的样式 */
  * {
    box-sizing: border-box;
    padding: 0;
    margin: 0;
  }

  body {
    position: relative;
    height: 100vh;
    overflow: hidden;
    font-family: 'Microsoft YaHei', Arial, sans-serif;
    font-size: 12px;
    color: #00d4ff;
    background: linear-gradient(135deg, #0a1128 0%, #1e3c72 100%);
  }

  body::before {
    position: fixed;
    top: 0;
    left: 0;
    z-index: -1;
    width: 100%;
    height: 100%;
    pointer-events: none;
    content: '';
    background:
      radial-gradient(circle at 20% 80%, rgb(0 212 255 / 10%) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgb(0 123 255 / 10%) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgb(0 255 127 / 5%) 0%, transparent 50%);
  }

  body::after {
    position: fixed;
    top: 0;
    left: 0;
    z-index: -1;
    width: 100%;
    height: 100%;
    pointer-events: none;
    content: '';
    background:
      linear-gradient(90deg, transparent 98%, rgb(0 212 255 / 10%) 100%),
      linear-gradient(0deg, transparent 98%, rgb(0 212 255 / 10%) 100%);
    background-size: 50px 50px;
    animation: gridMove 20s linear infinite;
  }

  @keyframes gridMove {
    0% {
      transform: translate(0, 0);
    }

    100% {
      transform: translate(50px, 50px);
    }
  }

  .container {
    position: fixed;
    top: 0;
    left: 0;
    display: grid;
    grid-template-rows: 60px 1fr;
    grid-template-columns: 300px 1fr 350px;
    gap: 10px;
    width: 100vw;
    height: 100vh;
    padding: 10px;
    overflow: hidden;
    font-family: 'Microsoft YaHei', Arial, sans-serif;
    font-size: 12px;
    color: #00d4ff;
    background: linear-gradient(135deg, #0a1128 0%, #1e3c72 100%);
  }

  .header {
    position: relative;
    display: flex;
    grid-column: 1 / -1;
    align-items: center;
    justify-content: flex-start;
    padding: 0 30px;
    overflow: hidden;
    background: linear-gradient(90deg, rgb(0 212 255 / 10%) 0%, rgb(0 123 255 / 20%) 100%);
    border: 1px solid #00d4ff;
    border-radius: 8px;
  }

  .header::before {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    content: '';
    background: linear-gradient(90deg, transparent, rgb(0 212 255 / 30%), transparent);
    animation: shimmer 3s infinite;
  }

  @keyframes shimmer {
    0% {
      left: -100%;
    }

    100% {
      left: 100%;
    }
  }

  .header h1 {
    position: absolute;
    left: 50%;
    flex-grow: 1;
    margin-left: 0;
    font-size: 28px;
    font-weight: bold;
    text-align: center;
    text-shadow: 0 0 20px #00d4ff;
    letter-spacing: 4px;
    transform: translateX(-50%);
  }

  .back-button {
    position: relative;
    padding: 8px 20px;
    overflow: hidden;
    font-size: 14px;
    font-weight: bold;
    color: #000;
    cursor: pointer;
    background: linear-gradient(45deg, #00d4ff, #09c);
    border: none;
    border-radius: 6px;
    box-shadow: 0 0 15px rgb(0 212 255 / 50%);
    transition: all 0.3s ease;
  }

  .back-button::before {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    content: '';
    background: linear-gradient(90deg, transparent, rgb(255 255 255 / 40%), transparent);
    transition: left 0.5s;
  }

  .back-button:hover::before {
    left: 100%;
  }

  .back-button:hover {
    box-shadow: 0 5px 25px rgb(0 212 255 / 80%);
    transform: translateY(-2px);
  }

  .left-panel,
  .right-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 15px;
    overflow: hidden;
    background: rgb(0 50 100 / 30%);
    backdrop-filter: blur(10px);
    border: 1px solid #00d4ff;
    border-radius: 8px;
  }

  .module-section {
    position: relative;
    padding-bottom: 20px;
    margin-bottom: 20px;
  }

  .module-section:last-child {
    padding-bottom: 0;
    margin-bottom: 0;
    border-bottom: none;
  }

  .module-section.device-list-module {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-height: 0;
  }

  .module-section.cpu-module-section,
  .module-section.storage-module-section {
    flex-shrink: 0;
  }

  .main-content {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 15px;
    overflow: hidden;
    background: rgb(0 50 100 / 30%);
    backdrop-filter: blur(10px);
    border: 1px solid #00d4ff;
    border-radius: 8px;
  }

  .video-section {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .section-title {
    position: relative;
    padding-bottom: 8px;
    margin-bottom: 15px;
    font-size: 16px;
    font-weight: bold;
    color: #00d4ff;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .section-title::after {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 50px;
    height: 2px;
    content: '';
    background: linear-gradient(90deg, #00d4ff, #09c);
    animation: blink 2s infinite;
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 0.5;
    }

    50% {
      opacity: 1;
    }
  }

  .video-title-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
  }

  .time-display {
    padding: 5px 15px;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    color: #00ff7f;
    letter-spacing: 1px;
    background: rgb(0 0 0 / 50%);
    border: 1px solid #00d4ff;
    border-radius: 5px;
    box-shadow: inset 0 0 10px rgb(0 212 255 / 30%);
  }

  .tree-view-wrapper {
    flex-grow: 1;
    padding: 10px;
    overflow-y: auto;
    background: rgb(0 0 0 / 20%);
    border: 1px solid rgb(0 212 255 / 30%);
    border-radius: 5px;
  }

  .tree-view ul {
    padding-left: 20px;
    margin: 0;
    list-style: none;
  }

  .tree-view ul:first-child {
    padding-left: 0;
  }

  .tree-view li {
    position: relative;
    margin: 5px 0;
  }

  .tree-view li::before {
    position: absolute;
    top: 15px;
    left: -15px;
    width: 1px;
    height: calc(100% - 15px);
    content: '';
    background: rgb(0 212 255 / 30%);
  }

  .tree-view li:last-child::before {
    height: 15px;
  }

  .tree-view li::after {
    position: absolute;
    top: 15px;
    left: -15px;
    width: 10px;
    height: 1px;
    content: '';
    background: rgb(0 212 255 / 30%);
  }

  .tree-view .node-content {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    background: rgb(0 0 0 / 10%);
    border: 1px solid transparent;
    border-radius: 4px;
    transition: all 0.3s ease;
  }

  .tree-view .node-content:hover {
    background: rgb(0 212 255 / 10%);
    border-color: rgb(0 212 255 / 30%);
    box-shadow: 0 2px 8px rgb(0 212 255 / 20%);
  }

  .tree-view .node-content .indicator {
    font-size: 12px;
    color: #00d4ff;
    cursor: pointer;
    user-select: none;
  }

  .tree-view .node-content.disabled {
    color: #666;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .tree-view .node-content.selected {
    color: #00d4ff;
    background: rgb(0 212 255 / 20%);
    border-color: #00d4ff;
    box-shadow: 0 0 10px rgb(0 212 255 / 30%);
  }

  .cpu-chart-container {
    height: 120px;
    background: rgb(0 0 0 / 30%);
    border: 1px solid rgb(0 212 255 / 30%);
    border-radius: 5px;
  }

  .gauge-wrapper {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }

  .gauge-container {
    width: 120px;
    height: 80px;
  }

  .stat-text {
    font-size: 11px;
    color: #00d4ff;
    text-align: center;
  }

  .storage-bar-outer {
    position: relative;
    width: 100%;
    height: 20px;
    overflow: hidden;
    background: rgb(0 0 0 / 50%);
    border: 1px solid rgb(0 212 255 / 30%);
    border-radius: 10px;
  }

  .storage-bar-inner {
    position: relative;
    height: 100%;
    background: linear-gradient(90deg, #0f0, #ff0, #f60);
    border-radius: 10px;
    transition: width 0.3s ease;
  }

  .storage-bar-inner::after {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: '';
    background: linear-gradient(90deg, transparent, rgb(255 255 255 / 30%), transparent);
    animation: chartMove 2s ease-in-out infinite;
  }

  @keyframes chartMove {
    0% {
      transform: translateX(-100%);
    }

    100% {
      transform: translateX(100%);
    }
  }

  .storage-bar-label {
    position: absolute;
    top: 50%;
    left: 50%;
    font-size: 12px;
    font-weight: bold;
    color: #000;
    text-shadow: 0 0 3px rgb(255 255 255 / 80%);
    transform: translate(-50%, -50%);
  }

  .alert-list-wrapper {
    max-height: 300px;
    overflow-y: auto;
  }

  .alert-item {
    position: relative;
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px;
    margin-bottom: 8px;
    cursor: pointer;
    background: rgb(0 0 0 / 30%);
    border: 1px solid rgb(255 99 99 / 50%);
    border-radius: 5px;
    transition: all 0.3s ease;
  }

  .alert-item:hover {
    background: rgb(255 99 99 / 10%);
    border-color: #ff6363;
    box-shadow: 0 4px 12px rgb(255 99 99 / 30%);
  }

  .alert-item::before {
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    content: '';
    background: #ff6363;
    border-radius: 0 5px 5px 0;
    animation: alertBlink 2s infinite;
  }

  @keyframes alertBlink {
    0%,
    100% {
      opacity: 0.5;
    }

    50% {
      opacity: 1;
    }
  }

  .alert-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    overflow: hidden;
    border: 1px solid rgb(255 99 99 / 50%);
    border-radius: 5px;
  }

  .alert-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .alert-info {
    flex: 1;
  }

  .alert-title {
    margin-bottom: 3px;
    font-size: 14px;
    font-weight: bold;
    color: #ff6363;
  }

  .alert-time {
    margin-bottom: 2px;
    font-size: 11px;
    color: #999;
  }

  .alert-location {
    font-size: 11px;
    color: #999;
  }

  .video-frame {
    display: grid;
    flex: 1;
    gap: 5px;
    padding: 5px;
    background: rgb(0 0 0 / 50%);
    border: 1px solid rgb(0 212 255 / 30%);
    border-radius: 5px;
  }

  .video-frame.screen-1 {
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
  }

  .video-frame.screen-4 {
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr 1fr;
  }

  .video-frame.screen-9 {
    grid-template-rows: 1fr 1fr 1fr;
    grid-template-columns: 1fr 1fr 1fr;
  }

  .player-box {
    position: relative;
    cursor: pointer;
    background: #000;
    border: 1px solid #00d4ff;
    border-radius: 3px;
    transition: all 0.3s ease;
  }

  .player-box:hover {
    border-color: #0f0;
    box-shadow: 0 0 10px rgb(0 255 0 / 30%);
  }

  .screen-switch {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .control-icon,
  .screen-btn,
  .fullscreen-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    cursor: pointer;
    background: rgb(0 212 255 / 20%);
    border: 1px solid #00d4ff;
    border-radius: 4px;
    transition: all 0.3s ease;
  }

  .control-icon svg,
  .screen-btn svg,
  .fullscreen-btn svg {
    width: 18px;
    height: 18px;
    fill: #00d4ff;
  }

  .control-icon:hover,
  .screen-btn:hover,
  .fullscreen-btn:hover {
    background: rgb(0 212 255 / 40%);
    box-shadow: 0 0 10px rgb(0 212 255 / 30%);
  }

  .screen-btn.active {
    background: rgb(0 212 255 / 60%);
    border-color: #0f0;
  }

  .screen-btn.active svg {
    fill: #0f0;
  }

  .divider {
    width: 1px;
    height: 20px;
    margin: 0 5px;
    background: rgb(0 212 255 / 50%);
  }

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: rgb(0 0 0 / 30%);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, #00d4ff, #09c);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(45deg, #09c, #007399);
  }

  /* 告警抽屉样式 */
  .alert-drawer-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(0 0 0 / 70%);
  }

  .monitor-alert-drawer {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 800px;
    max-width: 96vw;
    padding: 0 0 24px;
    color: #fff;
    background: #202b3a;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgb(0 0 0 / 40%);
    animation: fadeIn 0.2s;
  }

  .monitor-alert-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 18px 0 8px;
    border-bottom: 1px solid #2c3e50;
  }

  .monitor-alert-title {
    font-size: 20px;
    font-weight: bold;
    color: #1ec6ff;
    letter-spacing: 2px;
  }

  .monitor-alert-info-grid {
    display: grid;
    grid-template-rows: repeat(3, auto);
    grid-template-columns: repeat(2, 1fr);
    gap: 10px 32px;
    padding: 18px 36px 8px;
    font-size: 15px;
  }

  .monitor-alert-info-grid .info-block {
    display: flex;
    gap: 6px;
    align-items: center;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .monitor-alert-info-grid .info-label {
    font-weight: 500;
    color: #8fa3b7;
  }

  .monitor-alert-img-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0 36px;
    margin: 0 0 18px;
  }

  .monitor-alert-img {
    display: block;
    width: 100%;
    max-width: 500px;
    object-fit: contain;
    background: #111a2a;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgb(0 0 0 / 40%);
  }

  .monitor-alert-bottom-bar {
    display: flex;
    gap: 18px;
    align-items: center;
    padding: 0 36px;
    margin-top: 8px;
  }

  .monitor-alert-input {
    flex: 1;
    height: 36px;
    padding: 0 12px;
    margin-right: 12px;
    font-size: 15px;
    color: #fff;
    background: #263445;
    border: none;
    border-radius: 6px;
    outline: none;
  }

  .monitor-alert-btns {
    display: flex;
    gap: 12px;
  }

  .monitor-btn {
    min-width: 64px;
    height: 36px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    border-radius: 6px;
    transition:
      background 0.2s,
      color 0.2s;
  }

  .monitor-btn.confirm {
    color: #fff;
    background: #1ec6ff;
  }

  .monitor-btn.confirm:hover {
    background: #0ea6e9;
  }

  .monitor-btn.error {
    color: #fff;
    background: #f56c6c;
  }

  .monitor-btn.error:hover {
    background: #d93030;
  }

  .monitor-btn.reset {
    color: #fff;
    background: #374151;
  }

  .monitor-btn.reset:hover {
    background: #222c37;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.98);
    }

    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (width <= 900px) {
    .monitor-alert-drawer {
      width: 98vw;
      padding: 0 0 18px;
    }

    .monitor-alert-info-grid,
    .monitor-alert-img-box,
    .monitor-alert-bottom-bar {
      padding-right: 10px;
      padding-left: 10px;
    }

    .monitor-alert-img {
      max-width: 98vw;
    }
  }

  @media (width <= 600px) {
    .monitor-alert-info-grid {
      grid-template-columns: 1fr;
      gap: 8px 0;
    }

    .monitor-alert-img {
      max-width: 100vw;
    }

    .monitor-alert-bottom-bar {
      flex-direction: column;
      gap: 10px;
      align-items: stretch;
    }

    .monitor-alert-input {
      margin-right: 0;
    }
  }
</style>
