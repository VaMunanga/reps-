# REPS release and deployment runbook

## Runtime contract

The website needs a PHP 8.3+ web runtime with these extensions enabled:

- PDO
- PDO PostgreSQL (`pdo_pgsql`)

Use PHP 8.3 or later in production. Serve the repository root so `index.php`, the HTML routes, assets, and `api/join.php` retain their current relative paths.

The browser pages do not need Node.js. Node.js is used only for tests and the HTTPS-based Neon migration helper.

## Secrets and environment variables

Set `DATABASE_URL` only in the hosting provider's encrypted runtime variables. It is the pooled Neon connection used by `api/join.php`.

Use `DATABASE_URL_UNPOOLED` only in the local shell process that runs a migration. Do not save either value in a committed file, paste either value into logs, or expose either value to browser JavaScript.

The PHP endpoint returns generic failure messages. Database exception details remain server-side.

## Local release checks

Install dependencies and run the complete JavaScript suite:

```powershell
npm install
npm test
```

Run PHP validation and syntax checks. Change the executable path if PHP is installed elsewhere:

```powershell
& 'C:\xampp\php\php.exe' tests/php/join-validation.php
& 'C:\xampp\php\php.exe' -l api/bootstrap.php
& 'C:\xampp\php\php.exe' -l api/join.php
```

Serve the site locally:

```powershell
& 'C:\xampp\php\php.exe' -S 127.0.0.1:8765
```

Then open `http://127.0.0.1:8765/index.php`.

The local XAMPP build used during release validation has PDO but not `pdo_pgsql`. It can serve the site and execute validation tests, but a real membership submission needs a PHP runtime with `pdo_pgsql` enabled.

## Neon migration

The Neon CLI must already be authenticated and linked to project `broad-waterfall-08392938`. Test schema changes on a temporary branch before production.

Create a temporary branch from `production`:

```powershell
neon branches create --project-id broad-waterfall-08392938 --parent production --name reps-release-check --no-secrets
```

Retrieve the temporary branch URL directly into the current process and run the idempotent migration. The URL is not printed or written to disk:

```powershell
$env:DATABASE_URL_UNPOOLED = (neon connection-string reps-release-check --project-id broad-waterfall-08392938 --no-color).Trim()
node scripts/run-membership-migration.mjs database/migrations/001_create_membership_interests.sql
Remove-Item Env:DATABASE_URL_UNPOOLED
```

The helper creates the schema, checks the exact columns, verifies the email upsert, removes its known verification row, and reports `PASS`. Only after this passes, repeat with `production`:

```powershell
$env:DATABASE_URL_UNPOOLED = (neon connection-string production --project-id broad-waterfall-08392938 --no-color).Trim()
node scripts/run-membership-migration.mjs database/migrations/001_create_membership_interests.sql
Remove-Item Env:DATABASE_URL_UNPOOLED
```

Delete an expired or no-longer-needed temporary branch through the Neon console or CLI only after confirming its exact branch name and that it is not `production`.

## Render Free hosting setup

The approved launch target is a Render Free web service. PHP is not a Render native runtime, so the repository includes a `Dockerfile` that provides PHP 8.3, Apache, and `pdo_pgsql`. `render.yaml` declares the free Docker service and prompts for `DATABASE_URL` without storing its value in Git.

Render Free is suitable for this student-club launch, with two important constraints:

- the service spins down after 15 minutes without inbound traffic and can take about one minute to wake;
- each workspace receives 750 free instance-hours per calendar month.

See Render's current [Free service limitations](https://render.com/docs/free) before launch.

### Connect GitHub and deploy

1. Merge the reviewed release branch into the repository's default `main` branch.
2. Sign in at [dashboard.render.com](https://dashboard.render.com/).
3. Open **Account Settings**. Under **Git Deployment Credentials**, choose **Add credential**, select GitHub, and authorize Render.
4. In the Render Dashboard, choose **New > Blueprint**.
5. Select `VaMunanga/reps-`. If it is not listed, configure the Render GitHub app to grant access to that repository, then refresh Render.
6. Keep the Blueprint path as `render.yaml` and continue. The Blueprint creates the `reps-student-club` Docker web service on the Free plan.
7. When Render prompts for `DATABASE_URL`, paste the pooled Neon `DATABASE_URL` value. Do not use `DATABASE_URL_UNPOOLED` and do not paste either value into build logs or source files.
8. Apply the Blueprint and wait for the Docker build and health check to pass.
9. Open the generated `onrender.com` URL and complete the live verification below.

The deployed service must provide:

- public HTTPS;
- PHP 8.3+;
- `pdo_pgsql`;
- an encrypted `DATABASE_URL` runtime variable;
- a writable server log for generic endpoint exceptions;
- a document root that preserves the repository's relative paths.

Keep the service on the **Free** compute plan. Do not upgrade it or add paid resources without the project owner's explicit approval.

### Live verification

1. Set `DATABASE_URL` to the pooled Neon production URL in host variables.
2. Deploy the exact reviewed commit.
3. Check every route and local asset over HTTPS.
4. Confirm the browser console has no uncaught errors or mixed-content requests.
5. Submit one uniquely named release-test membership record.
6. Confirm that exact record in Neon, then delete only that record.
7. Recheck the Join success and error states from the public URL.

## Focus timer, accounts and private groups

The Focus upgrade remains in the working tree until released. The existing public Render URL does not automatically reflect uncommitted changes.

Apply `database/migrations/002_focus_groups.sql` to an isolated Neon branch before applying it to production. It adds account, hashed-session, group, invitation, schedule/template, participation, interval, credit, and explicit-forfeit tables. It does not change `membership_interests`. The migration can be repeated, including its additive solo pause/deadline columns.

With the intended direct connection held only in the process environment, run:

```powershell
node scripts/run-focus-migration.mjs
```

The helper reads `DATABASE_URL_UNPOOLED`. The application uses `FOCUS_DATABASE_URL` when supplied, otherwise the existing `DATABASE_URL`. Keep pooled application and direct migration URLs separate. Do not put either in browser code or logs.

Runtime requirements are PHP 8.3+, PDO PostgreSQL, HTTPS, and Argon2id password hashing support. The existing Docker runtime provides PostgreSQL support. Account sessions live in PostgreSQL and survive host restarts; production cookies are Secure, HttpOnly, and SameSite=Strict. No account is created from an existing membership enquiry.

Password recovery is optional until these encrypted runtime variables are configured:

- `RESEND_API_KEY`: email delivery credential.
- `FOCUS_MAIL_FROM`: an approved sender address/domain for that provider.
- `FOCUS_PUBLIC_URL`: the canonical HTTPS site origin, such as `https://reps-student-club.onrender.com`.

Recovery also needs PHP curl. Without those prerequisites, the interface reports that recovery email is unavailable. Test real delivery and the single-use reset flow before advertising account recovery.

Solo Focus keeps its existing device-local totals and settings. New sessions use transactional IndexedDB with a legacy-data migration; the old localStorage value stays intact. Historical daily rep counts were never stored and cannot be reconstructed. Signed-in recorded participation uses server-confirmed intervals separately; device totals are not imported into group rankings. A missing connection/heartbeat can reduce recorded server time while the device timer continues. Anonymous cross-device overlap cannot be detected.

The official [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference) is contacted only when Music opens. The configured video is in `js/focus/music.js`; availability and embedding restrictions can change. Verify real playback on the deployed origin, including failure handling and collapsing the panel. No Data API key is required.

Completion notifications use `focus-sw.js` where supported, with explicit permission and audio-unlock controls. There is no offline cache or service-worker timer. This free deployment has no scheduled Web Push sender: closed-page alerts are not implemented. Adding them requires a reliable scheduler, VAPID keys, subscription persistence, delivery/retry support, and cancellation/rescheduling after timer changes. Do not describe locked-device or suspended-page delivery as guaranteed.

For local PHP installations with an older libpq that reports Neon's missing endpoint/SNI error, set `PGOPTIONS` to `endpoint=<test-endpoint-id>` in the test-server process. This was necessary for local verification; it does not require weakening TLS or changing production settings. The production image should use current libpq.

Before release, follow `docs/focus-verification.md`. Browser layout, actual YouTube playback, OS notifications, and physical-device behavior must be verified independently of jsdom tests.

## Rollback

Application rollback: redeploy the last known-good commit while leaving the additive membership table in place. The migration is idempotent, and older static pages do not depend on the table.

Database rollback: prefer Neon's point-in-time restore or branch restore if production data was affected. Do not drop `membership_interests` merely to roll back website code; it may contain genuine submissions. A destructive schema rollback requires a backup, an exact impact review, and explicit approval.

If the membership endpoint is unhealthy, temporarily remove the public Join link or deploy the last known-good release rather than exposing database details or disabling security controls.
