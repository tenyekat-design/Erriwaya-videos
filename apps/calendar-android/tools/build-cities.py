#!/usr/bin/env python3
"""Writes the city table (`const WILAYAS=[…];`) of web/index-source.html from tools/communes.tsv.

    python3 tools/build-cities.py && python3 tools/build-page.py

communes.tsv has one row per commune (238, plus Nouakchott as a whole), in the order they are listed:
    code       P-code of the commune (MR01xxx), from the open data set below
    id         the id the app stores for the chosen city; never change one, a saved choice would be lost
    ar, fr     the name shown, and the French name shown under it and used by the search
    lat, lng   where the prayer times are computed
    source     where lat/lng come from:
                 app       the app's own table of the main towns
                 geonames  the town's point in GeoNames
                 known     entered by hand
                 centre    the commune's centre point from the data set, not its main village; it can be tens of
                           kilometres off in the large desert communes, so the app marks these places as approximate
    wilaya, moughataa, moughataa_fr

The list of communes, their P-codes and the centre points are from
https://github.com/open-admin-data/mauritania-administrative-divisions (CC-BY-4.0).
To correct a name or a position, edit communes.tsv and run the two commands above.

villages.tsv adds the villages (917): id (v + GeoNames id; never change one), ar, fr, lat, lng, the id of the commune
it is listed under (the nearest commune centre, `km` away), from the GeoNames populated places of Mauritania
(2014 dump, CC-BY-4.0). The Arabic names were transliterated from the French ones and are being checked by the app
owner; correct them in the `ar` column. Each village follows the communes of its moughataa as
[id, ar, fr, lat, lng, 0, "commune name"].
"""
import csv, json, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
rows = list(csv.DictReader(open(ROOT / 'tools/communes.tsv', encoding='utf-8'), delimiter='\t'))
vil = list(csv.DictReader(open(ROOT / 'tools/villages.tsv', encoding='utf-8'), delimiter='\t'))
ids = [r['id'] for r in rows] + [v['id'] for v in vil]
assert len(ids) == len(set(ids)), 'duplicate id'
tree = []
for r in rows:
    if not tree or tree[-1][0] != r['wilaya']:
        tree.append([r['wilaya'], []])
    ms = tree[-1][1]
    if not ms or ms[-1][0] != r['moughataa']:
        ms.append([r['moughataa'], []])
    c = [r['id'], r['ar'], r['fr'], float(r['lat']), float(r['lng'])]
    if r['source'] == 'centre':
        c.append(1)
    ms[-1][1].append(c)
byc = {}
for v in vil:
    byc.setdefault(v['commune'], []).append(v)
name = {r['id']: r['ar'] for r in rows}
assert all(c in name for c in byc), 'village under an unknown commune'
for w in tree:
    for m in w[1]:
        m[1] += [[v['id'], v['ar'], v['fr'], float(v['lat']), float(v['lng']), 0, name[c[0]]] for c in list(m[1]) for v in byc.get(c[0], [])]
js = 'const WILAYAS=[\n' + ',\n'.join('  ' + json.dumps(w, ensure_ascii=False, separators=(',', ':')) for w in tree) + '\n];'
p = ROOT / 'web/index-source.html'
s = p.read_text(encoding='utf-8')
s, n = re.subn(r'const WILAYAS=\[\n.*?\n\];', lambda m: js, s, count=1, flags=re.S)
assert n == 1
p.write_text(s, encoding='utf-8')
print(len(rows), 'communes,', len(vil), 'villages,', len(tree), 'wilayas')
