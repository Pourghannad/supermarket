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
 * Performs an HTTP GET request and returns the body, status code, and any cURL error.
 */
function fetchApi(string $url): array {
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
    
    $body  = curl_exec($ch);
    $code  = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    // PHP automatically frees cURL resources at the end of the request lifecycle.
    
    if ($body === false) {
        return ['body' => null, 'code' => $code, 'error' => $error];
    }
    
    return ['body' => $body, 'code' => $code, 'error' => null];
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
// 2. Fetch Stores
// ==========================================
$storesUrl = API_BASE . STORES_ENDPOINT . '?' . http_build_query([
    'latitude'  => $lat,
    'longitude' => $lon,
]);

$storesResult = fetchApi($storesUrl);

if ($storesResult['body'] === null) {
    sendJsonError(500, 'cURL error fetching stores: ' . $storesResult['error']);
}
if ($storesResult['code'] !== 200) {
    sendJsonError($storesResult['code'], 'GetAllStores returned HTTP ' . $storesResult['code']);
}

$data = json_decode($storesResult['body'], true);
if (!is_array($data)) {
    sendJsonError(500, 'GetAllStores did not return a valid JSON object or array.');
}

// ==========================================
// 3. Extract Store IDs
// ==========================================
$storeIds = [];

// Try standard path first
if (isset($data['data']['stores']) && is_array($data['data']['stores'])) {
    foreach ($data['data']['stores'] as $store) {
        if (isset($store['storeId'])) {
            $storeIds[] = (string) $store['storeId'];
        }
    }
}

// Fallback to recursive search if standard path yields nothing
if (empty($storeIds)) {
    $iterator = new RecursiveIteratorIterator(new RecursiveArrayIterator($data));
    foreach ($iterator as $key => $value) {
        if ($key === 'storeId' && !in_array((string)$value, $storeIds, true)) {
            $storeIds[] = (string)$value;
        }
    }
}

if (empty($storeIds)) {
    sendJsonError(422, 'No storeId fields found in GetAllStores response', [
        'structure_preview' => substr($storesResult['body'], 0, 500)
    ]);
}

// ==========================================
// 4. Fetch Offers
// ==========================================
// Build query string preserving multiple 'storeIds' parameters (e.g., storeIds=1&storeIds=2)
$storeIdsQuery = implode('&', array_map(fn($id) => 'storeIds=' . urlencode($id), $storeIds));
$offersUrl = API_BASE . OFFERS_ENDPOINT . '?pageType=HomePage&' . $storeIdsQuery;

$offersResult = fetchApi($offersUrl);

if ($offersResult['body'] === null) {
    sendJsonError(500, 'cURL error fetching offers: ' . $offersResult['error']);
}

// ==========================================
// 5. Return Offers Response
// ==========================================
http_response_code($offersResult['code']);
header('Content-Type: application/json');
echo $offersResult['body'];
exit;