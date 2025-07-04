CREATE TABLE monitor_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    stream_id INT,
    algorithm_id INT,
    config TEXT COMMENT 'JSON格式的任务配置参数',
    schedule VARCHAR(100) COMMENT '定时任务CRON表达式',
    status VARCHAR(20) DEFAULT 'active' COMMENT 'active:运行中, inactive:停止, error:错误',
    created_by INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stream_id) REFERENCES video_streams (id),
    FOREIGN KEY (algorithm_id) REFERENCES algorithms (id),
    FOREIGN KEY (created_by) REFERENCES users (id),
    INDEX idx_name (name),
    INDEX idx_stream_id (stream_id),
    INDEX idx_algorithm_id (algorithm_id),
    INDEX idx_status (status)
);