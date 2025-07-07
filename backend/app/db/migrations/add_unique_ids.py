#!/usr/bin/env python
"""
为各表添加唯一标识字段的迁移脚本
"""

import logging
import sys
import sqlite3
import string
import random
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

def generate_random_id(prefix, length=7):
    """生成随机ID"""
    chars = string.ascii_letters + string.digits
    random_str = ''.join(random.choice(chars) for _ in range(length))
    return f"{prefix}{random_str}"

def add_unique_ids():
    """为各表添加唯一标识字段"""
    if not DB_FILE.exists():
        logger.error(f"数据库文件不存在: {DB_FILE}")
        return False
    
    try:
        # 连接到SQLite数据库
        conn = sqlite3.connect(str(DB_FILE))
        cursor = conn.cursor()
        
        # 为组织表添加org_id字段
        try:
            cursor.execute("PRAGMA table_info(organizations)")
            columns = cursor.fetchall()
            column_names = [column[1] for column in columns]
            
            if "org_id" not in column_names:
                logger.info("为organizations表添加org_id列...")
                cursor.execute("ALTER TABLE organizations ADD COLUMN org_id TEXT")
                
                # 为现有记录生成唯一ID
                cursor.execute("SELECT id FROM organizations")
                orgs = cursor.fetchall()
                for org in orgs:
                    org_id = generate_random_id("org")
                    cursor.execute("UPDATE organizations SET org_id = ? WHERE id = ?", (org_id, org[0]))
                
                # 添加唯一约束
                cursor.execute("CREATE UNIQUE INDEX idx_org_id ON organizations(org_id)")
                logger.info("organizations表更新完成")
            else:
                logger.info("org_id列已存在，跳过")
        except Exception as e:
            logger.error(f"更新organizations表失败: {str(e)}")
        
        # 为虚拟组织表添加vorg_id字段
        try:
            cursor.execute("PRAGMA table_info(virtual_organizations)")
            columns = cursor.fetchall()
            column_names = [column[1] for column in columns]
            
            if "vorg_id" not in column_names:
                logger.info("为virtual_organizations表添加vorg_id列...")
                cursor.execute("ALTER TABLE virtual_organizations ADD COLUMN vorg_id TEXT")
                
                # 为现有记录生成唯一ID
                cursor.execute("SELECT id FROM virtual_organizations")
                vorgs = cursor.fetchall()
                for vorg in vorgs:
                    vorg_id = generate_random_id("vorg")
                    cursor.execute("UPDATE virtual_organizations SET vorg_id = ? WHERE id = ?", (vorg_id, vorg[0]))
                
                # 添加唯一约束
                cursor.execute("CREATE UNIQUE INDEX idx_vorg_id ON virtual_organizations(vorg_id)")
                logger.info("virtual_organizations表更新完成")
            else:
                logger.info("vorg_id列已存在，跳过")
        except Exception as e:
            logger.error(f"更新virtual_organizations表失败: {str(e)}")
        
        # 为视频流表添加stream_id字段
        try:
            cursor.execute("PRAGMA table_info(videostreams)")
            columns = cursor.fetchall()
            column_names = [column[1] for column in columns]
            
            if "stream_id" not in column_names:
                logger.info("为videostreams表添加stream_id列...")
                cursor.execute("ALTER TABLE videostreams ADD COLUMN stream_id TEXT")
                
                # 为现有记录生成唯一ID
                cursor.execute("SELECT id FROM videostreams")
                streams = cursor.fetchall()
                for stream in streams:
                    stream_id = generate_random_id("stream")
                    cursor.execute("UPDATE videostreams SET stream_id = ? WHERE id = ?", (stream_id, stream[0]))
                
                # 添加唯一约束
                cursor.execute("CREATE UNIQUE INDEX idx_stream_id ON videostreams(stream_id)")
                logger.info("videostreams表更新完成")
            else:
                logger.info("stream_id列已存在，跳过")
        except Exception as e:
            logger.error(f"更新videostreams表失败: {str(e)}")
        
        # 为算法表添加algo_id字段
        try:
            cursor.execute("PRAGMA table_info(algorithms)")
            columns = cursor.fetchall()
            column_names = [column[1] for column in columns]
            
            if "algo_id" not in column_names:
                logger.info("为algorithms表添加algo_id列...")
                cursor.execute("ALTER TABLE algorithms ADD COLUMN algo_id TEXT")
                
                # 为现有记录生成唯一ID
                cursor.execute("SELECT id FROM algorithms")
                algos = cursor.fetchall()
                for algo in algos:
                    algo_id = generate_random_id("algo")
                    cursor.execute("UPDATE algorithms SET algo_id = ? WHERE id = ?", (algo_id, algo[0]))
                
                # 添加唯一约束
                cursor.execute("CREATE UNIQUE INDEX idx_algo_id ON algorithms(algo_id)")
                logger.info("algorithms表更新完成")
            else:
                logger.info("algo_id列已存在，跳过")
        except Exception as e:
            logger.error(f"更新algorithms表失败: {str(e)}")
        
        # 为警告表添加warn_id字段
        try:
            cursor.execute("PRAGMA table_info(warnings)")
            columns = cursor.fetchall()
            column_names = [column[1] for column in columns]
            
            if "warn_id" not in column_names:
                logger.info("为warnings表添加warn_id列...")
                cursor.execute("ALTER TABLE warnings ADD COLUMN warn_id TEXT")
                
                # 为现有记录生成唯一ID
                cursor.execute("SELECT id FROM warnings")
                warnings = cursor.fetchall()
                for warning in warnings:
                    warn_id = generate_random_id("warn")
                    cursor.execute("UPDATE warnings SET warn_id = ? WHERE id = ?", (warn_id, warning[0]))
                
                # 添加唯一约束
                cursor.execute("CREATE UNIQUE INDEX idx_warn_id ON warnings(warn_id)")
                logger.info("warnings表更新完成")
            else:
                logger.info("warn_id列已存在，跳过")
        except Exception as e:
            logger.error(f"更新warnings表失败: {str(e)}")
        
        # 为监控任务表添加task_id字段
        try:
            cursor.execute("PRAGMA table_info(monitor_tasks)")
            columns = cursor.fetchall()
            column_names = [column[1] for column in columns]
            
            if "task_id" not in column_names:
                logger.info("为monitor_tasks表添加task_id列...")
                cursor.execute("ALTER TABLE monitor_tasks ADD COLUMN task_id TEXT")
                
                # 为现有记录生成唯一ID
                cursor.execute("SELECT id FROM monitor_tasks")
                tasks = cursor.fetchall()
                for task in tasks:
                    task_id = generate_random_id("task")
                    cursor.execute("UPDATE monitor_tasks SET task_id = ? WHERE id = ?", (task_id, task[0]))
                
                # 添加唯一约束
                cursor.execute("CREATE UNIQUE INDEX idx_task_id ON monitor_tasks(task_id)")
                logger.info("monitor_tasks表更新完成")
            else:
                logger.info("task_id列已存在，跳过")
        except Exception as e:
            logger.error(f"更新monitor_tasks表失败: {str(e)}")
        
        # 提交更改
        conn.commit()
        logger.info("所有表的唯一标识字段迁移完成")
        
        # 关闭连接
        conn.close()
        return True
    
    except Exception as e:
        logger.error(f"迁移失败: {str(e)}")
        return False

def main():
    """主函数"""
    logger.info("开始迁移: 添加唯一标识字段")
    success = add_unique_ids()
    
    if success:
        logger.info("迁移成功完成")
    else:
        logger.error("迁移失败")
        sys.exit(1)

if __name__ == "__main__":
    main() 