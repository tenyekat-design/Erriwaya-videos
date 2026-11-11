"""Verse timings for a recording without them, carried over from recordings of the same narration that have them:
audio features (MFCC) of the two recitations are matched by dynamic time warping (a coarse pass over the whole sura,
then a fine pass in a band around it), each verse start of the reference is carried over, the results of several
references are combined (median) and each is moved onto the reciter's nearest pause."""
import numpy as np,librosa
SR=8000
def load(path):return np.fromfile(path,dtype=np.float32)
def feats(x,hop):
    h=int(SR*hop);M=librosa.feature.mfcc(y=x,sr=SR,n_mfcc=20,n_fft=512 if hop<0.3 else 2048,hop_length=h,n_mels=40)[1:]
    M=(M-M.mean(1,keepdims=True))/(M.std(1,keepdims=True)+1e-6)
    return (M/(np.linalg.norm(M,axis=0,keepdims=True)+1e-9)).T.astype(np.float32)   # frames x 19, unit length
def coarse(R,T):
    C=1-T@R.T
    D,wp=librosa.sequence.dtw(C=C)
    return wp[::-1]   # [target, ref]
def banded(R,T,center,B):
    n=len(T);m=len(R);INF=np.float32(1e9)
    S=np.clip(center-B,0,max(0,m-2*B-1)).astype(int);W=min(2*B+1,m)
    D=np.full((n,W),INF,np.float32);P=np.zeros((n,W),np.int8)
    for j in range(n):
        idx=S[j]+np.arange(W);cost=1-R[idx]@T[j]
        if j==0:D[0]=cost+np.where(idx==0,0,INF)*0+idx*0.02;continue
        sh=S[j]-S[j-1];best=np.full(W,INF,np.float32);arg=np.zeros(W,np.int8)
        for st in range(4):
            # predecessor ref index = idx-st -> position in previous row = idx-st-S[j-1]
            pos=np.arange(W)+sh-st;ok=(pos>=0)&(pos<W)
            cand=np.full(W,INF,np.float32);cand[ok]=D[j-1][pos[ok]]
            better=cand<best;best[better]=cand[better];arg[better]=st
        D[j]=cost+best;P[j]=arg
    # end: last target frame, best ref near the end
    k=int(np.argmin(D[n-1]+np.abs(S[n-1]+np.arange(W)-(m-1))*0.01));path=np.zeros(n,int)
    for j in range(n-1,-1,-1):
        path[j]=S[j]+k
        if j:
            st=P[j][k];k=k+(S[j]-S[j-1])-st
            k=min(max(k,0),W-1)
    return path   # ref frame for each target frame
def carry(ref_x,ref_starts,tgt_x,fine=0.1):
    dur=len(tgt_x)/SR;hc=max(0.5,dur/5000)
    wp=coarse(feats(ref_x,hc),feats(tgt_x,hc))
    Rf=feats(ref_x,fine);Tf=feats(tgt_x,fine)
    # coarse map target frame -> ref frame, at fine resolution
    tj=wp[:,0]*hc/fine;ri=wp[:,1]*hc/fine
    center=np.interp(np.arange(len(Tf)),tj,ri)
    path=banded(Rf,Tf,center,int(12/fine))
    out=[]
    for t in ref_starts:
        k=np.searchsorted(path,t/fine);out.append(min(k,len(Tf)-1)*fine)
    return np.array(out)
def pauses(x):
    import dips
    n=int(SR*0.05);m=len(x)//n;r=np.sqrt((x[:m*n].reshape(m,n)**2).mean(1)+1e-10);db=20*np.log10(r)
    C,end=dips.mk(D=6,mode='c')(db);return np.array([c[0] for c in C]),end
def timings(tgt_x,refs,win=1.0):
    """refs: [(audio, [verse starts in seconds])] -> verse starts in the target, then the end"""
    est=np.median(np.array([carry(rx,rs,tgt_x) for rx,rs in refs]),axis=0)
    c,end=pauses(tgt_x)
    out=[]
    for t in est:
        k=np.argmin(abs(c-t)) if len(c) else 0
        out.append(float(c[k]) if len(c) and abs(c[k]-t)<win else float(t))
    for i in range(1,len(out)):
        if out[i]<=out[i-1]:out[i]=out[i-1]+0.1
    return out+[end]
def carry_full(ref_x,ref_starts,tgt_x,hop=0.1):
    R=feats(ref_x,hop);T=feats(tgt_x,hop)
    D,wp=librosa.sequence.dtw(C=1-T@R.T);wp=wp[::-1]
    ti=wp[:,0]*hop;ri=wp[:,1]*hop
    return np.array([ti[min(np.searchsorted(ri,t),len(ti)-1)] for t in ref_starts])
def carry_chunked(ref_x,ref_starts,tgt_x,hop=0.1,seg=300):
    """full DTW in pieces of about `seg` seconds, cut where a coarse DTW of the whole sura maps target to reference"""
    dur=len(tgt_x)/SR
    if dur<=seg*1.5:return carry_full(ref_x,ref_starts,tgt_x,hop)
    hc=1.0;Rc=feats(ref_x,hc);Tc=feats(tgt_x,hc)
    D,wp=librosa.sequence.dtw(C=1-Tc@Rc.T);wp=wp[::-1];tj=wp[:,0]*hc;ri=wp[:,1]*hc
    cuts_t=list(np.arange(seg,dur-seg/2,seg))
    cuts_r=[float(np.interp(t,tj,ri)) for t in cuts_t]
    bt=[0.0]+cuts_t+[dur];br=[0.0]+cuts_r+[len(ref_x)/SR]
    mt=[];mr=[]
    for a in range(len(bt)-1):
        T=feats(tgt_x[int(bt[a]*SR):int(bt[a+1]*SR)],hop);R=feats(ref_x[int(br[a]*SR):int(br[a+1]*SR)],hop)
        D,w=librosa.sequence.dtw(C=1-T@R.T);w=w[::-1]
        mt.append(w[:,0]*hop+bt[a]);mr.append(w[:,1]*hop+br[a])
    ti=np.concatenate(mt);rr=np.concatenate(mr)
    return np.array([ti[min(np.searchsorted(rr,t),len(ti)-1)] for t in ref_starts])
def timings2(tgt_x,refs,win=1.0):
    E=np.array([carry_chunked(rx,rs,tgt_x) for rx,rs in refs]);est=np.median(E,0)
    c,end=pauses(tgt_x);out=[]
    for t in est:
        k=np.argmin(abs(c-t)) if len(c) else 0
        out.append(float(c[k]) if len(c) and abs(c[k]-t)<win else float(t))
    for i in range(1,len(out)):
        if out[i]<=out[i-1]:out[i]=out[i-1]+0.1
    return out+[end]
