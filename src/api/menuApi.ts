import request from '@/utils/http'
import { menuDataToRouter } from '@/router/utils/menuToRouter'
import { AppRouteRecord } from '@/types/router'

export interface MenuResponse {
  menuList: AppRouteRecord[]
}

// 菜单接口
export const menuService = {
  async getMenuList(delay = 0): Promise<MenuResponse> {
    try {
      // 从后端API获取原始响应
      const rawResponse = await request.get({
        url: '/api/menu/list',
        showErrorMessage: false  // 我们将自己处理错误
      }) as any;
      
      // 详细打印响应，帮助调试
      // console.log('原始菜单数据:', JSON.stringify(rawResponse));
      
      let menuList: AppRouteRecord[] = [];
      
      // 根据响应格式进行处理
      if (rawResponse && typeof rawResponse === 'object') {
        if (rawResponse.data && rawResponse.data.menuList && Array.isArray(rawResponse.data.menuList)) {
          // 标准格式: {code, msg, data: {menuList: []}}
          // console.log('检测到标准数据格式');
          menuList = rawResponse.data.menuList;
        } else if (rawResponse.menuList && Array.isArray(rawResponse.menuList)) {
          // 简化格式: {menuList: []}
          // console.log('检测到简化数据格式');
          menuList = rawResponse.menuList;
        } else {
          // 尝试查找任何包含menuList的属性
          const menuListKeys = Object.keys(rawResponse).filter(key => 
            rawResponse[key] && 
            (rawResponse[key].menuList || Array.isArray(rawResponse[key]))
          );
          
          if (menuListKeys.length > 0) {
            const key = menuListKeys[0];
            // console.log(`在键 ${key} 中找到了可能的菜单数据`);
            menuList = Array.isArray(rawResponse[key]) 
              ? rawResponse[key] 
              : (rawResponse[key].menuList || []);
          } else {
            throw new Error('未找到有效的菜单数据');
          }
        }
      } else {
        throw new Error('返回的数据不是有效的对象');
      }

      // 后端返回的菜单数据已经过滤了权限
      // 处理菜单数据，确保路由路径正确
      // 验证获取的菜单列表
      if (!menuList || menuList.length === 0) {
        console.warn('菜单列表为空或无效');
      } else {
        // console.log(`成功获取到 ${menuList.length} 个菜单项`);
      }
      
      // 处理获取的菜单数据
      const processedMenuList = menuList.map((route: any) => menuDataToRouter(route));

      return { menuList: processedMenuList };
    } catch (error) {
      console.error('获取菜单失败:', error)
      throw error instanceof Error ? error : new Error('获取菜单失败:' + JSON.stringify(error))
    }
  }
}
