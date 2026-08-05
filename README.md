# Bermito.in — The Coordinates of Bermito

The brand-story site for Bermito Coffee Roastery, Kozhikode. It introduces the
brand, tells the origin story, and hands visitors over to **bermito.com** when
they want to shop, read the Journal or visit the Brew Room.

This is deliberately **not** a second shop. No catalogue, no cart, no checkout.

---

## Running it

There is no build toolchain to install and no dependencies to download.

```bash
npm run build     # regenerates index.html from content/brandStory.js
npm run lint      # pre-flight checks (assets, alt text, links, logo integrity)
npm start         # serves the folder at http://localhost:4173
```

`npm run build` is safe to re-run as often as you like — it rewinds its own
previous output before regenerating.

To deploy, upload the folder as-is to any static host (Netlify, Vercel,
Cloudflare Pages, S3, or plain nginx). There is no server, no database and no
CMS in this first version.

---

## Where things live

```
index.html                 the whole page (one document, deep-linked sections)
content/brandStory.js      ← EDIT THIS. Copy, chapters, links, unapproved facts
styles/tokens.css          ← EDIT THIS. Colours, type, spacing, motion, z-index
styles/main.css            layout and components
scripts/geo-data.js        generated geography (Natural Earth, public domain)
scripts/map-journey.js     the scroll-linked camera flight
scripts/main.js            loader, scroll engine, story, navigation
assets/brand/              approved logo, disk, tasting illustrations, icons
assets/fonts/              Brunswick Grotesque + DM Sans (self-hosted)
assets/images/             photography — currently branded placeholders
build.js                   renders brandStory.js into index.html
lint.js                    pre-flight checks
```

### Changing copy

Edit `content/brandStory.js`, then run `npm run build`. The chapters, tasting
stages and values sections of `index.html` are regenerated from it. Everything
else in `index.html` you can edit directly.

### Changing brand values

Every colour, size, duration and easing lives in `styles/tokens.css`. Nothing
else hard-codes a value. Change it once there and it changes everywhere.

---

## The journey

Scrolling the first section flies a camera over real geography:

**WORLD → INDIA → KERALA → KOZHIKODE**

All four stops live in one Mercator coordinate space computed ahead of time, so
the camera is a single SVG transform rather than a re-projection per frame. The
terrain starts in satellite-inspired greys and shifts into Bermito Yellow and
Bermito Brown as you descend — by Kozhikode the map has become the brand.

The aperture holding the map is a circle throughout, opening only at the end to
hand over to the hero. The location marker is Bermito's stacked tasting mark,
not a generic pin, and it is a real focusable button.

**No Google Earth or Google Maps imagery is used, recorded, exported or
reproduced anywhere in this project.** See `GEODATA-LICENCE.md`.

---

## Fonts

**Brunswick Grotesque** (primary) — supplied by the client as an OTF and
converted to `woff2`/`woff` for self-hosting.

It is *not* a variable font. The five widths described in the guidelines are
delivered through OpenType **contextual alternates** (`calt`), with `ss01`–`ss04`
holding the four alternate widths of each glyph. This means:

- Never set `font-feature-settings` in a way that disables `calt` or `liga` on
  display type, or the widths stop shifting and the brand voice flattens.
- To pin a specific width deliberately, add `font-feature-settings: "ss02" 1`
  (or `ss01`/`ss03`/`ss04`) to that element. The hero's second line does this.

> **Licensing:** desktop font licences do not always cover webfont embedding.
> Confirm with the foundry that Bermito's Brunswick Grotesque licence includes
> web use, and buy the web licence tier if not. The converted files are in
> `assets/fonts/` and are served only from bermito.in.

**DM Sans** (secondary) — weights 400/500/600, SIL Open Font License, self-hosted.

---

## Accessibility

- Full story readable in HTML with JavaScript disabled (a `<noscript>` block
  releases the page and collapses the map).
- `prefers-reduced-motion` respected: no loader, no camera flight, visitor
  arrives at a static, accurate Kozhikode view.
- Skip-to-content link, visible 3px focus outline, logical tab order.
- Map stops and the location marker are keyboard operable.
- The header becomes reachable on `:focus-within` before it fades in.
- Every image carries alt text; decorative brand graphics are `aria-hidden`.

Checked at 360, 390, 768, 1280 and 1440 px wide: no horizontal overflow, no
clipped type, no broken images, no console errors.

---

## What still needs you

See `ASSET-CHECKLIST.md`. In short: real photography, the founding year, the
roastery address and coordinates, approved social links, and verification of
every bermito.com URL in `content/brandStory.js`.

Anything left as `null` in `brandStory.js` is **omitted from the page**, not
rendered as placeholder text. Nothing fabricated has been added — no dates, no
awards, no ratings, no address.
