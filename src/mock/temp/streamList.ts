// 视频流 mock 数据，结构与 streaminfo 页面一致
import { ORG_TREE_MOCK } from './orgTree'

export interface StreamItem {
  id: number
  orgId: string
  orgName: string
  streamName: string
  streamCode: string
  protocol: string
  description: string
  disable: boolean
  algos: string[]
  algoConfigs: Record<string, any>
  createTime: string
}

// 获取所有启用组织id
function getEnabledOrgIds(tree: any[]): string[] {
  let ids: string[] = []
  tree.forEach(node => {
    if (node.status === '启用') ids.push(node.id)
    if (node.children) ids = ids.concat(getEnabledOrgIds(node.children))
  })
  return ids
}

// 新增：根据id查找组织名称
function findOrgNameById(tree: any[], id: string): string {
  for (const node of tree) {
    if (node.id === id) return node.name
    if (node.children) {
      const found = findOrgNameById(node.children, id)
      if (found) return found
    }
  }
  return ''
}

// 新增：根据id查找组织状态
function findOrgStatusById(tree: any[], id: string): string {
  for (const node of tree) {
    if (node.id === id) return node.status
    if (node.children) {
      const found = findOrgStatusById(node.children, id)
      if (found) return found
    }
  }
  return ''
}

const enabledOrgIds = getEnabledOrgIds(ORG_TREE_MOCK)

const allAlgos = [
  'abnormal_park', 'car_count', 'car_illegal_park', 'car_type',
  'ebike_illegal_park', 'ebike_elevator', 'car_emergency_lane', 'car_count_limit',
  'solid_lane_change', 'cross_diversion', 'car_recognition', 'small_car_illegal_park',
  'traffic_flow', 'truck_count', 'truck_fast_lane', 'truck_lane_change',
  'truck_area_illegal_park', 'truck_reverse', 'car_attribute', 'car_periodic_check',
  'car_speed', 'no_helmet', 'person_intrusion'
]

function randomAlgos() {
  // 让每条数据有 8~10 个算法标签
  const count = Math.floor(Math.random() * 3) + 8 // 8~10
  const shuffled = allAlgos.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function randomAlgoConfigs(algos: string[]) {
  const configs: Record<string, any> = {}
  algos.forEach(algo => {
    configs[algo] = {
      interval: Math.floor(Math.random() * 10) + 1,
      window: Math.floor(Math.random() * 10) + 1,
      threshold: Math.floor(Math.random() * 10) + 1,
      voice: algo + '告警',
      level: Math.random() > 0.5 ? '高' : '中'
    }
  })
  return configs
}

export const STREAM_LIST_MOCK: StreamItem[] = Array(50)
  .fill(null)
  .map((_, index) => {
    const protocols = ['rtsp', 'GB28181', 'rtmp', 'hls']
    const descriptions = [
      '高清监控摄像头',
      '停车场入口监控',
      '办公区走廊监控',
      '仓库安防监控',
      '大门口监控',
      '生产车间监控'
    ]
    const algos = randomAlgos()
    const orgId = enabledOrgIds[Math.floor(Math.random() * enabledOrgIds.length)]
    const orgStatus = findOrgStatusById(ORG_TREE_MOCK, orgId)
    return {
      id: index + 1,
      orgId,
      orgName: findOrgNameById(ORG_TREE_MOCK, orgId),
      streamName: `摄像头_${String(index + 1).padStart(3, '0')}`,
      streamCode: `rtsp://192.168.1.${(index % 100) + 1}/stream/${index + 1}`,
      protocol: protocols[index % protocols.length],
      description: `${descriptions[index % descriptions.length]} - ${index + 1}号`,
      disable: orgStatus === '禁用' ? true : Math.random() > 0.5,
      algos,
      algoConfigs: randomAlgoConfigs(algos),
      createTime: new Date(
        Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
      ).toLocaleString()
    }
  })
