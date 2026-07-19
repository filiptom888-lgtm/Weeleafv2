<?php

declare(strict_types=1);

function wl_uploads_dir(string $subdir): string
{
    $safe = preg_replace('/[^a-z0-9_-]/i', '', $subdir);
    $dir = dirname(__DIR__, 2) . '/uploads/' . $safe;
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    return $dir;
}

function wl_uploads_coins_dir(): string
{
    return wl_uploads_dir('coins');
}

function wl_sanitize_asset_id(string $id): string
{
    $safe = preg_replace('/[^a-z0-9_-]/i', '', $id);
    return $safe !== '' ? $safe : 'asset';
}

function wl_media_public_path(string $subdir, string $id, string $ext): string
{
    return '/uploads/' . preg_replace('/[^a-z0-9_-]/i', '', $subdir) . '/' . wl_sanitize_asset_id($id) . '.' . $ext;
}

function wl_sanitize_coin_id(string $id): string
{
    return wl_sanitize_asset_id($id);
}

function wl_coin_image_public_path(string $coinId, string $ext): string
{
    return wl_media_public_path('coins', $coinId, $ext);
}

function wl_is_data_image_url(string $url): bool
{
    return str_starts_with($url, 'data:image/');
}

function wl_decode_data_url(string $dataUrl): ?array
{
    if (!preg_match('#^data:([^;]+);base64,(.+)$#s', $dataUrl, $m)) {
        return null;
    }
    $binary = base64_decode($m[2], true);
    if ($binary === false) {
        return null;
    }
    return ['mime' => $m[1], 'data' => $binary];
}

function wl_resize_image_binary(string $binary, int $maxSize = 256): array
{
    if (!function_exists('imagecreatefromstring')) {
        return ['binary' => $binary, 'mime' => 'image/png', 'ext' => 'png'];
    }

    $src = @imagecreatefromstring($binary);
    if ($src === false) {
        return ['binary' => $binary, 'mime' => 'image/png', 'ext' => 'png'];
    }

    $w = imagesx($src);
    $h = imagesy($src);
    $scale = min(1, $maxSize / max($w, $h, 1));
    $nw = max(1, (int) round($w * $scale));
    $nh = max(1, (int) round($h * $scale));

    $dst = imagecreatetruecolor($nw, $nh);
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
    imagefilledrectangle($dst, 0, 0, $nw, $nh, $transparent);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
    imagedestroy($src);

    ob_start();
    if (function_exists('imagewebp')) {
        imagewebp($dst, null, 82);
        $mime = 'image/webp';
        $ext = 'webp';
    } else {
        imagepng($dst, null, 8);
        $mime = 'image/png';
        $ext = 'png';
    }
    $out = ob_get_clean();
    imagedestroy($dst);

    return ['binary' => $out, 'mime' => $mime, 'ext' => $ext];
}

function wl_save_media_file(string $subdir, string $id, string $binary, int $maxSize = 256): string
{
    $resized = wl_resize_image_binary($binary, $maxSize);
    $ext = $resized['ext'] ?? 'webp';
    $safeId = wl_sanitize_asset_id($id);
    $path = wl_uploads_dir($subdir) . '/' . $safeId . '.' . $ext;
    file_put_contents($path, $resized['binary']);
    return wl_media_public_path($subdir, $id, $ext);
}

function wl_save_coin_image_file(string $coinId, string $binary, string $mime = 'image/webp'): string
{
    return wl_save_media_file('coins', $coinId, $binary, 256);
}

function wl_externalize_image_url(string $url, string $subdir, string $id, int $maxSize = 640): string
{
    if ($url === '' || !wl_is_data_image_url($url)) {
        return $url;
    }
    $decoded = wl_decode_data_url($url);
    if ($decoded === null) {
        return $url;
    }
    return wl_save_media_file($subdir, $id, $decoded['data'], $maxSize);
}

function wl_externalize_coin_images(array $coins): array
{
    $changed = false;
    foreach ($coins as &$coin) {
        $url = (string) ($coin['imageUrl'] ?? '');
        if ($url === '' || !wl_is_data_image_url($url)) {
            continue;
        }
        $coinId = (string) ($coin['id'] ?? ('coin-' . uniqid()));
        $coin['imageUrl'] = wl_externalize_image_url($url, 'coins', $coinId, 256);
        $changed = true;
    }
    unset($coin);

    return ['coins' => $coins, 'changed' => $changed];
}

function wl_get_coins_for_api(): array
{
    $coins = wl_get_config_key('coins', []);
    if (!is_array($coins)) {
        return [];
    }
    $result = wl_externalize_coin_images($coins);
    if ($result['changed']) {
        wl_set_config_key('coins', $result['coins']);
    }
    return $result['coins'];
}

function wl_persist_coins(array $coins): array
{
    $result = wl_externalize_coin_images($coins);
    wl_set_config_key('coins', $result['coins']);
    return $result['coins'];
}

function wl_migrate_blog_post_images(): int
{
    $pdo = wl_pdo();
    $rows = $pdo->query('SELECT id, image_url FROM posts')->fetchAll();
    $count = 0;
    foreach ($rows as $row) {
        $url = (string) ($row['image_url'] ?? '');
        if (!wl_is_data_image_url($url)) {
            continue;
        }
        $newUrl = wl_externalize_image_url($url, 'blog', (string) $row['id'], 720);
        if ($newUrl === $url) {
            continue;
        }
        $pdo->prepare('UPDATE posts SET image_url = :url WHERE id = :id')->execute([
            'url' => $newUrl,
            'id' => $row['id'],
        ]);
        $count++;
    }
    return $count;
}

function wl_get_donation_for_api(): array
{
    $donation = wl_get_config_key('donation', ['mobilepay' => '', 'link' => '', 'qrImageUrl' => '']);
    if (!is_array($donation)) {
        return ['mobilepay' => '', 'link' => '', 'qrImageUrl' => ''];
    }
    $qr = (string) ($donation['qrImageUrl'] ?? '');
    if (wl_is_data_image_url($qr)) {
        $donation['qrImageUrl'] = wl_externalize_image_url($qr, 'donation', 'qr', 512);
        wl_set_config_key('donation', $donation);
    }
    return $donation;
}
