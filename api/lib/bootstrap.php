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
