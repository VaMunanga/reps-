<?php
declare(strict_types=1);
$file = __DIR__ . '/../../api/focus/model.php';
if (!is_file($file)) { fwrite(STDERR, "FAIL: confirmed participation accounting is unavailable\n"); exit(1); }
require $file;
function eq(mixed $got, mixed $want, string $name): void { if ($got !== $want) throw new RuntimeException($name . ': ' . json_encode($got)); }
eq(focusSlice(90, 115, 100, 160), [100.0,115.0], 'prestart confirmation clamps to scheduled start');
eq(focusSlice(100, 131, 100, 160), null, 'disconnect gap cannot earn time');
eq(focusSlice(155, 170, 100, 160), [155.0,160.0], 'confirmation clamps to focus end');
eq(focusSlice(160, 175, 100, 160), null, 'break does not earn time');
eq(focusUncovered(100,160,[[90,120],[130,145]]), [[120.0,130.0],[145.0,160.0]], 'account ledger subtracts overlaps');
eq(focusCovers(100,160,[[100,130],[130,160]]), true, 'continuous confirmed block earns rep');
eq(focusCovers(100,160,[[100,125],[126,160]]), false, 'one second missing forfeits rep');
if (!function_exists('focusSoloRep')) throw new RuntimeException('FAIL: solo confirmed active-duration accounting unavailable');
eq(focusSoloRep(60,[[100,130],[160,190]]), true, 'solo pause does not forfeit fully confirmed active duration');
eq(focusSoloRep(60,[[100,129],[160,190]]), false, 'solo networking gap cannot count toward requested duration');
eq(focusSoloRep(60,[[100,130],[100,130]]), false, 'duplicate confirmed interval cannot double solo credit');
eq(focusPhase(100,60,15,2,160)['state'], 'On break', 'shared schedule enters break');
eq(focusPhase(100,60,15,2,235)['state'], 'Finished', 'last round has no trailing break');
eq(focusWeekStart('2026-11-08T23:00:00Z','Africa/Johannesburg'), '2026-11-08T22:00:00+00:00', 'Monday uses group timezone');
if (!function_exists('focusUtcTimestamp')) throw new RuntimeException('FAIL: invalid UTC date validation unavailable');
eq(focusUtcTimestamp('1970-01-01T00:01:40Z'),100.0,'UTC timestamp parses');
eq(focusUtcTimestamp('2026-02-31T12:00:00Z'),null,'invalid calendar day cannot silently normalize');
eq(focusUtcTimestamp('2026-11-08T12:00:00+02:00'),null,'schedule requires explicit UTC');
echo "PASS: focus accounting boundaries, overlap, coverage, phase and weekly timezone\n";
