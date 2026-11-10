#!/usr/bin/env python3
"""Writes the lunar-mansions table (`const MNZ={…};`) of web/index-source.html from tools/mansions-2026-research.json.

    python3 tools/build-mansions.py && python3 tools/build-page.py

The JSON is the research data set «تقويم المنازل الموريتاني: دورة مرجعية 2026–2027»: the 28 mansions of the project's
reference cycle (it opens with الشرطان on 12 May) with the level of evidence for each date. Its own warnings
(an arithmetic reference cycle, not an observation) are carried into the app word for word and shown with the data.

Climate normals (1991–2020, 13 stations). The file holds them for the 28 periods of the older local calendar and marks
them `active_for_display: false`: they were not aggregated again on this cycle. The two sets of periods are the same
13-day steps two days apart, so the app shows them re-cut onto the cycle's periods here, day by day: each day of a
mansion takes the values of the old period it falls in (rain and rainy days as that period's daily share, temperature,
humidity and wind as a mean over the days). This is an approximation from period means, not a new aggregation from
the daily records.

tools/mansions-lore.tsv holds what goes with each mansion, by its number in this cycle: other names (classical, and the
local ones the research file quotes), its stars (after the Stellarium list of the Arabic lunar stations), the weather
(worded from the climate normals above and the local season names in the research file), the land (farming, herding,
oases) and the sea. The seasonal lines go by the dates of the period; edit the file to correct or add.

What the app keeps per mansion and station: rain total (mm), rainy days >= 1 mm, mean / max / min temperature,
humidity %, wind m/s.
"""
import datetime, json, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
d = json.loads((ROOT / 'tools/mansions-2026-research.json').read_text(encoding='utf-8'))
ms = sorted(d['mansions'], key=lambda m: m['id'])
assert [m['id'] for m in ms] == list(range(1, 29))
md = lambda m: [int(m['start_date'][5:7]), int(m['start_date'][8:10])]
D = lambda t: datetime.date.fromisoformat(t)
days = lambda a, b: [a + datetime.timedelta(n) for n in range((b - a).days + 1)]
# the old periods, by month and day
st = d['stations']
old = {}                                   # (month, day) -> {station id: row}
for c in d['climate_by_mansion_station']:
    for t in days(D(c['segment_start_2026']), D(c['segment_end_inclusive'])):
        old.setdefault((t.month, t.day), {})[c['station_id']] = c
assert len(old) == 365
span = lambda c: (D(c['segment_end_inclusive']) - D(c['segment_start_2026'])).days + 1
def climate(m, sid):
    ds = [old[(t.month, t.day)][sid] for t in days(D(m['start_date']), D(m['end_date_inclusive']))]
    share = lambda k: round(sum(c[k] / span(c) for c in ds), 2)
    mean = lambda k: round(sum(c[k] for c in ds) / len(ds), 1)
    return [share('precipitation_30y_mean_total_mm'), share('rainy_days_ge_1mm_mean_per_year_in_period'),
            mean('temp_avg_c'), mean('temp_max_daily_avg_c'), mean('temp_min_daily_avg_c'), mean('relative_humidity_pct'), mean('wind_speed_m_s')]
# what goes with each mansion (tools/mansions-lore.tsv): other names, its stars, the weather, the land, the sea
import csv
lore = {int(r['id']): [r['aka'], r['stars'], r['air'], r['land'], r['sea']]
        for r in csv.DictReader(open(ROOT / 'tools/mansions-lore.tsv', encoding='utf-8'), delimiter='\t')}
assert sorted(lore) == list(range(1, 29))
out = {
    'label': d['label_ar'],
    'm': [[m['name_ar'], *md(m), *lore[m['id']]] for m in ms],
    'st': [[s_['name_ar'], s_['approx_latitude'], s_['approx_longitude']] for s_ in st],
    'c': [[climate(m, s_['id']) for s_ in st] for m in ms],
}
js = 'const MNZ=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';'
p = ROOT / 'web/index-source.html'
s = p.read_text(encoding='utf-8')
s, n = re.subn(r'const MNZ=\{.*?\};(?=\n)', lambda m: js, s, count=1, flags=re.S)
assert n == 1, 'const MNZ={…}; not found'
p.write_text(s, encoding='utf-8')
print(len(js), 'bytes')
