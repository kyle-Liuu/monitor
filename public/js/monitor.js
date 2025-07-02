// 配置项
const CONFIG = {
  API_BASE_URL: 'http://192.168.1.161:5001',
  TOKEN: '123456',
  UPDATE_INTERVALS: {
    DEVICE_LIST: 30000,
    CPU_MEMORY: 3000,
    STORAGE: 5000
  }
}

// 工具函数
const utils = {
  formatTime(date) {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${weekdays[date.getDay()]} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
  },

  sanitizeInput(input) {
    return input.replace(/[&<>"']/g, (match) => {
      const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }
      return entities[match]
    })
  }
}

// 防抖函数
const debounce = (fn, delay) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 错误处理
const handleError = (error, context) => {
  console.error(`[${context}] 错误:`, error)
}

// 带超时的fetch
const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), timeout))
  ])
}

// 重试机制
const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn()
  } catch (error) {
    if (retries === 0) throw error
    await new Promise((resolve) => setTimeout(resolve, delay))
    return retry(fn, retries - 1, delay)
  }
}

// 缓存机制
const cache = {
  data: new Map(),
  set(key, value, ttl = 60000) {
    this.data.set(key, {
      value,
      expiry: Date.now() + ttl
    })
  },
  get(key) {
    const item = this.data.get(key)
    if (!item) return null
    if (Date.now() > item.expiry) {
      this.data.delete(key)
      return null
    }
    return item.value
  }
}

// ECharts for Startup Gauge (Moved outside Vue instance)
const createGaugeOption = (value, color) => ({
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
      data: [{ value: parseFloat(value) }]
    }
  ]
})

// Add mouse move particle effect (existing code)
document.addEventListener('mousemove', function (e) {
  createParticle(e.clientX, e.clientY)
})

function createParticle(x, y) {
  const particle = document.createElement('div')
  particle.style.position = 'fixed'
  particle.style.left = x + 'px'
  particle.style.top = y + 'px'
  particle.style.width = '2px'
  particle.style.height = '2px'
  particle.style.background = '#00d4ff'
  particle.style.borderRadius = '50%'
  particle.style.pointerEvents = 'none'
  particle.style.zIndex = '1000'
  particle.style.opacity = '0.8'
  document.body.appendChild(particle)

  const animation = particle.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 0.8 },
      {
        transform: `translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px) scale(0)`,
        opacity: 0
      }
    ],
    {
      duration: 1000,
      easing: 'ease-out'
    }
  )

  animation.onfinish = () => {
    document.body.removeChild(particle)
  }
}

const app = Vue.createApp({
  data() {
    return {
      loading: {
        deviceList: false,
        player: false,
        alert: false
      },
      videoUrl: 'ws://192.168.1.74:9002/live/test.live.mp4',
      isPlay: false,
      config: {
        hasAudio: true,
        MSE: false,
        WCS: false,
        bufferTime: 0.2,
        stretch: false
      },
      screenCount: 1,
      playerList: [],
      currentTime: '',
      selectedScreenId: 0,
      selectedDeviceId: null,
      deviceList: [],
      deviceStats: {
        total: 0,
        started: 0,
        online: 0
      },
      groupStates: {},
      cpuChartInstance: null,
      startupGaugeChartInstance: null,
      onlineGaugeChartInstance: null,
      cpuData: [],
      memoryData: [],
      timeData: [],
      alertList: [
        {
          icon: './assets/bus.jpg',
          title: '烟火告警',
          type: '火灾',
          level: '紧急',
          img: './assets/bus.jpg',
          time: '抓拍时间: 2025-04-07 14:44:19',
          location: '布点名称: 告警设备',
          status: '未处理',
          handler: '',
          handleTime: '',
          desc: '检测到烟火异常，请及时处理。',
          remark: '请第一时间核查现场。'
        },
        {
          icon: './assets/bus.jpg',
          title: '安全帽告警',
          type: '安全',
          level: '一般',
          img: './assets/bus.jpg',
          time: '抓拍时间: 2025-04-07 14:39:30',
          location: '布点名称: 告警设备',
          status: '未处理',
          handler: '',
          handleTime: '',
          desc: '未佩戴安全帽，存在安全隐患。',
          remark: ''
        },
        {
          icon: './assets/bus.jpg',
          title: '烟火告警',
          type: '火灾',
          level: '紧急',
          img: './assets/bus.jpg',
          time: '抓拍时间: 2025-04-07 14:34:19',
          location: '布点名称: 告警设备',
          status: '未处理',
          handler: '',
          handleTime: '',
          desc: '检测到烟火异常，请及时处理。',
          remark: ''
        },
        {
          icon: './assets/bus.jpg',
          title: '安全帽告警',
          type: '安全',
          level: '一般',
          img: './assets/bus.jpg',
          time: '抓拍时间: 2025-04-07 14:29:30',
          location: '布点名称: 告警设备',
          status: '未处理',
          handler: '',
          handleTime: '',
          desc: '未佩戴安全帽，存在安全隐患。',
          remark: ''
        },
        {
          icon: './assets/bus.jpg',
          title: '烟火告警',
          type: '火灾',
          level: '紧急',
          img: './assets/bus.jpg',
          time: '抓拍时间: 2025-04-07 14:24:17',
          location: '布点名称: 告警设备',
          status: '未处理',
          handler: '',
          handleTime: '',
          desc: '检测到烟火异常，请及时处理。',
          remark: ''
        },
        {
          icon: './assets/bus.jpg',
          title: '入侵告警',
          type: '入侵',
          level: '重要',
          img: './assets/bus.jpg',
          time: '抓拍时间: 2025-04-07 14:20:00',
          location: '布点名称: 告警设备',
          status: '未处理',
          handler: '',
          handleTime: '',
          desc: '检测到异常入侵，请注意安全。',
          remark: '夜间巡查加强。'
        },
        {
          icon: './assets/bus.jpg',
          title: '入侵告警',
          type: '入侵',
          level: '重要',
          img: './assets/bus.jpg',
          time: '抓拍时间: 2025-04-07 14:15:00',
          location: '布点名称: 告警设备',
          status: '未处理',
          handler: '',
          handleTime: '',
          desc: '检测到异常入侵，请注意安全。',
          remark: ''
        }
      ],
      drawerVisible: false,
      drawerData: {},
      drawerRemark: '',
      intervals: {
        deviceList: null,
        cpuMemory: null,
        storage: null,
        time: null
      }
    }
  },
  computed: {
    deviceGroups() {
      const groups = {}
      const UNGROUPED_ID = 'ungrouped'
      this.deviceList.forEach((device) => {
        const groupId = device.groupid === 0 ? UNGROUPED_ID : device.groupid
        const groupName = device.groupid === 0 ? '未分组' : device.groupname
        if (!groups[groupId]) {
          const expandedState = this.groupStates[groupId]
            ? this.groupStates[groupId].expanded
            : true
          groups[groupId] = {
            id: groupId,
            name: groupName,
            devices: [],
            expanded: expandedState
          }
        }
        groups[groupId].devices.push(device)
      })
      const sortedGroups = Object.values(groups).sort((a, b) => {
        if (a.id === UNGROUPED_ID) return 1
        if (b.id === UNGROUPED_ID) return -1
        return a.id - b.id
      })
      return sortedGroups
    }
  },
  methods: {
    initializeGroupStates() {
      const initialStates = {}
      const uniqueGroupIds = new Set()
      this.deviceList.forEach((device) => {
        const groupId = device.groupid === 0 ? 'ungrouped' : device.groupid
        uniqueGroupIds.add(groupId)
      })
      uniqueGroupIds.forEach((id) => {
        // 默认设置为折叠状态
        initialStates[id] = { expanded: false }
      })
      this.groupStates = initialStates
    },
    toggleGroup(groupId) {
      if (!this.groupStates[groupId]) {
        this.groupStates[groupId] = { expanded: true }
      }
      this.groupStates[groupId].expanded = !this.groupStates[groupId].expanded
      const groupName = this.deviceGroups.find((g) => g.id === groupId)?.name || '未知分组'
      console.log(`分组 "${groupName}" ${this.groupStates[groupId].expanded ? '展开' : '折叠'}`)
    },
    async fetchDeviceList() {
      this.loading.deviceList = true
      // try {
      //   const cachedData = cache.get('deviceList')
      //   if (cachedData) {
      //     this.deviceList = cachedData
      //     this.updateDeviceStats()
      //     return
      //   }

      //   const response = await fetchWithTimeout(
      //     `${CONFIG.API_BASE_URL}/get_devList?token=${CONFIG.TOKEN}`
      //   )

      //   if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      //   const data = await response.json()
      //   this.deviceList = data
      //   console.log(this.deviceList)
      //   cache.set('deviceList', data)
      //   this.updateDeviceStats()

      //   // 在获取到设备列表后,重新初始化分组状态
      //   const newGroupStates = {}
      //   const uniqueGroupIds = new Set()
      //   this.deviceList.forEach((device) => {
      //     const groupId = device.groupid === 0 ? 'ungrouped' : device.groupid
      //     uniqueGroupIds.add(groupId)
      //   })

      //   uniqueGroupIds.forEach((id) => {
      //     // 保持之前已有的展开状态,如果没有则默认为折叠
      //     const currentExpanded = this.groupStates[id] ? this.groupStates[id].expanded : false
      //     this.$set(newGroupStates, id, { expanded: currentExpanded })
      //   })
      //   this.groupStates = newGroupStates
      // } catch (error) {
      //   handleError(error, '获取设备列表')
      //   this.showError('获取设备列表失败')
      // } finally {
      //   this.loading.deviceList = false
      // }
    },
    showError(message) {
      console.log(message)
    },
    updateDeviceStats() {
      this.deviceStats.total = this.deviceList.length
      this.deviceStats.started = this.deviceList.filter((device) => device.started).length
      this.deviceStats.online = this.deviceList.filter((device) => device.online).length

      const startupPercentage =
        this.deviceStats.online === 0
          ? 0
          : (this.deviceStats.started / this.deviceStats.online) * 100
      const onlinePercentage =
        this.deviceStats.total === 0 ? 0 : (this.deviceStats.online / this.deviceStats.total) * 100

      if (this.startupGaugeChartInstance && this.onlineGaugeChartInstance) {
        this.startupGaugeChartInstance.setOption(
          createGaugeOption(startupPercentage.toFixed(1), '#00d4ff')
        )
        this.onlineGaugeChartInstance.setOption(
          createGaugeOption(onlinePercentage.toFixed(1), '#00ff00')
        )
      }
    },
    getDeviceStatusClass(device) {
      if (!device.online) return 'status-offline'
      if (!device.started) return 'status-standby'
      return 'status-started'
    },
    handleDeviceClick(device) {
      // 设置选中设备的ID
      this.selectedDeviceId = device.deviceid

      if (device.online && device.wsurl) {
        this.videoUrl = device.wsurl
        this.onPlayer()
      } else {
        console.warn(`设备 "${device.devicename}" 离线或没有视频流，无法播放。`)
        // 如果设备离线或没有视频流，可以停止当前播放器
        this.onStop()
      }
    },
    handleScreenClick(screenId) {
      this.selectedScreenId = screenId
      // alert('当前选中屏ID: ' + screenId); // 调试用，已移除
      console.log('当前选中屏ID:', screenId)
      // 更新选中屏幕的样式
      document.querySelectorAll('.player-box').forEach((box, index) => {
        if (index === screenId) {
          box.style.border = '2px solid #ff0000'
        } else {
          box.style.border = '1px solid #00d4ff'
        }
      })
    },
    switchScreen(count) {
      if (this.screenCount === count) return

      this.playerList.forEach((p) => {
        if (p && p.destroy) {
          try {
            p.destroy()
          } catch (e) {
            console.warn('销毁播放器时出错:', e)
          }
        }
      })
      this.playerList = []
      this.screenCount = count
      this.selectedScreenId = 0

      this.$nextTick(() => {
        setTimeout(() => {
          // Add delay for DOM update
          this.createPlayers()
          if (this.isPlay && this.videoUrl) {
            setTimeout(() => {
              // Add delay before playing
              this.onPlayer()
            }, 200)
          }
        }, 100)
      })
    },
    createPlayers() {
      this.playerList = [] // Clear existing players before creating new ones
      this.$nextTick(() => {
        for (let i = 1; i <= this.screenCount; i++) {
          const container = document.getElementById('easyplayer-container-' + i)
          if (container) {
            // Removed dimension check for debugging, as it's not in gmini-1.0.html
            try {
              container.innerHTML = ''
              const player = new EasyPlayerPro(container, {
                ...this.config,
                watermark: {
                  text: {
                    content: 'easyplayer-pro'
                  },
                  right: 10,
                  top: 10
                }
              })
              this.playerList.push(player)
            } catch (error) {
              console.error(`创建播放器${i}失败:`, error)
              this.playerList.push(null)
            }
          } else {
            this.playerList.push(null)
          }
        }
        this.handleScreenClick(this.selectedScreenId) // Reapply selected screen style
      })
    },
    async onPlayer() {
      if (!this.videoUrl) {
        this.showError('没有可播放的视频URL')
        return
      }

      this.loading.player = true
      try {
        const selectedPlayer = this.playerList[this.selectedScreenId]
        const container = document.getElementById(
          'easyplayer-container-' + (this.selectedScreenId + 1)
        )

        if (selectedPlayer?.destroy) {
          await selectedPlayer.destroy()
        }

        if (container) {
          const newPlayer = this.createPlayer(container, this.config)
          if (newPlayer) {
            this.playerList[this.selectedScreenId] = newPlayer
            await newPlayer.play(this.videoUrl)
            this.isPlay = true
          }
        }
      } catch (error) {
        handleError(error, '播放视频')
        this.showError('播放失败')
        this.isPlay = false
      } finally {
        this.loading.player = false
      }
    },
    onPause() {
      const selectedPlayer = this.playerList[this.selectedScreenId]
      if (selectedPlayer && selectedPlayer.pause) {
        try {
          selectedPlayer.pause()
        } catch (error) {
          console.error('暂停操作失败:', error)
        }
      }
    },
    setFullscreen() {
      const videoSection = document.querySelector('.video-section')
      if (videoSection) {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          videoSection.requestFullscreen()
        }
      }
    },
    async onStop() {
      try {
        const selectedPlayer = this.playerList[this.selectedScreenId]
        if (selectedPlayer?.destroy) {
          await selectedPlayer.destroy()
          this.isPlay = false
          this.playerList[this.selectedScreenId] = null

          const container = document.getElementById(
            'easyplayer-container-' + (this.selectedScreenId + 1)
          )
          if (container) {
            const newPlayer = this.createPlayer(container, this.config)
            this.playerList[this.selectedScreenId] = newPlayer
          }
        }
      } catch (error) {
        handleError(error, '停止播放')
        this.showError('停止播放失败')
      }
    },
    updateTime() {
      this.currentTime = utils.formatTime(new Date())
    },
    generateCpuMemoryData(shouldUpdateChart = true) {
      const now = new Date()
      const timeStr =
        String(now.getHours()).padStart(2, '0') +
        ':' +
        String(now.getMinutes()).padStart(2, '0') +
        ':' +
        String(now.getSeconds()).padStart(2, '0')

      this.timeData.push(timeStr)
      this.cpuData.push(parseFloat((Math.random() * 30 + 30).toFixed(1))) // CPU usage 30-60%
      this.memoryData.push(parseFloat((Math.random() * 40 + 40).toFixed(1))) // Memory usage 40-80%

      // Keep only last 10 data points
      if (this.timeData.length > 10) {
        this.timeData.shift()
        this.cpuData.shift()
        this.memoryData.shift()
      }

      if (shouldUpdateChart && this.cpuChartInstance) {
        const option = {
          xAxis: {
            data: this.timeData
          },
          series: [
            {
              name: '内存',
              data: this.memoryData
            },
            {
              name: 'CPU',
              data: this.cpuData
            }
          ]
        }
        this.cpuChartInstance.setOption(option)
      }
    },
    initCpuChart() {
      const cpuChartDom = document.getElementById('cpu-chart')
      if (cpuChartDom) {
        this.cpuChartInstance = echarts.init(cpuChartDom, null, {
          renderer: 'canvas',
          useDirtyRect: false
        })

        // Populate initial data before setting the option
        for (let i = 0; i < 10; i++) {
          this.generateCpuMemoryData(false) // Pass false to prevent setOption on each iteration
        }

        // Define the full option structure
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
            formatter: function (params) {
              let tooltipContent = params[0].name + '<br />'
              params.forEach(function (item) {
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
            data: this.timeData, // Now populated
            axisLabel: {
              color: '#00d4ff',
              fontSize: 10,
              formatter: function (value) {
                return value.substring(3) // Display only MM:SS
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
              data: this.memoryData // Now populated
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
              data: this.cpuData // Now populated
            }
          ]
        }

        // Set the initial full option once
        this.cpuChartInstance.setOption(cpuOption)

        // Set up periodic updates for data
        setInterval(() => {
          this.generateCpuMemoryData(true) // Pass true to allow setOption
        }, 3000)

        // Listener for window resize
        window.addEventListener('resize', () => {
          if (this.cpuChartInstance) {
            this.cpuChartInstance.resize()
          }
        })
      }
    },
    initGaugeCharts() {
      const startupGaugeDom = document.getElementById('gauge-startup')
      const onlineGaugeDom = document.getElementById('gauge-online')

      if (startupGaugeDom && onlineGaugeDom) {
        this.startupGaugeChartInstance = echarts.init(startupGaugeDom)
        this.onlineGaugeChartInstance = echarts.init(onlineGaugeDom)

        this.startupGaugeChartInstance.setOption(createGaugeOption('0.0', '#00d4ff'))
        this.onlineGaugeChartInstance.setOption(createGaugeOption('0.0', '#00ff00'))

        window.addEventListener('resize', () => {
          if (this.startupGaugeChartInstance) {
            this.startupGaugeChartInstance.resize()
          }
          if (this.onlineGaugeChartInstance) {
            this.onlineGaugeChartInstance.resize()
          }
        })
      }
    },
    updateStorageBar(percent) {
      const bar = document.getElementById('storage-bar-inner')
      const label = document.getElementById('storage-bar-label')
      if (bar && label) {
        bar.style.width = percent + '%'
        label.textContent = percent + '%'
      }
    },
    showAlertDrawer(item) {
      this.drawerData = item
      this.drawerVisible = true
    },
    closeAlertDrawer() {
      this.drawerVisible = false
    },
    onAlertAction(item) {
      console.log('处理告警: ' + (item.title || ''))
    },
    createPlayer(container, config) {
      try {
        container.innerHTML = ''
        return new EasyPlayerPro(container, {
          ...config,
          watermark: {
            text: { content: 'easyplayer-pro' },
            right: 10,
            top: 10
          }
        })
      } catch (error) {
        handleError(error, '创建播放器')
        return null
      }
    }
  },
  created() {
    this.fetchDeviceList()
    this.initializeGroupStates()
  },
  mounted() {
    this.$nextTick(() => {
      this.initCpuChart()
      this.initGaugeCharts()
      this.createPlayers()
      this.updateTime()
      this.intervals.time = setInterval(this.updateTime, 1000)
      this.fetchDeviceList()
      this.intervals.deviceList = setInterval(
        () => this.fetchDeviceList(),
        CONFIG.UPDATE_INTERVALS.DEVICE_LIST
      )
      this.updateStorageBar(45)
      this.intervals.storage = setInterval(() => {
        const percent = Math.floor(Math.random() * 31) + 40
        this.updateStorageBar(percent)
      }, CONFIG.UPDATE_INTERVALS.STORAGE)
    })
  },
  beforeUnmount() {
    Object.values(this.intervals).forEach((interval) => {
      if (interval) clearInterval(interval)
    })
    if (this.cpuChartInstance) this.cpuChartInstance.dispose()
    if (this.startupGaugeChartInstance) this.startupGaugeChartInstance.dispose()
    if (this.onlineGaugeChartInstance) this.onlineGaugeChartInstance.dispose()
    this.playerList.forEach((player) => {
      if (player?.destroy) player.destroy()
    })
  }
})
app.mount('#app')
// 后台按钮
const backBtn = document.getElementById('back')
if (backBtn) {
  backBtn.addEventListener('click', function () {
    // 跳转到Vue主页面
    if (window.parent !== window) {
      window.parent.location.href = '/#/'
    } else {
      window.location.href = '/#/'
    }
  })
}

// 组织树渲染逻辑
;(function () {
  const orgTree = window.ORG_TREE_MOCK || []
  const rootUl = document.getElementById('org-tree-root')
  let selectedOrgId = null
  const orgStates = {}

  function renderTree(nodes, parentUl) {
    nodes.forEach((node) => {
      const li = document.createElement('li')
      const nodeDiv = document.createElement('div')
      nodeDiv.className = 'node-content parent'
      if (node.status === '禁用') nodeDiv.classList.add('disabled')
      if (selectedOrgId === node.id) nodeDiv.classList.add('selected')
      // 展开/收起按钮和名称整体区域
      if (node.children && node.children.length) {
        const indicator = document.createElement('span')
        indicator.className = 'indicator'
        indicator.textContent = orgStates[node.id] && orgStates[node.id].expanded ? '▼' : '▶'
        // 点击指示器或名称都可展开/收起
        const expandHandler = function (e) {
          e.stopPropagation()
          orgStates[node.id] = orgStates[node.id] || { expanded: false }
          orgStates[node.id].expanded = !orgStates[node.id].expanded
          updateTree()
        }
        indicator.onclick = expandHandler
        nodeDiv.appendChild(indicator)
        // 名称span
        const nameSpan = document.createElement('span')
        nameSpan.textContent = node.name
        nameSpan.style.cursor = 'pointer'
        nameSpan.onclick = expandHandler
        nodeDiv.appendChild(nameSpan)
      } else {
        // 无子节点只显示名称
        const nameSpan = document.createElement('span')
        nameSpan.textContent = node.name
        nodeDiv.appendChild(nameSpan)
      }
      // 选中逻辑（禁用节点不可选）
      nodeDiv.onclick = function (e) {
        e.stopPropagation()
        if (node.status === '禁用') return
        selectedOrgId = node.id
        updateTree()
      }
      li.appendChild(nodeDiv)
      // 子节点
      if (
        node.children &&
        node.children.length &&
        orgStates[node.id] &&
        orgStates[node.id].expanded
      ) {
        const childUl = document.createElement('ul')
        renderTree(node.children, childUl)
        li.appendChild(childUl)
      }
      parentUl.appendChild(li)
    })
  }

  function updateTree() {
    rootUl.innerHTML = ''
    renderTree(orgTree, rootUl)
  }

  // 初始化全部收起
  orgTree.forEach((node) => {
    orgStates[node.id] = { expanded: false }
  })
  updateTree()
})()
