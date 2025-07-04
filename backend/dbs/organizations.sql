CREATE TABLE organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE,
    parent_id INT,
    level INT DEFAULT 1,
    sort_order INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' COMMENT 'active:启用, inactive:禁用',
    description TEXT,
    address TEXT,
    contact_person VARCHAR(50),
    contact_phone VARCHAR(20),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES organizations (id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_code (code),
    INDEX idx_status (status)
);