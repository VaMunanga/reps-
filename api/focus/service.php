<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/model.php';

final class FocusError extends RuntimeException {
    public function __construct(string $message, public int $status = 400) { parent::__construct($message); }
}
final class FocusService {
    private array $session;
    private string $sessionHash;
    public function __construct(private PDO $db, private float $now) {
        $token = $_COOKIE['reps_focus'] ?? '';
        $this->sessionHash = hash('sha256', $token);
        $row = $this->one('SELECT * FROM focus_sessions WHERE token_hash=? AND expires_at>now()',[$this->sessionHash]);
        if (!$row) $this->rotate(null); else $this->session = $row;
    }
    private function query(string $sql, array $args=[]): PDOStatement {
        try { $q=$this->db->prepare($sql); $q->execute($args); return $q; }
        catch (PDOException $e) {
            // Fingerprint static SQL only; never log parameters or exception text.
            error_log('Focus SQL failure: '.substr(hash('sha256',$sql),0,12).' state='.preg_replace('/[^A-Z0-9]/','',(string)$e->getCode()));
            throw $e;
        }
    }
    private function one(string $sql,array $args=[]): ?array { return $this->query($sql,$args)->fetch() ?: null; }
    private function stamp(float $time): string { return (new DateTimeImmutable('@'.sprintf('%.6F',$time)))->format('Y-m-d H:i:s.uP'); }
    private function time(string $stamp): float { return (float)(new DateTimeImmutable($stamp))->format('U.u'); }
    private function rotate(?string $account): void {
        $this->query('DELETE FROM focus_sessions WHERE token_hash=?',[$this->sessionHash]);
        $token=bin2hex(random_bytes(32)); $this->sessionHash=hash('sha256',$token);
        $this->session=['account_id'=>$account,'csrf'=>bin2hex(random_bytes(32))];
        $this->query("INSERT INTO focus_sessions(token_hash,account_id,csrf,expires_at) VALUES(?,?,?,now()+interval '14 days')",[$this->sessionHash,$account,$this->session['csrf']]);
        $host=explode(':',$_SERVER['HTTP_HOST']??'')[0];
        $local=in_array($host,['localhost','127.0.0.1'],true) && in_array($_SERVER['REMOTE_ADDR']??'',['127.0.0.1','::1'],true);
        setcookie('reps_focus',$token,['expires'=>(int)$this->now+1209600,'path'=>'/api/focus/','secure'=>!$local,'httponly'=>true,'samesite'=>'Strict']);
    }
    private function user(): string {
        $id=$this->session['account_id']; if (!$id) throw new FocusError('Sign in to use private groups.',401);
        return (string)$id;
    }
    private function lock(): string { $id=$this->user(); $this->one('SELECT id FROM focus_accounts WHERE id=? FOR UPDATE',[$id]); return $id; }
    private function text(array $v,string $key,int $max): string {
        $x=$v[$key]??null; if (!is_string($x) || trim($x)==='' || strlen(trim($x))>$max) throw new FocusError('Enter a valid '.$key.'.'); return trim($x);
    }
    private function integer(array $v,string $key,int $max): int {
        $x=$v[$key]??null; if (!is_int($x) || $x<1 || $x>$max) throw new FocusError('Enter a valid '.$key.'.'); return $x;
    }
    private function boolean(array $v,string $key): bool { if (!isset($v[$key]) || !is_bool($v[$key])) throw new FocusError('Enter a valid '.$key.'.'); return $v[$key]; }
    private function password(array $v): string {
        $password=$v['password']??null;
        if(!is_string($password) || strlen($password)<12 || strlen($password)>1024) throw new FocusError('Use a password between 12 and 1024 characters.');
        return $password;
    }
    private function group(string $id,bool $owner=false): array {
        $uid=$this->user();
        $g=$this->one('SELECT g.*,m.share_progress,m.show_ranking FROM focus_groups g JOIN focus_memberships m ON m.group_id=g.id WHERE g.id=? AND m.account_id=? AND NOT g.archived FOR UPDATE OF g',[$id,$uid]);
        if (!$g) throw new FocusError('This group is unavailable or you are not a member.',403);
        if ($owner && (string)$g['owner_id']!==$uid) throw new FocusError('Only the group owner can change this.',403);
        return $g;
    }
    private function rate(string $scope,int $max,int $seconds): void {
        $key=hash('sha256',$scope);
        $r=$this->one("INSERT INTO focus_rate_limits(key_hash,window_start,hits) VALUES(?,now(),1) ON CONFLICT(key_hash) DO UPDATE SET hits=CASE WHEN focus_rate_limits.window_start < now()-make_interval(secs=>?) THEN 1 ELSE focus_rate_limits.hits+1 END,window_start=CASE WHEN focus_rate_limits.window_start < now()-make_interval(secs=>?) THEN now() ELSE focus_rate_limits.window_start END RETURNING hits",[$key,$seconds,$seconds]);
        if ((int)$r['hits']>$max) throw new FocusError('Too many requests. Please try again later.',429);
    }
    private function recovery(): bool { return (bool)(getenv('RESEND_API_KEY') && getenv('FOCUS_MAIL_FROM') && filter_var(getenv('FOCUS_PUBLIC_URL'),FILTER_VALIDATE_URL) && str_starts_with(getenv('FOCUS_PUBLIC_URL'),'https://') && function_exists('curl_init')); }
    private function bootstrap(): array {
        $user=null;$groups=[];
        if ($this->session['account_id']) {
            $user=$this->one('SELECT id,name,email FROM focus_accounts WHERE id=?',[$this->user()]); $user['id']=(string)$user['id'];
            $groups=$this->query('SELECT g.id,g.name,g.owner_id AS "ownerId" FROM focus_groups g JOIN focus_memberships m ON m.group_id=g.id WHERE m.account_id=? AND NOT g.archived ORDER BY g.id',[$this->user()])->fetchAll();
            foreach($groups as &$g) { $g['id']=(string)$g['id'];$g['ownerId']=(string)$g['ownerId']; }
        }
        return ['user'=>$user,'csrf'=>$this->session['csrf'],'recoveryAvailable'=>$this->recovery(),'groups'=>$groups];
    }
    public function run(string $action,array $v,bool $post): array {
        $reads=['bootstrap','group_view'];
        if ($post === in_array($action,$reads,true)) throw new FocusError('Method not allowed.',405);
        // Rate counters commit independently of business rollbacks, including failed sign-ins.
        $ip=$_SERVER['REMOTE_ADDR']??'unknown';
        $this->rate('ip:'.$ip,240,60);
        if (in_array($action,['register','login','reset_request','reset_password'],true)) {
            $this->rate('auth-ip:'.$ip,30,900);
            $this->rate('auth-email:'.strtolower((string)($v['email']??$v['token']??'')),10,900);
        }
        if ($post && !hash_equals($this->session['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??'')) throw new FocusError('Your security token expired. Reload and try again.',403);
        $this->db->beginTransaction();
        try {
            $result=$this->dispatch($action,$v);
            // Account progress includes confirmed solo and group work once, separately
            // from historical device totals. Anonymous/logout responses omit it.
            if ($this->session['account_id']) $result['accountTotals']=$this->totals($this->user());
            $this->db->commit(); return $result;
        }
        catch (Throwable $e) { if ($this->db->inTransaction()) $this->db->rollBack(); throw $e; }
    }
    private function dispatch(string $action,array $v): array {
        if ($action==='bootstrap') return $this->bootstrap();
        if ($action==='register' || $action==='login') {
            $email=strtolower($this->text($v,'email',254));$password=$this->password($v);
            if (!filter_var($email,FILTER_VALIDATE_EMAIL)) throw new FocusError('Enter a valid email address.');
            if ($action==='register') {
                $name=$this->text($v,'name',80); if(strlen($password)<12) throw new FocusError('Use a password with at least 12 characters.');
                $hash=password_hash($password,PASSWORD_ARGON2ID);
                $account=$this->one('INSERT INTO focus_accounts(name,email,password_hash) VALUES(?,?,?) ON CONFLICT(email) DO NOTHING RETURNING id',[$name,$email,$hash]);
                if (!$account) throw new FocusError('Unable to create an account with these details.',409);
            } else {
                $account=$this->one('SELECT id,password_hash FROM focus_accounts WHERE email=?',[$email]);
                $hash=$account['password_hash']??'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
                if (!password_verify($password,$hash) || !$account) throw new FocusError('Email or password is incorrect.',401);
            }
            $this->rotate((string)$account['id']);return $this->bootstrap();
        }
        if ($action==='logout') { $this->rotate(null);return $this->bootstrap(); }
        if ($action==='reset_request') {
            if (!$this->recovery()) throw new FocusError('Password recovery is unavailable until email delivery is configured.',503);
            $email=strtolower($this->text($v,'email',254)); $account=$this->one('SELECT id FROM focus_accounts WHERE email=?',[$email]);
            if ($account) {
                $token=bin2hex(random_bytes(32));$this->query('DELETE FROM focus_resets WHERE account_id=?',[$account['id']]);
                $this->query("INSERT INTO focus_resets(token_hash,account_id,expires_at) VALUES(?,?,now()+interval '30 minutes')",[hash('sha256',$token),$account['id']]);
                $url=rtrim(getenv('FOCUS_PUBLIC_URL'),'/').'/focus.html#reset='.rawurlencode($token);
                $curl=curl_init('https://api.resend.com/emails');
                curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>15,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.getenv('RESEND_API_KEY'),'Content-Type: application/json'],CURLOPT_POSTFIELDS=>json_encode(['from'=>getenv('FOCUS_MAIL_FROM'),'to'=>[$email],'subject'=>'Reset your REPS password','text'=>'Use this single-use link within 30 minutes: '.$url])]);
                $sent=curl_exec($curl);$status=curl_getinfo($curl,CURLINFO_HTTP_CODE);curl_close($curl);
                if ($sent===false || $status<200 || $status>=300) throw new FocusError('Password recovery email is temporarily unavailable. Please try again later.',503);
            }
            return ['message'=>'If an account matches, a password reset link will arrive shortly.'];
        }
        if ($action==='reset_password') {
            $password=$this->password($v);
            $reset=$this->one('DELETE FROM focus_resets WHERE token_hash=? AND expires_at>now() RETURNING account_id',[hash('sha256',$this->text($v,'token',128))]);
            if (!$reset) throw new FocusError('This reset link is invalid or expired.');
            $this->query('UPDATE focus_accounts SET password_hash=? WHERE id=?',[password_hash($password,PASSWORD_ARGON2ID),$reset['account_id']]);
            $this->query('DELETE FROM focus_sessions WHERE account_id=?',[$reset['account_id']]);
            $this->query('DELETE FROM focus_resets WHERE account_id=?',[$reset['account_id']]);return ['message'=>'Password updated. Sign in with your new password.'];
        }
        $uid=$this->lock();
        // Finalize only previously confirmed intervals. Reads never create disconnected time.
        $this->finalize($uid);
        if ($action==='solo') return $this->solo($uid,$v);
        if ($action==='group_create') {
            $name=$this->text($v,'name',100);$tz=$this->text($v,'timezone',100);
            if (!in_array($tz,DateTimeZone::listIdentifiers(),true) && $tz!=='UTC') throw new FocusError('Select a valid IANA timezone.');
            $g=$this->one('INSERT INTO focus_groups(owner_id,name,timezone) VALUES(?,?,?) RETURNING id',[$uid,$name,$tz]);
            $this->query('INSERT INTO focus_memberships(group_id,account_id) VALUES(?,?)',[$g['id'],$uid]);return ['groupId'=>(string)$g['id']];
        }
        if ($action==='invite_join') {
            $g=$this->one('SELECT g.id FROM focus_invites i JOIN focus_groups g ON g.id=i.group_id WHERE i.token_hash=? AND NOT g.archived FOR UPDATE OF g',[hash('sha256',$this->text($v,'token',128))]);
            if (!$g) throw new FocusError('This invite is invalid or was revoked.',404);
            $this->query('INSERT INTO focus_memberships(group_id,account_id) VALUES(?,?) ON CONFLICT DO NOTHING',[$g['id'],$uid]);return ['groupId'=>(string)$g['id']];
        }
        $gid=$this->text($v,'groupId',30);if(!ctype_digit($gid)) throw new FocusError('Invalid group.');
        $g=$this->group($gid,in_array($action,['invite_rotate','group_schedule'],true));
        if ($action==='invite_rotate') {
            $token=bin2hex(random_bytes(32));$this->query('INSERT INTO focus_invites(group_id,token_hash) VALUES(?,?) ON CONFLICT(group_id) DO UPDATE SET token_hash=excluded.token_hash',[$gid,hash('sha256',$token)]);return ['inviteToken'=>$token];
        }
        if ($action==='group_preferences') {
            $share=$this->boolean($v,'shareProgress');$rank=$this->boolean($v,'showRanking');
            $this->query('UPDATE focus_memberships SET share_progress=?,show_ranking=? WHERE group_id=? AND account_id=?',[$share?'true':'false',$rank?'true':'false',$gid,$uid]);
            if (array_key_exists('leaderboardEnabled',$v)) {
                if ((string)$g['owner_id']!==$uid) throw new FocusError('Only the owner can enable the leaderboard.',403);
                $this->query('UPDATE focus_groups SET leaderboard_enabled=? WHERE id=?',[$this->boolean($v,'leaderboardEnabled')?'true':'false',$gid]);
            } return [];
        }
        if ($action==='group_leave') {
            if ((string)$g['owner_id']===$uid && (int)$this->one('SELECT count(*) AS n FROM focus_memberships WHERE group_id=?',[$gid])['n']>1) throw new FocusError('The owner can leave after the other members have left.',409);
            $this->stopGroup($uid,$gid);
            $this->query('DELETE FROM focus_memberships WHERE group_id=? AND account_id=?',[$gid,$uid]);
            if ((string)$g['owner_id']===$uid) { $this->query('UPDATE focus_groups SET archived=true WHERE id=?',[$gid]);$this->query('DELETE FROM focus_invites WHERE group_id=?',[$gid]); } return [];
        }
        if ($action==='group_schedule') return $this->schedule($gid,$v);
        if ($action==='participation') return $this->participation($uid,$gid,$v);
        if ($action==='group_view') return $this->view($uid,$g);
        throw new FocusError('Unknown action.',404);
    }
    private function schedule(string $gid,array $v): array {
        $old=$this->one('SELECT * FROM focus_schedules WHERE group_id=? ORDER BY id DESC LIMIT 1',[$gid]);
        if ($old && $this->scheduleEnd($old)>$this->now) throw new FocusError('Wait until the current schedule finishes before replacing it.',409);
        $task=$this->text($v,'task',500);$focus=$this->integer($v,'focusMinutes',180);$break=$this->integer($v,'breakMinutes',60);$rounds=$this->integer($v,'rounds',8);
        $raw=$this->text($v,'startsAt',50);
        $start=focusUtcTimestamp($raw);if($start===null)throw new FocusError('Use a valid UTC ISO start time.');
        if($start<$this->now || $start>$this->now+2592000) throw new FocusError('Choose a future start within 30 days.');
        $s=$this->one('INSERT INTO focus_schedules(group_id,task,starts_at,focus_minutes,break_minutes,rounds) VALUES(?,?,?,?,?,?) RETURNING id',[$gid,$task,$this->stamp($start),$focus,$break,$rounds]);
        if($v['saveTemplate']??false) $this->query('INSERT INTO focus_templates(group_id,task,focus_minutes,break_minutes,rounds) VALUES(?,?,?,?,?) ON CONFLICT(group_id) DO UPDATE SET task=excluded.task,focus_minutes=excluded.focus_minutes,break_minutes=excluded.break_minutes,rounds=excluded.rounds',[$gid,$task,$focus,$break,$rounds]);
        return ['scheduleId'=>(string)$s['id']];
    }
    private function scheduleEnd(array $s): float { return $this->time($s['starts_at'])+((int)$s['focus_minutes']*(int)$s['rounds']+(int)$s['break_minutes']*((int)$s['rounds']-1))*60; }
    private function stopGroup(string $uid,string $gid): void {
        $rows=$this->query('SELECT p.* FROM focus_participation p JOIN focus_schedules s ON s.id=p.schedule_id WHERE p.account_id=? AND s.group_id=? AND p.active',[$uid,$gid])->fetchAll();
        foreach($rows as $p) {
            $s=$this->one('SELECT * FROM focus_schedules WHERE id=?',[$p['schedule_id']]);
            if(!$p['paused'])$this->confirm($p,$s);
            $this->forfeit($p,$s);
        }
        $this->query('UPDATE focus_participation SET active=false,paused=true WHERE account_id=? AND schedule_id IN(SELECT id FROM focus_schedules WHERE group_id=?)',[$uid,$gid]);
        $this->finalize($uid);
    }
    private function active(string $uid): ?array { return $this->one('SELECT * FROM focus_participation WHERE account_id=? AND active FOR UPDATE',[$uid]); }
    private function participation(string $uid,string $gid,array $v): array {
        $sid=$this->text($v,'scheduleId',30);$op=$this->text($v,'operation',20);
        if(!in_array($op,['join','heartbeat','pause','resume','leave'],true)) throw new FocusError('Invalid participation operation.');
        $s=$this->one('SELECT * FROM focus_schedules WHERE id=? AND group_id=?',[$sid,$gid]);if(!$s) throw new FocusError('Schedule unavailable.',404);
        $p=$this->one('SELECT * FROM focus_participation WHERE account_id=? AND schedule_id=? FOR UPDATE',[$uid,$sid]);
        if($op==='join' || $op==='resume') {
            if($this->scheduleEnd($s)<=$this->now) throw new FocusError('This schedule has finished.',409);
            $active=$this->active($uid);if($active && (string)$active['id']!==(string)($p['id']??'')) throw new FocusError('Pause or end your other focus session first.',409);
            if(!$p) $p=$this->one('INSERT INTO focus_participation(account_id,schedule_id,starts_at,duration_seconds,last_confirmed) VALUES(?,?,?,?,?) RETURNING *',[$uid,$sid,$s['starts_at'],(int)$s['focus_minutes']*60,$this->stamp($this->now)]);
            elseif(!$p['active'] || $p['paused']) $this->query('UPDATE focus_participation SET active=true,paused=false,last_confirmed=? WHERE id=?',[$this->stamp($this->now),$p['id']]);
            return [];
        }
        // Another tab may already have confirmed and released this finished source.
        if($op==='heartbeat' && $p && !$p['paused'] && $this->scheduleEnd($s)<=$this->now && $this->time($p['last_confirmed'])>=$this->scheduleEnd($s)) return [];
        if(!$p || !$p['active']) { if($op==='leave')return []; throw new FocusError('Join this schedule first.',409); }
        if(!$p['paused']) $this->confirm($p,$s);
        if($op==='pause' || $op==='leave') {
            $this->forfeit($p,$s);
            $this->query('UPDATE focus_participation SET paused=true,active=false WHERE id=?',[$p['id']]);
        }
        $this->finalize($uid);return [];
    }
    private function solo(string $uid,array $v): array {
        $op=$this->text($v,'operation',20);$client=$this->text($v,'clientId',100);
        if(!in_array($op,['start','heartbeat','pause','resume','end'],true)) throw new FocusError('Invalid solo operation.');
        $p=$this->one('SELECT * FROM focus_participation WHERE account_id=? AND client_id=? FOR UPDATE',[$uid,$client]);
        if($op==='start') {
            if(!$p) {
                if($this->active($uid)) throw new FocusError('Pause or end your other focus session first.',409);
                $duration=$this->integer($v,'durationMinutes',180)*60;
                $this->query('INSERT INTO focus_participation(account_id,client_id,starts_at,duration_seconds,last_confirmed,solo_ends_at) VALUES(?,?,?,?,?,?)',[$uid,$client,$this->stamp($this->now),$duration,$this->stamp($this->now),$this->stamp($this->now+$duration)]);
            }
        } else {
            if(!$p) throw new FocusError('Start this solo session first.',409);
            if($op==='resume') {
                if($p['active'] && !$p['paused']) return $this->soloResponse($uid,$client);
                if($p['paused'] && !$p['paused_at']) throw new FocusError('This solo session has ended. Start a new one.',409);
                $other=$this->active($uid);if($other && (string)$other['id']!==(string)$p['id']) throw new FocusError('End your other focus session first.',409);
                $end=$p['solo_ends_at']?$this->time($p['solo_ends_at']):$this->time($p['starts_at'])+(int)$p['duration_seconds'];
                if($p['paused'] && $p['paused_at'] && $this->time($p['paused_at'])<$end) $end += $this->now-$this->time($p['paused_at']);
                elseif($end<=$this->now) throw new FocusError('This recorded solo session has finished. Start a new one.',409);
                $this->query('UPDATE focus_participation SET paused=false,active=true,last_confirmed=?,solo_ends_at=?,paused_at=null WHERE id=?',[$this->stamp($this->now),$this->stamp($end),$p['id']]);
            } elseif($p['active']) {
                if(!$p['paused']) $this->confirm($p,null);
                if($op==='pause' || $op==='end') {
                    $this->query('UPDATE focus_participation SET paused=true,active=false,paused_at=? WHERE id=?',[$op==='pause'?$this->stamp($this->now):null,$p['id']]);
                }
            }
            if($op==='end') $this->query('UPDATE focus_participation SET paused=true,active=false,paused_at=null WHERE id=?',[$p['id']]);
        }
        $this->finalize($uid);return $this->soloResponse($uid,$client);
    }
    private function soloResponse(string $uid,string $client): array {
        $p=$this->one('SELECT * FROM focus_participation WHERE account_id=? AND client_id=?',[$uid,$client]);
        $result=['totals'=>$this->totals($uid),'state'=>'ended'];
        if(!$p)return $result;
        $deadline=$p['solo_ends_at']?$this->time($p['solo_ends_at']):$this->time($p['starts_at'])+(int)$p['duration_seconds'];
        if($p['paused'] && $p['paused_at']) $result['state']='paused';
        elseif($p['active'] && !$p['paused'] && $deadline>$this->now) $result['state']='running';
        if($result['state']!=='ended')$result['deadline']=(new DateTimeImmutable($this->stamp($deadline)))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.v\Z');
        return $result;
    }
    private function blocks(array $p,?array $s): array {
        $start=$this->time($p['starts_at']);$focus=(int)$p['duration_seconds'];$rounds=$s?(int)$s['rounds']:1;$break=$s?(int)$s['break_minutes']*60:0;$result=[];
        for($r=0;$r<$rounds;$r++) $result[]=[$r,$start+$r*($focus+$break),(!$s && !empty($p['solo_ends_at']))?$this->time($p['solo_ends_at']):$start+$r*($focus+$break)+$focus];return $result;
    }
    private function forfeit(array $p,?array $s): void {
        foreach($this->blocks($p,$s) as [$round,$start,$end]) {
            if($this->now >= $start && $this->now < $end) $this->query('INSERT INTO focus_forfeits(participation_id,round) VALUES(?,?) ON CONFLICT DO NOTHING',[$p['id'],$round]);
        }
    }
    private function confirm(array $p,?array $s): void {
        $previous=$this->time($p['last_confirmed']);
        foreach($this->blocks($p,$s) as [$round,$start,$end]) {
            $slice=focusSlice($previous,$this->now,$start,$end);if(!$slice) continue;
            $rows=$this->query('SELECT starts_at,ends_at FROM focus_intervals WHERE account_id=? AND ends_at>? AND starts_at<?',[$p['account_id'],$this->stamp($slice[0]),$this->stamp($slice[1])])->fetchAll();
            $existing=array_map(fn($r)=>[$this->time($r['starts_at']),$this->time($r['ends_at'])],$rows);
            foreach(focusUncovered($slice[0],$slice[1],$existing) as [$a,$b]) $this->query('INSERT INTO focus_intervals(account_id,participation_id,starts_at,ends_at) VALUES(?,?,?,?)',[$p['account_id'],$p['id'],$this->stamp($a),$this->stamp($b)]);
        }
        $this->query('UPDATE focus_participation SET last_confirmed=? WHERE id=?',[$this->stamp($this->now),$p['id']]);
    }
    private function finalize(string $uid): void {
        // Every confirmation finalizes in the same transaction. Older inactive sources
        // cannot acquire new evidence; do not rescan a student's entire history on each poll.
        $rows=$this->query('SELECT * FROM focus_participation WHERE account_id=? AND (active OR last_confirmed>=?)',[$uid,$this->stamp($this->now-60)])->fetchAll();
        foreach($rows as $p) {
            $s=$p['schedule_id']?$this->one('SELECT * FROM focus_schedules WHERE id=?',[$p['schedule_id']]):null;
            $end=0;
            foreach($this->blocks($p,$s) as [$round,$start,$end]) {
                if($end>$this->now)continue;
                $intervals=$this->query('SELECT starts_at,ends_at FROM focus_intervals WHERE participation_id=? AND ends_at>? AND starts_at<?',[$p['id'],$this->stamp($start),$this->stamp($end)])->fetchAll();
                $coverage=array_map(fn($r)=>[$this->time($r['starts_at']),$this->time($r['ends_at'])],$intervals);
                $forfeit=$this->one('SELECT round FROM focus_forfeits WHERE participation_id=? AND round=?',[$p['id'],$round]);
                $eligible=$s ? (!$forfeit && focusCovers($start,$end,$coverage)) : focusSoloRep((int)$p['duration_seconds'],$coverage);
                if($eligible) $this->query('INSERT INTO focus_credits(participation_id,round,completed_at) VALUES(?,?,?) ON CONFLICT DO NOTHING',[$p['id'],$round,$this->stamp($end)]);
            }
            // Release immediately after final confirmation. Otherwise preserve the
            // bounded opportunity for a last timely heartbeat after the deadline.
            if($p['active'] && ($this->now>$end+30 || ($this->now>=$end && $this->time($p['last_confirmed'])>=$end))) $this->query('UPDATE focus_participation SET active=false WHERE id=?',[$p['id']]);
        }
    }
    private function totals(string $uid,?string $gid=null,?string $week=null): array {
        $args=[$uid];$where='p.account_id=?';
        if($gid!==null){$where.=' AND s.group_id=?';$args[]=$gid;}
        $timeWhere=$week?' AND i.ends_at>?':'';$timeArgs=$args;if($week)$timeArgs[]=$week;
        $expression=$week?'EXTRACT(EPOCH FROM (i.ends_at-GREATEST(i.starts_at,?::timestamptz)))':'EXTRACT(EPOCH FROM(i.ends_at-i.starts_at))';
        $sumArgs=$week?array_merge([$week],$timeArgs):$timeArgs;
        $seconds=$this->one('SELECT COALESCE(sum('.$expression.'),0) AS n FROM focus_intervals i JOIN focus_participation p ON p.id=i.participation_id LEFT JOIN focus_schedules s ON s.id=p.schedule_id WHERE '.$where.$timeWhere,$sumArgs)['n'];
        $creditWhere=$week?' AND c.completed_at>=?':'';$creditArgs=$args;if($week)$creditArgs[]=$week;
        $reps=$this->one('SELECT count(*) AS n FROM focus_credits c JOIN focus_participation p ON p.id=c.participation_id LEFT JOIN focus_schedules s ON s.id=p.schedule_id WHERE '.$where.$creditWhere,$creditArgs)['n'];
        return ['focusedMinutes'=>round((float)$seconds/60,2),'reps'=>(int)$reps];
    }
    private function view(string $uid,array $g): array {
        $gid=(string)$g['id'];$s=$this->one('SELECT * FROM focus_schedules WHERE group_id=? ORDER BY id DESC LIMIT 1',[$gid]);
        $template=$this->one('SELECT * FROM focus_templates WHERE group_id=?',[$gid]);
        $format=fn($x)=>['task'=>$x['task'],'focusMinutes'=>(int)$x['focus_minutes'],'breakMinutes'=>(int)$x['break_minutes'],'rounds'=>(int)$x['rounds']];
        $schedule=$s?array_merge(['id'=>(string)$s['id'],'startsAt'=>(new DateTimeImmutable($s['starts_at']))->format(DATE_ATOM)],$format($s)):null;
        $members=$this->query('SELECT a.id,a.name,m.share_progress,m.show_ranking FROM focus_memberships m JOIN focus_accounts a ON a.id=m.account_id WHERE m.group_id=?',[$gid])->fetchAll();
        $participants=[];$ranking=[];$me=[];$week=focusWeekStart($this->stamp($this->now),$g['timezone']);
        foreach($members as $m) {
            $id=(string)$m['id'];$p=$s?$this->one('SELECT * FROM focus_participation WHERE account_id=? AND schedule_id=?',[$id,$s['id']]):null;
            $phase=$s?focusPhase($this->time($s['starts_at']),(int)$s['focus_minutes']*60,(int)$s['break_minutes']*60,(int)$s['rounds'],$this->now)['state']:'Waiting';
            $state=$phase;
            if($p && $phase!=='Finished' && (!$p['active'] || $p['paused'] || $this->now-$this->time($p['last_confirmed'])>30))$state='Paused';
            if(!$p && $phase!=='Finished')$state='Waiting';
            $totals=$this->totals($id,$gid);$item=array_merge(['name'=>$m['name'],'state'=>$state],$totals);
            if($id===$uid || $m['share_progress'])$participants[]=$item;
            if($id===$uid)$me=array_merge(['state'=>$state,'participating'=>(bool)($p && $p['active'] && !$p['paused'])],$totals);
            if($g['leaderboard_enabled'] && $m['show_ranking'])$ranking[]=array_merge(['name'=>$m['name']],$this->totals($id,$gid,$week));
        }
        usort($ranking,fn($a,$b)=>$b['focusedMinutes']<=>$a['focusedMinutes']);
        return ['group'=>['id'=>$gid,'name'=>$g['name'],'ownerId'=>(string)$g['owner_id'],'timezone'=>$g['timezone'],'leaderboardEnabled'=>(bool)$g['leaderboard_enabled']],'membership'=>['shareProgress'=>(bool)$g['share_progress'],'showRanking'=>(bool)$g['show_ranking']],'schedule'=>$schedule,'template'=>$template?$format($template):null,'participants'=>$participants,'leaderboard'=>$ranking,'me'=>$me];
    }
}
