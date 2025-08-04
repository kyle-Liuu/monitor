import request from '@/utils/http'

/**
 * 告警管理API服务
 * 对接后端 /api/analyzer/alarms 接口
 */
export class WarningService {
  // ========================================
  // 告警查询功能
  // ========================================

  // 获取告警列表
  static getWarningList(params: AlarmQueryParams = {}) {
    return request.get<AlarmListResponse>({
      url: '/api/analyzer/alarms',
      params: {
        page: params.page || 1,
        page_size: params.page_size || 20,
        task_id: params.task_id,
        stream_id: params.stream_id,
        status: params.status
      }
    })
  }

  // 获取告警详情
  static getWarningDetail(alarmId: string) {
    return request.get<AlarmDetailResponse>({
      url: `/api/analyzer/alarms/${alarmId}`
    })
  }

  // 获取告警媒体文件信息
  static getWarningMedia(alarmId: string) {
    return request.get<AlarmMediaResponse>({
      url: `/api/analyzer/alarms/${alarmId}/media`
    })
  }

  // ========================================
  // 告警处理功能
  // ========================================

  // 处理告警（新的处理方式）
  static processAlarm(alarmId: string, data: AlarmProcessRequest) {
    return request.put<AlarmProcessResponse>({
      url: `/api/analyzer/alarms/${alarmId}/process`,
      data
    })
  }

  // 批量处理告警
  static batchProcessAlarms(data: AlarmBatchProcessRequest) {
    return request.post<AlarmBatchProcessResponse>({
      url: '/api/analyzer/alarms/batch-process',
      data
    })
  }

  // 更新告警状态
  static updateAlarmStatus(alarmId: string, status: AlarmStatus) {
    return request.put<AlarmOperationResponse>({
      url: `/api/analyzer/alarms/${alarmId}/status`,
      data: { status }
    })
  }

  // 更新告警等级
  static updateAlarmLevel(alarmId: string, level: AlarmLevel) {
    return request.put<AlarmOperationResponse>({
      url: `/api/analyzer/alarms/${alarmId}/level`,
      data: { level }
    })
  }

  // 添加告警处理备注
  static addAlarmComment(alarmId: string, comment: string) {
    return request.post<AlarmOperationResponse>({
      url: `/api/analyzer/alarms/${alarmId}/comment`,
      data: { comment }
    })
  }

  // ========================================
  // 告警统计分析
  // ========================================

  // 获取告警统计数据
  static getAlarmStatistics(params: AlarmStatisticsParams = {}) {
    return request.get<AlarmStatisticsResponse>({
      url: '/api/analyzer/alarms/statistics',
      params
    })
  }

  // 获取告警趋势数据
  static getAlarmTrends(params: AlarmTrendParams = {}) {
    return request.get<AlarmTrendResponse>({
      url: '/api/analyzer/alarms/trends',
      params
    })
  }

  // 获取告警热力图数据
  static getAlarmHeatmap(params: AlarmHeatmapParams = {}) {
    return request.get<AlarmHeatmapResponse>({
      url: '/api/analyzer/alarms/heatmap',
      params
    })
  }

  // ========================================
  // 告警导出功能
  // ========================================

  // 导出告警报表
  static exportAlarmReport(params: AlarmExportParams) {
    return request.post<AlarmExportResponse>({
      url: '/api/analyzer/alarms/export',
      data: params
    })
  }

  // 下载告警媒体文件
  static downloadAlarmMedia(alarmId: string, mediaType: 'original_image' | 'processed_image' | 'video_clip') {
    return request.get<Blob>({
      url: `/api/analyzer/alarms/${alarmId}/download/${mediaType}`,
      responseType: 'blob'
    })
  }

  // ========================================
  // 实时告警功能
  // ========================================

  // 获取最新告警
  static getLatestAlarms(limit: number = 10) {
    return request.get<LatestAlarmsResponse>({
      url: '/api/analyzer/alarms/latest',
      params: { limit }
    })
  }

  // 获取告警数量统计
  static getAlarmCounts() {
    return request.get<AlarmCountsResponse>({
      url: '/api/analyzer/alarms/counts'
    })
  }

  // ========================================
  // 兼容性方法（保持原有接口名称）
  // ========================================

  // 旧方法名兼容
  static handleWarning = WarningService.processAlarm
  static batchHandleWarnings = WarningService.batchProcessAlarms
  static getWarningStatistics = WarningService.getAlarmStatistics
}

// ========================================
// 查询参数类型定义
// ========================================

// 告警查询参数
export interface AlarmQueryParams {
  page?: number           // 页码
  page_size?: number      // 每页数量
  task_id?: string        // 任务ID过滤
  stream_id?: string      // 视频流ID过滤
  status?: AlarmStatus    // 状态过滤
  level?: AlarmLevel      // 等级过滤
  alarm_type?: string     // 告警类型过滤
  start_time?: string     // 开始时间
  end_time?: string       // 结束时间
  processed_by?: string   // 处理人过滤
}

// 告警处理请求
export interface AlarmProcessRequest {
  status: 'processed' | 'ignored'  // 处理状态
  level?: AlarmLevel               // 更新等级
  comment?: string                 // 处理备注
}

// 批量处理请求
export interface AlarmBatchProcessRequest {
  alarm_ids: string[]              // 告警ID列表
  status: 'processed' | 'ignored'  // 批量状态
  level?: AlarmLevel               // 批量等级
  comment?: string                 // 批量备注
}

// 统计查询参数
export interface AlarmStatisticsParams {
  start_time?: string
  end_time?: string
  group_by?: 'day' | 'week' | 'month' | 'hour'
  task_id?: string
  stream_id?: string
}

// 趋势查询参数
export interface AlarmTrendParams {
  period?: 'day' | 'week' | 'month'
  start_time?: string
  end_time?: string
  alarm_type?: string
}

// 热力图查询参数
export interface AlarmHeatmapParams {
  date?: string
  stream_id?: string
  alarm_type?: string
}

// 导出参数
export interface AlarmExportParams {
  start_time: string
  end_time: string
  format: 'excel' | 'pdf' | 'csv'
  include_media?: boolean
  alarm_ids?: string[]
}

// ========================================
// 数据模型类型定义
// ========================================

// 告警状态枚举
export enum AlarmStatus {
  NEW = 'new',
  PROCESSED = 'processed',
  IGNORED = 'ignored'
}

// 告警等级枚举
export enum AlarmLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 告警项（基础信息）
export interface AlarmItem {
  alarm_id: string
  task_id: string
  alarm_type: string        // 告警类型：person, vehicle, face, etc.
  confidence: number        // 置信度 0-1
  bbox?: string            // 边界框信息（JSON字符串）
  
  // 新的状态字段
  status: AlarmStatus      // 告警状态
  level: AlarmLevel        // 告警等级
  
  // 处理信息
  processed_by?: string    // 处理人ID
  processed_at?: string    // 处理时间
  process_comment?: string // 处理备注
  
  // 媒体文件
  media_files?: {
    original_image?: string   // 原始图片
    processed_image?: string  // 处理后图片
    video_clip?: string      // 视频片段
  }
  
  // 时间信息
  created_at: string
  
  // 兼容性字段（废弃但保留）
  severity?: string        // 兼容旧的severity字段
  processed?: boolean      // 兼容旧的processed字段
}

// 告警详情（扩展信息）
export interface AlarmDetail extends AlarmItem {
  task_info?: {
  task_name: string
  stream_id: string
  stream_name: string
  algorithm_id: string
  algorithm_name: string
  }
  detection_details?: {
    zone_info?: any          // 检测区域信息
    algorithm_config?: any   // 算法配置
    raw_result?: any         // 原始检测结果
  }
  processor_info?: {
    processor_name: string
    processor_role: string
  }
}

// ========================================
// 响应类型定义
// ========================================

// 告警列表响应
export interface AlarmListResponse {
  code: number
  data: {
    alarms: AlarmItem[]
    total: number
    page: number
    page_size: number
  }
  msg: string
}

// 告警详情响应
export interface AlarmDetailResponse {
  code: number
  data: AlarmDetail
  msg: string
}

// 告警媒体文件响应
export interface AlarmMediaResponse {
  code: number
  data: {
    alarm_id: string
    media_files: {
      original_image?: string
      processed_image?: string
      video_clip?: string
    }
    download_urls: {
      original_image?: string
      processed_image?: string
      video_clip?: string
    }
  }
  msg: string
}

// 告警处理响应
export interface AlarmProcessResponse {
  code: number
  data: {
    alarm_id: string
    processed: boolean
  }
  msg: string
}

// 批量处理响应
export interface AlarmBatchProcessResponse {
  success: boolean
  processed_count: number
  failed_count: number
  message: string
  details?: {
    alarm_id: string
    success: boolean
    error?: string
  }[]
}

// 告警操作响应
export interface AlarmOperationResponse {
  success: boolean
  alarm_id: string
  message: string
}

// 统计响应
export interface AlarmStatisticsResponse {
  total_alarms: number
  status_distribution: {
    new: number
    processed: number
    ignored: number
  }
  level_distribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
  type_distribution: {
    [key: string]: number
  }
  time_series?: {
    time: string
    count: number
  }[]
}

// 趋势响应
export interface AlarmTrendResponse {
  trends: {
    date: string
    count: number
    level_breakdown: {
      low: number
      medium: number
      high: number
      critical: number
    }
  }[]
  summary: {
    total_period: number
    average_per_day: number
    peak_day: string
    peak_count: number
  }
}

// 热力图响应
export interface AlarmHeatmapResponse {
  heatmap_data: {
    hour: number
    count: number
    level_breakdown: {
      [key in AlarmLevel]: number
    }
  }[]
  peak_hours: number[]
  total_day: number
}

// 导出响应
export interface AlarmExportResponse {
  success: boolean
  file_url: string
  file_name: string
  expires_at: string
}

// 最新告警响应
export interface LatestAlarmsResponse {
  alarms: AlarmItem[]
  total_unprocessed: number
  last_update: string
}

// 告警数量响应
export interface AlarmCountsResponse {
  total: number
  new: number
  processed: number
  ignored: number
  today: number
  this_week: number
  this_month: number
}

// ========================================
// 工具类和常量
// ========================================

// 告警级别颜色映射
export const ALARM_LEVEL_COLORS = {
  [AlarmLevel.LOW]: '#52c41a',       // 绿色
  [AlarmLevel.MEDIUM]: '#faad14',    // 橙色
  [AlarmLevel.HIGH]: '#f5222d',      // 红色
  [AlarmLevel.CRITICAL]: '#722ed1'   // 紫色
} as const

// 告警状态显示文本
export const ALARM_STATUS_TEXT = {
  [AlarmStatus.NEW]: '新告警',
  [AlarmStatus.PROCESSED]: '已处理',
  [AlarmStatus.IGNORED]: '已忽略'
} as const

// 告警级别显示文本
export const ALARM_LEVEL_TEXT = {
  [AlarmLevel.LOW]: '低',
  [AlarmLevel.MEDIUM]: '中',
  [AlarmLevel.HIGH]: '高',
  [AlarmLevel.CRITICAL]: '严重'
} as const

// 告警工具类
export class AlarmUtils {
  /**
   * 获取告警级别颜色
   */
  static getLevelColor(level: AlarmLevel): string {
    return ALARM_LEVEL_COLORS[level] || '#d9d9d9'
  }

  /**
   * 获取告警状态显示文本
   */
  static getStatusText(status: AlarmStatus): string {
    return ALARM_STATUS_TEXT[status] || status
  }

  /**
   * 获取告警级别显示文本
   */
  static getLevelText(level: AlarmLevel): string {
    return ALARM_LEVEL_TEXT[level] || level
  }

  /**
   * 检查告警是否需要立即处理
   */
  static isUrgent(alarm: AlarmItem): boolean {
    return alarm.status === AlarmStatus.NEW && 
           (alarm.level === AlarmLevel.HIGH || alarm.level === AlarmLevel.CRITICAL)
  }

  /**
   * 格式化置信度显示
   */
  static formatConfidence(confidence: number): string {
    return `${(confidence * 100).toFixed(1)}%`
  }

  /**
   * 解析边界框信息
   */
  static parseBoundingBox(bbox: string): { x: number, y: number, width: number, height: number } | null {
    try {
      const [x, y, width, height] = JSON.parse(bbox)
      return { x, y, width, height }
    } catch {
      return null
    }
  }

  /**
   * 计算告警处理时长
   */
  static calculateProcessTime(createdAt: string, processedAt?: string): string {
    if (!processedAt) return '未处理'
    
    const created = new Date(createdAt)
    const processed = new Date(processedAt)
    const diffMs = processed.getTime() - created.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return '< 1分钟'
    if (diffMins < 60) return `${diffMins}分钟`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}小时`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}天`
  }

  /**
   * 过滤告警列表
   */
  static filterAlarms(alarms: AlarmItem[], filters: {
    status?: AlarmStatus[]
    level?: AlarmLevel[]
    type?: string[]
    timeRange?: { start: string, end: string }
  }): AlarmItem[] {
    return alarms.filter(alarm => {
      // 状态过滤
      if (filters.status && !filters.status.includes(alarm.status)) {
        return false
      }
      
      // 级别过滤
      if (filters.level && !filters.level.includes(alarm.level)) {
        return false
      }
      
      // 类型过滤
      if (filters.type && !filters.type.includes(alarm.alarm_type)) {
        return false
      }
      
      // 时间范围过滤
      if (filters.timeRange) {
        const alarmTime = new Date(alarm.created_at).getTime()
        const startTime = new Date(filters.timeRange.start).getTime()
        const endTime = new Date(filters.timeRange.end).getTime()
        
        if (alarmTime < startTime || alarmTime > endTime) {
          return false
        }
      }
      
      return true
    })
  }
} 