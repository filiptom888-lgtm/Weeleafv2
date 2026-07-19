<?php

declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';

wl_cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$uri = preg_replace('#^/api#', '', $uri);
$uri = rtrim($uri, '/') ?: '/';

try {
    match (true) {
        $uri === '/health' && $method === 'GET' => wl_ok(['status' => 'ok']),

        $uri === '/config' && $method === 'GET' => wl_ok(['data' => wl_full_config_payload()]),

        $uri === '/config/coins' && $method === 'PUT' => (function () {
            wl_require_auth(true);
            $body = wl_json_input();
            if (!isset($body['coins']) || !is_array($body['coins'])) {
                wl_error('coins array påkrævet.');
            }
            wl_set_config_key('coins', $body['coins']);
            wl_ok(['coins' => $body['coins']]);
        })(),

        $uri === '/config/stats' && $method === 'PUT' => (function () {
            wl_require_auth(true);
            $body = wl_json_input();
            if (!isset($body['stats']) || !is_array($body['stats'])) {
                wl_error('stats array påkrævet.');
            }
            wl_set_config_key('stats', $body['stats']);
            wl_ok(['stats' => $body['stats']]);
        })(),

        $uri === '/config/donation' && $method === 'PUT' => (function () {
            wl_require_auth(true);
            $body = wl_json_input();
            if (!isset($body['donationConfig']) || !is_array($body['donationConfig'])) {
                wl_error('donationConfig påkrævet.');
            }
            wl_set_config_key('donation', $body['donationConfig']);
            wl_ok(['donationConfig' => $body['donationConfig']]);
        })(),

        $uri === '/config/github' && $method === 'PUT' => (function () {
            wl_require_auth(true);
            $body = wl_json_input();
            if (!isset($body['github']) || !is_array($body['github'])) {
                wl_error('github settings påkrævet.');
            }
            wl_set_config_key('github', $body['github']);
            wl_ok(['github' => $body['github']]);
        })(),

        $uri === '/shop' && $method === 'PUT' => (function () {
            wl_require_auth(true);
            $body = wl_json_input();
            if (!isset($body['shopCategories']) || !is_array($body['shopCategories'])) {
                wl_error('shopCategories påkrævet.');
            }
            wl_save_shop_categories($body['shopCategories']);
            wl_ok(['shopCategories' => wl_fetch_shop_categories()]);
        })(),

        $uri === '/posts' && $method === 'GET' => wl_ok(['blogPosts' => wl_fetch_posts()]),

        $uri === '/posts' && $method === 'POST' => (function () {
            $user = wl_require_auth();
            $body = wl_json_input();
            $title = trim($body['title'] ?? '');
            $text = trim($body['body'] ?? '');
            if ($title === '' || $text === '') {
                wl_error('Titel og indhold er påkrævet.');
            }
            $id = $body['id'] ?? wl_new_id('post');
            $tags = isset($body['tags']) && is_array($body['tags']) ? $body['tags'] : [];
            $stmt = wl_pdo()->prepare(
                'INSERT INTO posts (id, author_id, author, title, body, image_url, tags)
                 VALUES (:id, :author_id, :author, :title, :body, :image_url, :tags)'
            );
            $stmt->execute([
                'id' => $id,
                'author_id' => $user['id'],
                'author' => $body['author'] ?? $user['name'],
                'title' => $title,
                'body' => $text,
                'image_url' => $body['imageUrl'] ?? '',
                'tags' => json_encode($tags, JSON_UNESCAPED_UNICODE),
            ]);
            wl_ok(['post' => wl_fetch_posts()[0] ?? null], 201);
        })(),

        preg_match('#^/posts/([^/]+)$#', $uri, $m) && $method === 'PUT' => (function () use ($m) {
            $user = wl_require_auth();
            $id = $m[1];
            $body = wl_json_input();
            $stmt = wl_pdo()->prepare('SELECT author_id FROM posts WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $post = $stmt->fetch();
            if (!$post) {
                wl_error('Indlæg ikke fundet.', 404);
            }
            if ($user['role'] !== 'admin' && $post['author_id'] !== $user['id']) {
                wl_error('Du kan kun redigere dine egne indlæg.', 403);
            }
            $fields = [];
            $params = ['id' => $id];
            foreach (['title' => 'title', 'body' => 'body', 'imageUrl' => 'image_url', 'author' => 'author'] as $in => $col) {
                if (array_key_exists($in, $body)) {
                    $fields[] = "$col = :$col";
                    $params[$col] = $body[$in];
                }
            }
            if (isset($body['tags']) && is_array($body['tags'])) {
                $fields[] = 'tags = :tags';
                $params['tags'] = json_encode($body['tags'], JSON_UNESCAPED_UNICODE);
            }
            if (!$fields) {
                wl_error('Intet at opdatere.');
            }
            $sql = 'UPDATE posts SET ' . implode(', ', $fields) . ' WHERE id = :id';
            wl_pdo()->prepare($sql)->execute($params);
            wl_ok();
        })(),

        preg_match('#^/posts/([^/]+)$#', $uri, $m) && $method === 'DELETE' => (function () use ($m) {
            $user = wl_require_auth();
            $id = $m[1];
            $stmt = wl_pdo()->prepare('SELECT author_id FROM posts WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $post = $stmt->fetch();
            if (!$post) {
                wl_error('Indlæg ikke fundet.', 404);
            }
            if ($user['role'] !== 'admin' && $post['author_id'] !== $user['id']) {
                wl_error('Du kan kun slette dine egne indlæg.', 403);
            }
            wl_pdo()->prepare('DELETE FROM posts WHERE id = :id')->execute(['id' => $id]);
            wl_ok();
        })(),

        $uri === '/submissions' && $method === 'GET' => (function () {
            $user = wl_require_auth();
            $items = $user['role'] === 'admin'
                ? wl_fetch_submissions()
                : wl_fetch_submissions($user['id']);
            wl_ok(['pendingShopSubmissions' => $items]);
        })(),

        $uri === '/submissions' && $method === 'POST' => (function () {
            $user = wl_require_auth();
            $body = wl_json_input();
            $categoryId = $body['categoryId'] ?? '';
            $product = $body['product'] ?? [];
            $name = trim($product['name'] ?? '');
            if ($categoryId === '' || $name === '') {
                wl_error('Kategori og produktnavn er påkrævet.');
            }
            $id = wl_new_id('sub');
            $productId = $product['id'] ?? wl_new_id('p');
            $stmt = wl_pdo()->prepare(
                'INSERT INTO shop_submissions (
                    id, user_id, user_name, user_email, category_id, category_label,
                    category_icon, category_color, product_id, product_name, product_desc,
                    product_price, product_image, product_link, status
                ) VALUES (
                    :id, :user_id, :user_name, :user_email, :category_id, :category_label,
                    :category_icon, :category_color, :product_id, :product_name, :product_desc,
                    :product_price, :product_image, :product_link, :status
                )'
            );
            $stmt->execute([
                'id' => $id,
                'user_id' => $user['id'],
                'user_name' => $body['userName'] ?? $user['name'],
                'user_email' => $body['userEmail'] ?? $user['email'],
                'category_id' => $categoryId,
                'category_label' => $body['categoryLabel'] ?? '',
                'category_icon' => $body['categoryIcon'] ?? null,
                'category_color' => $body['categoryColor'] ?? null,
                'product_id' => $productId,
                'product_name' => $name,
                'product_desc' => $product['desc'] ?? '',
                'product_price' => $product['price'] ?? '',
                'product_image' => $product['imageUrl'] ?? '',
                'product_link' => $product['link'] ?? '',
                'status' => 'pending',
            ]);
            wl_ok(['submission' => wl_fetch_submissions()[0] ?? null], 201);
        })(),

        preg_match('#^/submissions/([^/]+)/approve$#', $uri, $m) && $method === 'POST' => (function () use ($m) {
            $admin = wl_require_auth(true);
            $id = $m[1];
            $pdo = wl_pdo();
            $stmt = $pdo->prepare('SELECT * FROM shop_submissions WHERE id = :id LIMIT 1');
            $stmt->execute(['id' => $id]);
            $sub = $stmt->fetch();
            if (!$sub || $sub['status'] !== 'pending') {
                wl_error('Indsendelse ikke fundet eller allerede behandlet.', 404);
            }

            $shop = wl_fetch_shop_categories();
            $found = false;
            foreach ($shop as $i => $cat) {
                if ($cat['id'] !== $sub['category_id']) {
                    continue;
                }
                $shop[$i]['products'][] = [
                    'id' => $sub['product_id'] ?: wl_new_id('p'),
                    'name' => $sub['product_name'],
                    'desc' => $sub['product_desc'] ?? '',
                    'price' => $sub['product_price'] ?? '',
                    'imageUrl' => $sub['product_image'] ?? '',
                    'link' => $sub['product_link'] ?? '',
                ];
                $found = true;
                break;
            }
            if (!$found) {
                wl_error('Kategori findes ikke længere.');
            }
            wl_save_shop_categories($shop);

            $pdo->prepare(
                'UPDATE shop_submissions SET status = :status, reviewed_at = NOW(), reviewed_by = :reviewer WHERE id = :id'
            )->execute(['status' => 'approved', 'reviewer' => $admin['id'], 'id' => $id]);

            wl_ok(['shopCategories' => wl_fetch_shop_categories(), 'pendingShopSubmissions' => wl_fetch_submissions()]);
        })(),

        preg_match('#^/submissions/([^/]+)/reject$#', $uri, $m) && $method === 'POST' => (function () use ($m) {
            $admin = wl_require_auth(true);
            $id = $m[1];
            wl_pdo()->prepare(
                'UPDATE shop_submissions SET status = :status, reviewed_at = NOW(), reviewed_by = :reviewer WHERE id = :id AND status = :pending'
            )->execute(['status' => 'rejected', 'reviewer' => $admin['id'], 'id' => $id, 'pending' => 'pending']);
            wl_ok(['pendingShopSubmissions' => wl_fetch_submissions()]);
        })(),

        preg_match('#^/submissions/([^/]+)$#', $uri, $m) && $method === 'DELETE' => (function () use ($m) {
            wl_require_auth(true);
            wl_pdo()->prepare('DELETE FROM shop_submissions WHERE id = :id')->execute(['id' => $m[1]]);
            wl_ok(['pendingShopSubmissions' => wl_fetch_submissions()]);
        })(),

        $uri === '/auth/register' && $method === 'POST' => (function () {
            $body = wl_json_input();
            $name = trim($body['name'] ?? '');
            $email = strtolower(trim($body['email'] ?? ''));
            $password = trim($body['password'] ?? '');
            if ($name === '' || $email === '' || $password === '') {
                wl_error('Udfyld alle felter.');
            }
            if (strlen($password) < 4) {
                wl_error('Adgangskode skal være mindst 4 tegn.');
            }
            $check = wl_pdo()->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
            $check->execute(['email' => $email]);
            if ($check->fetch()) {
                wl_error('Den e-mail er allerede registreret.');
            }
            $id = wl_new_id('user');
            wl_pdo()->prepare(
                'INSERT INTO users (id, name, email, password_hash, role) VALUES (:id, :name, :email, :hash, :role)'
            )->execute([
                'id' => $id,
                'name' => $name,
                'email' => $email,
                'hash' => password_hash($password, PASSWORD_DEFAULT),
                'role' => 'member',
            ]);
            $session = wl_create_session($id);
            $user = wl_user_payload(['id' => $id, 'name' => $name, 'email' => $email, 'role' => 'member', 'created_at' => gmdate('Y-m-d H:i:s')]);
            wl_ok(['user' => $user, 'token' => $session['token']], 201);
        })(),

        $uri === '/auth/login' && $method === 'POST' => (function () {
            $body = wl_json_input();
            $email = strtolower(trim($body['email'] ?? ''));
            $password = trim($body['password'] ?? '');
            if ($email === '' || $password === '') {
                wl_error('Udfyld e-mail og adgangskode.');
            }
            $stmt = wl_pdo()->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
            $stmt->execute(['email' => $email]);
            $row = $stmt->fetch();
            if (!$row || !password_verify($password, $row['password_hash'])) {
                wl_error('Forkert e-mail eller adgangskode.', 401);
            }
            $session = wl_create_session($row['id']);
            wl_ok(['user' => wl_user_payload($row), 'token' => $session['token']]);
        })(),

        $uri === '/auth/admin' && $method === 'POST' => (function () {
            $body = wl_json_input();
            $password = trim($body['password'] ?? '');
            if ($password === '' || !hash_equals((string) wl_config()['admin_password'], $password)) {
                wl_error('Forkert adgangskode.', 401);
            }
            $stmt = wl_pdo()->prepare('SELECT * FROM users WHERE role = :role LIMIT 1');
            $stmt->execute(['role' => 'admin']);
            $admin = $stmt->fetch();
            if (!$admin) {
                wl_error('Admin bruger mangler — kør install.php først.', 500);
            }
            $session = wl_create_session($admin['id']);
            wl_ok(['user' => wl_user_payload($admin), 'token' => $session['token']]);
        })(),

        $uri === '/auth/me' && $method === 'GET' => (function () {
            $user = wl_require_auth();
            wl_ok(['user' => $user]);
        })(),

        $uri === '/auth/logout' && $method === 'POST' => (function () {
            $token = wl_bearer_token();
            if ($token) {
                wl_pdo()->prepare('DELETE FROM sessions WHERE token_hash = :hash')->execute([
                    'hash' => hash('sha256', $token),
                ]);
            }
            wl_ok();
        })(),

        default => wl_error('Ikke fundet: ' . $uri, 404),
    };
} catch (Throwable $e) {
    wl_error('Serverfejl: ' . $e->getMessage(), 500);
}
