-- =============================================================================
-- WeeLeaf — MySQL schema (Hostinger)
-- Database: u769128625_weeleaf
--
-- Import: phpMyAdmin → select database → Import → this file → Go
--
-- site_config keys (JSON):
--   coins     → orbit nodes (array)
--   stats     → HUD counters (array)
--   donation  → { mobilepay, link, qrImageUrl }
--   github    → { token, owner, repo, branch }  (admin publish tab)
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- Users (members + admins)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(64)   NOT NULL PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(190)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('member','admin') NOT NULL DEFAULT 'member',
  avatar_id     VARCHAR(16)   NULL DEFAULT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Login sessions (replaces browser sessionStorage)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id          VARCHAR(64)   NOT NULL PRIMARY KEY,
  user_id     VARCHAR(64)   NOT NULL,
  token_hash  CHAR(64)      NOT NULL,
  expires_at  DATETIME      NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_token (token_hash),
  INDEX idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Community blog posts (Community feed + Member + Admin blog tab)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id         VARCHAR(64)   NOT NULL PRIMARY KEY,
  author_id  VARCHAR(64)   NULL,
  author     VARCHAR(120)  NOT NULL DEFAULT '',
  title      VARCHAR(255)  NOT NULL,
  body       MEDIUMTEXT    NOT NULL,
  image_url  MEDIUMTEXT    NULL,
  tags       JSON          NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_posts_created (created_at DESC),
  INDEX idx_posts_author (author_id),
  CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Shop (Shop modal + Admin shop tab)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shop_categories (
  id         VARCHAR(64)  NOT NULL PRIMARY KEY,
  label      VARCHAR(120) NOT NULL,
  icon       VARCHAR(16)  NOT NULL DEFAULT '🛍️',
  color      VARCHAR(16)  NOT NULL DEFAULT '#60a5fa',
  sort_order INT          NOT NULL DEFAULT 0,
  INDEX idx_shop_cat_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shop_products (
  id          VARCHAR(64)  NOT NULL PRIMARY KEY,
  category_id VARCHAR(64)  NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description MEDIUMTEXT   NULL,
  price       VARCHAR(64)  NULL,
  image_url   MEDIUMTEXT   NULL,
  link_url    VARCHAR(500) NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category_id),
  INDEX idx_products_sort (category_id, sort_order),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES shop_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Member shop submissions (Member shop tab + Admin approvals tab)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shop_submissions (
  id              VARCHAR(64)  NOT NULL PRIMARY KEY,
  user_id         VARCHAR(64)  NOT NULL,
  user_name       VARCHAR(120) NOT NULL,
  user_email      VARCHAR(190) NOT NULL,
  category_id     VARCHAR(64)  NOT NULL,
  category_label  VARCHAR(120) NOT NULL,
  category_icon   VARCHAR(16)  NULL,
  category_color  VARCHAR(16)  NULL,
  product_id      VARCHAR(64)  NULL,
  product_name    VARCHAR(255) NOT NULL,
  product_desc    MEDIUMTEXT   NULL,
  product_price   VARCHAR(64)  NULL,
  product_image   MEDIUMTEXT   NULL,
  product_link    VARCHAR(500) NULL,
  status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  submitted_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at     DATETIME     NULL,
  reviewed_by     VARCHAR(64)  NULL,
  INDEX idx_submissions_status (status),
  INDEX idx_submissions_user (user_id),
  INDEX idx_submissions_submitted (submitted_at DESC),
  CONSTRAINT fk_submissions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_submissions_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Site-wide JSON config (orbit coins, stats, donation, github publish)
-- Replaces localStorage + public/wl-config.json
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_config (
  config_key  VARCHAR(64)  NOT NULL PRIMARY KEY,
  config_json LONGTEXT     NOT NULL,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
