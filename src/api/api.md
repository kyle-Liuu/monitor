# AI智能监控系统后端接口设计

本文档列出AI智能监控系统的后端接口设计，包括算法管理、视频流管理、告警管理、数据分析和人脸识别库等模块。

## 1. 算法管理接口

```typescript
// 算法相关API
export class AlgorithmService {
  // 获取算法列表
  static getAlgorithmList(params: Api.Common.PaginatingSearchParams) {
    return request.get<Api.Algorithm.AlgorithmListData>({
      url: '/api/algorithm/list',
      params
    })
  }

  // 获取算法详情
  static getAlgorithmDetail(id: string) {
    return request.get<Api.Algorithm.AlgorithmDetail>({
      url: `/api/algorithm/detail/${id}`
    })
  }

  // 添加/编辑算法
  static saveAlgorithm(data: Api.Algorithm.AlgorithmSaveParams) {
    return request.post<Api.Common.ResponseData>({
      url: '/api/algorithm/save',
      data
    })
  }

  // 算法启用/禁用
  static toggleAlgorithmStatus(id: string, status: number) {
    return request.post<Api.Common.ResponseData>({
      url: '/api/algorithm/toggle',
      data: { id, status }
    })
  }

  // 算法检测参数配置
  static configureAlgorithm(data: Api.Algorithm.AlgorithmConfigParams) {
    return request.post<Api.Common.ResponseData>({
      url: '/api/algorithm/configure',
      data
    })
  }
}
```

## 2. 视频流管理接口

```typescript
// 视频流相关API
export class VideoStreamService {
  // 获取摄像头列表
  static getCameraList(params: Api.Common.PaginatingSearchParams) {
    return request.get<Api.VideoStream.CameraListData>({
      url: '/api/camera/list',
      params
    })
  }

  // 获取摄像头详情
  static getCameraDetail(id: string) {
    return request.get<Api.VideoStream.CameraDetail>({
      url: `/api/camera/detail/${id}`
    })
  }

  // 添加/编辑摄像头
  static saveCamera(data: Api.VideoStream.CameraSaveParams) {
    return request.post<Api.Common.ResponseData>({
      url: '/api/camera/save',
      data
    })
  }

  // 获取实时视频流（WebSocket接口）
  static getRealTimeStream(id: string) {
    // WebSocket连接
    return `/api/ws/stream/${id}`
  }

  // 视频回放
  static getVideoPlayback(params: Api.VideoStream.VideoPlaybackParams) {
    return request.get<Api.VideoStream.VideoPlaybackData>({
      url: '/api/video/playback',
      params
    })
  }

  // 组织机构管理
  static getOrganizationList() {
    return request.get<Api.VideoStream.OrganizationListData>({
      url: '/api/organization/list'
    })
  }

  // 虚拟绑定管理
  static getVirtualBindingList() {
    return request.get<Api.VideoStream.VirtualBindingListData>({
      url: '/api/virtual-organization/list'
    })
  }
}
```

## 3. 告警管理接口

```typescript
// 告警相关API
export class WarningService {
  // 获取告警列表
  static getWarningList(params: Api.Warning.WarningSearchParams) {
    return request.get<Api.Warning.WarningListData>({
      url: '/api/warning/list',
      params
    })
  }

  // 获取告警详情
  static getWarningDetail(id: string) {
    return request.get<Api.Warning.WarningDetail>({
      url: `/api/warning/detail/${id}`
    })
  }

  // 处理告警
  static handleWarning(data: Api.Warning.WarningHandleParams) {
    return request.post<Api.Common.ResponseData>({
      url: '/api/warning/handle',
      data
    })
  }

  // 告警统计
  static getWarningStatistics(params: Api.Warning.StatisticsParams) {
    return request.get<Api.Warning.StatisticsData>({
      url: '/api/warning/statistics',
      params
    })
  }

  // 告警推送配置
  static configurePush(data: Api.Warning.PushConfigParams) {
    return request.post<Api.Common.ResponseData>({
      url: '/api/warning/push/configure',
      data
    })
  }

  // 获取实时告警（WebSocket接口）
  static getRealTimeWarning() {
    // WebSocket连接
    return `/api/ws/warning`
  }
}
```

## 4. 数据分析接口

```typescript
// 数据分析相关API
export class AnalysisService {
  // 获取监控数据概览
  static getOverview() {
    return request.get<Api.Analysis.OverviewData>({
      url: '/api/analysis/overview'
    })
  }

  // 获取行为分析数据
  static getBehaviorAnalysis(params: Api.Analysis.AnalysisParams) {
    return request.get<Api.Analysis.BehaviorData>({
      url: '/api/analysis/behavior',
      params
    })
  }

  // 热力图数据
  static getHeatmapData(params: Api.Analysis.HeatmapParams) {
    return request.get<Api.Analysis.HeatmapData>({
      url: '/api/analysis/heatmap',
      params
    })
  }

  // 获取趋势分析
  static getTrendAnalysis(params: Api.Analysis.TrendParams) {
    return request.get<Api.Analysis.TrendData>({
      url: '/api/analysis/trend',
      params
    })
  }
}
```

## 5. 人脸识别库接口

```typescript
// 人脸库相关API
export class FaceRepository {
  // 获取人脸列表
  static getFaceList(params: Api.Face.FaceSearchParams) {
    return request.get<Api.Face.FaceListData>({
      url: '/api/face/list',
      params
    })
  }

  // 获取人脸详情
  static getFaceDetail(id: string) {
    return request.get<Api.Face.FaceDetail>({
      url: `/api/face/detail/${id}`
    })
  }

  // 添加/编辑人脸信息
  static saveFace(data: Api.Face.FaceSaveParams) {
    return request.post<Api.Common.ResponseData>({
      url: '/api/face/save',
      data
    })
  }

  // 人脸比对
  static compareFace(data: Api.Face.FaceCompareParams) {
    return request.post<Api.Face.FaceCompareResult>({
      url: '/api/face/compare',
      data
    })
  }

  // 获取人脸特征
  static extractFaceFeature(data: Api.Face.FaceExtractParams) {
    return request.post<Api.Face.FaceFeatureData>({
      url: '/api/face/extract',
      data
    })
  }
}
```

## 6. 组织列表接口

```typescript
// 组织列表API
export class OrganizationService {
  // 获取组织树
  static getOrganizationTree() {
    return request.get<Api.Organization.OrgTreeData>({
      url: '/api/organization/tree'
    })
  }

  // 添加组织
  static addOrganization(data: Api.Organization.OrgData) {
    return request.post<Api.Common.ResponseData>({
      url: '/api/organization/add',
      data
    })
  }

  // 更新组织
  static updateOrganization(data: Api.Organization.OrgData) {
    return request.put<Api.Common.ResponseData>({
      url: '/api/organization/update',
      data
    })
  }

  // 移动组织（更改上级组织）
  static moveOrganization(data: Api.Organization.OrgMoveParams) {
    return request.post<Api.Common.ResponseData>({
      url: '/api/organization/move',
      data
    })
  }

  // 删除组织
  static deleteOrganization(id: string) {
    return request.delete<Api.Common.ResponseData>({
      url: `/api/organization/delete/${id}`
    })
  }
}
```

## 7. 虚拟绑定接口

```typescript
// 虚拟绑定API
export class VirtualOrgService {
  // 获取虚拟绑定列表
  static getVirtualOrgList() {
    return request.get<Api.VirtualOrg.VirtualOrgListData>({
      url: '/api/virtualorg/list'
    })
  }

  // 获取虚拟绑定详情
  static getVirtualOrgDetail(id: string) {
    return request.get<Api.VirtualOrg.VirtualOrgDetail>({
      url: `/api/virtualorg/detail/${id}`
    })
  }

  // 创建/更新虚拟绑定
  static saveVirtualOrg(data: Api.VirtualOrg.VirtualOrgSaveParams) {
    return request.post<Api.Common.ResponseData>({
      url: '/api/virtualorg/save',
      data
    })
  }

  // 添加设备到虚拟绑定
  static addDeviceToVirtualOrg(data: Api.VirtualOrg.AddDeviceParams) {
    return request.post<Api.Common.ResponseData>({
      url: '/api/virtualorg/add-device',
      data
    })
  }

  // 从虚拟绑定移除设备
  static removeDeviceFromVirtualOrg(data: Api.VirtualOrg.RemoveDeviceParams) {
    return request.post<Api.Common.ResponseData>({
      url: '/api/virtualorg/remove-device',
      data
    })
  }
}
```

## 8. 组织与虚拟绑定关联关系

由于虚拟绑定和实体组织使用同一份组织列表数据，需要设计以下接口和数据类型来维护它们的关联关系：

```typescript
// 组织结构同步API
export class OrganizationSyncService {
  // 获取所有使用指定组织的虚拟绑定
  static getVirtualOrgsByOrg(orgId: string) {
    return request.get<Api.OrgSync.VirtualOrgsByOrgData>({
      url: `/api/orgsync/virtual-orgs-by-org/${orgId}`
    })
  }

  // 获取组织变更影响的所有虚拟绑定
  static getAffectedVirtualOrgs(orgId: string) {
    return request.get<Api.OrgSync.AffectedVirtualOrgsData>({
      url: `/api/orgsync/affected-virtual-orgs/${orgId}`
    })
  }

  // 获取组织变更影响的所有摄像头
  static getAffectedCameras(orgId: string) {
    return request.get<Api.OrgSync.AffectedCamerasData>({
      url: `/api/orgsync/affected-cameras/${orgId}`
    })
  }

  // 批量更新摄像头组织归属
  static batchUpdateCameraOrg(data: Api.OrgSync.BatchUpdateCameraOrgParams) {
    return request.post<Api.Common.ResponseData>({
      url: '/api/orgsync/batch-update-camera-org',
      data
    })
  }

  // 同步更新虚拟绑定中的组织结构
  static syncVirtualOrgStructure(orgId: string) {
    return request.post<Api.Common.ResponseData>({
      url: `/api/orgsync/sync-virtual-org-structure/${orgId}`
    })
  }

  // 监听组织变更通知
  static listenOrgChanges() {
    // WebSocket连接
    return `/api/ws/org-changes`
  }
}
```

### 组织与虚拟绑定数据类型

```typescript
// 组织相关类型
namespace Api.Organization {
  interface OrgData {
    id?: string
    parentId: string
    name: string
    status: '启用' | '禁用'
    sort: number
    desc?: string
  }

  interface OrgMoveParams {
    id: string
    newParentId: string
    updateChildren?: boolean // 是否同时更新子组织状态
  }

  interface OrgNode {
    id: string
    name: string
    parentId: string
    orgPath: string // 完整路径，如 "/1/2/3/"
    status: '启用' | '禁用'
    sort: number
    desc?: string
    children?: OrgNode[]
    created_at: string
  }

  interface OrgTreeData {
    code: number
    message: string
    data: OrgNode[]
  }
}

// 虚拟绑定相关类型
namespace Api.VirtualOrg {
  interface VirtualOrgData {
    id: string
    name: string
    desc?: string
    created_at: string
    orgRefs: OrgRef[] // 引用的实体组织
    deviceRefs: DeviceRef[] // 引用的设备
  }

  interface OrgRef {
    orgId: string
    orgPath: string
    includeSubOrgs: boolean // 是否包含子组织
  }

  interface DeviceRef {
    deviceId: string
    deviceType: string // camera, nvr, etc.
  }

  interface VirtualOrgSaveParams {
    id?: string
    name: string
    desc?: string
    orgRefs: OrgRef[]
    deviceRefs?: DeviceRef[]
  }

  interface AddDeviceParams {
    virtualOrgId: string
    deviceRefs: DeviceRef[]
  }

  interface RemoveDeviceParams {
    virtualOrgId: string
    deviceIds: string[]
  }
}

// 组织同步相关类型
namespace Api.OrgSync {
  interface AffectedEntity {
    id: string
    name: string
    type: string // 'camera', 'virtualOrg', etc.
    path?: string
  }

  interface AffectedVirtualOrgsData {
    code: number
    message: string
    data: {
      virtualOrgs: AffectedEntity[]
    }
  }

  interface AffectedCamerasData {
    code: number
    message: string
    data: {
      cameras: AffectedEntity[]
    }
  }

  interface BatchUpdateCameraOrgParams {
    cameraIds: string[]
    newOrgId: string
    updateOrgPath: boolean // 是否更新组织路径
  }

  interface OrgChangeEvent {
    eventType: 'MOVE' | 'UPDATE' | 'DELETE' | 'ADD'
    orgId: string
    oldParentId?: string
    newParentId?: string
    affectedEntities: {
      virtualOrgs: string[]
      cameras: string[]
    }
  }
}
```

## 接口设计注意事项

1. **接口版本管理**：建议在URL中添加版本号，如`/api/v1/algorithm/list`，便于后续API升级

2. **接口权限控制**：
   - 设计权限管理机制，如RBAC
   - 接口需支持令牌验证
   - 日志记录访问信息

3. **数据格式规范**：

   ```typescript
   // 统一响应格式
   interface ResponseData<T> {
     code: number // 状态码，0表示成功
     message: string // 提示信息
     data: T // 数据
     timestamp: number // 时间戳
   }
   ```

4. **WebSocket设计**：
   - 实时视频流传输
   - 实时告警推送
   - 心跳机制保持连接
   - 重连机制

5. **算法可扩展性**：
   - 支持多种算法模型加载
   - 算法参数动态配置
   - 算法版本管理

6. **性能优化**：
   - 分页查询
   - 缓存机制
   - 数据压缩
   - 接口限流

7. **数据类型定义**：建议定义详细的TypeScript类型，确保前后端数据格式一致

8. **组织结构变更处理**：
   - 使用事务确保数据一致性
   - 提供级联更新选项
   - 使用WebSocket通知客户端组织结构变更
   - 维护组织路径以便快速查询层级关系
