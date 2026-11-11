#!/usr/bin/env python3
"""Builds assets/data/*.js (Quran Warsh, Sahih al-Bukhari, Muwatta Malik, Hisn al-Muslim) from their sources.

Sources (downloaded into the folder given as argument, default ./src-data):
  Quran, King Fahd Complex texts and fonts: Warsh v10, Qalun v10, Hafs v18 (github.com/thetruetruth/quran-data-kfgqpc);
  basmala of Warsh and Qalun: github.com/fawazahmed0/quran-api (same Complex texts)
  Sahih al-Bukhari and Muwatta Malik (riwayat Yahya al-Laythi), Arabic: github.com/fawazahmed0/hadith-api
  Arabic book titles of both: github.com/AhmedBaset/hadith-json (sunnah.com)
  Hisn al-Muslim (Sa'id al-Qahtani): github.com/rn0x/hisn_almuslim_json
Each data file is a script that calls window.DATA_LOADED(key, payload), so the app loads it with a
<script> tag (works from file:// in the Android WebView, where fetch() of local files does not).
"""
import difflib, json, os, re, sys, urllib.request

SRC = sys.argv[1] if len(sys.argv) > 1 else 'src-data'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'data')
RAW = 'https://raw.githubusercontent.com/'
FILES = {
    'warsh.json': 'thetruetruth/quran-data-kfgqpc/main/warsh/data/warshData_v10.json',
    'warsh.10.woff2': 'thetruetruth/quran-data-kfgqpc/main/warsh/font/warsh.10.woff2',
    'quran-warsh-v8.json': 'fawazahmed0/quran-api/1/editions/ara-quranwarsh.json',
    'qaloon.json': 'thetruetruth/quran-data-kfgqpc/main/qaloon/data/QaloonData_v10.json',
    'qaloon.10.woff2': 'thetruetruth/quran-data-kfgqpc/main/qaloon/font/qaloon.10.woff2',
    'quran-qaloon-v8.json': 'fawazahmed0/quran-api/1/editions/ara-quranqaloon.json',
    'hafs.json': 'thetruetruth/quran-data-kfgqpc/main/hafs/data/hafsData_v18.json',
    'hafs.18.woff2': 'thetruetruth/quran-data-kfgqpc/main/hafs/font/hafs.18.woff2',
    'ara-bukhari.json': 'fawazahmed0/hadith-api/1/editions/ara-bukhari.json',
    'ara-malik.json': 'fawazahmed0/hadith-api/1/editions/ara-malik.json',
    'ab-bukhari.json': 'AhmedBaset/hadith-json/main/db/by_book/the_9_books/bukhari.json',
    'ab-malik.json': 'AhmedBaset/hadith-json/main/db/by_book/the_9_books/malik.json',
    'hisn.json': 'rn0x/hisn_almuslim_json/main/hisn_almuslim.json',
}
os.makedirs(SRC, exist_ok=True)
for name, path in FILES.items():
    p = os.path.join(SRC, name)
    if not os.path.exists(p):
        print('download', path)
        urllib.request.urlretrieve(RAW + path, p)
load = lambda n: json.load(open(os.path.join(SRC, n), encoding='utf-8'))

def write(rel, key, payload):
    p = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write('DATA_LOADED(%s,%s);\n' % (json.dumps(key), json.dumps(payload, ensure_ascii=False, separators=(',', ':'))))

# ---- Quran: Warsh and Qalun (Madani count, 6214 verses) and Hafs (Kufi count, 6236), King Fahd Complex ----
import shutil
RIWAYAT = [  # key, data file, verse count, font file, basmala source
    ('warsh', 'warsh.json', 6214, 'warsh.10.woff2', 'warsh10.woff2'),
    ('qaloon', 'qaloon.json', 6214, 'qaloon.10.woff2', 'qaloon10.woff2'),
    ('hafs', 'hafs.json', 6236, 'hafs.18.woff2', 'hafs18.woff2'),
]
first_page = lambda r: int(str(r['page']).split('-')[0])
for key, src, count, font, font_out in RIWAYAT:
    rows = load(src)
    assert len(rows) == count, (key, len(rows))
    suras, lines = [], [0] * 605
    for r in rows:
        s = r.get('sura_no') or r.get('sora')
        if len(suras) < s:
            suras.append({'n': (r.get('sura_name_ar') or r.get('sora_name_ar')).strip(), 'v': []})
        assert r['aya_no'] == len(suras[s - 1]['v']) + 1, (key, s, r['aya_no'])
        suras[s - 1]['v'].append([r['aya_text'].strip(), first_page(r), r['jozz']])
        for pg in str(r['page']).split('-'):
            lines[int(pg)] = max(lines[int(pg)], int(r['line_end']))
    assert len(suras) == 114
    if key == 'hafs':  # in Hafs the basmala is verse 1 of al-Fatiha; it heads the other suras unnumbered
        basmala = re.sub(r'\s*[\u0660-\u0669]+$', '', suras[0]['v'][0][0])
    else:
        basmala = next(v['text'] for v in load(f'quran-{key}-v8.json')['quran'] if v['chapter'] == 1 and v['verse'] == 1)
    write(f'quran-{key}.js', f'quran-{key}', {'basmala': basmala, 'suras': suras, 'lines': lines})
    os.makedirs(os.path.join(OUT, '..', 'fonts'), exist_ok=True)
    shutil.copy(os.path.join(SRC, font), os.path.join(OUT, '..', 'fonts', font_out))
    print(key, sum(len(x['v']) for x in suras), 'verses, basmala:', basmala)

# ---- Warsh page images and the page of every verse (assets/data/mohammadi.js): tools/build-warsh-athari.py ----

# ---- Hadith collections ----
norm = lambda t: re.sub(r'\s+', ' ', re.sub(r'[^\u0621-\u063A\u0641-\u064A\s\ufffd]', '', t)).strip()
clean = lambda t: re.sub(r'[‎‏]', '', t).replace('\r', '').strip()
for key, src, ab, title in [('bukhari', 'ara-bukhari.json', 'ab-bukhari.json', 'صحيح البخاري'),
                            ('muwatta', 'ara-malik.json', 'ab-malik.json', 'موطأ الإمام مالك (رواية يحيى بن يحيى الليثي)')]:
    d, a = load(src), load(ab)
    secs = d['metadata']['sections']
    names = {c['id']: c['arabic'].strip() for c in a['chapters']}
    for k, v in secs.items():  # the two sources must list the same books in the same order
        if k != '0':
            assert v.strip().lower() == a['chapters'][int(k) - 1]['english'].strip().lower(), (key, k)
    ranges = [(int(k), v['hadithnumber_first'], v['hadithnumber_last'])
              for k, v in d['metadata']['section_details'].items() if k != '0']
    def book_of(h):  # some hadiths carry book 0: place them by the book's number range
        b = h['reference']['book']
        if b:
            return b
        n = h['hadithnumber']  # numbering runs on across books: take the book whose range starts last before n
        return max((a, k) for k, a, z in ranges if a and a <= n)[1]
    # A few texts carry damaged letters (U+FFFD). Never guess a letter: take the same hadith from the
    # sunnah.com source instead, matched by text similarity, or stop the build.
    ab_texts = [clean(x.get('arabic', '')) for x in a['hadiths']]
    ab_norm = [norm(x) for x in ab_texts]
    def repair(n, t):
        key_ = norm(t.replace('\ufffd', ''))
        frag = max(key_.split('\ufffd') if '\ufffd' in key_ else [key_], key=len)
        best = max(((difflib.SequenceMatcher(None, key_, ab_norm[i], autojunk=False).ratio(), i)
                    for i in range(len(ab_norm)) if ab_norm[i][:40] and (key_[:40] in ab_norm[i] or ab_norm[i][:40] in key_)), default=(0, -1))
        if best[0] < 0.9:
            best = max((difflib.SequenceMatcher(None, key_, ab_norm[i], autojunk=False).ratio(), i)
                       for i in range(len(ab_norm)) if abs(len(ab_norm[i]) - len(key_)) < 0.2 * len(key_))
        assert best[0] >= 0.9, (key, n, best)
        print(f'  {key} {n}: damaged letters, replaced by the sunnah.com text (similarity {best[0]:.3f})')
        return ab_texts[best[1]]
    books = {}
    for h in d['hadiths']:
        t = clean(h['text'])
        if not t:
            continue
        if '\ufffd' in t:
            t = repair(h['hadithnumber'], t)
            assert '\ufffd' not in t
        books.setdefault(book_of(h), []).append([h['hadithnumber'], t])
    for hs in books.values():
        hs.sort(key=lambda x: x[0])
    index = []
    for b in sorted(books):
        hs = books[b]
        index.append([b, names[b], len(hs), hs[0][0], hs[-1][0]])
        write(f'{key}/{b}.js', f'{key}/{b}', hs)
    write(f'{key}/index.js', f'{key}/index', {'title': title, 'books': index})
    print(key, len(index), 'books', sum(len(v) for v in books.values()), 'hadiths')

# ---- Hisn al-Muslim ----
h = load('hisn.json')
write('hisn.js', 'hisn', [[k.strip(), [clean(t) for t in v.get('text', []) if clean(t)], [clean(t) for t in v.get('footnote', []) if clean(t)]] for k, v in h.items()])
print('hisn', len(h), 'chapters')
