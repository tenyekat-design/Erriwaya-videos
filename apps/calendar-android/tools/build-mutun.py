#!/usr/bin/env python3
"""Builds assets/data/ajrumiyya.js and assets/data/akhdari.js (the matns in the library).

Sources: the OpenITI corpus on GitHub (texts from al-Maktaba al-Shamila), pinned to a commit:
  al-Ajurrumiyya (Ibn Ajurrum, d. 723 AH): OpenITI/0725AH, 0723IbnAjrum.Ajrumiyya.Shamela0011371-ara1
  Mukhtasar al-Akhdari fi al-ibadat (d. 983 AH): OpenITI/1000AH, ...MukhtasarFiCibadat.ShamAY0031995-ara1
  (the Subayh, Cairo printing; the other two OpenITI versions were compared and have more typos)
Each file calls DATA_LOADED(key, [[chapter title, [paragraphs], []], ...]), the same shape as hisn.js.

    python3 tools/build-mutun.py [download folder]
"""
import json, os, re, sys, urllib.request
SRC = sys.argv[1] if len(sys.argv) > 1 else 'src-data'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'data')
RAW = 'https://raw.githubusercontent.com/OpenITI/'
FILES = {
    'ajrumiyya': ('0725AH/056df249d6619b428a78f1d69a8ab2851b97b0a6/data/0723IbnAjrum/0723IbnAjrum.Ajrumiyya/'
                  '0723IbnAjrum.Ajrumiyya.Shamela0011371-ara1'),
    'akhdari': ('1000AH/55a280982e225ff8652737b70d99a337cb939546/data/0983IbnMuhammadSahgirAkhdari/'
                '0983IbnMuhammadSahgirAkhdari.MukhtasarFiCibadat/0983IbnMuhammadSahgirAkhdari.MukhtasarFiCibadat.ShamAY0031995-ara1'),
}


def parse(text):
    """OpenITI mARkdown -> [[title, [paragraphs]], ...]: '###' starts a chapter, '#' a paragraph, '~~' continues it."""
    chaps, cur, para = [], ['', []], None
    def flush():
        nonlocal para
        if para and para.strip():
            cur[1].append(para.strip())
        para = None
    for l in text.split('\n'):
        if l.startswith('#META') or l.startswith('######OpenITI') or l.startswith('﻿'):
            continue
        l = re.sub(r'PageV\d+P\d+', '', l)
        l = re.sub(r'\bms\d+\b', '', l)
        if l.startswith('###'):
            flush()
            t = re.sub(r'^###\s*\|\s*(AUTO\s*)?', '', l).strip()
            if cur[1] or cur[0]:
                chaps.append(cur)
            m = re.match(r'^\((.+?)\):?\s*(.*)$', t)
            if m and len(t) > 60:          # a heading that carries the first paragraph
                cur, para = [m.group(1), []], t
            else:
                cur = [t, []]
        elif l.startswith('~~'):
            para = (para or '') + ' ' + l[2:].strip()
        elif l.startswith('#'):
            flush()
            para = l.lstrip('#').strip()
        elif l.strip():
            para = (para or '') + ' ' + l.strip()
    flush()
    chaps.append(cur)
    return [c for c in chaps if c[1]]


def tidy(p):
    p = re.sub(r'(?<=[؀-ۿ])\d+', '', p)       # footnote numbers stuck to words
    p = re.sub(r'\s+\d+\s*:', ':', p)                    # "أربعة أقسام 1:"
    p = re.sub(r'\{([^}]*)\}', r'﴿\1﴾', p)               # Qur'an quotations
    p = p.replace(',', '،')
    p = re.sub(r'\s+([،.:؛])', r'\1', p)
    return re.sub(r'\s+', ' ', p).strip()


def ajrumiyya(ch):
    ch[0][0] = 'أنواع الكلام'
    ch[0][1] = [p for p in ch[0][1] if p not in ('بسم الله الرحمن الرحيم', 'أنواع الكلام', '...')]
    for c in ch:
        c[0] = c[0].strip('[]')
        ps = c[1]
        for i, p in enumerate(ps):   # the source has the list of the khafd signs before its heading line
            if p and p.startswith('الكسرة، والياء، والفتحة') and i + 1 < len(ps) and ps[i + 1].startswith('وللخفض ثلاث علامات'):
                ps[i], ps[i + 1] = 'وللخفض ثلاث علامات: الكسرة، والياء، والفتحة.', None
        c[1] = [p for p in ps if p]
    return ch


def akhdari(ch):
    intro = ['بسم الله الرحمن الرحيم'] + [p for p in ch[0][1] if p.startswith('الحمد لله')]  # drop the title page
    ch = ch[1:]
    ch[0][0], ch[0][1] = 'مقدمة', intro + ch[0][1]
    for c in ch:
        c[1] = [re.sub(r'\((ويجب|وشروط التوبة|أول ما يجب على المكلف)\)', r'\1', p) for p in c[1]]
    return ch


os.makedirs(SRC, exist_ok=True)
for key, path in FILES.items():
    p = os.path.join(SRC, key + '.mARkdown')
    if not os.path.exists(p):
        print('download', path)
        urllib.request.urlretrieve(RAW + path, p)
    ch = parse(open(p, encoding='utf-8').read())
    for c in ch:
        c[1] = [tidy(x) for x in c[1]]
    ch = globals()[key](ch)
    data = [[c[0], [x for x in c[1] if x and x != '...'], []] for c in ch]
    with open(os.path.join(OUT, key + '.js'), 'w', encoding='utf-8') as f:
        f.write('DATA_LOADED(' + json.dumps(key) + ',' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ');\n')
    print(key, len(data), 'chapters,', sum(len(c[1]) for c in data), 'paragraphs')
