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
      msg: string
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
      user_info: User.UserInfo
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
      id: number
      username: string
      email?: string
      full_name?: string
      phone?: string
      avatar_url?: string
      is_active: boolean
      is_superuser: boolean
      roles: Array<{
        id: number
        role_code: string
        role_name: string
      }>
      created_at: string
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
      password?: string
      avatar_url?: string
      is_active?: boolean
      is_superuser?: boolean
      role_ids?: number[]
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
  }
}
