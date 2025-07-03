"""
WebSocket模块，提供实时数据推送功能

该模块实现:
- WebSocket连接管理
- 用户认证
- 主题订阅/发布
- 实时告警推送
- 监控数据实时更新
"""

from app.ws.manager import manager
from app.ws.connection import handle_websocket_connection

# 导出公共接口
__all__ = ["manager", "handle_websocket_connection"] 