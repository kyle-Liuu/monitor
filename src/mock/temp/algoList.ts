// 算法标签 mock 数据
function randomDateStr() {
  const now = Date.now()
  const offset = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
  return new Date(now - offset).toLocaleString()
}

export const mockAlgoList = [
  {
    name: 'car',
    label: '车辆管理',
    items: [
      {
        label: '异常停车检测',
        value: 'abnormal_park',
        id: 'algo-abnormal_park',
        desc: '检测异常停车行为',
        createTime: randomDateStr()
      },
      {
        label: '车辆计数',
        value: 'car_count',
        id: 'algo-car_count',
        desc: '统计车辆数量',
        createTime: randomDateStr()
      },
      {
        label: '车辆违停',
        value: 'car_illegal_park',
        id: 'algo-car_illegal_park',
        desc: '检测车辆违停',
        createTime: randomDateStr()
      },
      {
        label: '车型识别',
        value: 'car_type',
        id: 'algo-car_type',
        desc: '识别车辆类型',
        createTime: randomDateStr()
      },
      {
        label: '电瓶车违停',
        value: 'ebike_illegal_park',
        id: 'algo-ebike_illegal_park',
        desc: '检测电瓶车违停',
        createTime: randomDateStr()
      },
      {
        label: '电瓶车进电梯检测',
        value: 'ebike_elevator',
        id: 'algo-ebike_elevator',
        desc: '检测电瓶车进电梯',
        createTime: randomDateStr()
      },
      {
        label: '机动车走应急车道检测',
        value: 'car_emergency_lane',
        id: 'algo-car_emergency_lane',
        desc: '检测机动车走应急车道',
        createTime: randomDateStr()
      },
      {
        label: '车辆计数超限检测',
        value: 'car_count_limit',
        id: 'algo-car_count_limit',
        desc: '检测车辆计数超限',
        createTime: randomDateStr()
      },
      {
        label: '实线变道检测',
        value: 'solid_lane_change',
        id: 'algo-solid_lane_change',
        desc: '检测实线变道',
        createTime: randomDateStr()
      },
      {
        label: '穿越导流线区域检测',
        value: 'cross_diversion',
        id: 'algo-cross_diversion',
        desc: '检测穿越导流线',
        createTime: randomDateStr()
      },
      {
        label: '车辆识别',
        value: 'car_recognition',
        id: 'algo-car_recognition',
        desc: '车辆识别',
        createTime: randomDateStr()
      },
      {
        label: '小汽车违停',
        value: 'small_car_illegal_park',
        id: 'algo-small_car_illegal_park',
        desc: '检测小汽车违停',
        createTime: randomDateStr()
      },
      {
        label: '车流量检测',
        value: 'traffic_flow',
        id: 'algo-traffic_flow',
        desc: '检测车流量',
        createTime: randomDateStr()
      },
      {
        label: '大货车计数',
        value: 'truck_count',
        id: 'algo-truck_count',
        desc: '统计大货车数量',
        createTime: randomDateStr()
      },
      {
        label: '货车走快车道检测',
        value: 'truck_fast_lane',
        id: 'algo-truck_fast_lane',
        desc: '检测货车走快车道',
        createTime: randomDateStr()
      },
      {
        label: '货车变道检测',
        value: 'truck_lane_change',
        id: 'algo-truck_lane_change',
        desc: '检测货车变道',
        createTime: randomDateStr()
      },
      {
        label: '货车区域违停',
        value: 'truck_area_illegal_park',
        id: 'algo-truck_area_illegal_park',
        desc: '检测货车区域违停',
        createTime: randomDateStr()
      },
      {
        label: '货车逆行检测',
        value: 'truck_reverse',
        id: 'algo-truck_reverse',
        desc: '检测货车逆行',
        createTime: randomDateStr()
      },
      {
        label: '车辆属性检测',
        value: 'car_attribute',
        id: 'algo-car_attribute',
        desc: '检测车辆属性',
        createTime: randomDateStr()
      },
      {
        label: '车辆期检检测',
        value: 'car_periodic_check',
        id: 'algo-car_periodic_check',
        desc: '检测车辆期检',
        createTime: randomDateStr()
      },
      {
        label: '车辆超速检测',
        value: 'car_speed',
        id: 'algo-car_speed',
        desc: '检测车辆超速',
        createTime: randomDateStr()
      }
    ]
  },
  {
    name: 'person',
    label: '人员管理',
    items: [
      {
        label: '未佩戴安全帽检测',
        value: 'no_helmet',
        id: 'algo-no_helmet',
        desc: '检测未佩戴安全帽',
        createTime: randomDateStr()
      },
      {
        label: '人员闯入',
        value: 'person_intrusion',
        id: 'algo-person_intrusion',
        desc: '检测人员闯入',
        createTime: randomDateStr()
      }
    ]
  }
]
