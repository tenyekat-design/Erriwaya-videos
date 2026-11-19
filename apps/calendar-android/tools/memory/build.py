#!/usr/bin/env python3
"""Builds assets/data/memory.js from the supplied database (mauritania_memory.json, kept as sent) and the articles
written for it (articles.json: {id: {summary, facts: [[label, value]], body: [paragraph, ...]}}).
A summary replaces the database's one-line description; facts and body are shown under «اقرأ القصة كاملة»."""
import json, os
H = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(H, 'mauritania_memory.json'), encoding='utf-8'))
a = json.load(open(os.path.join(H, 'articles.json'), encoding='utf-8')) if os.path.exists(os.path.join(H, 'articles.json')) else {}
ids = {e['id'] for e in d['events'] + d['heritage_features']}
unknown = set(a) - ids
assert not unknown, unknown
n = 0
for e in d['events'] + d['heritage_features']:
    x = a.get(e['id'])
    if not x: continue
    if x.get('summary'): e['description'] = x['summary']
    if x.get('facts'): e['facts'] = x['facts']
    if x.get('body'): e['body'] = x['body']; n += 1
out = os.path.join(H, '..', '..', 'assets', 'data', 'memory.js')
open(out, 'w', encoding='utf-8').write('DATA_LOADED("memory",' + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ')\n')
print(f'{n} articles of {len(ids)} items -> assets/data/memory.js')
