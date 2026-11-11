#!/usr/bin/env python3
"""Warsh pages: «المصحف الأثري برواية ورش من طريق الأزرق مع ضبطه بألوان التابعين» (567 pages), from the PDF the
app owner sent (PDF page = mushaf page + 3; PDF pages 4..570 are the mushaf, 587-588 hold the surah index).

  python3 tools/build-warsh-athari.py mushaf.pdf OUTDIR

1. writes OUTDIR/{n}.webp for n = 1..567 (pages 1-2 whole with their artwork, the rest cropped to the printed page,
   1002 px wide). They are pushed to the branch `mushaf-warsh-pages` (folder warsh/) and loaded from GitHub at a
   pinned commit (the url in assets/data/mohammadi.js).
2. writes assets/data/mohammadi.js: pages[sura-1][aya-1] = page where the verse begins, found by detecting the teal
   verse-end medallions on every page (exactly 6214 = the Madani count of the bundled Warsh text) and checked
   against the printed surah index. `old` maps each page of the previous Warsh mushaf (mushaf.ma, 638 pages) to the
   new page, so saved references and reading positions follow the change.
"""
import json, os, re, subprocess, sys
import cv2, numpy as np
from PIL import Image

PDF, OUT = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'assets', 'data')
TMP = os.path.join(OUT, '_tmp'); os.makedirs(TMP, exist_ok=True)

def render(pdfpage, dpi):
    f = os.path.join(TMP, 'p')
    subprocess.run(['pdftoppm', '-r', str(dpi), '-png', '-singlefile', '-f', str(pdfpage), '-l', str(pdfpage), PDF, f],
                   check=True, stderr=subprocess.DEVNULL)
    return f + '.png'

def load(name):
    s = open(os.path.join(DATA, name + '.js'), encoding='utf-8').read()
    return json.loads(s[s.index(',') + 1:s.rindex(')')])

counts = [len(S['v']) for S in load('quran-warsh')['suras']]
old = load('mohammadi')

# ---- verse-end medallions, page by page (100 dpi: 827 x 1170) ----
marks = {}
for n in range(1, 568):
    im = cv2.imread(render(n + 3, 100)).astype(int)
    b, g, r = im[:, :, 0], im[:, :, 1], im[:, :, 2]
    m = ((g - r > 60) & (b - r > 40) & (g > 80) & (abs(g - b) < 70)).astype(np.uint8)
    m = cv2.dilate(m, np.ones((3, 3), np.uint8))
    k, _, st, _ = cv2.connectedComponentsWithStats(m)
    mk = [list(map(int, st[i])) for i in range(1, k)
          if 27 <= st[i][2] <= 38 and 34 <= st[i][3] <= 46 and 1.1 <= st[i][3] / st[i][2] <= 1.45 and 380 <= st[i][4] <= 900]
    mk.sort(key=lambda c: (round((c[1] + c[3] / 2) / 30), -c[0]))  # reading order: line, then right to left
    marks[n] = mk
assert sum(map(len, marks.values())) == sum(counts) == 6214

# ---- printed surah index (surah, page) ----
txt = subprocess.run(['pdftotext', '-f', '587', '-l', '588', PDF, '-'], capture_output=True, text=True).stdout
nums = [int(x) for x in re.findall(r'\d+', txt)]
idx, s, i = {}, 1, 0
while i < len(nums) - 1 and s <= 114:
    if nums[i] == s: idx[s] = nums[i + 1]; s += 1; i += 2
    else: i += 1
idx[101] = idx[102] = 563  # the printed index says 561 for both, a misprint: they follow surah 100 (page 562)

seq = [(s + 1, a + 1) for s in range(114) for a in range(counts[s])]
loc = [(p, j == len(marks[p]) - 1, c) for p in range(1, 568) for j, c in enumerate(marks[p])]
pages = [[0] * c for c in counts]
for k, (s, a) in enumerate(seq):
    if a == 1: pg = idx[s]
    else:
        p, last, c = loc[k - 1]
        # the verse starts on the next page when the previous one ends the page (last medallion, end of the last line)
        pg = p + 1 if last and (p <= 2 or (c[1] >= 950 and c[0] <= 150)) else p
    assert pg <= loc[k][0]
    if a > 1: assert loc[k - 1][0] <= idx.get(s + 1, 567)
    pages[s - 1][a - 1] = pg
flat = [pages[s - 1][a - 1] for s, a in seq]
assert all(x <= y for x, y in zip(flat, flat[1:]))

first = {}
src = old.get('pages') if old.get('count') == 638 else None
if src is None: oldmap = old['old']
else:
    for i, S in enumerate(src):
        for j, p in enumerate(S): first.setdefault(p, (i, j))
    oldmap = [pages[first[p][0]][first[p][1]] if p in first else 0 for p in range(1, 639)]
    for k in range(len(oldmap)):
        if not oldmap[k]: oldmap[k] = oldmap[k - 1]

url = 'https://raw.githubusercontent.com/tenyekat-design/Erriwaya-videos/8c1a6dbbbcaa41a51b635036c238c4be689339bf/warsh/{n}.webp'
with open(os.path.join(DATA, 'mohammadi.js'), 'w', encoding='utf-8') as f:
    f.write('DATA_LOADED("mohammadi",%s);\n' % json.dumps({'pages': pages, 'count': 567, 'url': url, 'offset': 0, 'old': oldmap},
                                                          separators=(',', ':')))

# ---- page images ----
for n in range(1, 568):
    im = Image.open(render(n + 3, 150)).convert('RGB')  # 1241 x 1754
    if n > 2: im = im.crop((123, 36, 1125, 1689))
    im.save(os.path.join(OUT, f'{n}.webp'), quality=80, method=6)
print('6214 verses on 567 pages; images in', OUT)
