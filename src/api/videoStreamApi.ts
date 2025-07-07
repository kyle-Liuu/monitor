import api from '@/utils/http'

export class VideoStreamService {
    /**
     * 获取视频流列表
     * @param params 查询参数
     */
    static getVideoStreamList(params: { current?: number; size?: number; organization_id?: number }) {
        return api.get<Api.VideoStream.VideoStreamListResult>({
            url: '/videostreams',
            params
        })
    }

    /**
     * 创建视频流
     * @param streamData 视频流数据
     */
    static createVideoStream(streamData: Api.VideoStream.CreateVideoStreamParams) {
        return api.post<Api.VideoStream.VideoStreamInfo>({
            url: '/videostreams',
            data: streamData
        })
    }

    /**
     * 更新视频流
     * @param streamId 视频流ID
     * @param streamData 视频流数据
     */
    static updateVideoStream(streamId: number, streamData: Api.VideoStream.UpdateVideoStreamParams) {
        return api.put<Api.VideoStream.VideoStreamInfo>({
            url: `/videostreams/${streamId}`,
            data: streamData
        })
    }

    /**
     * 删除视频流
     * @param streamId 视频流ID
     */
    static deleteVideoStream(streamId: number) {
        return api.del<Api.Common.MessageResult>({
            url: `/videostreams/${streamId}`
        })
    }

    /**
     * 获取视频流详情
     * @param streamId 视频流ID
     */
    static getVideoStreamById(streamId: number) {
        return api.get<Api.VideoStream.VideoStreamInfo>({
            url: `/videostreams/${streamId}`
        })
    }
} 