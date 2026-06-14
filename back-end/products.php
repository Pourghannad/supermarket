<?php
declare(strict_types=1);

// Configuration Constants
const API_BASE        = 'https://apigateway.okala.com/api';
const STORES_ENDPOINT = '/Lucifer/v1/StoreRanking/GetAllStores';
const OFFERS_ENDPOINT = '/carousel/v4/offers';
const USER_AGENT      = 'ok/1.0';

/**
 * Sends a standardized JSON error response and terminates the script.
 */
function sendJsonError(int $statusCode, string $message, array $extra = []): void {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode(array_merge(['error' => $message], $extra));
    exit;
}

/**
 * Performs MULTIPLE HTTP GET requests concurrently using curl_multi.
 * 
 * @param array $urls Associative array of ['identifier' => 'url']
 * @return array Associative array of ['identifier' => ['body' => ..., 'code' => ..., 'error' => ...]]
 */
function fetchApiMulti(array $urls): array {
    if (empty($urls)) {
        return [];
    }

    $mh = curl_multi_init();
    $curlArray = [];

    // Initialize all cURL handles and add them to the multi handle
    foreach ($urls as $key => $url) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_USERAGENT      => USER_AGENT,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
        ]);
        curl_multi_add_handle($mh, $ch);
        $curlArray[$key] = $ch;
    }

    // Execute the multi request concurrently
    $running = null;
    do {
        $status = curl_multi_exec($mh, $running);
        if ($running) {
            curl_multi_select($mh);
        }
    } while ($running > 0 && $status == CURLM_OK);

    // Gather results
    $results = [];
    foreach ($curlArray as $key => $ch) {
        $body  = curl_multi_getcontent($ch);
        $code  = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch) ?: null; // Convert empty string to null

        $results[$key] = [
            'body'  => $body === false ? null : $body,
            'code'  => $code,
            'error' => $error,
        ];

        curl_multi_remove_handle($mh, $ch);
        // Omitting curl_close($ch) as per your previous preference; PHP cleans it up at script end.
    }

    curl_multi_close($mh);
    return $results;
}

// ==========================================
// 1. Validate Input Parameters
// ==========================================
$latitude  = $_GET['latitude'] ?? null;
$longitude = $_GET['longitude'] ?? null;

if ($latitude === null || $longitude === null) {
    sendJsonError(400, 'Missing parameters', ['usage' => '?latitude=XX&longitude=YY']);
}

$lat = (float) $latitude;
$lon = (float) $longitude;

if ($lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
    sendJsonError(400, 'Invalid coordinates (lat: -90..90, lon: -180..180)');
}

// ==========================================
// 2. BATCH 1: Fetch Okala Stores & Digikalajet Main Page CONCURRENTLY
// ==========================================
$storesUrl = API_BASE . STORES_ENDPOINT . '?' . http_build_query([
    'latitude'  => $lat,
    'longitude' => $lon,
]);

$mainPageUrl = "https://api.digikalajet.ir/v3/main-page/?" . http_build_query([
    'latitude'  => $lat,
    'longitude' => $lon,
]);

$batch1 = fetchApiMulti([
    'okala_stores'  => $storesUrl,
    'digikala_main' => $mainPageUrl
]);

// --- Process Okala Stores (from Batch 1) ---
$storesResult = $batch1['okala_stores'];
if ($storesResult['body'] === null) sendJsonError(500, 'cURL error fetching stores: ' . $storesResult['error']);
if ($storesResult['code'] !== 200) sendJsonError($storesResult['code'], 'GetAllStores returned HTTP ' . $storesResult['code']);

$data = json_decode($storesResult['body'], true);
if (!is_array($data)) sendJsonError(500, 'GetAllStores did not return a valid JSON object or array.');

$storeIds = [];
if (isset($data['data']['stores']) && is_array($data['data']['stores'])) {
    foreach ($data['data']['stores'] as $store) {
        if (isset($store['storeId'])) $storeIds[] = (string) $store['storeId'];
    }
}
if (empty($storeIds)) {
    $iterator = new RecursiveIteratorIterator(new RecursiveArrayIterator($data));
    foreach ($iterator as $key => $value) {
        if ($key === 'storeId' && !in_array((string)$value, $storeIds, true)) $storeIds[] = (string)$value;
    }
}
if (empty($storeIds)) sendJsonError(422, 'No storeId fields found in GetAllStores response');

// --- Process Digikalajet Main Page (from Batch 1) ---
$mainPageResult = $batch1['digikala_main'];
$digikalaDetailUrls = [];
$digikalaMainError = null;

if ($mainPageResult['body'] === null) {
    $digikalaMainError = 'cURL error: ' . $mainPageResult['error'];
} elseif ($mainPageResult['code'] !== 200) {
    $digikalaMainError = 'HTTP ' . $mainPageResult['code'];
} else {
    $mainPageData = json_decode($mainPageResult['body'], true);
    if (isset($mainPageData['data']['components']) && is_array($mainPageData['data']['components'])) {
        $i = 0;
        foreach ($mainPageData['data']['components'] as $component) {
            if (isset($component['component_type']) && $component['component_type'] === 'single-row-carousel') {
                $apiUrl = $component['data']['api']['url'] ?? null;
                if ($apiUrl) {
                    $separator = (strpos($apiUrl, '?') !== false) ? '&' : '?';
                    $detailUrl = "https://api.digikalajet.ir" . $apiUrl . $separator . http_build_query([
                        'latitude'  => $lat,
                        'longitude' => $lon,
                    ]);
                    $digikalaDetailUrls['digikala_detail_' . $i] = $detailUrl;
                    $i++;
                }
            }
        }
    }
}

// ==========================================
// 3. BATCH 2: Fetch Okala Offers & Digikalajet Details CONCURRENTLY
// ==========================================
$storeIdsQuery = implode('&', array_map(fn($id) => 'storeIds=' . urlencode($id), $storeIds));
$offersUrl = API_BASE . OFFERS_ENDPOINT . '?pageType=HomePage&' . $storeIdsQuery;

// Merge Okala offers URL with all Digikalajet detail URLs into one big concurrent batch
$batch2Urls = array_merge(['okala_offers' => $offersUrl], $digikalaDetailUrls);
$batch2 = fetchApiMulti($batch2Urls);

// --- Process Okala Offers (from Batch 2) ---
$offersResult = $batch2['okala_offers'];
if ($offersResult['body'] === null) sendJsonError(500, 'cURL error fetching offers: ' . $offersResult['error']);
if ($offersResult['code'] !== 200) sendJsonError($offersResult['code'], 'Okala offers returned HTTP ' . $offersResult['code']);

$offersData = json_decode($offersResult['body'], true);
$okalaProducts = [];

if (isset($offersData['carousels']) && is_array($offersData['carousels'])) {
    foreach ($offersData['carousels'] as $carousel) {
        if (isset($carousel['products']) && is_array($carousel['products'])) {
            foreach ($carousel['products'] as $product) {
                $product['source'] = 'okala';
                $okalaProducts[] = $product;
            }
        }
    }
}

// --- Process Digikalajet Details (from Batch 2) ---
$digikalaJetProducts = [];
foreach ($digikalaDetailUrls as $key => $url) {
    if (isset($batch2[$key])) {
        $detailResult = $batch2[$key];
        if ($detailResult['body'] !== null && $detailResult['code'] === 200) {
            $detailData = json_decode($detailResult['body'], true);
            if (isset($detailData['data']['products']) && is_array($detailData['data']['products'])) {
                foreach ($detailData['data']['products'] as $product) {
                    $product['source'] = 'digikalajet';
                    $digikalaJetProducts[] = $product;
                }
            }
        }
    }
}

// ==========================================
// 4. Combine and Return Unified JSON
// ==========================================
$combinedProducts = array_merge($okalaProducts, $digikalaJetProducts);

$response = [
    'success'           => true,
    'total_products'    => count($combinedProducts),
    'okala_count'       => count($okalaProducts),
    'digikalajet_count' => count($digikalaJetProducts),
    'products'          => $combinedProducts,
];

if ($digikalaMainError !== null) {
    $response['digikalajet_warning'] = 'Failed to fetch Digikalajet main page: ' . $digikalaMainError;
}

http_response_code(200);
header('Content-Type: application/json');
echo json_encode($response);
exit;