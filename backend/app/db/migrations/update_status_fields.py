#!/usr/bin/env python
"""
更新各表状态字段为整数类型的迁移脚本
"""

import logging
import sys
import sqlite3
from pathlib import Path

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

# 获取项目根目录
SCRIPT_DIR = Path(__file__).resolve().parent.parent.parent.parent
DB_FILE = SCRIPT_DIR / "sql_app.db"

def update_status_fields():
    """更新各表状态字段为整数类型"""
    if not DB_FILE.exists():
        logger.error(f"数据库文件不存在: {DB_FILE}")
        return False
    
    try:
        # 连接到SQLite数据库
        conn = sqlite3.connect(str(DB_FILE))
        cursor = conn.cursor()
        
        # 更新视频流表状态字段
        try:
            # 检查status字段类型
            cursor.execute("PRAGMA table_info(videostreams)")
            columns = cursor.fetchall()
            status_column = next((col for col in columns if col[1] == "status"), None)
            
            if status_column and status_column[2] == "TEXT":
                logger.info("更新videostreams表status字段为整数类型...")
                
                # 创建临时表
                cursor.execute("""
                CREATE TABLE videostreams_temp (
                    id INTEGER PRIMARY KEY,
                    stream_id TEXT,
                    name TEXT NOT NULL,
                    url TEXT NOT NULL,
                    type TEXT NOT NULL,
                    status INTEGER DEFAULT 0,
                    organization_id INTEGER,
                    location TEXT,
                    description TEXT,
                    config_json TEXT,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP,
                    FOREIGN KEY (organization_id) REFERENCES organizations (id)
                )
                """)
                
                # 复制数据并转换状态
                cursor.execute("SELECT id, stream_id, name, url, type, status, organization_id, location, description, config_json, created_at, updated_at FROM videostreams")
                rows = cursor.fetchall()
                
                for row in rows:
                    id, stream_id, name, url, type, status, organization_id, location, description, config_json, created_at, updated_at = row
                    # 转换状态: offline -> 0, online -> 1, error -> 2
                    if status == "offline":
                        new_status = 0
                    elif status == "online":
                        new_status = 1
                    elif status == "error":
                        new_status = 2
                    else:
                        new_status = 0
                    
                    cursor.execute("""
                    INSERT INTO videostreams_temp (id, stream_id, name, url, type, status, organization_id, location, description, config_json, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (id, stream_id, name, url, type, new_status, organization_id, location, description, config_json, created_at, updated_at))
                
                # 删除原表并重命名临时表
                cursor.execute("DROP TABLE videostreams")
                cursor.execute("ALTER TABLE videostreams_temp RENAME TO videostreams")
                
                # 重新创建索引
                cursor.execute("CREATE INDEX IF NOT EXISTS ix_videostreams_id ON videostreams(id)")
                if stream_id:
                    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_stream_id ON videostreams(stream_id)")
                
                logger.info("videostreams表status字段更新完成")
            else:
                logger.info("videostreams表status字段已经是整数类型或不存在，跳过")
        except Exception as e:
            logger.error(f"更新videostreams表status字段失败: {str(e)}")
        
        # 更新监控任务表状态字段
        try:
            # 检查status字段类型
            cursor.execute("PRAGMA table_info(monitor_tasks)")
            columns = cursor.fetchall()
            status_column = next((col for col in columns if col[1] == "status"), None)
            
            if status_column and status_column[2] == "TEXT":
                logger.info("更新monitor_tasks表status字段为整数类型...")
                
                # 创建临时表
                cursor.execute("""
                CREATE TABLE monitor_tasks_temp (
                    id INTEGER PRIMARY KEY,
                    task_id TEXT,
                    name TEXT NOT NULL,
                    videostream_id INTEGER,
                    algorithm_id INTEGER,
                    status INTEGER DEFAULT 0,
                    config_json TEXT,
                    schedule_type TEXT,
                    schedule_config TEXT,
                    created_by INTEGER,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP,
                    FOREIGN KEY (videostream_id) REFERENCES videostreams (id),
                    FOREIGN KEY (algorithm_id) REFERENCES algorithms (id),
                    FOREIGN KEY (created_by) REFERENCES users (id)
                )
                """)
                
                # 复制数据并转换状态
                cursor.execute("SELECT id, task_id, name, videostream_id, algorithm_id, status, config_json, schedule_type, schedule_config, created_by, created_at, updated_at FROM monitor_tasks")
                rows = cursor.fetchall()
                
                for row in rows:
                    id, task_id, name, videostream_id, algorithm_id, status, config_json, schedule_type, schedule_config, created_by, created_at, updated_at = row
                    # 转换状态: stopped -> 0, running -> 1, error -> 2
                    if status == "stopped":
                        new_status = 0
                    elif status == "running":
                        new_status = 1
                    elif status == "error":
                        new_status = 2
                    else:
                        new_status = 0
                    
                    cursor.execute("""
                    INSERT INTO monitor_tasks_temp (id, task_id, name, videostream_id, algorithm_id, status, config_json, schedule_type, schedule_config, created_by, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (id, task_id, name, videostream_id, algorithm_id, new_status, config_json, schedule_type, schedule_config, created_by, created_at, updated_at))
                
                # 删除原表并重命名临时表
                cursor.execute("DROP TABLE monitor_tasks")
                cursor.execute("ALTER TABLE monitor_tasks_temp RENAME TO monitor_tasks")
                
                # 重新创建索引
                cursor.execute("CREATE INDEX IF NOT EXISTS ix_monitor_tasks_id ON monitor_tasks(id)")
                if task_id:
                    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_task_id ON monitor_tasks(task_id)")
                
                logger.info("monitor_tasks表status字段更新完成")
            else:
                logger.info("monitor_tasks表status字段已经是整数类型或不存在，跳过")
        except Exception as e:
            logger.error(f"更新monitor_tasks表status字段失败: {str(e)}")
        
        # 更新警告表level字段
        try:
            # 检查level字段类型
            cursor.execute("PRAGMA table_info(warnings)")
            columns = cursor.fetchall()
            level_column = next((col for col in columns if col[1] == "level"), None)
            
            if level_column and level_column[2] == "TEXT":
                logger.info("更新warnings表level字段为整数类型...")
                
                # 添加status字段（如果不存在）
                status_column = next((col for col in columns if col[1] == "status"), None)
                if not status_column:
                    cursor.execute("ALTER TABLE warnings ADD COLUMN status INTEGER DEFAULT 0")
                
                # 创建临时表
                cursor.execute("""
                CREATE TABLE warnings_temp (
                    id INTEGER PRIMARY KEY,
                    warn_id TEXT,
                    type TEXT NOT NULL,
                    level INTEGER DEFAULT 1,
                    status INTEGER DEFAULT 0,
                    videostream_id INTEGER,
                    algorithm_id INTEGER,
                    detection_time TIMESTAMP,
                    image_path TEXT,
                    warning_metadata TEXT,
                    is_processed BOOLEAN DEFAULT 0,
                    processed_by INTEGER,
                    processed_at TIMESTAMP,
                    notes TEXT,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP,
                    FOREIGN KEY (videostream_id) REFERENCES videostreams (id),
                    FOREIGN KEY (algorithm_id) REFERENCES algorithms (id),
                    FOREIGN KEY (processed_by) REFERENCES users (id)
                )
                """)
                
                # 复制数据并转换级别
                cursor.execute("SELECT id, warn_id, type, level, status, videostream_id, algorithm_id, detection_time, image_path, warning_metadata, is_processed, processed_by, processed_at, notes, created_at, updated_at FROM warnings")
                rows = cursor.fetchall()
                
                for row in rows:
                    id, warn_id, type, level, status, videostream_id, algorithm_id, detection_time, image_path, warning_metadata, is_processed, processed_by, processed_at, notes, created_at, updated_at = row
                    # 转换级别: info -> 1, warning -> 2, critical -> 3
                    if level == "info":
                        new_level = 1
                    elif level == "warning":
                        new_level = 2
                    elif level == "critical":
                        new_level = 3
                    else:
                        new_level = 1
                    
                    # 如果status为None，设置为0
                    if status is None:
                        status = 0
                    
                    cursor.execute("""
                    INSERT INTO warnings_temp (id, warn_id, type, level, status, videostream_id, algorithm_id, detection_time, image_path, warning_metadata, is_processed, processed_by, processed_at, notes, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (id, warn_id, type, new_level, status, videostream_id, algorithm_id, detection_time, image_path, warning_metadata, is_processed, processed_by, processed_at, notes, created_at, updated_at))
                
                # 删除原表并重命名临时表
                cursor.execute("DROP TABLE warnings")
                cursor.execute("ALTER TABLE warnings_temp RENAME TO warnings")
                
                # 重新创建索引
                cursor.execute("CREATE INDEX IF NOT EXISTS ix_warnings_id ON warnings(id)")
                if warn_id:
                    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_warn_id ON warnings(warn_id)")
                
                logger.info("warnings表level和status字段更新完成")
            else:
                logger.info("warnings表level字段已经是整数类型或不存在，跳过")
        except Exception as e:
            logger.error(f"更新warnings表level字段失败: {str(e)}")
        
        # 更新算法表，添加status字段
        try:
            # 检查status字段是否存在
            cursor.execute("PRAGMA table_info(algorithms)")
            columns = cursor.fetchall()
            status_column = next((col for col in columns if col[1] == "status"), None)
            
            if not status_column:
                logger.info("为algorithms表添加status字段...")
                cursor.execute("ALTER TABLE algorithms ADD COLUMN status INTEGER DEFAULT 1")
                logger.info("algorithms表status字段添加完成")
            else:
                logger.info("algorithms表status字段已存在，跳过")
        except Exception as e:
            logger.error(f"更新algorithms表status字段失败: {str(e)}")
        
        # 提交更改
        conn.commit()
        logger.info("所有表的状态字段迁移完成")
        
        # 关闭连接
        conn.close()
        return True
    
    except Exception as e:
        logger.error(f"迁移失败: {str(e)}")
        return False

def main():
    """主函数"""
    logger.info("开始迁移: 更新状态字段为整数类型")
    success = update_status_fields()
    
    if success:
        logger.info("迁移成功完成")
    else:
        logger.error("迁移失败")
        sys.exit(1)

if __name__ == "__main__":
    main() 