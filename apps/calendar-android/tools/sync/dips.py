import numpy as np
class A: FR=0.05
def mk(D=8,win=1.5,res=0.5,mode='r'):
    def cands(db):
        FR=A.FR;k=np.ones(3)/3;s=np.convolve(db,k,'same');N=len(s);w=int(win/FR)
        from scipy.ndimage import maximum_filter1d,minimum_filter1d
        mn=minimum_filter1d(s,size=int(0.3/FR)|1)
        idx=np.where((s==mn))[0]
        C=[];last=-10
        fl=np.percentile(s,8);sp=np.percentile(s,60)
        for m in idx:
            l=s[max(0,m-w):m+1].max();r=s[m:m+w+1].max();dep=min(l,r)-s[m]
            if dep<D:continue
            lvl=s[m]+res*dep
            a=m
            while a>0 and s[a]<lvl:a-=1
            b=m
            while b<N-1 and s[b]<lvl:b+=1
            t={'r':b*FR,'m':m*FR,'c':(a+b)/2*FR}[mode]
            if C and t-C[-1][0]<0.3:
                if dep>C[-1][2]:C[-1]=(t,(b-a)*FR,dep)
                continue
            C.append((t,(b-a)*FR,dep))
        sp_idx=np.where(s>fl+0.3*(sp-fl))[0];end=(sp_idx[-1]+1)*FR
        return C,end
    return cands
