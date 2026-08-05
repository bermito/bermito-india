#!/usr/bin/env node
/* ==================================================================
   BERMITO.IN — BUILD
   Renders the story, tasting and values sections of index.html from
   content/brandStory.js, so that copy has exactly one source of truth
   while the published HTML stays fully static and crawlable.

   Usage:  npm run build
   ================================================================== */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const HTML = path.join(ROOT, 'index.html');

/* --- load the content file in a sandbox ------------------------- */
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'content', 'brandStory.js'), 'utf8'), sandbox);
const C = sandbox.window.BERMITO_CONTENT;


/* --- inline an approved SVG asset, preserving its own viewBox ----
   External SVGs loaded through <img> cannot inherit currentColor,
   which would render the wordmark and icons black instead of the
   approved brown / yellow. Inlining keeps the logo colour correct
   and removes a request per asset.                                */
function readSvg(file, cls) {
  let svg = fs.readFileSync(path.join(ROOT, file), 'utf8').trim();
  svg = svg.replace(/^<\?xml[^>]*\?>\s*/, '');
  svg = svg.replace('<svg', '<svg aria-hidden="true" focusable="false"' + (cls ? ` class="${cls}"` : ''));
  return svg;
}

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* --- chapters ---------------------------------------------------- */
const chapters = C.chapters.map((ch) => {
  const title = esc(ch.title);
  const body = ch.body.map((p) => `        <p>${esc(p)}</p>`).join('\n');
  const year = ch.year ? ` &middot; ${esc(ch.year)}` : '';
  return `  <article class="chapter reveal" data-image="${esc(ch.image)}" data-accent="${esc(ch.accent)}" data-title="${esc(ch.title.replace(/\n/g, ' '))}" id="chapter-${ch.n}" style="--chapter-accent: var(--${esc(ch.accent)})">
    <p class="chapter__n">CHAPTER ${esc(ch.n)}${year}</p>
    <figure class="chapter__figure">
      <span class="disc"><img src="${esc(ch.image)}" alt="${esc(ch.alt)}" width="1200" height="1200" loading="lazy" decoding="async"></span>
    </figure>
    <h3 class="chapter__title">${title}</h3>
    <div class="chapter__body">
${body}
    </div>
    <p class="chapter__label">${esc(ch.label)}</p>
  </article>`;
}).join('\n');

/* --- tasting ----------------------------------------------------- */
const tasting = `  <div class="tasting__grid">
${C.tasting.map((t) => `    <div class="tasting__step" id="taste-${esc(t.id)}">
      <div class="tasting__art">${readSvg(t.art)}</div>
      <span class="tasting__mark" aria-hidden="true"></span>
      <h3 class="tasting__name">${esc(t.name)}</h3>
      <p class="tasting__text">${esc(t.text)}</p>
    </div>`).join('\n')}
  </div>`;

/* --- values ------------------------------------------------------ */
const values = C.values.map((v) => `  <div class="value reveal">
    <div class="value__icon">${readSvg(v.icon)}</div>
    <h3>${esc(v.name)}</h3>
    <p>${esc(v.text)}</p>
  </div>`).join('\n');

/* --- inject ------------------------------------------------------ */
let html = fs.readFileSync(HTML, 'utf8');

function inject(name, block) {
  const re = new RegExp(`(<!-- @generated:${name} -->)[\\s\\S]*?(<!-- /@generated:${name} -->)`);
  if (!re.test(html)) throw new Error(`Missing @generated:${name} markers in index.html`);
  html = html.replace(re, `$1\n${block}\n  $2`);
}

inject('chapters', chapters);
inject('tasting', tasting);
inject('values', values);

/* --- resolve data-inline placeholders ---------------------------
   Idempotent: a previous run's output is rewound to its placeholder
   before being regenerated, so `npm run build` can be re-run freely. */
html = html.replace(/<!--inline:([^|]+)\|([^>]*?)-->[\s\S]*?<!--\/inline-->/g,
  (m, file, attrs) => `<span ${attrs} data-inline="${file}"></span>`);

let inlined = 0;
html = html.replace(/<span([^>]*?)data-inline="([^"]+)"([^>]*?)><\/span>/g, (m, pre, file, post) => {
  const attrs = (pre + post).replace(/\s+/g, ' ').trim();
  let svg = fs.readFileSync(path.join(ROOT, file), 'utf8').trim().replace(/^<\?xml[^>]*\?>\s*/, '');
  svg = svg.replace('<svg', `<svg ${attrs} focusable="false"`);
  inlined++;
  return `<!--inline:${file}|${attrs}-->${svg}<!--/inline-->`;
});

fs.writeFileSync(HTML, html);

/* --- report ------------------------------------------------------ */
const pending = Object.entries(C.facts).filter(([, v]) => v === null).map(([k]) => k);
const missingLinks = Object.entries(C.links).filter(([, v]) => !v).map(([k]) => k);

console.log(`Inlined ${inlined} brand SVGs.`);
console.log(`Built index.html — ${C.chapters.length} chapters, ${C.tasting.length} tasting stages, ${C.values.length} values.`);
if (pending.length) console.log(`Awaiting approval (omitted from the page): ${pending.join(', ')}`);
if (missingLinks.length) console.log(`Links not yet supplied (elements removed at runtime): ${missingLinks.join(', ')}`);
