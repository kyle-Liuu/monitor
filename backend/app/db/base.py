# 从 session.py 导入 Base
from app.db.session import Base

# 导入所有模型，确保Alembic可以发现它们
from app.models.user import User, Role, UserRole
# 以下是其他模型的导入，取决于你的模型实现
# from app.models.algorithm import Algorithm
# from app.models.videostream import VideoStream
# from app.models.warning import Warning
# from app.models.face import FaceRepository
# 以后可以添加更多模型导入 