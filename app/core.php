<?php
declare(strict_types=1);
class AppError extends RuntimeException {public function __construct(string $message,int $status=400){parent::__construct($message,$status);}}
function txt($v,int $max=200): string {return mb_substr(trim(is_scalar($v)?(string)$v:''),0,$max);}
function esc($v): string {return htmlspecialchars((string)($v??''),ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
function uid(): string {$h=bin2hex(random_bytes(16));return substr($h,0,8).'-'.substr($h,8,4).'-4'.substr($h,13,3).'-a'.substr($h,17,3).'-'.substr($h,20);}
function ms(): int {return (int)floor(microtime(true)*1000);}
function db(): PDO {global $config;static $p;if(!$p){$d=$config['db'];$p=new PDO('mysql:host='.$d['host'].';port='.($d['port']??3306).';dbname='.$d['name'].';charset=utf8mb4',$d['user'],$d['pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_EMULATE_PREPARES=>false,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);}return $p;}
function run(string $sql,array $args=[]): PDOStatement {$q=db()->prepare($sql);$q->execute($args);return $q;}
function rows(string $sql,array $args=[]): array {return run($sql,$args)->fetchAll();}
function one(string $sql,array $args=[]): ?array {return run($sql,$args)->fetch()?:null;}
function decodeRow(?array $r): ?array {if(!$r)return null;if(isset($r['data']))$r['data']=json_decode($r['data'],true)?:[];foreach(['active','featured','publish_at','created_at','updated_at','version','total','today','count'] as $k)if(isset($r[$k]))$r[$k]=(int)$r[$k];return $r;}
function records(string $sql,array $args=[]): array {return array_map('decodeRow',rows($sql,$args));}
function setting(string $key,array $fallback=[]): array {$r=one('SELECT value FROM cv_settings WHERE `key`=?',[$key]);return $r?(json_decode($r['value'],true)?:[]):$fallback;}
function saveSetting(string $key,array $v): void {run('INSERT INTO cv_settings (`key`,value,updated_at) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value=VALUES(value),updated_at=VALUES(updated_at)',[$key,json_encode($v,JSON_UNESCAPED_UNICODE),ms()]);}
function site(): array {return array_replace(['name'=>'CineVault','description'=>'Discover movies and TV series.','adsEnabled'=>false,'adRotation'=>'priority','gatewaySeconds'=>3,'accent'=>'#e74733','background'=>'#08090b','panel'=>'#111317','textColor'=>'#f5f6f7','logo'=>'','favicon'=>''],setting('site'));}
function audit(string $action,string $detail=''): void {run('INSERT INTO cv_activity VALUES (?,?,?,?,?)',[uid(),$_SESSION['user']['username']??'Installer',$action,txt($detail,300),ms()]);}
function choice($v,array $options,$fallback){if($v===null||$v==='')return $fallback;if(!in_array($v,$options,true))throw new AppError('Invalid selection.');return $v;}
function num($v,$min,$max,$fallback=0){if($v===null||$v==='')return $fallback;if(!is_numeric($v)||$v<$min||$v>$max)throw new AppError("Enter a number between $min and $max.");return 0+$v;}
function listval($v): array {return array_slice(array_values(array_filter(array_map(fn($x)=>txt($x,100),is_array($v)?$v:explode(',',(string)$v)))),0,50);}
function httpsUrl($v,bool $required=false): string {$s=txt($v,4000);if(!$s&&!$required)return ''; $u=parse_url($s);if(!$s||!filter_var($s,FILTER_VALIDATE_URL)||($u['scheme']??'')!=='https'||isset($u['user'])||isset($u['pass']))throw new AppError('Use a complete HTTPS URL.');return $s;}
function imageUrl($v): string {return preg_match('~^/media/[a-f0-9-]+\.(png|jpg|webp|ico)$~',(string)$v)?$v:httpsUrl($v);}
function dateval($v): int {if(!$v)return 0;if(is_numeric($v))return (int)$v;$n=strtotime($v);if(!$n)throw new AppError('Invalid date.');return $n*1000;}
function out(array $data,int $status=200): never {http_response_code($status);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private,no-store');echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);exit;}
function go(string $path): never {header('Location: '.$path,true,303);exit;}
function startSession(): void {if(session_status()===PHP_SESSION_ACTIVE)return;session_name('cinevault_session');ini_set('session.use_strict_mode','1');session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off','httponly'=>true,'samesite'=>'Strict']);session_start();$_SESSION['csrf']??=bin2hex(random_bytes(32));}
function csrf(): string {startSession();return $_SESSION['csrf'];}
function originCheck(): void {global $config;$origin=$_SERVER['HTTP_ORIGIN']??'';if($origin&&rtrim($origin,'/')!==rtrim($config['url'],'/'))throw new AppError('Request origin rejected.',403);}
function checkCsrf($token): void {startSession();originCheck();if(!is_string($token)||!hash_equals(csrf(),$token))throw new AppError('Session expired. Reload the page and try again.',403);}
function user(): ?array {startSession();$u=$_SESSION['user']??null;if(!$u)return null;$current=one('SELECT * FROM cv_users WHERE id=?',[$u['id']]);if(!$current||!$current['active']||$current['version']!=$u['version']||($_SESSION['expires']??0)<time()){unset($_SESSION['user']);return null;}return $current;}
function requireUser(): array {$u=user();if(!$u)throw new AppError('Please sign in again.',401);return $u;}
function signToken(array $data): string {global $config;$s=rtrim(strtr(base64_encode(json_encode($data)),'+/','-_'),'=');return $s.'.'.hash_hmac('sha256',$s,$config['secret']);}
function token($value,string $purpose): array {global $config;$parts=explode('.',(string)$value);if(count($parts)!==2||!hash_equals(hash_hmac('sha256',$parts[0],$config['secret']),$parts[1]))throw new AppError('This form expired. Reload the page.',403);$d=json_decode(base64_decode(strtr($parts[0],'-_','+/')),true);if(!$d||($d['purpose']??'')!==$purpose||($d['exp']??0)<time())throw new AppError('This form expired. Reload the page.',403);return $d;}
function seal(string $value): string {global $config;if(!$value)return '';$iv=random_bytes(12);$tag='';$body=openssl_encrypt($value,'aes-256-gcm',hash('sha256',$config['secret'],true),OPENSSL_RAW_DATA,$iv,$tag);return base64_encode($iv.$tag.$body);}
function unseal(string $value): string {global $config;if(!$value)return '';$v=base64_decode($value,true);if(!$v||strlen($v)<28)throw new AppError('Re-enter the provider API key.');$p=openssl_decrypt(substr($v,28),'aes-256-gcm',hash('sha256',$config['secret'],true),OPENSSL_RAW_DATA,substr($v,0,12),substr($v,12,16));if($p===false)throw new AppError('Re-enter the provider API key.');return $p;}
function published(?array $r): bool {return $r&&($r['status']==='published'||($r['status']==='scheduled'&&$r['publish_at']<=ms()));}
function visible(string $id): ?array {$r=one('SELECT * FROM cv_catalog WHERE id=?',[$id]);if(!published($r))return null;$first=$r;for($i=0;!empty($r['parent_id'])&&$i<3;$i++){ $r=one('SELECT * FROM cv_catalog WHERE id=?',[$r['parent_id']]);if(!published($r))return null;}return decodeRow($first);}
function metric(string $kind,string $target): void {$day=gmdate('Y-m-d');run('INSERT INTO cv_metrics (id,day,kind,target,count) VALUES (?,?,?,?,1) ON DUPLICATE KEY UPDATE count=count+1',[$day.':'.$kind.':'.$target,$day,$kind,$target]);}
