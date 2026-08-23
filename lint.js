#!/usr/bin/env node
/* Lightweight pre-flight checks for the static build. */
const fs = require('fs'), path = require('path');
const ROOT = __dirname;
let errors = 0, warnings = 0;
const err = (m) => { console.error('  ERROR  ' + m); errors++; };
const warn = (m) => { console.warn('  WARN   ' + m); warnings++; };

const html = fs.readFileSync(path.join(ROOT, 'classic.html'), 'utf8')
           + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* 1. every local asset referenced actually exists */
const refs = new Set();
for (const re of [/(?:src|href)="((?!https?:|#|mailto:)[^"]+)"/g]) {
  let m; while ((m = re.exec(html))) refs.add(m[1].split('?')[0]);
}
refs.forEach((r) => {
  if (!fs.existsSync(path.join(ROOT, r))) err(`missing asset: ${r}`);
});

/* 2. images must carry alt text */
const imgs = html.match(/<img\b[^>]*>/g) || [];
imgs.forEach((t) => { if (!/\balt=/.test(t)) err(`<img> without alt: ${t.slice(0, 70)}`); });

/* 3. one H1 per page */
for (const page of ['classic.html','index.html','descent.html']){
  const n = (fs.readFileSync(path.join(ROOT, page),'utf8').match(/<h1\b/g)||[]).length;
  if (n !== 1) err(`${page}: expected exactly one <h1>, found ${n}`);
}

/* 4. no visible placeholder tokens left in the markup */
const strippedOfComments = html.replace(/<!--[\s\S]*?-->/g, '');
(strippedOfComments.match(/\[[A-Z][A-Z _]{3,}\]/g) || []).forEach((t) => err(`placeholder token rendered: ${t}`));

/* 5. external links open safely and are marked */
const anchors = html.match(/<a\b[^>]*href="https?:[^"]*"[^>]*>/g) || [];
anchors.forEach((a) => {
  if (/target="_blank"/.test(a) && !/rel="[^"]*noopener/.test(a)) warn(`target=_blank without rel=noopener: ${a.slice(0, 60)}`);
});

/* 6. the approved logo must never be recoloured piecemeal or transformed */
const css = fs.readFileSync(path.join(ROOT, 'styles', 'main.css'), 'utf8');
[/\.(?:hero|loader|journey|finale|site-footer__brand|site-header__logo)[^{]*(?:svg|__word)[^{]*\{[^}]*(?:skew|rotate|scaleX|scaleY)\(/g]
  .forEach((re) => { if (re.test(css)) err('the Bermito wordmark is being distorted in CSS'); });

/* 7. content file sanity */
const vm = require('vm');
const sb = { window: {} }; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'content', 'brandStory.js'), 'utf8'), sb);
const C = sb.window.BERMITO_CONTENT;
if (C.chapters.length !== 5) warn(`story has ${C.chapters.length} chapters (the brief specifies five)`);
C.chapters.forEach((c) => {
  if (!fs.existsSync(path.join(ROOT, c.image))) err(`chapter ${c.n} image missing: ${c.image}`);
  if (!c.alt) err(`chapter ${c.n} has no alt text`);
});
Object.entries(C.links).forEach(([k, v]) => {
  if (v && !/^https:\/\/bermito\.com\//.test(v) && !/^https:\/\//.test(v)) err(`link ${k} is not an absolute https URL`);
});

console.log(errors ? `\nLint failed: ${errors} error(s), ${warnings} warning(s).`
                   : `\nLint passed${warnings ? ` with ${warnings} warning(s)` : ''}.`);
process.exit(errors ? 1 : 0);
