import api from '@/utils/http'

export class AuthService {
    /**
     * 用户登录
     * @param params 登录参数
     */
    static login(params: Api.Auth.LoginParams) {
        return api.post<Api.Auth.LoginResponse>({
            url: '/api/auth/login',
            data: params
        })
    }

    /**
     * 刷新令牌
     * @param refreshToken 刷新令牌
     */
    static refreshToken(refreshToken: string) {
        return api.post<Api.Auth.RefreshTokenResponse>({
            url: '/api/auth/refresh',
            data: { refresh_token: refreshToken }
        })
    }

    /**
     * 用户注册
     * @param userData 用户注册信息
     */
    static register(userData: Api.Auth.RegisterParams) {
        return api.post<Api.User.UserInfo>({
            url: '/api/auth/register',
            data: userData
        })
    }
} 