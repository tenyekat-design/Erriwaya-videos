// finds when each verse starts in a recording from its loudness (dB per 50 ms) and the verses' lengths in letters;
// anchors: [[verse, seconds], …] the listener has fixed. Returns seconds for the start of each verse, then the end.
function autoAlign(db,L,anchors){
  const FR=0.05,N0=db.length,s=new Float32Array(N0);
  for(let i=0;i<N0;i++){let a=0,c=0;for(let k=i-1;k<=i+1;k++)if(k>=0&&k<N0){a+=db[k];c++}s[i]=a/c}
  const sorted=Float32Array.from(s).sort(),pct=q=>sorted[Math.min(N0-1,Math.floor(q*N0))];
  const fl=pct(.08),sp=pct(.6);
  const W=Math.round(1.5/FR),H=3;let C=[];   // [time, pause length, depth]
  for(let m=0;m<N0;m++){
    let isMin=true;for(let k=m-H;k<=m+H;k++)if(k>=0&&k<N0&&s[k]<s[m]){isMin=false;break}
    if(!isMin)continue;
    let l=-1e9,r=-1e9;for(let k=Math.max(0,m-W);k<=m;k++)if(s[k]>l)l=s[k];for(let k=m;k<=Math.min(N0-1,m+W);k++)if(s[k]>r)r=s[k];
    const dep=Math.min(l,r)-s[m];if(dep<6)continue;
    const lvl=s[m]+.5*dep;let a=m,b=m;while(a>0&&s[a]<lvl)a--;while(b<N0-1&&s[b]<lvl)b++;
    const t=(a+b)/2*FR,len=(b-a)*FR;
    if(C.length&&t-C[C.length-1][0]<.3){if(dep>C[C.length-1][2])C[C.length-1]=[t,len,dep];continue}
    C.push([t,len,dep]);
  }
  let end=N0*FR;for(let i=N0-1;i>=0;i--)if(s[i]>fl+.3*(sp-fl)){end=(i+1)*FR;break}
  const N=L.length,A=new Map((anchors||[]).filter(x=>x[0]>=1&&x[0]<=N).map(x=>[x[0]-1,x[1]]));
  A.forEach(t=>C.push([t,3,10]));C.sort((x,y)=>x[0]-y[0]);
  const K=C.length,t=C.map(c=>c[0]),sc=C.map(c=>Math.min(c[1],3)+.05*c[2]);
  const cum=[0];L.forEach(x=>cum.push(cum[cum.length-1]+x));const Ls=cum[N];
  const isA=k=>[...A.values()].includes(t[k]);
  let best=null;
  const k0s=[];for(let k=0;k<K&&k0s.length<6;k++)if(t[k]<=45)k0s.push(k);
  if(A.has(0)){k0s.length=0;k0s.push(t.indexOf(A.get(0)))}
  for(const k0 of k0s){
    const t0=t[k0],r=(end-t0)/Ls;if(r<=0)continue;
    let prev=new Map([[k0,[-sc[k0],-1]]]);const back=[prev];
    for(let j=1;j<N;j++){
      const cur=new Map(),e=t0+r*cum[j],Wd=Math.max(60,.12*r*cum[j]),lj=r*L[j-1];
      let lo=0,hi=K;
      if(A.has(j)){const ta=A.get(j);lo=t.indexOf(ta);hi=lo+1}
      for(let k=lo;k<hi;k++){
        if(!A.has(j)&&(t[k]<e-Wd||t[k]>e+Wd))continue;
        let bc=Infinity,bp=-1;
        prev.forEach(([c],p)=>{const d=t[k]-t[p];if(d<=.25*lj||d>=4*lj)return;const v=c+5*Math.log(d/lj)**2;if(v<bc){bc=v;bp=p}});
        if(bp>=0)cur.set(k,[bc-sc[k],bp]);
      }
      if(!cur.size){prev=null;break}
      back.push(cur);prev=cur;
    }
    if(!prev)continue;
    let bk=-1,bv=Infinity;prev.forEach(([c],k)=>{const v=c+5*Math.log(Math.max(end-t[k],.1)/(r*L[N-1]))**2;if(v<bv){bv=v;bk=k}});
    if(best&&bv>=best[0])continue;
    const path=[];let k=bk;for(let j=N-1;j>=0;j--){path.push(t[k]);k=back[j].get(k)[1]}
    best=[bv,path.reverse()];
  }
  return best?[...best[1],end]:null;
}
if(typeof module!=='undefined')module.exports=autoAlign;
