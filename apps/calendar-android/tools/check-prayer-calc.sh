#!/usr/bin/env bash
# Checks that the app's own prayer-time code (src/.../PrayerCalc.java) gives exactly the times the page gives:
# runs the page's functions (cut out of web/index-source.html) in Node and PrayerCalc in Java over the same
# days, places and methods, and compares the two outputs. Needs node and a JDK. The build runs it.
set -euo pipefail
cd "$(dirname "$0")/.."
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
javac -d "$T" src/mr/erriwaya/calendar/PrayerCalc.java
JAVA_TOOL_OPTIONS= java -cp "$T" mr.erriwaya.calendar.PrayerCalc > "$T/java.txt"
node - "$T/js.txt" <<'JS'
const fs=require('fs');
const s=fs.readFileSync('web/index-source.html','utf8');
const cut=(a,b)=>{const i=s.indexOf(a),j=s.indexOf(b,i);if(i<0||j<0)throw new Error('page code not found: '+a);return s.slice(i,j)};
const code=cut('/* ---------- math ---------- */','function qibla(')+cut('const DAY=864e5;','let HF=null;')+cut('function civil(jd)','const hCache=');
const f=new Function('S','METHODS',code+';return {prayerTimes,fmt,gOf,civil}');
const S={method:'m',asr:1},METHODS={m:{}};
const P=f(S,METHODS);
const places=[[18.0858,-15.9785],[20.931,-17.0347],[16.6167,-7.25],[25.24,-11.6],[15.16,-12.18]];
const methods=[{fajr:18,isha:17},{fajr:19,isha:17},{fajr:19.5,isha:17.5},{fajr:18.5,ishaMin:90}];
let out='',n=0;
for(let day=20454;day<20454+800;day+=3){
  const g=P.gOf(day+2440588),h=P.civil(day+2440588);
  out+=`${g.y}-${g.m}-${g.d} h${h.y}-${h.m}-${h.d}`;
  places.forEach((p,pi)=>methods.forEach((M,mi)=>{for(let asr=1;asr<=2;asr++){
    METHODS.m=M;S.asr=asr;
    const t=P.prayerTimes(g.y,g.m,g.d,{id:`${pi}-${mi}`,lat:p[0],lng:p[1]});
    for(const k of ['fajr','sunrise','dhuhr','asr','maghrib','isha']){out+=' '+P.fmt(t[k]);n++}
  }}));
  out+='\n';
}
fs.writeFileSync(process.argv[2],out);
console.log(n+' times computed by the page');
JS
if cmp -s "$T/java.txt" "$T/js.txt"; then echo "PrayerCalc.java matches the page"; else
  echo "PrayerCalc.java differs from the page:" >&2; diff "$T/java.txt" "$T/js.txt" | head -20 >&2; exit 1; fi
