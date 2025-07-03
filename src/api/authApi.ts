import api from '@/utils/http'

export class AuthService {
    /**
     * 用户登录
     * @param username 用户名
     * @param password 密码
     */
    static login(username: string, password: string) {
        return api.post<Api.Auth.LoginResponse>({
            url: '/auth/login',
            data: { username, password }
        })
    }

    /**
     * 用户注册
     * @param userData 用户注册信息
     */
    static register(userData: Api.Auth.RegisterParams) {
        return api.post<Api.User.UserInfo>({
            url: '/auth/register',
            data: userData
        })
    }
} 