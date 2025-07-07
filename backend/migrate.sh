#!/bin/bash
echo "正在运行数据库迁移..."
python run_migration.py
if [ $? -ne 0 ]; then
    echo "迁移失败，请检查日志"
    exit 1
fi
echo "迁移成功完成" 