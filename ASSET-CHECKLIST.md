# Asset & information checklist

Everything below is either missing or unverified. Nothing has been invented to
fill a gap — unsupplied values are omitted from the page entirely.

---

## 1. Photography — REQUIRED

All image slots currently hold **branded placeholder plates** (brand-coloured
circle compositions). They look intentional rather than broken, but they are not
photography and should not ship to a public launch.

Replace the files at the same paths, keep the same filenames.

| File | Where it appears | Size | Crop | Notes |
|---|---|---|---|---|
| `assets/images/intro-founding-cup.jpg` | Introduction, circular | 1200×1200 | square, centre-safe | Early cupping / founding cup |
| `assets/images/story-01-cup.jpg` | Chapter 01, circular | 1200×1200 | square | First memorable coffee, early cupping, or original bag |
| `assets/images/story-02-kozhikode-roastery.jpg` | Chapter 02, circular | 1200×1200 | square | First roastery, first machine, Kozhikode context |
| `assets/images/story-03-origin-producer.jpg` | Chapter 03, circular | 1200×1200 | square | Farm, producer, cherries, processing |
| `assets/images/story-04-roasting.jpg` | Chapter 04, circular | 1200×1200 | square | Drum, trier, first crack, hands working |
| `assets/images/story-05-community.jpg` | Chapter 05, circular | 1200×1200 | square | Brewing, workshops, people sharing coffee |
| `assets/images/values-roastery.jpg` | Roastery statement, circular | 1400×1400 | square | Strong current-roastery shot |
| `assets/images/og-bermito.jpg` | Social sharing card | 1200×630 | landscape | Text-safe centre; one strong brand image |
| `assets/images/tasting-ritual.jpg` | *(spare, not yet placed)* | 1400×1400 | square | Cupping table |
| `assets/images/footer-brand.jpg` | *(spare, not yet placed)* | 1400×1400 | square | Closing brand image |

**Because every story image is masked into a circle, keep the subject well
inside the frame** — anything in the corners is cut. No transparency needed.

Supply as AVIF or WebP alongside JPG if you want the extra performance; the
markup will need `<picture>` wrappers, which I can add in ten minutes once the
real photographs exist.

Direction: documentary, human, warm, honest, clean, contemporary, slightly
playful. Not stock. Not AI-generated farms.

---

## 2. Facts awaiting approval — in `content/brandStory.js`

| Field | Used for | Status |
|---|---|---|
| `facts.foundingYear` | Loader corner, hero location label, chapter labels | **omitted** until supplied |
| `facts.roasteryAddress` | Footer | **omitted** until supplied |
| `facts.roasteryCoords` | Exact map marker (currently Kozhikode city level, 11.2588° N 75.7804° E) | **city level** until supplied |
| `facts.founders` | Not yet placed — available for an About beat | not used |
| `facts.phone` / `facts.email` | Footer, LocalBusiness schema | **omitted** until verified |
| `chapters[].year` | Timeline dates beside each chapter number | **omitted** — no dates invented |

The guidelines' business card shows *"Brooklyn, NYC, 36 Church Rd, 100101"* and
`+91 95959 34377`. The address is clearly agency mockup filler and has been
ignored. **Confirm whether the phone number is real** before it goes anywhere.

`LocalBusiness` structured data is intentionally left out of the page until a
verified street address and telephone number exist. Organization schema is
already in place.

---

## 3. Links to verify — in `content/brandStory.js` → `links`

Every one of these is a best guess at the bermito.com URL structure and **must
be opened and checked** before launch:

- `shop` → `https://bermito.com/collections/all`
- `journal` → `https://bermito.com/blogs/journal`
- `brewRoom` → `https://bermito.com/pages/brew-room`
- `roastery` → `https://bermito.com/pages/about`
- `contact` → `https://bermito.com/pages/contact`
- `privacy` → `https://bermito.com/policies/privacy-policy`
- `instagram` → **not supplied.** The "Follow Bermito" button and the footer
  Instagram link remove themselves automatically while this is `null`.
- `youtube` → not supplied, not currently placed.

---

## 4. Brand assets — SUPPLIED ✅

Extracted as clean vectors from *Bermito Brand Guidelines 2026* and checked
against the source pages:

- `bermito-wordmark.svg` — primary logotype
- `bermito-wordmark-cropped.svg` — the LOGO CROP treatment
- `bermito-logomark.svg` — stacked tasting mark
- `live-through-coffee-disk.svg` — approved tagline lockup, two-colour
- `tasting-01-observe.svg` … `tasting-04-enjoy-finish.svg`
- `icon-clarity.svg`, `icon-continuity.svg`, `icon-responsibility.svg`
- `favicon.svg`, `apple-touch-icon.png` — built from the logomark

The wordmark and value icons use `currentColor`, so a single element can only
ever render in one colour — the "do not use multiple colours" rule is enforced
by the asset itself. The logo is never stretched, skewed, rotated, stroked,
gradient-filled or combined with the logomark anywhere in the CSS; `npm run lint`
checks for this.

**If Curb Studio can supply the original master SVGs**, drop them in over these
and rebuild — they will be cleaner than anything recovered from a PDF.

---

## 5. Fonts — SUPPLIED ✅ (one licence question)

- `BrunswickGrotesque-Regular.woff2` / `.woff` — converted from your OTF
- `dm-sans-400/500/600.woff2` — SIL OFL, self-hosted

**Confirm the Brunswick Grotesque licence covers webfont embedding.** Desktop
licences frequently do not. If it doesn't, buy the web tier from the foundry —
the files stay exactly where they are.
