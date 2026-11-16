#!/usr/bin/env python3
"""Diagnostics for the opening suras (al-Fatiha, the start of al-Baqara) of a Mauritanian recording: the pauses in
the first minutes (time, length, depth), what each reference carries over, and the timings in the app. Log only."""
import json,os,sys,urllib.parse,tempfile
import numpy as np
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','sync'))
import run,mtime
rid=sys.argv[1];T=run.TARGETS[rid];tmp=tempfile.mkdtemp()
amap=run.archive_map(T['a']) if 'a' in T else {}
mine=run.tm('m-'+rid);refT={t:run.tm(t) for _,t in run.REFS}
for n in (1,2):
    url=(f"https://archive.org/download/{T['a']}/"+urllib.parse.quote(amap.get(n,f'{n:03d}.mp3'))) if 'a' in T else T['m']+f'{n:03d}.mp3'
    run.get(url,f'{tmp}/t.mp3');tx=run.pcm(f'{tmp}/t.mp3');dur=len(tx)/8000
    lim=150 if n==2 else dur
    # silences: frames of 50 ms under the 20th-percentile level + 6 dB, runs of at least 0.25 s
    f=int(8000*0.05);m=len(tx)//f;db=20*np.log10(np.sqrt((tx[:m*f].reshape(m,f)**2).mean(1)+1e-10))
    th=np.percentile(db,20)+6;sil=db<th;runs=[];s=None
    for i,v in enumerate(sil):
        if v and s is None:s=i
        if not v and s is not None:
            if i-s>=5 and s*0.05<lim:runs.append((round(s*0.05,2),round(i*0.05,2),round((i-s)*0.05,2)))
            s=None
    print(f'SURA {n} {rid} dur {dur:.1f}s',flush=True)
    print('  SIL',json.dumps(runs),flush=True)
    c,end=mtime.pauses(tx);print('  PAUSES',json.dumps([round(float(x),2) for x in c if x<lim]),flush=True)
    print('  APP',json.dumps((mine[n-1] or [])[:12]),flush=True)
    for name,t in run.REFS:
        try:
            run.get(f'https://github.com/iptvchecker/content-mp3quran/releases/download/{name}-2026-10-08/{n:03d}.mp3',f'{tmp}/r.mp3');rx=run.pcm(f'{tmp}/r.mp3')
            rs=[x/10 for x in refT[t][n-1][:-1]]
            if n==2:   # the opening only: the first 3 minutes of both
                k=next(i for i,x in enumerate(rs) if x>180) if rs[-1]>180 else len(rs);rs=rs[:k];rx=rx[:int(8000*(rs[-1]+20))]
                e=mtime.carry_full(rx,rs,tx[:int(8000*240)])
            else:e=mtime.carry_chunked(rx,rs,tx)
            print('  REF',name,'refstarts',json.dumps([round(x,1) for x in rs[:10]]),'carried',json.dumps([round(float(x),1) for x in e[:10]]),flush=True)
        except Exception as ex:print('  REF',name,'failed',ex,flush=True)
