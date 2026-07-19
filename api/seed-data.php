<?php

/** Minimal fallback when wl-config.json is not on the server yet. */
return [
    'coins' => [],
    'stats' => [
        ['id' => 'members', 'label' => 'Medlemmer', 'value' => 0, 'suffix' => ''],
        ['id' => 'co2', 'label' => 'Kg CO₂ sparet', 'value' => 0, 'suffix' => 'kg'],
        ['id' => 'donations', 'label' => 'Donationer', 'value' => 0, 'suffix' => 'kr'],
    ],
    'donationConfig' => ['mobilepay' => '', 'link' => '', 'qrImageUrl' => ''],
    'shopCategories' => [
        [
            'id' => 'tekstiler',
            'label' => 'Tekstiler',
            'icon' => '🛏️',
            'color' => '#60a5fa',
            'products' => [],
        ],
    ],
    'blogPosts' => [
        [
            'id' => 'welcome-post',
            'title' => 'Velkommen til WL Community',
            'author' => 'WL Team',
            'date' => '2026-04-30T10:00:00.000Z',
            'body' => 'WL Community er et digitalt fællesskab for mennesker, der vil udvikle bæredygtige idéer.',
            'tags' => ['fællesskab', 'velkommen', 'wl'],
        ],
    ],
];
