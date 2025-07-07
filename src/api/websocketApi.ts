import { useUserStore } from '@/store/modules/user'
import { $t } from '@/locales'
import { consoleSys } from '@/utils/sys/console'

class WebSocketManager {
    private socket: WebSocket | null = null
    private options: Api.WebSocket.WebSocketOptions
    private reconnectTimer: number | null = null
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5
    private reconnectInterval = 2000

    constructor(options: Api.WebSocket.WebSocketOptions) {
        this.options = options
        this.init()
    }

    /**
     * 初始化WebSocket连接
     */
    private init() {
        const { url } = this.options

        // 获取token
        const { accessToken } = useUserStore()
        const wsUrl = accessToken ? `${url}?token=${accessToken}` : url

        try {
            this.socket = new WebSocket(wsUrl)
            this.setupEventHandlers()
        } catch (error) {
            consoleSys.error($t('httpMsg.websocketConnectError'), error)
            this.scheduleReconnect()
        }
    }

    /**
     * 设置WebSocket事件处理器
     */
    private setupEventHandlers() {
        if (!this.socket) return

        this.socket.onopen = (event: Event) => {
            consoleSys.log($t('httpMsg.websocketConnected'))
            this.reconnectAttempts = 0
            if (this.options.onOpen) {
                this.options.onOpen(event)
            }
        }

        this.socket.onmessage = (event: MessageEvent) => {
            if (this.options.onMessage) {
                try {
                    const data = JSON.parse(event.data)
                    this.options.onMessage({ ...event, data })
                } catch (error) {
                    this.options.onMessage(event)
                }
            }
        }

        this.socket.onerror = (event: Event) => {
            consoleSys.error($t('httpMsg.websocketError'))
            if (this.options.onError) {
                this.options.onError(event)
            }
        }

        this.socket.onclose = (event: CloseEvent) => {
            consoleSys.log($t('httpMsg.websocketClosed'), event.code, event.reason)
            if (this.options.onClose) {
                this.options.onClose(event)
            }

            // 如果不是正常关闭，尝试重连
            if (event.code !== 1000) {
                this.scheduleReconnect()
            }
        }
    }

    /**
     * 发送消息
     * @param data 要发送的数据
     */
    send(data: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(typeof data === 'string' ? data : JSON.stringify(data))
            return true
        }
        consoleSys.warn($t('httpMsg.websocketNotConnected'))
        return false
    }

    /**
     * 关闭连接
     */
    close() {
        if (this.socket) {
            this.socket.close(1000, 'Normal closure')
            this.socket = null
        }

        // 清除重连定时器
        if (this.reconnectTimer !== null) {
            window.clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
    }

    /**
     * 安排重新连接
     */
    private scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            consoleSys.error($t('httpMsg.websocketMaxReconnect'))
            return
        }

        if (this.reconnectTimer !== null) {
            window.clearTimeout(this.reconnectTimer)
        }

        this.reconnectTimer = window.setTimeout(() => {
            consoleSys.log($t('httpMsg.websocketReconnecting'), ++this.reconnectAttempts)
            this.init()
        }, this.reconnectInterval)
    }
}

// 用于创建WebSocket连接的工厂函数
export function createWebSocket(options: Api.WebSocket.WebSocketOptions) {
    return new WebSocketManager(options)
} 