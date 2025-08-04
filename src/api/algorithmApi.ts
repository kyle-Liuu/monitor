import request from '@/utils/http'

/**
 * 算法管理API服务
 * 对接后端 /api/algorithms 接口
 */
export class AlgorithmService {
  // 获取算法列表
  static getAlgorithmList(params: {
    skip?: number
    limit?: number
    name?: string
    algorithm_type?: string
    status?: string
  } = {}) {
    return request.get<AlgorithmListResponse>({
      url: '/api/algorithms/',
      params: {
        skip: params.skip || 0,
        limit: params.limit || 100,
        ...params
      }
    })
  }

  // 获取算法详情
  static getAlgorithmDetail(algoId: string) {
    return request.get<AlgorithmDetailResponse>({
      url: `/api/algorithms/${algoId}`
    })
  }

  // 创建算法
  static createAlgorithm(data: AlgorithmCreateRequest) {
    return request.post<Api.Common.ResponseData>({
      url: '/api/algorithms/',
      data
    })
  }

  // 更新算法
  static updateAlgorithm(algoId: string, data: AlgorithmUpdateRequest) {
    return request.put<Api.Common.ResponseData>({
      url: `/api/algorithms/${algoId}`,
      data
    })
  }

  // 删除算法
  static deleteAlgorithm(algoId: string) {
    return request.del<Api.Common.ResponseData>({
      url: `/api/algorithms/${algoId}`
    })
  }

  // 上传算法包
  static uploadAlgorithmPackage(file: File, data: {
    name: string
    description?: string
    author?: string
    version?: string
  }) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', data.name)
    if (data.description) formData.append('description', data.description)
    if (data.author) formData.append('author', data.author)
    if (data.version) formData.append('version', data.version)

    return request.post<Api.Common.ResponseData>({
      url: '/api/algorithms/upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  // 测试算法
  static testAlgorithm(algoId: string, testData: {
    test_type: 'image' | 'video' | 'stream'
    test_data: string // base64 image or video url or stream url
    config?: Record<string, any>
  }) {
    return request.post<{
      success: boolean
      result?: any
      error?: string
      processing_time?: number
    }>({
      url: `/api/algorithms/${algoId}/test`,
      data: testData
    })
  }

  // 获取算法配置
  static getAlgorithmConfig(algoId: string) {
    return request.get<{
      config: Record<string, any>
      schema: Record<string, any>
    }>({
      url: `/api/algorithms/${algoId}/config`
    })
  }

  // 更新算法配置
  static updateAlgorithmConfig(algoId: string, config: Record<string, any>) {
    return request.post<Api.Common.ResponseData>({
      url: `/api/algorithms/${algoId}/config`,
      data: { config }
    })
  }

  // 启用/禁用算法
  static toggleAlgorithmStatus(algoId: string, status: 'active' | 'inactive') {
    return request.post<Api.Common.ResponseData>({
      url: `/api/algorithms/${algoId}/status`,
      data: { status }
    })
  }

  // 获取算法运行状态
  static getAlgorithmStats(algoId: string) {
    return request.get<{
      status: string
      instances: number
      usage_count: number
      last_used: string
      performance_metrics?: Record<string, any>
    }>({
      url: `/api/algorithms/${algoId}/stats`
    })
  }
}

// 算法类型定义
export interface AlgorithmListResponse {
  items: AlgorithmItem[]
  total: number
  skip: number
  limit: number
}

export interface AlgorithmItem {
  algo_id: string
  name: string
  version: string
  description: string
  algorithm_type: string
  path: string
  status: 'active' | 'inactive' | 'error'
  device_type: string
  author: string
  created_at: string
  updated_at: string
}

export interface AlgorithmDetailResponse {
  algo_id: string
  name: string
  version: string
  description: string
  algorithm_type: string
  path: string
  status: string
  device_type: string
  author: string
  config?: Record<string, any>
  schema?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface AlgorithmCreateRequest {
  name: string
  description?: string
  algorithm_type: string
  author?: string
  version?: string
  device_type?: string
}

export interface AlgorithmUpdateRequest extends Partial<AlgorithmCreateRequest> {
  status?: 'active' | 'inactive'
} 