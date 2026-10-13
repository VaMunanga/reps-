# Day 1 — HTML concepts and REPS cheat sheet

Use this guide when building or revising a page. It covers every HTML element
used in the Day 1 REPS files, with examples you can copy and adapt.

## Quick navigation

- [What we learned](#what-we-learned)
- [How to read HTML](#how-to-read-html)
- [All tags used on Day 1](#all-tags-used-on-day-1)
- [Attributes cheat sheet](#attributes-cheat-sheet)
- [Reusable page template](#reusable-page-template)
- [Navigation and paths](#navigation-and-paths)
- [Forms and inputs](#forms-and-inputs)
- [Images and captions](#images-and-captions)
- [Timer and progress display](#timer-and-progress-display)
- [Accessibility habits](#accessibility-habits)
- [Common mistakes](#common-mistakes)
- [Revision checklist](#revision-checklist)

## What we learned

HTML stands for **HyperText Markup Language**. It describes the structure and
meaning of page content. A browser reads that markup and displays the page.

| Technology | Job | REPS example |
| --- | --- | --- |
| HTML | Structure and content | Navigation, headings, membership fields |
| CSS | Appearance and layout | Brand colours, spacing, responsive cards — Day 2 |
| JavaScript | Browser behaviour | Timer, filters, localStorage — later days |
| PHP | Server-side processing | Receiving and validating membership submissions — Day 5 |

Day 1 established the page structure. A visible timer, button or form does
not mean its application logic is implemented. The prototype's timer buttons,
discussion filter and submission button are disabled until that work is ready.

The six main pages are:

| Page | Filename | Purpose |
| --- | --- | --- |
| Home | `index.html` | Introduce REPS and provide calls to action |
| About | `about.html` | Story, mission, vision, objectives and committee |
| Focus | `focus.html` | Session settings, timer and progress display |
| Discussions | `discussions.html` | Discussion directory and category filter |
| Gallery | `gallery.html` | Brand reference and future activity themes |
| Join | `join.html` | Membership interest form |

`practice.html` is an updated copy of Home. Use `index.html` as the main Home
page when continuing development.

## How to read HTML

```html
<a href="about.html">About REPS</a>
```

- `<a>` is the opening tag.
- `href="about.html"` is an attribute: extra information about the element.
- `About REPS` is the content.
- `</a>` is the closing tag.
- The whole expression is an **element**.

Elements can contain other elements. Close the inner element first:

```html
<ul>
    <li><a href="focus.html">Focus</a></li>
</ul>
```

Indentation makes nesting easier to read; it does not create the layout.
Use lowercase tag names and quote attribute values consistently.

Some elements are **void elements**: they have no closing tag. The ones used
on Day 1 are `<meta>`, `<input>` and `<img>`.

`<!DOCTYPE html>` is a declaration, not an HTML element. Put it first to
tell the browser to use standards mode for the HTML document.

## All tags used on Day 1

### Document setup

| Tag | Purpose | Example / reminder |
| --- | --- | --- |
| `<html>` | Root element around the document | `<html lang="en">...</html>` declares English |
| `<head>` | Document metadata | Contains title and meta elements; separate from visible page content |
| `<meta>` | Encoding, viewport or other metadata | `<meta charset="UTF-8">`; void element |
| `<title>` | Browser tab title | `<title>Home &#124; REPS Student Club</title>` |
| `<body>` | Page content | Contains the header, main content and footer |

### Page structure and text

| Tag | Purpose | Example / reminder |
| --- | --- | --- |
| `<header>` | Introductory area | Wraps the REPS heading and main navigation |
| `<nav>` | Major navigation links | `<nav aria-label="Main navigation">...</nav>` |
| `<main>` | Primary page content | `<main id="main-content">...</main>`; use one visible main region |
| `<section>` | Thematic group of content | Usually give it a heading, such as “Our mission” |
| `<footer>` | Closing information | Copyright information in REPS |
| `<h1>` | Main page heading | `<h1>REPS — About</h1>`; use one clear main heading in this project |
| `<h2>` | Section heading | `<h2>Upcoming Discussions</h2>` |
| `<p>` | Paragraph | `<p>Small Reps. Big Progress.</p>` |
| `<div>` | Generic container | `<div id="discussion-list">...</div>`; useful when no semantic element fits |

**Semantic HTML** means choosing elements for their meaning. A `<nav>` tells
the browser and assistive technology that its contents are navigation.
A `<div>` provides a container without that meaning. Use a `<section>` for
a meaningful topic, rather than simply to add spacing.

Headings express hierarchy. Choose `<h1>` and `<h2>` by the content structure,
then use CSS to change their appearance.

### Links and lists

| Tag | Purpose | Example / reminder |
| --- | --- | --- |
| `<a>` | Link to a page, file or location | `<a href="join.html">Join</a>` |
| `<ul>` | Unordered list | Used for navigation, objectives and interests in the club |
| `<li>` | Item in a list | `<li>Develop consistent work habits.</li>` inside `<ul>` |

### Forms and controls

| Tag | Purpose | Example / reminder |
| --- | --- | --- |
| `<form>` | Groups controls for collecting/submitting data | Day 1 form is a prototype; PHP submission comes later |
| `<label>` | Names a control | `<label for="email">Email</label>` connects to `id="email"` |
| `<input>` | Single control; behaviour depends on `type` | `<input id="email" name="email" type="email" required>`; void element |
| `<select>` | Dropdown choice | `<select id="year" name="year">...</select>` |
| `<option>` | Choice inside a dropdown | `<option value="1">Year 1</option>` |
| `<textarea>` | Multi-line text field | `<textarea id="goal" name="goal"></textarea>` |
| `<fieldset>` | Groups related form controls | Wraps the interests checkboxes |
| `<legend>` | Caption for a fieldset | `<legend>Interests</legend>` |
| `<button>` | Action control | `<button type="button" disabled>Start</button>` |

### Images and displayed results

| Tag | Purpose | Example / reminder |
| --- | --- | --- |
| `<figure>` | Self-contained content, such as an image | Groups the brand image with its caption |
| `<img>` | Displays an image | `<img src="images/brand/reps-logo.png" alt="REPS" width="200">`; void element |
| `<figcaption>` | Caption for a figure | `<figcaption>REPS brand concept.</figcaption>` |
| `<output>` | Displays a result | `<output id="completed-reps">0</output>` |
| `<progress>` | Progress towards a goal | `<progress value="0" max="60">0 / 60</progress>` |

## Attributes cheat sheet

An attribute belongs inside an opening tag. Its meaning depends on the element.

| Attribute | Meaning | REPS example |
| --- | --- | --- |
| `lang` | Document/content language | `<html lang="en">` |
| `charset` | Character encoding | `<meta charset="UTF-8">` |
| `name` on `<meta>` | Metadata category | `name="viewport"` or `name="description"` |
| `content` | Value of named metadata | `content="width=device-width, initial-scale=1.0"` |
| `href` | Link destination | `href="about.html"` |
| `id` | Unique identifier within the page | `id="main-content"`, `id="email"` |
| `aria-label` | Accessible name | `aria-label="Main navigation"` |
| `aria-current` | Marks the current item | `aria-current="page"` on the current navigation link |
| `for` on `<label>` | ID of the labelled control | `for="email"` matches `id="email"` |
| `name` on a form control | Key used when submitting its data | `name="full_name"` |
| `type` | Kind of input or button | `type="email"`, `type="button"` |
| `autocomplete` | Hint for browser autofill | `autocomplete="name"`, `"email"` or `"tel"` |
| `required` | Control must meet required-input rules | `required` on the email input |
| `placeholder` | Hint shown in an empty text field | `placeholder="What will you work on?"` |
| `value` | Initial input value, option value or progress value | `value="25"`, `value="study"` or `value="0"` |
| `min` | Minimum permitted numeric input | `min="1"` for focus duration |
| `max` | Maximum value; used for the progress goal here | `max="60"` |
| `disabled` | Makes a control unavailable | `disabled` on prototype buttons |
| `src` | Image source | `src="images/brand/reps-icon.png"` |
| `alt` | Image text alternative | `alt="REPS brand board..."` |
| `width` | Image display width in CSS pixels | `width="600"`; Day 2 CSS will handle mobile sizing |

`required` and `disabled` are **boolean attributes**: their presence enables
them. `disabled="false"` still disables a control. Remove the attribute to
enable the control.

The viewport metadata helps mobile browsers use the device width, but it
does not make a fixed-width image or page layout responsive by itself.

## Reusable page template

Copy this into a new `.html` file. Change the title, heading, current-page
marker and main content for that page.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="REPS student productivity and collaboration club.">
    <title>Home | REPS Student Club</title>
</head>
<body>
    <a href="#main-content">Skip to main content</a>
    <header>
        <h1>REPS</h1>
        <nav aria-label="Main navigation">
            <ul>
                <li><a href="index.html" aria-current="page">Home</a></li>
                <li><a href="about.html">About</a></li>
                <li><a href="focus.html">Focus</a></li>
                <li><a href="discussions.html">Discussions</a></li>
                <li><a href="gallery.html">Gallery</a></li>
                <li><a href="join.html">Join</a></li>
            </ul>
        </nav>
    </header>
    <main id="main-content">
        <section>
            <h2>About REPS</h2>
            <p>Steward your time. Put in the reps. Pursue excellence.</p>
        </section>
    </main>
    <footer>
        <p>&copy; 2026 REPS. All rights reserved.</p>
    </footer>
</body>
</html>
```

`<head>` stores document metadata. `<header>` is part of the page content.
`<title>` appears in the browser tab; `<h1>` appears on the page.

`&copy;` is a character reference that displays ©. It does not update the year
automatically. UTF-8 also lets us write characters such as `→` directly.

## Navigation and paths

```html
<!-- Relative link: a file in the same folder -->
<a href="about.html">About</a>

<!-- Relative path: a file inside subfolders -->
<a href="images/brand/reps-logo.png">View logo</a>

<!-- Fragment link: a location in the current page -->
<a href="#main-content">Skip to main content</a>
<main id="main-content">...</main>
```

Paths are resolved relative to the current document. REPS pages are all in
the project root, so they can use the same navigation filenames.
`../` means “go up one folder” when writing paths from a nested page.

`href="#"` does not lead to another page. Use real filenames for navigation.
A meaningful fragment such as `#main-content` is useful when its target ID exists.

The original brand image filename contains spaces. Its URL uses `%20` for
each space. Simpler future filenames such as `reps-logo.png` are easier to use.
Match filename spelling and capitalisation: hosting servers may be case-sensitive.

## Forms and inputs

### Connect a label to its input

```html
<label for="email">Email (required)</label>
<input id="email" name="email" type="email" autocomplete="email" required>
```

`id` identifies the control on the page and connects it to its label.
`name` identifies the field in submitted form data. They serve different
purposes even when both happen to be `email`.

### Input types used on Day 1

| Type | Purpose | Example |
| --- | --- | --- |
| `text` | Single-line text | Task name; also the default if `type` is omitted |
| `email` | Email address with browser format checking | Membership email |
| `tel` | Telephone entry, often with a useful mobile keyboard | Optional telephone; no automatic phone-format rule |
| `number` | Numeric entry | Focus duration with `min="1"` |
| `checkbox` | Independent on/off choice | Multiple membership interests |

`required` and `type="email"` provide browser validation rules. They do not
replace later JavaScript checks or PHP server-side validation.

### Dropdown and multi-line text

```html
<label for="year">Academic year</label>
<select id="year" name="year" required>
    <option value="">Select your year</option>
    <option value="1">Year 1</option>
    <option value="2">Year 2</option>
</select>

<label for="goal">Main goal</label>
<textarea id="goal" name="goal" required></textarea>
```

The option text is what the user sees; `value` is what gets submitted.
If `value` is omitted on an option, its text supplies the value.
A required single-choice dropdown with an empty first option prompts the
user to choose a real value.
Initial textarea text belongs between its tags, rather than in a `value` attribute.

### Related checkboxes

```html
<fieldset>
    <legend>Interests</legend>
    <label><input type="checkbox" name="interests[]" value="study"> Study</label>
    <label><input type="checkbox" name="interests[]" value="coding"> Coding</label>
</fieldset>
```

Wrapping the checkbox in its label also associates the label with it.
Only checked checkboxes are submitted. `interests[]` is the field naming
convention PHP uses to receive these selected values as an array later.

### Buttons and later submission

```html
<!-- Current prototype control -->
<button type="button" disabled>Submit interest (coming soon)</button>

<!-- Future pattern, once the PHP handler exists -->
<form action="process-join.php" method="post">
    <label for="future-email">Email</label>
    <input id="future-email" name="email" type="email" required>
    <button type="submit">Submit interest</button>
</form>
```

`type="button"` does not submit a form; `type="submit"` does.
Specify the type deliberately because a button inside a form can otherwise
default to submission. `action` and `method` above are a later-work example;
the current Day 1 form has neither, and `process-join.php` does not yet exist.
Do not enable submission until its handler is implemented.

## Images and captions

```html
<figure>
    <img src="images/brand/reps-logo.png"
         alt="REPS: blue progress symbol with dark wordmark"
         width="300">
    <figcaption>REPS brand concept: Small Reps. Big Progress.</figcaption>
</figure>
```

`src` locates the image. `alt` provides a useful text alternative. A caption
is visible supporting text and does not replace `alt`.
For a purely decorative image, use `alt=""`. For a linked image, make sure
the link has an accessible name that explains its destination or purpose.

The Gallery currently displays the original board. The separate generated
logo and icon are prepared for later styling; they are adaptations of the
reference, not exact original artwork. See [brand notes](images/brand/README.md)
for the palette, uses and prompts.

## Timer and progress display

```html
<p>Completed reps: <output id="completed-reps">0</output></p>

<label for="daily-progress">Daily progress</label>
<progress id="daily-progress" value="30" max="60">30 / 60</progress>
```

This progress example represents 30 of 60 minutes, or 50%.
`value` is progress so far; `max` is the target. Text between the tags is
fallback content. Omitting `value` makes a progress element indeterminate.

`<output>` and `<progress>` do not calculate statistics themselves.
JavaScript will update the timer, rep count and progress during later work.

## Accessibility habits

- Declare the page language with `lang="en"`.
- Use meaningful structural elements and a logical heading hierarchy.
- Give each form control a label; a placeholder is only a hint.
- Use unique IDs within each page. The same ID can appear on different pages.
- Mark only the current navigation link with `aria-current="page"`.
- Give navigation an accessible name with `aria-label`.
- Provide a skip link whose fragment matches the main content ID.
- Add useful image text alternatives.
- Use links to navigate and buttons to perform actions.
- Check keyboard navigation with Tab, Shift+Tab and Enter. Disabled controls
  are generally skipped by keyboard focus.

## Common mistakes

| Mistake | Correction |
| --- | --- |
| Leaving `<title>Document</title>` | Use a page-specific title, such as `Join &#124; REPS Student Club` |
| Using `href="#"` for every navigation item | Point each item to its real page filename |
| Confusing `<head>` and `<header>` | Metadata goes in head; page introduction goes in header |
| Choosing headings just for their size | Choose heading level for structure; style later with CSS |
| A label's `for` does not match an input's `id` | Make the two values identical |
| Using only placeholders as labels | Add visible labels that remain after typing |
| Omitting `name` from a field intended for submission | Add the field key PHP will receive |
| Writing `</img>` or `</input>` | Void elements have no closing tag |
| Writing `disabled="false"` | Remove `disabled` to enable the control |
| Expecting HTML to run the timer or save membership data | Implement JavaScript/PHP during their scheduled days |
| Assuming viewport metadata fixes every mobile layout | Add responsive CSS and image sizing on Day 2 |
| Reusing an ID twice on one page | Give each element a unique ID |
| Updating navigation on only one page | Keep all six pages consistent |

## Revision checklist

Before calling a page's HTML structure complete:

- [ ] It starts with `<!DOCTYPE html>` and declares `lang="en"`.
- [ ] It has UTF-8, viewport metadata and a descriptive title.
- [ ] Header, navigation, main content and footer are present.
- [ ] All six navigation links open the correct files.
- [ ] The current-page marker matches the page.
- [ ] The skip link reaches the main region.
- [ ] Headings and sections form a logical content outline.
- [ ] Every form control has an accessible label.
- [ ] Images load and have appropriate alt text.
- [ ] Tags are nested and closed correctly; void elements have no end tags.
- [ ] Copyright uses the correct year.
- [ ] Unimplemented features are clearly identified as prototypes.

### Five quick self-check questions

1. Where does the browser tab title come from? **`<title>` in `<head>`.**
2. What makes Home open a real page? **`href="index.html"`.**
3. How does a label connect to an input? **Its `for` matches the input's `id`, or it wraps the input.**
4. Which attribute identifies a field in submitted data? **`name`.**
5. What does `<progress value="45" max="60">` represent? **45 of 60, or 75%.**

### Small revision exercise

In a separate practice file, recreate the page template without copying it.
Add an About section, a labelled email input and an image with a caption.
Open the file in a browser, check the tab title, follow a navigation link and
click the email label to confirm it focuses the field. Compare your markup
against the cheat sheet when you finish.
