#!/usr/bin/env python3
import sys
import subprocess
import importlib.util
import os
import platform

def check_and_install(package_name, version=None):
    """检查包是否已安装，如果没有则安装"""
    package_with_version = package_name if not version else f"{package_name}=={version}"
    try:
        if version:
            # 检查特定版本
            spec = importlib.util.find_spec(package_name)
            if spec is None:
                print(f"{package_name} 未安装，正在安装...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", package_with_version])
                return True
            else:
                # 检查版本
                pkg = importlib.import_module(package_name)
                if hasattr(pkg, "__version__") and pkg.__version__ != version:
                    print(f"{package_name} 版本不匹配 (当前: {pkg.__version__}, 需要: {version})，正在更新...")
                    subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", package_with_version])
                    return True
                print(f"{package_name} 已安装 (版本: {pkg.__version__ if hasattr(pkg, '__version__') else '未知'})")
                return False
        else:
            # 只检查是否安装，不检查版本
            spec = importlib.util.find_spec(package_name)
            if spec is None:
                print(f"{package_name} 未安装，正在安装...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])
                return True
            else:
                pkg = importlib.import_module(package_name)
                print(f"{package_name} 已安装 (版本: {pkg.__version__ if hasattr(pkg, '__version__') else '未知'})")
                return False
    except subprocess.CalledProcessError as e:
        print(f"安装 {package_name} 失败: {e}")
        return False
    except ImportError as e:
        print(f"导入 {package_name} 失败: {e}")
        return False

def install_all_dependencies():
    """安装所有依赖"""
    # 核心依赖
    core_packages = [
        ("fastapi", "0.100.0"),
        ("uvicorn", "0.22.0"),
        ("pydantic", "1.10.11"),
        ("python-multipart", "0.0.6"),
        ("sqlalchemy", "2.0.18"),
        ("alembic", "1.11.1"),
        ("aiosqlite", "0.19.0")
    ]
    
    # 安全依赖
    security_packages = [
        ("python-jose[cryptography]", "3.3.0"),
        ("passlib[bcrypt]", "1.7.4")
    ]
    
    # 缓存依赖
    cache_packages = [
        ("aioredis", "2.0.1"),
        ("redis", "4.5.5")
    ]
    
    # HTTP客户端依赖
    http_packages = [
        ("aiohttp", "3.8.5"),
        ("httpx", "0.24.1"),
        ("requests", "2.31.0"),
        ("websockets", "11.0.3")
    ]
    
    # 图像处理依赖
    image_packages = [
        ("pillow", "10.0.0"),
        ("opencv-python", "4.8.0.74"),
        ("numpy", "1.24.3")
    ]
    
    # 机器学习依赖
    ml_packages = [
        ("torch", "2.0.1"),
        ("torchvision", "0.15.2")
    ]
    
    # 其他工具依赖
    utils_packages = [
        ("python-dotenv", "1.0.0"),
        ("pandas", "2.0.3"),
        ("matplotlib", "3.7.2"),
        ("psutil", "5.9.5")
    ]
    
    # 测试依赖
    test_packages = [
        ("pytest", "7.4.0")
    ]
    
    # 合并所有依赖
    all_packages = []
    all_packages.extend(core_packages)
    all_packages.extend(security_packages)
    all_packages.extend(cache_packages)
    all_packages.extend(http_packages)
    all_packages.extend(image_packages)
    
    # 根据系统情况安装ML依赖
    is_windows = platform.system().lower() == "windows"
    is_arm = "arm" in platform.machine().lower()
    
    if not is_arm:
        # 非ARM架构可以直接安装PyTorch
        all_packages.extend(ml_packages)
    else:
        print("检测到ARM架构，请根据官方指南手动安装PyTorch: https://pytorch.org/get-started/locally/")
    
    all_packages.extend(utils_packages)
    all_packages.extend(test_packages)
    
    # 安装所有依赖
    total = len(all_packages)
    success = 0
    failed = 0
    
    print(f"开始安装 {total} 个依赖包...")
    
    for i, (package, version) in enumerate(all_packages):
        print(f"[{i+1}/{total}] 处理 {package} {version if version else ''}...")
        try:
            if check_and_install(package, version):
                success += 1
        except Exception as e:
            print(f"安装 {package} 时出错: {str(e)}")
            failed += 1
    
    print(f"依赖安装完成: {success} 成功, {failed} 失败, 共 {total} 个")

def create_env_file():
    """创建.env文件（如果不存在）"""
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    example_path = os.path.join(os.path.dirname(__file__), ".env.example")
    
    if os.path.exists(env_path):
        print(".env 文件已存在，跳过创建")
        return
    
    try:
        # 如果示例文件存在，拷贝示例文件
        if os.path.exists(example_path):
            with open(example_path, "r") as src, open(env_path, "w") as dst:
                dst.write(src.read())
            print("已从.env.example创建.env文件")
        else:
            # 否则创建基本的.env文件
            with open(env_path, "w") as f:
                f.write("""# AI监控管理系统环境配置
PROJECT_NAME="AI监控管理系统"
API_V1_STR="/api"
SECRET_KEY="supersecretkey-change-this-in-production"
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24小时
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000","http://localhost:8080"]
SQLALCHEMY_DATABASE_URI="sqlite:///./ai_monitor_system.db"
USE_REDIS=false
LOG_LEVEL="INFO"
""")
            print("已创建基本的.env文件")
    except Exception as e:
        print(f"创建.env文件失败: {str(e)}")

def create_directories():
    """创建必要的目录"""
    directories = [
        "uploads",
        "models",
        "faces",
        "warnings",
        "logs",
        "temp"
    ]
    
    for directory in directories:
        dir_path = os.path.join(os.path.dirname(__file__), directory)
        if not os.path.exists(dir_path):
            try:
                os.makedirs(dir_path)
                print(f"已创建目录: {directory}")
            except Exception as e:
                print(f"创建目录 {directory} 失败: {str(e)}")

def main():
    """主函数"""
    print("===== AI监控管理系统依赖安装 =====")
    print(f"Python版本: {platform.python_version()}")
    print(f"系统信息: {platform.system()} {platform.release()} ({platform.machine()})")
    print("===============================")
    
    # 更新pip
    print("正在更新pip...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
        print("pip 已更新")
    except Exception as e:
        print(f"更新pip失败: {str(e)}")
    
    # 安装依赖
    install_all_dependencies()
    
    # 创建必要的目录
    create_directories()
    
    # 创建.env文件
    create_env_file()
    
    print("===== 安装完成 =====")
    print("要启动应用，请执行: python main.py")
    print("=====================")

if __name__ == "__main__":
    main() 