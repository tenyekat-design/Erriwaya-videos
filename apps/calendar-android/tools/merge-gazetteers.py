#!/usr/bin/env python3
"""Adds to tools/villages.tsv the inhabited places of Mauritania whose name and position are both recorded in the open
gazetteers, and gives a position to the villages that only had their commune's (approx = 1).

    python3 tools/merge-gazetteers.py <geo-sources dir> [--write]
    python3 tools/build-cities.py && python3 tools/build-page.py

Sources (fetched by .github/workflows/geo-sources.yml, branch geo-sources):
  - GeoNames, full dump MR.txt + alternate names (CC-BY-4.0): feature class P, except abandoned / historical /
    destroyed places (PPLQ, PPLH, PPLW) and sections of a town (PPLX).
  - OpenStreetMap (Geofabrik extract, ODbL): place = city / town / village / hamlet / isolated_dwelling with a name.
A place found in both (close Latin name, under 3 km) is one place; the OSM point is kept (OSM traces from imagery,
GeoNames points are often rounded to the minute).

Against the app's places:
  - a place that is already listed (a commune seat or a village with a position, close name, under 4 km; or under
    1.5 km with a loosely similar name; or its GeoNames id) is skipped;
  - a village with approx = 1 whose name matches a gazetteer place lying in or next to its commune (nearest-commune
    vote, or under 60 km from the commune's seat) gets that position (approx cleared), keeping its id and Arabic name;
  - every other place is added: id v<GeoNames id> or o<n|w><OSM id>, the Arabic name from the source (OSM name:ar,
    GeoNames alternate name in Arabic) or else transliterated from the Latin one like the other villages (the owner
    checks them), and the commune that most of the nearby positioned villages belong to (else the nearest seat).
Writes tools/gazetteer-report.tsv (what was added or positioned, with its source) for checking.
"""
import csv, collections, difflib, gzip, json, math, pathlib, re, sys, unicodedata, importlib.util
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path(sys.argv[1]); WRITE = '--write' in sys.argv
spec = importlib.util.spec_from_file_location('tr', ROOT / 'tools/translit-villages-rules.py'); tr = importlib.util.module_from_spec(spec); spec.loader.exec_module(tr)

nz = lambda s: re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower())
def sk(x):
    x = nz(x)
    for a, b in [('dj', 'j'), ('tch', 'c'), ('ch', 'c'), ('kh', 'x'), ('gh', 'g'), ('ou', 'w'), ('th', 't'), ('dh', 'd'),
                 ('y', 'i'), ('q', 'g'), ('k', 'g'), ('v', 'f'), ('p', 'b'), ('e', 'a')]:
        x = x.replace(a, b)
    x = re.sub(r'^(al|el|l)(?=[bcdfgjlmnrstwxz])', '', x)
    x = x[:1] + re.sub(r'[aeiou]', '', x[1:])
    return re.sub(r'(.)\1+', r'\1', x)
def sim(a, b):
    if not nz(a) or not nz(b): return 0
    if sk(a) == sk(b): return 1
    return max(difflib.SequenceMatcher(None, nz(a), nz(b)).ratio(), difflib.SequenceMatcher(None, sk(a), sk(b)).ratio() - .05)
def km(a, b, c, d): return 111.2 * math.hypot(a - c, (b - d) * math.cos(a * math.pi / 180))
isar = lambda s: bool(re.search(r'[ء-ي]', s or ''))
def ar_clean(a):
    a = re.sub(r'[ً-ْـ]', '', a).replace('ھ', 'ه').replace('ڭ', 'گ').replace('ڤ', 'ف')
    return re.sub(r'\s+', ' ', a).strip()
NUM = {'un': '1', 'une': '1', 'deux': '2', 'trois': '3', 'quatre': '4', 'cinq': '5', 'six': '6', 'sept': '7', 'huit': '8',
       'neuf': '9', 'dix': '10', 'i': '1', 'ii': '2', 'iii': '3', 'iv': '4'}
WORDS = {}   # Latin word -> the Arabic word the app's villages (checked by the owner) use for it most often
def learn_words(vil):
    d = collections.defaultdict(collections.Counter)
    for v in vil:
        f = [nz(x) for x in re.split(r'[\s\-]+', v['fr']) if nz(x)]; a = v['ar'].split()
        if len(f) == len(a) and len(f) > 1:
            for x, y in zip(f, a):
                if re.fullmatch(r'[\u0621-\u064a\u06a4\u06af]+', y): d[x][y] += 1
    for x, c in d.items():
        y, n = c.most_common(1)[0]
        if n >= 3 and n >= .7 * sum(c.values()): WORDS[x] = y
def translit(fr):
    fr = re.sub(r"\b([EeAa]l)[\s\-]+(?=\w)", r"\1", fr)   # El Rhao -> Elrhao (the article joins its word)
    w = [x for x in re.split(r"[\s\-/]+", tr.fold(fr)) if x]
    out = []
    for x in w:
        k = nz(x)
        if k in NUM and out: out.append(NUM[k])
        elif k.isdigit(): out.append(k)
        elif k in WORDS: out.append(WORDS[k])
        else: out.append(tr.tok(x))
    return ' '.join(out).replace('  ', ' ').strip()
def latin(s):  # a Latin name: Title case, no stray spaces
    return re.sub(r'\s+', ' ', s).strip()

com = list(csv.DictReader(open(ROOT / 'tools/communes.tsv', encoding='utf-8'), delimiter='\t'))
vil = list(csv.DictReader(open(ROOT / 'tools/villages.tsv', encoding='utf-8'), delimiter='\t'))
fields = list(vil[0].keys()); learn_words(vil)
C = {c['id']: c for c in com}
for c in com: c['lat'], c['lng'] = float(c['lat']), float(c['lng'])

# ---- the country and its wilayas (OSM boundaries): places outside Mauritania are left out, and a new place goes to
# a commune of the wilaya it lies in
def rings(g):
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    out = []
    for poly in polys:
        for k, r in enumerate(poly):
            xs = [p[0] for p in r]; ys = [p[1] for p in r]
            out.append((k == 0, (min(xs), min(ys), max(xs), max(ys)), r))
    return out
def inside(rs, lat, lng):
    n = 0
    for outer, (x0, y0, x1, y1), r in rs:
        if not (x0 <= lng <= x1 and y0 <= lat <= y1): continue
        c = False; j = len(r) - 1
        for i in range(len(r)):
            xi, yi = r[i]; xj, yj = r[j]
            if (yi > lat) != (yj > lat) and lng < (xj - xi) * (lat - yi) / (yj - yi) + xi: c = not c
            j = i
        if c: n += 1
    return n % 2 == 1
WNAME = {'Adrar': 'آدرار', 'Inchiri': 'إينشيري', 'الترارزة': 'اترارزة', 'Chargui': 'الحوض الشرقي', 'Gharbi': 'الحوض الغربي',
         'Tagant': 'تكانت', 'Tiris': 'تيرس زمور', 'Nouadhibou': 'داخلة نواذيبو', 'Gorgol': 'كوركول', 'Guidimaka': 'كيدي ماغا',
         'Brakna': 'لبراكنة', 'Assaba': 'لعصابة', 'الجنوبية': 'نواكشوط الجنوبية', 'الشمالية': 'نواكشوط الشمالية', 'Ouest': 'نواكشوط الغربية'}
COUNTRY = None; WIL = []
for f in json.load(open(SRC / 'mr-boundary.geojson', encoding='utf-8'))['features']:
    nm = f['properties'].get('name', '')
    if 'موريتانيا' in nm: COUNTRY = rings(f['geometry']); continue
    w = next((v for k, v in WNAME.items() if k in nm), None)
    assert w, nm
    WIL.append((w, rings(f['geometry'])))
def wilaya_of(lat, lng): return next((w for w, rs in WIL if inside(rs, lat, lng)), None)

# ---- gazetteer places
alt = collections.defaultdict(list)
for l in gzip.open(SRC / 'MR-alternatenames.txt.gz', 'rt', encoding='utf-8'):
    r = l.rstrip('\n').split('\t')
    if r[2] == 'ar' and isar(r[3]) and not (len(r) > 7 and r[7] == '1'): alt[r[1]].append((r[4] == '1', r[3]))
gaz = []
for l in open(SRC / 'MR.txt', encoding='utf-8'):
    r = l.rstrip('\n').split('\t')
    if r[6] != 'P' or r[7] in ('PPLQ', 'PPLH', 'PPLW', 'PPLX'): continue
    a = sorted(alt.get(r[0], []), reverse=True)
    gaz.append(dict(src='geonames', id='v' + r[0], fr=latin(r[1]), alts=[r[2]] + r[3].split(',')[:12], ar=ar_clean(a[0][1]) if a else '',
                    lat=float(r[4]), lng=float(r[5]), kind=r[7], gid=r[0]))
osm = []
for l in gzip.open(SRC / 'osm-places.geojsonseq.gz', 'rt', encoding='utf-8'):
    l = l.strip('\x1e\n')
    if not l: continue
    f = json.loads(l); p = f['properties']
    if p.get('place') not in ('city', 'town', 'village', 'hamlet', 'isolated_dwelling'): continue
    nm = p.get('name:fr') or p.get('name:en') or p.get('name:latin') or ('' if isar(p.get('name')) else p.get('name', ''))
    a = p.get('name:ar') or (p.get('name') if isar(p.get('name')) else '')
    if not nm and not a: continue
    g = f['geometry']
    if g['type'] == 'Point': lng, lat = g['coordinates']
    else:
        pts = [q for ring in (g['coordinates'] if g['type'] == 'Polygon' else [r for poly in g['coordinates'] for r in poly]) for q in ring]
        lng = sum(q[0] for q in pts) / len(pts); lat = sum(q[1] for q in pts) / len(pts)
    osm.append(dict(src='osm', id='o' + p['@type'][0] + str(p['@id']), fr=latin(nm), alts=[p.get(k, '') for k in ('name', 'alt_name', 'old_name', 'name:fr', 'name:en')],
                    ar=ar_clean(a) if a else '', lat=lat, lng=lng, kind=p['place'], gid=p.get('geonames:id') or p.get('ref:geonames') or ''))
CAPE = re.compile(r"^(cap|pointe|faux cap|ras|baie|ile|île|presqu)", re.I)
n0 = len(gaz) + len(osm)
gaz = [x for x in gaz if inside(COUNTRY, x['lat'], x['lng'])]
osm = [x for x in osm if inside(COUNTRY, x['lat'], x['lng']) and not CAPE.search(x['fr'])]
print('gazetteer: geonames', len(gaz), ' osm', len(osm), ' (left out, outside the country or a cape:', n0 - len(gaz) - len(osm), ')')

def names(x): return [n for n in [x['fr']] + x.get('alts', []) if n and not isar(n)]
def best_sim(x, y): return max([sim(a, b) for a in names(x) for b in names(y)] or [0])

# grid index
def cell(lat, lng): return (int(lat * 10), int(lng * 10))
def near(idx, lat, lng, r_km):
    d = int(r_km / 11) + 1; ci, cj = cell(lat, lng)
    for i in range(ci - d, ci + d + 1):
        for j in range(cj - d, cj + d + 1):
            for o in idx.get((i, j), []):
                k = km(lat, lng, o['lat'], o['lng'])
                if k <= r_km: yield k, o
def index(items):
    idx = collections.defaultdict(list)
    for o in items: idx[cell(o['lat'], o['lng'])].append(o)
    return idx

# merge OSM into GeoNames
gi = index(gaz); merged = list(gaz); used = set()
for o in osm:
    m = None
    if o['gid']:
        m = next((g for g in gaz if g['gid'] == str(o['gid'])), None)
    if not m:
        c = sorted((k, -best_sim(o, g), g['id'], g) for k, g in near(gi, o['lat'], o['lng'], 3) if best_sim(o, g) >= .75 and g['id'] not in used)
        m = c[0][3] if c else None
    if m:
        used.add(m['id']); m['lat'], m['lng'] = o['lat'], o['lng']; m['src'] = 'geonames+osm'
        m['ar'] = o['ar'] or m['ar']; m['alts'] = m['alts'] + names(o); m['kind'] += '/' + o['kind']
    else:
        merged.append(o)
# duplicates inside GeoNames itself (same name, under 2 km)
out = []; oi = collections.defaultdict(list)
for x in merged:
    if any(best_sim(x, y) >= .85 for k, y in near(oi, x['lat'], x['lng'], 2)): continue
    out.append(x); oi[cell(x['lat'], x['lng'])].append(x)
gaz = out
print('gazetteer places after merging the two sources:', len(gaz)); gzi = index(gaz)
def num(n):
    m = [NUM.get(nz(t), nz(t)) for t in re.split(r'[\s\-]+', n or '') if nz(t)]
    return m[-1] if m and m[-1].isdigit() else ''

# ---- the app's places
known = []
for c in com: known.append(dict(id=c['id'], fr=c['fr'], alts=[], lat=c['lat'], lng=c['lng'], seat=True, com=c['id']))
for v in vil:
    if v['approx'] != '1': known.append(dict(id=v['id'], fr=v['fr'], alts=[], lat=float(v['lat']), lng=float(v['lng']), com=v['commune']))
ki = index(known)
ids = set(v['id'] for v in vil) | set(c['id'] for c in com)
approx = collections.defaultdict(list)
for v in vil:
    if v['approx'] == '1': approx[v['commune']].append(v)

def commune_of(lat, lng):
    w = wilaya_of(lat, lng)
    pool = [c for c in com if c['id'] != 'nkc' and (c['wilaya'] == w or not w)] or com
    d0 = min(km(lat, lng, c['lat'], c['lng']) for c in pool)
    ok = {c['id'] for c in pool if km(lat, lng, c['lat'], c['lng']) <= 1.5 * d0 + 10}
    vote = collections.Counter()
    for k, o in near(ki, lat, lng, 25):
        if o['com'] in ok: vote[o['com']] += 1 / (1 + k)
    if vote: return vote.most_common(1)[0][0]
    return min(pool, key=lambda c: km(lat, lng, c['lat'], c['lng']))['id']

rep = []; added = []; placed = {}
skipped = collections.Counter()
for x in gaz:
    if x['id'] in ids: skipped['same id'] += 1; continue
    dup = False
    for k, o in near(ki, x['lat'], x['lng'], 4):
        s = best_sim(x, o)
        if s >= .78 or (k <= 1.5 and s >= .5) or (not names(x) and k <= 1.5):
            dup = True; break
    if not dup:   # a commune's own name (Tevragh Zeina, Riyad…) is the commune, not a village of it
        dup = any(best_sim(x, dict(fr=c['fr'], alts=[c['moughataa_fr']])) >= .85 for c in com if km(x['lat'], x['lng'], c['lat'], c['lng']) < 30)
    if dup: skipped['already listed'] += 1; continue
    cm = commune_of(x['lat'], x['lng'])
    # a village of this commune (or a neighbouring one) known only approximately?
    cands = []
    for cid in {cm} | {c['id'] for c in com if km(x['lat'], x['lng'], c['lat'], c['lng']) < 25}:
        if km(x['lat'], x['lng'], C[cid]['lat'], C[cid]['lng']) > 45 or C[cid]['wilaya'] != (wilaya_of(x['lat'], x['lng']) or C[cid]['wilaya']): continue
        for v in approx.get(cid, []):
            if v['id'] in placed: continue
            s = best_sim(x, dict(fr=v['fr'], alts=[]))
            if s >= .85 and num(v['fr']) == num(x['fr']): cands.append((-s, cid != cm, v['id'], v))
    # a name met more than once around there (Dar Essalam, Baghdad…) cannot tell which village it is: neither
    # positioned nor added (it is most likely that village)
    if cands:
        cands.sort()
        twins = sum(1 for k, y in near(gzi, x['lat'], x['lng'], 60) if y is not x and best_sim(x, y) >= .85)
        if twins or len({c[2] for c in cands if c[0] == cands[0][0]}) > 1:
            skipped['ambiguous name'] += 1; continue
        v = cands[0][3]
        placed[v['id']] = x
        rep.append(['positioned', v['id'], v['ar'], v['fr'], x['src'], x['id'], x['fr'], f"{x['lat']:.5f}", f"{x['lng']:.5f}", C[v['commune']]['ar']])
        continue
    if any(best_sim(x, dict(fr=v['fr'], alts=[])) >= .8 for cid in {cm} | {c['id'] for c in com if km(x['lat'], x['lng'], c['lat'], c['lng']) < 25}
           for v in approx.get(cid, []) if v['id'] not in placed):
        skipped['like an unpositioned village'] += 1; continue
    if not names(x) and not x['ar']: skipped['no name'] += 1; continue
    ar = x['ar'] or translit(x['fr'])
    nid = x['id'] if x['src'] != 'osm' else x['id']
    seat = C[cm]
    v = dict(id=nid, ar=ar, fr=x['fr'] or ar, lat=f"{x['lat']:.4f}", lng=f"{x['lng']:.4f}", commune=cm,
             km=f"{km(x['lat'], x['lng'], seat['lat'], seat['lng']):.1f}", approx='', ansade='')
    added.append(v); ids.add(nid)
    known.append(dict(id=nid, fr=v['fr'], alts=names(x), lat=x['lat'], lng=x['lng'], com=cm)); ki[cell(x['lat'], x['lng'])].append(known[-1])
    rep.append(['added', nid, ar, v['fr'], x['src'], x['id'], ('ar from source' if x['ar'] else 'ar transliterated'), v['lat'], v['lng'], seat['ar']])

print('skipped:', dict(skipped))
print('approximate villages positioned:', len(placed), 'of', sum(len(a) for a in approx.values()))
print('places added:', len(added), ' with an Arabic name from the source:', sum(1 for r in rep if r[0] == 'added' and r[6] == 'ar from source'))
print('by source:', collections.Counter(r[4] for r in rep if r[0] == 'added'))
if WRITE:
    for v in vil:
        if v['id'] in placed:
            x = placed[v['id']]; c = C[v['commune']]
            v['lat'], v['lng'], v['approx'] = f"{x['lat']:.4f}", f"{x['lng']:.4f}", ''
            v['km'] = f"{km(x['lat'], x['lng'], c['lat'], c['lng']):.1f}"
    # new villages go after the others of their commune (the list keeps its order)
    order = [c['id'] for c in com]
    allv = vil + added
    allv.sort(key=lambda v: order.index(v['commune']) if v['commune'] in order else 9999)  # stable: old order kept
    with open(ROOT / 'tools/villages.tsv', 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields, delimiter='\t', lineterminator='\n'); w.writeheader(); w.writerows(allv)
    with open(ROOT / 'tools/gazetteer-report.tsv', 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f, delimiter='\t', lineterminator='\n')
        w.writerow(['what', 'id', 'ar', 'fr', 'source', 'source id', 'note', 'lat', 'lng', 'commune'])
        w.writerows(rep)
    print('written')
