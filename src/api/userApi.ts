import api from '@/utils/http'

/**
 * 获取用户列表
 * @param params 分页参数
 * @returns 用户列表
 */
export function getUserList(params: Api.Common.PaginationParams) {
    return api.get({
        url: '/api/users/list',
        params
    })
}

/**
 * 获取用户信息
 * @param userId 用户ID
 * @returns 用户信息
 */
export function getUserInfo(userId: string) {
    return api.get({
        url: `/api/users/${userId}`
    })
}

/**
 * 获取当前用户信息
 * @returns 当前用户信息
 */
export function getCurrentUserInfo() {
    return api.get({
        url: '/api/users/info'
    })
}

/**
 * 创建用户
 * @param data 用户信息
 * @returns 创建结果
 */
export function createUser(data: Api.User.CreateUserParams) {
    return api.post({
        url: '/api/users',
        data
    })
}

/**
 * 更新用户信息
 * @param userId 用户ID
 * @param data 用户信息
 * @returns 更新结果
 */
export function updateUser(userId: string, data: Api.User.UpdateUserParams) {
    return api.put({
        url: `/api/users/${userId}`,
        data
    })
}

/**
 * 更新用户头像
 * @param userId 用户ID
 * @param avatarPath 头像路径
 * @returns 更新结果
 */
export function updateUserAvatar(userId: string, avatarPath: string) {
    return api.put({
        url: `/api/users/${userId}/avatar`,
        data: { avatar: avatarPath }
    })
}

/**
 * 修改用户密码
 * @param userId 用户ID
 * @param data 密码信息
 * @returns 修改结果
 */
export function changePassword(userId: string, data: Api.User.ChangePasswordParams) {
    return api.put({
        url: `/api/users/${userId}/password`,
        data
    })
}

/**
 * 删除用户
 * @param userId 用户ID
 * @returns 删除结果
 */
export function deleteUser(userId: string) {
    return api.del({
        url: `/api/users/${userId}`
    })
}

/**
 * 上传用户头像
 * @param file 头像文件
 * @param userId 用户ID
 * @returns 上传结果
 */
export function uploadAvatar(file: File, userId: string): Promise<Api.Upload.AvatarUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId)

    return api.post({
        url: '/api/uploads/avatar',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        transformRequest: [(data) => data]
    })
}

/**
 * 获取用户角色列表
 * @returns 角色列表
 */
export function getUserRoles() {
    return api.get({
        url: '/api/roles'
    })
}

/**
 * 批量删除用户
 * @param userIds 用户ID列表
 * @returns 删除结果
 */
export function batchDeleteUsers(userIds: string[]) {
    return api.del({
        url: '/api/users/batch',
        data: { user_ids: userIds }
    })
}

/**
 * 更新用户状态
 * @param userId 用户ID
 * @param isActive 是否激活
 * @returns 更新结果
 */
export function updateUserStatus(userId: string, isActive: boolean) {
    return api.put({
        url: `/api/users/${userId}/status`,
        data: { is_active: isActive }
    })
}

/**
 * 重置用户密码
 * @param userId 用户ID
 * @returns 重置结果
 */
export function resetUserPassword(userId: string) {
    return api.post({
        url: `/api/users/${userId}/reset-password`
    })
}

/**
 * 用户服务类，兼容旧版调用
 */
export class UserService {
    /**
     * 获取当前用户信息
     */
    static async getUserInfo(): Promise<Api.User.UserInfo> {
        const res = await getCurrentUserInfo()
        return res as unknown as Api.User.UserInfo
    }

    /**
     * 获取用户列表
     */
    static async getUserList(params: any): Promise<Api.User.UserListResult> {
        const res = await getUserList(params)
        return res as unknown as Api.User.UserListResult
    }

    /**
     * 创建用户
     */
    static async createUser(data: Api.User.CreateUserParams): Promise<Api.User.UserInfo> {
        const res = await createUser(data)
        return res as unknown as Api.User.UserInfo
    }

    /**
     * 更新用户信息
     */
    static async updateUser(userId: string, data: Api.User.UpdateUserParams): Promise<Api.User.UserInfo> {
        const res = await updateUser(userId, data)
        return res as unknown as Api.User.UserInfo
    }

    /**
     * 获取用户详情
     */
    static async getUserById(userId: string): Promise<Api.User.UserInfo> {
        const res = await getUserInfo(userId)
        return res as unknown as Api.User.UserInfo
    }

    /**
     * 删除用户
     */
    static async deleteUser(userId: string): Promise<any> {
        return await deleteUser(userId)
    }

    /**
     * 上传用户头像
     */
    static async uploadAvatar(file: File, userId: string): Promise<string> {
        const res = await uploadAvatar(file, userId)
        // 检查返回的数据结构
        console.log('上传头像响应:', res)

        // 使用类型断言处理响应
        const response = res as any

        if (response && typeof response === 'object') {
            if ('avatarPath' in response) {
                return response.avatarPath
            } else if (response.data && typeof response.data === 'object' && 'avatarPath' in response.data) {
                return response.data.avatarPath
            }
        }

        throw new Error('头像上传响应格式不正确')
    }

    /**
     * 更新用户头像
     */
    static async updateAvatar(userId: string, avatarPath: string): Promise<Api.User.UserInfo> {
        const res = await updateUserAvatar(userId, avatarPath)
        return res as unknown as Api.User.UserInfo
    }

    /**
     * 修改用户密码
     */
    static async changePassword(userId: string, data: Api.User.ChangePasswordParams): Promise<any> {
        return await changePassword(userId, data)
    }
} 