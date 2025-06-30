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
        label: '人员计数超限检测',
        value: 'person_count_limit',
        id: 'algo-person_count_limit',
        desc: '检测人员计数是否超限',
        createTime: randomDateStr()
      },
      {
        label: '人脸识别',
        value: 'face_recognition',
        id: 'algo-face_recognition',
        desc: '识别人脸信息',
        createTime: randomDateStr()
      },
      {
        label: '人脸表情识别',
        value: 'face_expression_recognition',
        id: 'algo-face_expression_recognition',
        desc: '识别人脸表情',
        createTime: randomDateStr()
      },
      {
        label: '人脸特征提取',
        value: 'face_feature_extraction',
        id: 'algo-face_feature_extraction',
        desc: '提取人脸特征',
        createTime: randomDateStr()
      },
      {
        label: '跌倒检测',
        value: 'fall_detection',
        id: 'algo-fall_detection',
        desc: '检测人员跌倒',
        createTime: randomDateStr()
      },
      {
        label: '疲劳检测',
        value: 'fatigue_detection',
        id: 'algo-fatigue_detection',
        desc: '检测人员疲劳状态',
        createTime: randomDateStr()
      },
      {
        label: '打架检测',
        value: 'fight_detection',
        id: 'algo-fight_detection',
        desc: '检测打架行为',
        createTime: randomDateStr()
      },
      {
        label: '未戴手套检测',
        value: 'no_gloves',
        id: 'algo-no_gloves',
        desc: '检测是否佩戴手套',
        createTime: randomDateStr()
      },
      {
        label: '未佩戴护目镜检测',
        value: 'no_goggles',
        id: 'algo-no_goggles',
        desc: '检测是否佩戴护目镜',
        createTime: randomDateStr()
      },
      {
        label: '未佩戴安全帽检测',
        value: 'no_helmet',
        id: 'algo-no_helmet',
        desc: '检测未佩戴安全帽',
        createTime: randomDateStr()
      },
      {
        label: '未穿救生衣检测',
        value: 'no_life_jacket',
        id: 'algo-no_life_jacket',
        desc: '检测是否穿着救生衣',
        createTime: randomDateStr()
      },
      {
        label: '未佩戴口罩检测',
        value: 'no_mask',
        id: 'algo-no_mask',
        desc: '检测是否佩戴口罩',
        createTime: randomDateStr()
      },
      {
        label: '值岗检测',
        value: 'on_duty_detection',
        id: 'algo-on_duty_detection',
        desc: '检测人员是否在岗',
        createTime: randomDateStr()
      },
      {
        label: '人体属性检测',
        value: 'human_attribute_detection',
        id: 'algo-human_attribute_detection',
        desc: '检测人体属性',
        createTime: randomDateStr()
      },
      {
        label: '人员计数',
        value: 'person_count',
        id: 'algo-person_count',
        desc: '统计人员数量',
        createTime: randomDateStr()
      },
      {
        label: '离岗检测',
        value: 'off_duty_detection',
        id: 'algo-off_duty_detection',
        desc: '检测人员是否离岗',
        createTime: randomDateStr()
      },
      {
        label: '人员聚集',
        value: 'gathering_detection',
        id: 'algo-gathering_detection',
        desc: '检测人员聚集',
        createTime: randomDateStr()
      },
      {
        label: '区域入侵',
        value: 'area_intrusion',
        id: 'algo-area_intrusion',
        desc: '检测区域入侵',
        createTime: randomDateStr()
      },
      {
        label: '徘徊检测',
        value: 'loitering_detection',
        id: 'algo-loitering_detection',
        desc: '检测人员徘徊',
        createTime: randomDateStr()
      },
      {
        label: '睡岗检测',
        value: 'sleep_on_duty_detection',
        id: 'algo-sleep_on_duty_detection',
        desc: '检测人员睡岗',
        createTime: randomDateStr()
      },
      {
        label: '使用手机检测',
        value: 'phone_use_detection',
        id: 'algo-phone_use_detection',
        desc: '检测使用手机行为',
        createTime: randomDateStr()
      },
      {
        label: '未穿反光衣检测',
        value: 'no_reflective_vest',
        id: 'algo-no_reflective_vest',
        desc: '检测是否穿着反光衣',
        createTime: randomDateStr()
      },
      {
        label: '未穿防护鞋检测',
        value: 'no_protective_shoes',
        id: 'algo-no_protective_shoes',
        desc: '检测是否穿着防护鞋',
        createTime: randomDateStr()
      },
      {
        label: '抽烟检测',
        value: 'smoking_detection',
        id: 'algo-smoking_detection',
        desc: '检测抽烟行为',
        createTime: randomDateStr()
      },
      {
        label: '静电释放器使用检测',
        value: 'static_dissipator_use_detection',
        id: 'algo-static_dissipator_use_detection',
        desc: '检测静电释放器使用情况',
        createTime: randomDateStr()
      },
      {
        label: '未穿工服检测',
        value: 'no_work_clothes',
        id: 'algo-no_work_clothes',
        desc: '检测是否穿着工服',
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
  },
  {
    name: 'risk_control',
    label: '险情防控',
    items: [
      {
        label: '静电夹检测',
        value: 'static_clamp_detection',
        id: 'algo-static_clamp_detection',
        desc: '检测静电夹状态',
        createTime: randomDateStr()
      },
      {
        label: '灭火器离位检测',
        value: 'extinguisher_off_position_detection',
        id: 'algo-extinguisher_off_position_detection',
        desc: '检测灭火器是否离位',
        createTime: randomDateStr()
      },
      {
        label: '明火检测',
        value: 'open_fire_detection',
        id: 'algo-open_fire_detection',
        desc: '检测明火',
        createTime: randomDateStr()
      },
      {
        label: '垃圾检测',
        value: 'trash_detection',
        id: 'algo-trash_detection',
        desc: '检测垃圾',
        createTime: randomDateStr()
      },
      {
        label: '烟雾检测',
        value: 'smoke_detection',
        id: 'algo-smoke_detection',
        desc: '检测烟雾',
        createTime: randomDateStr()
      }
    ]
  },
  {
    name: 'industry_specific',
    label: '行业定制',
    items: [
      {
        label: '锚杆检测',
        value: 'anchor_bolt_detection',
        id: 'algo-anchor_bolt_detection',
        desc: '检测锚杆状态',
        createTime: randomDateStr()
      },
      {
        label: '自动放矿识别',
        value: 'auto_ore_drawing_recognition',
        id: 'algo-auto_ore_drawing_recognition',
        desc: '识别自动放矿过程',
        createTime: randomDateStr()
      },
      {
        label: '皮带空转检测',
        value: 'belt_idle_detection',
        id: 'algo-belt_idle_detection',
        desc: '检测皮带是否空转',
        createTime: randomDateStr()
      },
      {
        label: '飞车检测',
        value: 'flying_car_detection',
        id: 'algo-flying_car_detection',
        desc: '检测飞车（失控）车辆',
        createTime: randomDateStr()
      },
      {
        label: '黑屏检测',
        value: 'black_screen_detection',
        id: 'algo-black_screen_detection',
        desc: '检测视频画面是否黑屏',
        createTime: randomDateStr()
      },
      {
        label: '轨道异物检测',
        value: 'track_foreign_object_detection',
        id: 'algo-track_foreign_object_detection',
        desc: '检测轨道上是否有异物',
        createTime: randomDateStr()
      },
      {
        label: '罐笼超员检测',
        value: 'cage_overload_detection',
        id: 'algo-cage_overload_detection',
        desc: '检测罐笼是否超员',
        createTime: randomDateStr()
      },
      {
        label: '摄像头模糊检测',
        value: 'camera_blur_detection',
        id: 'algo-camera_blur_detection',
        desc: '检测摄像头画面是否模糊',
        createTime: randomDateStr()
      },
      {
        label: '摄像头遮挡检测',
        value: 'camera_occlusion_detection',
        id: 'algo-camera_occlusion_detection',
        desc: '检测摄像头是否被遮挡',
        createTime: randomDateStr()
      },
      {
        label: '摄像头挪动角度检测',
        value: 'camera_angle_change_detection',
        id: 'algo-camera_angle_change_detection',
        desc: '检测摄像头角度是否被挪动',
        createTime: randomDateStr()
      },
      {
        label: '小汽车靠近大货车检测',
        value: 'car_near_truck_detection',
        id: 'algo-car_near_truck_detection',
        desc: '检测小汽车是否靠近大货车',
        createTime: randomDateStr()
      },
      {
        label: '车灯频闪检测',
        value: 'headlight_flicker_detection',
        id: 'algo-headlight_flicker_detection',
        desc: '检测车灯是否频闪',
        createTime: randomDateStr()
      },
      {
        label: '消防通道占用检测',
        value: 'fire_lane_occupation_detection',
        id: 'algo-fire_lane_occupation_detection',
        desc: '检测消防通道是否被占用',
        createTime: randomDateStr()
      },
      {
        label: '未戴厨师帽检测',
        value: 'no_chef_hat_detection',
        id: 'algo-no_chef_hat_detection',
        desc: '检测是否佩戴厨师帽',
        createTime: randomDateStr()
      },
      {
        label: '未穿戴厨师服厨师帽检测',
        value: 'no_chef_uniform_hat_detection',
        id: 'algo-no_chef_uniform_hat_detection',
        desc: '检测是否穿戴厨师服和厨师帽',
        createTime: randomDateStr()
      },
      {
        label: '煤块堆积检测',
        value: 'coal_pile_detection',
        id: 'algo-coal_pile_detection',
        desc: '检测煤块是否堆积',
        createTime: randomDateStr()
      },
      {
        label: '皮带煤流量识别',
        value: 'belt_coal_flow_recognition',
        id: 'algo-belt_coal_flow_recognition',
        desc: '识别皮带上的煤流量',
        createTime: randomDateStr()
      },
      {
        label: '皮带偏离检测',
        value: 'belt_deviation_detection',
        id: 'algo-belt_deviation_detection',
        desc: '检测皮带是否偏离',
        createTime: randomDateStr()
      },
      {
        label: '吊车支腿未加垫板检测',
        value: 'crane_outrigger_no_pad_detection',
        id: 'algo-crane_outrigger_no_pad_detection',
        desc: '检测吊车支腿是否未加垫板',
        createTime: randomDateStr()
      },
      {
        label: '吊装现场无司索指挥检测',
        value: 'lifting_site_no_rigger_detection',
        id: 'algo-lifting_site_no_rigger_detection',
        desc: '检测吊装现场是否有司索指挥',
        createTime: randomDateStr()
      },
      {
        label: '文物损害检测',
        value: 'cultural_relic_damage_detection',
        id: 'algo-cultural_relic_damage_detection',
        desc: '检测文物是否受损',
        createTime: randomDateStr()
      },
      {
        label: '骑行未戴头盔检测',
        value: 'riding_no_helmet_detection',
        id: 'algo-riding_no_helmet_detection',
        desc: '检测骑行时是否佩戴头盔',
        createTime: randomDateStr()
      },
      {
        label: '扬尘检测',
        value: 'dust_detection',
        id: 'algo-dust_detection',
        desc: '检测扬尘情况',
        createTime: randomDateStr()
      },
      {
        label: '设备停机检测',
        value: 'equipment_shutdown_detection',
        id: 'algo-equipment_shutdown_detection',
        desc: '检测设备是否停机',
        createTime: randomDateStr()
      },
      {
        label: '裸土未覆盖检测',
        value: 'bare_soil_uncovered_detection',
        id: 'algo-bare_soil_uncovered_detection',
        desc: '检测裸土是否未覆盖',
        createTime: randomDateStr()
      },
      {
        label: '灭火箱离位检测',
        value: 'fire_hydrant_box_off_position_detection',
        id: 'algo-fire_hydrant_box_off_position_detection',
        desc: '检测灭火箱是否离位',
        createTime: randomDateStr()
      },
      {
        label: '人脸陪同离站检测',
        value: 'face_escort_leave_detection',
        id: 'algo-face_escort_leave_detection',
        desc: '检测人脸陪同离站',
        createTime: randomDateStr()
      },
      {
        label: '人员落水检测',
        value: 'person_fall_into_water_detection',
        id: 'algo-person_fall_into_water_detection',
        desc: '检测人员是否落水',
        createTime: randomDateStr()
      }
    ]
  }
]
