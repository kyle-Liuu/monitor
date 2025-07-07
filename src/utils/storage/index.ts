/**
 * 存储相关工具函数统一导出
 */

export * from './storage'
export * from './storage-config'
export * from './storage-key-manager'

/**
 * 本地存储的简单封装
 */
export const local = {
    /**
     * 获取本地存储值
     * @param key 存储键名
     * @returns 存储的值
     */
    get(key: string): string | null {
        return localStorage.getItem(key)
    },

    /**
     * 设置本地存储值
     * @param key 存储键名
     * @param value 要存储的值
     */
    set(key: string, value: string): void {
        localStorage.setItem(key, value)
    },

    /**
     * 移除本地存储值
     * @param key 要移除的键名
     */
    remove(key: string): void {
        localStorage.removeItem(key)
    }
}
