// 组织树 mock 数据，结构与 AppRouteRecord 匹配
import type { AppRouteRecord } from '@/types/router'

export const orgTreeData: AppRouteRecord[] = [
  {
    id: 1,
    path: '/org',
    meta: { title: 'Xxx科技有限公司' },
    children: [
      {
        id: 2,
        path: '/org/tj',
        meta: { title: 'Xxx（天津）科技有限公司' },
        children: [
          {
            id: 3,
            path: '/org/tj/rd',
            meta: { title: '研发部' },
            children: [
              { id: 4, path: '/org/tj/rd/1', meta: { title: '研发一组' } },
              { id: 5, path: '/org/tj/rd/2', meta: { title: '研发二组' } }
            ]
          },
          { id: 6, path: '/org/tj/ui', meta: { title: 'UI部' } },
          { id: 7, path: '/org/tj/qa', meta: { title: '测试部' } },
          { id: 8, path: '/org/tj/ops', meta: { title: '运维部' } }
        ]
      },
      { id: 9, path: '/org/sc', meta: { title: 'Xxx（四川）科技有限公司' } },
      { id: 10, path: '/org/jx', meta: { title: 'Xxx（江西）科技有限公司' } },
      { id: 11, path: '/org/js', meta: { title: 'Xxx（江苏）科技有限公司' } },
      { id: 12, path: '/org/zj', meta: { title: 'Xxx（浙江）科技有限公司' } },
      { id: 13, path: '/org/hn', meta: { title: 'Xxx（湖南）科技有限公司' } }
    ]
  }
]
