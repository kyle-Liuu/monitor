// 组织列表mock数据
export interface OrgNode {
  id: string
  name: string
  status: '启用' | '禁用'
  desc: string
  created_at: string
  sort: number
  children?: OrgNode[]
}

// 递归处理：父节点禁用则所有子节点也禁用
function propagateDisable(nodes: OrgNode[], parentDisabled = false): OrgNode[] {
  return nodes.map(node => {
    const isDisabled = parentDisabled || node.status === '禁用'
    const newNode: OrgNode = {
      ...node,
      status: isDisabled ? '禁用' : '启用',
      children: node.children ? propagateDisable(node.children, isDisabled) : undefined
    }
    return newNode
  })
}

export const ORG_TREE_MOCK: OrgNode[] = propagateDisable([
  {
    id: '1',
    name: '高新技术产业园区',
    status: '启用',
    desc: '高新园区总部',
    created_at: '2024-05-22 09:00:00',
    sort: 1,
    children: [
      {
        id: '1-1',
        name: '研发部',
        status: '启用',
        desc: '负责新产品研发',
        created_at: '2024-05-22 09:10:00',
        sort: 2,
        children: [
          {
            id: '1-1-1',
            name: '实验室A',
            status: '启用',
            desc: '主实验室',
            created_at: '2024-05-22 09:20:00',
            sort: 3,
            children: [
              {
                id: '1-1-1-1',
                name: '硬件测试组',
                status: '启用',
                desc: '硬件产品测试',
                created_at: '2024-06-01 08:30:00',
                sort: 1
              },
              {
                id: '1-1-1-2',
                name: '软件测试组',
                status: '启用',
                desc: '软件产品测试',
                created_at: '2024-06-01 08:35:00',
                sort: 2
              }
            ]
          },
          {
            id: '1-1-2',
            name: '创新工作室',
            status: '禁用',
            desc: '创新孵化点',
            created_at: '2024-05-22 09:30:00',
            sort: 4
          },
          {
            id: '1-1-3',
            name: '算法研究组',
            status: '启用',
            desc: 'AI算法研发团队',
            created_at: '2024-06-01 09:00:00',
            sort: 5,
            children: [
              {
                id: '1-1-3-1',
                name: '计算机视觉小组',
                status: '启用',
                desc: '视觉识别算法研发',
                created_at: '2024-06-01 09:10:00',
                sort: 1
              },
              {
                id: '1-1-3-2',
                name: '自然语言处理小组',
                status: '启用',
                desc: 'NLP算法研发',
                created_at: '2024-06-01 09:15:00',
                sort: 2
              }
            ]
          }
        ]
      },
      {
        id: '1-2',
        name: '生产部',
        status: '禁用',
        desc: '负责生产制造',
        created_at: '2024-05-22 09:40:00',
        sort: 5,
        children: [
          {
            id: '1-2-1',
            name: '一号生产车间',
            status: '启用',
            desc: '主生产线',
            created_at: '2024-05-22 09:50:00',
            sort: 6
          },
          {
            id: '1-2-2',
            name: '仓库A',
            status: '禁用',
            desc: '原材料仓库',
            created_at: '2024-05-22 09:55:00',
            sort: 7
          },
          {
            id: '1-2-3',
            name: '二号生产车间',
            status: '启用',
            desc: '辅助生产线',
            created_at: '2024-06-02 10:00:00',
            sort: 8
          },
          {
            id: '1-2-4',
            name: '质检部门',
            status: '启用',
            desc: '产品质量检测',
            created_at: '2024-06-02 10:30:00',
            sort: 9
          }
        ]
      },
      {
        id: '1-3',
        name: '行政部',
        status: '启用',
        desc: '园区行政管理',
        created_at: '2024-05-22 10:00:00',
        sort: 8,
        children: [
          {
            id: '1-3-1',
            name: '会议中心',
            status: '启用',
            desc: '大型会议场所',
            created_at: '2024-05-22 10:10:00',
            sort: 9
          },
          {
            id: '1-3-2',
            name: '人力资源组',
            status: '启用',
            desc: '人员招聘与管理',
            created_at: '2024-06-03 09:00:00',
            sort: 10
          },
          {
            id: '1-3-3',
            name: '财务组',
            status: '启用',
            desc: '财务管理与核算',
            created_at: '2024-06-03 09:30:00',
            sort: 11
          }
        ]
      },
      {
        id: '1-4',
        name: '营销部',
        status: '启用',
        desc: '产品营销与推广',
        created_at: '2024-06-04 08:00:00',
        sort: 12,
        children: [
          {
            id: '1-4-1',
            name: '国内销售组',
            status: '启用',
            desc: '国内市场销售',
            created_at: '2024-06-04 08:30:00',
            sort: 1
          },
          {
            id: '1-4-2',
            name: '国际销售组',
            status: '启用',
            desc: '国际市场销售',
            created_at: '2024-06-04 09:00:00',
            sort: 2
          },
          {
            id: '1-4-3',
            name: '市场推广组',
            status: '启用',
            desc: '产品宣传与推广',
            created_at: '2024-06-04 09:30:00',
            sort: 3
          }
        ]
      }
    ]
  },
  {
    id: '2',
    name: '智能制造产业园区',
    status: '禁用',
    desc: '智能制造园区',
    created_at: '2024-05-22 11:00:00',
    sort: 10,
    children: [
      {
        id: '2-1',
        name: '设备部',
        status: '启用',
        desc: '设备维护与管理',
        created_at: '2024-05-22 11:10:00',
        sort: 11,
        children: [
          {
            id: '2-1-1',
            name: '设备维修中心',
            status: '启用',
            desc: '设备检修',
            created_at: '2024-05-22 11:20:00',
            sort: 12
          },
          {
            id: '2-1-2',
            name: '设备采购组',
            status: '启用',
            desc: '设备采购管理',
            created_at: '2024-06-05 10:00:00',
            sort: 13
          }
        ]
      },
      {
        id: '2-2',
        name: '安全部',
        status: '禁用',
        desc: '园区安全管理',
        created_at: '2024-05-22 11:30:00',
        sort: 13,
        children: [
          {
            id: '2-2-1',
            name: '监控室',
            status: '启用',
            desc: '安防监控',
            created_at: '2024-05-22 11:40:00',
            sort: 14
          },
          {
            id: '2-2-2',
            name: '消防站',
            status: '禁用',
            desc: '消防应急',
            created_at: '2024-05-22 11:50:00',
            sort: 15
          },
          {
            id: '2-2-3',
            name: '安全培训中心',
            status: '禁用',
            desc: '安全教育培训',
            created_at: '2024-06-06 09:00:00',
            sort: 16
          }
        ]
      },
      {
        id: '2-3',
        name: '自动化部',
        status: '禁用',
        desc: '自动化生产线管理',
        created_at: '2024-06-07 08:00:00',
        sort: 17,
        children: [
          {
            id: '2-3-1',
            name: '机器人控制中心',
            status: '禁用',
            desc: '工业机器人管理',
            created_at: '2024-06-07 08:30:00',
            sort: 1
          },
          {
            id: '2-3-2',
            name: '自动化测试组',
            status: '禁用',
            desc: '自动化系统测试',
            created_at: '2024-06-07 09:00:00',
            sort: 2
          }
        ]
      }
    ]
  },
  {
    id: '3',
    name: '生态环保产业园区',
    status: '启用',
    desc: '生态环保园区',
    created_at: '2024-05-22 12:00:00',
    sort: 16,
    children: [
      {
        id: '3-1',
        name: '环保部',
        status: '启用',
        desc: '环保项目管理',
        created_at: '2024-05-22 12:10:00',
        sort: 17,
        children: [
          {
            id: '3-1-1',
            name: '污水处理站',
            status: '启用',
            desc: '污水净化',
            created_at: '2024-05-22 12:20:00',
            sort: 18
          },
          {
            id: '3-1-2',
            name: '空气监测站',
            status: '启用',
            desc: '空气质量监测',
            created_at: '2024-06-08 10:00:00',
            sort: 19
          },
          {
            id: '3-1-3',
            name: '环保技术研究组',
            status: '启用',
            desc: '环保技术研发',
            created_at: '2024-06-08 10:30:00',
            sort: 20
          }
        ]
      },
      {
        id: '3-2',
        name: '绿化部',
        status: '禁用',
        desc: '园区绿化',
        created_at: '2024-05-22 12:30:00',
        sort: 19,
        children: [
          {
            id: '3-2-1',
            name: '温室大棚',
            status: '启用',
            desc: '植物培育',
            created_at: '2024-05-22 12:40:00',
            sort: 20
          },
          {
            id: '3-2-2',
            name: '园林设计组',
            status: '禁用',
            desc: '园区景观设计',
            created_at: '2024-06-09 09:00:00',
            sort: 21
          }
        ]
      },
      {
        id: '3-3',
        name: '可再生能源部',
        status: '启用',
        desc: '可再生能源管理',
        created_at: '2024-06-10 08:00:00',
        sort: 22,
        children: [
          {
            id: '3-3-1',
            name: '太阳能发电站',
            status: '启用',
            desc: '太阳能发电管理',
            created_at: '2024-06-10 08:30:00',
            sort: 1
          },
          {
            id: '3-3-2',
            name: '风能发电站',
            status: '启用',
            desc: '风能发电管理',
            created_at: '2024-06-10 09:00:00',
            sort: 2
          },
          {
            id: '3-3-3',
            name: '能源研究中心',
            status: '启用',
            desc: '新能源技术研发',
            created_at: '2024-06-10 09:30:00',
            sort: 3,
            children: [
              {
                id: '3-3-3-1',
                name: '储能技术组',
                status: '启用',
                desc: '能源存储技术研发',
                created_at: '2024-06-10 10:00:00',
                sort: 1
              },
              {
                id: '3-3-3-2',
                name: '能源转换组',
                status: '启用',
                desc: '能源转换技术研发',
                created_at: '2024-06-10 10:30:00',
                sort: 2
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: '4',
    name: '智慧物流产业园区',
    status: '启用',
    desc: '智慧物流园区',
    created_at: '2024-05-22 13:00:00',
    sort: 21,
    children: [
      {
        id: '4-1',
        name: '仓储部',
        status: '启用',
        desc: '仓储管理',
        created_at: '2024-05-22 13:10:00',
        sort: 22,
        children: [
          {
            id: '4-1-1',
            name: '冷链仓库',
            status: '禁用',
            desc: '冷藏物流',
            created_at: '2024-05-22 13:20:00',
            sort: 23
          },
          {
            id: '4-1-2',
            name: '常温仓库',
            status: '启用',
            desc: '常温物品存储',
            created_at: '2024-06-11 09:00:00',
            sort: 24
          },
          {
            id: '4-1-3',
            name: '危险品仓库',
            status: '启用',
            desc: '危险物品专用仓储',
            created_at: '2024-06-11 09:30:00',
            sort: 25
          }
        ]
      },
      {
        id: '4-2',
        name: '运输部',
        status: '禁用',
        desc: '运输调度',
        created_at: '2024-05-22 13:30:00',
        sort: 24,
        children: [
          {
            id: '4-2-1',
            name: '车队管理中心',
            status: '启用',
            desc: '车辆调度',
            created_at: '2024-05-22 13:40:00',
            sort: 25
          },
          {
            id: '4-2-2',
            name: '路线规划组',
            status: '禁用',
            desc: '运输路线优化',
            created_at: '2024-06-12 10:00:00',
            sort: 26
          }
        ]
      },
      {
        id: '4-3',
        name: '智能调度部',
        status: '启用',
        desc: '智能物流调度',
        created_at: '2024-06-13 08:00:00',
        sort: 27,
        children: [
          {
            id: '4-3-1',
            name: '系统开发组',
            status: '启用',
            desc: '调度系统开发',
            created_at: '2024-06-13 08:30:00',
            sort: 1
          },
          {
            id: '4-3-2',
            name: '数据分析组',
            status: '启用',
            desc: '物流数据分析',
            created_at: '2024-06-13 09:00:00',
            sort: 2
          },
          {
            id: '4-3-3',
            name: '智能预测组',
            status: '启用',
            desc: '物流需求预测',
            created_at: '2024-06-13 09:30:00',
            sort: 3
          }
        ]
      }
    ]
  },
  {
    id: '5',
    name: '数字金融产业园区',
    status: '启用',
    desc: '数字金融服务中心',
    created_at: '2024-06-14 08:00:00',
    sort: 28,
    children: [
      {
        id: '5-1',
        name: '金融科技部',
        status: '启用',
        desc: '金融科技研发',
        created_at: '2024-06-14 08:30:00',
        sort: 1,
        children: [
          {
            id: '5-1-1',
            name: '区块链研究组',
            status: '启用',
            desc: '区块链技术研发',
            created_at: '2024-06-14 09:00:00',
            sort: 1
          },
          {
            id: '5-1-2',
            name: '支付系统组',
            status: '启用',
            desc: '支付系统开发',
            created_at: '2024-06-14 09:30:00',
            sort: 2
          }
        ]
      },
      {
        id: '5-2',
        name: '风控部',
        status: '启用',
        desc: '金融风险控制',
        created_at: '2024-06-14 10:00:00',
        sort: 2,
        children: [
          {
            id: '5-2-1',
            name: '风险评估组',
            status: '启用',
            desc: '金融风险评估',
            created_at: '2024-06-14 10:30:00',
            sort: 1
          },
          {
            id: '5-2-2',
            name: '合规管理组',
            status: '启用',
            desc: '金融合规管理',
            created_at: '2024-06-14 11:00:00',
            sort: 2
          }
        ]
      }
    ]
  },
  {
    id: '6',
    name: '医疗健康产业园区',
    status: '启用',
    desc: '医疗健康服务中心',
    created_at: '2024-06-15 08:00:00',
    sort: 29,
    children: [
      {
        id: '6-1',
        name: '医疗设备部',
        status: '启用',
        desc: '医疗设备研发与生产',
        created_at: '2024-06-15 08:30:00',
        sort: 1,
        children: [
          {
            id: '6-1-1',
            name: '影像设备组',
            status: '启用',
            desc: '医学影像设备研发',
            created_at: '2024-06-15 09:00:00',
            sort: 1
          },
          {
            id: '6-1-2',
            name: '检测设备组',
            status: '启用',
            desc: '医学检测设备研发',
            created_at: '2024-06-15 09:30:00',
            sort: 2
          }
        ]
      },
      {
        id: '6-2',
        name: '健康管理部',
        status: '启用',
        desc: '健康数据管理',
        created_at: '2024-06-15 10:00:00',
        sort: 2,
        children: [
          {
            id: '6-2-1',
            name: '数据分析组',
            status: '启用',
            desc: '健康数据分析',
            created_at: '2024-06-15 10:30:00',
            sort: 1
          },
          {
            id: '6-2-2',
            name: '健康咨询组',
            status: '启用',
            desc: '健康咨询服务',
            created_at: '2024-06-15 11:00:00',
            sort: 2
          }
        ]
      }
    ]
  }
])
