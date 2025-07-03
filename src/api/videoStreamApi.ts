import api from '@/utils/http'

export class VideoStreamService {
    /**
     * 获取视频流列表
     * @param params 查询参数
     */
    static getVideoStreamList(params: { current?: number; size?: number; organization_id?: number }) {
        return api.get<{
            records: Array<{
                id: number;
                name: string;
                url: string;
                type: string;
                status: number;
                organization_id: number;
                organization_name: string;
                description?: string;
                created_at: string;
            }>;
            current: number;
            size: number;
            total: number;
        }>({
            url: '/videostreams',
            params
        })
    }

    /**
     * 创建视频流
     * @param streamData 视频流数据
     */
    static createVideoStream(streamData: {
        name: string;
        url: string;
        type: string;
        organization_id: number;
        description?: string;
    }) {
        return api.post<any>({
            url: '/videostreams',
            data: streamData
        })
    }

    /**
     * 更新视频流
     * @param streamId 视频流ID
     * @param streamData 视频流数据
     */
    static updateVideoStream(streamId: number, streamData: {
        name?: string;
        url?: string;
        type?: string;
        status?: number;
        organization_id?: number;
        description?: string;
    }) {
        return api.put<any>({
            url: `/videostreams/${streamId}`,
            data: streamData
        })
    }

    /**
     * 删除视频流
     * @param streamId 视频流ID
     */
    static deleteVideoStream(streamId: number) {
        return api.del<{ message: string }>({
            url: `/videostreams/${streamId}`
        })
    }

    /**
     * 获取视频流详情
     * @param streamId 视频流ID
     */
    static getVideoStreamById(streamId: number) {
        return api.get<{
            id: number;
            name: string;
            url: string;
            type: string;
            status: number;
            organization_id: number;
            organization_name: string;
            description?: string;
            created_at: string;
        }>({
            url: `/videostreams/${streamId}`
        })
    }
} 