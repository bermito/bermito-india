import os, re
from svgelements import *

OUT = 'brand'
os.makedirs(OUT, exist_ok=True)

BROWNS = {'#51453d', '#5c4b42', '#594c43', '#4f443c'}

def collect(page, region, keep_fills=None, mono=True, pad=6, name=None,
            min_area=0.5):
    x0, y0, x1, y1 = region
    sv = SVG.parse(f'svg/p{page}.svg')
    items = []
    for e in sv.elements():
        if not isinstance(e, Shape):
            continue
        try:
            if len(Path(e)) == 0: continue
        except Exception:
            continue
        bb = e.bbox()
        if not bb:
            continue
        if not (bb[0] >= x0 - .5 and bb[2] <= x1 + .5 and bb[1] >= y0 - .5 and bb[3] <= y1 + .5):
            continue
        if (bb[2]-bb[0]) * (bb[3]-bb[1]) < min_area:
            continue
        fill = (str(e.fill) or '').lower()
        if keep_fills and fill not in keep_fills:
            continue
        items.append((fill, Path(e).d()))
    if not items:
        print('!! nothing for', name or page, region); return None
    # union bbox
    xs, ys, xe, ye = 1e9, 1e9, -1e9, -1e9
    sv2 = SVG.parse(f'svg/p{page}.svg')
    for e in sv2.elements():
        if isinstance(e, Shape):
            bb = e.bbox()
            if not bb: continue
            if bb[0] >= x0-.5 and bb[2] <= x1+.5 and bb[1] >= y0-.5 and bb[3] <= y1+.5:
                if (bb[2]-bb[0])*(bb[3]-bb[1]) < min_area: continue
                f = (str(e.fill) or '').lower()
                if keep_fills and f not in keep_fills: continue
                xs, ys = min(xs, bb[0]), min(ys, bb[1])
                xe, ye = max(xe, bb[2]), max(ye, bb[3])
    w, h = xe - xs + pad*2, ye - ys + pad*2
    parts = []
    for fill, d in items:
        col = 'currentColor' if (mono and fill in BROWNS) else fill
        parts.append(f'<path fill="{col}" fill-rule="nonzero" d="{d}"/>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{xs-pad:.2f} {ys-pad:.2f} {w:.2f} {h:.2f}" '
           f'role="img">{"".join(parts)}</svg>')
    fn = os.path.join(OUT, name)
    open(fn, 'w').write(svg)
    print(f'{name:34s} {len(items):4d} paths  {os.path.getsize(fn)//1024:4d} KB  vb {xs:.0f} {ys:.0f} {w:.0f} {h:.0f}')
    return fn

# wordmark (full) — LOGO VARIATIONS page
collect(10, (300, 190, 1290, 500), name='bermito-wordmark.svg')
# wordmark (cropped, for oversized full-width use) — LOGO CROP page
collect(14, (500, 300, 1360, 580), name='bermito-wordmark-cropped.svg')
# stacked logomark
collect(18, (840, 190, 1060, 710), name='bermito-logomark.svg')
# tagline disk (two-colour lockup, keep as-is)
collect(23, (480, 130, 1120, 770), mono=False, name='live-through-coffee-disk.svg')
# tasting illustrations
for i, (nm, xa, xb) in enumerate([
        ('tasting-01-observe.svg', 470, 655),
        ('tasting-02-smell.svg', 705, 895),
        ('tasting-03-sip-slurp.svg', 950, 1135),
        ('tasting-04-enjoy-finish.svg', 1190, 1390)]):
    collect(35, (xa, 280, xb, 540), mono=False, name=nm)
# value icons
for nm, xa, xb in [('icon-clarity.svg', 460, 715),
                   ('icon-continuity.svg', 825, 1080),
                   ('icon-responsibility.svg', 1195, 1450)]:
    collect(36, (xa, 240, xb, 512), name=nm)
