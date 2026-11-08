# Focus upgrade verification

## Follow-up: completion sound and unavailable music (2026-11-08)

Playwright MCP reproduced the configured `jfKfPfyJRdk` embed showing “This live stream recording is not available.” A newer stream linked by the publisher (`X4VbdwhkE10`) also returned error 150. Replaced the source with Lofi Girl's recorded mix `7ccH8u8fj8Y`; the updated page reached playing state after explicitly pressing Play and paused when Music collapsed. No browser console errors were recorded in that check; two third-party warnings remained. Playback on the deployed origin and physical devices remains unverified.

The completion chime now schedules six pairs over 5.55 seconds using the audio clock. Playwright confirmed 12 scheduled tones spanning 5.55 seconds through Test alert using the real browser AudioContext. Turning sound off or starting the next phase stops the loop. Regression tests cover duration, cancellation, and disabled playback controls after an embed failure. The full Vitest suite passed 133 tests across 17 files.

## Automated evidence

The full Vitest/jsdom suite passed 131 tests across 17 files after the review fixes. These are automated model, storage, and DOM checks, not evidence of real browser layout or physical-device delivery.

Covered: start/pause/resume/end, focus and break completion, zero retained at completion, outcomes/durations, persisted deadlines and paused milliseconds, late wake, retained legacy totals, transactional duplicate-tab completion, independent sound claims, quiet refresh restore, broadcast lifecycle updates, signed-in deadline alignment, alert unsupported/denied/worker failures, optional music lazy loading/collapse/network fallback, account/group interface requests, consent, timezone formatting, reusable schedules, reconnect behavior, group phase announcements, and final-boundary heartbeat requests.

PHP accounting and membership validation passed. All three new PHP files passed syntax checks. Local PHP is 8.2.12 with PostgreSQL loaded explicitly; deployed runtime remains the existing PHP 8.3 Docker image.

The additive migration passed on the expiring `reps-focus-verify-20261108` Neon branch, which expires 2026-11-09 at 18:00 UTC. Production was not migrated. Real HTTP checks with independent cookie sessions passed account creation, CSRF rejection, nonmember/anonymous access rejection, invite revocation/joining, owner-only scheduling, consent defaults, shared schedule retrieval, active-source exclusion, leaving, and logout. The extended PostgreSQL/HTTP run also passed final-boundary solo credit, duplicate suppression, reconnect-gap exclusion, global overlap exclusion, paused deadline extension, terminal end behavior, and partial-minute/zero-rep group late-join accounting. Its inserted histories are controlled fixtures, not a simulated real study session.

`npm audit --omit=dev` reported zero production dependency vulnerabilities. The existing development dependency warning was not automatically upgraded as part of this feature.

Two independent review passes found and prompted fixes for final group boundary confirmation, cross-tab recorder synchronization, startup/server deadline drift, quiet restore alert replay, and sound claims being won by locked tabs. All have regression coverage. Inactive historical participation is excluded from repeated reconciliation scans; stored aggregate credits remain intact. The extended HTTP/database run passed with that bounded reconciliation.

## Browser automation status

The requested Playwright MCP tools are not exposed in this session's available tool catalog. Browser-provider calls returned `The browser access host is unavailable`. Native Chrome could be launched, but was not used to claim verification after the request to use Playwright MCP.

Consequently desktop/mobile rendering, actual animations, console/network cleanliness, real YouTube playback, real browser permission prompts, and two real authenticated browser sessions are **not verified**. Notification mocks and desktop viewport emulation would not establish delivery on physical phones.

## Reproducible manual browser test

Start the existing PHP development server from the repository root:

```powershell
php -S 127.0.0.1:8765
```

Open `http://127.0.0.1:8765/focus.html`. The local timer works without a database. For account/group checks, use the configured isolated PHP server on port 8767 while it is running; its database is the expiring verification branch. Do not test new account/group routes on production until the migration and code are deployed.

1. At desktop 1440 × 900 and mobile widths 320, 390, and 768 pixels, check text, ring, buttons, inputs, and opened panels for clipping or horizontal scroll. The YouTube frame must remain at least 200 × 200 while visible.
2. Name an outcome. In Session options choose 1 focus minute and 1 break minute. Start and observe one short compression; counting begins immediately. Pause, wait, refresh, and confirm the same remaining time. Resume, refresh while running, and confirm elapsed wall time is retained. End a partial rep and confirm no credit.
3. Complete a full minute. Confirm zero, one contained ripple/checkmark, a persistent completion message, one rep, and Start break. Refresh: completion remains but the celebration/alerts do not replay. Start the break explicitly; it adds no rep. Confirm one final pulse and Next rep without automatic focus start.
4. Enable gentle sound by clicking its checkbox and use Test alert. Test notifications first with permission allowed, then reset the browser permission and deny it. Confirm no permission request occurs before Enable notifications, blocked/denied channels explain their status, and the timer keeps working. Repeat sound off. Real completion should update the title and available alert channels once.
5. Duplicate the tab. Pause in one and resume in the other. Complete a rep and confirm one device credit and one notification/chime across tabs. Only an audio-unlocked tab can chime. Navigate away/back, background the tab, and return after sleep; verify deadline reconciliation and accurate completion credit. Suspended-device alert delivery remains platform dependent.
6. With reduced motion enabled in OS/browser settings, check static state transitions/checkmark. With movement disabled in Session options, check the same. During a break, digits must stay steady while only the halo breathes; hide the page and confirm decoration stops.
7. Open Music without clicking Play: no playback. Click Play explicitly, then collapse Music and confirm playback pauses. Block YouTube requests in DevTools and reload; failure copy and Open on YouTube must remain useful, and the timer must still complete. Inspect iframe controls and branding. Actual video availability can change.
8. On the isolated server, use two independent profiles/incognito sessions and two test accounts. Create a private group; rotate its invitation and confirm the old link cannot join. Schedule at least two minutes ahead. Join both before start, then repeat with a late join. Verify the shared countdown, local timezone display, personal pause, and consent visibility. Reload/reconnect; no missing interval may be backfilled. Only full confirmed scheduled blocks earn group reps.
9. Enable the group's leaderboard as owner and opt in separately as each member. Check minutes and reps are separate, ranking is by minutes, paused/break/overlap time is excluded, and opting out/leaving removes visibility. Confirm an unrelated account cannot read a guessed group ID. Personal solo task text must never appear in group responses.
10. Use Tab/Shift+Tab/Enter/Space throughout. Open DevTools Console and Network with Preserve log; inspect errors and failed requests during each scenario. Expected blocked YouTube/notification test failures must be handled in the interface. Record browser/OS/version and any unexpected failure.

## Remaining release checks

No live deployment, production schema migration, real email delivery, physical phone notification delivery, or guaranteed closed-page alert delivery is claimed. Once Playwright MCP becomes available, run the browser steps above through that connection, capture desktop/mobile screenshots and console/network results, and retain real-device checks separately.
