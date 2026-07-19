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

function wl_uploads_avatars_dir(): string
{
    return wl_uploads_dir('avatars');
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

function wl_validate_image_upload(array $file, int $maxBytes = 5242880): string
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        wl_error('Upload fejlede — prøv igen.');
    }
    if (($file['size'] ?? 0) > $maxBytes) {
        wl_error('Billedet er for stort (max 5 MB).');
    }
    $binary = file_get_contents((string) ($file['tmp_name'] ?? ''));
    if ($binary === false || $binary === '') {
        wl_error('Kunne ikke læse uploadet billede.');
    }
    $info = @getimagesizefromstring($binary);
    if ($info === false) {
        wl_error('Filen er ikke et gyldigt billede.');
    }
    $allowed = [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP, IMAGETYPE_GIF];
    if (!in_array($info[2], $allowed, true)) {
        wl_error('Kun JPG, PNG, WebP og GIF er tilladt.');
    }
    return $binary;
}

/** Center-crop to square, then resize + compress for avatars */
function wl_crop_square_avatar_binary(string $binary, int $size = 256): array
{
    if (!function_exists('imagecreatefromstring')) {
        wl_error('Billedebehandling er ikke tilgængelig på serveren.');
    }

    $src = @imagecreatefromstring($binary);
    if ($src === false) {
        wl_error('Kunne ikke behandle billedet.');
    }

    $w = imagesx($src);
    $h = imagesy($src);
    $side = min($w, $h);
    $sx = (int) floor(($w - $side) / 2);
    $sy = (int) floor(($h - $side) / 2);

    $dst = imagecreatetruecolor($size, $size);
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
    imagefilledrectangle($dst, 0, 0, $size, $size, $transparent);
    imagecopyresampled($dst, $src, 0, 0, $sx, $sy, $size, $size, $side, $side);
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

function wl_save_user_avatar_file(string $userId, string $binary): string
{
    $resized = wl_crop_square_avatar_binary($binary, 256);
    $ext = $resized['ext'] ?? 'webp';
    $safeId = wl_sanitize_asset_id($userId);
    $path = wl_uploads_avatars_dir() . '/' . $safeId . '.' . $ext;
    file_put_contents($path, $resized['binary']);
    return wl_media_public_path('avatars', $userId, $ext) . '?v=' . time();
}

function wl_delete_user_avatar_file(string $userId): void
{
    $safeId = wl_sanitize_asset_id($userId);
    $dir = wl_uploads_avatars_dir();
    foreach (['webp', 'png', 'jpg', 'jpeg', 'gif'] as $ext) {
        $path = $dir . '/' . $safeId . '.' . $ext;
        if (is_file($path)) {
            @unlink($path);
        }
    }
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

/** Re-link coin imageUrl from files already on disk (e.g. after DB lost paths). */
function wl_repair_coin_image_urls(): array
{
    $coins = wl_get_config_key('coins', []);
    if (!is_array($coins) || $coins === []) {
        return ['coins' => [], 'repaired' => 0];
    }

    $dir = wl_uploads_coins_dir();
    $repaired = 0;

    foreach ($coins as &$coin) {
        $id = (string) ($coin['id'] ?? '');
        if ($id === '') {
            continue;
        }
        $safeId = wl_sanitize_asset_id($id);
        $foundUrl = null;
        foreach (['webp', 'png', 'jpg', 'jpeg', 'gif'] as $ext) {
            if (is_file($dir . '/' . $safeId . '.' . $ext)) {
                $foundUrl = wl_media_public_path('coins', $id, $ext);
                break;
            }
        }
        if ($foundUrl === null) {
            continue;
        }
        $current = (string) ($coin['imageUrl'] ?? '');
        if ($current !== $foundUrl) {
            $coin['imageUrl'] = $foundUrl;
            $repaired++;
        }
    }
    unset($coin);

    if ($repaired > 0) {
        wl_set_config_key('coins', $coins);
    }

    return ['coins' => $coins, 'repaired' => $repaired];
}

function wl_get_coins_for_api(): array
{
    $coins = wl_get_config_key('coins', []);
    if (!is_array($coins)) {
        return [];
    }
    $repair = wl_repair_coin_image_urls();
    $coins = $repair['coins'] ?: $coins;
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
