# Cuesic site: fluid-motion redesign

Date: 2026-10-06
Branch: `redesign/fluid-motion` (local only; `main` and cuesic.com are not touched)

## Goal

Give cuesic.com a modern look with the motion and fluid feel of https://link.me/,
without changing what the site says. This is a trial look on a branch, to be
compared against the live site.

## Constraints

- Every piece of current content stays: sections, copy, links, the App Store
  CTA, events data, gallery photos, the ambassador form, contact details, legal
  text, page titles and meta tags.
- `#cb6ce6` remains the lead brand colour.
- Dark ground (decided 6 Oct). link.me's light ground is not copied.
- Plain HTML, CSS and JS with no build step, so GitHub Pages serves it as-is.
- No link.me code, images or copy are reused. Only the techniques are.
- `/j/` and `/e/` are functional invite and deep-link pages and are not changed.

## What is borrowed from link.me

| Trait | How link.me does it | Cuesic version |
|---|---|---|
| Nav | Floating frosted-glass capsule | Same, dark glass, purple CTA pill |
| Type | Inter, 56–72px tight headlines | Inter, same scale |
| Ground | Faint fixed colour washes | Two slow-drifting purple auroras on near-black |
| Scrolling | Lenis smooth scroll | Lenis from CDN |
| Scroll motion | Progress written to a CSS variable, CSS animates | Same (`--p`, 0 to 1 per element) |
| Marquees | Infinite horizontal bands | Feature band, photo bands |
| Reveals | 0.5s `cubic-bezier(0,.61,.28,.92)` | Same easing, staggered |
| Press feel | `cubic-bezier(.34,1.56,.64,1)` squash | Same on buttons, links, cards |

## Design system (`styles.css`)

Tokens:

- Colour: `--brand #cb6ce6`, `--brand-hi #e3a8f5`, `--brand-deep #7343eb`
  (already used in the journey glow), `--bg #0b0b0f`, `--surface #131318`,
  `--card #1a1a21`, `--line rgba(255,255,255,.08)`, `--ink #f4f4f6`,
  `--muted #a1a1aa`.
- Type: Inter variable (400–800) for everything, replacing Manrope.
  Display `clamp(2.6rem, 6.4vw, 4.5rem)`, tracking `-0.035em`, line-height 1.02.
  H2 `clamp(2rem, 4.2vw, 3.5rem)`. Body 1rem / 1.65.
- Radius: 14, 22, 32, pill.
- Easing: `--ease-out cubic-bezier(0,.61,.28,.92)`,
  `--ease-spring cubic-bezier(.34,1.56,.64,1)`.

Components: glass nav capsule, buttons (primary, ghost), eyebrow chip, card
(pointer-tracking glow, hairline border), marquee, section header, footer,
modal, form fields. Old class names used by `script.js` (`.card`,
`.details-btn`, `.modal*`, `#upcoming`, `#past`) are kept.

## Motion (`motion.js`, new)

One small file, no dependencies besides Lenis:

1. **Smooth scroll**: Lenis, skipped when reduce-motion is set or the CDN fails.
2. **Reveal**: `[data-reveal]` elements fade and rise when they enter view;
   `data-reveal-stagger` on a parent delays its children 70ms apiece.
   `.fade-up` keeps working for any markup not yet migrated.
3. **Headline split**: `[data-split]` wraps each line so lines rise in turn.
4. **Scroll progress**: `[data-progress]` gets `--p` from 0 to 1 as it crosses
   the viewport. Fly-ins, the journey rail and the tree lines read it in CSS.
5. **Marquee**: `[data-marquee]` duplicates its children once and scrolls by
   CSS animation; pauses on hover and when off-screen.
6. **Pointer glow**: cards get `--mx`/`--my` for a radial highlight.
7. **Nav**: capsule tightens after 40px of scroll; mobile menu is a glass sheet.

Safety:

- Content is visible by default. Hidden start states apply only under
  `html.js`, which `motion.js` sets, so a script failure never hides content.
- `prefers-reduced-motion: reduce` disables smooth scroll, marquee movement,
  fly-ins and splits; reveals become instant.

## Pages

**Home (`index.html`)**: hero (same copy, App Store button, phone carousel with
float and depth), feature marquee (the four pills), app journey (same four
steps, sticky phone, progress rail), Cuesic Family (same three cards, fly in
from the sides, tree lines draw in), About (three cards), Founders, footer.
The event modal markup and the TikTok script stay as they are.

**App (`app/index.html`, `app.html`)**: same hero and the four feature sections
as alternating phone and text rows with scroll fly-ins, partnerships, contact.
The two files differ today; each keeps its own content.

**Entertainment**: hero, events (cards rendered by `script.js`, modal
unchanged), gallery as a photo marquee linking to the gallery page, contact.

**AV**: hero, What We Do, Why Cuesic AV, Get a Quote.

**Gallery**: same photos in a masonry-style grid with hover zoom and reveals.

**Ambassador**: same Formspree form (action, field names and thank-you
behaviour unchanged), restyled fields.

**Legal (4 pages)**: new nav, type and footer; a readable 720px column.

## Files

| File | Change |
|---|---|
| `styles.css` | Rewritten as the system above |
| `motion.js` | New |
| `script.js` | Nav toggle moves to `motion.js`; events and modal logic unchanged |
| `*.html`, `app/index.html` | Restructured around the same content |
| `j/`, `e/`, `assets/`, `CNAME` | Unchanged |

## Verification

- A script extracts visible text, link targets, image sources and form fields
  from each page on `main` and on the branch and diffs them. The only allowed
  differences are items this spec adds (nav CTA, marquee duplicates marked
  `aria-hidden`).
- Each page is loaded from a local server at 390px and 1440px and checked for
  layout, console errors, the event modal, the carousel, and the form.
- Reduce-motion and JS-disabled passes on the home page.

## Out of scope

New copy or sections, video, a framework or build step, changes to `/j/` and
`/e/`, pushing or deploying the branch.

This `docs/` folder is for the branch only and is removed before any merge,
because GitHub Pages would serve it.
