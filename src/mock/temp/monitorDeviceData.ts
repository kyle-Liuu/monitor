// 监控设备三级数据结构：区域 -> 摄像头 -> 算法
export interface AlgorithmInfo {
  id: string
  name: string
  type: 'detection' | 'recognition' | 'analysis' | 'safety'
  status: 'running' | 'stopped' | 'error'
  streamUrl: string
  description: string
  accuracy?: number
  lastUpdate: string
}

export interface CameraInfo {
  id: string
  name: string
  ip: string
  status: 'online' | 'offline'
  location: string
  resolution: string
  algorithms: AlgorithmInfo[]
  description?: string
}

export interface AreaInfo {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive'
  cameras: CameraInfo[]
  sort: number
}

// Mock数据
export const monitorDeviceData: AreaInfo[] = [
  {
    id: 'area_001',
    name: '主要出入口区域',
    description: '包含大门、停车场等主要出入口监控点',
    status: 'active',
    sort: 1,
    cameras: [
      {
        id: 'cam_001_001',
        name: '大门口摄像头01',
        ip: '192.168.1.101',
        status: 'online',
        location: '主门口东侧',
        resolution: '1920x1080',
        algorithms: [
          {
            id: 'algo_001_001_001',
            name: '人员检测',
            type: 'detection',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/test.live.mp4',
            description: '检测进出人员，统计人流量',
            accuracy: 95.2,
            lastUpdate: '2024-01-15 14:30:25'
          },
          {
            id: 'algo_001_001_002',
            name: '车辆识别',
            type: 'recognition',
            status: 'stopped',
            streamUrl: 'ws://192.168.1.186/live/area1_cam1_vehicle.live.mp4',
            description: '识别车牌号码和车辆类型',
            accuracy: 92.8,
            lastUpdate: '2024-01-15 14:28:15'
          },
          {
            id: 'algo_001_001_003',
            name: '异常行为分析',
            type: 'analysis',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/detect.live.mp4',
            description: '检测逗留、徘徊等异常行为',
            accuracy: 88.5,
            lastUpdate: '2024-01-15 14:25:40'
          }
        ]
      },
      {
        id: 'cam_001_002',
        name: '停车场摄像头01',
        ip: '192.168.1.102',
        status: 'online',
        location: '停车场A区',
        resolution: '1920x1080',
        algorithms: [
          {
            id: 'algo_001_002_001',
            name: '车位检测',
            type: 'detection',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area1_cam2_parking.live.mp4',
            description: '检测车位占用情况',
            accuracy: 96.1,
            lastUpdate: '2024-01-15 14:32:10'
          },
          {
            id: 'algo_001_002_002',
            name: '车牌识别',
            type: 'recognition',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area1_cam2_plate.live.mp4',
            description: '识别停车车辆车牌',
            accuracy: 94.3,
            lastUpdate: '2024-01-15 14:30:55'
          }
        ]
      },
      {
        id: 'cam_001_003',
        name: '侧门摄像头01',
        ip: '192.168.1.103',
        status: 'offline',
        location: '侧门入口',
        resolution: '1280x720',
        algorithms: [
          {
            id: 'algo_001_003_001',
            name: '人脸识别',
            type: 'recognition',
            status: 'stopped',
            streamUrl: 'ws://192.168.1.186/live/area1_cam3_face.live.mp4',
            description: '员工人脸识别验证',
            accuracy: 97.5,
            lastUpdate: '2024-01-15 13:45:20'
          }
        ]
      }
    ]
  },
  {
    id: 'area_002',
    name: '生产车间区域',
    description: '生产线、操作台等生产区域监控',
    status: 'active',
    sort: 2,
    cameras: [
      {
        id: 'cam_002_001',
        name: '生产线01摄像头',
        ip: '192.168.1.201',
        status: 'online',
        location: '生产线A段',
        resolution: '1920x1080',
        algorithms: [
          {
            id: 'algo_002_001_001',
            name: '安全帽检测',
            type: 'safety',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area2_cam1_helmet.live.mp4',
            description: '检测工人是否佩戴安全帽',
            accuracy: 93.7,
            lastUpdate: '2024-01-15 14:33:45'
          },
          {
            id: 'algo_002_001_002',
            name: '工服检测',
            type: 'safety',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area2_cam1_uniform.live.mp4',
            description: '检测工人是否穿着工服',
            accuracy: 91.2,
            lastUpdate: '2024-01-15 14:31:20'
          },
          {
            id: 'algo_002_001_003',
            name: '设备状态监测',
            type: 'analysis',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area2_cam1_equipment.live.mp4',
            description: '监测生产设备运行状态',
            accuracy: 89.8,
            lastUpdate: '2024-01-15 14:29:30'
          }
        ]
      },
      {
        id: 'cam_002_002',
        name: '操作台摄像头01',
        ip: '192.168.1.202',
        status: 'online',
        location: '中央操作台',
        resolution: '1920x1080',
        algorithms: [
          {
            id: 'algo_002_002_001',
            name: '操作规范检测',
            type: 'analysis',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area2_cam2_operation.live.mp4',
            description: '检测操作是否符合规范',
            accuracy: 87.4,
            lastUpdate: '2024-01-15 14:27:15'
          },
          {
            id: 'algo_002_002_002',
            name: '人员定位',
            type: 'detection',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area2_cam2_position.live.mp4',
            description: '实时定位操作人员位置',
            accuracy: 94.6,
            lastUpdate: '2024-01-15 14:34:05'
          }
        ]
      }
    ]
  },
  {
    id: 'area_003',
    name: '仓储物流区域',
    description: '仓库、装卸台等物流区域监控',
    status: 'active',
    sort: 3,
    cameras: [
      {
        id: 'cam_003_001',
        name: '仓库内部摄像头01',
        ip: '192.168.1.301',
        status: 'online',
        location: '仓库A区中央',
        resolution: '1920x1080',
        algorithms: [
          {
            id: 'algo_003_001_001',
            name: '货物识别',
            type: 'recognition',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area3_cam1_goods.live.mp4',
            description: '识别货物类型和数量',
            accuracy: 92.1,
            lastUpdate: '2024-01-15 14:35:30'
          },
          {
            id: 'algo_003_001_002',
            name: '叉车安全监测',
            type: 'safety',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area3_cam1_forklift.live.mp4',
            description: '监测叉车作业安全',
            accuracy: 90.3,
            lastUpdate: '2024-01-15 14:33:15'
          }
        ]
      },
      {
        id: 'cam_003_002',
        name: '装卸台摄像头01',
        ip: '192.168.1.302',
        status: 'online',
        location: '装卸台1号位',
        resolution: '1920x1080',
        algorithms: [
          {
            id: 'algo_003_002_001',
            name: '装卸作业监测',
            type: 'analysis',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area3_cam2_loading.live.mp4',
            description: '监测装卸作业进度和安全',
            accuracy: 88.7,
            lastUpdate: '2024-01-15 14:31:45'
          }
        ]
      },
      {
        id: 'cam_003_003',
        name: '库房出入口摄像头',
        ip: '192.168.1.303',
        status: 'online',
        location: '库房出入口',
        resolution: '1280x720',
        algorithms: [
          {
            id: 'algo_003_003_001',
            name: '进出库监测',
            type: 'detection',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area3_cam3_inout.live.mp4',
            description: '监测货物进出库情况',
            accuracy: 95.8,
            lastUpdate: '2024-01-15 14:36:10'
          },
          {
            id: 'algo_003_003_002',
            name: '人员权限验证',
            type: 'recognition',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area3_cam3_auth.live.mp4',
            description: '验证进入人员权限',
            accuracy: 96.4,
            lastUpdate: '2024-01-15 14:34:25'
          }
        ]
      }
    ]
  },
  {
    id: 'area_004',
    name: '办公区域',
    description: '办公楼、会议室等办公区域监控',
    status: 'active',
    sort: 4,
    cameras: [
      {
        id: 'cam_004_001',
        name: '大厅摄像头01',
        ip: '192.168.1.401',
        status: 'online',
        location: '办公楼大厅',
        resolution: '1920x1080',
        algorithms: [
          {
            id: 'algo_004_001_001',
            name: '访客识别',
            type: 'recognition',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area4_cam1_visitor.live.mp4',
            description: '识别和记录访客信息',
            accuracy: 94.2,
            lastUpdate: '2024-01-15 14:37:20'
          },
          {
            id: 'algo_004_001_002',
            name: '人流统计',
            type: 'analysis',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area4_cam1_flow.live.mp4',
            description: '统计办公区域人流量',
            accuracy: 91.5,
            lastUpdate: '2024-01-15 14:35:50'
          }
        ]
      },
      {
        id: 'cam_004_002',
        name: '会议室摄像头01',
        ip: '192.168.1.402',
        status: 'online',
        location: '大会议室',
        resolution: '1920x1080',
        algorithms: [
          {
            id: 'algo_004_002_001',
            name: '会议状态检测',
            type: 'analysis',
            status: 'stopped',
            streamUrl: 'ws://192.168.1.186/live/area4_cam2_meeting.live.mp4',
            description: '检测会议室使用状态',
            accuracy: 89.3,
            lastUpdate: '2024-01-15 13:20:10'
          }
        ]
      }
    ]
  },
  {
    id: 'area_005',
    name: '周界安防区域',
    description: '围墙、周界等安防监控区域',
    status: 'active',
    sort: 5,
    cameras: [
      {
        id: 'cam_005_001',
        name: '周界01摄像头',
        ip: '192.168.1.501',
        status: 'online',
        location: '东侧围墙中段',
        resolution: '1920x1080',
        algorithms: [
          {
            id: 'algo_005_001_001',
            name: '周界入侵检测',
            type: 'detection',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area5_cam1_intrusion.live.mp4',
            description: '检测围墙翻越等入侵行为',
            accuracy: 96.7,
            lastUpdate: '2024-01-15 14:38:40'
          },
          {
            id: 'algo_005_001_002',
            name: '可疑物体检测',
            type: 'detection',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area5_cam1_suspicious.live.mp4',
            description: '检测遗留可疑物体',
            accuracy: 92.8,
            lastUpdate: '2024-01-15 14:36:55'
          }
        ]
      },
      {
        id: 'cam_005_002',
        name: '周界02摄像头',
        ip: '192.168.1.502',
        status: 'online',
        location: '北侧围墙中段',
        resolution: '1920x1080',
        algorithms: [
          {
            id: 'algo_005_002_001',
            name: '夜视监控',
            type: 'analysis',
            status: 'running',
            streamUrl: 'ws://192.168.1.186/live/area5_cam2_night.live.mp4',
            description: '夜间环境下的监控增强',
            accuracy: 87.2,
            lastUpdate: '2024-01-15 14:39:15'
          }
        ]
      }
    ]
  }
]

// 统计信息
export const getDeviceStatistics = () => {
  const stats = {
    totalAreas: monitorDeviceData.length,
    totalCameras: 0,
    totalAlgorithms: 0,
    onlineCameras: 0,
    runningAlgorithms: 0,
    offlineCameras: 0,
    stoppedAlgorithms: 0
  }

  monitorDeviceData.forEach(area => {
    stats.totalCameras += area.cameras.length
    area.cameras.forEach(camera => {
      if (camera.status === 'online') {
        stats.onlineCameras++
      } else {
        stats.offlineCameras++
      }
      
      stats.totalAlgorithms += camera.algorithms.length
      camera.algorithms.forEach(algorithm => {
        if (algorithm.status === 'running') {
          stats.runningAlgorithms++
        } else {
          stats.stoppedAlgorithms++
        }
      })
    })
  })

  return stats
}

// 根据算法ID获取完整信息
export const getAlgorithmInfo = (algorithmId: string) => {
  for (const area of monitorDeviceData) {
    for (const camera of area.cameras) {
      const algorithm = camera.algorithms.find(algo => algo.id === algorithmId)
      if (algorithm) {
        return {
          area,
          camera,
          algorithm
        }
      }
    }
  }
  return null
}

// 根据摄像头ID获取信息
export const getCameraInfo = (cameraId: string) => {
  for (const area of monitorDeviceData) {
    const camera = area.cameras.find(cam => cam.id === cameraId)
    if (camera) {
      return {
        area,
        camera
      }
    }
  }
  return null
}

// 获取可用的算法流列表
export const getAvailableAlgorithmStreams = () => {
  const streams: Array<{
    areaId: string
    areaName: string
    cameraId: string
    cameraName: string
    algorithmId: string
    algorithmName: string
    streamUrl: string
    status: string
  }> = []

  monitorDeviceData.forEach(area => {
    area.cameras.forEach(camera => {
      if (camera.status === 'online') {
        camera.algorithms.forEach(algorithm => {
          if (algorithm.status === 'running') {
            streams.push({
              areaId: area.id,
              areaName: area.name,
              cameraId: camera.id,
              cameraName: camera.name,
              algorithmId: algorithm.id,
              algorithmName: algorithm.name,
              streamUrl: algorithm.streamUrl,
              status: algorithm.status
            })
          }
        })
      }
    })
  })

  return streams
}