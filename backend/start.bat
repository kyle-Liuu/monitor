@echo off
echo 启动AI监控管理系统后端服务...
echo.

if "%1"=="--reset" (
    echo 重置数据库并启动服务...
    python server.py --reset-db
) else (
    echo 直接启动服务...
    python server.py
)

echo.
echo 服务已启动，可通过Ctrl+C终止服务
echo API文档地址: http://127.0.0.1:8000/docs 