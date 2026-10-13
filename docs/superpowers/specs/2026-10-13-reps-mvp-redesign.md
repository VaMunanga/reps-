# REPS MVP Redesign Specification

## Intent

Ship a polished, public first release of the REPS student club website that helps Harare Institute of Technology students understand the club, run a focus session, discover small-group discussions, see the emerging culture, and submit membership interest.

The release must feel purposeful and credible without pretending the proposed club already has members, events, results, or activity photographs that do not exist.

## Audience and promise

- Primary audience: HIT students interested in study, coding, projects, and challenges.
- Core promise: "Small Reps. Big Progress."
- Experience sequence: Focus -> Study -> Discuss -> Build -> Reflect.
- Tone: focused, optimistic, student-led, direct, and operational rather than corporate.

## Approved visual direction

Use Direction B, the cobalt editorial console, adapted from `atmospheric-data-console-DESIGN.md`.

- Preserve the source design's console hierarchy, modular density, nested surfaces, strong first viewport, generous section rhythm, rounded panel language, technical labels, and restrained ambient motion.
- Use REPS cobalt `#4F6BFF` as the main brand/action colour and `#304ACA` for stronger action states.
- Retain atmospheric mint `#76D2B6` for positive telemetry and progress, red `#FF3333` only for live/warning/error signals, mineral `#D5D2C6` for the page field, and stone `#A09D94` for strong nested surfaces.
- Use warm light `#F4F1E8` for readable content panels, ink `#111827` for primary text, and black `#000000` for high-contrast console areas.
- Use Outfit for display headings and JetBrains Mono for labels, controls, metrics, and supporting copy, with local/system fallbacks if the font request fails.
- Use the declared 8px spacing base, 16px gap, 24px card padding, 80px desktop section spacing, 40px major card radius, 8px controls, and pill badges.
- Motion may include masked reveals, staggered entrances, hover lift, scroll-triggered transitions, and a subtle ambient background layer. It must never block content, cause layout shifts, or ignore `prefers-reduced-motion`.
- Do not replace the design with a generic SaaS card grid. Do not use fake dashboards, invented member counts, fake testimonials, fake event dates, or unsupported impact claims.

## Functional scope

### Shared site shell

- Responsive header, keyboard-accessible navigation, skip link, current-page state, and consistent footer across the Home, About, Focus, Discussions, Gallery, Join, and Practice pages.
- Meaningful page titles/descriptions, semantic landmarks, visible focus states, adequate contrast, and usable layouts from 320px upward.
- Navigation remains useful without JavaScript; enhancements must fail safely.

### Home and About

- Explain what REPS is, who it is for, how its focus-to-reflection loop works, and provide clear paths to Focus, Discussions, and Join.
- Show the operational/editorial design language without fake live data. Any status language must describe the website or proposed programme truthfully.

### Focus

- Allow a student to enter a task, category, focus duration, break duration, daily goal, and weekly goal.
- Start, pause, resume, and stop a countdown correctly.
- On completion, record one completed focus rep and the configured focus minutes.
- Persist settings, completed reps, focused minutes, and daily/weekly totals in `localStorage`.
- Recover safely from missing, stale, or malformed local data.
- Provide screen-reader status updates and correct enabled/disabled control states.

### Discussions

- Render a small, explicitly labelled set of proposed discussion formats from JavaScript data.
- Filter by Study, Coding, Projects, and Challenges.
- Allow local expression of interest in a proposed discussion, capped at 15 places, without implying a server-side reservation.
- Persist local participation state in `localStorage` and prevent duplicate local joins.
- Explain clearly that dates and confirmed sessions will be announced rather than inventing them.

### Gallery

- Present the existing REPS identity board and honest placeholders/descriptions for future club activities.
- Provide an accessible lightbox/detail view for the real identity asset, operable with pointer, keyboard, Escape, and an explicit close control.

### Membership interest

- Keep the existing fields: full name, email, telephone, programme/department, academic year, interests, main goal, preferred working time, and message.
- Add a required consent checkbox and store its boolean value.
- Validate in the browser for fast feedback and independently in PHP for trust boundaries.
- Submit without a full-page reload when JavaScript is available, while retaining a normal form POST fallback.
- Return clear success, validation, duplicate-email, server, and network states without exposing database details.
- Store submissions in Neon PostgreSQL with a server-generated timestamp. Normalize email to lowercase and update an existing record when the same email submits again.

## Data model

Table `membership_interests`:

- `id BIGSERIAL PRIMARY KEY`
- `full_name VARCHAR(120) NOT NULL`
- `email VARCHAR(254) NOT NULL UNIQUE`
- `telephone VARCHAR(32)`
- `programme VARCHAR(120) NOT NULL`
- `academic_year SMALLINT NOT NULL CHECK (academic_year BETWEEN 1 AND 5)`
- `interests TEXT[] NOT NULL DEFAULT '{}'`
- `goal VARCHAR(1000) NOT NULL`
- `working_time VARCHAR(16)` restricted to Morning, Afternoon, Evening, or null
- `message VARCHAR(2000)`
- `consent BOOLEAN NOT NULL CHECK (consent = TRUE)`
- `submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

The runtime uses Neon's pooled `DATABASE_URL`. Schema migration uses the direct `DATABASE_URL_UNPOOLED`. Neither value may be printed, committed, embedded in client code, or exposed in responses.

## Architecture and constraints

- Keep the learning stack: semantic HTML, authored CSS, vanilla ES modules, and a small PHP 8.3+ endpoint using PDO PostgreSQL.
- GSAP may progressively enhance motion; all content and actions must remain usable if it does not load.
- No frontend framework, CMS, authentication system, admin panel, analytics tracker, or image upload in this release.
- Use a normal ephemeral Neon child branch of `production` to test the migration before applying it to `production`.
- Deploy to a PHP-compatible host. Railway is the recommended same-day target, but no paid plan or external deployment is created without the user's explicit approval.
- Do not modify the teaching records, lessons, or reference material unless a broken production link requires it.

## Definition of done

- All planned automated tests pass locally.
- PHP syntax checks pass when PHP is available.
- The migration is verified on an ephemeral Neon branch before production.
- Desktop and mobile screenshots show no overflow, illegible copy, broken hierarchy, or obscured controls.
- Keyboard navigation, reduced motion, timer recovery, discussion persistence, and membership error states are verified.
- The public URL serves all pages/assets over HTTPS and a real membership test submission reaches Neon without leaking credentials.

