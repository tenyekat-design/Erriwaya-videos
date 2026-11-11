#!/usr/bin/env python3
"""Verse timings for the Mauritanian recordings (they have none), carried over from the six recordings that have them
(mp3quran: Warsh 14 Yassin, 16 al-Koshi, 80 al-Qazabri; Qalun 208 ad-Dokali, 75 al-Hudhaify, 270 al-Husary; the
GitHub mirror iptvchecker/content-mp3quran holds the same files) by matching the audio (mtime.py). Warsh and Qalun
have the same verse count, so all six serve both.

    python3 run.py RECITER_ID OUT.json      (runs on GitHub Actions: .github/workflows/calendar-sync.yml)

OUT.json: [[start of verse 1, …, end] in tenths of a second, or null where the sura could not be had] for 114 suras,
and "spread": per sura, the share of verses on which at least three references agree within a second (the others
are fitted into the pauses between agreed verses); a sura under one half is left out (null).
Optional PART PARTS: only the suras with number % PARTS == PART."""
import json,os,re,subprocess,sys,urllib.request,urllib.parse,tempfile
import numpy as np
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import mtime
HERE=os.path.dirname(os.path.abspath(__file__));DATA=os.path.join(HERE,'..','..','assets','data')
TARGETS={
  'rajel':{'a':'alfird77777777777777776479446944696799796444il_002'},
  'rabbani':{'a':'alfirdwsiy1433_35686535653683658668356566586356gmail_002'},
  'laghdaf':{'m':'https://media.way2quran.com/mohamed-laghzaf-weld-mohamed-sidi/qalun-an-nafi/'},
  'naji':{'a':'alfirdwsiy14335787878787858750578780578780'},
  'abdqader':{'a':'alf444444444444444444444444444444444469469649469746946969_gmail_011_201703'},
}
REFS=[('warsh-yassin14','14'),('warsh-koshi16','16'),('warsh-qazabri80','80'),('qalon-dokali208','208'),('qalon-hudhaify75','75'),('qalon-husary270','270')]
def tm(t):
    s=open(os.path.join(DATA,f'tm-{t}.js')).read();return json.loads(s[s.index(',')+1:s.rindex(')')])
def get(url,path,tries=4):
    import time
    for k in range(tries):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (calendar-sync)'})
            with urllib.request.urlopen(req,timeout=180) as r,open(path,'wb') as f:
                while True:
                    b=r.read(1<<20)
                    if not b:break
                    f.write(b)
            return
        except Exception:
            if k==tries-1:raise
            time.sleep(20*(k+1))
def letters(t):return len(re.findall(r'[\u0621-\u064A\u0671-\u06D3]',t))
def pcm(path):
    raw=subprocess.run(['ffmpeg','-v','error','-i',path,'-ac','1','-ar','8000','-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw,dtype=np.float32).copy()
def archive_map(item):
    j=json.load(urllib.request.urlopen(f'https://archive.org/metadata/{item}/files',timeout=60))
    m={}
    for f in j.get('result',[]):
        g=re.match(r'^(\d{1,3})[^\d].*\.mp3$',f.get('name',''),re.I)
        if g and f.get('source')!='derivative' and 1<=int(g.group(1))<=114:m[int(g.group(1))]=f['name']
    return m
def main():
    rid,out=sys.argv[1],sys.argv[2];T=TARGETS[rid]
    part,parts=(int(sys.argv[3]),int(sys.argv[4])) if len(sys.argv)>4 else (0,1)
    s=open(os.path.join(DATA,'quran-warsh.js')).read();QW=json.loads(s[s.index(',')+1:s.rindex(')')])
    amap=archive_map(T['a']) if 'a' in T else {}
    refT={t:tm(t) for _,t in REFS}
    res=[None]*114;spread=[None]*114
    tmp=tempfile.mkdtemp()
    for n in range(1,115):
        if n%parts!=part:continue
        try:
            if 'a' in T:
                url=f"https://archive.org/download/{T['a']}/"+urllib.parse.quote(amap.get(n,f'{n:03d}.mp3'))
            else:url=T['m']+f'{n:03d}.mp3'
            get(url,f'{tmp}/t.mp3');tx=pcm(f'{tmp}/t.mp3')
        except Exception as e:
            print(n,'target missing',e,flush=True);continue
        refs=[]
        for name,t in REFS:
            try:
                get(f'https://github.com/iptvchecker/content-mp3quran/releases/download/{name}-2026-10-08/{n:03d}.mp3',f'{tmp}/r.mp3')
                refs.append((pcm(f'{tmp}/r.mp3'),[x/10 for x in refT[t][n-1][:-1]]))
            except Exception as e:print(n,name,'missing',e,flush=True)
        if len(refs)<2:continue
        E=np.array([mtime.carry_chunked(rx,rs,tx) for rx,rs in refs])
        c,end=mtime.pauses(tx);L=[max(4,letters(v[0])) for v in QW['suras'][n-1]['v']]
        o,fixed=mtime.consensus(E,c,L)
        frac=float(fixed.mean());spread[n-1]=round(frac,3)   # the share of verses the references agree on
        if frac>=0.5:res[n-1]=[round(float(x)*10) for x in o]+[round(end*10)]
        print(n,len(o),'verses, agreed',spread[n-1],'kept' if frac>=0.5 else 'DROPPED','target %.0fs'%(len(tx)/8000),flush=True)
        json.dump({'t':res,'spread':spread},open(out,'w'))
    json.dump({'t':res,'spread':spread},open(out,'w'))
if __name__=='__main__':main()
