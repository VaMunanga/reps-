<?php
declare(strict_types=1);

require_once __DIR__ . '/../../api/bootstrap.php';

$failures = [];
function expectSame(mixed $expected, mixed $actual, string $label): void {
    global $failures;
    if ($expected !== $actual) $failures[] = $label . ': expected ' . var_export($expected, true) . ', got ' . var_export($actual, true);
}
function expectTrue(bool $actual, string $label): void {
    global $failures;
    if (!$actual) $failures[] = $label;
}

$valid = [
    'full_name' => '  <b>Vara Munanga</b> ', 'email' => ' STUDENT@HIT.AC.ZW ', 'telephone' => '+263 77 123 4567',
    'programme' => 'Computer Science', 'year' => '3', 'interests' => ['study', 'coding'],
    'goal' => 'Build a consistent study routine.', 'working_time' => 'Evening', 'message' => '<script>alert(1)</script>Ready to learn.', 'consent' => '1',
];
$result = validateMembership($valid);
expectSame([], $result['errors'], 'valid submission has no errors');
expectSame('vara munanga', strtolower($result['data']['full_name']), 'name is trimmed and stripped');
expectSame('student@hit.ac.zw', $result['data']['email'], 'email is normalized');
expectTrue(!str_contains($result['data']['message'], '<script>'), 'stored message strips HTML');

$nestedInterests = validateMembership(array_replace($valid, ['interests' => ['study', ['coding']]]));
expectTrue(isset($nestedInterests['errors']['interests']), 'nested interest arrays are rejected without warnings');

$invalid = validateMembership([
    'full_name' => '', 'email' => 'not-an-email', 'programme' => '', 'year' => '9',
    'interests' => 'coding', 'goal' => str_repeat('x', 1001), 'working_time' => 'Midnight', 'consent' => '0',
]);
foreach (['full_name', 'email', 'programme', 'year', 'interests', 'goal', 'working_time', 'consent'] as $field) {
    expectTrue(isset($invalid['errors'][$field]), 'invalid ' . $field . ' is rejected');
}

$parts = parseDatabaseUrl('postgresql://user:p%40ss@host.example:5432/reps?sslmode=require');
expectSame('pgsql:host=host.example;port=5432;dbname=reps;sslmode=require', $parts['dsn'], 'database DSN is derived safely');
expectSame('p@ss', $parts['password'], 'URL encoded password is decoded');
expectTrue(!str_contains($parts['dsn'], 'p@ss'), 'DSN does not contain the password');

$html = renderHtmlResponse(['message' => 'Check the highlighted fields.', 'errors' => ['email' => 'Enter a valid <email>.']]);
expectTrue(str_contains($html, 'Email:</strong> Enter a valid &lt;email&gt;.'), 'HTML fallback renders escaped field errors');
expectTrue(!str_contains($html, '<email>'), 'HTML fallback does not render error markup');

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}
echo "PHP membership validation: PASS" . PHP_EOL;
