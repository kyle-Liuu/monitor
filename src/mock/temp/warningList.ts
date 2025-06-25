import lockImg from '@/assets/img/lock/lock_screen_1.webp'

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
}

export const WARNING_LIST_MOCK: WarningInfoMock[] = [
  {
    snap_id: 'sanpgAocvsQ1G',
    snap_imgurl: lockImg,
    snap_videourl: 'https://our-unique.net/',
    snap_time: '2025-05-01 21:08:19',
    algo_name: '速佳琪',
    algo_id: 'algoebwn8M0',
    device_name: '宫美方',
    device_id: 'devi5aJrPd',
    process_level: 26,
    process_status: 72,
    process_username: '杭若汐',
    process_userid: 'usroKzYQgJ',
    process_time: '2025-06-18 15:36:02',
    process_remark: 'tempor ea cupidatat'
  }
  // ...（此处省略，实际请补全原dataList的所有mock项）...
]
