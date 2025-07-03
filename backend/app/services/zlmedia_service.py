import json
import aiohttp
import asyncio
import hashlib
import time
from typing import Dict, Any, List, Optional
from fastapi import HTTPException

from app.core.config import settings

class ZLMediaService:
    """ZLMediaKit服务类，提供流媒体服务器管理功能"""
    
    @staticmethod
    def _generate_params(interface: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        生成ZLMediaKit API请求参数
        
        Args:
            interface: API接口名称
            params: 请求参数
            
        Returns:
            包含签名的请求参数
        """
        if params is None:
            params = {}
            
        # 添加公共参数
        req_params = {
            "secret": settings.ZLMEDIAKIT_SECRET,
            "method": interface,
            "timestamp": int(time.time()),
            **params
        }
        
        # 生成签名
        sorted_keys = sorted(req_params.keys())
        md5_string = "&".join([f"{k}={req_params[k]}" for k in sorted_keys])
        req_params["sign"] = hashlib.md5(md5_string.encode()).hexdigest()
        
        return req_params
    
    @staticmethod
    async def _request(interface: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        发送请求到ZLMediaKit API
        
        Args:
            interface: API接口名称
            params: 请求参数
            
        Returns:
            API响应结果
        """
        if params is None:
            params = {}
            
        req_params = ZLMediaService._generate_params(interface, params)
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(f"{settings.ZLMEDIAKIT_API_URL}/index/api/invoke", json=req_params) as response:
                    if response.status != 200:
                        raise HTTPException(status_code=500, detail=f"ZLMediaKit API请求失败: HTTP {response.status}")
                    
                    result = await response.json()
                    if result.get("code") != 0:
                        raise HTTPException(status_code=500, detail=f"ZLMediaKit API错误: {result.get('msg', '未知错误')}")
                    
                    return result.get("data", {})
            except aiohttp.ClientError as e:
                raise HTTPException(status_code=500, detail=f"ZLMediaKit API连接失败: {str(e)}")
    
    @staticmethod
    async def get_server_info() -> Dict[str, Any]:
        """获取服务器信息"""
        return await ZLMediaService._request("getServerConfig")
    
    @staticmethod
    async def get_stream_list(app: str = "live", stream: str = None) -> List[Dict[str, Any]]:
        """
        获取流列表
        
        Args:
            app: 应用名称，默认为"live"
            stream: 流ID，不指定则获取所有流
            
        Returns:
            流列表
        """
        params = {"app": app}
        if stream:
            params["stream"] = stream
            
        return await ZLMediaService._request("getStreams", params)
    
    @staticmethod
    async def get_stream_info(app: str, stream: str) -> Dict[str, Any]:
        """
        获取指定流的详细信息
        
        Args:
            app: 应用名称
            stream: 流ID
            
        Returns:
            流信息
        """
        params = {
            "app": app,
            "stream": stream
        }
        
        return await ZLMediaService._request("getStreamInfo", params)
    
    @staticmethod
    async def add_stream_proxy(
        app: str,
        stream: str,
        url: str,
        enable_hls: bool = True,
        enable_mp4: bool = False,
        rtp_type: int = 0
    ) -> Dict[str, Any]:
        """
        添加代理流
        
        Args:
            app: 应用名称
            stream: 流ID
            url: 源流地址(如rtsp://xxx)
            enable_hls: 是否转HLS
            enable_mp4: 是否录制MP4
            rtp_type: rtp类型，0-tcp，1-udp
            
        Returns:
            添加结果
        """
        params = {
            "app": app,
            "stream": stream,
            "url": url,
            "enable_hls": int(enable_hls),
            "enable_mp4": int(enable_mp4),
            "rtp_type": rtp_type
        }
        
        return await ZLMediaService._request("addStreamProxy", params)
    
    @staticmethod
    async def del_stream_proxy(app: str, stream: str) -> Dict[str, Any]:
        """
        删除代理流
        
        Args:
            app: 应用名称
            stream: 流ID
            
        Returns:
            删除结果
        """
        params = {
            "app": app,
            "stream": stream
        }
        
        return await ZLMediaService._request("delStreamProxy", params)
    
    @staticmethod
    async def restart_stream_proxy(app: str, stream: str) -> Dict[str, Any]:
        """
        重启代理流
        
        Args:
            app: 应用名称
            stream: 流ID
            
        Returns:
            重启结果
        """
        params = {
            "app": app,
            "stream": stream
        }
        
        return await ZLMediaService._request("restartStreamProxy", params)
    
    @staticmethod
    async def get_stream_snapshot(
        url: str,
        timeout_sec: int = 10,
        expire_sec: int = 60
    ) -> Dict[str, Any]:
        """
        获取流截图
        
        Args:
            url: 流地址
            timeout_sec: 等待超时时间
            expire_sec: 截图有效期
            
        Returns:
            截图信息
        """
        params = {
            "url": url,
            "timeout_sec": timeout_sec,
            "expire_sec": expire_sec
        }
        
        return await ZLMediaService._request("getSnap", params)
    
    @staticmethod
    async def start_record(app: str, stream: str, max_second: int = 3600) -> Dict[str, Any]:
        """
        开始录制流
        
        Args:
            app: 应用名称
            stream: 流ID
            max_second: 最大录制时间(秒)
            
        Returns:
            录制信息
        """
        params = {
            "type": 1,  # mp4录制
            "vhost": "__defaultVhost__",
            "app": app,
            "stream": stream,
            "max_second": max_second
        }
        
        return await ZLMediaService._request("startRecord", params)
    
    @staticmethod
    async def stop_record(app: str, stream: str) -> Dict[str, Any]:
        """
        停止录制流
        
        Args:
            app: 应用名称
            stream: 流ID
            
        Returns:
            停止录制结果
        """
        params = {
            "type": 1,  # mp4录制
            "vhost": "__defaultVhost__",
            "app": app,
            "stream": stream
        }
        
        return await ZLMediaService._request("stopRecord", params)
    
    @staticmethod
    async def get_rtsp_to_rtmp_url(rtsp_url: str) -> Dict[str, str]:
        """
        将RTSP地址转换为各种格式的播放地址
        
        Args:
            rtsp_url: RTSP地址
            
        Returns:
            各种格式的播放地址
        """
        # 从RTSP URL生成唯一的stream_id
        stream_id = hashlib.md5(rtsp_url.encode()).hexdigest()
        app = "live"
        
        # 添加代理
        try:
            await ZLMediaService.add_stream_proxy(app, stream_id, rtsp_url)
        except HTTPException as e:
            # 如果已存在，尝试重启
            if "已存在" in str(e):
                await ZLMediaService.restart_stream_proxy(app, stream_id)
            else:
                raise e
        
        # 构建各种协议的播放地址
        server_host = settings.ZLMEDIAKIT_API_URL.replace("http://", "").split(":")[0]
        
        # 生成不同协议的播放地址
        urls = {
            "rtmp": f"rtmp://{server_host}:1935/{app}/{stream_id}",
            "flv": f"http://{server_host}:8080/{app}/{stream_id}.flv",
            "hls": f"http://{server_host}:8080/{app}/{stream_id}/hls.m3u8",
            "ws_flv": f"ws://{server_host}:8080/{app}/{stream_id}.flv",
            "rtsp": f"rtsp://{server_host}:8554/{app}/{stream_id}",
            "fmp4": f"http://{server_host}:8080/{app}/{stream_id}.fmp4"
        }
        
        return urls 