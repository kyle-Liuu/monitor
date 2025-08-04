import { ref, onMounted, onUnmounted, computed } from 'vue'
import { realtimeService, type AlarmMessage, type StatusMessage } from '@/api/websocketApi'
import { ElNotification } from 'element-plus'

// 扩展告警消息类型，添加前端需要的属性
interface ExtendedAlarmMessage extends AlarmMessage {
  read?: boolean
  id?: number
}

/**
 * WebSocket状态管理 Composable
 */
export function useWebSocket() {
  // 连接状态
  const isConnected = ref(false)
  const connectionStatus = ref({
    alarms: false,
    status: false
  })

  // 最新数据
  const latestAlarm = ref<ExtendedAlarmMessage | null>(null)
  const latestStatus = ref<StatusMessage | null>(null)
  const systemStatus = ref({
    service_status: 'stopped' as 'running' | 'stopped' | 'error',
    active_tasks: 0,
    cpu_usage: 0,
    memory_usage: 0
  })

  // 告警历史（保留最近20条）
  const alarmHistory = ref<ExtendedAlarmMessage[]>([])
  const maxAlarmHistory = 20

  // 错误信息
  const lastError = ref<string | null>(null)

  // 计算属性
  const unreadAlarmCount = computed(() => {
    return alarmHistory.value.filter(alarm => alarm.read !== true).length
  })

  const isSystemOnline = computed(() => {
    return systemStatus.value.service_status === 'running'
  })

  // 告警消息处理器
  const handleAlarmMessage = (alarm: AlarmMessage) => {
    console.log('收到告警消息:', alarm)
    
    // 转换为扩展类型
    const extendedAlarm: ExtendedAlarmMessage = { ...alarm, read: false, id: Date.now() }
    latestAlarm.value = extendedAlarm

    // 添加到历史记录
    alarmHistory.value.unshift(extendedAlarm)
    
    // 保持历史记录数量限制
    if (alarmHistory.value.length > maxAlarmHistory) {
      alarmHistory.value = alarmHistory.value.slice(0, maxAlarmHistory)
    }

    // 显示通知
    if (alarm.data.level === 'high' || alarm.data.level === 'critical') {
      ElNotification({
        title: '紧急告警',
        message: `${alarm.data.task_name}: ${alarm.data.message}`,
        type: 'error',
        duration: 5000,
        position: 'top-right'
      })
    } else {
      ElNotification({
        title: '告警通知',
        message: `${alarm.data.task_name}: ${alarm.data.message}`,
        type: 'warning',
        duration: 3000,
        position: 'top-right'
      })
    }
  }

  // 状态消息处理器
  const handleStatusMessage = (status: StatusMessage) => {
    console.log('收到状态消息:', status)
    latestStatus.value = status

    // 更新系统状态
    if (status.type === 'system_status' && status.data.service_status) {
      systemStatus.value.service_status = status.data.service_status
    }

    if (status.data.performance) {
      systemStatus.value.cpu_usage = status.data.performance.cpu_usage
      systemStatus.value.memory_usage = status.data.performance.memory_usage
    }

    if (status.data.tasks) {
      systemStatus.value.active_tasks = status.data.tasks.filter(task => task.status === 'running').length
    }
  }

  // 连接WebSocket
  const connect = async () => {
    try {
      // 连接告警WebSocket
      await realtimeService.subscribeAlarms(handleAlarmMessage)
      
      // 连接状态WebSocket
      await realtimeService.subscribeStatus(handleStatusMessage)

      // 更新连接状态
      updateConnectionStatus()
      lastError.value = null

      console.log('WebSocket连接成功')
    } catch (error) {
      console.error('WebSocket连接失败:', error)
      lastError.value = error instanceof Error ? error.message : '连接失败'
      
      ElNotification({
        title: 'WebSocket连接失败',
        message: '无法建立实时连接，请检查网络状态',
        type: 'error',
        duration: 3000
      })
    }
  }

  // 断开WebSocket
  const disconnect = () => {
    try {
      realtimeService.disconnect()
      updateConnectionStatus()
      console.log('WebSocket连接已断开')
    } catch (error) {
      console.error('WebSocket断开失败:', error)
    }
  }

  // 更新连接状态
  const updateConnectionStatus = () => {
    const status = realtimeService.getConnectionStatus()
    connectionStatus.value = status
    isConnected.value = status.alarms || status.status
  }

  // 标记告警为已读
  const markAlarmAsRead = (alarmId: string | number) => {
    const alarm = alarmHistory.value.find(a => a.id === alarmId)
    if (alarm) {
      alarm.read = true
    }
  }

  // 标记所有告警为已读
  const markAllAlarmsAsRead = () => {
    alarmHistory.value.forEach(alarm => {
      alarm.read = true
    })
  }

  // 清空告警历史
  const clearAlarmHistory = () => {
    alarmHistory.value = []
  }

  // 重新连接
  const reconnect = async () => {
    disconnect()
    await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒
    await connect()
  }

  // 检查连接状态
  const checkConnection = () => {
    updateConnectionStatus()
    return connectionStatus.value
  }

  // 发送心跳
  const sendHeartbeat = () => {
    // 这里可以通过WebSocket发送心跳消息
    // 实际实现取决于后端心跳机制
    console.log('发送心跳')
  }

  // 生命周期管理
  onMounted(() => {
    connect()
    
    // 设置定期检查连接状态
    const interval = setInterval(() => {
      updateConnectionStatus()
    }, 5000) // 每5秒检查一次

    onUnmounted(() => {
      clearInterval(interval)
      disconnect()
    })
  })

  return {
    // 状态
    isConnected: computed(() => isConnected.value),
    connectionStatus: computed(() => connectionStatus.value),
    latestAlarm: computed(() => latestAlarm.value),
    latestStatus: computed(() => latestStatus.value),
    systemStatus: computed(() => systemStatus.value),
    alarmHistory: computed(() => alarmHistory.value),
    unreadAlarmCount,
    isSystemOnline,
    lastError: computed(() => lastError.value),

    // 方法
    connect,
    disconnect,
    reconnect,
    checkConnection,
    sendHeartbeat,
    markAlarmAsRead,
    markAllAlarmsAsRead,
    clearAlarmHistory,
    updateConnectionStatus
  }
}

/**
 * 告警管理 Composable
 */
export function useAlarmManager() {
  const { alarmHistory, markAlarmAsRead, markAllAlarmsAsRead, clearAlarmHistory, unreadAlarmCount } = useWebSocket()

  // 按级别过滤告警
  const getAlarmsByLevel = (level: string) => {
    return alarmHistory.value.filter(alarm => alarm.data.level === level)
  }

  // 按时间范围过滤告警
  const getAlarmsInTimeRange = (hours: number) => {
    const now = new Date()
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000)
    
    return alarmHistory.value.filter(alarm => {
      const alarmTime = new Date(alarm.data.timestamp)
      return alarmTime >= startTime
    })
  }

  // 获取告警统计
  const getAlarmStats = () => {
    const total = alarmHistory.value.length
    const unread = unreadAlarmCount.value
    const levels = {
      low: getAlarmsByLevel('low').length,
      medium: getAlarmsByLevel('medium').length,
      high: getAlarmsByLevel('high').length,
      critical: getAlarmsByLevel('critical').length
    }

    return {
      total,
      unread,
      levels
    }
  }

  return {
    alarmHistory,
    unreadAlarmCount,
    getAlarmsByLevel,
    getAlarmsInTimeRange,
    getAlarmStats,
    markAlarmAsRead,
    markAllAlarmsAsRead,
    clearAlarmHistory
  }
}

/**
 * 系统状态监控 Composable
 */
export function useSystemMonitor() {
  const { systemStatus, latestStatus, isSystemOnline } = useWebSocket()

  // 性能数据历史（用于图表）
  const performanceHistory = ref({
    cpu: [] as Array<{ time: string; value: number }>,
    memory: [] as Array<{ time: string; value: number }>,
    tasks: [] as Array<{ time: string; value: number }>
  })

  // 更新性能历史数据
  const updatePerformanceHistory = () => {
    const now = new Date().toLocaleTimeString()
    
    performanceHistory.value.cpu.push({
      time: now,
      value: systemStatus.value.cpu_usage
    })
    
    performanceHistory.value.memory.push({
      time: now,
      value: systemStatus.value.memory_usage
    })
    
    performanceHistory.value.tasks.push({
      time: now,
      value: systemStatus.value.active_tasks
    })

    // 保持最近50个数据点
    const maxPoints = 50
    Object.keys(performanceHistory.value).forEach(key => {
      const data = performanceHistory.value[key as keyof typeof performanceHistory.value]
      if (data.length > maxPoints) {
        data.splice(0, data.length - maxPoints)
      }
    })
  }

  // 定期更新性能历史
  onMounted(() => {
    const interval = setInterval(updatePerformanceHistory, 10000) // 每10秒更新一次
    
    onUnmounted(() => {
      clearInterval(interval)
    })
  })

  return {
    systemStatus,
    latestStatus,
    isSystemOnline,
    performanceHistory: computed(() => performanceHistory.value),
    updatePerformanceHistory
  }
} 