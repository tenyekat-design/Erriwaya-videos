#!/usr/bin/env python3
"""Diagnostics for tools/sync: lists a reciter's files on archive.org and, for a few suras, shows how the six
references disagree. Output goes to the job log."""
import json,os,sys,urllib.request,urllib.parse,tempfile
import numpy as np
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','sync'))
import run,mtime
rid=sys.argv[1];suras=[int(x) for x in sys.argv[2].split(',')];T=run.TARGETS[rid]
amap={}
if 'a' in T:
    j=json.load(urllib.request.urlopen(f"https://archive.org/metadata/{T['a']}/files",timeout=60))
    print('FILES',rid)
    for f in j.get('result',[]):
        if f.get('name','').lower().endswith('.mp3'):print('  F',repr(f.get('name')),f.get('source'),f.get('length'),f.get('size'),flush=True)
    amap=run.archive_map(T['a'])
refT={t:run.tm(t) for _,t in run.REFS};tmp=tempfile.mkdtemp()
for n in suras:
    try:
        url=(f"https://archive.org/download/{T['a']}/"+urllib.parse.quote(amap.get(n,f'{n:03d}.mp3'))) if 'a' in T else T['m']+f'{n:03d}.mp3'
        run.get(url,f'{tmp}/t.mp3');tx=run.pcm(f'{tmp}/t.mp3')
    except Exception as e:print('SURA',n,'target missing',url,e,flush=True);continue
    print('SURA',n,url,'dur %.0f'%(len(tx)/8000),flush=True)
    E=[];names=[]
    for name,t in run.REFS:
        try:
            run.get(f'https://github.com/iptvchecker/content-mp3quran/releases/download/{name}-2026-10-08/{n:03d}.mp3',f'{tmp}/r.mp3');rx=run.pcm(f'{tmp}/r.mp3')
            rs=[x/10 for x in refT[t][n-1][:-1]];E.append(mtime.carry_chunked(rx,rs,tx));names.append(name)
            print('  ref',name,'dur %.0f'%(len(rx)/8000),'first verses',np.round(E[-1][:4],1),'last',np.round(E[-1][-2:],1),flush=True)
        except Exception as e:print('  ref',name,'failed',e,flush=True)
    E=np.array(E);med=np.median(E,0)
    for i,nm in enumerate(names):
        d=abs(E[i]-med);print('  dev',nm,'median %.2f 90th %.2f max %.1f'%(np.median(d),np.percentile(d,90),d.max()))
    agree=(abs(E-med)<1).sum(0);print('  verses',E.shape[1],'agree>=4:',int((agree>=4).sum()),'agree>=3:',int((agree>=3).sum()),'bad verses:',[int(i+1) for i in np.where(agree<3)[0]][:40],flush=True)
    c,end=mtime.pauses(tx);print('  pauses in first 40s',np.round(c[c<40],1),'end %.0f'%end,flush=True)
