CREATE TABLE faces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    person_name VARCHAR(100) NOT NULL,
    face_image VARCHAR(255) NOT NULL,
    features TEXT COMMENT '人脸特征向量，JSON格式',
    gender INT DEFAULT 1 COMMENT '1:男, 2:女',
    age INT,
    description TEXT,
    group_id INT COMMENT '分组ID',
    status INT DEFAULT 1 COMMENT '1:正常, 0:删除',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_person_name (person_name),
    INDEX idx_group_id (group_id),
    INDEX idx_status (status)
);