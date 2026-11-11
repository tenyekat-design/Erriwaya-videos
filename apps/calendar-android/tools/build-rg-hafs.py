#!/usr/bin/env python3
"""rg-hafs.js: verse rectangles on the Hafs page images (PAGESRC.hafs, 807 x 1205; pages 1-2 left out). Run in a folder
holding 1.jpg … 604.jpg and hd-all.json (verse-end medallions found by template matching, the number per page checked against
the bundled text: a Madinah page always ends at a verse end). 15 lines a page; surah banners found by their colour."""
import json,cv2,numpy as np,collections
D={int(k):v for k,v in json.load(open('hd-all.json')).items()}
s=open('/home/claude/erriwaya-videos/apps/calendar-android/assets/data/quran-hafs.js').read();Q=json.loads(s[s.index(',')+1:s.rindex(')')])
BYP=collections.defaultdict(list)
for i,S in enumerate(Q['suras']):
    for j,v in enumerate(S['v']):BYP[v[1]].append((i+1,j+1))
C=[116+70.25*k for k in range(15)];L,R=76,731;H0=1205;TW,TH=37,48
def lineof(m):y=m[1]+TH/2;return min(range(15),key=lambda i:abs(C[i]-y))
out={};bad=[]
for p in range(3,605):
    im=cv2.imread(f'{p}.jpg');hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV);sat=hsv[...,1].astype(int);val=hsv[...,2].astype(int)
    g=cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
    hdr=[i for i,c in enumerate(C) if ((sat[int(c-33):int(c+33),90:720]>60)&(val[int(c-33):int(c+33),90:720]>60)).mean()>0.08]
    seq=BYP[p];mk=sorted(D[p],key=lambda m:(lineof(m),-m[0]))
    if len(mk)!=len(seq):bad.append(p);continue
    starts=[x for x in seq if x[1]==1]
    if len(hdr)!=len(starts):bad.append((p,hdr,starts));hdr=hdr[:len(starts)]
    kind=['t']*15
    for h,(s_,a) in zip(hdr,starts):
        kind[h]='h'
        if s_!=9 and h+1<15:kind[h+1]='b'
    text=[i for i in range(15) if kind[i]=='t']
    EXT={}
    for i,c in enumerate(C):
        cols=np.where((g[int(c-26):int(c+26),66:742]<90).any(0))[0]
        EXT[i]=(max(L,66+cols.min()-3),min(R,66+cols.max()+3)) if len(cols) else (L,R)
    def nexttext(i):
        for j in text:
            if j>i:return j
    rects={}
    def add(key,line,xa,xb):
        xa=max(xa,EXT[line][0]);xb=min(xb,EXT[line][1])
        if xb-xa<10:return
        top=C[line]-34;h=68
        rects.setdefault(key,[]).append([round(xa),round(H0-(top+h)),round(xb-xa),h])
    def span(key,c0,c1):
        (l0,x0),(l1,x1)=c0,c1
        if l0==l1:add(key,l0,x1,x0);return
        add(key,l0,L,x0)
        for i in text:
            if l0<i<l1:add(key,i,L,R)
        add(key,l1,x1,R)
    hi=0
    cur=(text[0],R)
    if seq[0][1]==1:
        cur=(nexttext(hdr[0]+(0 if seq[0][0]==9 else 1)),R);hi=1
    for j,m in enumerate(mk):
        key=seq[j];ln=lineof(m)
        span(key,cur,(ln,m[0]))
        cur=(ln,m[0])
        if j+1<len(seq) and seq[j+1][1]==1:
            h=hdr[hi];hi+=1
            cur=(nexttext(h+(0 if seq[j+1][0]==9 else 1)),R)
    out[p]=[[s_,a]+[v for r in rs for v in r] for (s_,a),rs in rects.items()]
print('bad',len(bad),bad[:8])
json.dump(out,open('rg-hafs.json','w'),separators=(',',':'))

# marker detection used for hd-all.json:
# import numpy as np,cv2,json,sys
# T=cv2.imread('50.jpg',0)[236:284,299:336]
# def det(n,th=0.55):
#     g=cv2.imread(f'{n}.jpg',0)
#     if g.shape!=(1205,807):return None
#     R=cv2.matchTemplate(g,T,cv2.TM_CCOEFF_NORMED)
#     out=[]
#     R2=R.copy()
#     while True:
#         _,mx,_,(x,y)=cv2.minMaxLoc(R2)
#         if mx<th:break
#         out.append([x,y,float(round(mx,3))])
#         R2[max(0,y-25):y+25,max(0,x-22):x+22]=-1
#     return out
# if __name__=='__main__':
#     a,b=int(sys.argv[1]),int(sys.argv[2])
#     json.dump({n:det(n) for n in range(a,b+1)},open(f'hd-{a}.json','w'))
