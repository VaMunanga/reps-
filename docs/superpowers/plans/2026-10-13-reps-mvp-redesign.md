# REPS MVP Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a truthful, accessible, world-class REPS MVP with the approved cobalt atmospheric-console design, working focus and discussion tools, a gallery detail view, and Neon-backed membership interest submission.

**Architecture:** Preserve the multi-page site and progressively enhance it with focused vanilla ES modules. A single PHP JSON/form endpoint validates and upserts membership interest through PDO into Neon PostgreSQL; database schema changes are migration files tested on an ephemeral branch before production.

**Tech Stack:** Semantic HTML, CSS custom properties, vanilla JavaScript ES modules, GSAP 3 progressive enhancement, Vitest + jsdom, PHP 8.3+ with PDO PostgreSQL, Neon PostgreSQL, Railway-compatible deployment.

**Spec:** `docs/superpowers/specs/2026-10-13-reps-mvp-redesign.md` and `atmospheric-data-console-DESIGN.md`

## Global Constraints

- Keep the learning stack: semantic HTML, authored CSS, vanilla ES modules, and a small PHP 8.3+ endpoint using PDO PostgreSQL.
- Use REPS cobalt `#4F6BFF` as the main brand/action colour and `#304ACA` for stronger action states.
- Retain atmospheric mint `#76D2B6`, red `#FF3333`, mineral `#D5D2C6`, stone `#A09D94`, warm light `#F4F1E8`, ink `#111827`, and black `#000000` in their specified roles.
- Use Outfit for display headings and JetBrains Mono for labels, controls, metrics, and supporting copy, with local/system fallbacks.
- Every motion enhancement must respect `prefers-reduced-motion` and leave the site usable when JavaScript or GSAP is unavailable.
- Do not add fake members, events, testimonials, statistics, activity photographs, or impact claims.
- Never print, commit, hardcode, or return `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, Neon credentials, or database exception details.
- No frontend framework, CMS, authentication system, admin panel, analytics tracker, or image upload in this release.
- No paid plan or external deployment may be created without explicit user approval.

## Review Focus

- Corrupt or schema-old `localStorage` must reset safely without breaking Focus or Discussions; Tasks 4 and 5 test this.
- Rapid timer clicks and a backgrounded tab must not create duplicate intervals or inflated totals; Task 4 tests state transitions and elapsed-time reconciliation.
- Repeated, malformed, oversized, or forged membership POSTs must be rejected or safely upserted without SQL/error leakage; Task 7 tests these paths.
- 320px layouts, long names, and keyboard-only navigation must not hide or trap controls; Tasks 2, 5, 6, and 8 verify them.
- Failed GSAP/font/CDN/network requests and reduced-motion preference must leave readable, stable content; Tasks 3 and 8 verify the fallback.

---

### Task 1: Release test harness and contracts

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.js`
- Create: `tests/site-structure.test.js`
- Create: `tests/helpers/load-page.js`

**Interfaces:**
- Consumes: the seven production pages and shared assets already in the repository.
- Produces: `loadPage(relativePath): Promise<Document>`, `npm test`, and `npm run test:site` for later tasks.

- [ ] **Step 1: Write failing structural tests** for unique titles/descriptions, one `main`, skip-link target, current navigation state, valid local links, module-script loading, and no production "coming soon/Day N" copy.
- [ ] **Step 2: Run `npm test -- tests/site-structure.test.js`** and expect failures for missing scripts and placeholder copy.
- [ ] **Step 3: Add Vitest/jsdom as development dependencies and configure the shared loader and scripts** without changing Neon runtime dependencies.
- [ ] **Step 4: Run `npm test -- tests/site-structure.test.js`** and expect the harness to execute with only the deliberate page-contract failures remaining.
- [ ] **Step 5: Commit** with `git commit -m "test: add REPS release contract"`.

### Task 2: Shared cobalt atmospheric design system and responsive shell

**Files:**
- Modify: `css/style.css`
- Create: `js/site.js`
- Modify: `index.html` (renamed to `index.php` in this task)
- Modify: `about.html`
- Modify: `focus.html`
- Modify: `discussions.html`
- Modify: `gallery.html`
- Modify: `join.html`
- Modify: `practice.html`
- Test: `tests/site-structure.test.js`

**Interfaces:**
- Consumes: `loadPage()` from Task 1 and the exact design tokens in the spec.
- Produces: shared `.site-header`, `.site-nav`, `.panel`, `.button`, `.status-chip`, `.metric`, `.section-shell` classes and `initSiteShell(document): void`.

- [ ] **Step 1: Extend structural tests** to assert the root homepage is `index.php`, every page shares the required shell hooks, each page identifies its current navigation item, and all local links resolve after the rename.
- [ ] **Step 2: Run `npm test -- tests/site-structure.test.js`** and expect failures for the old shell and `index.html` references.
- [ ] **Step 3: Implement the tokenized design system and semantic shell** using the approved palette, type roles, spacing, radii, mobile navigation, visible focus states, and truthful copy.
- [ ] **Step 4: Run `npm test -- tests/site-structure.test.js`** and expect all shell/link assertions to pass.
- [ ] **Step 5: Commit** with `git commit -m "feat: build cobalt atmospheric site shell"`.

### Task 3: Editorial home/about composition and progressive motion

**Files:**
- Modify: `index.php`
- Modify: `about.html`
- Modify: `css/style.css`
- Create: `js/motion.js`
- Test: `tests/motion.test.js`

**Interfaces:**
- Consumes: shared shell hooks and design tokens from Task 2.
- Produces: `initMotion({ root, gsap, reduceMotion }): void`, `[data-reveal]`, and `[data-ambient]` enhancement hooks.

- [ ] **Step 1: Write failing tests** proving reduced motion reveals content immediately, missing GSAP is harmless, and standard mode registers only transform/opacity-based enhancements.
- [ ] **Step 2: Run `npm test -- tests/motion.test.js`** and expect failure because `initMotion` does not exist.
- [ ] **Step 3: Build the approved Direction B home/about layouts** with an asymmetric first viewport, honest operational status, REPS loop, clear CTAs, nested telemetry surfaces, and no invented outcomes.
- [ ] **Step 4: Implement `initMotion`** with masked/staggered reveals, restrained hover/ambient cues, optional GSAP ScrollTrigger, and a no-animation fallback.
- [ ] **Step 5: Run `npm test -- tests/motion.test.js tests/site-structure.test.js`** and expect all tests to pass.
- [ ] **Step 6: Commit** with `git commit -m "feat: add REPS editorial story and motion"`.

### Task 4: Reliable focus timer and persisted progress

**Files:**
- Modify: `focus.html`
- Modify: `css/style.css`
- Create: `js/focus/timer.js`
- Create: `js/focus/storage.js`
- Create: `js/focus/page.js`
- Test: `tests/focus/timer.test.js`
- Test: `tests/focus/storage.test.js`

**Interfaces:**
- Produces: `createTimer({ durationSeconds, now, onTick, onStateChange, onComplete })`, with `start()`, `pause()`, `resume()`, `stop()`, `getState()`; and `loadFocusData(storage): FocusData`, `saveFocusData(storage, data): void`.

- [ ] **Step 1: Write failing timer state tests** for start, pause, resume, stop, completion, rapid repeated clicks, and elapsed wall-time reconciliation after a delayed tick.
- [ ] **Step 2: Run `npm test -- tests/focus/timer.test.js`** and expect failure because the timer module does not exist.
- [ ] **Step 3: Implement the timer state machine** with one interval maximum and completion emitted exactly once.
- [ ] **Step 4: Write failing persistence tests** for defaults, valid saved data, malformed JSON, stale schema versions, daily rollover, and weekly rollover.
- [ ] **Step 5: Implement versioned focus storage and wire the accessible Focus page** including inputs, progress, live status, and correct button states.
- [ ] **Step 6: Run `npm test -- tests/focus`** and expect all Focus tests to pass.
- [ ] **Step 7: Commit** with `git commit -m "feat: ship persisted focus timer"`.

### Task 5: Proposed discussion browser and local participation

**Files:**
- Modify: `discussions.html`
- Modify: `css/style.css`
- Create: `js/discussions/data.js`
- Create: `js/discussions/model.js`
- Create: `js/discussions/page.js`
- Test: `tests/discussions/model.test.js`

**Interfaces:**
- Produces: `filterDiscussions(items, category): Discussion[]`, `joinDiscussion(state, id): JoinResult`, `loadDiscussionState(storage): DiscussionState`, and proposed-format records capped at 15 places.

- [ ] **Step 1: Write failing tests** for all/category filtering, one local join per format, 15-place capacity, unknown IDs, corrupt storage, and truthful proposed/not-confirmed labels.
- [ ] **Step 2: Run `npm test -- tests/discussions/model.test.js`** and expect failure because the modules do not exist.
- [ ] **Step 3: Implement immutable discussion data and participation state** with a versioned local-storage adapter.
- [ ] **Step 4: Render accessible filters, result counts, capacity states, and joining feedback** while avoiding dates or server-reservation claims.
- [ ] **Step 5: Run `npm test -- tests/discussions/model.test.js tests/site-structure.test.js`** and expect all tests to pass.
- [ ] **Step 6: Commit** with `git commit -m "feat: add proposed discussion explorer"`.

### Task 6: Accessible identity gallery

**Files:**
- Modify: `gallery.html`
- Modify: `css/style.css`
- Create: `js/gallery.js`
- Test: `tests/gallery.test.js`

**Interfaces:**
- Produces: `createLightbox({ dialog, trigger, closeButton }): { open, close, destroy }`.

- [ ] **Step 1: Write failing tests** for pointer open, focus placement, Escape close, explicit close, focus restoration, long alternative text, and repeated initialization.
- [ ] **Step 2: Run `npm test -- tests/gallery.test.js`** and expect failure because the lightbox module does not exist.
- [ ] **Step 3: Implement the native-dialog identity detail view and editorial gallery layout** using only the real REPS brand asset and honest future-activity descriptions.
- [ ] **Step 4: Run `npm test -- tests/gallery.test.js tests/site-structure.test.js`** and expect all tests to pass.
- [ ] **Step 5: Commit** with `git commit -m "feat: add accessible REPS identity gallery"`.

### Task 7: Neon schema and PHP membership endpoint

**Files:**
- Modify: `join.html`
- Modify: `css/style.css`
- Create: `js/join.js`
- Create: `database/migrations/001_create_membership_interests.sql`
- Create: `api/bootstrap.php`
- Create: `api/join.php`
- Create: `composer.json`
- Create: `tests/php/join-validation.php`
- Create: `tests/join.test.js`

**Interfaces:**
- Produces: `validateMembership(array $input): array{data: array, errors: array}`, `membershipPdo(string $databaseUrl): PDO`, JSON `{ ok: boolean, message: string, errors?: object }`, and `initJoinForm(form, fetchImpl): void`.

- [ ] **Step 1: Write failing PHP validation tests** for required/optional fields, year range, interest and working-time allowlists, consent, normalization, length limits, forged arrays, and output free of submitted HTML.
- [ ] **Step 2: Run `php tests/php/join-validation.php`** and expect failure because validation is not implemented; if PHP is still unavailable, record that blocker and continue with the JavaScript test cycle only.
- [ ] **Step 3: Implement PHP validation and safe `DATABASE_URL` parsing** with PDO exceptions logged server-side but generic responses returned to users.
- [ ] **Step 4: Write the idempotent SQL migration** for the exact `membership_interests` model and upsert on normalized email.
- [ ] **Step 5: Verify Neon CLI/auth, create a normal ephemeral branch from `production`, obtain its direct migration URL without printing it, run the migration, inspect the table, and run an insert/upsert transaction test**; expect schema and constraints to match the spec before applying the migration to `production`.
- [ ] **Step 6: Write failing JavaScript tests** for browser validation, disabled/submitting state, success, duplicate/update success, 422 errors, 500 errors, network failure, and ordinary form fallback.
- [ ] **Step 7: Implement `api/join.php`, the enhanced Join page, and `initJoinForm`** with prepared statements, `application/json` negotiation, and no credential/error leakage.
- [ ] **Step 8: Run `npm test -- tests/join.test.js`, `php tests/php/join-validation.php`, and `php -l api/join.php`** and expect all tests/checks to pass.
- [ ] **Step 9: Commit** with `git commit -m "feat: connect membership interest to Neon"`.

### Task 8: Release QA and public deployment

**Files:**
- Modify: `README.md`
- Modify: `.gitignore`
- Create: `docs/deployment.md`
- Test: all files under `tests/`

**Interfaces:**
- Consumes: all prior page, JavaScript, PHP, and database interfaces.
- Produces: a reproducible local runbook, verified release checklist, and public HTTPS URL after explicit hosting approval.

- [ ] **Step 1: Run `npm test`** and require zero failing tests.
- [ ] **Step 2: Run PHP validation/syntax checks over `api/*.php`** and require zero parse or validation-test failures.
- [ ] **Step 3: Serve locally with PHP and capture desktop 1440px and mobile 390px screenshots** for Home, Focus, Discussions, Gallery, and Join; fix overflow, hierarchy, contrast, long-content, and keyboard issues found.
- [ ] **Step 4: Verify reduced-motion mode and degraded operation with GSAP/fonts blocked**; require all content, navigation, timer, filters, gallery, and form fallback to remain usable.
- [ ] **Step 5: Write the deployment/runbook documentation** covering required environment variables, pooled runtime versus direct migration URL, local commands, rollback, and secret-handling rules without including values.
- [ ] **Step 6: After explicit approval of the hosting choice/cost, deploy to Railway (recommended), set `DATABASE_URL` only in host variables, and verify every route and asset over HTTPS**.
- [ ] **Step 7: Submit one clearly identifiable release-test membership record, confirm it in Neon, then remove only that known test row**; never display the connection string or other submissions.
- [ ] **Step 8: Run a final broken-link and browser-console pass against the public URL** and require HTTP success, no mixed content, no missing assets, and no uncaught errors.
- [ ] **Step 9: Commit** with `git commit -m "docs: add verified REPS release runbook"`.

