#!/usr/bin/env python3
"""Writes the lunar-mansions table (`const MNZ={…};`) of web/index-source.html from tools/mansions-2026-research.json.

    python3 tools/build-mansions.py && python3 tools/build-page.py

The JSON is the research data set «التقويم الموريتاني: نسخة بحثية مراجعة 2026»: 28 mansions with their civil dates,
the level of evidence for each date, and 1991–2020 climate normals for each mansion at 13 stations. Its own warnings
(provisional reconstruction, not an observation) are carried into the app word for word and shown with the data.

What the app keeps, per mansion: name, start month and day, evidence level, note; per mansion and station:
rain total (mm), rainy days >= 1 mm, rainy days >= 10 mm, mean / max / min temperature, humidity %, wind m/s.
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
st = d['stations']
clim = {(c['mansion_id'], c['station_id']): c for c in d['climate_by_mansion_station']}
f = ['precipitation_30y_mean_total_mm', 'rainy_days_ge_1mm_mean_per_year_in_period', 'rainy_days_ge_10mm_mean_per_year_in_period',
     'temp_avg_c', 'temp_max_daily_avg_c', 'temp_min_daily_avg_c', 'relative_humidity_pct', 'wind_speed_m_s']
out = {
    'warn': d['display_warning_ar'], 'method': d['calendar_method_ar'], 'basis': d['time_reference_uncertain'],
    'day': d['heritage_day_boundary_note_ar'], 'clim': d['climate_by_mansion_station'][0]['note_ar'],
    'src': [d['sources']['heritage'], d['sources']['heritage_seasons']],
    'st': [[s['name_ar'], s['approx_latitude'], s['approx_longitude']] for s in st],
    'm': [[m['name_ar'], int(m['start_date'][5:7]), int(m['start_date'][8:10]), idx(ev, m['evidence_level_ar']), idx(notes, m['note_ar'])] for m in ms],
    'ev': ev, 'notes': notes,
    'c': [[[clim[(m['id'], s['id'])][k] for k in f] for s in st] for m in ms],
}
js = 'const MNZ=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';'
p = ROOT / 'web/index-source.html'
s = p.read_text(encoding='utf-8')
s, n = re.subn(r'const MNZ=\{.*?\};(?=\n)', lambda m: js, s, count=1, flags=re.S)
assert n == 1, 'const MNZ={…}; not found'
p.write_text(s, encoding='utf-8')
print(len(js), 'bytes')
