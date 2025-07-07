#!/usr/bin/env python
"""
运行数据库迁移脚本
"""

import sys
import logging
from importlib import import_module
from pathlib import Path

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

def run_migrations():
    """运行所有迁移脚本"""
    # 迁移脚本目录
    migrations_dir = Path(__file__).resolve().parent / "app" / "db" / "migrations"
    
    if not migrations_dir.exists():
        logger.error(f"迁移目录不存在: {migrations_dir}")
        return False
    
    # 获取所有Python迁移脚本
    migration_files = sorted([f for f in migrations_dir.glob("*.py") if f.name != "__init__.py"])
    
    if not migration_files:
        logger.info("没有找到迁移脚本")
        return True
    
    success = True
    
    # 执行每个迁移脚本
    for migration_file in migration_files:
        logger.info(f"执行迁移脚本: {migration_file.name}")
        
        try:
            # 导入模块
            module_name = f"app.db.migrations.{migration_file.stem}"
            migration_module = import_module(module_name)
            
            # 执行main函数
            if hasattr(migration_module, "main"):
                migration_module.main()
                logger.info(f"迁移脚本 {migration_file.name} 执行成功")
            else:
                logger.warning(f"迁移脚本 {migration_file.name} 没有main函数，跳过")
        
        except Exception as e:
            logger.error(f"执行迁移脚本 {migration_file.name} 失败: {str(e)}")
            success = False
    
    return success

def main():
    """主函数"""
    logger.info("开始执行数据库迁移")
    success = run_migrations()
    
    if success:
        logger.info("所有迁移脚本执行成功")
    else:
        logger.error("部分迁移脚本执行失败")
        sys.exit(1)

if __name__ == "__main__":
    main() 