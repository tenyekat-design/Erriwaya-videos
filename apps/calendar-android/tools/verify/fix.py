#!/usr/bin/env python3
"""Checks and corrects every verse of a book against reference editions, word by word.
    python3 fix.py book.js out.js report.json ref1 [ref2 ...]
- 'ok': the verse's words occur, in order and contiguous, in a reference (vowels, punctuation, alef forms ignored).
- otherwise, when two references (or one, if only one is given, with similarity >= .8) give the same close passage,
  the verse is replaced by it (split into halves where the original was split): 'fixed'.
- the rest: 'check' (left as is, listed for manual review with the closest passages).
"""
import json, re, sys
from difflib import SequenceMatcher
from collections import defaultdict, Counter

HARAKAT = re.compile(r'[ؐ-ًؚ-ٰٟۖ-ۭـ]')
def norm(w):
    w = HARAKAT.sub('', w)
    w = re.sub('[أإآٱ]', 'ا', w).replace('ى', 'ي').replace('ة', 'ه').replace('ؤ', 'ء').replace('ئ', 'ء')
    return w
WORD = re.compile(r'[ء-ي٠-٩ٮ-ۓً-ٰٟـ]+')
def words(t):
    return [(norm(m.group()), m.group()) for m in WORD.finditer(t) if norm(m.group())]

def load_ref(p):
    t = open(p, encoding='utf-8').read()
    t = re.sub(r'#META#[^\n]*', '', t)
    t = re.sub(r'PageV\d+P\d+|\bms\d+\b|\(\d+\)', ' ', t)
    W = words(t)
    idx = defaultdict(list)
    for i, (n, _) in enumerate(W): idx[n].append(i)
    return W, idx

def find(v, ref):
    W, idx = ref
    if not v: return 1.0, [], []
    for i in idx.get(v[0], []):
        if [n for n, _ in W[i:i + len(v)]] == v:
            return 1.0, [n for n, _ in W[i:i + len(v)]], [o for _, o in W[i:i + len(v)]]
    cands = set()
    for k, w in enumerate(v):
        P = idx.get(w, [])
        if 0 < len(P) < 600:
            for i in P: cands.add(i - k)
    best = (0.0, [], [])
    for s in cands:
        for L in (len(v), len(v) + 1, len(v) - 1, len(v) + 2, len(v) - 2):
            a = max(0, s); seg = W[a:a + L]
            r = SequenceMatcher(None, v, [n for n, _ in seg], autojunk=False).ratio()
            if r > best[0]: best = (r, [n for n, _ in seg], [o for _, o in seg])
    return best

def resplit(orig, new_n, new_o):
    """the new words, cut where the original verse was cut (' ... ')"""
    if ' ... ' not in orig: return ' '.join(new_o)
    a = [n for n, _ in words(orig.split(' ... ')[0])]
    full = [n for n, _ in words(orig)]
    cut = len(a)
    sm = SequenceMatcher(None, full, new_n, autojunk=False)
    j = None
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if i1 <= cut <= i2:
            j = j1 + (cut - i1) if tag == 'equal' else (j2 if cut == i2 else j1 + min(cut - i1, j2 - j1)); break
    if j is None or j <= 0 or j >= len(new_o): j = cut
    return ' '.join(new_o[:j]) + ' ... ' + ' '.join(new_o[j:])

NOFIX = '--nofix' in sys.argv
args = [a for a in sys.argv if a != '--nofix']
book, out, rep = args[1:4]
refs = [load_ref(p) for p in args[4:]]
s = open(book, encoding='utf-8').read()
key = json.loads(s[s.index('(') + 1:s.index(',')])
data = json.loads(s[s.index(',') + 1:s.rindex(')')])
C = Counter(); report = []
for ci, ch in enumerate(data):
    for vi, verse in enumerate(ch[1]):
        v = [n for n, _ in words(verse)]
        found = [find(v, r) for r in refs]
        if any(f[0] == 1.0 for f in found):
            C['ok'] += 1; continue
        groups = defaultdict(list)
        for f in found:
            if f[0] >= .6: groups[tuple(f[1])].append(f)
        pick = None
        for g, fs in sorted(groups.items(), key=lambda x: -len(x[1])):
            if len(fs) >= 2 or (len(refs) == 1 and fs[0][0] >= .8):
                pick = fs[0]; break
        if pick and not NOFIX and len(v) <= len(pick[1]) <= len(v) + 1:
            nv = resplit(verse, pick[1], pick[2])
            ch[1][vi] = nv; C['fixed'] += 1
            report.append({'c': ci, 'v': vi, 'st': 'fixed', 'old': verse, 'new': nv})
        else:
            C['check'] += 1
            report.append({'c': ci, 'v': vi, 'st': 'check', 'old': verse, 'refs': [[round(f[0], 2), ' '.join(f[2])] for f in found]})
open(out, 'w', encoding='utf-8').write('DATA_LOADED(' + json.dumps(key) + ',' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ');\n')
json.dump(report, open(rep, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(book.split('/')[-1], dict(C))
