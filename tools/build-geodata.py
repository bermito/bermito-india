import json, math

# ---------- TopoJSON decode ----------
def decode(tj, objname):
    tr = tj.get('transform')
    arcs_raw = tj['arcs']
    def arc(i):
        rev = False
        if i < 0:
            i = ~i; rev = True
        a = arcs_raw[i]
        if tr:
            x = y = 0; out = []
            for dx, dy in a:
                x += dx; y += dy
                out.append((x*tr['scale'][0]+tr['translate'][0], y*tr['scale'][1]+tr['translate'][1]))
        else:
            out = [tuple(p) for p in a]
        return out[::-1] if rev else out
    def ring(idxs):
        pts = []
        for i in idxs:
            seg = arc(i)
            pts.extend(seg if not pts else seg[1:])
        return pts
    feats = []
    for g in tj['objects'][objname]['geometries']:
        polys = []
        if g['type'] == 'Polygon':
            polys = [[ring(r) for r in g['arcs']]]
        elif g['type'] == 'MultiPolygon':
            polys = [[ring(r) for r in poly] for poly in g['arcs']]
        feats.append({'props': g.get('properties', {}), 'polys': polys})
    return feats

def geo_feats(gj):
    out = []
    for f in gj['features']:
        gm = f['geometry']
        if not gm: continue
        if gm['type'] == 'Polygon':
            polys = [[[tuple(p) for p in r] for r in gm['coordinates']]]
        elif gm['type'] == 'MultiPolygon':
            polys = [[[tuple(p) for p in r] for r in poly] for poly in gm['coordinates']]
        else:
            continue
        out.append({'props': f['properties'], 'polys': polys})
    return out

# ---------- projection ----------
MAXLAT = 83.0
def proj(lon, lat):
    lat = max(-MAXLAT, min(MAXLAT, lat))
    y = -math.degrees(math.log(math.tan(math.pi/4 + math.radians(lat)/2)))
    return (lon, y)

# ---------- simplify ----------
def rdp(pts, eps):
    # closed ring: split at the point farthest from the start so the
    # base segment is not degenerate, simplify both halves, rejoin
    if len(pts) > 3 and abs(pts[0][0]-pts[-1][0]) < 1e-12 and abs(pts[0][1]-pts[-1][1]) < 1e-12:
        x0, y0 = pts[0]
        far = max(range(1, len(pts)-1), key=lambda i: (pts[i][0]-x0)**2 + (pts[i][1]-y0)**2)
        a = _rdp_open(pts[:far+1], eps)
        b = _rdp_open(pts[far:], eps)
        return a + b[1:]
    return _rdp_open(pts, eps)

def _rdp_open(pts, eps):
    if len(pts) < 3: return pts
    stack = [(0, len(pts)-1)]; keep = [False]*len(pts)
    keep[0] = keep[-1] = True
    while stack:
        s, e = stack.pop()
        x1, y1 = pts[s]; x2, y2 = pts[e]
        dx, dy = x2-x1, y2-y1
        norm = math.hypot(dx, dy) or 1e-12
        idx, dmax = -1, 0
        for i in range(s+1, e):
            x0, y0 = pts[i]
            d = abs(dy*x0 - dx*y0 + x2*y1 - y2*x1)/norm
            if d > dmax: idx, dmax = i, d
        if dmax > eps and idx > 0:
            keep[idx] = True
            stack.append((s, idx)); stack.append((idx, e))
    return [p for p, k in zip(pts, keep) if k]

def split_seam(ring):
    """Split rings that cross the antimeridian so SVG fills correctly."""
    pts = ring[:-1] if ring[0] == ring[-1] else ring[:]
    n = len(pts)
    if n < 4: return [ring]
    cuts = [i for i in range(n) if abs(pts[i][0] - pts[i-1][0]) > 180]
    if not cuts: return [ring]
    r = cuts[0]
    pts = pts[r:] + pts[:r]
    arcs, cur = [], [pts[0]]
    for i in range(1, n):
        if abs(pts[i][0] - pts[i-1][0]) > 180:
            arcs.append(cur); cur = [pts[i]]
        else:
            cur.append(pts[i])
    arcs.append(cur)
    out = []
    for a in arcs:
        if len(a) < 3: continue
        sx = 180.0 if a[0][0] > 0 else -180.0
        ex = 180.0 if a[-1][0] > 0 else -180.0
        out.append([(sx, a[0][1])] + a + [(ex, a[-1][1])])
    return out


def path(polys, eps, dec, minarea=0.0):
    out = []
    for poly in polys:
        rings = []
        for ring in poly:
            rings.extend(split_seam(ring))
        for ring in rings:
            r = rdp(ring, eps)
            if len(r) < 4: continue
            a = abs(sum(r[i][0]*r[i-1][1]-r[i-1][0]*r[i][1] for i in range(len(r))))/2
            if a < minarea: continue
            pts = [proj(*p) for p in r]
            d = 'M' + 'L'.join(f'{x:.{dec}f} {y:.{dec}f}' for x, y in pts) + 'Z'
            out.append(d)
    return ''.join(out)

# ---------- build ----------
land110 = decode(json.load(open('package/land-110m.json')), 'land')
c50 = decode(json.load(open('package/countries-50m.json')), 'countries')
c10 = decode(json.load(open('package/countries-10m.json')), 'countries')
adm1 = geo_feats(json.load(open('ne_admin1.geojson')))

world = path([p for f in land110 for p in f['polys']], 0.28, 2, minarea=0.6)

SUB = (60, 2, 102, 40)  # lon0, lat0, lon1, lat1
def in_box(polys, box):
    lo0, la0, lo1, la1 = box
    for poly in polys:
        for lon, lat in poly[0]:
            if lo0 <= lon <= lo1 and la0 <= lat <= la1:
                return True
    return False

neighbours = []
for f in c50:
    if f['props'].get('name') == 'India': continue
    if in_box(f['polys'], SUB):
        neighbours.append(path(f['polys'], 0.1, 3, minarea=0.15))
neighbours = ''.join(neighbours)

india = [f for f in c10 if f['props'].get('name') == 'India'][0]
india_p = path(india['polys'], 0.022, 4, minarea=0.01)

states = [f for f in adm1 if f['props'].get('admin') == 'India']
print('india states:', len(states), sorted(f['props'].get('name') for f in states)[:8])
kerala = [f for f in states if f['props'].get('name') == 'Kerala'][0]
others = ''.join(path(f['polys'], 0.05, 3, minarea=0.06) for f in states if f['props'].get('name') != 'Kerala')
kerala_mid = path(kerala['polys'], 0.008, 4, minarea=0.002)
kerala_hi = path(kerala['polys'], 0.0012, 5, minarea=0.0004)

# Malabar-region neighbours for the closest zoom (Karnataka + Tamil Nadu edges)
near = ''.join(path(f['polys'], 0.012, 5, minarea=0.02)
               for f in states if f['props'].get('name') in ('Karnataka', 'Tamil Nadu', 'Puducherry'))

out = {
    'world': world,
    'neighbours': neighbours,
    'india': india_p,
    'indiaStates': others,
    'keralaMid': kerala_mid,
    'keralaHi': kerala_hi,
    'nearStates': near,
}
for k, v in out.items():
    print(k, len(v))
json.dump(out, open('geo.json', 'w'))
print('KOZ proj', proj(75.7804, 11.2588))
print('bbox world proj', proj(-180, 83), proj(180, -83))
