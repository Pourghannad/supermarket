<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

const API_BASE        = 'https://apigateway.okala.com/api';
const STORES_ENDPOINT = '/opex/v4/stores/nearby';
const OFFERS_ENDPOINT = '/carousel/v4/offers';
const USER_AGENT      = 'ok/1.0';

/**
 * Common headers required by the Okala gateway.
 * These are taken from the public web/app client.
 */
function okalaHeaders(): array {
    return [
        'Accept: application/json',
        'Accept-Language: fa-IR,fa;q=0.9,en;q=0.8',
        'Origin: https://www.okala.com',
        'Referer: https://www.okala.com/',
        'source: okala',
        'ui-version: 2.0',
    ];
}

/**
 * Standardized JSON error – used only for fatal input errors (e.g. missing coordinates).
 */
function sendJsonError(int $statusCode, string $message, array $extra = []): void {
    error_log("API Error [$statusCode]: $message" . (!empty($extra) ? ' | ' . json_encode($extra) : ''));
    http_response_code($statusCode);
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    echo json_encode(array_merge(['error' => $message], $extra));
    exit;
}

/**
 * Concurrent fetch with per‑request header override.
 *
 * @param array $urls  ['identifier' => 'url']
 * @param array $headersByKey  Optional: ['identifier' => [header lines]]
 */
function fetchApiMulti(array $urls, array $headersByKey = []): array {
    if (empty($urls)) return [];

    $mh = curl_multi_init();
    $curlArray = [];

    foreach ($urls as $key => $url) {
        $ch = curl_init();
        $headers = $headersByKey[$key] ?? ['Accept: application/json'];
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_USERAGENT      => USER_AGENT,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_HTTPHEADER     => $headers,
        ]);
        curl_multi_add_handle($mh, $ch);
        $curlArray[$key] = $ch;
    }

    $running = null;
    do {
        $status = curl_multi_exec($mh, $running);
        if ($running) curl_multi_select($mh);
    } while ($running > 0 && $status == CURLM_OK);

    $results = [];
    foreach ($curlArray as $key => $ch) {
        $body  = curl_multi_getcontent($ch);
        $code  = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch) ?: null;

        $results[$key] = [
            'body'  => $body === false ? null : $body,
            'code'  => $code,
            'error' => $error,
        ];

        if ($error !== null) {
            error_log("cURL error for [$key]: $error | URL: {$urls[$key]}");
        }

        curl_multi_remove_handle($mh, $ch);
    }

    curl_multi_close($mh);
    return $results;
}

// ------------------------------------------------------------------
// 1. Input validation (fatal – cannot proceed without coordinates)
// ------------------------------------------------------------------
$latitude  = $_GET['latitude']  ?? null;
$longitude = $_GET['longitude'] ?? null;

if ($latitude === null || $longitude === null) {
    sendJsonError(400, 'Missing parameters', ['usage' => '?latitude=XX&longitude=YY']);
}

$lat = (float) $latitude;
$lon = (float) $longitude;

if ($lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
    sendJsonError(400, 'Invalid coordinates (lat: -90..90, lon: -180..180)');
}

// ------------------------------------------------------------------
// 2. BATCH 1 – Okala stores + Digikalajet main page
// ------------------------------------------------------------------
$storesUrl = API_BASE . STORES_ENDPOINT . '?' . http_build_query([
    'latitude'  => $lat,
    'longitude' => $lon,
]);

$mainPageUrl = "https://api.digikalajet.ir/v3/main-page/?" . http_build_query([
    'latitude'  => $lat,
    'longitude' => $lon,
]);

$batch1 = fetchApiMulti(
    [
        'okala_stores'  => $storesUrl,
        'digikala_main' => $mainPageUrl,
    ],
    [
        'okala_stores' => okalaHeaders(),   // required by Okala
    ]
);

$warnings = [];

// --- Okala stores (fatal only for Okala side, but we still continue) ---
$storesResult = $batch1['okala_stores'];
$storeIds = [];

if ($storesResult['body'] === null) {
    $warnings[] = 'Okala stores cURL error: ' . $storesResult['error'];
} elseif ($storesResult['code'] !== 200) {
    $warnings[] = 'Okala stores HTTP ' . $storesResult['code'];
} else {
    $data = json_decode($storesResult['body'], true);
    if (is_array($data)) {
        if (isset($data['data']['stores'])) {
            foreach ($data['data']['stores'] as $s) {
                if (isset($s['storeId'])) $storeIds[] = (string)$s['storeId'];
            }
        }
        // fallback: recursive search for storeId
        if (empty($storeIds)) {
            $it = new RecursiveIteratorIterator(new RecursiveArrayIterator($data));
            foreach ($it as $k => $v) {
                if ($k === 'storeId' && !in_array((string)$v, $storeIds, true)) {
                    $storeIds[] = (string)$v;
                }
            }
        }
    }
    if (empty($storeIds)) {
        $warnings[] = 'No storeId fields found in Okala stores response';
    }
}

// --- Digikalajet main page (non‑fatal) ---
$mainPageResult = $batch1['digikala_main'];
$digikalaDetailUrls = [];

if ($mainPageResult['body'] === null) {
    $warnings[] = 'Digikalajet main page cURL error: ' . $mainPageResult['error'];
} elseif ($mainPageResult['code'] !== 200) {
    $warnings[] = 'Digikalajet main page HTTP ' . $mainPageResult['code'];
} else {
    $mainPageData = json_decode($mainPageResult['body'], true);
    if (is_array($mainPageData) && isset($mainPageData['data']['components'])) {
        $i = 0;
        foreach ($mainPageData['data']['components'] as $component) {
            if (($component['component_type'] ?? null) === 'single-row-carousel') {
                $apiPath = $component['data']['api']['url'] ?? null;
                if ($apiPath) {
                    $sep = str_contains($apiPath, '?') ? '&' : '?';
                    $digikalaDetailUrls["digikala_detail_$i"] =
                        "https://api.digikalajet.ir{$apiPath}{$sep}" .
                        http_build_query(['latitude' => $lat, 'longitude' => $lon]);
                    $i++;
                }
            }
        }
    }
}

// ------------------------------------------------------------------
// 3. BATCH 2 – Okala offers + Digikalajet detail endpoints
// ------------------------------------------------------------------
$okalaProducts   = [];
$digikalaProducts = [];

// Build Okala offers URL only if we have store IDs
$offersUrl = null;
if (!empty($storeIds)) {
    $query = http_build_query([
        'pageType'  => 'HomePage',
        'storeIds'  => $storeIds,   // http_build_query repeats the key
        'latitude'  => $lat,
        'longitude' => $lon,
    ]);
    $offersUrl = API_BASE . OFFERS_ENDPOINT . '?' . $query;
}

$batch2Urls = $digikalaDetailUrls; // start with Digikala
if ($offersUrl !== null) {
    $batch2Urls['okala_offers'] = $offersUrl;
}

$batch2Headers = [];
if ($offersUrl !== null) {
    $batch2Headers['okala_offers'] = okalaHeaders();
}

$batch2 = fetchApiMulti($batch2Urls, $batch2Headers);

// --- Okala offers ---
if ($offersUrl !== null) {
    $offersResult = $batch2['okala_offers'] ?? null;
    if ($offersResult === null) {
        $warnings[] = 'Okala offers request was not made';
    } elseif ($offersResult['body'] === null) {
        $warnings[] = 'Okala offers cURL error: ' . $offersResult['error'];
    } elseif ($offersResult['code'] !== 200) {
        $warnings[] = 'Okala offers HTTP ' . $offersResult['code'];
        error_log("Okala offers HTTP {$offersResult['code']} | URL: $offersUrl | Body: " . substr($offersResult['body'], 0, 300));
    } else {
        $offersData = json_decode($offersResult['body'], true);
        if (is_array($offersData) && isset($offersData['carousels'])) {
            foreach ($offersData['carousels'] as $carousel) {
                if (isset($carousel['products'])) {
                    foreach ($carousel['products'] as $product) {
                        $product['source'] = 'okala';
                        $okalaProducts[] = $product;
                    }
                }
            }
        }
    }
} else {
    $warnings[] = 'Skipping Okala offers – no store IDs available';
}

// --- Digikalajet details ---
foreach ($digikalaDetailUrls as $key => $url) {
    $detail = $batch2[$key] ?? null;
    if ($detail === null) {
        $warnings[] = "Digikalajet detail [$key] not executed";
        continue;
    }
    if ($detail['body'] === null) {
        $warnings[] = "Digikalajet detail [$key] cURL error: {$detail['error']}";
        continue;
    }
    if ($detail['code'] !== 200) {
        $warnings[] = "Digikalajet detail [$key] HTTP {$detail['code']}";
        continue;
    }
    $detailData = json_decode($detail['body'], true);
    if (is_array($detailData) && isset($detailData['data']['products'])) {
        foreach ($detailData['data']['products'] as $product) {
            $product['source'] = 'digikalajet';
            $digikalaProducts[] = $product;
        }
    }
}

// ------------------------------------------------------------------
// 4. Always return 200 with whatever was collected
// ------------------------------------------------------------------
$allProducts = array_merge($okalaProducts, $digikalaProducts);

$response = [
    'success'           => true, // request was processed, even if one source failed
    'total_products'    => count($allProducts),
    'okala_count'       => count($okalaProducts),
    'digikalajet_count' => count($digikalaProducts),
    'products'          => $allProducts,
];

if (!empty($warnings)) {
    $response['warnings'] = $warnings;
}

http_response_code(200);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
echo json_encode($response);
exit;