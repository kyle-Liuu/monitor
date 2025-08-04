import request from '@/utils/http'

/**
 * 组织结构管理API服务
 * 对接后端 /api/organizations 接口
 */
export class OrganizationService {
  // 获取组织树
  static getOrganizationTree() {
    return request.get<OrganizationTreeResponse>({
      url: '/api/organizations/tree'
    })
  }

  // 获取组织列表（平铺结构，支持分页）
  static getOrganizationList(params: OrganizationQueryParams = {}) {
    return request.get<OrganizationListResponse>({
      url: '/api/organizations/list',
      params
    })
  }

  // 获取组织详情
  static getOrganizationDetail(orgId: string) {
    return request.get<OrganizationDetailResponse>({
      url: `/api/organizations/${orgId}`
    })
  }

  // 创建组织
  static createOrganization(data: OrganizationCreateRequest) {
    return request.post<OrganizationOperationResponse>({
      url: '/api/organizations',
      data
    })
  }

  // 更新组织
  static updateOrganization(orgId: string, data: OrganizationUpdateRequest) {
    return request.put<OrganizationOperationResponse>({
      url: `/api/organizations/${orgId}`,
      data
    })
  }

  // 删除组织
  static deleteOrganization(orgId: string) {
    return request.del<OrganizationOperationResponse>({
      url: `/api/organizations/${orgId}`
    })
  }

  // 移动组织
  static moveOrganization(data: OrganizationMoveRequest) {
    return request.post<OrganizationOperationResponse>({
      url: '/api/organizations/move',
      data
    })
  }

  // 获取组织下的视频流（修正：设备就是视频流）
  static getOrganizationStreams(orgId: string) {
    return request.get<OrganizationStreamsResponse>({
      url: `/api/organizations/${orgId}/streams`
    })
  }

  // 批量操作组织
  static batchOperateOrganizations(data: OrganizationBatchRequest) {
    return request.post<OrganizationBatchResponse>({
      url: '/api/organizations/batch',
      data
    })
  }

  // 获取组织统计信息
  static getOrganizationStatistics() {
    return request.get<OrganizationStatisticsResponse>({
      url: '/api/organizations/statistics'
    })
  }

  // 验证组织名称是否可用
  static checkOrganizationName(name: string, parentId?: string) {
    return request.get<OrganizationNameCheckResponse>({
      url: '/api/organizations/check-name',
      params: { name, parent_id: parentId }
    })
  }

  // 获取组织路径（面包屑导航）
  static getOrganizationPath(orgId: string) {
    return request.get<OrganizationPathResponse>({
      url: `/api/organizations/${orgId}/path`
    })
  }
}

// 组织查询参数
export interface OrganizationQueryParams {
  current?: number      // 当前页码
  size?: number         // 每页大小
  keyword?: string      // 搜索关键词
  status?: 'active' | 'inactive'  // 状态过滤
  parent_id?: string    // 父组织ID过滤
}

// 组织节点（树结构）
export interface OrganizationNode {
  org_id: string
  name: string
  parent_id: string | null
  path: string // 组织路径，如 "/org1/org2/org3/"
  description?: string
  status: 'active' | 'inactive'
  sort_order: number
  created_at: string
  updated_at?: string
  children?: OrganizationNode[]
  stream_count?: number  // 修正字段名：device_count -> stream_count
}

// 组织列表项（平铺结构）
export interface OrganizationListItem {
  org_id: string
  name: string
  parent_id: string | null
  parent_name?: string   // 父组织名称
  description?: string
  status: 'active' | 'inactive'
  sort_order: number
  stream_count: number   // 绑定的视频流数量
  created_at: string
}

// 组织树响应
export interface OrganizationTreeResponse {
  organizations: OrganizationNode[]
  total: number
}

// 组织列表响应
export interface OrganizationListResponse {
  organizations: OrganizationListItem[]
  total: number
  current: number
  size: number
}

// 组织详情响应
export interface OrganizationDetailResponse {
  org_id: string
  name: string
  parent_id: string | null
  parent_name?: string
  path: string
  description?: string
  status: 'active' | 'inactive'
  sort_order: number
  stream_count: number
  children_count: number
  created_at: string
  updated_at: string
}

// 组织创建请求
export interface OrganizationCreateRequest {
  name: string
  parent_id: string | null
  description?: string
  status?: 'active' | 'inactive'
  sort_order?: number
}

// 组织更新请求
export interface OrganizationUpdateRequest {
  name?: string
  description?: string
  status?: 'active' | 'inactive'
  sort_order?: number
}

// 组织移动请求
export interface OrganizationMoveRequest {
  org_id: string
  new_parent_id: string | null
  update_children_path?: boolean // 是否更新子组织路径
}

// 组织操作响应
export interface OrganizationOperationResponse {
  success: boolean
  org_id: string
  operation: 'create' | 'update' | 'delete' | 'move'
  message: string
  data?: any
}

// 组织下的视频流（修正：设备就是视频流）
export interface OrganizationStream {
  stream_id: string
  name: string
  url: string
  protocol: string
  status: 'active' | 'inactive'
  is_forwarding: boolean  // 是否正在转发
  org_id: string
  org_name: string
  created_at: string
}

// 组织视频流响应
export interface OrganizationStreamsResponse {
  streams: OrganizationStream[]  // 修正：devices -> streams
  total: number
}

// 批量操作请求
export interface OrganizationBatchRequest {
  operation: 'delete' | 'activate' | 'deactivate' | 'move'
  org_ids: string[]
  data?: {
    new_parent_id?: string    // 用于批量移动
    status?: 'active' | 'inactive'
  }
}

// 批量操作响应
export interface OrganizationBatchResponse {
  success: boolean
  message: string
  affected_count: number
  failed_organizations?: {
    org_id: string
    name: string
    reason: string
  }[]
}

// 组织统计响应
export interface OrganizationStatisticsResponse {
  total_organizations: number
  active_organizations: number
  inactive_organizations: number
  max_depth: number  // 最大层级深度
  total_streams: number
  organization_levels: {
    level: number
    count: number
  }[]
  top_organizations: {
    org_id: string
    name: string
    stream_count: number
  }[]
}

// 组织名称检查响应
export interface OrganizationNameCheckResponse {
  available: boolean
  message: string
  suggestion?: string
}

// 组织路径响应（面包屑导航）
export interface OrganizationPathResponse {
  path: {
    org_id: string
    name: string
    level: number
  }[]
  full_path: string
}

// 组织状态枚举
export enum OrganizationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

// 组织工具类
export class OrganizationUtils {
  /**
   * 格式化组织路径显示
   */
  static formatPath(path: string): string {
    return path.replace(/\//g, ' > ').replace(/^>/, '').trim()
  }

  /**
   * 计算组织层级深度
   */
  static getDepth(path: string): number {
    return (path.match(/\//g) || []).length - 1
  }

  /**
   * 检查是否为根组织
   */
  static isRootOrganization(parentId: string | null): boolean {
    return parentId === null || parentId === ''
  }

  /**
   * 构建组织全名（包含层级）
   */
  static buildFullName(name: string, path: string): string {
    const depth = this.getDepth(path)
    const prefix = '　'.repeat(depth) // 使用全角空格缩进
    return `${prefix}${name}`
  }

  /**
   * 过滤组织树（根据关键词）
   */
  static filterTree(organizations: OrganizationNode[], keyword: string): OrganizationNode[] {
    const filtered: OrganizationNode[] = []
    
    for (const org of organizations) {
      if (org.name.toLowerCase().includes(keyword.toLowerCase()) ||
          org.description?.toLowerCase().includes(keyword.toLowerCase())) {
        // 如果当前节点匹配，包含所有子节点
        filtered.push({
          ...org,
          children: org.children || []
        })
      } else {
        // 如果当前节点不匹配，递归检查子节点
        const filteredChildren = this.filterTree(org.children || [], keyword)
        if (filteredChildren.length > 0) {
          filtered.push({
            ...org,
            children: filteredChildren
          })
        }
      }
    }
    
    return filtered
  }
} 