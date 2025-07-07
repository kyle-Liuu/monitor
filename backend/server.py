#!/usr/bin/env python
"""
AI监控管理系统后端统一启动脚本

提供数据库重置、服务配置和启动功能。
使用方法:
  python server.py                       # 直接启动服务
  python server.py --reset-db            # 重置数据库后启动服务
  python server.py --reset-db --backup   # 备份后重置数据库并启动服务
  python server.py --host 0.0.0.0 --port 8000  # 指定主机和端口
  python server.py --help                # 显示所有可用选项
"""

import os
import sys
import logging
import argparse
import uvicorn
from pathlib import Path

# 配置日志
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join("logs", "server.log"))
    ]
)

logger = logging.getLogger(__name__)

def reset_database(backup=False, keep_uploads=False):
    """调用reset_db.py重置数据库"""
    try:
        from reset_db import reset_database as reset_db_func
        success = reset_db_func(backup=backup, keep_uploads=keep_uploads)
        if success:
            logger.info("数据库重置完成")
            print("\n可用的测试账户:")
            print("超级管理员: Super / 123456")
            print("管理员: Admin / 123456")
            print("普通用户: User / 123456\n")
            return True
        else:
            logger.error("数据库重置失败")
            return False
    except Exception as e:
        logger.error(f"重置数据库失败: {str(e)}")
        return False

def start_server(host="127.0.0.1", port=8000, reload=True, log_level="info"):
    """启动后端服务"""
    logger.info(f"正在启动后端服务，地址: http://{host}:{port}")
    logger.info(f"API文档地址: http://{host}:{port}/docs")
    
    try:
        # 启动FastAPI服务器
        uvicorn.run(
            "main:app", 
            host=host, 
            port=port, 
            reload=reload,
            log_level=log_level
        )
    except Exception as e:
        logger.error(f"启动服务失败: {str(e)}")
        sys.exit(1)

def main():
    """主函数，解析命令行参数并启动服务"""
    parser = argparse.ArgumentParser(description="AI监控管理系统后端启动脚本")
    parser.add_argument("--reset-db", action="store_true", help="启动前重置数据库")
    parser.add_argument("--backup", action="store_true", help="重置数据库前先备份")
    parser.add_argument("--keep-uploads", action="store_true", help="重置数据库时保留上传文件")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="服务监听的主机地址")
    parser.add_argument("--port", type=int, default=8000, help="服务监听的端口")
    parser.add_argument("--no-reload", action="store_true", help="禁用热重载")
    parser.add_argument("--log-level", type=str, default="info", 
                       choices=["debug", "info", "warning", "error", "critical"],
                       help="日志级别")
    
    args = parser.parse_args()
    
    # 如果指定了reset-db参数，先重置数据库
    if args.reset_db:
        if not reset_database(backup=args.backup, keep_uploads=args.keep_uploads):
            logger.error("由于数据库重置失败，服务启动终止")
            sys.exit(1)
    
    # 启动服务
    start_server(args.host, args.port, not args.no_reload, args.log_level)

if __name__ == "__main__":
    main() 