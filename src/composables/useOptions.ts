import { ref, computed } from 'vue'
import { useRoles } from './useRoles'

/**
 * 通用选项管理 Composable
 * 提供各种下拉选择器的选项数据
 */
export function useOptions() {
  // 角色选项
  const { roleOptions: dynamicRoleOptions, fetchRoles } = useRoles()

  // 用户状态选项
  const userStatusOptions = computed(() => [
    { label: '启用', value: '1' },
    { label: '禁用', value: '2' }
  ])

  // 用户等级选项（如果需要的话）
  const userLevelOptions = computed(() => [
    { label: '普通用户', value: 'normal' },
    { label: 'VIP用户', value: 'vip' },
    { label: '高级VIP', value: 'svip' },
    { label: '企业用户', value: 'enterprise' }
  ])

  // 告警状态选项
  const alarmStatusOptions = computed(() => [
    { label: '未处理', value: 'new' },
    { label: '已处理', value: 'processed' },
    { label: '已忽略', value: 'ignored' }
  ])

  // 告警等级选项
  const alarmLevelOptions = computed(() => [
    { label: '低', value: 'low' },
    { label: '中', value: 'medium' },
    { label: '高', value: 'high' },
    { label: '严重', value: 'critical' }
  ])

  // 初始化所有选项数据
  const initializeOptions = async () => {
    await fetchRoles()
    // 这里可以添加其他需要异步获取的选项
  }

  return {
    // 角色相关
    roleOptions: dynamicRoleOptions,
    
    // 用户相关
    userStatusOptions,
    userLevelOptions,
    
    // 告警相关
    alarmStatusOptions,
    alarmLevelOptions,
    
    // 初始化方法
    initializeOptions,
    fetchRoles
  }
} 