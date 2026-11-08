<?php
declare(strict_types=1);

function focusSlice(float $previous, float $now, float $start, float $end): ?array {
    if ($now <= $previous || $now - $previous > 30) return null;
    $a = max($previous, $start); $b = min($now, $end);
    return $b > $a ? [$a, $b] : null;
}
function focusUncovered(float $start, float $end, array $existing): array {
    usort($existing, fn($a,$b) => $a[0] <=> $b[0]);
    $cursor = $start; $result = [];
    foreach ($existing as [$a,$b]) {
        if ($a > $cursor) $result[] = [(float)$cursor, (float)min($a,$end)];
        $cursor = max($cursor, $b);
        if ($cursor >= $end) break;
    }
    if ($cursor < $end) $result[] = [(float)$cursor, (float)$end];
    return array_values(array_filter($result, fn($x) => $x[1] > $x[0]));
}
function focusCovers(float $start, float $end, array $intervals): bool {
    return focusUncovered($start,$end,$intervals) === [];
}
function focusSoloRep(int $duration, array $intervals): bool {
    usort($intervals,fn($a,$b)=>$a[0]<=>$b[0]);$cursor=-INF;$seconds=0.0;
    foreach($intervals as [$a,$b]) { $seconds+=max(0,$b-max($a,$cursor));$cursor=max($cursor,$b); }
    return $seconds >= $duration-0.000001;
}
function focusPhase(float $start, int $focus, int $break, int $rounds, float $now): array {
    if ($now < $start) return ['state'=>'Waiting','round'=>0];
    $elapsed = $now-$start; $round = (int)floor($elapsed/($focus+$break));
    if ($round >= $rounds || ($round === $rounds-1 && $elapsed-$round*($focus+$break) >= $focus)) return ['state'=>'Finished','round'=>$rounds-1];
    return ['state'=>($elapsed-$round*($focus+$break)<$focus?'Focusing':'On break'),'round'=>$round];
}
function focusWeekStart(string $now, string $timezone): string {
    $date = new DateTimeImmutable($now); $local = $date->setTimezone(new DateTimeZone($timezone));
    return $local->modify('monday this week')->setTime(0,0)->setTimezone(new DateTimeZone('UTC'))->format(DATE_ATOM);
}
function focusUtcTimestamp(string $raw): ?float {
    if(!preg_match('/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|\+00:00)$/D',$raw)) return null;
    try { $date=new DateTimeImmutable($raw);$errors=DateTimeImmutable::getLastErrors(); }
    catch(Throwable) {return null;}
    if($errors && ($errors['warning_count'] || $errors['error_count']))return null;
    return (float)$date->format('U.u');
}
