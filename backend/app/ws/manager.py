from typing import Dict, List, Set, Any, Optional, Callable
import logging
import json
import asyncio
from fastapi import WebSocket
from datetime import datetime

# 这里修复了循环导入
logger = logging.getLogger(__name__)

class ConnectionManager:
    """
    WebSocket连接管理器
    管理活跃的WebSocket连接，并提供向客户端广播消息的功能
    """
    def __init__(self):
        # 活跃连接: client_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        # 主题订阅: topic -> Set[client_id]
        self.subscriptions: Dict[str, Set[str]] = {}
        # 用户会话: user_id -> Set[client_id]
        self.user_sessions: Dict[str, Set[str]] = {}

    async def connect(self, websocket: WebSocket, client_id: str) -> None:
        """
        处理新的WebSocket连接
        """
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"客户端 {client_id} 已连接，当前连接数: {len(self.active_connections)}")

    def disconnect(self, client_id: str) -> None:
        """
        处理WebSocket断开连接
        """
        # 移除活跃连接
        if client_id in self.active_connections:
            self.active_connections.pop(client_id)
        
        # 移除订阅
        for topic in list(self.subscriptions.keys()):
            if client_id in self.subscriptions[topic]:
                self.subscriptions[topic].remove(client_id)
                # 如果主题没有订阅者，删除主题
                if not self.subscriptions[topic]:
                    self.subscriptions.pop(topic)
        
        # 移除用户会话
        for user_id in list(self.user_sessions.keys()):
            if client_id in self.user_sessions[user_id]:
                self.user_sessions[user_id].remove(client_id)
                # 如果用户没有活跃会话，删除用户
                if not self.user_sessions[user_id]:
                    self.user_sessions.pop(user_id)
        
        logger.info(f"客户端 {client_id} 已断开连接，当前连接数: {len(self.active_connections)}")

    async def send_personal_message(self, message: Any, client_id: str) -> None:
        """
        向指定客户端发送消息
        """
        if client_id not in self.active_connections:
            logger.warning(f"尝试向未连接的客户端 {client_id} 发送消息")
            return
        
        websocket = self.active_connections[client_id]
        message_data = self._format_message(message)
        await websocket.send_text(message_data)

    async def broadcast(self, message: Any, topic: str = None) -> None:
        """
        广播消息到所有订阅了特定主题的客户端
        如果主题为None，则广播到所有客户端
        """
        message_data = self._format_message(message)
        
        if topic is not None and topic in self.subscriptions:
            # 广播到特定主题的订阅者
            for client_id in self.subscriptions[topic]:
                if client_id in self.active_connections:
                    await self.active_connections[client_id].send_text(message_data)
        elif topic is None:
            # 广播到所有客户端
            for websocket in self.active_connections.values():
                await websocket.send_text(message_data)

    def subscribe(self, client_id: str, topic: str) -> None:
        """
        订阅特定主题
        """
        if topic not in self.subscriptions:
            self.subscriptions[topic] = set()
        
        self.subscriptions[topic].add(client_id)
        logger.info(f"客户端 {client_id} 已订阅主题 {topic}")

    def unsubscribe(self, client_id: str, topic: str) -> None:
        """
        取消订阅特定主题
        """
        if topic in self.subscriptions and client_id in self.subscriptions[topic]:
            self.subscriptions[topic].remove(client_id)
            # 如果主题没有订阅者，删除主题
            if not self.subscriptions[topic]:
                self.subscriptions.pop(topic)
            logger.info(f"客户端 {client_id} 已取消订阅主题 {topic}")

    def register_user_session(self, client_id: str, user_id: str) -> None:
        """
        注册用户会话
        """
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = set()
        
        self.user_sessions[user_id].add(client_id)
        logger.info(f"用户 {user_id} 已注册会话 {client_id}")

    async def broadcast_to_user(self, user_id: str, message: Any) -> None:
        """
        广播消息到特定用户的所有会话
        """
        if user_id not in self.user_sessions:
            return
        
        message_data = self._format_message(message)
        for client_id in self.user_sessions[user_id]:
            if client_id in self.active_connections:
                await self.active_connections[client_id].send_text(message_data)

    def _format_message(self, message: Any) -> str:
        """
        格式化消息为JSON字符串
        """
        if isinstance(message, str):
            return message
        
        # 如果已经是字典，添加时间戳
        if isinstance(message, dict):
            if 'timestamp' not in message:
                message['timestamp'] = datetime.now().isoformat()
            return json.dumps(message)
        
        # 其他类型，转换为字符串
        return json.dumps(message)


# 创建全局连接管理器实例
manager = ConnectionManager()

class WebSocketEventManager:
    """WebSocket事件管理器，处理实时事件和通知"""
    
    def __init__(self):
        # 事件处理器注册表
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        # 事件队列
        self.event_queue: asyncio.Queue = asyncio.Queue()
        
        # 启动事件处理循环
        self.task = asyncio.create_task(self._process_events())
    
    def register_handler(self, event_type: str, handler: Callable) -> None:
        """
        注册事件处理器
        
        Args:
            event_type: 事件类型
            handler: 处理函数
        """
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
            
        self.event_handlers[event_type].append(handler)
        logger.info(f"注册事件处理器: {event_type}")
    
    def unregister_handler(self, event_type: str, handler: Callable) -> None:
        """
        注销事件处理器
        
        Args:
            event_type: 事件类型
            handler: 处理函数
        """
        if event_type in self.event_handlers and handler in self.event_handlers[event_type]:
            self.event_handlers[event_type].remove(handler)
            logger.info(f"注销事件处理器: {event_type}")
    
    def emit_event(self, event_type: str, data: Dict[str, Any], target: Optional[Dict[str, Any]] = None) -> None:
        """
        发送事件
        
        Args:
            event_type: 事件类型
            data: 事件数据
            target: 目标信息，如组名或用户ID
        """
        event = {
            "type": event_type,
            "data": data,
            "target": target
        }
        
        self.event_queue.put_nowait(event)
    
    async def _process_events(self) -> None:
        """处理事件队列"""
        while True:
            try:
                event = await self.event_queue.get()
                
                event_type = event["type"]
                data = event["data"]
                target = event["target"]
                
                # 构建消息
                message = {
                    "event": event_type,
                    "data": data
                }
                
                # 执行所有注册的处理器
                if event_type in self.event_handlers:
                    for handler in self.event_handlers[event_type]:
                        try:
                            await handler(data)
                        except Exception as e:
                            logger.error(f"事件处理器异常: {str(e)}")
                
                # 发送消息，修正queue_message不存在的问题，使用broadcast或broadcast_to_user
                try:
                    if target:
                        if "topic" in target:
                            await manager.broadcast(message, topic=target["topic"])
                        elif "user_id" in target:
                            await manager.broadcast_to_user(target["user_id"], message)
                        else:
                            await manager.broadcast(message)
                    else:
                        await manager.broadcast(message)
                except Exception as e:
                    logger.error(f"发送WebSocket消息异常: {str(e)}")
                
                self.event_queue.task_done()
                
            except Exception as e:
                logger.error(f"处理事件队列异常: {str(e)}")
                await asyncio.sleep(1)  # 防止循环过快
    
    async def handle_client_message(self, websocket: WebSocket, message: Dict[str, Any]) -> None:
        """
        处理来自客户端的消息
        
        Args:
            websocket: WebSocket连接
            message: 客户端消息
        """
        try:
            event_type = message.get("event")
            if not event_type:
                logger.warning("收到没有事件类型的消息")
                return
                
            data = message.get("data", {})
            
            # 触发事件
            self.emit_event(event_type, data)
                
        except Exception as e:
            logger.error(f"处理客户端消息异常: {str(e)}")


# 创建全局事件管理器实例
event_manager = WebSocketEventManager()


# 定义事件类型
class EventTypes:
    # 监控相关事件
    MONITOR_START = "monitor_start"
    MONITOR_STOP = "monitor_stop"
    MONITOR_STATUS = "monitor_status"
    
    # 告警相关事件
    WARNING_NEW = "warning_new"
    WARNING_UPDATE = "warning_update"
    
    # 系统相关事件
    SYSTEM_STATUS = "system_status"
    
    # 检测结果事件
    DETECTION_RESULT = "detection_result"


# 事件处理器示例
async def handle_monitor_status(data: Dict[str, Any]) -> None:
    """处理监控状态事件"""
    logger.info(f"处理监控状态事件: {data}")
    
async def handle_warning_new(data: Dict[str, Any]) -> None:
    """处理新告警事件"""
    logger.info(f"处理新告警事件: {data}")


# 注册事件处理器
event_manager.register_handler(EventTypes.MONITOR_STATUS, handle_monitor_status)
event_manager.register_handler(EventTypes.WARNING_NEW, handle_warning_new) 