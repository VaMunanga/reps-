<?php
declare(strict_types=1);

function cleanText(mixed $value, int $maximum): string {
    if (!is_string($value)) return '';
    $clean = trim(strip_tags($value));
    return strlen($clean) <= $maximum ? $clean : substr($clean, 0, $maximum + 1);
}

function validateMembership(array $input): array {
    $errors = [];
    $fullName = cleanText($input['full_name'] ?? '', 120);
    $email = strtolower(trim(is_string($input['email'] ?? null) ? $input['email'] : ''));
    $telephone = cleanText($input['telephone'] ?? '', 32);
    $programme = cleanText($input['programme'] ?? '', 120);
    $year = filter_var($input['year'] ?? null, FILTER_VALIDATE_INT);
    $goal = cleanText($input['goal'] ?? '', 1000);
    $workingTime = cleanText($input['working_time'] ?? '', 16);
    $message = cleanText($input['message'] ?? '', 2000);
    $consent = in_array($input['consent'] ?? null, [true, 1, '1', 'on'], true);
    $allowedInterests = ['study', 'coding', 'projects', 'challenges'];
    $interestsInput = $input['interests'] ?? [];
    $interests = is_array($interestsInput) ? array_values(array_unique(array_filter($interestsInput, fn ($value) => is_string($value) && in_array($value, $allowedInterests, true)))) : [];

    if ($fullName === '' || strlen($fullName) > 120) $errors['full_name'] = 'Enter your full name using 120 characters or fewer.';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) $errors['email'] = 'Enter a valid email address.';
    if ($telephone !== '' && (strlen($telephone) > 32 || !preg_match('/^[0-9+()\-\s]+$/', $telephone))) $errors['telephone'] = 'Enter a valid telephone number.';
    if ($programme === '' || strlen($programme) > 120) $errors['programme'] = 'Enter your programme or department.';
    if ($year === false || $year < 1 || $year > 5) $errors['year'] = 'Select an academic year from 1 to 5.';
    if (!is_array($interestsInput)) $errors['interests'] = 'Select interests using the available options.';
    elseif (count($interests) !== count(array_unique($interestsInput))) $errors['interests'] = 'Select interests using the available options.';
    if ($goal === '' || strlen($goal) > 1000) $errors['goal'] = 'Enter your main goal using 1000 characters or fewer.';
    if ($workingTime !== '' && !in_array($workingTime, ['Morning', 'Afternoon', 'Evening'], true)) $errors['working_time'] = 'Select an available working time.';
    if (strlen($message) > 2000) $errors['message'] = 'Keep your message within 2000 characters.';
    if (!$consent) $errors['consent'] = 'Consent is required before we can store your interest.';

    return ['data' => [
        'full_name' => $fullName, 'email' => $email, 'telephone' => $telephone ?: null,
        'programme' => $programme, 'academic_year' => $year === false ? null : $year,
        'interests' => $interests, 'goal' => $goal, 'working_time' => $workingTime ?: null,
        'message' => $message ?: null, 'consent' => $consent,
    ], 'errors' => $errors];
}

function parseDatabaseUrl(string $databaseUrl): array {
    $parts = parse_url($databaseUrl);
    if ($parts === false || !in_array($parts['scheme'] ?? '', ['postgres', 'postgresql'], true) || empty($parts['host']) || empty($parts['path'])) {
        throw new InvalidArgumentException('Invalid database configuration.');
    }
    parse_str($parts['query'] ?? '', $query);
    $allowedSslModes = ['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'];
    $sslMode = in_array($query['sslmode'] ?? '', $allowedSslModes, true) ? $query['sslmode'] : 'require';
    $port = isset($parts['port']) ? (int) $parts['port'] : 5432;
    $database = rawurldecode(ltrim($parts['path'], '/'));
    $dsn = sprintf('pgsql:host=%s;port=%d;dbname=%s;sslmode=%s', $parts['host'], $port, $database, $sslMode);
    return ['dsn' => $dsn, 'user' => rawurldecode($parts['user'] ?? ''), 'password' => rawurldecode($parts['pass'] ?? '')];
}

function membershipPdo(string $databaseUrl): PDO {
    $connection = parseDatabaseUrl($databaseUrl);
    return new PDO($connection['dsn'], $connection['user'], $connection['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function wantsJson(): bool {
    return str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
}

function respond(int $status, array $payload): never {
    http_response_code($status);
    if (wantsJson()) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    } else {
        header('Content-Type: text/html; charset=utf-8');
        $message = htmlspecialchars((string) ($payload['message'] ?? 'Request complete.'), ENT_QUOTES, 'UTF-8');
        echo '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPS membership interest</title><link rel="stylesheet" href="../css/style.css"><main class="section-shell"><section class="panel"><h1>REPS membership interest</h1><p>' . $message . '</p><p><a class="button" href="../join.html">Return to the form</a></p></section></main></html>';
    }
    exit;
}
