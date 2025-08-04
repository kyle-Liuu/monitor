import request from '@/utils/http'

/**
 * 角色管理API服务
 * 对接后端 /api/roles 接口
 */
export class RoleService {
  // 获取角色列表
  static getRolesList(params: RoleQueryParams = {}) {
    return request.get<RoleListResponse>({
      url: '/api/roles/list',
      params
    })
  }

  // 获取角色详情
  static getRoleDetail(roleId: string) {
    return request.get<RoleDetailResponse>({
      url: `/api/roles/${roleId}`
    })
  }

  // 创建角色
  static createRole(data: RoleCreateRequest) {
    return request.post<RoleOperationResponse>({
      url: '/api/roles',
      data
    })
  }

  // 更新角色
  static updateRole(roleId: string, data: RoleUpdateRequest) {
    return request.put<RoleOperationResponse>({
      url: `/api/roles/${roleId}`,
      data
    })
  }

  // 删除角色
  static deleteRole(roleId: string) {
    return request.del<RoleOperationResponse>({
      url: `/api/roles/${roleId}`
    })
  }

  // 批量操作角色
  static batchOperateRoles(data: RoleBatchRequest) {
    return request.post<RoleBatchResponse>({
      url: '/api/roles/batch',
      data
    })
  }

  // 获取角色统计信息
  static getRoleStatistics() {
    return request.get<RoleStatisticsResponse>({
      url: '/api/roles/statistics'
    })
  }

  // 检查角色编码是否可用
  static checkRoleCode(roleCode: string) {
    return request.get<RoleCodeCheckResponse>({
      url: `/api/roles/check-code/${roleCode}`
    })
  }
}

// 角色查询参数
export interface RoleQueryParams {
  skip?: number
  limit?: number
  keyword?: string      // 搜索关键词（角色名称、编码、描述）
  is_enabled?: boolean  // 状态过滤
}

// 角色创建请求
export interface RoleCreateRequest {
  role_code: string     // 角色编码，如 "R_MANAGER"
  role_name: string     // 角色名称，如 "管理员"
  description?: string  // 角色描述
  is_enabled?: boolean  // 是否启用，默认true
}

// 角色更新请求
export interface RoleUpdateRequest {
  role_name?: string    // 角色名称
  description?: string  // 角色描述
  is_enabled?: boolean  // 是否启用
  // 注意：role_code不可修改
}

// 角色信息
export interface RoleItem {
  role_id: string       // 角色ID
  role_code: string     // 角色编码
  role_name: string     // 角色名称
  description?: string  // 角色描述
  is_enabled: boolean   // 是否启用
  user_count: number    // 使用该角色的用户数
  created_at: string    // 创建时间
  updated_at: string    // 更新时间
}

// 角色列表响应
export interface RoleListResponse {
  roles: RoleItem[]
  total: number
  current: number
  size: number
}

// 角色详情响应 - 直接返回角色信息
export interface RoleDetailResponse extends RoleItem {}

// 角色操作响应
export interface RoleOperationResponse {
  success: boolean
  role_id: string
  operation: 'create' | 'update' | 'delete'
  message: string
  data?: any
}

// 批量操作请求
export interface RoleBatchRequest {
  operation: 'delete' | 'enable' | 'disable'
  role_ids: string[]
  force?: boolean  // 强制删除，即使有用户在使用
}

// 批量操作响应
export interface RoleBatchResponse {
  success: boolean
  message: string
  affected_count: number
  failed_roles?: {
    role_id: string
    role_code: string
    reason: string
  }[]
}

// 角色统计响应
export interface RoleStatisticsResponse {
  total_roles: number
  enabled_roles: number
  disabled_roles: number
  system_roles: number     // 系统内置角色数量
  custom_roles: number     // 自定义角色数量
  role_usage: {
    role_code: string
  role_name: string
  user_count: number
    usage_percentage: number
  }[]
}

// 角色编码检查响应
export interface RoleCodeCheckResponse {
  available: boolean
  message: string
  suggestion?: string  // 建议的可用编码
}

// 角色状态枚举
export enum RoleStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled'
}

// 系统内置角色常量
export const SYSTEM_ROLES = {
  SUPER: 'R_SUPER',    // 超级管理员
  ADMIN: 'R_ADMIN',    // 管理员
  USER: 'R_USER'       // 普通用户
} as const

// 角色权限检查工具函数
export class RoleUtils {
  /**
   * 检查是否为系统内置角色
   */
  static isSystemRole(roleCode: string): boolean {
    return Object.values(SYSTEM_ROLES).includes(roleCode as any)
  }

  /**
   * 检查角色编码格式是否正确
   */
  static validateRoleCode(roleCode: string): boolean {
    // 角色编码格式：R_开头，大写字母和下划线
    const pattern = /^R_[A-Z_]+$/
    return pattern.test(roleCode)
  }

  /**
   * 生成角色编码建议
   */
  static generateRoleCodeSuggestion(roleName: string): string {
    // 将中文角色名转换为英文编码建议
    const suggestions: Record<string, string> = {
      '管理员': 'R_MANAGER',
      '操作员': 'R_OPERATOR',
      '审核员': 'R_AUDITOR',
      '访客': 'R_GUEST'
    }
    
    return suggestions[roleName] || `R_${roleName.toUpperCase().replace(/\s+/g, '_')}`
  }

  /**
   * 格式化角色显示名称
   */
  static formatRoleDisplayName(roleCode: string, roleName: string): string {
    return `${roleName} (${roleCode})`
  }
} 