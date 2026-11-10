# يبني assets/data/qcf.json من بيانات حزمة qcf_quran (MIT) وخطوط صفحاتها.
# الاستعمال: python3 tools/build_qcf.py <مجلد qcf_quran>
import sys
import re,json,sys
R=sys.argv[1].rstrip('/')+'/'
src=open(R+'lib/src/data/quran_text.dart',encoding='utf-8').read()
s=src[src.index('['):src.rindex(']')+1]
s=re.sub(r'"\s*\+\s*"','',s)
s=re.sub(r',\s*([\]}])',r'\1',s)
data=json.loads(s)
pd=open(R+'lib/src/data/page_data.dart',encoding='utf-8').read()
p=pd[pd.index('['):pd.rindex(']')+1]; p=re.sub(r',\s*([\]}])',r'\1',p)
pages=json.loads(p)
idx={(d['surah_number'],d['verse_number']):d['qcfData'] for d in data}
from fontTools.ttLib import TTFont
def page_lines(pi):
    lines=[];cur=[];slots=[]
    for r in pages[pi-1]:
        for v in range(r['start'],r['end']+1):
            if v==1:
                if cur: lines.append(cur);cur=[]
                lines.append(('H',r['surah']))
                if r['surah'] not in (1,9): lines.append(('B',r['surah']))
            for ch in idx[(r['surah'],v)]:
                if ch=='\n':
                    if cur: lines.append(cur);cur=[]
                elif ch.strip(): cur.append((r['surah'],v,ch))
    if cur: lines.append(cur)
    return lines
_f={}
def widths(pi):
    if pi not in _f:
        f=TTFont(R+f'assets/fonts/qcf4/QCF4{pi:03d}_X-Regular.woff');cm=f.getBestCmap();hm=f['hmtx']
        _f[pi]={chr(k):hm[g][0] for k,g in cm.items()}
    return _f[pi]
def lw(pi,line):
    w=widths(pi);return sum(w.get(c[2],0) for c in line)
def fixed_lines(pi):
    L=page_lines(pi);out=[]
    tw=[lw(pi,x) for x in L if not isinstance(x,tuple)]
    med=sorted(tw)[len(tw)//2] if tw else 40500
    if pi<=2: med=40500
    for x in L:
        if isinstance(x,tuple): out.append(x);continue
        w=lw(pi,x);k=round(w/ max(med,30000))
        if k<=1: out.append(x);continue
        acc=0;cur=[];target=w/k;
        for g in x:
            gw=widths(pi).get(g[2],0)
            if cur and acc+gw/2>target*(len([o for o in out if o is not None])*0+1) and len(cur)>0 and acc>=target*0.5 and k>1 and abs(acc-target)<abs(acc+gw-target):
                out.append(cur);cur=[];acc=0;k-=1;target=(w-sum(lw(pi,o) for o in [])) / 1 if False else target
            cur.append(g);acc+=gw
        out.append(cur)
    return out

def build(out_json, hafs_json):
    import json
    hafs=json.load(open(hafs_json,encoding='utf-8'))
    aidx={(a[0],a[1]):i for i,a in enumerate(hafs)}
    allp=[]
    for p in range(1,605):
        L=fixed_lines(p);pl=[]
        for x in L:
            if isinstance(x,tuple):
                pl.append({'h':x[1]} if x[0]=='H' else {'b':x[1]})
                continue
            runs=[]
            for (s,v,ch) in x:
                i=aidx[(s,v)]
                if runs and runs[-1][0]==i: runs[-1][1]+=ch
                else: runs.append([i,ch])
            pl.append({'w':round(lw(p,x)),'r':runs})
        allp.append(pl)
    json.dump(allp,open(out_json,'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))

if __name__=='__main__': build('assets/data/qcf.json','assets/data/hafs.json')
