# Fluid-Motion Redesign Implementation Plan

> **For agentic workers:** executed natively in one session (owner asked for the
> build to start on spec approval). Steps use checkbox syntax for tracking.

**Goal:** Restyle cuesic.com with link.me-style motion on a dark ground without losing any content.

**Architecture:** One shared stylesheet (`styles.css`) holds tokens and components; one new script (`motion.js`) holds all motion and the nav; `script.js` keeps events and the modal. Each page keeps its own page-specific `<style>` block, as it does today.

**Tech Stack:** Static HTML, CSS, vanilla JS, Lenis 1.x from jsDelivr, Inter from Google Fonts.

**Spec:** `docs/superpowers/specs/2026-10-06-fluid-motion-redesign-design.md`

## Global Constraints

- All current copy, links, images, form fields, titles and meta tags survive.
- `#cb6ce6` is the lead brand colour; dark ground.
- No build step, no framework. `j/`, `e/`, `assets/`, `CNAME` unchanged.
- Content visible without JS; hidden start states only under `html.js`.
- `prefers-reduced-motion: reduce` disables movement.
- Class names and ids used by `script.js` stay: `.card`, `.details-btn`, `.modal*`, `#upcoming`, `#past`, `#event-*`, `#modal-flyer`, `#year`.

## Review Focus

- Lenis CDN blocked or slow: page must scroll natively and reveal normally.
- JS error before reveal runs: no section may stay invisible.
- 390px viewport: capsule nav, hero headline and marquee must not cause horizontal scroll.
- Event modal open while Lenis runs: page behind must not scroll; modal must.
- Reduce-motion: marquee static, no fly-ins, content complete.

## Interfaces (shared by every task)

HTML hooks read by `motion.js`:

| Hook | Effect |
|---|---|
| `data-reveal` | fade and rise on entering view; optional value `left`, `right`, `scale` |
| `data-reveal-stagger` | on a parent: children get `--i` index, 70ms apart |
| `data-split` | headline lines rise in turn (lines separated by `<br>`) |
| `data-progress` | sets `--p` (0 to 1) while the element crosses the viewport |
| `data-marquee` | duplicates children once (`aria-hidden`), CSS scrolls it; `data-marquee="reverse"` flips direction |
| `data-glow` | sets `--mx`, `--my` from the pointer |
| `.site-header`, `.nav-toggle`, `.nav-menu` | capsule nav and mobile sheet |

Shared markup: header and footer blocks are identical on every page apart from the active link and relative paths (`app/index.html` uses `../`).

## Tasks

### Task 1: Content baseline
- [ ] Write `check_content.py` (outside the repo) that extracts, per page, the ordered visible text, `href`s, `src`s, form `action`s and field `name`s, ignoring `aria-hidden` subtrees, `<style>` and `<script>`.
- [ ] Run it against `main` via `git show main:<file>` and save the baseline.

### Task 2: Design system and motion
- [ ] Rewrite `styles.css`: tokens, base, aurora ground, glass nav, buttons, chips, cards, marquee, section headers, footer, modal, forms, events, contact, founders, legal column, reveal states, reduced-motion block.
- [ ] Create `motion.js` implementing every hook in the table, with Lenis optional.
- [ ] Remove the nav toggle from `script.js` (moves to `motion.js`).
- [ ] Commit.

### Task 3: Home
- [ ] Restructure `index.html` per the spec; keep carousel and journey logic.
- [ ] Content diff against baseline; load at 390 and 1440; commit.

### Task 4: App pages
- [ ] `app/index.html` and `app.html`, each keeping its own content.
- [ ] Content diff; load; commit.

### Task 5: Entertainment, AV, Gallery, Ambassador
- [ ] Restructure each; verify event modal and the Formspree form.
- [ ] Content diff; load; commit.

### Task 6: Legal pages
- [ ] New shell on `privacy.html`, `terms.html`, `app-privacy.html`, `app-terms.html`.
- [ ] Content diff; commit.

### Task 7: Whole-site verification
- [ ] Full content diff, console-error pass, reduce-motion and no-JS pass on home.
- [ ] Report results with evidence.
