-- 检查users表是否存在user_id字段
PRAGMA table_info (users);

-- 添加user_id字段（如果不存在）
ALTER TABLE users ADD COLUMN user_id VARCHAR(11) NULL;

-- 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_id ON users (user_id);

-- 添加非空约束
-- 注意：SQLite不支持直接通过ALTER TABLE添加非空约束
-- 需要通过迁移脚本add_user_id.py为现有记录生成user_id值
-- 然后执行以下SQL语句来重建表结构

-- BEGIN TRANSACTION;
--
-- -- 创建临时表
-- CREATE TABLE users_new (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     user_id VARCHAR(11) NOT NULL,
--     username VARCHAR(50) NOT NULL,
--     email VARCHAR(100) NOT NULL,
--     hashed_password VARCHAR(100) NOT NULL,
--     full_name VARCHAR(100),
--     phone VARCHAR(20),
--     gender INTEGER DEFAULT 1,
--     avatar VARCHAR(255),
--     status INTEGER DEFAULT 1,
--     last_login TIMESTAMP,
--     is_active BOOLEAN DEFAULT TRUE,
--     is_superuser BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     UNIQUE(user_id),
--     UNIQUE(username),
--     UNIQUE(email)
-- );
--
-- -- 复制数据
-- INSERT INTO users_new
-- SELECT id, user_id, username, email, hashed_password, full_name, phone, gender,
--        avatar, status, last_login, is_active, is_superuser, created_at, updated_at
-- FROM users;
--
-- -- 删除旧表
-- DROP TABLE users;
--
-- -- 重命名新表
-- ALTER TABLE users_new RENAME TO users;
--
-- -- 创建索引
-- CREATE INDEX idx_users_username ON users(username);
-- CREATE INDEX idx_users_email ON users(email);
-- CREATE INDEX idx_users_user_id ON users(user_id);
--
-- COMMIT;

-- 注意：上述重建表结构的SQL需谨慎使用，建议先备份数据库