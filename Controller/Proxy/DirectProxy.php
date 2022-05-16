<?php
$requestHeaders = getallheaders();
$apiKeyRaw = $requestHeaders['X-Auth-Key'];
$apiUrl = $requestHeaders['X-Remote-Api-Url'];
$content = file_get_contents('php://input');

$keysToRemove = [
    'x-auth-key',
    'x-remote-api-url',
    'Content-Type',
    'Content-Length',
];
foreach ($keysToRemove as $key) {
    if(array_key_exists($key, $requestHeaders)) {
        unset($requestHeaders[$key]);
    }
}

header('Content-Type: application/json');
if (empty($apiUrl) || empty($apiKeyRaw)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required headers', 'headers' => $requestHeaders]);
    exit;
}

$headersToSend = [];
foreach ($requestHeaders as $name => $value) {
    $headersToSend[] = $name . ': ' . $value;
}

$headersToSend[] = 'X-Auth-Key: ' . $apiKeyRaw;
$headersToSend[] = 'Content-Type: application/json';

$curlHandle = curl_init($apiUrl);
curl_setopt_array(
    $curlHandle,
    [
        CURLOPT_TCP_FASTOPEN => true,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $content,
        CURLOPT_HTTPHEADER => $headersToSend
    ]
);

$time = microtime(true);
$response = curl_exec($curlHandle);
$time = microtime(true) - $time;

/** Return status 203 */
http_response_code(curl_getinfo($curlHandle, CURLINFO_HTTP_CODE));
curl_close($curlHandle);
echo $response;
