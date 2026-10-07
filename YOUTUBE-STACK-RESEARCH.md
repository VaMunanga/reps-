# REPS: YouTube project and PHP research

Researched 2026-10-07. Evidence comes from indexed creator YouTube descriptions and the creator's repository; I did not watch these videos end to end. Direct YouTube opening returned limited content, so chapter verification uses the indexed descriptions. Exact total runtimes were not independently confirmed.

## Recommended main project: EGATOR

[Build A Responsive Multipage Education/School Website using HTML CSS & JavaScript Complete Tutorial](https://www.youtube.com/watch?v=--XrIa-iey0), published 2022-01-24.

The creator describes a beginner project covering Home, About, Courses and Contact pages. Its chapters cover shared CSS, navigation, sections, responsive layouts and JavaScript interactions. The last listed chapter starts at 03:05:50, establishing a video longer than three hours.

Useful verified chapter starts:

- 00:08:26 — folders/files.
- 00:15:03 — browser style reset.
- 00:17:38 — CSS variables.
- 00:21:00 — shared styles/classes.
- 00:27:10 — navigation styling.
- 00:35:25 — header styling.
- 00:41:45 — categories styling.
- 01:34:13 — tablet media queries.
- 01:57:40 — mobile media queries.
- 02:17:32 — team markup.
- 02:23:15 — team styling.
- 02:40:45 — contact markup.
- 02:46:20 — contact styling.
- 03:00:28 — FormSpree submission.

Fit assessment (inference): this is a close match for REPS's multipage club front end and Day 2 work. Adapt categories into discussion cards, team into leadership, and contact into Join. It uses SwiperJS for testimonials and FormSpree for submission; these are optional tutorial choices rather than REPS requirements. It does not supply REPS's focus timer, attendance capacity or PHP submission.

## Recommended PHP supplement: Traversy Media

[PHP For Beginners | 3+ Hour Crash Course](https://www.youtube.com/watch?v=BUCiSSyIGGU), published 2022-03-30. The creator describes PHP fundamentals followed by a small PHP/MySQL feedback app.

Verified chapter starts relevant to REPS:

- 09:47 — XAMPP setup.
- 14:30 — opening a PHP file.
- 26:35 — variables/types.
- 34:32 — arrays.
- 42:05 — conditionals.
- 52:57 — loops.
- 1:02:00 — functions.
- 1:34:05 — GET/POST.
- 1:40:56 — input sanitizing.
- 2:35:14 — feedback project.
- 3:01:05 — inserting form data.

[Creator source repository](https://github.com/bradtraversy/php-crash) contains individual PHP examples and starter files. It confirms source examples for POST handling, input sanitizing, sessions, files and OOP.

Fit assessment (inference): use the POST and form sections when implementing REPS Join processing. The feedback project's database is extra scope; REPS's README does not require MySQL. Sanitizing alone is not a full production security review: implement server-side validation appropriate to REPS's fields and safely escape rendered output.

## Suggested practice rhythm

Watch one small section, pause, apply the idea to REPS without copying the full solution, and explain what each changed rule does. On Day 2, start with EGATOR's shared styles and CSS variables; then navigation, cards and media queries. Later pair its basic JavaScript interactions with a dedicated JavaScript course for arrays, events, timers and localStorage. Use Traversy's PHP course for the backend day.

I found a useful two-video route; I did not verify one continuous video covering every REPS requirement in this exact stack.
