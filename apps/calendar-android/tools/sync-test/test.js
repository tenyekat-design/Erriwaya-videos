const fs=require('fs'),autoAlign=require('./align.js');
const load=n=>{const s=fs.readFileSync('/home/claude/erriwaya-videos/apps/calendar-android/assets/data/'+n+'.js','utf8');return JSON.parse(s.slice(s.indexOf(',')+1,s.lastIndexOf(')')))};
const Q={warsh:load('quran-warsh'),qaloon:load('quran-qaloon')};
const letters=t=>(t.match(/[ء-يٱ-ۓ]/g)||[]).length;
let tot=[];
for(const [f,key,tm] of [['warsh-yassin14','warsh','14'],['qalon-dokali208','qaloon','208'],['warsh-husary120','warsh','120']]){
  const T=load('tm-'+tm);
  for(const n of [18,36,67,78]){
    const buf=fs.readFileSync(`/home/claude/aud/${f}-${String(n).padStart(3,'0')}.f32`);const x=new Float32Array(buf.buffer,buf.byteOffset,buf.length/4);
    const db=[];for(let i=0;i+400<=x.length;i+=400){let s=0;for(let k=i;k<i+400;k++)s+=x[k]*x[k];db.push(Math.max(-100,Math.round(10*Math.log10(s/400+1e-10))))}
    const L=Q[key].suras[n-1].v.map(v=>Math.max(4,letters(v[0])));
    const t0=Date.now();const a=autoAlign(db,L,[]);const ms=Date.now()-t0;
    const gt=T[n-1].slice(0,-1).map(x=>x/10);
    const ok=a?gt.filter((g,i)=>Math.abs(a[i]-g)<1.2).length/gt.length:0;tot.push(ok);
    // with two anchors from the truth at 1/3 and 2/3
    const an=[[Math.floor(L.length/3),gt[Math.floor(L.length/3)-1]],[Math.floor(2*L.length/3),gt[Math.floor(2*L.length/3)-1]]].filter(x=>x[0]>1);
    const b=autoAlign(db,L,an);const ok2=b?gt.filter((g,i)=>Math.abs(b[i]-g)<1.2).length/gt.length:0;
    console.log(f,n,L.length,ok.toFixed(2),'with 2 anchors',ok2.toFixed(2),ms+'ms');
  }
}
console.log('mean',tot.reduce((a,b)=>a+b)/tot.length);
