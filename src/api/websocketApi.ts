/**
 * WebSocket管理服务
 * 负责与后端建立WebSocket连接，实现实时通信
 * 支持告警推送(/ws/alarms)和状态推送(/ws/status)
 */
export class WebSocketService {
  private static instance: WebSocketService
  private connections: Map<string, WebSocket> = new Map()
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map()
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map()
  private reconnectAttempts: Map<string, number> = new Map()
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map()
  private heartbeatInterval = 30000 // 30秒心跳间隔

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }

  // ========================================
  // 连接管理
  // ========================================

  /**
   * 连接WebSocket
   * @param endpoint 端点类型：'alarms' | 'status'
   * @param params 连接参数
   */
  connect(endpoint: WebSocketEndpoint, params?: WebSocketConnectParams): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // 如果已有连接，先断开
        if (this.connections.has(endpoint)) {
          this.disconnect(endpoint)
        }

        const wsUrl = this.buildWebSocketUrl(endpoint, params)
        const ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          console.log(`WebSocket连接成功: ${endpoint}`)
          this.connections.set(endpoint, ws)
          this.reconnectAttempts.set(endpoint, 0)
          this.clearReconnectTimer(endpoint)
          this.startHeartbeat(endpoint)
          resolve(true)
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleMessage(endpoint, data)
          } catch (error) {
            console.error('WebSocket消息解析失败:', error, event.data)
          }
        }

        ws.onclose = (event) => {
          console.log(`WebSocket连接关闭: ${endpoint}`, event.code, event.reason)
          this.connections.delete(endpoint)
          this.stopHeartbeat(endpoint)
          
          // 如果不是主动关闭，尝试重连
          if (event.code !== 1000 && event.code !== 1001) {
            this.scheduleReconnect(endpoint, params)
          }
        }

        ws.onerror = (error) => {
          console.error(`WebSocket连接错误: ${endpoint}`, error)
          reject(error)
        }

      } catch (error) {
        console.error('WebSocket连接异常:', error)
        reject(error)
      }
    })
  }

  /**
   * 断开WebSocket连接
   * @param endpoint 端点类型
   */
  disconnect(endpoint: string) {
    const ws = this.connections.get(endpoint)
    if (ws) {
      ws.close(1000, '主动断开连接')
      this.connections.delete(endpoint)
    }
    this.clearReconnectTimer(endpoint)
    this.stopHeartbeat(endpoint)
  }

  /**
   * 断开所有WebSocket连接
   */
  disconnectAll() {
    this.connections.forEach((ws, endpoint) => {
      this.disconnect(endpoint)
    })
    this.messageHandlers.clear()
  }

  /**
   * 检查连接状态
   */
  isConnected(endpoint: string): boolean {
    const ws = this.connections.get(endpoint)
    return ws ? ws.readyState === WebSocket.OPEN : false
  }

  /**
   * 获取所有连接状态
   */
  getConnectionStatus(): Record<string, WebSocketConnectionStatus> {
    const status: Record<string, WebSocketConnectionStatus> = {}
    this.connections.forEach((ws, endpoint) => {
      status[endpoint] = {
        endpoint,
        connected: ws.readyState === WebSocket.OPEN,
        readyState: ws.readyState,
        reconnectAttempts: this.reconnectAttempts.get(endpoint) || 0
      }
    })
    return status
  }

  // ========================================
  // 消息发送
  // ========================================

  /**
   * 发送消息
   * @param endpoint 端点类型
   * @param message 消息内容
   */
  send(endpoint: string, message: WebSocketMessage): boolean {
    const ws = this.connections.get(endpoint)
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          ...message,
          timestamp: new Date().toISOString()
        }))
        return true
      } catch (error) {
        console.error(`WebSocket发送消息失败: ${endpoint}`, error)
        return false
      }
    }
    console.warn(`WebSocket未连接，无法发送消息: ${endpoint}`)
    return false
  }

  /**
   * 发送心跳
   */
  sendHeartbeat(endpoint: string) {
    return this.send(endpoint, { type: 'ping' })
  }

  /**
   * 请求当前状态（仅状态端点）
   */
  requestStatus() {
    return this.send('status', { type: 'request_status' })
  }

  /**
   * 请求连接统计（仅状态端点）
   */
  requestConnectionStats() {
    return this.send('status', { type: 'request_stats' })
  }

  /**
   * 订阅特定流的告警（仅告警端点）
   */
  subscribeStreamAlarms(streamId: string) {
    return this.send('alarms', {
      type: 'subscribe_stream',
      stream_id: streamId
    })
  }

  /**
   * 触发告警视频保存（仅告警端点）
   */
  triggerAlarmVideoSave(streamId: string, alarmId: string, preSeconds?: number, postSeconds?: number) {
    return this.send('alarms', {
      type: 'alarm_detected',
      stream_id: streamId,
      alarm_id: alarmId,
      pre_seconds: preSeconds || 5,
      post_seconds: postSeconds || 5
    })
  }

  // ========================================
  // 消息处理
  // ========================================

  /**
   * 添加消息处理器
   * @param endpoint 端点类型
   * @param handler 处理函数
   */
  addMessageHandler(endpoint: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(endpoint)) {
      this.messageHandlers.set(endpoint, [])
    }
    this.messageHandlers.get(endpoint)!.push(handler)
  }

  /**
   * 移除消息处理器
   * @param endpoint 端点类型
   * @param handler 处理函数
   */
  removeMessageHandler(endpoint: string, handler: (data: any) => void) {
    const handlers = this.messageHandlers.get(endpoint)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(endpoint: string, data: any) {
    // 处理系统消息
    if (data.type === 'pong') {
      console.debug(`收到心跳响应: ${endpoint}`)
      return
    }

    if (data.type === 'error') {
      console.error(`WebSocket错误: ${endpoint}`, data.message)
      return
    }

    // 调用注册的处理器
    const handlers = this.messageHandlers.get(endpoint)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error('WebSocket消息处理器异常:', error)
        }
      })
    }
  }

  // ========================================
  // 重连和心跳机制
  // ========================================

  /**
   * 调度重连
   */
  private scheduleReconnect(endpoint: string, params?: WebSocketConnectParams) {
    const attempts = this.reconnectAttempts.get(endpoint) || 0
    
    if (attempts >= this.maxReconnectAttempts) {
      console.error(`WebSocket重连次数超限: ${endpoint}`)
      return
    }

    this.reconnectAttempts.set(endpoint, attempts + 1)
    
    const delay = this.reconnectInterval * Math.pow(2, attempts) // 指数退避
    console.log(`${delay}ms后尝试重连WebSocket: ${endpoint} (第${attempts + 1}次)`)
    
    const timer = setTimeout(() => {
      this.connect(endpoint as WebSocketEndpoint, params)
        .catch(error => {
          console.error(`WebSocket重连失败: ${endpoint}`, error)
        })
    }, delay)
    
    this.reconnectTimers.set(endpoint, timer)
  }

  /**
   * 清除重连计时器
   */
  private clearReconnectTimer(endpoint: string) {
    const timer = this.reconnectTimers.get(endpoint)
    if (timer) {
      clearTimeout(timer)
      this.reconnectTimers.delete(endpoint)
    }
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(endpoint: string) {
    this.stopHeartbeat(endpoint) // 先停止现有心跳
    
    const timer = setInterval(() => {
      if (!this.sendHeartbeat(endpoint)) {
        this.stopHeartbeat(endpoint)
      }
    }, this.heartbeatInterval)
    
    this.heartbeatTimers.set(endpoint, timer)
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(endpoint: string) {
    const timer = this.heartbeatTimers.get(endpoint)
    if (timer) {
      clearInterval(timer)
      this.heartbeatTimers.delete(endpoint)
    }
  }

  /**
   * 构建WebSocket URL
   */
  private buildWebSocketUrl(endpoint: string, params?: WebSocketConnectParams): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = params?.host || window.location.host
    const baseUrl = `${protocol}//${host}/ws/${endpoint}`
    
    if (params?.query) {
      const queryString = new URLSearchParams(params.query).toString()
      return `${baseUrl}?${queryString}`
    }
    
    return baseUrl
  }
}

// ========================================
// 专用服务类
// ========================================

/**
 * 告警WebSocket服务
 */
export class AlarmWebSocketService {
  private ws = WebSocketService.getInstance()
  private connected = false

  /**
   * 连接告警WebSocket
   */
  async connect(params?: WebSocketConnectParams): Promise<boolean> {
    try {
      this.connected = await this.ws.connect('alarms', params)
      return this.connected
    } catch (error) {
      console.error('告警WebSocket连接失败:', error)
      return false
    }
  }

  /**
   * 断开告警WebSocket
   */
  disconnect() {
    this.ws.disconnect('alarms')
    this.connected = false
  }

  /**
   * 订阅告警消息
   */
  onAlarmMessage(handler: (data: AlarmWebSocketMessage) => void) {
    this.ws.addMessageHandler('alarms', handler)
  }

  /**
   * 取消订阅告警消息
   */
  offAlarmMessage(handler: (data: AlarmWebSocketMessage) => void) {
    this.ws.removeMessageHandler('alarms', handler)
  }

  /**
   * 订阅特定流的告警
   */
  subscribeStream(streamId: string) {
    return this.ws.subscribeStreamAlarms(streamId)
  }

  /**
   * 触发告警视频保存
   */
  saveAlarmVideo(streamId: string, alarmId: string, preSeconds = 5, postSeconds = 5) {
    return this.ws.triggerAlarmVideoSave(streamId, alarmId, preSeconds, postSeconds)
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.ws.isConnected('alarms')
  }
}

/**
 * 状态WebSocket服务
 */
export class StatusWebSocketService {
  private ws = WebSocketService.getInstance()
  private connected = false

  /**
   * 连接状态WebSocket
   */
  async connect(params?: WebSocketConnectParams): Promise<boolean> {
    try {
      this.connected = await this.ws.connect('status', params)
      return this.connected
    } catch (error) {
      console.error('状态WebSocket连接失败:', error)
      return false
    }
  }

  /**
   * 断开状态WebSocket
   */
  disconnect() {
    this.ws.disconnect('status')
    this.connected = false
  }

  /**
   * 订阅状态消息
   */
  onStatusMessage(handler: (data: StatusWebSocketMessage) => void) {
    this.ws.addMessageHandler('status', handler)
  }

  /**
   * 取消订阅状态消息
   */
  offStatusMessage(handler: (data: StatusWebSocketMessage) => void) {
    this.ws.removeMessageHandler('status', handler)
  }

  /**
   * 请求当前状态
   */
  requestStatus() {
    return this.ws.requestStatus()
  }

  /**
   * 请求连接统计
   */
  requestConnectionStats() {
    return this.ws.requestConnectionStats()
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.ws.isConnected('status')
  }
}

// ========================================
// 类型定义
// ========================================

// WebSocket端点类型
export type WebSocketEndpoint = 'alarms' | 'status'

// WebSocket连接参数
export interface WebSocketConnectParams {
  host?: string
  query?: Record<string, string>
}

// 基础WebSocket消息
export interface WebSocketMessage {
  type: string
  timestamp?: string
  [key: string]: any
}

// 连接状态
export interface WebSocketConnectionStatus {
  endpoint: string
  connected: boolean
  readyState: number
  reconnectAttempts: number
}

// 告警WebSocket消息类型
export interface AlarmWebSocketMessage extends WebSocketMessage {
  type: 'alarm_detected' | 'alarm_video_saved' | 'alarm_video_save_failed' | 'error' | 'pong'
  stream_id?: string
  alarm_id?: string
  video_path?: string
  message?: string
  data?: any
}

// 状态WebSocket消息类型
export interface StatusWebSocketMessage extends WebSocketMessage {
  type: 'initial_status' | 'status_update' | 'connection_stats' | 'error' | 'pong'
  data?: {
    active_tasks?: number
    total_tasks?: number
    system_resources?: {
      cpu_usage: number
      memory_usage: number
      gpu_usage?: number
      disk_usage: number
    }
    task_status?: Record<string, any>
    connections_by_type?: Record<string, number>
  }
  server_time?: string
}

// ========================================
// 工具函数和常量
// ========================================

// WebSocket状态常量
export const WS_READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
} as const

// WebSocket关闭代码
export const WS_CLOSE_CODE = {
  NORMAL_CLOSURE: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS_RECEIVED: 1005,
  ABNORMAL_CLOSURE: 1006,
  INVALID_FRAME_PAYLOAD_DATA: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  MANDATORY_EXTENSION: 1010,
  INTERNAL_SERVER_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014,
  TLS_HANDSHAKE: 1015
} as const

/**
 * WebSocket工具类
 */
export class WebSocketUtils {
  /**
   * 获取WebSocket状态文本
   */
  static getReadyStateText(readyState: number): string {
    switch (readyState) {
      case WS_READY_STATE.CONNECTING: return '连接中'
      case WS_READY_STATE.OPEN: return '已连接'
      case WS_READY_STATE.CLOSING: return '关闭中'
      case WS_READY_STATE.CLOSED: return '已关闭'
      default: return '未知状态'
    }
  }

  /**
   * 获取关闭代码描述
   */
  static getCloseCodeDescription(code: number): string {
    switch (code) {
      case WS_CLOSE_CODE.NORMAL_CLOSURE: return '正常关闭'
      case WS_CLOSE_CODE.GOING_AWAY: return '页面离开'
      case WS_CLOSE_CODE.PROTOCOL_ERROR: return '协议错误'
      case WS_CLOSE_CODE.UNSUPPORTED_DATA: return '不支持的数据'
      case WS_CLOSE_CODE.ABNORMAL_CLOSURE: return '异常关闭'
      case WS_CLOSE_CODE.INTERNAL_SERVER_ERROR: return '服务器内部错误'
      case WS_CLOSE_CODE.SERVICE_RESTART: return '服务重启'
      case WS_CLOSE_CODE.TRY_AGAIN_LATER: return '稍后重试'
      default: return `未知错误码: ${code}`
    }
  }

  /**
   * 验证WebSocket URL
   */
  static validateWebSocketUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      return parsedUrl.protocol === 'ws:' || parsedUrl.protocol === 'wss:'
    } catch {
      return false
    }
  }

  /**
   * 计算重连延迟（指数退避）
   */
  static calculateReconnectDelay(attempt: number, baseDelay = 1000, maxDelay = 30000): number {
    const delay = baseDelay * Math.pow(2, attempt)
    return Math.min(delay, maxDelay)
  }
}

// 默认导出主要服务
export { WebSocketService as default }

// 便捷的单例实例
export const alarmWS = new AlarmWebSocketService()
export const statusWS = new StatusWebSocketService() 