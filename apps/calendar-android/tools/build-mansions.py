#!/usr/bin/env python3
"""Writes the lunar-mansions table (`const MNZ={…};`) of web/index-source.html from tools/mansions-2026-research.json.

    python3 tools/build-mansions.py && python3 tools/build-page.py

The JSON is the research data set «تقويم المنازل الموريتاني: دورة مرجعية 2026–2027»: the 28 mansions of the project's
reference cycle (it opens with الشرطان on 12 May) with the level of evidence for each date. Its own warnings
(an arithmetic reference cycle, not an observation) are carried into the app word for word and shown with the data.

Also kept, apart from the cycle: the local anchors quoted from the heritage source (`local_heritage_calendar_legacy`,
only the entries the file marks as quoted). The climate normals are NOT taken: the file marks them
`active_for_display: false`, because they were aggregated on the older local calendar, not on this cycle.
"""
import json, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
d = json.loads((ROOT / 'tools/mansions-2026-research.json').read_text(encoding='utf-8'))
ms = sorted(d['mansions'], key=lambda m: m['id'])
assert [m['id'] for m in ms] == list(range(1, 29))
ev, notes = [], []
def idx(lst, v):
    if v not in lst:
        lst.append(v)
    return lst.index(v)
assert d['climate_by_mansion_station_alignment']['active_for_display'] is False, 'climate is now aligned: decide whether to show it'
md = lambda m: [int(m['start_date'][5:7]), int(m['start_date'][8:10])]
leg = d['local_heritage_calendar_legacy']
out = {
    'label': d['label_ar'], 'warn': d['display_warning_ar'], 'method': d['calendar_method_ar'], 'basis': d['time_reference_uncertain'],
    'day': d['heritage_day_boundary_note_ar'],
    'src': [d['sources']['heritage'], d['sources']['heritage_seasons']],
    'm': [[m['name_ar'], *md(m), idx(ev, m['evidence_level_ar']), idx(notes, m['note_ar'])] for m in ms],
    'ev': ev, 'notes': notes,
    'legNote': leg['basis_ar'],
    'leg': [[m['name_ar'], *md(m), m['evidence_level_ar']] for m in leg['mansions'] if m['evidence_code'].startswith('quoted')],
}
js = 'const MNZ=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';'
p = ROOT / 'web/index-source.html'
s = p.read_text(encoding='utf-8')
s, n = re.subn(r'const MNZ=\{.*?\};(?=\n)', lambda m: js, s, count=1, flags=re.S)
assert n == 1, 'const MNZ={…}; not found'
p.write_text(s, encoding='utf-8')
print(len(js), 'bytes')
