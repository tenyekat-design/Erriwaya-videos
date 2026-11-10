#!/usr/bin/env python3
"""Builds what the mushaf needs to follow a recitation verse by verse:

  assets/data/tm-<read>.js   when each verse starts in a reciter's recording of each sura (tenths of a second)
  assets/data/rg-qaloon.js   where each verse lies on the Qalun page images (rectangles, one per line it covers)

    python3 tools/build-sync.py TIMINGS_DIR [QALUN_PAGES_DIR]

TIMINGS_DIR is `timings/` of https://github.com/iptvchecker/content-mp3quran : MP3Quran's own verse timings for seven
recordings (Warsh: 120 al-Husary, 14 Yassin, 16 al-Koshi, 80 al-Qazabri; Qalun: 208 ad-Dokali, 75 al-Hudhaify,
270 al-Husary), one file per sura. Each entry also carries the verse's outline on MP3Quran's own page drawing.
For the Qalun recordings that drawing is the same Madinah Qalun mushaf as the app's page images, so the outlines
are carried onto the images by a straight scale and shift (fitted on the verse-end markers found in the images,
QALUN_PAGES_DIR: 001.jpg … 604.jpg as in PAGESRC.qaloon) and used as the map of where the text lies; the verses
themselves are cut at the printed markers (see regions()). The two opening pages have their own artwork and are left out.
A verse that runs over two pages has rectangles on both.

Rectangles are in pixels of the 976-pixel-wide page image, measured from its left and bottom edges (the images
differ in height by a few pixels at the top): [left, bottom, width, height]. Needs numpy, scipy, Pillow.
"""
import glob, json, pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
READS = {'120': 'warsh', '14': 'warsh', '16': 'warsh', '80': 'warsh', '208': 'qaloon', '75': 'qaloon', '270': 'qaloon'}
AX, BX, AY, BY = 2.3927, 83.20, 2.3627, 1422.62          # image x = BX + AX*x ; image y from the bottom = BY - AY*y

def sura_file(tdir, read, n):
    return json.load(open(glob.glob(f'{tdir}/{read}/*/{n:03d}.json')[0], encoding='utf-8'))

def timings(tdir):
    for read in READS:
        out = []
        for n in range(1, 115):
            d = [e for e in sura_file(tdir, read, n) if e['ayah'] >= 1]
            assert [e['ayah'] for e in d] == list(range(1, len(d) + 1)), (read, n)
            out.append([round(e['start_time'] / 100) for e in d] + [round(d[-1]['end_time'] / 100)])   # … and where the last verse ends
        p = ROOT / f'assets/data/tm-{read}.js'
        p.write_text(f'DATA_LOADED("tm-{read}",' + json.dumps(out, separators=(',', ':')) + ')', encoding='utf-8')
        print(p.name, p.stat().st_size)

def rows(poly):
    """A rectilinear outline -> one [x0, x1, y0, y1] per band between its distinct heights."""
    pts = [tuple(map(float, q.split(','))) for q in poly.split()]
    ys = sorted(set(y for _, y in pts)); out = []
    for y0, y1 in zip(ys, ys[1:]):
        ym = (y0 + y1) / 2
        xs = [a[0] for a, b in zip(pts, pts[1:] + pts[:1]) if a[0] == b[0] and min(a[1], b[1]) < ym < max(a[1], b[1])]
        if len(xs) >= 2 and max(xs) - min(xs) > 1:
            out.append([min(xs), max(xs), y0, y1])
    return out

def markers(path):
    import numpy as np
    from PIL import Image
    from scipy import ndimage as nd
    im = np.asarray(Image.open(path).convert('RGB')).astype(int)
    lab, _ = nd.label((im[..., 2] - im[..., 0]) > 60); out = []
    for i, sl in enumerate(nd.find_objects(lab)):
        hh, ww = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if 22 <= hh <= 70 and 22 <= ww <= 70 and (lab[sl] == i + 1).sum() > 350:
            out.append(((sl[1].start + sl[1].stop) / 2, im.shape[0] - (sl[0].start + sl[0].stop) / 2, sl[1].start))   # centre x, centre y from bottom, left edge
    return out, im.shape[1]

def regions(tdir, pdir):
    """The timing files number their outlines differently from the mushaf (their times do follow the mushaf's numbering:
    the length of each timed verse tracks the length of the verse's text only when the labels are taken as given). So the
    outlines are used only as the map of where text lies on each page, line by line, and that text is cut into verses
    at the printed verse-end markers found in the image: the n-th marker from page 3 on ends the n-th verse after 2:4."""
    q = (ROOT / 'assets/data/quran-qaloon.js').read_text(encoding='utf-8'); q = json.loads(q[q.index(',') + 1:q.rindex(')')])
    verses = [(i + 1, j + 1) for i, S in enumerate(q['suras']) for j in range(len(S['v']))][11:]     # 1:1–7 and 2:1–4 are on the two opening pages
    polys = {}                                              # page -> [[x0, x1, y0, y1], …] in the drawing's own units
    for n in range(1, 115):
        for e in sura_file(tdir, '208', n):
            if e['ayah'] >= 1 and e.get('page') and e.get('polygon'):
                polys.setdefault(int(re.search(r'(\d+)\.svg', e['page']).group(1)), []).extend(rows(e['polygon']))
    out = {}; g = 0; lost = 0
    for p in range(3, 605):
        ms, w = markers(f'{pdir}/{p:03d}.jpg'); assert w == 976, (p, w)
        # the lines of the page: every height at which some outline starts or ends, close ones taken as one; a band taller
        # than a line and a half (one long verse) is divided evenly
        ys = []
        for y in sorted({v for r in polys[p] for v in r[2:]}):
            if ys and y - ys[-1] < 8: continue
            ys.append(y)
        lines = []
        for y0, y1 in zip(ys, ys[1:]):
            k = max(1, round((y1 - y0) / 36.3))
            lines += [(y0 + (y1 - y0) * i / k, y0 + (y1 - y0) * (i + 1) / k) for i in range(k)]
        text = []                                           # per line: the stretches of text, in image pixels
        for y0, y1 in lines:
            ym = (y0 + y1) / 2; iv = sorted([BX + AX * r[0], BX + AX * r[1]] for r in polys[p] if r[2] - 1 <= ym <= r[3] + 1); merged = []
            for l, r in iv:
                if merged and l <= merged[-1][1] + 3: merged[-1][1] = max(merged[-1][1], r)
                else: merged.append([l, r])
            text.append(merged)
        # a verse begun on the page before has no outline on this page: its lines at the top are added here. With a marker
        # in the blank above the first outlined line, the lines down to that marker are text; with none, the blank is
        # either a sura's title (42.32, and 78.32 with its basmala) or whole lines of text
        gap = lines[0][0] if lines else 547; my = [(BY - m[1]) / AY for m in ms]
        above = [y for y in my if y < gap - 4]
        n = int(max(above) // 36.2) + 1 if above else 0 if min(abs(gap - 78.32), abs(gap - 42.32)) < 3 else round(gap / 36.2)
        if n:
            lines = [(36.2 * i, 36.2 * (i + 1)) for i in range(n)] + lines
            text = [[[BX, BX + AX * 343]] for _ in range(n)] + text
        # Some verses have no outline at all (the drawing numbers its outlines its own way and comes up one short where the
        # two numberings part): a marker that is not on outlined text shows there is text up to it. Lines are added down to
        # such a marker if it lies below the last one, and the text is extended to it from where the outlined text stopped.
        L, R = BX, BX + AX * 343
        for y in sorted((BY - m[1]) / AY for m in ms):
            while lines and y > lines[-1][1] + 4:
                lines.append((lines[-1][1], lines[-1][1] + 36.2)); text.append([])
        at = {}                                             # line -> its markers
        for m in ms:
            y = (BY - m[1]) / AY
            i = min(range(len(lines)), key=lambda i: 0 if lines[i][0] <= y <= lines[i][1] else min(abs(y - lines[i][0]), abs(y - lines[i][1])))
            at.setdefault(i, []).append(m)
        for i in sorted(at):
            for m in sorted(at[i], key=lambda m: -m[0]):
                if any(l - 8 <= m[2] <= r + 8 for l, r in text[i]):
                    continue
                right = [t for t in text[i] if t[0] > m[2]]
                if right:                                   # text on this line stops short of the marker
                    min(right)[0] = m[2] - 3
                else:                                       # nothing outlined to its right: the line from its right end, and the lines above back to the last outlined text
                    text[i].append([m[2] - 3, R]); j = i - 1
                    while j >= 0 and lines[j + 1][0] - lines[j][1] < 12:
                        if text[j]:
                            min(text[j])[0] = L; break
                        text[j] = [[L, R]]; j -= 1
        for i in range(len(text)):
            merged = []
            for l, r in sorted(text[i]):
                if merged and l <= merged[-1][1] + 3: merged[-1][1] = max(merged[-1][1], r)
                else: merged.append([l, r])
            text[i] = merged
        res = {}; used = 0                                  # verse index -> rectangles
        for i, (y0, y1) in enumerate(lines):
            bot, top = BY - AY * y1, BY - AY * y0
            for l, r in sorted(text[i], key=lambda t: -t[1]):              # right to left
                pos = r
                for m in sorted(at.get(i, []), key=lambda m: -m[0]):
                    if l - 8 <= m[2] <= r + 8 and m[2] - 3 < pos:
                        cut = max(l, m[2] - 3)                             # the verse ends at the left edge of its marker
                        res.setdefault(g, []).append([cut, bot, pos - cut, top - bot]); g += 1; used += 1; pos = cut
                if pos - l > 24:                            # what is left of the line starts the next verse (a sliver left of a sura's last marker is nothing)
                    res.setdefault(g, []).append([l, bot, pos - l, top - bot])
        lost += len(ms) - used
        out[p] = [[*verses[k]] + [round(v) for r in rs for v in r] for k, rs in sorted(res.items()) if k < len(verses)]
    print('verses placed', g, 'of', len(verses), '| markers not on a line of text', lost)
    assert g == len(verses), 'the markers found do not add up to the verses'
    f = ROOT / 'assets/data/rg-qaloon.js'
    f.write_text('DATA_LOADED("rg-qaloon",' + json.dumps(out, separators=(',', ':')) + ')', encoding='utf-8')
    print(f.name, f.stat().st_size)

if __name__ == '__main__':
    timings(sys.argv[1])
    regions(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
