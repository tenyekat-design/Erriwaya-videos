#!/usr/bin/env python3
"""The poetry books of the library («الشعر»), for the content branch (calendar-content): data/<key>.js in the shape of the
matns, DATA_LOADED(key, [[poem title, [verses "first half ... second half"]], ...]), one chapter per poem.
Sources: the OpenITI corpus on GitHub (texts from al-Maktaba al-Shamila and al-Mawsu'a al-Shi'riyya), pinned below.
Not proofread: a few known slips in famous opening verses are corrected in FIX; the rest is as in the source.

    python3 tools/build-poetry.py <download folder> <out folder>
"""
import json, os, re, sys, urllib.request
SRC, OUT = sys.argv[1], sys.argv[2]
RAW = 'https://raw.githubusercontent.com/OpenITI/'
A25 = '0025AH/05bfb1cad632ff98d62c925c6a28c0e3b4e67a64/data/'
A50 = '0050AH/13b275a97471b71cd8e2d5396599e995cc49064b/data/'
F = {
    'imru': A25 + '0001ImruQaysIbnHujr/0001ImruQaysIbnHujr.Diwan/0001ImruQaysIbnHujr.Diwan.JK007512-ara1',
    'tarafa': A25 + '0001TarafaIbnCabd/0001TarafaIbnCabd.Diwan/0001TarafaIbnCabd.Diwan.JK007518-ara2',
    'zuhayr': A25 + '0001ZuhayrIbnAbiSulma/0001ZuhayrIbnAbiSulma.Mucallaqa/0001ZuhayrIbnAbiSulma.Mucallaqa.ShamAY0038525-ara1',
    'labid': A50 + '0041LabidIbnRabica/0041LabidIbnRabica.Mucallaqa/0041LabidIbnRabica.Mucallaqa.ShamAY0038523-ara1',
    'amr': A25 + '0001CamrIbnKulthum/0001CamrIbnKulthum.Mucallaqa/0001CamrIbnKulthum.Mucallaqa.ShamAY0038526-ara1',
    'antara': A25 + '0001CantaraIbnShaddad/0001CantaraIbnShaddad.Mucallaqa/0001CantaraIbnShaddad.Mucallaqa.ShamAY0038527-ara1',
    'harith': A25 + '0001HarithIbnHilliza/0001HarithIbnHilliza.Mucallaqa/0001HarithIbnHilliza.Mucallaqa.ShamAY0038524-ara1',
    'shanfara': A25 + '0001Shanfara/0001Shanfara.Diwan/0001Shanfara.Diwan.ShamAY0037893-ara1',
    'khansa': A25 + '0024TumadirBinCamrKhansa/0024TumadirBinCamrKhansa.Diwan/0024TumadirBinCamrKhansa.Diwan.ShamAY0037828-ara1',
    'kaab': A50 + '0026KacbIbnZuhayr/0026KacbIbnZuhayr.Diwan/0026KacbIbnZuhayr.Diwan.ShamAY0037833-ara1',
    'mutanabbi': '0375AH/ab52219710c6bf15a93d6e39886f0ca602d27952/data/0354Mutanabbi/0354Mutanabbi.Diwan/0354Mutanabbi.Diwan.ShamAY0037830-ara1',
    'busiri': '0700AH/be0d457b3830bdef87b286d7e619726a36ac5fc9/data/0696SharafDinBusiri/0696SharafDinBusiri.Diwan/0696SharafDinBusiri.Diwan.ShamAY0037846-ara1',
}
# known slips in the sources (opening verses of the famous poems)
FIX = [('باتت سعاد فقلبي اليوم متبول ... متيم إثرها لم يجز مكبول', 'بانت سعاد فقلبي اليوم متبول ... متيم إثرها لم يفد مكبول'),
       ('فإني إلى قوم سواكم لأ ميل', 'فإني إلى قوم سواكم لأميل')]


def get(k):
    p = os.path.join(SRC, k)
    if not os.path.exists(p):
        os.makedirs(SRC, exist_ok=True)
        urllib.request.urlretrieve(RAW + F[k], p)
    return open(p, encoding='utf-8').read()


def clean(v):
    v = re.sub(r'PageV\d+P\d+|\bms\d+\b', '', v)
    v = re.sub(r'\(\d+\)\s*$', '', v.strip())
    v = v.replace('%~%', ' ... ')
    v = re.sub(r'\s*\.\.\.\s*', ' ... ', v)
    v = re.sub(r'\s+([،.:؛؟!])', r'\1', v)
    v = re.sub(r'[،,]\s*(?=\.\.\.)|[،,]\s*$', '', v).replace(' ...', ' ...')
    v = re.sub(r'\s+', ' ', v).strip(' (')
    v = re.sub(r'\s*\.\.\.\s*', ' ... ', v).strip()
    for a, b in FIX:
        v = v.replace(a, b)
    return v


def jk(text):
    """al-Mawsu'a al-Shi'riyya, numbered edition: «البحر : طويل 1» then «% first half % % second half % 2» …"""
    body = text[text.index('#META#Header#End#') + 17:]
    body = re.sub(r'PageV\d+P\d+|\bms\d+\b', '', body)
    body = re.sub(r'\n~~', ' ', body)
    body = re.sub(r'\n#\s*', ' ', body)
    poems = []
    for chunk in re.split(r'البحر\s*:', body)[1:]:
        m = re.match(r'\s*([^%\d]*?)\s*\d+\s', chunk)
        rest = chunk[m.end():] if m else chunk
        vs = []
        for v in re.split(r'(?<=%)\s*\d+\s', rest + ' 0 '):
            parts = [x.strip() for x in re.split(r'%+', v) if x.strip()]
            if len(parts) >= 2:
                vs.append(clean(parts[0] + ' ... ' + ' '.join(parts[1:])))
        poems.append(vs)
    return poems


def poem(poems, start):
    return next(p for p in poems if p and p[0].startswith(start))


def mucallaqa(text):
    return [clean(l[2:]) for l in text.split('\n') if l.startswith('# ') and ' ... ' in l]


def diwan(text):
    """al-Mawsu'a al-Shi'riyya: each poem starts at «البحر : …» (its first verse on the same line, after a bracket)."""
    poems = []
    for l in text.split('\n'):
        if l.startswith('#META') or not l.startswith('#'):
            continue
        l = l.lstrip('#').strip()
        m = re.match(r'^البحر\s*:\s*([^(%]*)\(?\s*(.*)$', l)
        if m:
            poems.append([m.group(1).strip(), []])
            l = m.group(2)
        l = l.lstrip('( ')
        if '%~%' in l and poems:
            poems[-1][1].append(clean(l))
    out = []
    for meter, vs in poems:
        if not vs:
            continue
        t = vs[0].split(' ... ')[0]
        out.append([t + (' · ' + meter.replace(' تام', '') if meter and meter != '-' else ''), vs])
    return out


def write(key, chapters):
    os.makedirs(os.path.join(OUT, 'data'), exist_ok=True)
    s = 'DATA_LOADED(' + json.dumps(key) + ',' + json.dumps(chapters, ensure_ascii=False, separators=(',', ':')) + ');\n'
    open(os.path.join(OUT, 'data', key + '.js'), 'w', encoding='utf-8').write(s)
    print(key, len(chapters), 'poems', sum(len(c[1]) for c in chapters), 'verses', len(s.encode()) // 1024, 'KB')


M = [('معلقة امرئ القيس', poem(jk(get('imru')), 'قفا نبك من ذكرى حبيب ومنزل')),
     ('معلقة طرفة بن العبد', poem(jk(get('tarafa')), 'لخولة أطلال')),
     ('معلقة زهير بن أبي سلمى', mucallaqa(get('zuhayr'))),
     ('معلقة لبيد بن ربيعة', mucallaqa(get('labid'))),
     ('معلقة عمرو بن كلثوم', mucallaqa(get('amr'))),
     ('معلقة عنترة بن شداد', mucallaqa(get('antara'))),
     ('معلقة الحارث بن حلزة', mucallaqa(get('harith')))]
for t, v in M:
    assert len(v) > 40, (t, len(v))
write('muallaqat', [[t, v] for t, v in M])
for k in ['shanfara', 'kaab', 'khansa', 'mutanabbi', 'busiri']:
    write(k, diwan(get(k)))
