import threading
import queue
import logging
import concurrent.futures
import time
from typing import Dict, Any, List, Callable, Optional
from functools import wraps

logger = logging.getLogger(__name__)

class ThreadPoolManager:
    """线程池管理器，支持视频流和算法处理的多线程执行"""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ThreadPoolManager, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance
    
    def __init__(self, max_workers: int = None):
        """
        初始化线程池管理器
        
        Args:
            max_workers: 最大工作线程数，默认为CPU核心数 * 5
        """
        if self._initialized:
            return
            
        if max_workers is None:
            import multiprocessing
            max_workers = multiprocessing.cpu_count() * 5
            
        self.max_workers = max_workers
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=max_workers)
        self.tasks = {}  # 保存任务信息
        self.task_results = {}  # 保存任务结果
        self.task_lock = threading.Lock()
        self._initialized = True
        
        logger.info(f"线程池初始化完成，最大工作线程数: {max_workers}")
    
    def submit_task(self, task_id: str, func: Callable, *args, **kwargs) -> concurrent.futures.Future:
        """
        提交任务到线程池
        
        Args:
            task_id: 任务ID
            func: 要执行的函数
            args: 函数参数
            kwargs: 函数关键字参数
            
        Returns:
            Future对象
        """
        future = self.executor.submit(func, *args, **kwargs)
        
        with self.task_lock:
            self.tasks[task_id] = {
                "future": future,
                "start_time": time.time(),
                "status": "running",
                "func_name": func.__name__
            }
            
        # 添加回调，当任务完成时更新状态
        future.add_done_callback(lambda f: self._task_done_callback(task_id, f))
        
        logger.info(f"任务 {task_id} ({func.__name__}) 已提交到线程池")
        return future
    
    def _task_done_callback(self, task_id: str, future: concurrent.futures.Future):
        """
        任务完成回调
        
        Args:
            task_id: 任务ID
            future: Future对象
        """
        with self.task_lock:
            if task_id in self.tasks:
                if future.cancelled():
                    self.tasks[task_id]["status"] = "cancelled"
                    logger.info(f"任务 {task_id} 已取消")
                elif future.exception() is not None:
                    self.tasks[task_id]["status"] = "error"
                    self.tasks[task_id]["error"] = str(future.exception())
                    logger.error(f"任务 {task_id} 出错: {str(future.exception())}")
                else:
                    self.tasks[task_id]["status"] = "completed"
                    self.tasks[task_id]["end_time"] = time.time()
                    self.tasks[task_id]["duration"] = self.tasks[task_id]["end_time"] - self.tasks[task_id]["start_time"]
                    self.task_results[task_id] = future.result()
                    logger.info(f"任务 {task_id} 已完成，耗时: {self.tasks[task_id]['duration']:.2f}秒")
    
    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        获取任务状态
        
        Args:
            task_id: 任务ID
            
        Returns:
            任务状态信息
        """
        with self.task_lock:
            if task_id in self.tasks:
                result = self.tasks[task_id].copy()
                # 移除future对象，它不可序列化
                if "future" in result:
                    del result["future"]
                return result
            return None
    
    def get_task_result(self, task_id: str) -> Optional[Any]:
        """
        获取任务结果
        
        Args:
            task_id: 任务ID
            
        Returns:
            任务结果
        """
        with self.task_lock:
            return self.task_results.get(task_id)
    
    def cancel_task(self, task_id: str) -> bool:
        """
        取消任务
        
        Args:
            task_id: 任务ID
            
        Returns:
            是否成功取消
        """
        with self.task_lock:
            if task_id in self.tasks and self.tasks[task_id]["status"] == "running":
                future = self.tasks[task_id]["future"]
                cancel_result = future.cancel()
                if cancel_result:
                    self.tasks[task_id]["status"] = "cancelled"
                    logger.info(f"任务 {task_id} 已取消")
                return cancel_result
            return False
    
    def get_all_tasks(self) -> List[Dict[str, Any]]:
        """
        获取所有任务状态
        
        Returns:
            所有任务状态列表
        """
        with self.task_lock:
            result = []
            for task_id, task_info in self.tasks.items():
                # 创建任务信息的副本，移除future对象
                task_copy = task_info.copy()
                if "future" in task_copy:
                    del task_copy["future"]
                task_copy["task_id"] = task_id
                result.append(task_copy)
            return result
    
    def clean_completed_tasks(self, max_age: int = 3600) -> int:
        """
        清理已完成的任务
        
        Args:
            max_age: 最大保留时间(秒)
            
        Returns:
            清理的任务数量
        """
        current_time = time.time()
        cleaned_count = 0
        
        with self.task_lock:
            tasks_to_remove = []
            for task_id, task_info in self.tasks.items():
                if task_info["status"] in ["completed", "cancelled", "error"]:
                    if "end_time" in task_info and current_time - task_info["end_time"] > max_age:
                        tasks_to_remove.append(task_id)
            
            for task_id in tasks_to_remove:
                del self.tasks[task_id]
                if task_id in self.task_results:
                    del self.task_results[task_id]
                cleaned_count += 1
                
        logger.info(f"已清理 {cleaned_count} 个已完成任务")
        return cleaned_count
    
    def shutdown(self, wait: bool = True):
        """
        关闭线程池
        
        Args:
            wait: 是否等待所有任务完成
        """
        self.executor.shutdown(wait=wait)
        logger.info("线程池已关闭")


# 单例实例
thread_pool = ThreadPoolManager()


def async_task(func):
    """
    异步任务装饰器，将函数放入线程池执行
    
    使用示例:
    
    @async_task
    def process_video(video_path):
        # 处理视频
        return result
    
    task_id = process_video("video.mp4")
    # 稍后检查结果
    result = thread_pool.get_task_result(task_id)
    """
    task_counter = 0
    task_counter_lock = threading.Lock()
    
    @wraps(func)
    def wrapper(*args, **kwargs):
        nonlocal task_counter
        with task_counter_lock:
            task_counter += 1
            task_id = f"{func.__name__}_{task_counter}_{int(time.time())}"
        
        return thread_pool.submit_task(task_id, func, *args, **kwargs)
    
    return wrapper 