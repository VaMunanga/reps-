# REPS brand assets for Day 2

The original reference is `../REPS Minimal Brand Identity System (1).png`.
Keep it as the source of truth when styling the website.

## Colours from the board

| Role | Hex | Intended use |
| --- | --- | --- |
| Focus | `#4F6BFF` | Primary buttons, links and focus indicators |
| Clarity | `#0F172A` | Headings, body text and dark surfaces |
| Balance | `#E5E7EB` | Borders and subtle secondary surfaces |
| Simplicity | `#FAFAF8` | Main page background and light surfaces |

Check contrast when pairing these colours during Day 2. Satoshi is the
suggested typeface on the board; use a system sans-serif fallback until
font files are available. The brand line is “Small Reps. Big Progress.”
The club philosophy remains “Steward your time. Put in the reps. Pursue excellence.”

## Separate image files

| Asset | Use |
| --- | --- |
| `reps-logo.png` | Blue symbol with dark wordmark, transparent background; light page headers and footers |
| `reps-icon.png` | Blue symbol only, transparent background; favicon and compact navigation |
| Original brand board | Gallery brand concept and visual reference |

The two new PNGs were prepared with the built-in image generation tool,
using the supplied board as an edit reference. They are generated adaptations,
not exact crops or original vector masters. Review their fidelity before final branding.
Prepare smaller web exports and favicon sizes during Day 2 before using them site-wide.
The original image is preserved. No fictional club activity photographs have been added.

## Generation prompts

Logo: Isolate the blue rounded upward-right arrow and separate lower-left
rounded dot from the board, followed by lowercase “reps” in a dark `#0F172A`
bold sans-serif wordmark. Use `#4F6BFF` for the symbol and a transparent
background with margins. Preserve the reference geometry. No tagline,
board, extra objects, shadow or glow.

Icon: Produce one square standalone icon on a transparent background.
Isolate the blue `#4F6BFF` REPS rounded upward-right arrow and separate
rounded diagonal dot at lower left. Centre the symbol with even margins.
Preserve the reference geometry. No wordmark, text, glow, shadow, tile or board.

## Day 1 status

Six pages exist: `index.html`, `about.html`, `focus.html`, `discussions.html`,
`gallery.html` and `join.html`. `practice.html` retains an updated Home copy.
All pages use a header, six real navigation destinations, a descriptive
title, a main content region and a 2026 footer.

Focus controls, discussion filters and membership submission are disabled
prototype controls, ready for their scheduled JavaScript/PHP work.
Day 2 will add shared CSS, responsive layouts, image sizing and visual styling.
