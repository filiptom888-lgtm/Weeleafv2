<?php

declare(strict_types=1);

function wl_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $defaults = [
        'db_host' => 'localhost',
        'db_name' => 'u769128625_weeleaf',
        'db_user' => 'u769128625_weeleaf_app',
        'db_pass' => '',
        'admin_password' => '1234',
        'install_key' => 'change-me-before-install',
        'cors_origin' => '*',
        'mail_from' => 'WeeLeaf <wl@weeleaf.com>',
        'mail_reply' => 'wl@weeleaf.com',
        'public_url' => 'https://weeleaf.com',
    ];

    // Survives Hostinger Git deploy (lives outside public_html)
    $domainRoot = dirname(__DIR__, 3);
    $candidates = [
        $domainRoot . '/api-config.local.php',
        __DIR__ . '/../config.local.php',
    ];
    foreach ($candidates as $local) {
        if (is_file($local)) {
            $config = array_merge($defaults, require $local);
            return $config;
        }
    }

    $config = $defaults;
    return $config;
}

function wl_pdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $cfg = wl_config();
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=utf8mb4',
        $cfg['db_host'],
        $cfg['db_name']
    );

    $pdo = new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    return $pdo;
}

function wl_json_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function wl_respond(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function wl_ok(array $data = [], int $status = 200): void
{
    wl_respond($status, ['ok' => true] + $data);
}

function wl_error(string $message, int $status = 400): void
{
    wl_respond($status, ['ok' => false, 'error' => $message]);
}

function wl_cors(): void
{
    $origin = wl_config()['cors_origin'] ?? '*';
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function wl_new_id(string $prefix): string
{
    return $prefix . '-' . bin2hex(random_bytes(8));
}

function wl_bearer_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $header, $m)) {
        return $m[1];
    }
    return null;
}

function wl_require_auth(bool $adminOnly = false): array
{
    $token = wl_bearer_token();
    if (!$token) {
        wl_error('Ikke logget ind.', 401);
    }

    $hash = hash('sha256', $token);
    wl_migrate_user_avatars();
    wl_migrate_conversations();
    wl_migrate_friendships();
    $stmt = wl_pdo()->prepare(
        'SELECT s.id AS session_id, s.expires_at, u.id, u.name, u.email, u.role, u.avatar_id, u.avatar_url, u.created_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = :hash
         LIMIT 1'
    );
    $stmt->execute(['hash' => $hash]);
    $row = $stmt->fetch();
    if (!$row) {
        wl_error('Ugyldig session.', 401);
    }
    if (strtotime($row['expires_at']) < time()) {
        wl_error('Session udløbet.', 401);
    }

    if ($adminOnly && $row['role'] !== 'admin') {
        wl_error('Kræver admin adgang.', 403);
    }

    return wl_user_payload($row) + ['sessionId' => $row['session_id']];
}

function wl_create_session(string $userId): array
{
    $token = bin2hex(random_bytes(32));
    $sessionId = wl_new_id('sess');
    $expires = gmdate('Y-m-d H:i:s', time() + 60 * 60 * 24 * 30);

    $stmt = wl_pdo()->prepare(
        'INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (:id, :user_id, :hash, :expires)'
    );
    $stmt->execute([
        'id' => $sessionId,
        'user_id' => $userId,
        'hash' => hash('sha256', $token),
        'expires' => $expires,
    ]);

    return ['token' => $token, 'expiresAt' => $expires];
}

function wl_migrate_user_avatars(): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    try {
        $cols = wl_pdo()->query("SHOW COLUMNS FROM users LIKE 'avatar_id'")->fetchAll();
        if (!$cols) {
            wl_pdo()->exec(
                "ALTER TABLE users ADD COLUMN avatar_id VARCHAR(16) NULL DEFAULT NULL AFTER role"
            );
        }
        $urlCol = wl_pdo()->query("SHOW COLUMNS FROM users LIKE 'avatar_url'")->fetchAll();
        if (!$urlCol) {
            wl_pdo()->exec(
                "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512) NULL DEFAULT NULL AFTER avatar_id"
            );
        }
    } catch (Throwable $e) {
        // Column may already exist on some hosts.
    }
}

function wl_valid_avatar_id(?string $avatarId): ?string
{
    if ($avatarId === null || $avatarId === '') {
        return null;
    }
    $id = (string) $avatarId;
    if (!in_array($id, ['1', '2', '3', '4', '5'], true)) {
        wl_error('avatarId skal være 1–5 eller null.');
    }
    return $id;
}

function wl_user_payload(array $row): array
{
    wl_migrate_user_avatars();
    $payload = [
        'id' => $row['id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'role' => $row['role'],
        'createdAt' => isset($row['created_at'])
            ? gmdate('c', strtotime($row['created_at']))
            : ($row['createdAt'] ?? gmdate('c')),
    ];
    if (array_key_exists('avatar_id', $row)) {
        $payload['avatarId'] = $row['avatar_id'] !== null && $row['avatar_id'] !== ''
            ? (string) $row['avatar_id']
            : null;
    } elseif (array_key_exists('avatarId', $row)) {
        $payload['avatarId'] = $row['avatarId'] ?: null;
    } else {
        $payload['avatarId'] = null;
    }
    if (array_key_exists('avatar_url', $row)) {
        $payload['avatarUrl'] = $row['avatar_url'] !== null && $row['avatar_url'] !== ''
            ? (string) $row['avatar_url']
            : null;
    } elseif (array_key_exists('avatarUrl', $row)) {
        $payload['avatarUrl'] = $row['avatarUrl'] ?: null;
    } else {
        $payload['avatarUrl'] = null;
    }
    return $payload;
}

function wl_get_config_key(string $key, $default = null)
{
    $stmt = wl_pdo()->prepare('SELECT config_json FROM site_config WHERE config_key = :key LIMIT 1');
    $stmt->execute(['key' => $key]);
    $row = $stmt->fetch();
    if (!$row) {
        return $default;
    }
    $decoded = json_decode($row['config_json'], true);
    return $decoded ?? $default;
}

function wl_set_config_key(string $key, $value): void
{
    $json = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $stmt = wl_pdo()->prepare(
        'INSERT INTO site_config (config_key, config_json) VALUES (:key, :json)
         ON DUPLICATE KEY UPDATE config_json = VALUES(config_json)'
    );
    $stmt->execute(['key' => $key, 'json' => $json]);
}

function wl_fetch_shop_categories(): array
{
    $pdo = wl_pdo();
    $cats = $pdo->query(
        'SELECT id, label, icon, color, sort_order FROM shop_categories ORDER BY sort_order ASC, label ASC'
    )->fetchAll();

    if (!$cats) {
        return [];
    }

    $prodStmt = $pdo->prepare(
        'SELECT id, category_id, name, description, price, image_url, link_url, sort_order
         FROM shop_products WHERE category_id = :cid ORDER BY sort_order ASC, name ASC'
    );

    $result = [];
    foreach ($cats as $cat) {
        $prodStmt->execute(['cid' => $cat['id']]);
        $products = [];
        foreach ($prodStmt->fetchAll() as $p) {
            $products[] = [
                'id' => $p['id'],
                'name' => $p['name'],
                'desc' => $p['description'] ?? '',
                'price' => $p['price'] ?? '',
                'imageUrl' => $p['image_url'] ?? '',
                'link' => $p['link_url'] ?? '',
            ];
        }
        $result[] = [
            'id' => $cat['id'],
            'label' => $cat['label'],
            'icon' => $cat['icon'],
            'color' => $cat['color'],
            'products' => $products,
        ];
    }

    return $result;
}

function wl_save_shop_categories(array $categories): void
{
    $pdo = wl_pdo();
    $pdo->beginTransaction();
    try {
        $pdo->exec('DELETE FROM shop_products');
        $pdo->exec('DELETE FROM shop_categories');

        $catStmt = $pdo->prepare(
            'INSERT INTO shop_categories (id, label, icon, color, sort_order) VALUES (:id, :label, :icon, :color, :sort)'
        );
        $prodStmt = $pdo->prepare(
            'INSERT INTO shop_products (id, category_id, name, description, price, image_url, link_url, sort_order)
             VALUES (:id, :category_id, :name, :description, :price, :image_url, :link_url, :sort)'
        );

        foreach ($categories as $i => $cat) {
            if (empty($cat['id'])) {
                continue;
            }
            $catStmt->execute([
                'id' => $cat['id'],
                'label' => $cat['label'] ?? '',
                'icon' => $cat['icon'] ?? '🛍️',
                'color' => $cat['color'] ?? '#60a5fa',
                'sort' => $i,
            ]);
            foreach ($cat['products'] ?? [] as $j => $product) {
                if (empty($product['id'])) {
                    continue;
                }
                $prodStmt->execute([
                    'id' => $product['id'],
                    'category_id' => $cat['id'],
                    'name' => $product['name'] ?? '',
                    'description' => $product['desc'] ?? '',
                    'price' => $product['price'] ?? '',
                    'image_url' => $product['imageUrl'] ?? '',
                    'link_url' => $product['link'] ?? '',
                    'sort' => $j,
                ]);
            }
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function wl_fetch_posts(): array
{
    wl_migrate_blog_post_images();

    wl_migrate_user_avatars();
    $rows = wl_pdo()->query(
        'SELECT p.id, p.author_id, p.author, p.title, p.body, p.image_url, p.tags, p.created_at,
                u.avatar_id AS author_avatar_id, u.avatar_url AS author_avatar_url
         FROM posts p
         LEFT JOIN users u ON u.id = p.author_id
         ORDER BY p.created_at DESC'
    )->fetchAll();

    $posts = [];
    foreach ($rows as $row) {
        $tags = $row['tags'] ? json_decode($row['tags'], true) : [];
        $avatarId = $row['author_avatar_id'] ?? null;
        $avatarUrl = $row['author_avatar_url'] ?? null;
        $posts[] = [
            'id' => $row['id'],
            'author' => $row['author'],
            'authorId' => $row['author_id'],
            'authorAvatarId' => $avatarId !== null && $avatarId !== '' ? (string) $avatarId : null,
            'authorAvatarUrl' => $avatarUrl !== null && $avatarUrl !== '' ? (string) $avatarUrl : null,
            'title' => $row['title'],
            'body' => $row['body'],
            'imageUrl' => $row['image_url'] ?? '',
            'tags' => is_array($tags) ? $tags : [],
            'date' => gmdate('c', strtotime($row['created_at'])),
        ];
    }
    return $posts;
}

function wl_fetch_submissions(?string $userId = null): array
{
    if ($userId) {
        $stmt = wl_pdo()->prepare('SELECT * FROM shop_submissions WHERE user_id = :uid ORDER BY submitted_at DESC');
        $stmt->execute(['uid' => $userId]);
        $rows = $stmt->fetchAll();
    } else {
        $rows = wl_pdo()->query('SELECT * FROM shop_submissions ORDER BY submitted_at DESC')->fetchAll();
    }

    $items = [];
    foreach ($rows as $row) {
        $items[] = [
            'id' => $row['id'],
            'status' => $row['status'],
            'submittedAt' => gmdate('c', strtotime($row['submitted_at'])),
            'reviewedAt' => $row['reviewed_at'] ? gmdate('c', strtotime($row['reviewed_at'])) : null,
            'userId' => $row['user_id'],
            'userName' => $row['user_name'],
            'userEmail' => $row['user_email'],
            'categoryId' => $row['category_id'],
            'categoryLabel' => $row['category_label'],
            'categoryIcon' => $row['category_icon'],
            'categoryColor' => $row['category_color'],
            'product' => [
                'id' => $row['product_id'] ?? ('p-' . $row['id']),
                'name' => $row['product_name'],
                'desc' => $row['product_desc'] ?? '',
                'price' => $row['product_price'] ?? '',
                'imageUrl' => $row['product_image'] ?? '',
                'link' => $row['product_link'] ?? '',
            ],
        ];
    }
    return $items;
}

function wl_public_user_payload(array $row): array
{
    $avatarId = $row['avatar_id'] ?? $row['avatarId'] ?? null;
    $avatarUrl = $row['avatar_url'] ?? $row['avatarUrl'] ?? null;
    return [
        'id' => $row['id'],
        'name' => $row['name'],
        'avatarId' => $avatarId !== null && $avatarId !== '' ? (string) $avatarId : null,
        'avatarUrl' => $avatarUrl !== null && $avatarUrl !== '' ? (string) $avatarUrl : null,
    ];
}

function wl_fetch_posts_for_author(string $userId): array
{
    $all = wl_fetch_posts();
    return array_values(array_filter($all, static fn ($p) => ($p['authorId'] ?? '') === $userId));
}

function wl_migrate_conversations(): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    try {
        $pdo = wl_pdo();
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS conversations (
              id         VARCHAR(64)  NOT NULL PRIMARY KEY,
              pair_key   VARCHAR(129) NOT NULL,
              created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              UNIQUE KEY uq_conversations_pair (pair_key),
              INDEX idx_conversations_updated (updated_at DESC)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS conversation_members (
              conversation_id VARCHAR(64) NOT NULL,
              user_id         VARCHAR(64) NOT NULL,
              last_read_at    DATETIME    NULL,
              PRIMARY KEY (conversation_id, user_id),
              INDEX idx_cm_user (user_id),
              CONSTRAINT fk_cm_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
              CONSTRAINT fk_cm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS messages (
              id              VARCHAR(64) NOT NULL PRIMARY KEY,
              conversation_id VARCHAR(64) NOT NULL,
              sender_id       VARCHAR(64) NOT NULL,
              body            TEXT        NOT NULL,
              created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
              read_at         DATETIME    NULL,
              INDEX idx_messages_conv (conversation_id, created_at),
              INDEX idx_messages_sender (sender_id, created_at),
              CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
              CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
    } catch (Throwable $e) {
        // Tables may already exist on some hosts.
    }
}

function wl_pair_key(string $a, string $b): string
{
    $ids = [$a, $b];
    sort($ids, SORT_STRING);
    return $ids[0] . '|' . $ids[1];
}

function wl_require_conversation_member(string $conversationId, string $userId): array
{
    wl_migrate_conversations();
    $stmt = wl_pdo()->prepare(
        'SELECT conversation_id, user_id, last_read_at
         FROM conversation_members
         WHERE conversation_id = :cid AND user_id = :uid
         LIMIT 1'
    );
    $stmt->execute(['cid' => $conversationId, 'uid' => $userId]);
    $row = $stmt->fetch();
    if (!$row) {
        wl_error('Samtale ikke fundet.', 404);
    }
    return $row;
}

function wl_message_payload(array $row): array
{
    return [
        'id' => $row['id'],
        'conversationId' => $row['conversation_id'],
        'senderId' => $row['sender_id'],
        'body' => $row['body'],
        'createdAt' => gmdate('c', strtotime($row['created_at'])),
        'readAt' => !empty($row['read_at']) ? gmdate('c', strtotime($row['read_at'])) : null,
    ];
}

function wl_conversation_payload(string $conversationId, string $viewerId): ?array
{
    wl_migrate_conversations();
    $pdo = wl_pdo();
    $conv = $pdo->prepare('SELECT id, created_at, updated_at FROM conversations WHERE id = :id LIMIT 1');
    $conv->execute(['id' => $conversationId]);
    $row = $conv->fetch();
    if (!$row) {
        return null;
    }

    $otherStmt = $pdo->prepare(
        'SELECT u.id, u.name, u.avatar_id, u.avatar_url
         FROM conversation_members cm
         JOIN users u ON u.id = cm.user_id
         WHERE cm.conversation_id = :cid AND cm.user_id <> :me
         LIMIT 1'
    );
    $otherStmt->execute(['cid' => $conversationId, 'me' => $viewerId]);
    $other = $otherStmt->fetch();

    $lastStmt = $pdo->prepare(
        'SELECT id, conversation_id, sender_id, body, created_at, read_at
         FROM messages WHERE conversation_id = :cid
         ORDER BY created_at DESC, id DESC LIMIT 1'
    );
    $lastStmt->execute(['cid' => $conversationId]);
    $last = $lastStmt->fetch();

    $unreadStmt = $pdo->prepare(
        'SELECT COUNT(*) FROM messages m
         JOIN conversation_members me
           ON me.conversation_id = m.conversation_id AND me.user_id = :me
         WHERE m.conversation_id = :cid
           AND m.sender_id <> :me
           AND (me.last_read_at IS NULL OR m.created_at > me.last_read_at)'
    );
    $unreadStmt->execute(['cid' => $conversationId, 'me' => $viewerId]);
    $unread = (int) $unreadStmt->fetchColumn();

    return [
        'id' => $row['id'],
        'createdAt' => gmdate('c', strtotime($row['created_at'])),
        'updatedAt' => gmdate('c', strtotime($row['updated_at'])),
        'otherUser' => $other ? wl_public_user_payload($other) : null,
        'lastMessage' => $last ? wl_message_payload($last) : null,
        'unreadCount' => $unread,
    ];
}

function wl_list_conversations(string $userId): array
{
    wl_migrate_conversations();
    $stmt = wl_pdo()->prepare(
        'SELECT c.id
         FROM conversations c
         JOIN conversation_members me ON me.conversation_id = c.id AND me.user_id = :me
         ORDER BY c.updated_at DESC'
    );
    $stmt->execute(['me' => $userId]);
    $items = [];
    foreach ($stmt->fetchAll() as $row) {
        $payload = wl_conversation_payload($row['id'], $userId);
        if ($payload) {
            $items[] = $payload;
        }
    }
    return $items;
}

function wl_find_or_create_conversation(string $me, string $otherId): array
{
    wl_migrate_conversations();
    if ($me === $otherId) {
        wl_error('Du kan ikke skrive til dig selv.');
    }
    $userStmt = wl_pdo()->prepare('SELECT id FROM users WHERE id = :id LIMIT 1');
    $userStmt->execute(['id' => $otherId]);
    if (!$userStmt->fetch()) {
        wl_error('Bruger ikke fundet.', 404);
    }

    $pair = wl_pair_key($me, $otherId);
    $found = wl_pdo()->prepare('SELECT id FROM conversations WHERE pair_key = :k LIMIT 1');
    $found->execute(['k' => $pair]);
    $row = $found->fetch();
    if ($row) {
        $payload = wl_conversation_payload($row['id'], $me);
        return $payload ?? ['id' => $row['id']];
    }

    $id = wl_new_id('conv');
    $pdo = wl_pdo();
    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            'INSERT INTO conversations (id, pair_key) VALUES (:id, :pair)'
        )->execute(['id' => $id, 'pair' => $pair]);
        $member = $pdo->prepare(
            'INSERT INTO conversation_members (conversation_id, user_id) VALUES (:cid, :uid)'
        );
        $member->execute(['cid' => $id, 'uid' => $me]);
        $member->execute(['cid' => $id, 'uid' => $otherId]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        $retry = wl_pdo()->prepare('SELECT id FROM conversations WHERE pair_key = :k LIMIT 1');
        $retry->execute(['k' => $pair]);
        $existing = $retry->fetch();
        if ($existing) {
            $payload = wl_conversation_payload($existing['id'], $me);
            return $payload ?? ['id' => $existing['id']];
        }
        throw $e;
    }

    return wl_conversation_payload($id, $me) ?? ['id' => $id];
}

function wl_rate_limit_messages(string $userId): void
{
    $stmt = wl_pdo()->prepare(
        'SELECT COUNT(*) FROM messages
         WHERE sender_id = :id AND created_at >= DATE_SUB(NOW(), INTERVAL 20 SECOND)'
    );
    $stmt->execute(['id' => $userId]);
    if ((int) $stmt->fetchColumn() >= 8) {
        wl_error('For mange beskeder. Vent et øjeblik.', 429);
    }
}

require_once __DIR__ . '/images.php';

function wl_full_config_payload(): array
{
    return [
        'coins' => wl_get_coins_for_api(),
        'stats' => wl_get_config_key('stats', []),
        'donationConfig' => wl_get_donation_for_api(),
        'github' => wl_get_config_key('github', ['token' => '', 'owner' => 'filiptom888-lgtm', 'repo' => 'Weeleafv2', 'branch' => 'main']),
        'shopCategories' => wl_fetch_shop_categories(),
        'blogPosts' => wl_fetch_posts(),
    ];
}

function wl_migrate_password_resets(): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    try {
        wl_pdo()->exec(
            "CREATE TABLE IF NOT EXISTS password_resets (
              id         VARCHAR(64)  NOT NULL PRIMARY KEY,
              user_id    VARCHAR(64)  NOT NULL,
              token_hash CHAR(64)     NOT NULL,
              expires_at DATETIME     NOT NULL,
              used_at    DATETIME     NULL,
              created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
              INDEX idx_pr_token (token_hash),
              INDEX idx_pr_user (user_id),
              CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
    } catch (Throwable $e) {
        // Table may already exist.
    }
}

function wl_public_origin(): string
{
    $cfg = wl_config();
    if (!empty($cfg['public_url'])) {
        return rtrim((string) $cfg['public_url'], '/');
    }
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (string) ($_SERVER['SERVER_PORT'] ?? '') === '443';
    $host = $_SERVER['HTTP_HOST'] ?? 'weeleaf.com';
    return ($https ? 'https://' : 'http://') . $host;
}

function wl_mail(string $to, string $subject, string $htmlBody): bool
{
    $cfg = wl_config();
    $from = (string) ($cfg['mail_from'] ?? 'WeeLeaf <wl@weeleaf.com>');
    $reply = (string) ($cfg['mail_reply'] ?? 'wl@weeleaf.com');
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . $from,
        'Reply-To: ' . $reply,
        'X-Mailer: WeeLeaf',
    ];
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    return @mail($to, $encodedSubject, $htmlBody, implode("\r\n", $headers));
}

function wl_email_wrap(string $title, string $intro, string $buttonLabel = '', string $buttonUrl = ''): string
{
    $btn = '';
    if ($buttonLabel !== '' && $buttonUrl !== '') {
        $safeUrl = htmlspecialchars($buttonUrl, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $safeLabel = htmlspecialchars($buttonLabel, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $btn = '<p style="margin:28px 0 8px"><a href="' . $safeUrl . '" style="display:inline-block;background:#2d6a42;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">' . $safeLabel . '</a></p>';
    }
    $safeTitle = htmlspecialchars($title, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $safeIntro = nl2br(htmlspecialchars($intro, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    return '<!DOCTYPE html><html><body style="margin:0;background:#f6e7d4;font-family:Segoe UI,Arial,sans-serif;color:#2a2218">'
        . '<div style="max-width:520px;margin:24px auto;background:#fffbf5;border:1px solid #e8c9a0;border-radius:20px;padding:32px">'
        . '<p style="letter-spacing:.22em;text-transform:uppercase;font-size:11px;color:#c8904a;margin:0 0 8px">WeeLeaf</p>'
        . '<h1 style="font-size:22px;margin:0 0 16px">' . $safeTitle . '</h1>'
        . '<p style="line-height:1.6;margin:0">' . $safeIntro . '</p>'
        . $btn
        . '<p style="margin:28px 0 0;font-size:12px;color:#9a8870">Hvis du ikke har bedt om denne mail, kan du bare ignorere den.</p>'
        . '</div></body></html>';
}

function wl_send_welcome_email(string $to, string $name): void
{
    $first = trim(explode(' ', $name)[0] ?? $name);
    wl_mail(
        $to,
        'Velkommen til WeeLeaf',
        wl_email_wrap(
            'Velkommen, ' . ($first !== '' ? $first : 'ven'),
            "Din WL-konto er oprettet.\n\nDu kan nu logge ind, skrive i fællesskabet og sende beskeder.",
            'Åbn WeeLeaf',
            wl_public_origin() . '/'
        )
    );
}

function wl_send_reset_email(string $to, string $token): void
{
    $url = wl_public_origin() . '/?wl_reset=' . rawurlencode($token);
    wl_mail(
        $to,
        'Nulstil din WL-adgangskode',
        wl_email_wrap(
            'Nulstil adgangskode',
            "Vi har modtaget en anmodning om at skifte din adgangskode. Linket virker i 2 timer.",
            'Vælg ny adgangskode',
            $url
        )
    );
}

function wl_send_password_changed_email(string $to): void
{
    wl_mail(
        $to,
        'Din WL-adgangskode er skiftet',
        wl_email_wrap(
            'Adgangskoden er skiftet',
            "Din WeeLeaf-adgangskode er blevet opdateret. Hvis det ikke var dig, så skriv til wl@weeleaf.com med det samme."
        )
    );
}

function wl_migrate_friendships(): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $done = true;
    $sql = "CREATE TABLE IF NOT EXISTS friendships (
              id           VARCHAR(64) NOT NULL PRIMARY KEY,
              pair_key     VARCHAR(129) NOT NULL,
              requester_id VARCHAR(64) NOT NULL,
              addressee_id VARCHAR(64) NOT NULL,
              status       ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
              created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              UNIQUE KEY uq_friendships_pair (pair_key),
              INDEX idx_friendships_requester (requester_id, status),
              INDEX idx_friendships_addressee (addressee_id, status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    try {
        wl_pdo()->exec(
            "CREATE TABLE IF NOT EXISTS friendships (
              id           VARCHAR(64) NOT NULL PRIMARY KEY,
              pair_key     VARCHAR(129) NOT NULL,
              requester_id VARCHAR(64) NOT NULL,
              addressee_id VARCHAR(64) NOT NULL,
              status       ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
              created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              UNIQUE KEY uq_friendships_pair (pair_key),
              INDEX idx_friendships_requester (requester_id, status),
              INDEX idx_friendships_addressee (addressee_id, status),
              CONSTRAINT fk_fr_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
              CONSTRAINT fk_fr_addressee FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
    } catch (Throwable $e) {
        try {
            wl_pdo()->exec($sql);
        } catch (Throwable $ignored) {
            // Table may already exist.
        }
    }
}

function wl_load_user_row(string $userId): ?array
{
    $stmt = wl_pdo()->prepare(
        'SELECT id, name, avatar_id, avatar_url FROM users WHERE id = :id LIMIT 1'
    );
    $stmt->execute(['id' => $userId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function wl_friendship_payload(array $row, string $viewerId): array
{
    $otherId = $row['requester_id'] === $viewerId ? $row['addressee_id'] : $row['requester_id'];
    $other = wl_load_user_row($otherId);
    return [
        'id' => $row['id'],
        'status' => $row['status'],
        'incoming' => $row['addressee_id'] === $viewerId && $row['status'] === 'pending',
        'outgoing' => $row['requester_id'] === $viewerId && $row['status'] === 'pending',
        'user' => $other ? wl_public_user_payload($other) : ['id' => $otherId, 'name' => 'Medlem'],
        'createdAt' => gmdate('c', strtotime((string) $row['created_at'])),
    ];
}

function wl_find_friendship(string $a, string $b): ?array
{
    wl_migrate_friendships();
    $stmt = wl_pdo()->prepare('SELECT * FROM friendships WHERE pair_key = :k LIMIT 1');
    $stmt->execute(['k' => wl_pair_key($a, $b)]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function wl_list_friends(string $userId): array
{
    wl_migrate_friendships();
    $stmt = wl_pdo()->prepare(
        'SELECT * FROM friendships
         WHERE requester_id = :me OR addressee_id = :me
         ORDER BY updated_at DESC'
    );
    $stmt->execute(['me' => $userId]);
    $friends = [];
    $incoming = [];
    $outgoing = [];
    foreach ($stmt->fetchAll() as $row) {
        $payload = wl_friendship_payload($row, $userId);
        if ($row['status'] === 'accepted') {
            $friends[] = $payload;
        } elseif ($row['status'] === 'pending' && $row['addressee_id'] === $userId) {
            $incoming[] = $payload;
        } elseif ($row['status'] === 'pending' && $row['requester_id'] === $userId) {
            $outgoing[] = $payload;
        }
    }
    return [
        'friends' => $friends,
        'incoming' => $incoming,
        'outgoing' => $outgoing,
    ];
}

function wl_send_friend_request(string $me, string $otherId): array
{
    wl_migrate_friendships();
    if ($me === $otherId) {
        wl_error('Du kan ikke sende en anmodning til dig selv.');
    }
    if (!wl_load_user_row($otherId)) {
        wl_error('Bruger ikke fundet.', 404);
    }
    $existing = wl_find_friendship($me, $otherId);
    if ($existing) {
        if ($existing['status'] === 'accepted') {
            wl_error('I er allerede venner.');
        }
        if ($existing['status'] === 'pending' && $existing['requester_id'] === $me) {
            wl_error('Anmodningen er allerede sendt.');
        }
        if ($existing['status'] === 'pending' && $existing['addressee_id'] === $me) {
            wl_pdo()->prepare(
                "UPDATE friendships SET status = 'accepted', updated_at = NOW() WHERE id = :id"
            )->execute(['id' => $existing['id']]);
            $fresh = wl_find_friendship($me, $otherId);
            return wl_friendship_payload($fresh, $me);
        }
        wl_pdo()->prepare(
            "UPDATE friendships SET requester_id = :req, addressee_id = :addr, status = 'pending', updated_at = NOW()
             WHERE id = :id"
        )->execute(['req' => $me, 'addr' => $otherId, 'id' => $existing['id']]);
        $fresh = wl_find_friendship($me, $otherId);
        return wl_friendship_payload($fresh, $me);
    }

    $id = wl_new_id('fr');
    wl_pdo()->prepare(
        'INSERT INTO friendships (id, pair_key, requester_id, addressee_id, status)
         VALUES (:id, :pair, :req, :addr, :status)'
    )->execute([
        'id' => $id,
        'pair' => wl_pair_key($me, $otherId),
        'req' => $me,
        'addr' => $otherId,
        'status' => 'pending',
    ]);
    $fresh = wl_find_friendship($me, $otherId);
    return wl_friendship_payload($fresh, $me);
}

function wl_require_friendship(string $id, string $userId): array
{
    wl_migrate_friendships();
    $stmt = wl_pdo()->prepare('SELECT * FROM friendships WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    if (!$row) {
        wl_error('Anmodning ikke fundet.', 404);
    }
    if ($row['requester_id'] !== $userId && $row['addressee_id'] !== $userId) {
        wl_error('Ikke tilladt.', 403);
    }
    return $row;
}

function wl_respond_friendship(string $id, string $userId, string $status): array
{
    $row = wl_require_friendship($id, $userId);
    if ($row['status'] !== 'pending') {
        wl_error('Anmodningen er allerede behandlet.');
    }
    if ($row['addressee_id'] !== $userId) {
        wl_error('Kun modtageren kan svare på anmodningen.', 403);
    }
    if ($status !== 'accepted' && $status !== 'declined') {
        wl_error('Ugyldigt svar.');
    }
    wl_pdo()->prepare(
        'UPDATE friendships SET status = :status, updated_at = NOW() WHERE id = :id'
    )->execute(['status' => $status, 'id' => $id]);
    $fresh = wl_find_friendship($row['requester_id'], $row['addressee_id']);
    return wl_friendship_payload($fresh, $userId);
}

function wl_remove_friendship(string $id, string $userId): void
{
    wl_require_friendship($id, $userId);
    wl_pdo()->prepare('DELETE FROM friendships WHERE id = :id')->execute(['id' => $id]);
}
