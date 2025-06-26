import lockImg from '@/assets/img/lock/lock_screen_1.webp'

export interface WarningProcessHistory {
  time: string
  user: string
  result: string
  remark: string
}

export interface WarningInfoMock {
  snap_id: string
  snap_imgurl: string
  snap_videourl: string
  snap_time: string
  algo_name: string
  algo_id: string
  device_name: string
  device_id: string
  process_level: number
  process_status: number
  process_username: string
  process_userid: string
  process_time: string
  process_remark: string
  process_history?: WarningProcessHistory[]
}

const users = ['杭若汐', '张伟', '李雷', '王芳']
const results = ['确认', '误报', '复核']
const remarks = ['首次告警', '误报', '已处理', '待复核', '复核通过', '误触发']

// 生成200条mock数据
export const WARNING_LIST_MOCK: WarningInfoMock[] = Array.from({ length: 200 }).map((_, i) => {
  const historyCount = 2 + (i % 2) // 2或3条历史
  const process_history: WarningProcessHistory[] = Array.from({ length: historyCount }).map(
    (_, j) => ({
      time: `2025-06-${String(10 + (i % 20)).padStart(2, '0')} 1${j}:3${i % 6}:0${j}`,
      user: users[(i + j) % 4],
      result: results[(i + j) % 3],
      remark: remarks[(i + j) % remarks.length]
    })
  )
  return {
    snap_id: `sanpgAocvsQ1G_${i + 1}`,
    snap_imgurl: lockImg,
    snap_videourl:
      '//lf3-static.bytednsdoc.com/obj/eden-cn/nupenuvpxnuvo/xgplayer_doc/xgplayer-demo.mp4',
    snap_time: `2025-05-${String((i % 30) + 1).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(8 + (i % 50)).padStart(2, '0')}:19`,
    algo_name: ['速佳琪', '区域入侵', '烟雾检测', '火焰检测'][i % 4],
    algo_id: `algoebwn8M0_${i % 4}`,
    device_name: ['电梯1', 'A区摄像头', 'B区摄像头', 'C区摄像头'][i % 4],
    device_id: `devi5aJrPd_${i % 4}`,
    process_level: 20 + (i % 10),
    process_status: i % 2 === 0 ? 72 : 1,
    process_username: users[i % 4],
    process_userid: `usroKzYQgJ_${i % 4}`,
    process_time: `2025-06-18 15:${String(36 + (i % 20)).padStart(2, '0')}:02`,
    process_remark: remarks[i % remarks.length],
    process_history
  }
})
