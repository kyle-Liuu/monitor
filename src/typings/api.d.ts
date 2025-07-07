/**
 * namespace: Api
 *
 * 所有接口相关类型定义
 */
declare namespace Api {
  /** 基础类型 */
  namespace Http {
    /** 基础响应 */
    interface BaseResponse<T = any> {
      // 状态码
      code: number
      // 消息
      message: string
      // 数据
      data: T
    }
  }

  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginationParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
    }

    /** 分页结果 */
    interface PaginationResult<T = any> {
      records: T[]
      current: number
      size: number
      total: number
    }

    /** 消息结果 */
    interface MessageResult {
      message: string
    }
  }

  /** 上传类型 */
  namespace Upload {
    /** 头像上传响应 */
    interface AvatarUploadResponse {
      /** 头像路径 */
      avatarPath: string
    }

    /** 文件上传参数 */
    interface FileUploadParams {
      /** 文件对象 */
      file: File
    }
  }

  /** 认证类型 */
  namespace Auth {
    /** 登录参数 */
    interface LoginParams {
      username: string
      password: string
    }

    /** 登录响应 */
    interface LoginResponse {
      token: string
      refreshToken: string
      user_info: User.UserInfo
    }

    /** 刷新令牌响应 */
    interface RefreshTokenResponse {
      token: string
      refreshToken: string
    }

    /** 注册参数 */
    interface RegisterParams {
      username: string
      password: string
      email?: string
      full_name?: string
      phone?: string
    }
  }

  /** 用户类型 */
  namespace User {
    /** 用户信息 */
    interface UserInfo {
      user_id: string
      username?: string
      email?: string
      full_name?: string
      phone?: string
      avatar?: string
      gender?: number
      status?: number
      is_active?: boolean
      is_superuser?: boolean
      roles?: Role[]
      created_at?: string
      updated_at?: string
      description?: string
      tags?: string[]
    }

    /** 创建用户参数 */
    interface CreateUserParams {
      username: string
      password: string
      email?: string
      full_name?: string
      phone?: string
      is_active?: boolean
      is_superuser?: boolean
      role_ids?: number[]
    }

    /** 更新用户参数 */
    interface UpdateUserParams {
      email?: string
      full_name?: string
      phone?: string
      avatar?: string
      gender?: number
      description?: string
      tags?: string[]
      is_active?: boolean
      is_superuser?: boolean
      role_ids?: number[]
    }

    /** 修改密码参数 */
    interface ChangePasswordParams {
      current_password: string
      new_password: string
    }

    /** 原项目用户列表数据 */
    interface UserListData {
      records: UserInfo[]
      current: number
      size: number
      total: number
    }

    /** 用户列表结果 */
    type UserListResult = Common.PaginationResult<UserInfo>

    /** 用户角色 */
    interface Role {
      id: number
      role_code: string
      role_name: string
      description?: string
    }

    /** 登录请求 */
    interface LoginRequest {
      username: string
      password: string
    }

    /** 登录响应 */
    interface LoginResponse {
      token: string
      refreshToken: string
      user_info: UserInfo
    }

    /** 刷新令牌请求 */
    interface RefreshTokenRequest {
      refresh_token: string
    }

    /** 刷新令牌响应 */
    interface RefreshTokenResponse {
      token: string
      refreshToken: string
    }
  }

  /** 角色类型 */
  namespace Role {
    /** 角色信息 */
    interface RoleInfo {
      id: number
      role_code: string
      role_name: string
      description?: string
      created_at: string
    }

    /** 创建角色参数 */
    interface CreateRoleParams {
      role_code: string
      role_name: string
      description?: string
    }

    /** 更新角色参数 */
    interface UpdateRoleParams {
      role_name?: string
      description?: string
    }

    /** 角色列表结果 */
    interface RoleListResult {
      records: RoleInfo[]
      current: number
      size: number
      total: number
    }
  }

  /** 组织类型 */
  namespace Organization {
    /** 组织信息 */
    interface OrganizationInfo {
      id: number
      name: string
      parent_id: number | null
      description: string
      address: string
      contact: string
      contact_phone: string
      created_at: string
      children?: OrganizationInfo[]
    }

    /** 创建组织参数 */
    interface CreateOrganizationParams {
      name: string
      parent_id?: number
      description?: string
      address?: string
      contact?: string
      contact_phone?: string
    }

    /** 更新组织参数 */
    interface UpdateOrganizationParams {
      name?: string
      description?: string
      address?: string
      contact?: string
      contact_phone?: string
    }

    /** 组织列表结果 */
    interface OrganizationListResult {
      total: number
      items: OrganizationInfo[]
    }
  }

  /** 虚拟组织类型 */
  namespace VirtualOrganization {
    /** 虚拟组织信息 */
    interface VirtualOrgInfo {
      id: number
      name: string
      description: string
      created_at: string
      updated_at: string
      videostreams: Array<{
        id: number
        name: string
      }>
    }

    /** 创建虚拟组织参数 */
    interface CreateVirtualOrgParams {
      name: string
      description?: string
      videostream_ids?: number[]
    }

    /** 更新虚拟组织参数 */
    interface UpdateVirtualOrgParams {
      name?: string
      description?: string
      videostream_ids?: number[]
    }

    /** 虚拟组织列表结果 */
    interface VirtualOrgListResult {
      total: number
      items: VirtualOrgInfo[]
    }

    /** 添加视频流参数 */
    interface AddStreamsParams {
      videostream_ids: number[]
    }
  }

  /** 视频流类型 */
  namespace VideoStream {
    /** 视频流信息 */
    interface VideoStreamInfo {
      id: number
      name: string
      url: string
      type: string
      status: number
      organization_id: number
      organization_name: string
      description?: string
      created_at: string
    }

    /** 创建视频流参数 */
    interface CreateVideoStreamParams {
      name: string
      url: string
      type: string
      organization_id: number
      description?: string
    }

    /** 更新视频流参数 */
    interface UpdateVideoStreamParams {
      name?: string
      url?: string
      type?: string
      status?: number
      organization_id?: number
      description?: string
    }

    /** 视频流列表结果 */
    interface VideoStreamListResult {
      records: VideoStreamInfo[]
      current: number
      size: number
      total: number
    }
  }

  /** 算法类型 */
  namespace Algorithm {
    /** 算法信息 */
    interface AlgorithmInfo {
      id: number
      name: string
      version: string
      description: string
      type: string
      status: number
      config: Record<string, any>
      created_at: string
    }

    /** 创建算法参数 */
    interface CreateAlgorithmParams {
      name: string
      version: string
      description?: string
      type: string
      config?: Record<string, any>
    }

    /** 更新算法参数 */
    interface UpdateAlgorithmParams {
      name?: string
      version?: string
      description?: string
      status?: number
      config?: Record<string, any>
    }

    /** 算法列表结果 */
    interface AlgorithmListResult {
      total: number
      items: AlgorithmInfo[]
    }

    /** 分配算法参数 */
    interface AssignAlgorithmParams {
      algorithm_ids: number[]
    }
  }

  /** 报警类型 */
  namespace Warning {
    /** 报警信息 */
    interface WarningInfo {
      id: number
      stream_id: number
      stream_name: string
      warning_type: string
      warning_level: number
      warning_time: string
      description: string
      status: number
      created_at: string
      image_url?: string
      details?: any
    }

    /** 报警查询参数 */
    interface WarningQueryParams {
      current?: number
      size?: number
      start_time?: string
      end_time?: string
      stream_id?: number
      warning_type?: string
      status?: number
    }

    /** 更新报警状态参数 */
    interface UpdateWarningStatusParams {
      status: number
    }

    /** 批量处理报警参数 */
    interface BatchProcessParams {
      warning_ids: number[]
      status: number
      notes?: string
    }

    /** 批量处理报警结果 */
    interface BatchProcessResult {
      processed_count: number
      processed_ids: number[]
      processed_at: string
    }

    /** 报警列表结果 */
    interface WarningListResult {
      records: WarningInfo[]
      current: number
      size: number
      total: number
    }

    /** 报警统计参数 */
    interface WarningStatsParams {
      start_time?: string
      end_time?: string
      stream_id?: number
    }

    /** 报警统计结果 */
    interface WarningStatsResult {
      total_count: number
      processed_count: number
      false_alarm_count: number
      pending_count: number
      by_type: Record<string, number>
      by_level: Record<number, number>
      by_time: Array<{ date: string; count: number }>
    }
  }

  /** 菜单类型 */
  namespace Menu {
    /** 菜单响应 */
    interface MenuResponse {
      menuList: any[]
    }
  }

  /** WebSocket类型 */
  namespace WebSocket {
    /** WebSocket选项 */
    interface WebSocketOptions {
      url: string
      onOpen?: (event: Event) => void
      onMessage?: (event: MessageEvent) => void
      onError?: (event: Event) => void
      onClose?: (event: CloseEvent) => void
    }
  }
}
