"""يبني ملفات المصحف المضغوطة من بيانات مجمّع الملك فهد (حفص v18 وورش v10) وتفسيرَي الميسّر والجلالين.

المصادر:
  - github.com/thetruetruth/quran-data-kfgqpc  (hafs/data/hafsData_v18.json، warsh/data/warshData_v10.json والخطّان)
  - github.com/fawazahmed0/quran-api            (ara-kingfahadquranc = التفسير الميسّر عن tanzil.net، ara-jalaladdinalmah = الجلالين، info.json)
تشغيل: python3 tools/build_data.py <مجلد البيانات المصدرية> assets/data
"""
import json, os, re, sys, unicodedata
from collections import defaultdict

src, out = sys.argv[1], sys.argv[2]
H = json.load(open(f'{src}/kfg/hafs/data/hafsData_v18.json', encoding='utf-8'))
W = json.load(open(f'{src}/kfg/warsh/data/warshData_v10.json', encoding='utf-8'))
MUY = json.load(open(f'{src}/quran-api/editions/ara-kingfahadquranc.json', encoding='utf-8'))['quran']
JAL = json.load(open(f'{src}/quran-api/editions/ara-jalaladdinalmah.json', encoding='utf-8'))['quran']
INFO = json.load(open(f'{src}/quran-api/info.json', encoding='utf-8'))

assert len(H) == 6236 and len(W) == 6214 and len(MUY) == 6236 and len(JAL) == 6236
for i, a in enumerate(H):
    assert (a['sora'], a['aya_no']) == (MUY[i]['chapter'], MUY[i]['verse']) == (JAL[i]['chapter'], JAL[i]['verse'])


def words(s):
    """كلمات الآية بالحروف فقط (بلا تشكيل ولا رقم الآية ولا العلامات)، لمحاذاة عدّ ورش مع عدّ حفص."""
    s = re.sub(r'[٠-٩0-9]+', ' ', s.replace('\xa0', ' '))
    return [w for w in (''.join(c for c in t if unicodedata.category(c).startswith('L')) for t in s.split()) if w]


# ── حفص ──
hafs = [[a['sora'], a['aya_no'], a['page'], a['jozz'], a['aya_text'].strip()] for a in H]
search = [a['aya_text_emlaey'] for a in H]

# ── ورش: كل آية تُربط بآيات حفص التي تشاركها كلماتها (للتفسير)، بمحاذاة مواضع الكلمات داخل السورة ──
hpos = defaultdict(list)   # سورة → [(بداية, نهاية, رقم آية حفص)]
for a in H:
    s = a['sora']; n = len(words(a['aya_text']))
    start = hpos[s][-1][1] if hpos[s] else 0
    hpos[s].append((start, start + n, a['aya_no']))
wcur = defaultdict(int)
warsh = []
for a in W:
    s = a['sura_no']; n = len(words(a['aya_text']))
    if s == 1 and not wcur[s]:
        wcur[s] = 4   # البسملة آية في عدّ حفص الكوفي للفاتحة وليست آية في العدّ المدني
    lo, hi = wcur[s], wcur[s] + n
    wcur[s] = hi
    m = [k for (b, e, k) in hpos[s] if b < hi - 0.5 and e > lo + 0.5] or \
        [min(hpos[s], key=lambda x: abs((x[0] + x[1]) / 2 - (lo + hi) / 2))[2]]
    warsh.append([s, a['aya_no'], int(str(a['page']).split('-')[0]), a['jozz'], a['aya_text'].strip(), m])

# ── السور ──
surahs = []
for s in range(1, 115):
    hs = [x for x in hafs if x[0] == s]; ws = [x for x in warsh if x[0] == s]
    ch = INFO['chapters'][s - 1]
    name = next(a['sora_name_ar'] for a in H if a['sora'] == s).strip()
    surahs.append({'n': s, 'name': name, 'en': next(a['sora_name_en'] for a in H if a['sora'] == s),
                   'makki': ch['revelation'] == 'Mecca', 'hafs': len(hs), 'warsh': len(ws),
                   'hp': hs[0][2], 'wp': ws[0][2]})

def first_pages(rows):
    j = {}
    for r in rows:
        j.setdefault(r[3], [r[2], r[0], r[1]])
    return [j[k] for k in sorted(j)]

os.makedirs(out, exist_ok=True)
dump = lambda name, obj: json.dump(obj, open(f'{out}/{name}.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
dump('hafs', hafs)
dump('warsh', warsh)
dump('search', search)
dump('muyassar', [x['text'] for x in MUY])
dump('jalalayn', [x['text'] for x in JAL])
dump('surahs', surahs)
dump('juz', {'hafs': first_pages(hafs), 'warsh': first_pages(warsh)})
print('hafs', len(hafs), 'warsh', len(warsh), 'pages', max(x[2] for x in hafs), max(x[2] for x in warsh))
print('warsh→hafs multi-maps:', sum(1 for x in warsh if len(x[5]) > 1))
for f in sorted(os.listdir(out)):
    print(f, os.path.getsize(f'{out}/{f}'))
