CREATE DATABASE IF NOT EXISTS xiaoyouyingyu DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE xiaoyouyingyu;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(50) UNIQUE NOT NULL COMMENT '账号',
  `password` VARCHAR(255) NOT NULL COMMENT '加密密码',
  `role` VARCHAR(10) DEFAULT 'USER' COMMENT '角色',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `topics` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL COMMENT '主题标题',
  `title_zh` VARCHAR(200) COMMENT '中文标题',
  `tags` VARCHAR(255) COMMENT '分类标签，逗号分隔',
  `event_date` DATE NOT NULL COMMENT '关联日期',
  `questions` JSON NOT NULL COMMENT '[{"en":"Q?","zh":"问题"}]',
  `creator_id` BIGINT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_event_date` (`event_date`),
  FULLTEXT INDEX `idx_search` (`title`, `title_zh`)_search` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default admin user (password: admin123)
INSERT IGNORE INTO `users` (`username`, `password`, `role`) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN');
