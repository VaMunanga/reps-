<?php
declare(strict_types=1);
require_once __DIR__.'/service.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
$now=microtime(true);
try {
    $method=$_SERVER['REQUEST_METHOD']??'GET';
    if(!in_array($method,['GET','POST'],true)) throw new FocusError('Method not allowed.',405);
    $v=$_GET;
    if($method==='POST') {
        if((int)($_SERVER['CONTENT_LENGTH']??0)>16384)throw new FocusError('Request too large.',413);
        if(!str_starts_with(strtolower($_SERVER['CONTENT_TYPE']??''),'application/json'))throw new FocusError('Send JSON content.',415);
        $raw=file_get_contents('php://input',false,null,0,16385);if(strlen($raw)>16384)throw new FocusError('Request too large.',413);
        try { $v=json_decode($raw,true,32,JSON_THROW_ON_ERROR); } catch(Throwable) {throw new FocusError('Invalid JSON.');}
        if(!is_array($v) || array_is_list($v) && $v!==[])throw new FocusError('Send a JSON object.');
        $origin=$_SERVER['HTTP_ORIGIN']??'';
        if($origin!=='') {
            $parsed=parse_url($origin);$host=$parsed['host']??'';$port=isset($parsed['port'])?':'.$parsed['port']:'';
            if($host.$port!==($_SERVER['HTTP_HOST']??''))throw new FocusError('Cross-origin requests are unavailable.',403);
        }
    }
    $url=getenv('FOCUS_DATABASE_URL')?:getenv('DATABASE_URL');if(!$url)throw new FocusError('Private accounts are unavailable until the database is configured.',503);
    $db=membershipPdo($url);
    $service=new FocusService($db,$now);
    $payload=$service->run(is_string($_GET['action']??null)?$_GET['action']:'bootstrap',$v,$method==='POST');
    echo json_encode(array_merge(['ok'=>true,'serverTime'=>(new DateTimeImmutable('now',new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z')],$payload),JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
} catch(FocusError $e) {
    http_response_code($e->status);echo json_encode(['ok'=>false,'serverTime'=>gmdate('Y-m-d\TH:i:s\Z'),'message'=>$e->getMessage()]);
} catch(Throwable $e) {
    // Never log exception text: connection strings, tokens, addresses and tasks may be embedded.
    error_log('Focus API unavailable: '.get_class($e));
    http_response_code(503);echo json_encode(['ok'=>false,'serverTime'=>gmdate('Y-m-d\TH:i:s\Z'),'message'=>'Private accounts are temporarily unavailable. Please try again later.']);
}
