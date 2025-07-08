/**
 * 数据格式化相关工具函数
 */

import { local } from '@/utils/storage'
import { AVATAR_VERSION_KEY } from '@/utils/storage/storage-key-manager'

// 时间戳转时间
export function timestampToTime(timestamp: number = Date.now(), isMs: boolean = true): string {
  const date = new Date(isMs ? timestamp : timestamp * 1000)
  return date.toISOString().replace('T', ' ').slice(0, 19)
}

// 数字格式化（千位分隔符）
export function commafy(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 生成随机数
export function randomNum(min: number, max?: number): number {
  if (max === undefined) {
    max = min
    min = 0
  }
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 移除HTML标签
export function removeHtmlTags(str: string = ''): string {
  return str.replace(/<[^>]*>/g, '')
}

/**
 * 格式化图片URL
 * @param url 图片URL
 * @returns 完整的图片URL
 */
export function formatImageUrl(url: string): string {
  if (!url) return '';

  // 如果是完整URL（以http或https开头），直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 如果是以/uploads或/avatars开头的相对路径
  if (url.startsWith('/uploads') || url.startsWith('/avatars')) {
    // 在开发环境中，使用相对路径
    // 在生产环境中，可以根据需要添加域名
    const { VITE_API_URL } = import.meta.env;

    // 如果配置了API_URL并且不是相对路径，则拼接完整URL
    if (VITE_API_URL && !VITE_API_URL.startsWith('/')) {
      // 移除API_URL末尾的斜杠（如果有）
      const baseUrl = VITE_API_URL.endsWith('/')
        ? VITE_API_URL.slice(0, -1)
        : VITE_API_URL;

      return `${baseUrl}${url}`;
    }
  }

  // 其他情况，直接返回原始URL
  return url;
}

/**
 * 格式化头像URL，添加版本号用于缓存控制
 * 始终添加版本号以确保头像更新后能立即显示
 * 
 * @param url 头像URL
 * @returns 格式化后的URL（始终带有版本号）
 */
export function formatAvatarUrl(url?: string): string {
  if (!url) return '/assets/avatar/default.webp'

  // 格式化基础URL
  const baseUrl = formatImageUrl(url)

  // 获取当前头像版本号（如果不存在，使用当前时间戳作为初始值）
  const avatarVersion = local.get(AVATAR_VERSION_KEY) || Date.now().toString()

  // 始终添加版本号参数，确保头像更新后能立即显示
  // 如果URL中已包含_v参数，先移除再添加新的版本号
  const baseUrlWithoutVersion = baseUrl.replace(/[?&]_v=[^&]+/, '')

  // 添加新的版本号参数
  return baseUrlWithoutVersion.includes('?')
    ? `${baseUrlWithoutVersion}&_v=${avatarVersion}`
    : `${baseUrlWithoutVersion}?_v=${avatarVersion}`
}

/**
 * 更新头像版本号，强制刷新所有使用formatAvatarUrl的组件
 * 只有在头像实际被更新时才应调用此函数
 */
export function updateAvatarVersion(): void {
  local.set(AVATAR_VERSION_KEY, Date.now().toString())
}
