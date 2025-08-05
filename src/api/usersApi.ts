import request from '@/utils/http'

/**
 * 用户管理API服务
 * 对接后端 /api/users 和 /api/login 接口
 */
export class UserService {
  // 登录
  static login(params: Api.Auth.LoginParams) {
    return request.post<Api.Auth.LoginResponse>({
      url: '/api/login',
      data: params // 使用data而不是params
    })
  }

  // 获取用户信息
  static getUserInfo() {
    return request.get<UserInfoResponse>({
      url: '/api/user/info'
      // 自定义请求头
      // headers: {
      //   'X-Custom-Header': 'your-custom-value'
      // }
    })
  }

  // 获取用户列表
  static getUserList(params: Api.Common.PaginatingSearchParams) {
    // console.log('发送用户列表请求参数:', params)
    return request.get<UserListResponse>({
      url: '/api/user/list',
      params
    })
  }

  // 创建用户
  static createUser(data: UserCreateRequest) {
    return request.post<Api.Common.ResponseData>({
      url: '/api/users',
      data
    })
  }

  // 更新用户信息
  static updateUser(userId: string, data: UserUpdateRequest) {
    return request.put<Api.Common.ResponseData>({
      url: `/api/user/${userId}`,
      data
    })
  }

  // 删除用户
  static deleteUser(userId: string) {
    return request.del<Api.Common.ResponseData>({
      url: `/api/user/${userId}`
    })
  }

  // 重置用户密码
  static resetUserPassword(userId: string, data: { newPassword: string }) {
    return request.post<Api.Common.ResponseData>({
      url: `/api/user/${userId}/reset-password`,
      data
    })
  }

  // 更新用户状态
  static updateUserStatus(userId: string, isActive: boolean) {
    return request.put<Api.Common.ResponseData>({  // 使用put替代patch
      url: `/api/user/${userId}/status`,
      data: { is_active: isActive }
    })
  }

  // 更新用户角色
  static updateUserRoles(userId: string, roles: string[]) {
    return request.put<Api.Common.ResponseData>({  // 使用put替代patch
      url: `/api/user/${userId}/roles`,
      data: { roles: roles.join(',') }  // 后端使用逗号分隔的字符串
    })
  }

  // 批量操作用户
  static batchOperateUsers(data: UserBatchRequest) {
    return request.post<UserBatchResponse>({
      url: '/api/user/batch',
      data
    })
  }

  // 获取用户统计信息
  static getUserStatistics() {
    return request.get<UserStatisticsResponse>({
      url: '/api/user/statistics'
    })
  }
}

// 扩展用户类型定义 - 新增的类型，避免与现有类型冲突
export interface UserInfoResponse {
  code: number
  data: Api.User.UserInfo
  msg: string
}

export interface UserListResponse {
  code: number
  data: {
    records: Api.User.UserListItem[]
    current: number
    size: number
    total: number
  }
  msg: string
}

export interface UserCreateRequest {
  username: string
  password: string
  email: string
  full_name?: string
  mobile?: string
  avatar?: string
  roles?: string[]  // 角色列表，如["R_USER"]
  tags?: string[]   // 标签列表
  is_active?: boolean
}

export interface UserUpdateRequest {
  username?: string
  email?: string
  full_name?: string
  mobile?: string
  avatar?: string
  roles?: string[]
  tags?: string[]
  is_active?: boolean
}

export interface UserBatchRequest {
  operation: 'delete' | 'activate' | 'deactivate' | 'update_roles'
  user_ids: string[]
  data?: {
    roles?: string[]
    is_active?: boolean
  }
}

export interface UserBatchResponse {
  success: boolean
  message: string
  affected_count: number
  failed_users?: {
    user_id: string
    reason: string
  }[]
}

export interface UserStatisticsResponse {
  total_users: number
  active_users: number
  role_statistics: {
    role_code: string
    role_name: string
    user_count: number
  }[]
  recent_logins: {
    date: string
    login_count: number
  }[]
}

// 扩展现有的Api命名空间，添加新的字段支持
declare global {
  namespace Api {
    namespace User {
      // 扩展现有的UserInfo接口，添加新字段
      interface UserInfo {
        fullName?: string
        mobile?: string
        tags?: string[]
        userTags?: string[]  // 兼容现有字段名
      }

      // 扩展现有的UserListItem接口
      interface UserListItem {
        userTags?: string[]  // 新增用户标签字段
        createTime?: string  // 创建时间
        updateTime?: string  // 更新时间
        createBy?: string    // 创建人
        updateBy?: string    // 更新人
      }
    }

    namespace Auth {
      // 登录参数
      interface LoginParams {
        userName: string  // 注意：后端期望的字段名
        password: string
      }

      // 登录响应
      interface LoginResponse {
        code: number
        data: {
          token: string
          refreshToken: string
          user_info?: User.UserInfo
        }
        msg: string
      }
    }
  }
}
