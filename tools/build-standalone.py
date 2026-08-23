#!/usr/bin/env python3
"""
Builds bermito-in-preview.html — a single self-contained file.

Browsers block webfonts (and some other assets) when a page is opened straight
from disk with file://, because the page has a null origin. That makes the
normal build look wrong when you just double-click index.html.

This bundles the CLASSIC page (classic.html) — CSS, JavaScript, geography,
fonts and images — into one HTML document as data URIs, so it works with no
server at all. The immersive descent (index.html) uses ES modules and Three.js
and needs to be served; deploy the folder or run `npm start` to see it.

Use it for review and sharing only. Deploy the real folder to a host.
"""
import base64, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT.parent / 'bermito-in-preview.html'

MIME = {'.woff2': 'font/woff2', '.woff': 'font/woff', '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml'}


def data_uri(rel):
    p = ROOT / rel
    raw = p.read_bytes()
    mime = MIME.get(p.suffix.lower(), 'application/octet-stream')
    return f'data:{mime};base64,' + base64.b64encode(raw).decode()


def read(rel):
    return (ROOT / rel).read_text(encoding='utf-8')


html = read('classic.html')

# ---- CSS, with @font-face sources embedded --------------------------------
css = read('styles/tokens.css') + '\n' + read('styles/main.css')
css = re.sub(r"url\('\.\./(assets/fonts/[^']+)'\)",
             lambda m: f"url('{data_uri(m.group(1))}')", css)

html = re.sub(r'<link rel="stylesheet" href="styles/tokens\.css">\s*'
              r'<link rel="stylesheet" href="styles/main\.css">',
              '<style>\n' + css + '\n</style>', html)

# ---- JavaScript -----------------------------------------------------------
for tag, src in [
    ('<script src="content/brandStory.js"></script>', 'content/brandStory.js'),
    ('<script src="scripts/geo-data.js" defer></script>', 'scripts/geo-data.js'),
    ('<script src="scripts/map-journey.js" defer></script>', 'scripts/map-journey.js'),
    ('<script src="scripts/main.js" defer></script>', 'scripts/main.js'),
]:
    html = html.replace(tag, '<script>\n' + read(src) + '\n</script>')

# ---- every remaining local asset reference --------------------------------
assets = sorted(set(re.findall(r'assets/(?:images|brand)/[A-Za-z0-9._-]+', html)),
                key=len, reverse=True)
for rel in assets:
    if (ROOT / rel).exists():
        html = html.replace(rel, data_uri(rel))

# ---- things that cannot work from a file:// page --------------------------
html = html.replace('<link rel="manifest" href="site.webmanifest">', '')
# preload hints still point at the folder and would 404 on their own
html = re.sub(r'<link rel="preload"[^>]*>\s*', '', html)
# nothing is lazy in a single file — load it all up front
html = html.replace(' loading="lazy"', '')
html = html.replace('<title>', '<!-- Self-contained CLASSIC preview. The immersive '
                    'descent needs the deployed folder. -->\n<title>')

OUT.write_text(html, encoding='utf-8')
print(f'Wrote {OUT} — {OUT.stat().st_size / 1024:.0f} KB, '
      f'{len(assets)} assets embedded.')
