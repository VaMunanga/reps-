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

## Rollback

Application rollback: redeploy the last known-good commit while leaving the additive membership table in place. The migration is idempotent, and older static pages do not depend on the table.

Database rollback: prefer Neon's point-in-time restore or branch restore if production data was affected. Do not drop `membership_interests` merely to roll back website code; it may contain genuine submissions. A destructive schema rollback requires a backup, an exact impact review, and explicit approval.

If the membership endpoint is unhealthy, temporarily remove the public Join link or deploy the last known-good release rather than exposing database details or disabling security controls.
