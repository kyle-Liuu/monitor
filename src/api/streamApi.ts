import request from '@/utils/http'

/**
 * 视频流管理API服务
 * 对接后端 /api/streams 接口
 */
export class StreamService {
  // ========================================
  // 视频流基础CRUD操作
  // ========================================

  // 获取视频流列表
  static getStreamList(params: StreamQueryParams = {}) {
    return request.get<StreamListResponse>({
      url: '/api/streams',
      params
    })
  }

  // 获取视频流详情
  static getStreamDetail(streamId: string) {
    return request.get<StreamDetailResponse>({
      url: `/api/streams/${streamId}`
    })
  }

  // 创建视频流
  static createStream(data: StreamCreateRequest) {
    return request.post<StreamOperationResponse>({
      url: '/api/streams',
      data
    })
  }

  // 更新视频流
  static updateStream(streamId: string, data: StreamUpdateRequest) {
    return request.put<StreamOperationResponse>({
      url: `/api/streams/${streamId}`,
      data
    })
  }

  // 删除视频流
  static deleteStream(streamId: string) {
    return request.del<StreamOperationResponse>({
      url: `/api/streams/${streamId}`
    })
  }

  // ========================================
  // 视频流控制操作
  // ========================================

  // 启动视频流
  static startStream(streamId: string) {
    return request.post<StreamOperationResponse>({
      url: `/api/streams/${streamId}/start`
    })
  }

  // 停止视频流
  static stopStream(streamId: string) {
    return request.post<StreamOperationResponse>({
      url: `/api/streams/${streamId}/stop`
    })
  }

  // ========================================
  // 视频流转发管理（新增功能）
  // ========================================

  // 开始转发（通过zlmedia）
  static startForwarding(streamId: string, data?: StreamForwardOptions) {
    return request.post<StreamForwardResponse>({
      url: `/api/streams/${streamId}/forward/start`,
      data
    })
  }

  // 停止转发
  static stopForwarding(streamId: string) {
    return request.post<StreamForwardResponse>({
      url: `/api/streams/${streamId}/forward/stop`
    })
  }

  // 获取转发状态
  static getForwardingStatus(streamId: string) {
    return request.get<StreamForwardStatusResponse>({
      url: `/api/streams/${streamId}/forward/status`
    })
  }

  // 测试转发连接
  static testForwarding(streamId: string) {
    return request.post<StreamForwardTestResponse>({
      url: `/api/streams/${streamId}/forward/test`
    })
  }

  // ========================================
  // 任务管理（新增功能）
  // ========================================

  // 为视频流创建分析任务
  static createStreamTask(streamId: string, data: StreamTaskCreateRequest) {
    return request.post<StreamTaskCreateResponse>({
      url: `/api/streams/${streamId}/tasks`,
      data
    })
  }

  // 获取视频流的所有任务
  static getStreamTasks(streamId: string) {
    return request.get<StreamTaskListResponse>({
      url: `/api/streams/${streamId}/tasks`
    })
  }

  // 删除视频流的任务
  static deleteStreamTask(streamId: string, taskId: string) {
    return request.del<StreamTaskResponse>({
      url: `/api/streams/${streamId}/tasks/${taskId}`
    })
  }

  // 启动任务（开始布控）
  static startStreamTask(streamId: string, taskId: string) {
    return request.post<StreamTaskResponse>({
      url: `/api/streams/${streamId}/tasks/${taskId}/start`
    })
  }

  // 停止任务（停止布控）
  static stopStreamTask(streamId: string, taskId: string) {
    return request.post<StreamTaskResponse>({
      url: `/api/streams/${streamId}/tasks/${taskId}/stop`
    })
  }

  // ========================================
  // 组织绑定管理（新增功能）
  // ========================================

  // 绑定视频流到组织
  static bindToOrganization(streamId: string, data: StreamOrgBindingRequest) {
    return request.post<StreamOrgBindingResponse>({
      url: `/api/streams/${streamId}/bind-organization`,
      data
    })
  }

  // 解绑视频流与组织
  static unbindFromOrganization(streamId: string, orgId: string) {
    return request.del<StreamOrgBindingResponse>({
      url: `/api/streams/${streamId}/unbind-organization/${orgId}`
    })
  }

  // 获取视频流的组织绑定
  static getStreamOrganizations(streamId: string) {
    return request.get<StreamOrganizationsResponse>({
      url: `/api/streams/${streamId}/organizations`
    })
  }

  // ========================================
  // 原有功能（保持兼容）
  // ========================================

  // 测试视频流连接
  static testStream(streamData: StreamTestRequest) {
    return request.post<StreamTestResponse>({
      url: '/api/streams/test',
      data: streamData
    })
  }

  // 获取视频流截图
  static getStreamSnapshot(streamId: string) {
    return request.post<StreamSnapshotResponse>({
      url: `/api/streams/${streamId}/snapshot`
    })
  }

  // 获取视频流统计信息
  static getStreamStats(streamId: string) {
    return request.get<StreamStatsResponse>({
      url: `/api/streams/${streamId}/stats`
    })
  }

  // 获取所有视频流状态
  static getAllStreamsStatus() {
    return request.get<AllStreamsStatusResponse>({
      url: '/api/streams/status'
    })
  }

  // 批量操作视频流
  static batchOperateStreams(data: StreamBatchRequest) {
    return request.post<StreamBatchResponse>({
      url: '/api/streams/batch',
      data
    })
  }

  // ========================================
  // 工具方法
  // ========================================

  // 获取支持的协议列表
  static getSupportedProtocols() {
    return request.get<SupportedProtocolsResponse>({
      url: '/api/streams/protocols'
    })
  }

  // 验证视频流URL格式
  static validateStreamUrl(url: string) {
    return request.post<StreamUrlValidationResponse>({
      url: '/api/streams/validate-url',
      data: { url }
    })
  }

  // 获取视频流预览信息
  static getStreamPreview(streamId: string) {
    return request.get<StreamPreviewResponse>({
      url: `/api/streams/${streamId}/preview`
    })
  }
}

// ========================================
// 查询和请求类型定义
// ========================================

// 视频流查询参数
export interface StreamQueryParams {
  skip?: number
  limit?: number
  name?: string          // 名称搜索
  stream_type?: string   // 流类型过滤
  status?: string        // 状态过滤
  protocol?: string      // 协议过滤
  org_id?: string        // 组织过滤
  is_forwarding?: boolean // 转发状态过滤
}

// 视频流创建请求
export interface StreamCreateRequest {
  name: string
  url: string
  description?: string
  stream_type?: 'rtsp' | 'rtmp' | 'http' | 'file'
  protocol?: string      // 协议类型
  org_id?: string        // 绑定的组织ID
  task_configs?: TaskConfig[]  // 同时创建任务配置
  auto_start?: boolean   // 是否自动启动
  auto_forward?: boolean // 是否自动开始转发
}

// 视频流更新请求
export interface StreamUpdateRequest {
  name?: string
  url?: string
  description?: string
  stream_type?: 'rtsp' | 'rtmp' | 'http' | 'file'
  protocol?: string
  org_id?: string
}

// 任务配置
export interface TaskConfig {
  algo_id: string        // 算法ID
  zone_config?: any      // 区域配置（JSON）
  algo_config?: any      // 算法配置（JSON）
  enabled?: boolean      // 是否启用
}

// ========================================
// 转发相关类型定义
// ========================================

// 转发选项
export interface StreamForwardOptions {
  enable_audio?: boolean
  enable_record?: boolean
  record_duration?: number
  quality?: 'high' | 'medium' | 'low'
}

// 转发响应
export interface StreamForwardResponse {
  success: boolean
  stream_id: string
  forward_url?: string
  message: string
}

// 转发状态响应
export interface StreamForwardStatusResponse {
  stream_id: string
  is_forwarding: boolean
  forward_url?: string
  start_time?: string
  duration?: number
  error_message?: string
}

// 转发测试响应
export interface StreamForwardTestResponse {
  success: boolean
  accessible: boolean
  forward_url?: string
  latency?: number
  message: string
}

// ========================================
// 任务相关类型定义
// ========================================

// 任务创建请求
export interface StreamTaskCreateRequest {
  tasks: TaskConfig[]
}

// 任务创建响应
export interface StreamTaskCreateResponse {
  success: boolean
  stream_id: string
  created_tasks: {
    task_id: string
    algo_id: string
    algo_name: string
  }[]
  message: string
}

// 任务列表响应
export interface StreamTaskListResponse {
  stream_id: string
  tasks: {
    task_id: string
    algo_id: string
    algo_name: string
    status: 'pending' | 'running' | 'stopped' | 'error'
    zone_config?: any
    algo_config?: any
    created_at: string
    updated_at: string
  }[]
  total: number
}

// 任务操作响应
export interface StreamTaskResponse {
  success: boolean
  task_id: string
  message: string
}

// ========================================
// 组织绑定类型定义
// ========================================

// 组织绑定请求
export interface StreamOrgBindingRequest {
  org_id: string
}

// 组织绑定响应
export interface StreamOrgBindingResponse {
  success: boolean
  stream_id: string
  org_id: string
  binding_id?: string
  message: string
}

// 视频流的组织绑定响应
export interface StreamOrganizationsResponse {
  stream_id: string
  organizations: {
    org_id: string
    org_name: string
    org_path: string
    binding_id: string
    created_at: string
  }[]
  total: number
}

// ========================================
// 响应类型定义
// ========================================

// 视频流列表项 - 与后端StreamInfo保持一致
export interface StreamItem {
  stream_id: string
  name: string
  url: string
  description?: string
  stream_type: string
  status: 'inactive' | 'connecting' | 'active' | 'error' | 'reconnecting'
  is_forwarding: boolean  // 是否正在转发
  frame_width?: number
  frame_height?: number
  fps?: number
  consumer_count: number
  last_frame_time?: string
  last_online_time?: string
  frame_count: number
  error_message?: string
  created_at: string
  updated_at: string
  // 前端页面用到的扩展字段
  org_id?: string        // 绑定的组织ID（扩展字段）
  org_name?: string      // 组织名称（扩展字段）
}

// 视频流列表响应
export interface StreamListResponse {
  items: StreamItem[]  // 后端返回的是 items
  total: number
  page: number        // 后端返回的是 page
  page_size: number   // 后端返回的是 page_size
}

// 视频流详情响应
export interface StreamDetailResponse extends StreamItem {
  bitrate?: number
  duration?: number
  error_count: number
  frame_count: number
  last_online_time?: string
  tasks?: {
    task_id: string
    algo_name: string
    status: string
  }[]
  organizations?: {
    org_id: string
    org_name: string
  }[]
}

// 视频流操作响应
export interface StreamOperationResponse {
  success: boolean
  stream_id: string
  operation: 'create' | 'update' | 'delete' | 'start' | 'stop'
  message: string
  data?: any
}

// 测试请求和响应
export interface StreamTestRequest {
  url: string
  stream_type?: string
  timeout?: number
}

export interface StreamTestResponse {
  success: boolean
  accessible: boolean
  message: string
  details?: any
}

// 截图响应
export interface StreamSnapshotResponse {
  success: boolean
  image_data?: string
  message: string
}

// 统计响应
export interface StreamStatsResponse {
  stream_id: string
  status: string
  fps: number
  resolution: string
  bitrate: number
  duration: number
  error_count: number
  last_frame_time: string
}

// 所有流状态响应
export interface AllStreamsStatusResponse {
  streams: Array<{
    stream_id: string
    name: string
    status: string
    fps: number
    error_count: number
    is_forwarding: boolean
  }>
  total_active: number
  total_inactive: number
  total_forwarding: number
}

// 批量操作
export interface StreamBatchRequest {
  stream_ids: string[]
  operation: 'start' | 'stop' | 'delete' | 'start_forward' | 'stop_forward'
}

export interface StreamBatchResponse {
  success: boolean
  processed_count: number
  failed_count: number
  message: string
  details?: {
    stream_id: string
    success: boolean
    message: string
  }[]
}

// ========================================
// 工具响应类型
// ========================================

// 支持的协议响应
export interface SupportedProtocolsResponse {
  protocols: {
    name: string
    description: string
    default_port: number
    url_format: string
  }[]
}

// URL验证响应
export interface StreamUrlValidationResponse {
  valid: boolean
  protocol?: string
  host?: string
  port?: number
  path?: string
  message: string
}

// 预览响应
export interface StreamPreviewResponse {
  stream_id: string
  preview_url: string
  thumbnail?: string
  duration?: number
  available: boolean
}

// ========================================
// 枚举和常量
// ========================================

// 视频流状态
export enum StreamStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  CONNECTING = 'connecting'
}

// 视频流类型
export enum StreamType {
  RTSP = 'rtsp',
  RTMP = 'rtmp',
  HTTP = 'http',
  FILE = 'file'
}

// 任务状态
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error'
}

// ========================================
// 工具类
// ========================================

export class StreamUtils {
  /**
   * 检查是否为有效的RTSP URL
   */
  static isValidRtspUrl(url: string): boolean {
    return /^rtsp:\/\/.+/.test(url)
  }

  /**
   * 从URL提取协议
   */
  static extractProtocol(url: string): string {
    const match = url.match(/^(\w+):\/\//)
    return match ? match[1].toLowerCase() : 'unknown'
  }

  /**
   * 格式化码率
   */
  static formatBitrate(bitrate: number): string {
    if (bitrate < 1024) return `${bitrate} bps`
    if (bitrate < 1024 * 1024) return `${(bitrate / 1024).toFixed(1)} Kbps`
    return `${(bitrate / (1024 * 1024)).toFixed(1)} Mbps`
  }

  /**
   * 格式化分辨率
   */
  static formatResolution(resolution: string): string {
    const resolutionMap: Record<string, string> = {
      '1920x1080': '1080P',
      '1280x720': '720P',
      '640x480': '480P',
      '320x240': '240P'
    }
    return resolutionMap[resolution] || resolution
  }

  /**
   * 检查是否需要转发
   */
  static needsForwarding(streamType: string): boolean {
    // RTSP流通常需要转发才能在浏览器中播放
    return streamType.toLowerCase() === 'rtsp'
  }

  /**
   * 生成流状态显示文本
   */
  static getStatusText(status: string, isForwarding: boolean): string {
    if (status === 'active') {
      return isForwarding ? '运行中（已转发）' : '运行中'
    } else if (status === 'inactive') {
      return '已停止'
    } else if (status === 'error') {
      return '错误'
    }
    return status
  }

  /**
   * 计算流的运行时长
   */
  static calculateUptime(startTime: string): string {
    const start = new Date(startTime)
    const now = new Date()
    const diff = now.getTime() - start.getTime()
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}小时${minutes}分钟`
  }
} 