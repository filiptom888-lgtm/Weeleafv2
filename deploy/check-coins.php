<?php
require __DIR__ . '/lib/bootstrap.php';
$coins = wl_get_config_key('coins', []);
foreach ($coins as $c) {
    $id = $c['id'] ?? '?';
    $img = $c['imageUrl'] ?? '';
    echo $id . ' | ' . (strlen($img) > 0 ? 'image len=' . strlen($img) : 'NO IMAGE') . PHP_EOL;
}
echo 'total coins: ' . count($coins) . PHP_EOL;
