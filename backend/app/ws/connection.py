import logging
import json
import uuid
from typing import Any, Dict, Optional, List, Callable
from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from jose import jwt, JWTError
import asyncio

from app.core.config import settings
from app.core.security import get_token_payload
from app.ws.manager import manager
from app.utils.deps import get_current_user
from app.db.session import get_db
from app import models

logger = logging.getLogger(__name__)

async def websocket_auth(websocket: WebSocket) -> Optional[models.User]:
    """
    WebSocket认证中间件
    验证连接请求中的token，并返回对应的用户
    """
    try:
        # 获取token
        token = websocket.query_params.get("token")
        if not token:
            logger.warning("WebSocket连接尝试未提供令牌")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None
        
        # 验证token
        payload = get_token_payload(token)
        if not payload or "sub" not in payload:
            logger.warning("WebSocket连接提供了无效令牌")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None
        
        # 获取用户
        db = next(get_db())
        user = db.query(models.User).filter(models.User.id == payload["sub"]).first()
        if not user:
            logger.warning(f"WebSocket连接用户不存在: {payload['sub']}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None
        
        if not user.is_active:
            logger.warning(f"WebSocket连接用户已禁用: {user.username}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None
        
        return user
    except JWTError:
        logger.warning("WebSocket连接JWT验证错误")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None
    except Exception as e:
        logger.error(f"WebSocket认证发生错误: {str(e)}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        return None

async def handle_websocket_connection(websocket: WebSocket):
    """
    处理WebSocket连接
    """
    # 验证身份
    user = await websocket_auth(websocket)
    if not user:
        return
    
    # 生成客户端ID
    client_id = str(uuid.uuid4())
    
    try:
        # 接受连接
        await manager.connect(websocket, client_id, str(user.id))
        
        # 注册用户会话
        manager.register_user_session(client_id, str(user.id))
        
        # 发送欢迎消息
        await manager.send_personal_message({
            "type": "connection_established",
            "message": "WebSocket连接已建立",
            "client_id": client_id
        }, client_id)
        
        # 持续接收消息
        while True:
            # 等待接收消息
            data = await websocket.receive_text()
            
            try:
                # 解析消息
                message = json.loads(data)
                
                # 处理订阅请求
                if message.get("type") == "subscribe" and "topic" in message:
                    topic = message["topic"]
                    manager.subscribe(client_id, topic)
                    await manager.send_personal_message({
                        "type": "subscription_success",
                        "topic": topic
                    }, client_id)
                
                # 处理取消订阅请求
                elif message.get("type") == "unsubscribe" and "topic" in message:
                    topic = message["topic"]
                    manager.unsubscribe(client_id, topic)
                    await manager.send_personal_message({
                        "type": "unsubscription_success",
                        "topic": topic
                    }, client_id)
                
                # 处理心跳请求
                elif message.get("type") == "ping":
                    await manager.send_personal_message({
                        "type": "pong"
                    }, client_id)
                
                # 其他消息类型
                else:
                    logger.debug(f"接收到未知类型的消息: {message}")
            
            except json.JSONDecodeError:
                logger.warning(f"接收到无效的JSON消息: {data}")
            except Exception as e:
                logger.error(f"处理WebSocket消息时发生错误: {str(e)}")
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket客户端断开连接: {client_id}")
    except Exception as e:
        logger.error(f"WebSocket连接处理发生错误: {str(e)}")
    finally:
        # 断开连接
        manager.disconnect(websocket, client_id)

class ConnectionManager:
    """WebSocket连接管理器，支持实时数据推送"""
    
    def __init__(self):
        # 按组管理的活跃连接
        self.active_connections: Dict[str, List[WebSocket]] = {}
        
        # 连接对应的用户ID
        self.connection_user_map: Dict[WebSocket, int] = {}
        
        # 消息队列
        self.message_queue: asyncio.Queue = asyncio.Queue()
        
        # 任务引用
        self.task = None
    
    async def start(self):
        """启动消息处理循环"""
        if self.task is None:
            self.task = asyncio.create_task(self._process_messages())
            logger.info("WebSocket连接管理器已启动")
    
    async def stop(self):
        """停止消息处理循环"""
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
            self.task = None
            logger.info("WebSocket连接管理器已停止")
    
    async def connect(self, websocket: WebSocket, group: str, user_id: Optional[int] = None) -> None:
        """
        接受WebSocket连接并添加到指定组
        
        Args:
            websocket: WebSocket连接
            group: 连接组名称
            user_id: 用户ID（可选）
        """
        await websocket.accept()
        
        if group not in self.active_connections:
            self.active_connections[group] = []
            
        self.active_connections[group].append(websocket)
        
        if user_id is not None:
            self.connection_user_map[websocket] = user_id
            
        logger.info(f"WebSocket连接已建立 - 组: {group}, 用户ID: {user_id}")
    
    def disconnect(self, websocket: WebSocket, group: str) -> None:
        """
        断开WebSocket连接并从指定组移除
        
        Args:
            websocket: WebSocket连接
            group: 连接组名称
        """
        if group in self.active_connections:
            if websocket in self.active_connections[group]:
                self.active_connections[group].remove(websocket)
                
                # 如果组为空，删除组
                if not self.active_connections[group]:
                    del self.active_connections[group]
        
        # 从用户映射中移除
        if websocket in self.connection_user_map:
            user_id = self.connection_user_map.pop(websocket)
            logger.info(f"WebSocket连接已断开 - 组: {group}, 用户ID: {user_id}")
        else:
            logger.info(f"WebSocket连接已断开 - 组: {group}")
    
    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket) -> None:
        """
        发送消息给指定连接
        
        Args:
            message: 要发送的消息
            websocket: 目标WebSocket连接
        """
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"发送个人消息失败: {str(e)}")
    
    async def broadcast(self, message: Dict[str, Any], group: str) -> None:
        """
        广播消息给指定组的所有连接
        
        Args:
            message: 要广播的消息
            group: 目标组名称
        """
        if group not in self.active_connections:
            logger.warning(f"尝试向不存在的组广播消息: {group}")
            return
            
        disconnected_websockets = []
        
        for websocket in self.active_connections[group]:
            try:
                await websocket.send_json(message)
            except WebSocketDisconnect:
                disconnected_websockets.append(websocket)
            except Exception as e:
                logger.error(f"广播消息失败: {str(e)}")
                disconnected_websockets.append(websocket)
        
        # 清理断开的连接
        for websocket in disconnected_websockets:
            self.disconnect(websocket, group)
    
    async def broadcast_to_all(self, message: Dict[str, Any]) -> None:
        """
        广播消息给所有组的所有连接
        
        Args:
            message: 要广播的消息
        """
        for group in self.active_connections:
            await self.broadcast(message, group)
    
    async def broadcast_to_user(self, message: Dict[str, Any], user_id: int) -> None:
        """
        广播消息给指定用户的所有连接
        
        Args:
            message: 要广播的消息
            user_id: 目标用户ID
        """
        user_websockets = []
        
        for websocket, ws_user_id in self.connection_user_map.items():
            if ws_user_id == user_id:
                user_websockets.append(websocket)
        
        for websocket in user_websockets:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"向用户广播消息失败: {str(e)}")
    
    def queue_message(self, message: Dict[str, Any], group: Optional[str] = None, user_id: Optional[int] = None) -> None:
        """
        将消息加入队列
        
        Args:
            message: 要发送的消息
            group: 目标组名称（可选）
            user_id: 目标用户ID（可选）
        """
        self.message_queue.put_nowait({
            "message": message,
            "group": group,
            "user_id": user_id
        })
    
    async def _process_messages(self) -> None:
        """处理消息队列"""
        while True:
            try:
                item = await self.message_queue.get()
                
                message = item["message"]
                group = item["group"]
                user_id = item["user_id"]
                
                if group is not None:
                    await self.broadcast(message, group)
                elif user_id is not None:
                    await self.broadcast_to_user(message, user_id)
                else:
                    await self.broadcast_to_all(message)
                    
                self.message_queue.task_done()
                
            except Exception as e:
                logger.error(f"处理消息队列异常: {str(e)}")
                await asyncio.sleep(1)  # 防止循环过快
    
    def get_connected_users(self, group: Optional[str] = None) -> List[int]:
        """
        获取已连接的用户ID列表
        
        Args:
            group: 组名称（可选，如果提供则只返回该组的用户）
            
        Returns:
            用户ID列表
        """
        user_ids = set()
        
        if group:
            if group in self.active_connections:
                for websocket in self.active_connections[group]:
                    if websocket in self.connection_user_map:
                        user_ids.add(self.connection_user_map[websocket])
        else:
            for user_id in self.connection_user_map.values():
                user_ids.add(user_id)
                
        return list(user_ids)
    
    def get_connection_count(self, group: Optional[str] = None) -> int:
        """
        获取连接数量
        
        Args:
            group: 组名称（可选，如果提供则只返回该组的连接数）
            
        Returns:
            连接数量
        """
        if group:
            if group in self.active_connections:
                return len(self.active_connections[group])
            return 0
        
        # 计算所有连接数
        total = 0
        for connections in self.active_connections.values():
            total += len(connections)
        return total


# 单例实例
manager = ConnectionManager() 