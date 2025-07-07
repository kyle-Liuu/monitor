@echo off
echo 正在运行数据库迁移...
python run_migration.py
if %ERRORLEVEL% NEQ 0 (
    echo 迁移失败，请检查日志
    pause
    exit /b %ERRORLEVEL%
)
echo 迁移成功完成
pause 