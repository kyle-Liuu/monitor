import request from '@/utils/http'

/**
 * 分析器管理API服务
 * 对接后端 /api/analyzer 接口
 * 专注于任务管理和系统控制功能
 */
export class AnalyzerService {
  // ========================================
  // 系统控制功能
  // ========================================

  // 启动分析器服务
  static startAnalyzer() {
    return request.post<AnalyzerOperationResponse>({
      url: '/api/analyzer/start'
    })
  }

  // 停止分析器服务
  static stopAnalyzer() {
    return request.post<AnalyzerOperationResponse>({
      url: '/api/analyzer/stop'
    })
  }

  // 重启分析器服务
  static restartAnalyzer() {
    return request.post<AnalyzerOperationResponse>({
      url: '/api/analyzer/restart'
    })
  }

  // 获取分析器系统状态
  static getSystemStatus() {
    return request.get<AnalyzerStatusResponse>({
      url: '/api/analyzer/status'
    })
  }

  // ========================================
  // 任务管理功能
  // ========================================

  // 获取分析任务列表
  static getTaskList(params: TaskQueryParams = {}) {
    return request.get<TaskListResponse>({
      url: '/api/analyzer/tasks',
      params: {
        status: params.status,
        stream_id: params.stream_id,
        algo_id: params.algo_id
      }
    })
  }

  // 获取分析任务详情
  static getTaskDetail(taskId: string) {
    return request.get<TaskDetailResponse>({
      url: `/api/analyzer/tasks/${taskId}`
    })
  }

  // 创建分析任务
  static createTask(data: TaskCreateRequest) {
    return request.post<TaskOperationResponse>({
      url: '/api/analyzer/tasks',
      data
    })
  }

  // 更新分析任务配置
  static updateTask(taskId: string, data: TaskUpdateRequest) {
    return request.put<TaskOperationResponse>({
      url: `/api/analyzer/tasks/${taskId}`,
      data
    })
  }

  // 删除分析任务
  static deleteTask(taskId: string) {
    return request.del<TaskOperationResponse>({
      url: `/api/analyzer/tasks/${taskId}`
    })
  }

  // 启动分析任务
  static startTask(taskId: string) {
    return request.post<TaskOperationResponse>({
      url: `/api/analyzer/tasks/${taskId}/start`
    })
  }

  // 停止分析任务
  static stopTask(taskId: string) {
    return request.post<TaskOperationResponse>({
      url: `/api/analyzer/tasks/${taskId}/stop`
    })
  }

  // 重启分析任务
  static restartTask(taskId: string) {
    return request.post<TaskOperationResponse>({
      url: `/api/analyzer/tasks/${taskId}/restart`
    })
  }

  // 批量操作分析任务
  static batchOperateTasks(data: TaskBatchRequest) {
    return request.post<TaskBatchResponse>({
      url: '/api/analyzer/tasks/batch',
      data
    })
  }

  // 更新任务告警配置
  static updateTaskAlarmConfig(taskId: string, alarmConfig: AlarmConfig) {
    return request.put<TaskOperationResponse>({
      url: `/api/analyzer/tasks/${taskId}/alarm_config`,
      data: alarmConfig
    })
  }

  // ========================================
  // 任务监控和统计
  // ========================================

  // 获取任务运行状态
  static getTaskRuntimeStatus(taskId: string) {
    return request.get<TaskRuntimeStatusResponse>({
      url: `/api/analyzer/tasks/${taskId}/runtime-status`
    })
  }

  // 获取任务性能统计
  static getTaskPerformance(taskId: string, timeRange?: string) {
    return request.get<TaskPerformanceResponse>({
      url: `/api/analyzer/tasks/${taskId}/performance`,
      params: { time_range: timeRange }
    })
  }

  // 获取分析器性能统计
  static getSystemPerformance(params: PerformanceQueryParams = {}) {
    return request.get<SystemPerformanceResponse>({
      url: '/api/analyzer/system/performance',
      params
    })
  }

  // 获取任务日志
  static getTaskLogs(taskId: string, params: LogQueryParams = {}) {
    return request.get<TaskLogsResponse>({
      url: `/api/analyzer/tasks/${taskId}/logs`,
      params
    })
  }

  // 获取系统日志
  static getSystemLogs(params: LogQueryParams = {}) {
    return request.get<SystemLogsResponse>({
      url: '/api/analyzer/system/logs',
      params
    })
  }

  // ========================================
  // 配置管理
  // ========================================

  // 获取分析器配置
  static getAnalyzerConfig() {
    return request.get<AnalyzerConfigResponse>({
      url: '/api/analyzer/config'
    })
  }

  // 更新分析器配置
  static updateAnalyzerConfig(config: AnalyzerConfig) {
    return request.put<AnalyzerOperationResponse>({
      url: '/api/analyzer/config',
      data: config
    })
  }

  // 获取默认算法配置
  static getDefaultAlgorithmConfig(algoId: string) {
    return request.get<AlgorithmConfigResponse>({
      url: `/api/analyzer/algorithms/${algoId}/config`
    })
  }

  // ========================================
  // 统计分析功能
  // ========================================

  // 获取分析器总体统计
  static getAnalyzerStatistics(params: StatisticsQueryParams = {}) {
    return request.get<AnalyzerStatisticsResponse>({
      url: '/api/analyzer/statistics',
      params
    })
  }

  // 获取任务执行统计
  static getTaskExecutionStats(params: StatisticsQueryParams = {}) {
    return request.get<TaskExecutionStatsResponse>({
      url: '/api/analyzer/tasks/statistics',
      params
    })
  }

  // 获取资源使用统计
  static getResourceUsageStats(params: StatisticsQueryParams = {}) {
    return request.get<ResourceUsageStatsResponse>({
      url: '/api/analyzer/system/resource-usage',
      params
    })
  }
}

// ========================================
// 查询参数类型定义
// ========================================

// 任务查询参数
export interface TaskQueryParams {
  status?: 'active' | 'inactive' | 'error' | 'pending'
  stream_id?: string
  algo_id?: string
}

// 性能查询参数
export interface PerformanceQueryParams {
  time_range?: '1h' | '6h' | '24h' | '7d' | '30d'
  metric_type?: 'cpu' | 'memory' | 'gpu' | 'fps' | 'all'
}

// 日志查询参数
export interface LogQueryParams {
  level?: 'debug' | 'info' | 'warning' | 'error'
  start_time?: string
  end_time?: string
  limit?: number
}

// 统计查询参数
export interface StatisticsQueryParams {
  start_time?: string
  end_time?: string
  group_by?: 'hour' | 'day' | 'week' | 'month'
}

// ========================================
// 请求数据类型定义
// ========================================

// 任务创建请求
export interface TaskCreateRequest {
  name: string
  description?: string
  stream_id: string
  algorithm_id: string  // 与后端保持一致（不是algo_id）
  enable_output?: boolean
  output_url?: string
}

// 任务更新请求
export interface TaskUpdateRequest {
  name?: string
  description?: string
  enable_output?: boolean
  output_url?: string
}

// 批量任务操作请求
export interface TaskBatchRequest {
  task_ids: string[]
  operation: 'start' | 'stop' | 'delete' | 'restart'
}

// 告警配置
export interface AlarmConfig {
  enabled: boolean
  pre_seconds?: number
  post_seconds?: number
  save_video?: boolean
  save_images?: boolean
  confidence_threshold?: number
}

// 分析器配置
export interface AnalyzerConfig {
  max_concurrent_tasks?: number
  default_fps_limit?: number
  enable_gpu?: boolean
  gpu_memory_limit?: number
  log_level?: 'debug' | 'info' | 'warning' | 'error'
  auto_restart_on_error?: boolean
}

// ========================================
// 响应数据类型定义
// ========================================

// 分析器操作响应
export interface AnalyzerOperationResponse {
  success: boolean
  message: string
  timestamp: string
}

// 分析器状态响应
export interface AnalyzerStatusResponse {
  service_status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error'
  active_tasks: number
  total_tasks: number
  system_resources: {
    cpu_usage: number
    memory_usage: number
    gpu_usage?: number
    disk_usage: number
  }
  uptime: number
  last_restart: string
  version: string
}

// 任务列表项
export interface TaskItem {
  task_id: string
  name: string
  description?: string
  stream_id: string
  algorithm_id: string
  status: 'active' | 'inactive' | 'error' | 'pending'
  config?: string  // JSON字符串
  created_at: string
  updated_at: string
  runtime_status?: TaskRuntimeInfo
}

// 任务运行时信息
export interface TaskRuntimeInfo {
  is_running: boolean
  fps?: number
  frame_count?: number
  error_count?: number
  last_frame_time?: string
  processing_time?: number
}

// 任务列表响应
export interface TaskListResponse {
  code?: number
  data?: TaskItem[]
  msg?: string
}

// 任务详情响应
export interface TaskDetailResponse {
  code?: number
  data?: TaskItem
  msg?: string
}

// 任务操作响应
export interface TaskOperationResponse {
  success: boolean
  task_id?: string
  message: string
}

// 批量操作响应
export interface TaskBatchResponse {
  success: boolean
  processed_count: number
  failed_count: number
  results: {
    task_id: string
    success: boolean
    message: string
  }[]
}

// 任务运行状态响应
export interface TaskRuntimeStatusResponse {
  task_id: string
  runtime_info: TaskRuntimeInfo
  last_update: string
}

// 任务性能响应
export interface TaskPerformanceResponse {
  task_id: string
  metrics: {
    timestamp: string
    fps: number
    cpu_usage: number
    memory_usage: number
    processing_time: number
  }[]
  summary: {
    avg_fps: number
    avg_cpu: number
    avg_memory: number
    max_processing_time: number
  }
}

// 系统性能响应
export interface SystemPerformanceResponse {
  system_metrics: {
    timestamp: string
    cpu_usage: number
    memory_usage: number
    gpu_usage?: number
    disk_usage: number
    active_tasks: number
  }[]
  summary: {
    avg_cpu: number
    avg_memory: number
    max_memory: number
    peak_tasks: number
  }
}

// 日志响应
export interface TaskLogsResponse {
  task_id: string
  logs: LogEntry[]
  total: number
}

export interface SystemLogsResponse {
  logs: LogEntry[]
  total: number
}

export interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warning' | 'error'
  message: string
  source?: string
  task_id?: string
}

// 配置响应
export interface AnalyzerConfigResponse {
  config: AnalyzerConfig
  last_updated: string
}

export interface AlgorithmConfigResponse {
  algo_id: string
  config: {
    name: string
    model_path: string
    input_size: [number, number]
    confidence_threshold: number
    nms_threshold: number
    [key: string]: any
  }
}

// 统计响应
export interface AnalyzerStatisticsResponse {
  total_tasks: number
  active_tasks: number
  total_processed_frames: number
  total_detections: number
  average_fps: number
  uptime_hours: number
  error_rate: number
  resource_usage: {
    avg_cpu: number
    avg_memory: number
    peak_memory: number
  }
}

export interface TaskExecutionStatsResponse {
  task_performance: {
    task_id: string
    task_name: string
    total_frames: number
    total_detections: number
    avg_fps: number
    avg_processing_time: number
    error_count: number
  }[]
  overall_stats: {
    total_tasks: number
    total_frames: number
    avg_system_fps: number
    total_runtime_hours: number
  }
}

export interface ResourceUsageStatsResponse {
  time_series: {
    timestamp: string
    cpu_usage: number
    memory_usage: number
    gpu_usage?: number
    task_count: number
  }[]
  peak_usage: {
    max_cpu: number
    max_memory: number
    max_gpu?: number
    max_concurrent_tasks: number
    peak_time: string
  }
}

// ========================================
// 枚举和常量
// ========================================

// 任务状态
export enum TaskStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending'
}

// 分析器服务状态
export enum AnalyzerServiceStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  STARTING = 'starting',
  STOPPING = 'stopping',
  ERROR = 'error'
}

// 日志级别
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

// ========================================
// 工具类
// ========================================

export class AnalyzerUtils {
  /**
   * 获取任务状态显示文本
   */
  static getTaskStatusText(status: TaskStatus): string {
    const statusMap = {
      [TaskStatus.ACTIVE]: '运行中',
      [TaskStatus.INACTIVE]: '已停止',
      [TaskStatus.ERROR]: '错误',
      [TaskStatus.PENDING]: '待启动'
    }
    return statusMap[status] || status
  }

  /**
   * 获取任务状态颜色
   */
  static getTaskStatusColor(status: TaskStatus): string {
    const colorMap = {
      [TaskStatus.ACTIVE]: '#52c41a',    // 绿色
      [TaskStatus.INACTIVE]: '#d9d9d9',  // 灰色
      [TaskStatus.ERROR]: '#f5222d',     // 红色
      [TaskStatus.PENDING]: '#faad14'    // 橙色
    }
    return colorMap[status] || '#d9d9d9'
  }

  /**
   * 格式化FPS显示
   */
  static formatFPS(fps: number): string {
    return `${fps.toFixed(1)} FPS`
  }

  /**
   * 格式化处理时间
   */
  static formatProcessingTime(timeMs: number): string {
    if (timeMs < 1000) return `${timeMs.toFixed(0)}ms`
    return `${(timeMs / 1000).toFixed(2)}s`
  }

  /**
   * 格式化内存使用量
   */
  static formatMemoryUsage(memoryMB: number): string {
    if (memoryMB < 1024) return `${memoryMB.toFixed(0)} MB`
    return `${(memoryMB / 1024).toFixed(1)} GB`
  }

  /**
   * 计算任务运行时长
   */
  static calculateUptime(startTime: string): string {
    const start = new Date(startTime)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}天${hours}小时`
    if (hours > 0) return `${hours}小时${minutes}分钟`
    return `${minutes}分钟`
  }

  /**
   * 检查任务是否健康
   */
  static isTaskHealthy(task: TaskItem): boolean {
    if (task.status === TaskStatus.ERROR) return false
    if (task.runtime_status?.error_count && task.runtime_status.error_count > 10) return false
    if (task.runtime_status?.fps && task.runtime_status.fps < 1) return false
    return true
  }

  /**
   * 获取任务性能评级
   */
  static getTaskPerformanceRating(fps: number, processingTime: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (fps >= 25 && processingTime <= 50) return 'excellent'
    if (fps >= 15 && processingTime <= 100) return 'good'
    if (fps >= 5 && processingTime <= 200) return 'fair'
    return 'poor'
  }
} 