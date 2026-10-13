<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') respond(405, ['ok' => false, 'message' => 'Use the membership interest form to submit details.']);

$validated = validateMembership($_POST);
if ($validated['errors']) respond(422, ['ok' => false, 'message' => 'Check the highlighted fields.', 'errors' => $validated['errors']]);

$databaseUrl = getenv('DATABASE_URL');
if (!$databaseUrl) respond(503, ['ok' => false, 'message' => 'Membership submissions are temporarily unavailable. Please try again later.']);

try {
    $pdo = membershipPdo($databaseUrl);
    $data = $validated['data'];
    $interests = '{' . implode(',', $data['interests']) . '}';
    $statement = $pdo->prepare(<<<'SQL'
        INSERT INTO membership_interests
            (full_name, email, telephone, programme, academic_year, interests, goal, working_time, message, consent)
        VALUES
            (:full_name, :email, :telephone, :programme, :academic_year, CAST(:interests AS TEXT[]), :goal, :working_time, :message, :consent)
        ON CONFLICT (email) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            telephone = EXCLUDED.telephone,
            programme = EXCLUDED.programme,
            academic_year = EXCLUDED.academic_year,
            interests = EXCLUDED.interests,
            goal = EXCLUDED.goal,
            working_time = EXCLUDED.working_time,
            message = EXCLUDED.message,
            consent = EXCLUDED.consent,
            submitted_at = NOW()
        RETURNING id
    SQL);
    $statement->execute([
        'full_name' => $data['full_name'], 'email' => $data['email'], 'telephone' => $data['telephone'],
        'programme' => $data['programme'], 'academic_year' => $data['academic_year'], 'interests' => $interests,
        'goal' => $data['goal'], 'working_time' => $data['working_time'], 'message' => $data['message'], 'consent' => $data['consent'],
    ]);
    respond(200, ['ok' => true, 'message' => 'Interest saved. You can update these details by submitting the same email again.']);
} catch (Throwable $error) {
    error_log('REPS membership submission failed: ' . $error->getCode());
    respond(500, ['ok' => false, 'message' => 'We could not save your interest. Please try again.']);
}
