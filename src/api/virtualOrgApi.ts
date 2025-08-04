import request from '@/utils/http'

/**
 * 虚拟组织管理API服务
 * 对接后端 /api/virtual-orgs 接口
 * 
 * 说明：虚拟组织实际上是基于组织绑定（OrganizationBinding）的简化概念，
 * 主要用于前端的分组展示和管理组织与视频流的绑定关系。
 */
export class VirtualOrgService {
  // ========================================
  // 组织绑定管理（核心业务逻辑）
  // ========================================

  // 创建组织和视频流的绑定关系
  static createOrganizationBinding(data: OrganizationBindingCreateRequest) {
    return request.post<OrganizationBindingResponse>({
      url: '/api/virtual-orgs/bindings',
      data
    })
  }

  // 获取组织绑定列表
  static getOrganizationBindings(params: OrganizationBindingQueryParams = {}) {
    return request.get<OrganizationBindingListResponse>({
      url: '/api/virtual-orgs/bindings',
      params
    })
  }

  // 删除组织绑定关系
  static deleteOrganizationBinding(bindingId: string) {
    return request.del<OrganizationBindingResponse>({
      url: `/api/virtual-orgs/bindings/${bindingId}`
    })
  }

  // 批量创建组织绑定
  static batchCreateOrganizationBindings(data: OrganizationBindingBatchRequest) {
    return request.post<OrganizationBindingBatchResponse>({
      url: '/api/virtual-orgs/bindings/batch',
      data
    })
  }

  // 批量删除组织绑定
  static batchDeleteOrganizationBindings(data: OrganizationBindingBatchDeleteRequest) {
    return request.del<OrganizationBindingBatchResponse>({
      url: '/api/virtual-orgs/bindings/batch',
      data
    })
  }

  // 获取组织下的所有绑定的视频流
  static getOrganizationStreams(orgId: string) {
    return request.get<OrganizationBindingStreamsResponse>({
      url: `/api/virtual-orgs/bindings/organization/${orgId}/streams`
    })
  }

  // 获取视频流的组织绑定信息
  static getStreamOrganizations(streamId: string) {
    return request.get<StreamOrganizationsResponse>({
      url: `/api/virtual-orgs/bindings/stream/${streamId}/organizations`
    })
  }

  // ========================================
  // 虚拟组织展示（简化的分组展示）
  // ========================================

  // 获取虚拟组织列表（用于前端分组展示）
  static getVirtualOrgList(params: VirtualOrgQueryParams = {}) {
    return request.get<VirtualOrgListResponse>({
      url: '/api/virtual-orgs',
      params
    })
  }

  // 创建虚拟组织（简化实现）
  static createVirtualOrg(data: VirtualOrgCreateRequest) {
    return request.post<VirtualOrgCreateResponse>({
      url: '/api/virtual-orgs',
      data
    })
  }

  // 更新虚拟组织
  static updateVirtualOrg(virtualOrgId: string, data: VirtualOrgUpdateRequest) {
    return request.put<VirtualOrgResponse>({
      url: `/api/virtual-orgs/${virtualOrgId}`,
      data
    })
  }

  // 删除虚拟组织
  static deleteVirtualOrg(virtualOrgId: string) {
    return request.del<VirtualOrgResponse>({
      url: `/api/virtual-orgs/${virtualOrgId}`
    })
  }

  // ========================================
  // 工具方法
  // ========================================

  // 检查绑定关系是否存在
  static checkBindingExists(orgId: string, streamId: string) {
    return request.get<BindingCheckResponse>({
      url: '/api/virtual-orgs/bindings/check',
      params: { org_id: orgId, stream_id: streamId }
    })
  }

  // 获取绑定统计信息
  static getBindingStatistics() {
    return request.get<BindingStatisticsResponse>({
      url: '/api/virtual-orgs/bindings/statistics'
    })
  }
}

// ========================================
// 组织绑定相关类型定义
// ========================================

// 组织绑定创建请求
export interface OrganizationBindingCreateRequest {
  org_id: string      // 组织ID
  stream_id: string   // 视频流ID
}

// 组织绑定查询参数
export interface OrganizationBindingQueryParams {
  skip?: number       // 跳过数量
  limit?: number      // 返回数量
  org_id?: string     // 按组织过滤
  stream_id?: string  // 按视频流过滤
}

// 组织绑定信息
export interface OrganizationBindingInfo {
  binding_id: string
  org_id: string
  org_name: string
  stream_id: string
  stream_name: string
  stream_url: string
  created_at: string
}

// 组织绑定响应
export interface OrganizationBindingResponse {
  success: boolean
  binding_id?: string
  message: string
}

// 组织绑定列表响应
export interface OrganizationBindingListResponse {
  bindings: OrganizationBindingInfo[]
  total: number
  skip: number
  limit: number
}

// 批量绑定请求
export interface OrganizationBindingBatchRequest {
  org_id: string        // 目标组织ID
  stream_ids: string[]  // 要绑定的视频流ID列表
}

// 批量删除绑定请求
export interface OrganizationBindingBatchDeleteRequest {
  binding_ids: string[]  // 要删除的绑定ID列表
}

// 批量操作响应
export interface OrganizationBindingBatchResponse {
  success: boolean
  org_id?: string
  processed_count: number
  failed_count: number
  message: string
  details?: {
    stream_id: string
    success: boolean
    message: string
  }[]
}

// 组织下的视频流响应
export interface OrganizationBindingStreamsResponse {
  org_id: string
  org_name: string
  streams: {
    stream_id: string
    stream_name: string
    stream_url: string
    protocol: string
    status: string
    is_forwarding: boolean
    binding_id: string
    created_at: string
  }[]
  total: number
}

// 视频流的组织绑定响应
export interface StreamOrganizationsResponse {
  stream_id: string
  stream_name: string
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
// 虚拟组织相关类型定义（简化版）
// ========================================

// 虚拟组织查询参数
export interface VirtualOrgQueryParams {
  skip?: number       // 跳过数量
  limit?: number      // 返回数量
  name?: string       // 名称搜索
}

// 虚拟组织信息
export interface VirtualOrgItem {
  virtual_org_id: string
  name: string
  description?: string
  org_count: number     // 包含的组织数量
  stream_count: number  // 包含的视频流数量
  created_at: string
  updated_at?: string
}

// 虚拟组织列表响应
export interface VirtualOrgListResponse {
  virtual_orgs: VirtualOrgItem[]
  total: number
}

// 虚拟组织创建请求
export interface VirtualOrgCreateRequest {
  name: string
  description?: string
}

// 虚拟组织更新请求
export interface VirtualOrgUpdateRequest {
  name?: string
  description?: string
}

// 虚拟组织创建响应
export interface VirtualOrgCreateResponse {
  success: boolean
  virtual_org_id: string
  name: string
  message: string
}

// 虚拟组织操作响应
export interface VirtualOrgResponse {
  success: boolean
  virtual_org_id: string
  message: string
}

// ========================================
// 工具响应类型
// ========================================

// 绑定检查响应
export interface BindingCheckResponse {
  exists: boolean
  binding_id?: string
  message: string
}

// 绑定统计响应
export interface BindingStatisticsResponse {
  total_bindings: number
  total_organizations: number
  total_streams: number
  organizations_with_streams: number
  streams_with_organizations: number
  avg_streams_per_organization: number
  top_organizations: {
    org_id: string
    org_name: string
    stream_count: number
  }[]
  unbound_streams: {
    stream_id: string
    stream_name: string
  }[]
}

// ========================================
// 工具类和常量
// ========================================

// 绑定操作类型
export enum BindingOperation {
  CREATE = 'create',
  DELETE = 'delete',
  BATCH_CREATE = 'batch_create',
  BATCH_DELETE = 'batch_delete'
}

// 虚拟组织工具类
export class VirtualOrgUtils {
  /**
   * 检查是否为有效的绑定关系
   */
  static isValidBinding(orgId: string, streamId: string): boolean {
    return !!(orgId && streamId && orgId.trim() && streamId.trim())
  }

  /**
   * 格式化绑定显示名称
   */
  static formatBindingDisplayName(orgName: string, streamName: string): string {
    return `${orgName} → ${streamName}`
  }

  /**
   * 计算组织的流媒体覆盖率
   */
  static calculateStreamCoverage(totalStreams: number, boundStreams: number): number {
    if (totalStreams === 0) return 0
    return Math.round((boundStreams / totalStreams) * 100)
  }

  /**
   * 生成虚拟组织建议名称
   */
  static generateVirtualOrgName(orgName: string): string {
    return `虚拟分组-${orgName}`
  }

  /**
   * 批量操作结果汇总
   */
  static summarizeBatchResult(response: OrganizationBindingBatchResponse): string {
    const { processed_count, failed_count } = response
    const total = processed_count + failed_count
    
    if (failed_count === 0) {
      return `全部操作成功，共处理 ${total} 项`
    } else {
      return `操作完成，成功 ${processed_count} 项，失败 ${failed_count} 项`
    }
  }

  /**
   * 过滤绑定列表
   */
  static filterBindings(
    bindings: OrganizationBindingInfo[], 
    keyword: string
  ): OrganizationBindingInfo[] {
    if (!keyword.trim()) return bindings
    
    const lowerKeyword = keyword.toLowerCase()
    return bindings.filter(binding => 
      binding.org_name.toLowerCase().includes(lowerKeyword) ||
      binding.stream_name.toLowerCase().includes(lowerKeyword)
    )
  }
} 