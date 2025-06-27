// 视频流 mock 数据，结构与 streaminfo 页面一致
import { ORG_TREE_MOCK } from './orgTree'
import { mockAlgoList } from './algoList'

export interface StreamItem {
  id: number
  orgId: string
  orgName: string
  streamName: string
  streamCode: string
  protocol: string
  description: string
  enable: boolean
  algos: string[]
  algoConfigs: Record<string, any>
  createTime: string
}

// 获取所有启用组织id
function getEnabledOrgIds(tree: any[]): string[] {
  let ids: string[] = []
  tree.forEach((node) => {
    if (node.status === '启用') ids.push(node.id)
    if (node.children) ids = ids.concat(getEnabledOrgIds(node.children))
  })
  return ids
}

// 新增：根据id查找组织名称
export function findOrgNameById(tree: any[], id: string): string {
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

// 用 mockAlgoList 生成所有算法 value
const allAlgos = mockAlgoList.flatMap((tab) => tab.items.map((item) => item.value))

function randomAlgos() {
  // 让每条数据有 8~10 个算法标签
  const count = Math.floor(Math.random() * 5) // 8~10
  const shuffled = allAlgos.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function randomPolygons() {
  // 随机生成 0~2 个多边形，每个多边形 3~6 个点
  const count = Math.floor(Math.random() * 3) // 0,1,2
  const polygons = []
  for (let i = 0; i < count; i++) {
    const pointsCount = Math.floor(Math.random() * 2) + 3 // 3~6
    const points = Array(pointsCount)
      .fill(null)
      .map(() => ({
        x: +(Math.random() * 0.8 + 0.1).toFixed(6), // 0.1~0.9
        y: +(Math.random() * 0.8 + 0.1).toFixed(6)
      }))
    polygons.push({
      name: `区域${i + 1}`,
      normalizedPoints: points
    })
  }
  return polygons
}

function randomAlgoConfigs(algos: string[]) {
  const configs: Record<string, any> = {}
  algos.forEach((algo) => {
    configs[algo] = {
      interval: Math.floor(Math.random() * 10) + 1,
      window: Math.floor(Math.random() * 10) + 1,
      threshold: Math.floor(Math.random() * 10) + 1,
      voice: algo + '告警',
      level: Math.random() > 0.5 ? '高' : '中',
      polygons: randomPolygons() // 新增多边形区域
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
      enable: orgStatus === '禁用' ? false : Math.random() > 0.5,
      algos,
      algoConfigs: randomAlgoConfigs(algos),
      createTime: new Date(
        Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
      ).toLocaleString()
    }
  })

// 添加5条未分配组织的视频流
for (let i = 1; i <= 5; i++) {
  STREAM_LIST_MOCK.unshift({
    id: 1000 + i,
    orgId: '',
    orgName: '',
    streamName: `未分配流_${i}`,
    streamCode: `rtsp://192.168.1.200/stream/${i}`,
    protocol: 'rtsp',
    description: `未分配组织的视频流${i}`,
    enable: false,
    algos: [],
    algoConfigs: {},
    createTime: new Date().toLocaleString()
  })
}

// 调试：打印第一条有算法标签的视频流信息
// const firstWithAlgos = STREAM_LIST_MOCK.find((item) => item.algos && item.algos.length > 0)
// console.log('有算法标签的视频流:', firstWithAlgos)
