# Bermito.in — The Descent

The brand experience for Bermito Coffee Roastery, Kozhikode. One continuous
camera move — WORLD → INDIA → KERALA → KOZHIKODE → the roast → first crack →
into the cup — with the whole universe rendered in the Bermito circle system
and the colour of everything following the roast: raw green → yellow → brown.

Two pages:

- **index.html — The Descent.** The immersive Three.js film. Requires WebGL
  and JavaScript; politely bows out otherwise.
- **classic.html — the classic story.** The full editorial site (map journey,
  five chapters, tasting ritual, values). It is the automatic fallback for
  no-JS (meta refresh), reduced motion and no-WebGL visitors, and is linked
  from the descent's landing for anyone who prefers a calmer read.

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

### Deploying

Upload the folder as-is to any static host. There is no server, no database and
no CMS in this first version.

**Vercel.** `vercel.json` is included and sets the output directory to the repo
root. Without it Vercel looks for a `public/` folder, finds nothing, and fails
with *"No Output Directory named 'public' found after the Build completed."*
If you configured the project through the dashboard before adding this file,
also check **Project Settings → Build and Deployment**:

| Setting | Value |
|---|---|
| Framework Preset | Other |
| Build Command | `node build.js` |
| Output Directory | `.` |
| Install Command | leave default |

Dashboard settings override `vercel.json` in some project configurations, so if
a deploy still fails, clear the Output Directory override in the dashboard and
let the file take effect.

**Netlify.** `netlify.toml` is included (`publish = "."`).

**Cloudflare Pages.** Build command `node build.js`, output directory `/`.

**Any other host / nginx / S3.** Just upload the folder. The build step is
optional — `index.html` is committed already built.

---

## Where things live

```
index.html                 THE OBJECT — the immersive film
classic.html               the classic story site (also the fallback)
content/brandStory.js      ← EDIT THIS. Copy, chapters, links, unapproved facts
styles/tokens.css          ← EDIT THIS. Colours, type, spacing, motion
styles/descent.css         film HUD, beats, loader, landing
styles/main.css            classic page layout and components
scripts/experience.js      the Three.js object (mark, bean, drum, cup, camera)
scripts/descent.js         driver: loader, scroll → progress, beats, wipe
scripts/geo-data.js        generated geography (Natural Earth, public domain)
scripts/map-journey.js     classic page's SVG camera flight
scripts/main.js            classic page behaviour
assets/vendor/three.module.min.js   Three.js r170 (MIT) + RoomEnvironment, self-hosted
assets/brand/              approved logo, disk, tasting illustrations, icons
assets/fonts/              Brunswick Grotesque + DM Sans (self-hosted)
assets/images/             photography — currently branded placeholders
build.js                   renders brandStory.js into classic.html + inlines SVGs
lint.js                    pre-flight checks (both pages)
```

### The Object, briefly

One physical object holds the centre of the screen for the whole visit and
scroll transforms it: the glossy ceramic tasting mark unstacks into a raw
green coffee bean (a real modelled crease, not a sphere); the bean multiplies
into ~280 instanced beans tumbling inside a brushed-steel drum, each turning
green → yellow → brown as the heat passes its own threshold; first crack is a
coral flash with a camera shake; then a ribbed ceramic cup — lathed from the
tasting-cup silhouette with fluted sides, a yellow rim and glossy coffee —
rises, with steam and the tagline disk floating behind it. Studio PBR
lighting (RoomEnvironment reflections, ACES tone mapping), a soft contact
shadow, and drag-to-rotate on the object. The room's colour follows the
roast: paper → raw green tint → warm amber → coral flash → deep brown.
Story text lives in DOM overlays (real, crawlable HTML) timed to the film.

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
