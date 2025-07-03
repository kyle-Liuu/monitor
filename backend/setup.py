from setuptools import setup, find_packages

setup(
    name="ai-monitor-system",
    version="0.1.0",
    description="AI监控管理系统后端",
    author="ArtDesign Team",
    packages=find_packages(),
    install_requires=[
        "fastapi==0.100.0",
        "uvicorn==0.22.0",
        "pydantic==1.10.11",
        "python-multipart==0.0.6",
        "sqlalchemy==2.0.18",
        "alembic==1.11.1",
        "aiosqlite==0.19.0",
        "python-jose[cryptography]==3.3.0",
        "passlib[bcrypt]==1.7.4",
        "aioredis==2.0.1",
        "redis==4.5.5",
        "aiohttp==3.8.5",
        "httpx==0.24.1",
        "requests==2.31.0",
        "python-dotenv==1.0.0",
        "websockets==11.0.3",
        "pillow==10.0.0",
        "opencv-python==4.8.0.74",
        "numpy==1.24.3",
        # "torch==2.0.1",
        # "torchvision==0.15.2",
        "pandas==2.0.3",
        "matplotlib==3.7.2",
        "psutil==5.9.5",  # 用于获取系统性能信息
        "pytest==7.4.0",  # 测试框架
    ],
    python_requires=">=3.8",
) 