# Carlos Niño Padilla — OJT Portfolio

A static portfolio website and printable CV, built for an **OJT application**. No build
step, no dependencies, no backend. Open `index.html` and it works.

```
index.html          main portfolio
resume.html         A4 printable CV (click "Print / Save as PDF")
css/style.css       portfolio styles
css/resume.css      CV + print styles
js/main.js          theme, nav, scroll effects, form
assets/cutout.png           transparent hero cutout (remove.bg export)
assets/photo-512.jpg        circular crop (résumé)
assets/photo-1024.jpg       circular crop (résumé, high-res)
assets/solar-*.jpg          Project 01 screenshots (web)
assets/app-*.jpg            Project 02 screenshots (mobile)
assets/rent-*.jpg           Project 03 screenshots (Rentahanan)
assets/cert-*.svg           certificate placeholders
assets/favicon.svg
profileojt.png      your remove.bg cutout, kept as the source for assets/cutout.png
web solaris\        original web screenshots (1080p, kept as sources)
apk solaris\        original app screenshots (1080p, kept as sources)
rentahanan\        original Rentahanan screenshots (~690px, kept as sources)
```

## Viewing it locally

Double-click `index.html`, or from this folder:

```
start index.html
```

To test it the way a recruiter will (over `http://`, not `file://`):

```
py -3 -m http.server 8000
```

then open <http://localhost:8000>.

## Your photo

`assets/cutout.png` is the **transparent-background cutout** used in the hero, sitting on
a gradient arch shape (`.figure-blob`). It came from your
remove.bg export — saved in the project folder as `profileojt.png`, 452×552, 32-bit ARGB.

**Use a real cutout, not the white-background original.** The hero has a solid shape
directly behind the figure, so any background that survives shows up as a coloured patch
at the neck and collar. That is exactly what happened with a white-background version.

An earlier attempt at generating the cutout automatically (flood fill from the image
border, de-fringe, then close interior channels) was abandoned. The white shirt measures
the same white as the backdrop, so only connectivity separates them, and the photo has a
genuine strip of backdrop between the neck and the collar that has to be closed. Widening
the close to catch it also painted over the legitimate background pockets between the
head and the shoulders, leaving pale vertical strips and a smeared shirt. remove.bg
handles all of that correctly — no need to re-derive it.

`assets/photo-512.jpg` and `assets/photo-1024.jpg` are separate circular crops used only
by the résumé (a printed CV wants the white background, not a cutout).

To swap in a new photo, replace `assets/cutout.png` and update the `width`/`height`
attributes on the hero `<img>` — they're only there to stop the page reflowing while the
image loads, so wrong values cause a visible jump.

---

# TODO: fill in every placeholder

Every placeholder is wrapped in `<span class="ph">…</span>`, which renders it as an
amber-outlined `[bracketed]` chip — deliberately ugly so none of them survive into a
version you send to an employer.

**Search `index.html` and `resume.html` for `class="ph"` and `TODO` to find every one.**

Also search for `btn-pending` (empty project links — these are your Live Demo / Source Code
buttons, which have no URLs yet).

Your contact details are already filled in: email `padillacarlosnino.pdm@gmail.com`,
GitHub `padillacarlosninopdm-max`, LinkedIn `carlos-padilla`, all wired in the contact
section, the footer, and the résumé header. They're in `mailto:` and `https://` links —
search for `padillacarlosnino` to find and change them.

## 1. Your details — `index.html`

| What | Where |
| --- | --- |
| Bio last paragraph | `#about` — the last `<p>` in `.prose` (motivation / what kind of team you want) |
| Role headline | `#home` → `.hero-role` (currently "Aspiring Frontend Developer and Quality Assurance") |
| About-me paragraph | `#home` → `.hero-lede` — edit the wording to match how you want to come across |
| Soft skills | `#skills` → last `.skill-card`, `.soft-skills` chips |

Already done: your name (**Carlos Niño Q. Padding** — no, *Padilla*), 4th year level,
location, school, and the "Open to OJT" status in the hero meta. The `Education` section,
the "Why I want this OJT" card, the `Hello !` tag, the header brand, and the scrolling
ticker were all removed at your request. Education still appears in the résumé.

## 2. Projects — `index.html`

The `My role:` lines for Projects 01 and 02 are written but **need your verification** —
they describe you as a team member who did the front end plus quality assurance. Correct the team size,
the module split, or the testing details if that isn't accurate; a hiring officer can ask
about any of it in an interview. The two `Outcome:` lines are still placeholders and
genuinely need real numbers from you.

Every `Outcome:` line needs a real result. "Made a system" is not an outcome — try
*how much faster a step became*, *how many people use it*, or *what feedback you got*.

### Screenshot showcases

**All three projects already use real screenshots** — nothing to swap in unless you want
different ones:

```
assets/solar-landing.jpg     assets/app-welcome.jpg     assets/rent-landing.jpg
assets/solar-dashboard.jpg   assets/app-dashboard.jpg   assets/rent-dashboard.jpg
assets/solar-login.jpg       assets/app-payment.jpg     assets/rent-contract.jpg
```

Each project is a `.showcase` block — three cards fanned like device mockups (centre
forward and upright, sides tilted behind; hover lifts one forward).

- **01 / 03 (web)** use browser-window chrome via `.shot-chrome`.
- **02 (mobile)** adds `.showcase-phones` for a handset bezel and notch.
- Projects 01 and 02 additionally carry `.project-featured`, which makes the card
  full width and lays the text out in two columns beneath the banner.

On screens under 940px the fan is dropped and the cards stack flat, so nothing gets
clipped.

The originals are in `web solaris\`, `apk solaris\` and `rentahanan\`. Everything was
re-encoded to JPEG q88–q90 (2.07 MB + 592 KB + 408 KB → 546 KB total). The Rentahanan
captures were only ~690px wide, so they were re-saved at **native size rather than
upscaled** — they are the softest of the set. If you can re-capture those three at
1080p+ they will look noticeably sharper.

To swap in different shots, replace the file and update the `src` plus the `width`/`height`
attributes on the same `<img>`. Keep replacements compressed or the page gets heavy.

Project 3 (Rentahanan) still needs its **real tech stack** — delete the three
`Tech 1 / Tech 2 / Tech 3` placeholder chips and list what you actually used.

Project links are currently disabled buttons. For each one, set the real `href` and
delete `class="btn-pending"`:

```html
<a class="btn btn-ghost btn-sm" href="https://github.com/you/solar-web">
```

## 3. Seminars & certifications — `index.html`

Four seminar rows and four certificate cards are placeholders. Fill them in, or delete the
extra rows/cards you don't need. Delete the `<!-- TODO: delete this block … -->` comments'
blocks entirely — not just the comment.

Replace certificate images with real captures (800×600):

```
assets/cert-1.svg … cert-3.svg  →  your certificate screenshots
```

The `Education` section was removed, so `cert-N.svg` is only used by the certificates
grid now.

## 5. Résumé — `resume.html`

Already done: your name, the "Aspiring Frontend Developer and Quality Assurance" heading,
the matching Profile paragraph, 4th year level, contact details, and the high school and
soft skills rows removed (college only). The project bullets now say team + front end +
quality assurance, matching the website.

Still to fill: the Rentahanan features / outcome / tech stack, and the seminars and
certifications lists.

## 4. Contact form — `index.html`

The form posts nowhere yet. To activate it:

1. Create a free form at <https://formspree.io> and get your endpoint.
2. Replace `https://formspree.io/f/XXXXXXXX` in the `<form action="…">`.

Until you do this, the form deliberately shows a "not connected yet" message instead of
failing silently.

## 5. Résumé — `resume.html`

The CV repeats the same placeholders. Open it in a browser and click **Print / Save as
PDF**. In the print dialog choose **Save as PDF**, set margins to **None** (the stylesheet
already sets `@page { margin: 0 }`), and enable **Background graphics**.

---

# Design notes

- **Dark by default** (the dark tokens live in `:root`; there is no toggle). The résumé
  stays light on purpose, since a CV has to print on white paper.
- **Hero** follows a cutout-portfolio layout: `Hello !` tag → "I'm" + your name in blue and
  underlined → role headline → an intro card (`.hero-note`) → two buttons, with your cutout
  on a gradient arch. `.hero-figure` holds the cutout and `.figure-blob` is the shape behind
  it — nudge that shape's `top` / `width` / `aspect-ratio` if you swap in a photo with a
  different pose.
- **Palette:** navy `#1e40af` primary, amber `#f59e0b` accent (a nod to the solar work),
  ink `#14181f`. Swap them in the `:root` block at the top of `css/style.css`.
- **Fonts** are Sora (headings), Inter (body), JetBrains Mono (skill chips) from Google
  Fonts. The site still renders fine offline — it just falls back to system fonts.
- **Sections carry `class="reveal"`** for the scroll-in animation. They start at
  `opacity: 0` and are revealed by `IntersectionObserver` in `js/main.js`. If you copy
  new markup from elsewhere and it stays invisible, that class plus JS is the cause.
- **Dark mode is permanent** — the dark tokens live in `:root` and there is no toggle,
  so there is no theme flash to guard against. `resume.html` stays light on purpose,
  since a CV has to print on white paper.

# Before you send it

- [ ] Zero `class="ph"` and zero `TODO` left in both HTML files
- [ ] No `href="#"` on any link
- [ ] Every project `Outcome:` states something concrete
- [ ] Screenshots are real and readable, not the placeholder SVGs
- [ ] Opens correctly on your phone (narrow window test the hamburger menu)
- [ ] Dark mode toggle checked
- [ ] CV printed to PDF and proofread

# Deploying later

Not set up yet, since you wanted this local first. When you're ready, the folder is
deployment-ready as-is — push it to GitHub and enable Pages, or drag it onto
<https://app.netlify.com/drop>.
