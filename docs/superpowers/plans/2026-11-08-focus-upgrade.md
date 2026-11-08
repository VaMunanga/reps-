# Focus upgrade implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver the approved calm Focus experience in three verified stages.
**Architecture:** Browser session ledger and deadline-driven state machine; isolated alert and music adapters; PHP authenticated endpoints backed by additive Neon tables for private groups and account credits.
**Tech stack:** Existing vanilla HTML/CSS/JS, PHP 8.3, PDO PostgreSQL, Vitest/jsdom.
**Spec:** `docs/superpowers/specs/2026-11-08-focus-upgrade-design.md` (approved).

## Global constraints

Preserve existing settings/goals/totals. No new frontend framework. Clock-only animation. No paid hosting additions or closed-page push claims. Complete timer/alerts before music, music before groups. No production database changes during verification.

## Review focus

- Storage denied or migration failure must not erase legacy totals.
- Two tabs finishing the same session must credit and alert once.
- Hidden/suspended pages must recover from deadlines without replaying celebrations.
- Concurrent group/solo participation must not double-credit time.
- Revoked invites, former members, and guessed group IDs must not expose private data.

### Task 1: durable timer and progress

Files: `js/focus/session.js`, `js/focus/ledger.js`, `js/focus/storage.js`, `tests/focus/session.test.js`.
Interfaces: `transition(session, action, now)`, `remaining(session, now)`, `createLedger(window)` exposing transactional `read()` and `update(mutator)`.
- [x] Write failing lifecycle/restore/migration/idempotency tests; run targeted Vitest and observe failure.
- [x] Implement persisted millisecond deadlines, paused time, immutable session snapshots, unique completion records and v1 baseline migration through transactional IndexedDB.
- [x] Verify targeted tests pass, including delayed completion date and duplicate completion.

### Task 2: clock and completion alerts

Files: `focus.html`, `css/focus.css`, `js/focus/page.js`, `js/focus/clock.js`, `js/focus/alerts.js`, `focus-sw.js`, `tests/focus/page.test.js`, `tests/focus/alerts.test.js`.
Consumes session and ledger APIs. Produces `initFocusPage()` and `createAlerts(window)` with `unlock`, `enable`, `notify`, and `test`.
- [x] Add failing user-interface lifecycle and alert failure-isolation tests.
- [x] Implement controls, presets/preferences, clock SVG digits/ring, transition-only motion, accessible phase announcements, persistent completion and title, opt-in sound and notifications.
- [ ] Verify Focus suite and real browser layout/lifecycle/storage synchronization before advancing.

### Task 3: optional music

Files: `js/focus/music.js`, `tests/focus/music.test.js`, music markup/styles.
Produces `initMusic(root, window)` with lazy API loading, explicit play, collapse pause and fallback link.
- [x] Add failing lazy-load/collapse/failure tests.
- [x] Verify official API and source embed metadata; implement visible responsive player and isolated failures. Actual playback remains unverified.
- [x] Run music and full Focus tests before advancing.

### Task 4: accounts and private-group backend

Files: `database/migrations/002_focus_groups.sql`, `api/focus/bootstrap.php`, `api/focus/index.php`, `api/focus/model.php`, `tests/php/focus-model.php`, `scripts/verify-focus-api.mjs`.
API: same-origin JSON `api/focus/index.php?action=...`; GET for session/group reads, POST + session CSRF token for changes. All membership/group/participation checks server-side.
- [x] Add failing PHP behavior checks for schedule phases, bounded heartbeats, eligibility, interval union, and validators.
- [x] Implement additive schema, secure accounts/sessions, rate limits, reset tokens/mail configuration, revocable invites, group scheduling/templates, consent, participation and transactional credit.
- [x] Verify PHP syntax/model checks and core API integration against an isolated PostgreSQL branch. Extended accounting checks also passed: final boundary, duplicate credit, pause extension, reconnect gaps, overlap exclusion, and late-join partial minutes.

### Task 5: group interface and authenticated solo integration

Files: `js/focus/groups.js`, `tests/focus/groups.test.js`, group markup/styles, `js/focus/page.js`.
Consumes authenticated API. Polls group timestamps and sends 15-second heartbeats only for active personal participation. Authenticated solo credits use the same server interval ledger.
- [x] Write failing API-driven UI tests for auth, group selection, consent, joining, leaving and stale responses.
- [x] Implement compact account/group flows, local times, saved schedule reuse, opt-in leaderboard and personal participation; never fabricate members.
- [ ] Verify two real authenticated browser contexts including late joining and reconnect where database access permits.

### Task 6: review and release evidence

Files: `docs/deployment.md`, `docs/focus-verification.md`.
- [ ] Run full JavaScript and PHP checks, mobile/keyboard/reduced-motion browser checks, and a fresh Standards/Spec code review.
- [x] Fix material findings with regression tests.
- [x] Record exact verification results and limitations, migration/email setup, page-open alert support, and missing closed-page push infrastructure.

## Execution notes

Owner approved the design and implementation in the current project. Execute in place; preserve unrelated files. Test seams match the approved design. No shared interface conflicts identified: ledger owns browser atomicity, server owns account/group interval credits, UI consumes both without importing legacy totals into rankings.

Standards review identified missing final group heartbeat and cross-tab recorder synchronization; both fixed with regression coverage. Spec review additionally identified startup/server deadline drift, quiet-restore alerts, and sound claims won by locked tabs; all fixed with regression coverage. No deferred minor findings were reported. Browser verification boxes remain unchecked because the browser host failed and Playwright MCP tools were not exposed after the owner's request to use that integration. No live deployment or production migration was performed.
