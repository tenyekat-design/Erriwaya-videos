#!/usr/bin/env python3
"""rg-warsh.js: verse rectangles on the Warsh (Athari) page images. Inputs (made by build-warsh-athari.py while it runs, kept
in its working folder): r100/p{PDF page:03d}.png (100 dpi renders), markers.json (verse-end medallions per page, reading order),
pages.json (the page index), out/{n}.webp (the published images). 15 lines a page; surah headers found by their green frame.
Rectangles: [left, bottom, width, height] in pixels of the 1002-wide images."""
import json,cv2,numpy as np
M={int(k):v for k,v in json.load(open('markers.json')).items()}
P=json.load(open('pages.json'))
counts=[len(x) for x in P]
seq=[(s+1,a+1) for s in range(114) for a in range(counts[s])]
C=[164+58.57*k for k in range(15)];L,R=135,698
def lineof(c):y=c[1]+c[3]/2;return min(range(15),key=lambda i:abs(C[i]-y))
k=0  # index into seq of the next marker
# markers before page 3
for p in (1,2):k+=len(M[p])
out={};bad=[]
for p in range(3,568):
    im=cv2.imread(f'r100/p{p+3:03d}.png');b,g,r=[im[:,:,i].astype(int) for i in range(3)]
    gr=(g-r>25)&(g-b>40)
    hdr=[i for i,c in enumerate(C) if gr[int(c-29):int(c+29),160:670].mean()>0.05]
    if p in (28,102): hdr=[]
    kind=['t']*15
    for h in hdr:
        kind[h]='h'
    mk=M[p];nk=len(mk)
    # surah starts on this page = ayahs a==1 among those whose marker is here (plus the one after the last marker)
    starts=[seq[k+j] for j in range(nk) if seq[k+j][1]==1]
    nxt=seq[k+nk] if k+nk<len(seq) else None
    if nxt and nxt[1]==1:starts.append(nxt)   # header after the last marker on this page
    # basmala: line after each header unless the surah is 9 (or header is the last line)
    hs=sorted(hdr)
    sts=[s for s in starts]
    if len(hs)!=len([1 for _ in sts]) and not (len(hs)==len(sts)-1 and nxt and nxt[1]==1):
        bad.append((p,hs,sts))
    for h,(s,a) in zip(hs,sts):
        if s!=9 and h+1<15:kind[h+1]='b'
    text=[i for i in range(15) if kind[i]=='t']
    def nexttext(i):
        for j in text:
            if j>i:return j
        return None
    ink=(r<100)&(g<100)&(b<100)
    EXT={}
    for i,c in enumerate(C):
        cols=np.where(ink[int(c-22):int(c+22),L:R+4].any(0))[0]
        EXT[i]=(L+cols.min()-4,L+cols.max()+4) if len(cols) else (L,R)
    rects={}
    def add(key,line,xa,xb):
        xa=max(xa,EXT[line][0]);xb=min(xb,EXT[line][1])
        if xb-xa<12:return
        X=xa*1.5-123;W=(xb-xa)*1.5;top=(C[line]-29)*1.5-36;H=58*1.5
        rects.setdefault(key,[]).append([round(X),round(1653-(top+H)),round(W),round(H)])
    def span(key,c0,c1):  # from cursor c0=(line,x) to c1=(line,x), reading order
        (l0,x0),(l1,x1)=c0,c1
        if l0==l1:add(key,l0,x1,x0);return
        add(key,l0,L,x0)
        for i in text:
            if l0<i<l1:add(key,i,L,R)
        add(key,l1,x1,R)
    first=text[0] if text else 0
    if seq[k][1]==1 and hs: cur=(nexttext(hs[0]+ (0 if seq[k][0]==9 else 1)) if True else first,R)
    else: cur=(first,R)
    for j in range(nk):
        key=seq[k+j];c=mk[j];ln=lineof(c)
        if key[1]==1 and hs:
            # this surah's header is the first header after the cursor line
            h=[x for x in hs if x>=cur[0]-0] 
        span(key,cur,(ln,c[0]))
        cur=(ln,c[0])
        if j+1<nk or nxt:
            n2=seq[k+j+1] if k+j+1<len(seq) else None
            if n2 and n2[1]==1:
                h=[x for x in hs if x>ln]
                if h:
                    t=nexttext(h[0]+(0 if n2[0]==9 else 1))
                    cur=(t,R) if t is not None else (15,R)
    if nxt and nxt[1]!=1 and cur[0]<15 and text:
        last=text[-1]
        if (cur[0],cur[1])!=(last,L): span(nxt,cur,(last,L))
    out[p]=[[s,a]+[v for r in rs for v in r] for (s,a),rs in rects.items()]
    k+=nk
print('header mismatches',len(bad),bad[:10])
json.dump(out,open('rg-warsh.json','w'),separators=(',',':'))
