#!/usr/bin/env python3
"""Remote content (التحديث دون تحديث التطبيق).

Each table of the page wrapped in RC('<key>', …) (places, events, mansions, stars, reciters, library, sponsor…) can be
replaced on the phones without a new APK: the app reads manifest.json on the branch `calendar-content` of this
repository and downloads c/<key>.json when its version there is higher than the one built into the APK.
New books need no code: data/<key>.js (DATA_LOADED("<key>",[[chapter,[paragraphs…]],…])) and img/book-<key>.webp on
that branch, an entry in c/library.json (with `m`) and the key in a group of c/library-groups.json; the phone fetches the
book the first time it is opened.

    python3 tools/build-content.py <out-dir> [<manifest.json of the content branch>]

writes <out-dir>/c/<key>.json from the page's built-in tables (to start or refresh the content branch) and
assets/content-base.json: the versions the APK already carries (the content branch's versions when its manifest is given,
so a new APK built from the same tables does not download them again; otherwise 1).
"""
import json, os, re, subprocess, sys, tempfile
HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
s = open(os.path.join(HERE, 'web', 'index-source.html'), encoding='utf-8').read()

def scan_end(s,i):
    """i points at an opening [ or {; return index just after its matching close (string- and comment-aware)."""
    depth=0;q=None;j=i
    while j<len(s):
        c=s[j]
        if q:
            if c=='\\':j+=2;continue
            if c==q:q=None
        elif s.startswith('//',j):j=s.index('\n',j);continue
        elif s.startswith('/*',j):j=s.index('*/',j)+2;continue
        elif c in '\'"`':q=c
        elif c in '[{(':depth+=1
        elif c in ']})':
            depth-=1
            if depth==0:return j+1
        j+=1
    raise SystemExit('unbalanced')

out = sys.argv[1]
remote = json.load(open(sys.argv[2], encoding='utf-8'))['files'] if len(sys.argv) > 2 else {}
os.makedirs(os.path.join(out, 'c'), exist_ok=True)
base = {}
for m in re.finditer(r"RC\('([a-z0-9-]+)',", s):
    key = m.group(1)
    lit = s[m.end():scan_end(s, m.end())]
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write('process.stdout.write(JSON.stringify(' + lit + '))')
    val = subprocess.run(['node', f.name], capture_output=True, text=True, check=True).stdout
    os.unlink(f.name)
    path = 'c/' + key + '.json'
    open(os.path.join(out, path), 'w', encoding='utf-8').write(val)
    base[path] = remote.get(path, 1)
    print(path, len(val.encode()), 'bytes, version', base[path])
# books and covers already on the content branch are not in the APK: they stay out of the base, so phones fetch them
json.dump({'files': base}, open(os.path.join(HERE, 'assets', 'content-base.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('assets/content-base.json written')
