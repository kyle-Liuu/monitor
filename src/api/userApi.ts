import api from '@/utils/http'

export class UserService {
    /**
     * 获取当前用户信息
     */
    static getUserInfo() {
        return api.get<Api.User.UserInfo>({
            url: '/user/info'
        })
    }

    /**
     * 获取用户列表
     * @param params 查询参数
     */
    static getUserList(params: Api.Common.PaginationParams) {
        return api.get<Api.User.UserListResult>({
            url: '/user/list',
            params
        })
    }

    /**
     * 创建用户
     * @param userData 用户数据
     */
    static createUser(userData: Api.User.CreateUserParams) {
        return api.post<Api.User.UserInfo>({
            url: '/user',
            data: userData
        })
    }

    /**
     * 更新用户
     * @param userId 用户ID
     * @param userData 用户数据
     */
    static updateUser(userId: number, userData: Api.User.UpdateUserParams) {
        return api.put<Api.User.UserInfo>({
            url: `/user/${userId}`,
            data: userData
        })
    }

    /**
     * 删除用户
     * @param userId 用户ID
     */
    static deleteUser(userId: number) {
        return api.del<Api.Common.MessageResult>({
            url: `/user/${userId}`
        })
    }

    /**
     * 获取用户详情
     * @param userId 用户ID
     */
    static getUserById(userId: number) {
        return api.get<Api.User.UserInfo>({
            url: `/user/${userId}`
        })
    }
} 