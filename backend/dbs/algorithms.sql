CREATE TABLE algorithms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL COMMENT '算法类型：人脸识别、目标检测等',
    description TEXT,
    config TEXT COMMENT 'JSON格式的算法配置',
    model_path VARCHAR(255),
    status VARCHAR(20) DEFAULT 'enabled' COMMENT 'enabled:启用, disabled:禁用',
    accuracy FLOAT,
    performance_metrics TEXT COMMENT 'JSON格式的性能指标',
    created_by INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id),
    INDEX idx_name_version (name, version),
    INDEX idx_type (type),
    INDEX idx_status (status)
);