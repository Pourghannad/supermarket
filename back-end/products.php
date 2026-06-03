<?php
$latitude  = $_GET['latitude'] ?? null;
$longitude = $_GET['longitude'] ?? null;

if ($latitude === null || $longitude === null) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Missing parameters',
        'usage' => '?latitude=XX&longitude=YY'
    ], JSON_PRETTY_PRINT);
    exit;
}

$lat = (float) $latitude;
$lon = (float) $longitude;

if ($lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid coordinates (lat: -90..90, lon: -180..180)']);
    exit;
}
function httpGetWithCode($url) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_USERAGENT      => 'Okala-Offers-Wrapper/1.0',
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    if ($body === false) {
        return ['body' => null, 'code' => $code, 'error' => $error];
    }
    return ['body' => $body, 'code' => $code, 'error' => null];
}

$storesUrl = 'https://apigateway.okala.com/api/Lucifer/v1/StoreRanking/GetAllStores?' . http_build_query([
    'latitude'  => $lat,
    'longitude' => $lon,
]);

$storesResult = httpGetWithCode($storesUrl);
if ($storesResult['body'] === null) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL error fetching stores: ' . $storesResult['error']]);
    exit;
}
if ($storesResult['code'] !== 200) {
    http_response_code($storesResult['code']);
    echo json_encode(['error' => 'GetAllStores returned HTTP ' . $storesResult['code']]);
    exit;
}

$data = json_decode($storesResult['body'], true);
$storeIds = [];

if (is_array($data) && isset($data['data']['stores']) && is_array($data['data']['stores'])) {
    foreach ($data['data']['stores'] as $store) {
        if (isset($store['storeId'])) {
            $storeIds[] = (string) $store['storeId'];
        }
    }
}

if (empty($storeIds)) {
    $iterator = new RecursiveIteratorIterator(new RecursiveArrayIterator($data));
    foreach ($iterator as $key => $value) {
        if ($key === 'storeId' && !in_array((string)$value, $storeIds, true)) {
            $storeIds[] = (string)$value;
        }
    }
}

if (empty($storeIds)) {
    http_response_code(422);
    echo json_encode([
        'error' => 'No storeId fields found in GetAllStores response',
        'structure_preview' => substr($storesResult['body'], 0, 500)
    ]);
    exit;
}

$queryParams = ['pageType' => 'HomePage'];
$query = http_build_query($queryParams);
foreach ($storeIds as $id) {
    $query .= '&storeIds=' . urlencode($id);
}
$offersUrl = 'https://apigateway.okala.com/api/carousel/v4/offers?' . $query;

$offersResult = httpGetWithCode($offersUrl);
if ($offersResult['body'] === null) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL error fetching offers: ' . $offersResult['error']]);
    exit;
}

http_response_code($offersResult['code']);
header('Content-Type: application/json');
echo $offersResult['body'];
exit;