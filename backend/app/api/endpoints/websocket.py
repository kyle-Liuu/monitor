from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query, status
import json
import logging
import uuid

from app.api.deps import get_current_user_from_token
from app.models.user import User
from app.ws.connection import manager
from app.ws.manager import event_manager

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/connect")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    group: str = Query("default")
):
    """
    WebSocket连接端点
    
    Args:
        websocket: WebSocket连接
        token: 用户认证令牌
        group: 连接组名称
    """
    # 验证用户
    try:
        user = await get_current_user_from_token(token)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception as e:
        logger.error(f"WebSocket认证失败: {str(e)}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    # 生成客户端ID
    client_id = f"{group}_{str(uuid.uuid4())}"
    
    try:
        # 接受连接
        await manager.connect(websocket, group, user.id)
        
        # 发送欢迎消息
        await manager.send_personal_message(
            {
                "event": "connect",
                "data": {
                    "client_id": client_id,
                    "message": "已连接到WebSocket服务器",
                    "user_id": user.id,
                    "group": group
                }
            },
            websocket
        )
        
        # 消息处理循环
        while True:
            try:
                # 接收消息
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # 处理消息
                await event_manager.handle_client_message(websocket, message)
                
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    {"event": "error", "data": {"message": "无效的JSON格式"}},
                    websocket
                )
            except Exception as e:
                logger.error(f"处理WebSocket消息异常: {str(e)}")
                await manager.send_personal_message(
                    {"event": "error", "data": {"message": str(e)}},
                    websocket
                )
                
    except WebSocketDisconnect:
        logger.info(f"客户端断开连接: {client_id}")
    except Exception as e:
        logger.error(f"WebSocket连接异常: {str(e)}")
    finally:
        # 断开连接
        manager.disconnect(websocket, group)

@router.websocket("/monitor/{task_id}")
async def monitor_websocket_endpoint(
    websocket: WebSocket,
    task_id: int,
    token: str = Query(...),
):
    """
    监控任务WebSocket连接端点
    
    Args:
        websocket: WebSocket连接
        task_id: 监控任务ID
        token: 用户认证令牌
    """
    # 验证用户
    try:
        user = await get_current_user_from_token(token)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception as e:
        logger.error(f"WebSocket认证失败: {str(e)}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    # 监控任务组
    group = f"monitor_{task_id}"
    
    try:
        # 接受连接
        await manager.connect(websocket, group, user.id)
        
        # 发送欢迎消息
        await manager.send_personal_message(
            {
                "event": "connect",
                "data": {
                    "task_id": task_id,
                    "message": f"已连接到监控任务 {task_id}",
                    "user_id": user.id
                }
            },
            websocket
        )
        
        # 消息处理循环
        while True:
            try:
                # 接收消息
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # 处理消息
                await event_manager.handle_client_message(websocket, message)
                
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    {"event": "error", "data": {"message": "无效的JSON格式"}},
                    websocket
                )
            except Exception as e:
                logger.error(f"处理WebSocket消息异常: {str(e)}")
                await manager.send_personal_message(
                    {"event": "error", "data": {"message": str(e)}},
                    websocket
                )
                
    except WebSocketDisconnect:
        logger.info(f"客户端断开监控连接: {task_id}")
    except Exception as e:
        logger.error(f"监控WebSocket连接异常: {str(e)}")
    finally:
        # 断开连接
        manager.disconnect(websocket, group)

@router.websocket("/warnings")
async def warnings_websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    告警信息WebSocket连接端点
    
    Args:
        websocket: WebSocket连接
        token: 用户认证令牌
    """
    # 验证用户
    try:
        user = await get_current_user_from_token(token)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception as e:
        logger.error(f"WebSocket认证失败: {str(e)}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    # 告警信息组
    group = "warnings"
    
    try:
        # 接受连接
        await manager.connect(websocket, group, user.id)
        
        # 发送欢迎消息
        await manager.send_personal_message(
            {
                "event": "connect",
                "data": {
                    "message": "已连接到告警信息服务",
                    "user_id": user.id
                }
            },
            websocket
        )
        
        # 消息处理循环
        while True:
            try:
                # 接收消息
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # 处理消息
                await event_manager.handle_client_message(websocket, message)
                
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    {"event": "error", "data": {"message": "无效的JSON格式"}},
                    websocket
                )
            except Exception as e:
                logger.error(f"处理WebSocket消息异常: {str(e)}")
                await manager.send_personal_message(
                    {"event": "error", "data": {"message": str(e)}},
                    websocket
                )
                
    except WebSocketDisconnect:
        logger.info(f"客户端断开告警连接: {user.id}")
    except Exception as e:
        logger.error(f"告警WebSocket连接异常: {str(e)}")
    finally:
        # 断开连接
        manager.disconnect(websocket, group) 