#!/usr/bin/env python3
"""Verse starts for the opening of a Mauritanian recording, by speech recognition: Whisper (small, int8) gives the words
with their times; they are matched to the verse text (letters only, no alif or hamza, so the Uthmani spelling and the
recognised spelling meet), and each verse starts at its first matched word. Prints JSON: {sura: [starts…, end]} for
the verses it found (tenths of a second). Usage: asr.py RECITER SURA:SECONDS[,…]  (SECONDS 0 = the whole sura)."""
import json,os,re,sys,urllib.parse,tempfile,subprocess,difflib
import numpy as np
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,os.path.join(HERE,'..','sync'))
import run
from faster_whisper import WhisperModel
rid=sys.argv[1];jobs=[tuple(map(int,x.split(':'))) for x in sys.argv[2].split(',')]
T=run.TARGETS[rid];amap=run.archive_map(T['a']) if 'a' in T else {}
key='qaloon' if rid=='abdqader' else 'warsh'
s=open(os.path.join(run.DATA,f'quran-{key}.js')).read();Q=json.loads(s[s.index(',')+1:s.rindex(')')])
def norm(w):
    w=re.sub(r'[ً-ٰٟۖ-ۭـ]','',w)
    w=w.replace('ة','ه').replace('ى','ي').replace('ٱ','ا')
    w=re.sub(r'[اأإآءؤئ]','',w)
    return re.sub(r'[^ء-ي]','',w)
M=WhisperModel(sys.argv[3] if len(sys.argv)>3 else os.path.join(HERE,'..','..','..','..','.asr-model'),device='cpu',compute_type='int8')
tmp=tempfile.mkdtemp();res={}
for n,secs in jobs:
    url=(f"https://archive.org/download/{T['a']}/"+urllib.parse.quote(amap.get(n,f'{n:03d}.mp3'))) if 'a' in T else T['m']+f'{n:03d}.mp3'
    run.get(url,f'{tmp}/t.mp3')
    cmd=['ffmpeg','-v','error','-y','-i',f'{tmp}/t.mp3','-ac','1','-ar','16000']+(['-t',str(secs)] if secs else [])+[f'{tmp}/t.wav']
    subprocess.run(cmd,check=True)
    import soundfile as sf
    a,_=sf.read(f'{tmp}/t.wav',dtype='float32');dur=len(a)/16000
    seg,_=M.transcribe(a,language='ar',word_timestamps=True,beam_size=5,vad_filter=False,condition_on_previous_text=True,
                       initial_prompt='أعوذ بالله من الشيطان الرجيم بسم الله الرحمن الرحيم')
    W=[(norm(w.word),w.start,w.end) for sg in seg for w in sg.words];W=[x for x in W if x[0]]
    print('SURA',n,'dur %.1f'%dur,'words',len(W),flush=True)
    print('  HEARD',' '.join(f'{w}@{t:.1f}' for w,t,_ in W[:80]),flush=True)
    V=Q['suras'][n-1]['v'];R=[];vi=[]
    for k,v in enumerate(V):
        for w in v[0].split():
            x=norm(w)
            if x and not re.fullmatch(r'[٠-٩\d]+',w):R.append(x);vi.append(k)
    sm=difflib.SequenceMatcher(None,R,[w for w,_,_ in W],autojunk=False)
    at=[None]*len(R)
    for blk in sm.get_matching_blocks():
        for j in range(blk.size):at[blk.a+j]=W[blk.b+j][1]
    # fuzzy: unmatched reference words take a heard word nearby with similar letters
    starts=[]
    for k in range(len(V)):
        idx=[i for i in range(len(R)) if vi[i]==k]
        t=next((at[i]-(0.25*(idx.index(i))) for i in idx if at[i] is not None and idx.index(i)<3),None)
        starts.append(None if t is None else max(0.0,round(t,2)))
        if idx and all(at[i] is None for i in idx) and secs and starts and k>0 and starts[k-1] is None:break
    last=max((i for i in range(len(R)) if at[i] is not None),default=-1)
    nver=vi[last]+1 if last>=0 else 0
    print('  STARTS',json.dumps(starts[:nver+1]),'matched',sum(x is not None for x in at),'of',len(R),flush=True)
    res[n]={'starts':starts[:nver],'end':W[-1][2] if W else dur,'dur':dur}
json.dump(res,open(f'asr-{rid}.json','w'))
print('RESULT',json.dumps(res),flush=True)
