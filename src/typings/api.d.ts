/**
 * namespace: Api
 *
 * 所有接口相关类型定义
 * 在.vue文件使用会报错，需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 */
declare namespace Api {
  /** 基础HTTP类型 */
  namespace Http {
    /** 基础响应结构 - 统一后端响应格式 */
    interface BaseResponse<T = any> {
      /** 状态码：200=成功，其他=失败 */
      code: number
      /** 响应消息 */
      msg: string
      /** 响应数据 */
      data: T
    }

    /** 操作响应结构 */
    interface OperationResponse {
      /** 操作是否成功 */
      success: boolean
      /** 响应消息 */
      message: string
      /** 操作时间戳 */
      timestamp?: string
    }

    /** 列表响应结构 */
    interface ListResponse<T = any> {
      /** 数据项列表 */
      records?: T[]
      /** 数据项列表（部分接口使用） */
      items?: T[]
      /** 当前页码 */
      current?: number
      /** 页码（部分接口使用） */
      page?: number
      /** 每页大小 */
      size?: number
      /** 每页大小（部分接口使用） */
      page_size?: number
      /** 总记录数 */
      total: number
    }

    /** 批量操作响应 */
    interface BatchResponse {
      /** 操作是否成功 */
      success: boolean
      /** 成功处理数量 */
      processed_count: number
      /** 失败处理数量 */
      failed_count: number
      /** 响应消息 */
      message: string
      /** 详细结果 */
      details?: Array<{
        id: string
        success: boolean
        error?: string
      }>
    }
  }

  /** 通用类型 */
  namespace Common {
    /** 通用响应数据（兼容旧版本） */
    interface ResponseData<T = any> {
      success: boolean
      message: string
      data?: T
      code?: number
    }

    /** 分页参数 */
    interface PaginatingParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total?: number
    }

    /** 通用搜索参数 */
    interface PaginatingSearchParams {
      /** 当前页码 */
      current?: number
      /** 每页条数 */
      size?: number
      /** 搜索关键词 */
      keyword?: string
    }

    /** 查询参数 */
    interface QueryParams {
      /** 页码 */
      page?: number
      /** 每页大小 */
      page_size?: number
      /** 搜索关键词 */
      keyword?: string
      /** 状态过滤 */
      status?: string
      /** 开始时间 */
      start_time?: string
      /** 结束时间 */
      end_time?: string
    }

    /** 启用状态 */
    type EnableStatus = '1' | '2' | 'active' | 'inactive'

    /** 通用状态类型 */
    type StatusType = 'active' | 'inactive' | 'pending' | 'error' | 'success' | 'running' | 'stopped'

    /** 唯一标识符类型 */
    type UniqueId = string

    /** 时间戳类型 */
    type Timestamp = string

    /** 标签数组类型 */
    type Tags = string[]

    /** 创建请求基础类型 */
    interface CreateRequest {
      name: string
      description?: string
    }

    /** 更新请求基础类型 */
    interface UpdateRequest {
      name?: string
      description?: string
    }

    /** 带有时间戳的基础实体 */
    interface BaseEntity {
      created_at: Timestamp
      updated_at?: Timestamp
    }

    /** 带有创建者信息的实体 */
    interface CreatedEntity extends BaseEntity {
      createBy?: string
      updateBy?: string
    }
  }

  /** 认证相关类型 */
  namespace Auth {
    /** 登录参数 */
    interface LoginParams {
      userName: string
      password: string
    }

    /** 登录响应 */
    interface LoginResponse {
      token: string
      refreshToken?: string
      expires_in?: number
    }

    /** 用户权限信息 */
    interface UserPermissions {
      roles: string[]
      buttons: string[]
      menus: string[]
    }
  }

  /** 用户相关类型 */
  namespace User {
    /** 用户信息响应 */
    interface UserInfoResponse extends Http.BaseResponse<UserInfo> {}

    /** 用户列表响应 */
    interface UserListResponse extends Http.BaseResponse<Http.ListResponse<UserListItem>> {}

    /** 用户操作响应 */
    interface UserOperationResponse extends Http.OperationResponse {
      user_id?: string
    }

    /** 用户信息 */
    interface UserInfo {
      userId: Common.UniqueId
      userName: string
      roles: string[]
      buttons: string[]
      avatar?: string
      email?: string
      fullName?: string
      mobile?: string
      tags?: Tags
    }

    /** 用户列表项 */
    interface UserListItem extends Common.CreatedEntity {
      id: Common.UniqueId
      avatar: string
      status: Common.EnableStatus
      userName: string
      userGender: string
      nickName: string
      userPhone: string
      userEmail: string
      userRoles: string[]
      userTags?: Tags
    }

    /** 用户创建请求 */
    interface UserCreateRequest extends Common.CreateRequest {
      username: string
      password: string
      email: string
      role: string
      full_name?: string
      mobile?: string
      tags?: string
    }

    /** 用户更新请求 */
    interface UserUpdateRequest extends Common.UpdateRequest {
      username?: string
      email?: string
      role?: string
      full_name?: string
      mobile?: string
      tags?: string
      is_active?: boolean
    }
  }

  /** 角色相关类型 */
  namespace Role {
    /** 角色列表响应 */
    interface RoleListResponse extends Http.BaseResponse<Http.ListResponse<RoleItem>> {}

    /** 角色详情响应 */
    interface RoleDetailResponse extends Http.BaseResponse<RoleDetail> {}

    /** 角色操作响应 */
    interface RoleOperationResponse extends Http.OperationResponse {
      role_id?: string
    }

    /** 角色项 */
    interface RoleItem extends Common.BaseEntity {
      role_id: Common.UniqueId
      role_code: string
      role_name: string
      description?: string
      is_enabled: boolean
      user_count?: number
    }

    /** 角色详情 */
    interface RoleDetail extends RoleItem {
      permissions?: string[]
      menu_access?: string[]
    }

    /** 角色创建请求 */
    interface RoleCreateRequest {
      role_code: string
      role_name: string
      description?: string
      is_enabled?: boolean
    }

    /** 角色更新请求 */
    interface RoleUpdateRequest {
      role_name?: string
      description?: string
      is_enabled?: boolean
    }
  }

  /** 组织相关类型 */
  namespace Organization {
    /** 组织树响应 */
    interface OrganizationTreeResponse extends Http.BaseResponse<OrganizationNode[]> {}

    /** 组织列表响应 */
    interface OrganizationListResponse extends Http.BaseResponse<Http.ListResponse<OrganizationItem>> {}

    /** 组织操作响应 */
    interface OrganizationOperationResponse extends Http.OperationResponse {
      org_id?: string
    }

    /** 组织节点（树形结构） */
    interface OrganizationNode extends Common.BaseEntity {
      org_id: Common.UniqueId
      name: string
      parent_id?: string
      path?: string
      description?: string
      status: Common.StatusType
      sort_order: number
      stream_count?: number
      children?: OrganizationNode[]
    }

    /** 组织列表项 */
    interface OrganizationItem extends OrganizationNode {
      parent_name?: string
      level?: number
    }

    /** 组织创建请求 */
    interface OrganizationCreateRequest extends Common.CreateRequest {
      parent_id?: string
      status?: Common.StatusType
      sort_order?: number
    }

    /** 组织更新请求 */
    interface OrganizationUpdateRequest extends Common.UpdateRequest {
      status?: Common.StatusType
      sort_order?: number
    }
  }

  /** 视频流相关类型 */
  namespace Stream {
    /** 视频流列表响应 */
    interface StreamListResponse extends Http.BaseResponse<Http.ListResponse<StreamItem>> {}

    /** 视频流详情响应 */
    interface StreamDetailResponse extends Http.BaseResponse<StreamDetail> {}

    /** 视频流操作响应 */
    interface StreamOperationResponse extends Http.OperationResponse {
      stream_id?: string
    }

    /** 视频流项 */
    interface StreamItem extends Common.BaseEntity {
      stream_id: Common.UniqueId
      name: string
      url: string
      status: Common.StatusType
      protocol?: string
      is_forwarding?: boolean
      org_id?: string
      org_name?: string
      task_count?: number
    }

    /** 视频流详情 */
    interface StreamDetail extends StreamItem {
      tasks?: TaskInfo[]
      bindings?: OrganizationBindingInfo[]
      performance_stats?: StreamPerformanceStats
    }

    /** 视频流性能统计 */
    interface StreamPerformanceStats {
      fps?: number
      bitrate?: number
      resolution?: string
      uptime?: number
      error_count?: number
    }

    /** 视频流创建请求 */
    interface StreamCreateRequest extends Common.CreateRequest {
      url: string
      protocol?: string
      org_id?: string
    }

    /** 视频流更新请求 */
    interface StreamUpdateRequest extends Common.UpdateRequest {
      url?: string
      protocol?: string
      status?: Common.StatusType
    }

    /** 任务信息 */
    interface TaskInfo {
      task_id: string
      task_name: string
      algorithm_name: string
      status: Common.StatusType
    }

    /** 组织绑定信息 */
    interface OrganizationBindingInfo {
      binding_id: string
      org_id: string
      org_name: string
      created_at: Common.Timestamp
    }
  }

  /** 告警相关类型 */
  namespace Alarm {
    /** 告警列表响应 */
    interface AlarmListResponse extends Http.BaseResponse<Http.ListResponse<AlarmItem>> {}

    /** 告警详情响应 */
    interface AlarmDetailResponse extends Http.BaseResponse<AlarmDetail> {}

    /** 告警操作响应 */
    interface AlarmOperationResponse extends Http.OperationResponse {
      alarm_id?: string
    }

    /** 告警项 */
    interface AlarmItem extends Common.BaseEntity {
      alarm_id: Common.UniqueId
      task_id: string
      alarm_type: string
      confidence: number
      status: AlarmStatus
      level: AlarmLevel
      processed_by?: string
      processed_at?: Common.Timestamp
      process_comment?: string
      media_files?: AlarmMediaFiles
    }

    /** 告警详情 */
    interface AlarmDetail extends AlarmItem {
      task_info?: StreamTaskInfo
      detection_details?: DetectionDetails
      processor_info?: ProcessorInfo
    }

    /** 告警状态 */
    type AlarmStatus = 'new' | 'processed' | 'ignored'

    /** 告警级别 */
    type AlarmLevel = 'low' | 'medium' | 'high' | 'critical'

    /** 告警媒体文件 */
    interface AlarmMediaFiles {
      original_image?: string
      processed_image?: string
      video_clip?: string
    }

    /** 流任务信息 */
    interface StreamTaskInfo {
      task_name: string
      stream_id: string
      stream_name: string
      algorithm_id: string
      algorithm_name: string
    }

    /** 检测详情 */
    interface DetectionDetails {
      zone_info?: any
      algorithm_config?: any
      raw_result?: any
    }

    /** 处理人信息 */
    interface ProcessorInfo {
      processor_name: string
      processor_role: string
    }
  }

  /** 分析器相关类型 */
  namespace Analyzer {
    /** 任务列表响应 */
    interface TaskListResponse extends Http.BaseResponse<TaskItem[]> {}

    /** 任务详情响应 */
    interface TaskDetailResponse extends Http.BaseResponse<TaskItem> {}

    /** 任务操作响应 */
    interface TaskOperationResponse extends Http.OperationResponse {
      task_id?: string
    }

    /** 系统状态响应 */
    interface SystemStatusResponse extends Http.BaseResponse<SystemStatus> {}

    /** 任务项 */
    interface TaskItem extends Common.BaseEntity {
      task_id: Common.UniqueId
      name: string
      description?: string
      stream_id: string
      algorithm_id: string
      status: TaskStatus
      config?: string
      runtime_status?: TaskRuntimeInfo
    }

    /** 任务状态 */
    type TaskStatus = 'active' | 'inactive' | 'error' | 'pending'

    /** 任务运行时信息 */
    interface TaskRuntimeInfo {
      is_running: boolean
      fps?: number
      frame_count?: number
      error_count?: number
      last_frame_time?: Common.Timestamp
      processing_time?: number
    }

    /** 系统状态 */
    interface SystemStatus {
      service_status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error'
      active_tasks: number
      total_tasks: number
      system_resources: SystemResources
      uptime: number
      last_restart: Common.Timestamp
      version: string
    }

    /** 系统资源 */
    interface SystemResources {
      cpu_usage: number
      memory_usage: number
      gpu_usage?: number
      disk_usage: number
    }
  }

  /** WebSocket相关类型 */
  namespace WebSocket {
    /** WebSocket端点类型 */
    type EndpointType = 'alarms' | 'status'

    /** 基础WebSocket消息 */
    interface BaseMessage {
      type: string
      timestamp?: Common.Timestamp
      [key: string]: any
    }

    /** 告警WebSocket消息 */
    interface AlarmMessage extends BaseMessage {
      type: 'alarm_detected' | 'alarm_video_saved' | 'alarm_video_save_failed' | 'error' | 'pong'
      stream_id?: string
      alarm_id?: string
      video_path?: string
      message?: string
      data?: any
    }

    /** 状态WebSocket消息 */
    interface StatusMessage extends BaseMessage {
      type: 'initial_status' | 'status_update' | 'connection_stats' | 'error' | 'pong'
      data?: {
        active_tasks?: number
        total_tasks?: number
        system_resources?: Analyzer.SystemResources
        task_status?: Record<string, any>
        connections_by_type?: Record<string, number>
      }
      server_time?: Common.Timestamp
    }

    /** 连接状态 */
    interface ConnectionStatus {
      endpoint: string
      connected: boolean
      readyState: number
      reconnectAttempts: number
    }
  }

  /** 菜单相关类型 */
  namespace Menu {
    /** 菜单树响应 */
    interface MenuTreeResponse extends Http.BaseResponse<MenuNode[]> {}

    /** 菜单节点 */
    interface MenuNode {
      menu_id: Common.UniqueId
      name: string
      path?: string
      component?: string
      icon?: string
      parent_id?: string
      sort_order: number
      roles: string[]
      is_enabled: boolean
      children?: MenuNode[]
    }
  }

  /** 算法相关类型 */
  namespace Algorithm {
    /** 算法列表响应 */
    interface AlgorithmListResponse extends Http.BaseResponse<Http.ListResponse<AlgorithmItem>> {}

    /** 算法项 */
    interface AlgorithmItem extends Common.BaseEntity {
      algo_id: Common.UniqueId
      name: string
      version: string
      type: string
      package_name: string
      status: Common.StatusType
      description?: string
      config?: string
    }
  }

  /** 统计相关类型 */
  namespace Statistics {
    /** 通用统计数据 */
    interface BaseStats {
      total: number
      active: number
      inactive: number
      error: number
    }

    /** 时间序列数据点 */
    interface TimeSeriesPoint {
      timestamp: Common.Timestamp
      value: number
      label?: string
    }

    /** 趋势数据 */
    interface TrendData {
      period: string
      data: TimeSeriesPoint[]
      summary?: {
        average: number
        peak: number
        peak_time?: Common.Timestamp
      }
    }

    /** 分布数据 */
    interface DistributionData {
      [key: string]: number
    }
  }
}
