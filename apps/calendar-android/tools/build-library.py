#!/usr/bin/env python3
"""Builds the newer books of the library (assets/data/<key>.js), the same shape as the matns of build-mutun.py:
DATA_LOADED(key, [[chapter title, [paragraphs], []], ...]). Sources: the OpenITI corpus on GitHub (texts from
al-Maktaba al-Shamila), each pinned to the commit below; a line with " ... " between its halves is a verse of poetry.

    python3 tools/build-library.py [download folder]
"""
import json, os, re, sys, urllib.request
SRC = sys.argv[1] if len(sys.argv) > 1 else 'src-data'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'data')
RAW = 'https://raw.githubusercontent.com/OpenITI/'
FILES = {
    'arbaun': '0700AH/be0d457b3830bdef87b286d7e619726a36ac5fc9/data/0676Nawawi/0676Nawawi.ArbacunaNawawiyya/0676Nawawi.ArbacunaNawawiyya.Shamela0012836-ara1.mARkdown',
    'riyad': '0700AH/be0d457b3830bdef87b286d7e619726a36ac5fc9/data/0676Nawawi/0676Nawawi.RiyadSalihin/0676Nawawi.RiyadSalihin.Shamela0012014-ara1.mARkdown',
    'risala': '0400AH/5bb6966d8df2ed22b1bff5cdbe29bb9c24f3ca29/data/0386IbnAbiZaydQayrawani/0386IbnAbiZaydQayrawani.Risala/0386IbnAbiZaydQayrawani.Risala.Shamela0011373-ara1',
    'shamail': '0300AH/01a1544130e0236850ef2698923ad01575c5bd7c/data/0279Tirmidhi/0279Tirmidhi.ShamailMuhammadiyya/0279Tirmidhi.ShamailMuhammadiyya.Shamela0013037-ara1',
    'alfiyya': '0675AH/4b1d2886508b435eb0377ccab96e1da96cc8ee0a/data/0672IbnMalik/0672IbnMalik.Alfiyya/0672IbnMalik.Alfiyya.Shamela0008522-ara1',
    'lamiyya': '0675AH/4b1d2886508b435eb0377ccab96e1da96cc8ee0a/data/0672IbnMalik/0672IbnMalik.NazmLamiyyatAfcal/0672IbnMalik.NazmLamiyyatAfcal.ShamAY0037033-ara1',
    'qatr': '0775AH/61b0c7891699554aeff8dffdb8b1a2a59d2d22ab/data/0761JamalDinIbnHisham/0761JamalDinIbnHisham.MatnQatrNada/0761JamalDinIbnHisham.MatnQatrNada.Shamela0011376-ara1',
    'mulha': '0525AH/6290621b58e063ed1aa47ffd0a6fc1630191e7cb/data/0516IbnCaliHariri/0516IbnCaliHariri.MulhatIcrab/0516IbnCaliHariri.MulhatIcrab.Shamela0007840-ara1',
}


def blocks(text):
    """mARkdown -> [(level, title, [paragraphs])]: '### |' is level 1, '### ||' level 2…; '#' starts a paragraph, '~~' continues it."""
    out, cur, para = [], [0, '', []], None
    def flush():
        nonlocal para
        if para and para.strip():
            cur[2].append(para.strip())
        para = None
    for l in text.split('\n'):
        if l.startswith('#META') or l.startswith('######OpenITI') or l.startswith('﻿'):
            continue
        l = re.sub(r'PageV\d+P\d+', '', l)
        l = re.sub(r'\bms\d+\b', '', l)
        m = re.match(r'^###\s*(\|+)\s*(?:AUTO\s*|CHECK\s*)?(.*)$', l)
        if m:
            flush()
            out.append(cur)
            cur = [len(m.group(1)), m.group(2).strip(), []]
        elif l.startswith('~~'):
            para = (para or '') + ' ' + l[2:].strip()
        elif l.startswith('#'):
            flush()
            para = l.lstrip('#').strip()
        elif l.strip():
            para = (para or '') + ' ' + l.strip()
    flush()
    out.append(cur)
    return out


def tidy(p):
    p = re.sub(r'\[ص:\s*\d+\]', '', p)
    p = re.sub(r'(?<=[؀-ۿ])\d+', '', p)       # footnote numbers stuck to words
    p = re.sub(r'\{([^}]*)\}', r'﴿\1﴾', p)               # Qur'an quotations
    p = p.replace(',', '،')
    p = re.sub(r'\s+([،.:؛])', r'\1', p)
    p = re.sub(r'\s*\.\.\.\s*', ' ... ', p)
    return re.sub(r'\s+', ' ', p).strip()


def clean_title(t):
    t = re.sub(r'^[\[\(\-\s]+|[\]\)\s:]+$', '', t)
    return re.sub(r'\s+', ' ', t).strip()


def flat(B, intro='مقدمة'):
    """every titled block is a chapter; untitled leading text goes into the first one"""
    ch = []
    for lv, t, ps in B:
        t = clean_title(t)
        if not t:
            if ch: ch[-1][1] += ps
            else: ch.append([intro, ps])
        else:
            ch.append([t, ps])
    return ch


def arbaun(B):
    ch = flat(B)
    ch[0][1] += ch[1][1] + ch[2][1]
    del ch[1:3]
    return ch


def riyad(B):
    ch = []
    for lv, t, ps in B:
        t = clean_title(t)
        if lv == 3 or (lv == 0 and ch):          # a hadith: its number before its text
            n = re.match(r'^(\d+)\s*/\s*(\d+)', t)
            if ps and n: ps = ['(' + n.group(2) + ') ' + ps[0]] + ps[1:]
            if ch: ch[-1][1] += ps
        elif lv == 2:
            ch.append([re.sub(r'^\d+\s*-\s*', '', t), ps])
        elif lv in (0, 1):
            if t.startswith('[') or 'مقدمة' in t or not ch: ch.append([t or 'مقدمة المؤلف', ps])
            elif ps: ch.append([t, ps])
    return ch


def risala(B):
    ch = flat(B)
    if ch[0][1] and 'المجلد' in ch[0][1][0]: ch[0][1] = ch[0][1][1:]
    return ch


def shamail(B):
    ch = []
    for lv, t, ps in B:
        t = clean_title(t)
        if t.startswith('باب'):
            ch.append([t, ps])
        elif re.match(r'^\d+\s*-?$', t):
            if ps and ch: ch[-1][1] += ['(' + re.sub(r'\D', '', t) + ') ' + ps[0]] + ps[1:]
        elif ch:   # a page mark in the middle of a hadith: its text continues the last paragraph
            if ps and ch[-1][1]: ch[-1][1][-1] += ' ' + ps[0]; ch[-1][1] += ps[1:]
            else: ch[-1][1] += ps
        else:
            ch.append(['مقدمة', ps])
    return ch


def alfiyya(B):
    ch = flat(B)
    for c in ch:
        ps = [p for p in c[1] if p.strip(' .') and not p.startswith('(بسم')]
        out = []
        for p in ps:   # a verse split over two lines in the source: "first half ..." then "second half"
            if out and out[-1].endswith('...') and ' ... ' not in out[-1].rstrip('. '): out[-1] = out[-1].rstrip('. ') + ' ... ' + p
            else: out.append(p)
        c[1] = out
    return ch


def lamiyya(B):
    ch = [c for c in flat(B) if not c[0].startswith('[') and not c[0].startswith('نظم لامية')]
    for c in ch:
        ps = [p for p in c[1]]
        c[1] = [ps[i] + ' ... ' + ps[i + 1] if i + 1 < len(ps) else ps[i] for i in range(0, len(ps), 2)]
    return ch


def qatr(B):
    ch = []
    for lv, t, ps in B:
        t = clean_title(t)
        if not t or re.match(r'^\d+\s*-?$', t):
            if ch: ch[-1][1] += ps
            else: ch.append(['مقدمة', ps])
        else:
            ch.append([t, ps])
    ch[1][1] = ch[0][1] + ch[1][1]
    return ch[1:]


def mulha(B):
    ch = flat(B, 'مقدمة الناظم')
    for c in ch:
        c[1] = [p for p in c[1] if not re.match(r'^\(\d+\s*$', p)]
    ch[1][1] = ch[0][1] + ch[1][1]
    return ch[1:]


os.makedirs(SRC, exist_ok=True)
for key, path in FILES.items():
    p = os.path.join(SRC, key + '.md')
    if not os.path.exists(p):
        print('download', path)
        urllib.request.urlretrieve(RAW + path, p)
    B = blocks(open(p, encoding='utf-8').read())
    B = [[lv, t, [tidy(x) for x in ps]] for lv, t, ps in B]
    ch = globals()[key](B)
    data = [[c[0], [x for x in c[1] if x and x.strip(' .')], []] for c in ch if any(x.strip(' .') for x in c[1])]
    with open(os.path.join(OUT, key + '.js'), 'w', encoding='utf-8') as f:
        f.write('DATA_LOADED(' + json.dumps(key) + ',' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ');\n')
    print(key, len(data), 'chapters,', sum(len(c[1]) for c in data), 'paragraphs', os.path.getsize(os.path.join(OUT, key + '.js')))
