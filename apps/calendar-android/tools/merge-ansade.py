#!/usr/bin/env python3
"""Merges the ANSADE register of inhabited places (census 2023, prepared by the app owner as a spreadsheet:
ANSADE id, Arabic name, Latin name, wilaya, moughataa, commune, lat, lng from GeoNames/OSM when one point matched)
into tools/villages.tsv.

    python3 tools/merge-ansade.py register.xlsx && python3 tools/build-cities.py && python3 tools/build-page.py

- A place that is already in villages.tsv (same commune or within 5 km, a close Latin name, and under 4 km apart when
  both have a position) keeps its id and its Arabic name (the owner has been correcting them); it gets the register's
  commune, and its position when it had none.
- A place that is the commune's own seat is skipped.
- A new place gets the id a<ANSADE id>, the register's Arabic name (empty when the register has none: the app then
  shows the Latin name), and the register's position; with none, the commune's position and approx = 1.
"""
import csv, difflib, math, pathlib, re, sys, unicodedata, collections
import openpyxl
ROOT = pathlib.Path(__file__).resolve().parent.parent
nz = lambda s: re.sub(r'[^a-z]', '', unicodedata.normalize('NFKD', str(s or '')).encode('ascii', 'ignore').decode().lower())
sim = lambda a, b: difflib.SequenceMatcher(None, nz(a), nz(b)).ratio()
def sk(x):   # consonant skeleton of a Latin name, for spellings like Iwik / Iouîk, Moinita / Mouénité
    x = nz(x)
    for a, b in [('dj', 'j'), ('tch', 'c'), ('ch', 'c'), ('kh', 'x'), ('gh', 'g'), ('ou', 'w'), ('th', 't'), ('dh', 'd'),
                 ('y', 'i'), ('q', 'g'), ('k', 'g'), ('v', 'f'), ('p', 'b')]:
        x = x.replace(a, b)
    x = x[:1] + re.sub(r'[aeiou]', '', x[1:])
    return re.sub(r'(.)\1+', r'\1', x)
def clean_ar(ar, fr):
    """The register's Arabic name, in the app's spelling (ه for ھ, گ for ڭ, no tatweel), or '' when it looks cut
    short in the register (a stray last fragment, or far fewer letters than the Latin name has consonants)."""
    a = re.sub(r'\u0640\s+\u0640', '', ar or '').replace('\u0640', '').replace('\u06be', 'ه').replace('\u06ad', 'گ')
    a = re.sub(r'[(){}+]', '', a)
    a = re.sub(r'\s+', ' ', a).strip()
    if not a: return ''
    letters = len(re.sub(r'[^\u0621-\u06ff]', '', a))
    last = a.split(' ')[-1]
    if (len(a.split(' ')) > 1 and len(last) <= 2 and last not in ('ول', 'ام', 'اب', 'أم')) or letters < 0.85 * len(sk(fr)):
        return ''
    n = re.search(r'(\d+)\s*$', fr or '')   # Balawa 1, Balawa 2: the register's Arabic drops the number
    return a + ' ' + n.group(1) if n and not re.search(r'\d', a) else a
def km(a, b, c, d): return 111.2 * math.hypot(a - c, (b - d) * math.cos(a * math.pi / 180))

com = list(csv.DictReader(open(ROOT / 'tools/communes.tsv', encoding='utf-8'), delimiter='\t'))
vil = list(csv.DictReader(open(ROOT / 'tools/villages.tsv', encoding='utf-8'), delimiter='\t'))
C = {c['id']: c for c in com}
rows = [r for r in list(openpyxl.load_workbook(sys.argv[1], read_only=True).worksheets[0].iter_rows(values_only=True))[1:] if r[0]]

# moughataa of the register -> the app's moughataa (by its French name)
appm = sorted(set(c['moughataa_fr'] for c in com if c['moughataa_fr']))
mm = {m: max(appm, key=lambda a: sim(m, a)) for m in set(r[5] for r in rows)}
# commune of the register -> the app's commune: best name match, then the remaining ones of the moughataa by
# elimination, or by the nearest commune to the register's places when several remain
cm = {}
for m in set(r[5] for r in rows):
    fcs = sorted(set(r[6] for r in rows if r[5] == m))
    acs = [c for c in com if c['moughataa_fr'] == mm[m]]
    pairs = sorted(((sim(f, a['fr']), f, a['id']) for f in fcs for a in acs), reverse=True)
    for s, f, a in pairs:
        if s >= 0.6 and (m, f) not in cm and a not in cm.values():
            cm[(m, f)] = a
    left_f = [f for f in fcs if (m, f) not in cm]
    left_a = [a for a in acs if a['id'] not in cm.values()]
    for f in left_f:
        pts = [(r[7], r[8]) for r in rows if r[5] == m and r[6] == f and r[7] is not None]
        if not left_a or len(left_a) == 1 or not pts:
            a = left_a[0] if left_a else max(acs, key=lambda a: sim(f, a['fr']))
        else:
            la, lo = sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)
            a = min(left_a, key=lambda a: km(la, lo, float(a['lat']), float(a['lng'])))
        cm[(m, f)] = a['id']
        if a in left_a: left_a.remove(a)
        print(f'commune {m} / {f} -> {a["fr"]} ({a["ar"]})')

# the seats of communes whose register name differs from the commune's (the owner's notes, 13 Nov 2026): skipped like the others
SEATS = {'c128': 'Nouawdar', 'c293': "N'Beike", 'c299': 'Nimlane', 'c245': 'Elbatha'}
out = {v['id']: dict(v) for v in vil}
stats = collections.Counter()
for r in rows:
    aid, fr, lat, lng = str(r[0]), (r[2] or '').strip(), r[7], r[8]
    ar = clean_ar(r[1], fr); stats['ar-dropped'] += bool(r[1]) and not ar
    cid = cm[(r[5], r[6])]; c = C[cid]
    clat, clng = float(c['lat']), float(c['lng'])
    if (sim(fr, c['fr']) >= 0.85 or sim(fr, SEATS.get(cid, '')) >= 0.85) and (lat is None or km(lat, lng, clat, clng) < 5):
        stats['seat'] += 1; continue
    best = None
    for v in out.values():
        if v['id'].startswith('a'): continue
        vl, vg = float(v['lat']), float(v['lng'])
        near = v['commune'] == cid or km(vl, vg, clat, clng) < 5 or (lat is not None and km(lat, lng, vl, vg) < 5)
        if not near: continue
        d = km(lat, lng, vl, vg) if lat is not None and not v.get('approx') else None
        s = max(sim(fr, v['fr']), 1.0 if ar and ar == v['ar'] else 0,
                difflib.SequenceMatcher(None, sk(fr), sk(v['fr'])).ratio() if d is not None and d < 1.5 else 0)
        if s < 0.75 or (d is not None and d > 4): continue
        if not best or s > best[0]: best = (s, v)
    if best:
        v = best[1]; stats['known'] += 1
        v['commune'] = cid; v['ansade'] = aid
        if v.get('approx') and lat is not None:
            v['lat'], v['lng'], v['approx'] = f'{lat:.4f}', f'{lng:.4f}', ''
        continue
    stats['new'] += 1; stats['new-no-ar'] += not ar; stats['new-no-pos'] += lat is None
    out['a' + aid] = {'id': 'a' + aid, 'ar': ar, 'fr': fr,
                      'lat': f'{lat:.4f}' if lat is not None else c['lat'], 'lng': f'{lng:.4f}' if lat is not None else c['lng'],
                      'commune': cid, 'km': '', 'approx': '' if lat is not None else '1', 'ansade': aid}
for v in out.values():
    c = C[v['commune']]
    v['km'] = f"{km(float(v['lat']), float(v['lng']), float(c['lat']), float(c['lng'])):.1f}"
order = {c['id']: i for i, c in enumerate(com)}
res = sorted(out.values(), key=lambda v: (order[v['commune']], v['ar'] or v['fr']))
f = ['id', 'ar', 'fr', 'lat', 'lng', 'commune', 'km', 'approx', 'ansade']
with open(ROOT / 'tools/villages.tsv', 'w', encoding='utf-8', newline='') as fo:
    w = csv.DictWriter(fo, f, delimiter='\t', lineterminator='\n', extrasaction='ignore'); w.writeheader(); w.writerows(res)
print(dict(stats), 'villages now:', len(res))
