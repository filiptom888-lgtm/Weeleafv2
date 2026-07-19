<?php

declare(strict_types=1);

/**
 * Repair coin images: DB has /uploads/coins/*.webp but files missing.
 * Restores base64 imageUrl from wl-config.json, then writes files + updates DB.
 */
require __DIR__ . '/lib/bootstrap.php';

$configPath = dirname(__DIR__) . '/wl-config.json';
if (!is_file($configPath)) {
    echo json_encode(['ok' => false, 'error' => 'wl-config.json not found']) . PHP_EOL;
    exit(1);
}

$data = json_decode((string) file_get_contents($configPath), true);
$configCoins = [];
foreach (($data['coins'] ?? []) as $c) {
    if (!empty($c['id'])) {
        $configCoins[$c['id']] = $c;
    }
}

$coins = wl_get_config_key('coins', []);
if (!is_array($coins)) {
    $coins = [];
}

$restored = 0;
$written = 0;

foreach ($coins as &$coin) {
    $id = (string) ($coin['id'] ?? '');
    if ($id === '') {
        continue;
    }

    $url = (string) ($coin['imageUrl'] ?? '');
    $needsFile = $url === '' || str_starts_with($url, '/uploads/');
    $fileMissing = true;

    if (str_starts_with($url, '/uploads/')) {
        $diskPath = dirname(__DIR__) . $url;
        $fileMissing = !is_file($diskPath);
    }

    if ($needsFile && $fileMissing && isset($configCoins[$id]['imageUrl'])) {
        $src = (string) $configCoins[$id]['imageUrl'];
        if ($src !== '') {
            $coin['imageUrl'] = $src;
            $restored++;
        }
    }

    // Member coin often mirrors wl-hive — copy hive image if still missing
    if ($id === 'member' && $fileMissing) {
        $hive = null;
        foreach ($configCoins as $cc) {
            if (($cc['id'] ?? '') === 'wl-hive' && !empty($cc['imageUrl'])) {
                $hive = (string) $cc['imageUrl'];
                break;
            }
        }
        if ($hive !== null && $hive !== '') {
            $coin['imageUrl'] = $hive;
            $restored++;
        }
    }
}
unset($coin);

$result = wl_externalize_coin_images($coins);
if ($result['changed']) {
    wl_set_config_key('coins', $result['coins']);
}

foreach ($result['coins'] as $coin) {
    $url = (string) ($coin['imageUrl'] ?? '');
    if (str_starts_with($url, '/uploads/')) {
        $diskPath = dirname(__DIR__) . $url;
        if (is_file($diskPath)) {
            $written++;
        }
    }
}

echo json_encode([
    'ok' => true,
    'restoredFromConfig' => $restored,
    'filesOnDisk' => $written,
    'coins' => count($result['coins']),
]) . PHP_EOL;
