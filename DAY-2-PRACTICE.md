# Day 2: CSS practice through REPS

Reference: README.md, section 23, Day 2 — CSS and responsive interface.

Work one task at a time. For every task: predict what will happen, write the change, save and refresh, inspect the result, then explain it in your own words. Try the challenge before opening documentation. Ask for a hint when stuck.

## Starting feedback

- `index.html` links correctly to `css/style.css`.
- `css/style.css` contains the rule that makes h1 text blue.
- The other five main pages still need the shared stylesheet link.
- `lessons/styles.css` is a separate practice file; it is not the stylesheet linked by Home. Put website styling in `css/style.css`.
- A semicolon after the last declaration is optional, but use one consistently as you add properties.

## Practice path

| Task | Deliverable | Main skill |
| --- | --- | --- |
| D2-01 | All six pages use one stylesheet | External CSS and paths |
| D2-02 | Comfortable page width and spacing | Box model and containers |
| D2-03 | Consistent colours and text | Variables and typography |
| D2-04 | Navigation that wraps on small screens | Flexbox and selectors |
| D2-05 | Home hero, reusable cards and action links | Classes and components |
| D2-06 | Readable forms, timer and progress | Control styling |
| D2-07 | Flexible gallery and section layout | Images, Grid and media queries |
| D2-08 | Keyboard and mobile quality checks | Positioning, states and verification |

These are local practice tasks, not issues created on an external tracker. Completing the document does not complete the tasks.

## D2-01 — Connect every page (5–10 minutes)

**Build:** Add `<link rel="stylesheet" href="css/style.css">` inside the head of About, Focus, Discussions, Gallery and Join. Home already has it.

**Practice:** Before refreshing, predict which headings will change. Change the heading colour once in the CSS file and inspect two different pages. Restore the colour afterward.

**Check:** All six main pages load the rule. No repeated inline heading styles or six separate stylesheets.

**Explain:** Why can one edit change several pages? What is `href` relative to?

[Read: external CSS](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Getting_started#external_stylesheets).

## D2-02 — Give the content breathing room (15–20 minutes)

Start with [lesson 2](lessons/0002-day-2-spacing.html). This task includes a worked example, then a transfer challenge.

**Build:** Remove the browser's default body margin. Give main content a maximum width of 960px, automatic horizontal margins and 16px internal padding. Set `box-sizing: border-box` for elements so declared widths include padding and border.

**Practice:** Temporarily draw a border around main. Compare 16px and 32px padding. Restore 16px. Then give each main section 16px padding and 24px space below it without copying the main rule.

**Check:** Content is centred on a wide screen and has comfortable side space on a narrow screen. At 320px viewport width it does not require sideways scrolling. Restore or remove temporary debug borders.

**Explain:** Which space belongs inside a border? Which belongs outside? Why use `max-width` rather than `width: 960px`?

[Read: box model](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model).

## D2-03 — Establish the shared design (15–20 minutes)

**Build:** Use the palette in `images/brand/README.md`. Define named values in `:root`, for example `--ink`, `--surface`, `--border` and `--brand`. Use those values in body text, backgrounds and borders. Choose a system sans-serif font and a comfortable line-height such as 1.5. Replace the temporary blue h1 rule with your chosen heading colour.

**Hint:** A variable is a named setting. `--ink: #0F172A;` defines it inside `:root`; `color: var(--ink);` uses it in a rule.

**Practice:** Change one variable and predict which elements will change. Restore it. Keep normal text links recognisable, including an underline.

**Check:** All pages share fonts and colours. Text remains readable; check foreground/background combinations before using brand blue for small text or button backgrounds.

**Explain:** How does a variable help when changing the design later?

[Read: CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties).

## D2-04 — Build wrapping navigation (20 minutes)

**Build:** Target `nav ul`, rather than every `ul`. Remove navigation bullets and default list spacing. Use `display: flex`, `gap` and `flex-wrap: wrap`. Give navigation links comfortable padding and a visible current-page style using their existing `aria-current="page"` attribute.

**Hint:** Flexbox arranges the container's direct children. Here the direct children of the ul are the li elements. `gap` spaces them; wrapping lets items move onto another line.

**Practice:** Predict what happens without wrapping, then temporarily remove it and narrow the browser. Restore it. Confirm that the About page's objectives list still has bullets.

**Check:** All six links work and remain visible at 320px. The current page is identifiable. You can reach the links with Tab.

**Explain:** Why put flex on `nav ul` rather than each link? Why avoid a broad `ul` rule?

[Read: Flexbox](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox).

## D2-05 — Create reusable visual pieces (20–25 minutes)

**Build:** Add `class="hero"` to Home's first section. Style it with generous spacing and a stronger heading. Create a `.card` class for section surfaces and a `.button` class for the two Home action links. An HTML class is a reusable label; the CSS selector starts with a dot. An element can have more than one class.

**Hint:** For example, `<section class="card">` is targeted by `.card`. Give button-like links `display: inline-block` so their padding behaves like a box.

**Practice:** Apply the same card class to a section on About. Change the card border or padding once and check both pages. Let the action links wrap comfortably; remove the separating `|` if it no longer fits the design.

**Check:** Cards share spacing, border and corners. Home's actions are readable. Headings can wrap naturally without fixed heights or clipped text. Links still navigate as links.

**Explain:** Why use a shared class instead of styling each section separately?

[Read: class selectors and CSS basics](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Getting_started).

## D2-06 — Style forms and focus progress (20–25 minutes)

**Build:** Put labels above text fields. Style text/email/tel/number inputs, select and textarea with consistent width, padding and borders. Keep checkboxes compact with their labels. Give fieldsets comfortable spacing. Make progress elements fit the available width and make the timer number easy to read.

**Hint:** A blanket `input { width: 100%; }` also affects checkboxes. Use targeted selectors such as `input:not([type="checkbox"])` for full-width fields.

**Practice:** Compare the Join form and the Focus settings. Reuse rules where their appearance should match. Enter a long goal and resize the textarea.

**Check:** Labels remain connected to their controls. Fields stay inside their sections at 320px. Disabled prototype controls look unavailable and remain disabled until their scheduled functional work.

**Explain:** Why should checkboxes have a different width rule? What does changing the appearance of the timer leave to implement on Day 4?

[Read: box sizing and boxes](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model).

## D2-07 — Practise Grid and responsive sizing (20–25 minutes)

**Build:** Make images shrink to their available space with `max-width: 100%` and `height: auto`. Remove unwanted figure margins if they crowd the gallery. Add a `.section-grid` wrapper around two existing Home cards, keeping the hero outside it. Use one column by default, a gap between cards, and two columns inside `@media (min-width: 48rem)`.

**Hint:** The two section elements must be direct children of the grid wrapper. On wider screens use `grid-template-columns: repeat(2, minmax(0, 1fr));`. That divides the available space into two equal flexible columns.

**Practice:** Predict the layout just below and above the breakpoint. Resize across it. Explain why `height: auto` is useful for the existing gallery brand image. Do not invent event photographs.

**Check:** Cards stack on narrow screens and sit side by side when enough space is available. The gallery image does not stretch or cause sideways scrolling.

**Explain:** What is the grid container? Which are its items? What does the media query condition control?

[Read: Grid](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids) · [Read: responsive design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design).

## D2-08 — Finish with quality checks (20 minutes)

**Build:** Add hover feedback and visible `:focus-visible` outlines to interactive elements. Keep the existing skip link working. For positioning practice, use a class on that link to place it above the viewport with `position: absolute` and a negative top offset, then bring it back into view on `:focus`. A visible skip link is also acceptable; never hide it with `display: none`.

**Practice:** Navigate using only Tab, Shift+Tab and Enter. Resize each page to 320px, 375px, 768px and 1280px. In browser developer tools, inspect one element's box model. Try 200% browser zoom.

**Check:** Record the results below. Investigate overflow by finding the element causing it; avoid hiding the symptom with `overflow-x: hidden` on the body.

**Explain:** What does hover miss for keyboard users? What takes an absolutely positioned element out of the normal layout?

[Read: positioning](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Positioning) · [Read: focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible).

## Day 2 acceptance checklist

- [ ] All six pages use the same stylesheet and design language.
- [ ] Home hero, navigation, buttons, cards and footer are styled consistently.
- [ ] Forms, gallery and progress elements are readable and fit their containers.
- [ ] Links and enabled controls are usable with a keyboard; focus is visible.
- [ ] All six pages checked at 320px, 375px, 768px and 1280px without major overflow.
- [ ] Readable at 200% zoom; colours checked for contrast.
- [ ] Developer can explain selectors, spacing, Flexbox, Grid and the media query used.
- [ ] Changes reviewed against the README Day 2 criteria.

## Send work for feedback

After each task reply, for example:

> D2-02 done. I checked Home at 320px and desktop width. Padding is ____. Margin is ____. The thing I'm unsure about is ____.

I will inspect your files, identify what works, explain any correction and give the next exercise. Mark tasks complete only after checking the result. Ask for a hint, an explanation or a review at any time.

At the end of today, write the README's short daily review: planned, actual, variance, corrective action, risks and lessons learned. Git is not initialised in this workspace; record that separately when preparing the README's version-control milestone.
