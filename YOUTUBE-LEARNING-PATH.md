# Follow YouTube tutorials while building REPS

Researched 2026-10-07 against creator video descriptions, the PHP creator repository and freeCodeCamp's own course announcement. This is a fit assessment from those sources, not a claim that the videos were watched end to end. Exact runtime is not needed for this route; use the verified chapter starts below.

## Start with this full project

[EGATOR: Build A Responsive Multipage Education/School Website using HTML CSS & JavaScript Complete Tutorial](https://www.youtube.com/watch?v=--XrIa-iey0).

This is my closest project match for REPS: a multi-page educational website with shared styling, navigation and a contact page. Its published chapters extend past three hours. It teaches the front end, with some JavaScript interactions. The creator uses FormSpree for submissions and SwiperJS for testimonials. REPS needs PHP processing separately. [Source and verified chapter details](YOUTUBE-STACK-RESEARCH.md).

## Today's watch-and-practice plan

Work in a separate folder such as `practice/day-2-video/` if you want to recreate the tutorial from scratch. Keep the existing REPS implementation as a reference you can inspect afterward. You do not have to replace it with the tutorial's design.

| Start here in EGATOR's video | Then practise this in REPS | Evidence to send back |
| --- | --- | --- |
| [17:38 — named CSS values](https://www.youtube.com/watch?v=--XrIa-iey0&t=1058s) | Find `:root` in css/style.css. Temporarily change one surface value, predict the changes, then restore it. | Explain the relationship between a definition and var(). |
| [21:00 — shared styles](https://www.youtube.com/watch?v=--XrIa-iey0&t=1260s) | Recreate a centred container with padding from memory in your practice folder. | Explain margin versus padding. |
| [27:10 — navigation](https://www.youtube.com/watch?v=--XrIa-iey0&t=1630s) | Build a six-link navigation list; make it wrap at 320px. Compare it with REPS's nav ul rule. | Explain which element owns the layout. |
| [41:45 — reusable card styling](https://www.youtube.com/watch?v=--XrIa-iey0&t=2505s) | Create two cards with one shared class. Change their spacing once. | Explain why both cards update. |
| [1:34:13 — tablet layout](https://www.youtube.com/watch?v=--XrIa-iey0&t=5653s) | Create one column by default and two when there is enough space. | Predict the breakpoint behaviour, then resize. |
| [1:57:40 — mobile layout](https://www.youtube.com/watch?v=--XrIa-iey0&t=7060s) | Check the six REPS pages at 320px and 375px. Inspect any overflow rather than hiding it. | State what you checked and what changed. |
| [2:46:20 — form appearance](https://www.youtube.com/watch?v=--XrIa-iey0&t=9980s) | Recreate a labelled input, textarea and checkbox with appropriate sizing. | Explain why a checkbox should not use the text field width. |

All chapter links above refer to the creator's published chapter list. Map them to D2-02 through D2-08 in [the practice path](DAY-2-PRACTICE.md). Use the earlier chapters if you need to see the project setup and HTML being typed.

## Days 3–4: learn JavaScript through small applications

[freeCodeCamp: JavaScript Programming — Full Course, taught by Per Borgen](https://www.youtube.com/watch?v=jS4aFq5-91M).

freeCodeCamp describes a roughly seven-hour course with small coding challenges and three projects: a passenger counter, a card game and a browser extension. Its syllabus explicitly includes variables, functions, conditionals, arrays, loops, objects, the DOM, events and localStorage. [Primary source: freeCodeCamp's course announcement and syllabus](https://www.freecodecamp.org/news/full-javascript-course-for-beginners/).

Use the course in project-sized portions:

- **Counter:** practise changing a displayed number on a click. Transfer that idea to a discussion participant count.
- **Card game:** practise arrays, loops, objects and conditions. Transfer those ideas to discussion records, rendering and capacity checks.
- **Extension:** practise inputs, event listeners, rendering and saved browser data. Transfer those ideas to participation and focus statistics. Browser-extension APIs are extra to REPS.

These transfers are my proposed exercises, not features the course promises to build. The course does not provide the complete REPS focus timer or its pause/resume/session rules; those need a separate focused implementation exercise on Day 4.

## Day 5: learn PHP form processing

[Traversy Media: PHP For Beginners | 3+ Hour Crash Course](https://www.youtube.com/watch?v=BUCiSSyIGGU).

The creator teaches fundamentals and then builds a PHP/MySQL feedback application. [Creator code](https://github.com/bradtraversy/php-crash) and [research notes](YOUTUBE-STACK-RESEARCH.md) provide the evidence and scope.

- [09:47 — local setup](https://www.youtube.com/watch?v=BUCiSSyIGGU&t=587s).
- [1:34:05 — GET and POST](https://www.youtube.com/watch?v=BUCiSSyIGGU&t=5645s).
- [1:40:56 — handling input](https://www.youtube.com/watch?v=BUCiSSyIGGU&t=6056s).
- [2:35:14 — application build](https://www.youtube.com/watch?v=BUCiSSyIGGU&t=9314s).

Practise with a small name/email form first, then adapt it to Join. Validate required values on the server. MySQL remains optional under the REPS README; FormSpree from the frontend video does not satisfy the assignment's PHP requirement.

## Alternative for today's CSS

[Traversy Media: Professional Website From Scratch | HTML & CSS For Beginners](https://www.youtube.com/watch?v=HXYZxVbWkjc) is another continuous beginner build using HTML, CSS and a little JavaScript. Its chapters include base styling at 19:20, variables at 29:25, cards/Grid at 56:00 and responsive adjustments from 2:00:45. It is a single landing-page project rather than EGATOR's multi-page build. [Creator explanation](https://www.traversymedia.com/blog/create-a-professional-website).

Choose EGATOR as the main project; use this alternative only if its teaching pace feels easier to follow. Watching both in full is not necessary for today's deliverables.

## How to get feedback as you follow along

1. Watch 10–15 minutes with your editor open. Pause and type the work yourself.
2. Close or hide the video. Recreate one small piece from memory.
3. Change something meaningful: spacing, a class, a breakpoint or the number of cards. Predict the effect first.
4. Apply the idea to REPS, check the browser and explain it in plain English.
5. Send the timestamp, what you changed and where you got stuck. I can inspect your files and give a hint or correction.

Your first session: watch the project preview and setup, then cover 17:38–29:56. Complete the variable, container and navigation exercises above before continuing. This is a suggested learning schedule, not the video's own instruction.
