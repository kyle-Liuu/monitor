// 警告数据 Mock 服务
export interface AlertItem {
  id: string
  icon: string
  title: string
  type: string
  level: '紧急' | '重要' | '一般' | '提示'
  img: string
  time: string
  location: string
  status: '未处理' | '已处理' | '误报'
  handler?: string
  handleTime?: string
  desc: string
  remark?: string
  ip?: string
  timestamp: number
}

// 警告类型配置
const ALERT_TYPES = [
  { type: '火灾', title: '烟火告警', level: '紧急', desc: '检测到烟火异常，请及时处理。' },
  { type: '安全', title: '安全帽告警', level: '一般', desc: '未佩戴安全帽，存在安全隐患。' },
  { type: '入侵', title: '入侵告警', level: '重要', desc: '检测到异常入侵，请注意安全。' },
  { type: '设备', title: '设备异常', level: '一般', desc: '设备运行异常，请检查设备状态。' },
  { type: '环境', title: '环境告警', level: '提示', desc: '环境参数超出正常范围。' },
  { type: '人员', title: '人员聚集', level: '重要', desc: '检测到人员异常聚集。' }
] as const

// 设备位置列表
const DEVICE_LOCATIONS = [
  '一号车间-东侧',
  '二号车间-西侧', 
  '三号车间-中央',
  '仓库区域-北侧',
  '办公楼-南侧',
  '停车场-入口',
  '生产线A-工位1',
  '生产线B-工位2',
  '质检区-检测点',
  '包装区-出货口'
]

// IP地址池
const IP_POOLS = [
  '192.168.1.101',
  '192.168.1.102', 
  '192.168.1.103',
  '192.168.1.104',
  '192.168.1.105',
  '192.168.1.106',
  '192.168.1.107',
  '192.168.1.108',
  '192.168.1.109',
  '192.168.1.110'
]

class AlertMockService {
  private alerts: AlertItem[] = []
  private idCounter = 1
  private readonly maxAlerts = 20

  constructor() {
    this.initializeAlerts()
  }

  // 初始化警告数据
  private initializeAlerts() {
    const now = Date.now()
    
    // 创建初始警告数据
    for (let i = 0; i < 8; i++) {
      const alertType = ALERT_TYPES[Math.floor(Math.random() * ALERT_TYPES.length)]
      const timestamp = now - (i * 5 * 60 * 1000) // 每5分钟一个
      
      this.alerts.push(this.createAlert(alertType, timestamp))
    }

    // 按时间倒序排列
    this.alerts.sort((a, b) => b.timestamp - a.timestamp)
  }

  // 创建单个警告
  private createAlert(alertType: typeof ALERT_TYPES[number], timestamp?: number): AlertItem {
    const id = `alert_${String(this.idCounter++).padStart(6, '0')}`
    const time = new Date(timestamp || Date.now())
    const location = DEVICE_LOCATIONS[Math.floor(Math.random() * DEVICE_LOCATIONS.length)]
    const ip = IP_POOLS[Math.floor(Math.random() * IP_POOLS.length)]

    return {
      id,
      icon: '/assets/bus.jpg',
      title: alertType.title,
      type: alertType.type,
      level: alertType.level,
      img: '/assets/bus.jpg',
      time: `抓拍时间: ${this.formatTime(time)}`,
      location: `布点名称: ${location}`,
      status: '未处理',
      handler: '',
      handleTime: '',
      desc: alertType.desc,
      remark: '',
      ip,
      timestamp: time.getTime()
    }
  }

  // 格式化时间
  private formatTime(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
  }

  // 获取所有警告
  getAlerts(): AlertItem[] {
    return [...this.alerts]
  }

  // 添加新警告
  addRandomAlert(): AlertItem {
    const alertType = ALERT_TYPES[Math.floor(Math.random() * ALERT_TYPES.length)]
    const newAlert = this.createAlert(alertType)
    
    this.alerts.unshift(newAlert)
    
    // 保持最大数量限制
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts)
    }
    
    return newAlert
  }

  // 更新警告状态
  updateAlertStatus(id: string, status: AlertItem['status'], handler?: string, remark?: string): boolean {
    const alert = this.alerts.find(a => a.id === id)
    if (alert) {
      alert.status = status
      alert.handler = handler || ''
      alert.remark = remark || ''
      alert.handleTime = status !== '未处理' ? this.formatTime(new Date()) : ''
      return true
    }
    return false
  }

  // 删除警告
  removeAlert(id: string): boolean {
    const index = this.alerts.findIndex(a => a.id === id)
    if (index !== -1) {
      this.alerts.splice(index, 1)
      return true
    }
    return false
  }

  // 获取统计信息
  getStatistics() {
    const total = this.alerts.length
    const unhandled = this.alerts.filter(a => a.status === '未处理').length
    const handled = this.alerts.filter(a => a.status === '已处理').length
    const falsePositive = this.alerts.filter(a => a.status === '误报').length
    
    const levelCounts = {
      emergency: this.alerts.filter(a => a.level === '紧急').length,
      important: this.alerts.filter(a => a.level === '重要').length,
      general: this.alerts.filter(a => a.level === '一般').length,
      tip: this.alerts.filter(a => a.level === '提示').length
    }

    return {
      total,
      unhandled,
      handled,
      falsePositive,
      levelCounts
    }
  }

  // 清空所有警告
  clearAll(): void {
    this.alerts = []
  }

  // 清理已处理的告警
  clearProcessedAlerts(): number {
    const beforeCount = this.alerts.length
    this.alerts = this.alerts.filter(alert => alert.status === '未处理')
    const afterCount = this.alerts.length
    return beforeCount - afterCount
  }

  // 模拟实时警告生成
  startRandomGeneration(interval: number = 30000): () => void {
    const timer = setInterval(() => {
      // 30% 概率生成新警告
      if (Math.random() < 0.3) {
        this.addRandomAlert()
      }
    }, interval)

    // 返回清理函数
    return () => clearInterval(timer)
  }
}

// 创建单例实例
export const alertMockService = new AlertMockService()

// 导出类型和服务
export { AlertMockService }
export default alertMockService 