# REPS Focus upgrade

Status: approved by the owner on 2026-11-08; implemented locally. See `docs/focus-verification.md` for evidence and outstanding browser/device checks.

## Intent and agreed scope

Help a student choose one concrete outcome, finish one focused rep, notice completion, rest, and optionally study with friends. Preserve the existing page shell, brand, custom durations, preferences, goals, and recorded progress. Implement and verify timer/alerts first, music second, private groups third.

The owner confirmed PHP/Neon email-and-password accounts for groups, anonymous solo focus, existing free hosting, and group rep credit only for participation throughout a full scheduled focus block. Late joiners earn recorded eligible minutes and can earn reps from their next full round. Breaks, abandoned blocks, pauses, and overlaps do not earn full-block rep credit.

## Current implementation and diagnosed failures

The project uses HTML, authored CSS, JavaScript ES modules, PHP 8.3 with PDO PostgreSQL, and Neon. Node is tooling only. The only server feature stores membership enquiries; it provides no authentication. Membership enquiries must remain separate from accounts.

The timer calculates against an in-memory deadline, but saves neither that deadline nor paused remaining time. Completion only updates page text and immediately replaces zero with the next duration. Audio, system notifications, tab-title alerts, service workers, and Web Push are absent. Permission alone cannot fix these failures. Separate tabs can overwrite progress with stale data.

The `reps.focus.v1` record contains settings, lifetime totals, daily minutes, and weekly minutes. It contains no session history or daily rep count. Retain existing totals through explicit migration; never invent historical daily reps. Existing running sessions cannot be recovered after navigation because the old version never saved them.

Baseline tests could not start: Vitest is not installed in this checkout. No passing verification is claimed.

## Stage 1: timer and alerts

Keep one task input visible above an original dot-matrix countdown, a thin SVG progress ring, one Start/Pause/Resume button, and a secondary End action. Keep ordinary copy in existing readable fonts. Use cobalt as the clock accent and a softer compatible ring during breaks. Add a compact today summary; keep custom durations, category, daily/weekly goals, alert preferences, and extra options accessible without crowding the clock. Offer 25/5 and 50/10, with 90/20 in additional options. These are adjustable defaults. Require a concrete outcome for focus; the settling-in reminder is optional.

Use explicit focus-running, focus-paused, focus-complete, break-running, break-paused, and break-complete states. Completion retains zero and persistent completion copy until an explicit next action. Offer Start break after focus, then Next rep after rest; never auto-start work. Snapshot session task and durations so editing preferences cannot change credit retrospectively.

Persist a stable session ID, phase, state, duration, deadline or paused remaining milliseconds, and completion/alert bookkeeping. Reconcile on load, return to visibility, and page lifecycle events using elapsed wall time. Use transactional browser storage for session ownership and idempotent credit, with tab synchronization; do not rely on competing localStorage read/write increments. Migrate old totals as a retained baseline and new completions as uniquely identified ledger entries. Attribute delayed completions to their actual completion date. If durable storage is unavailable, explain the recovery limitation and keep the current tab usable. Never replace valid legacy data on a failed migration.

Completion produces persistent in-app copy, a tab-title change, a short gentle chime when enabled and unlocked, and a system notification when supported and permitted. Request permission only from Enable notifications. Initialise audio from an explicit interaction. Provide Test alert and sound controls, clear denied/unsupported/blocked states, and failure isolation. Use service-worker notifications where required. Deduplicate completion, credit, and alerts across tabs. Restored completion stays visible but does not replay its celebration.

Retain free hosting. Implement page-open alert channels; document that closed-page scheduled alerts are unavailable without a reliable scheduler, VAPID configuration, subscription persistence, and a push sender. A service worker is not a clock. No guaranteed delivery claims for backgrounded, locked, or suspended devices.

## Clock motion only

Use lightweight CSS transforms, opacity, and SVG; no new animation framework. Start immediately while the clock compresses to 97% and settles over roughly 450 ms, ring fades in, and “Let’s put in a rep” briefly appears. Keep focus steady except digit transitions of 150–250 ms and ring progress. Pause softens the ring and freezes decoration while digits retain contrast.

Focus completion briefly illuminates the ring, emits one contained ripple, and draws a small checkmark within 800 ms, then leaves “Rep complete. Take a breather.” and Start break. Break shows “Take a breather”; its outer halo may breathe 1–2% over six seconds with a movement-off control. Break completion stops breathing and pulses once with “Ready for another rep?”

State transitions trigger motion; animations never govern deadlines, alerts, or buttons. Rapid actions cancel stale visual effects. Pause decoration when hidden. Reduced motion produces immediate transitions and static completion indicators. Announce phase changes only; remove per-second live announcements. Support keyboard controls and small screens.

## Stage 2: optional music

Music starts closed and unloaded. Opening loads the official YouTube IFrame Player API with one configured embeddable lo-fi source; verify that source during implementation. Require Play explicitly. Preserve visible player controls, branding, and at least a 200 × 200 viewport. Collapse pauses playback. Handle unavailable/restricted video, failed API loads, network errors, and blocked playback with useful copy and Open on YouTube. Timer operation is independent. No search, Data API key, ad-free promise, or background-playback promise.

## Stage 3: private groups

Add PHP/Neon accounts with password hashing, secure cookie sessions, CSRF protection, input validation, generic authentication failures, and abuse controls. No automatic account conversion from membership enquiries. Recovery requires configured email delivery; never pretend an email was sent when unconfigured. Keep account/task data outside public responses and logs.

Recovery uses expiring, single-use reset tokens stored as hashes. Show clearly when recovery is unavailable because email delivery has not been configured.

Persist groups, authenticated memberships, hashed revocable invite tokens, one scheduled session or reusable template, consent preferences, participation intervals, and unique credits. Group owners manage shared tasks and schedules; members cannot edit another student's participation. Authorize every read and write server-side. Revoking an invite blocks later joins; leaving removes ongoing access. Keep personal tasks private unless explicitly shared.

Store server-authoritative UTC start times, focus/break durations, rounds, and server time in responses. Display local times with timezone context. Poll lightweight authenticated endpoints; derive the current phase and remaining time from the shared timestamps. A personal pause or departure never changes the group schedule. Show only consenting members' compact Focusing/On break/Finished states.

Credit only the student's recorded eligible focus intervals, excluding breaks, pre-join time, paused/disconnected unconfirmed time, overlaps, and duplicates. Use server timestamps and transactional unique credits. A full uninterrupted scheduled block earns one rep; a late join earns only eligible minutes. Heartbeat/reconnect behavior must avoid awarding disconnected time without evidence. These are recorded participation, not proof of learning.

Builder defaults: heartbeat every 15 seconds with a maximum confirmed gap of 30 seconds; credit only intervals bounded by confirmations within that gap, clamped to focus boundaries. A recent pre-start confirmation followed by timely confirmations can establish coverage from scheduled start. A missing confirmation, pause, or late arrival forfeits that round's rep but preserves confirmed minutes. Never backfill a long reconnect gap. The full block must be covered before rep credit is finalized.

Use one transactional per-account ledger for authenticated solo and group credits. Group credit updates personal progress once, regardless of how many group views show it. Concurrent participation cannot credit the same time twice. Anonymous solo progress remains device-local; cross-device overlap for anonymous use cannot be reliably enforced and cannot enter group rankings. Preserve legacy totals without importing them into group credits.

Provide an optional group-only weekly leaderboard with focused minutes and reps separately, ranked by minutes. Proposed builder defaults: a group-selected weekly timezone, initially the creator's local timezone; ranking opt-in and progress-sharing opt-in; no historical solo-total import into rankings. Students can hide ranking and leave. No public rankings, chat, or feed.

Leaderboard weeks start Monday in the group's saved IANA timezone. Freeze that timezone after participation is recorded so weekly totals cannot shift retrospectively.

## Verification and release

Use existing Vitest/jsdom seams for timer, storage, and page behavior. Add real PHP/PostgreSQL integration checks for authentication, group authorization, timestamps, interval accounting, deduplication, and overlap handling on an isolated Neon branch. Do not alter production data to verify.

Verify lifecycle, duration validation, migration, refresh, paused restore, delayed wake, duplicate tabs, completion date rollover, focus/break credits, persistent alerts, all notification permission/support states, sound on/off and blocked audio, music failures/collapse/blocked play, and isolated feature failures. Use real browser checks for mobile, keyboard, reduced motion, hidden decoration, and two independent authenticated group sessions including late joining, reconnection, invite revocation, leaving, and timezone display. Report any device-dependent alert scenarios that cannot be reproduced.

Do not advance to music until timer/alerts checks pass, or to groups until music checks pass. Keep additive migrations and document deployment configuration, email delivery requirements, and the absence of closed-page push scheduling. Report automated, browser, database, and untested scenarios separately. No mocked behavior may be reported as deployed or verified.
