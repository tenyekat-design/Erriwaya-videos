# Generates the clock widget's models: res/drawable/clock_dial|hour|minute_1..6.xml and res/layout/widget_clock_a1..a6, d1..d8.
# Needs fonttools and brotli, and Amiri's woff2 files (npm @fontsource/amiri); paths below are the session's.
import math, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
R='/home/claude/erriwaya-videos/apps/calendar-android/res/'
AR=TTFont('/home/claude/fontwork/amiri-arabic-700-normal.woff2')
LA=TTFont('/home/claude/fontwork/node_modules/@fontsource/amiri/files/amiri-latin-700-normal.woff2')
def text_path(font,s,cx,cy,size):
    """the outline of s, centred on (cx,cy), size = cap height in viewport units"""
    gs=font.getGlyphSet();cmap=font.getBestCmap();upm=font['head'].unitsPerEm
    names=[cmap[ord(ch)] for ch in s];adv=[font['hmtx'][n][0] for n in names]
    sc=size/(upm*0.62);width=sum(adv)*sc
    pen=SVGPathPen(gs);x=cx-width/2
    for n,a in zip(names,adv):
        tp=TransformPen(pen,(sc,0,0,-sc,x,cy+size/2));gs[n].draw(tp);x+=a*sc
    return pen.getCommands()
def pt(a,r): return 100+r*math.sin(a),100-r*math.cos(a)
def seg(a,r0,r1):
    x0,y0=pt(a,r0);x1,y1=pt(a,r1);return f'M{x0:.2f},{y0:.2f}L{x1:.2f},{y1:.2f}'
def circ(cx,cy,r): return f'M{cx-r:.2f},{cy:.2f}a{r},{r} 0 1,0 {2*r},0a{r},{r} 0 1,0 {-2*r},0'
def vec(paths):
    body=''.join(f'    <path {p} />\n' for p in paths)
    return ('<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="200dp" android:height="200dp"\n'
            '    android:viewportWidth="200" android:viewportHeight="200">\n'+body+'</vector>\n')
F=lambda c,d:f'android:fillColor="{c}" android:pathData="{d}"'
S=lambda c,w,d,cap='round':f'android:strokeColor="{c}" android:strokeWidth="{w}" android:strokeLineCap="{cap}" android:fillColor="#00000000" android:pathData="{d}"'
GOLD,CREAM,WHITE,NAVY='#E6BC62','#F2EEDC','#FFFFFF','#0B1F5C'
AN=['١٢','١','٢','٣','٤','٥','٦','٧','٨','٩','١٠','١١']
dials={};hands={}
# 1 golden: ring, hour marks, quarters in gold, minute dots
dials[1]=[S('#C9A44C',2.2,circ(100,100,92)),S('#66C9A44C',0.8,circ(100,100,86)),
  F('#99F2EEDC',''.join(circ(*pt(math.radians(6*i),79),1) for i in range(60) if i%5)),
  S(CREAM,2.6,''.join(seg(math.radians(30*i),70,80) for i in range(12) if i%3)),
  S(GOLD,5,''.join(seg(math.radians(90*i),64,80) for i in range(4)))]
hands[1]=([S(CREAM,7,'M100,112L100,56')],[S(GOLD,4,'M100,116L100,30'),F(GOLD,circ(100,100,6)),F('#03062B',circ(100,100,2.5))])
# 2 Arabic numerals
dials[2]=[S('#C9A44C',2,circ(100,100,94)),
  F(CREAM,''.join(text_path(AR,AN[i],*pt(math.radians(30*i),74),15 if i%3 else 19) for i in range(12))),
  F('#88E6BC62',''.join(circ(*pt(math.radians(6*i),90),0.9) for i in range(60)))]
hands[2]=([S(WHITE,5,'M100,110L100,62')],[S(GOLD,3,'M100,114L100,40'),F(GOLD,circ(100,100,5)),F('#03062B',circ(100,100,2))])
# 3 Latin numerals at the quarters, dots between
dials[3]=[S('#88F2EEDC',1.2,circ(100,100,93)),
  F(CREAM,''.join(text_path(LA,n,*pt(math.radians(90*i),72),20) for i,n in enumerate(['12','3','6','9']))),
  F(GOLD,''.join(circ(*pt(math.radians(30*i),76),2.6) for i in range(12) if i%3))]
hands[3]=([S(WHITE,6,'M100,108L100,60','square')],[S(WHITE,3.5,'M100,112L100,36','square'),S('#E05A4F',1.6,'M100,124L100,26'),F('#E05A4F',circ(100,100,4))])
# 4 minimal: dots only, thin hands
dials[4]=[F(CREAM,''.join(circ(*pt(math.radians(30*i),82),4.2 if i%3==0 else 2.4) for i in range(12)))]
hands[4]=([S(CREAM,4,'M100,104L100,58')],[S(GOLD,2.5,'M100,106L100,32'),F(GOLD,circ(100,100,3.5))])
# 5 light face: cream disc, navy marks, Arabic quarter numerals
dials[5]=[F('#F2EEDC',circ(100,100,92)),S('#C9A44C',3,circ(100,100,92)),
  S(NAVY,2,''.join(seg(math.radians(30*i),76,84) for i in range(12) if i%3)),
  F(NAVY,''.join(text_path(AR,AN[i],*pt(math.radians(30*i),70),22) for i in (0,3,6,9))),
  F('#660B1F5C',''.join(circ(*pt(math.radians(6*i),86),0.9) for i in range(60) if i%5))]
hands[5]=([S(NAVY,7,'M100,110L100,58')],[S('#B8892B',4,'M100,114L100,32'),F('#B8892B',circ(100,100,6)),F('#F2EEDC',circ(100,100,2.2))])
# 6 star: an eight-pointed star (two squares) in gold, small diamonds at the hours, leaf hands
def square(r,rot):
    p=[pt(math.radians(rot+90*k),r) for k in range(4)];return 'M'+'L'.join(f'{x:.2f},{y:.2f}' for x,y in p)+'Z'
def diamond(a,r,s):
    cx,cy=pt(a,r);return f'M{cx:.2f},{cy-s:.2f}L{cx+s*0.6:.2f},{cy:.2f}L{cx:.2f},{cy+s:.2f}L{cx-s*0.6:.2f},{cy:.2f}Z'
dials[6]=[S('#99C9A44C',1.4,square(60,0)+square(60,45),'butt'),S('#C9A44C',1.6,circ(100,100,92)),
  F(GOLD,''.join(diamond(math.radians(30*i),80,6 if i%3==0 else 4) for i in range(12)))]
leaf=lambda L,w:f'M100,108Q{100-w},{100-L*0.35} 100,{100-L}Q{100+w},{100-L*0.35} 100,108Z'
hands[6]=([F(CREAM,leaf(46,7))],[F(GOLD,leaf(68,5)),F(GOLD,circ(100,100,5)),F('#03062B',circ(100,100,2))])
for k in dials:
    open(R+f'drawable/clock_dial_{k}.xml','w').write(vec(dials[k]))
    open(R+f'drawable/clock_hour_{k}.xml','w').write(vec(hands[k][0]))
    open(R+f'drawable/clock_minute_{k}.xml','w').write(vec(hands[k][1]))
for f in ['clock_dial.xml','clock_hour.xml','clock_minute.xml','../layout/widget_clock_digital.xml','../layout/widget_clock_analog.xml']:
    p=R+'drawable/'+f
    if os.path.exists(p): os.remove(p)
# ---- layouts
HEAD='''<?xml version="1.0" encoding="utf-8"?>
<!-- «الساعة», model {name}: generated by tools/clock-models.py -->
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/cRoot" android:layout_width="match_parent" android:layout_height="match_parent">
    <ImageView android:id="@+id/cBg" android:layout_width="match_parent" android:layout_height="match_parent"
        android:scaleType="fitXY" android:src="@drawable/widget_day_bg" android:importantForAccessibility="no" />
    <LinearLayout android:id="@+id/cBody" android:layout_width="match_parent" android:layout_height="match_parent"
        android:orientation="vertical" android:gravity="center" android:padding="8dp">
{body}        <TextView android:id="@+id/cNext" android:layout_width="wrap_content" android:layout_height="wrap_content"
            android:layout_marginTop="2dp" android:text="القادمة: العشاء 19:47" android:textSize="12sp" android:maxLines="1"
            android:textColor="#B9C2E8" android:shadowColor="#80000000" android:shadowRadius="4" />
    </LinearLayout>
    <TextView android:id="@+id/cLock" android:layout_width="wrap_content" android:layout_height="wrap_content"
        android:layout_gravity="center" android:gravity="center" android:padding="10dp" android:visibility="gone"
        android:text="@string/clock_widget_locked" android:textSize="14sp" android:textStyle="bold" android:maxLines="2"
        android:textColor="#F6DFA0" android:shadowColor="#000000" android:shadowRadius="5" />
</FrameLayout>
'''
def tc(fmt,size,family,color,extra=''):
    return (f'android:format24Hour="{fmt}" android:format12Hour="{fmt}" android:textSize="{size}sp" android:fontFamily="{family}" '
            f'android:textColor="{color}" android:includeFontPadding="false" android:textDirection="ltr" android:shadowColor="#80000000" android:shadowRadius="6" {extra}')
def clockline(attrs,idn='cTime'):
    return f'        <TextClock android:id="@+id/{idn}" android:layout_width="wrap_content" android:layout_height="wrap_content"\n            {attrs} />\n'
D={}
D[1]=('رفيع',clockline(tc('HH:mm',60,'sans-serif-thin',WHITE)))
D[2]=('عريض',clockline(tc('HH:mm',54,'sans-serif-black',WHITE)))
D[3]=('مكثّف ذهبي',clockline(tc('HH:mm',66,'sans-serif-condensed',GOLD)))
D[4]=('كلاسيكي',clockline(tc('HH:mm',56,'serif',CREAM)))
D[5]=('بالثواني','''        <LinearLayout android:layout_width="wrap_content" android:layout_height="wrap_content" android:orientation="horizontal"
            android:layoutDirection="ltr" android:gravity="bottom">
'''+clockline(tc('HH:mm',56,'sans-serif-light',WHITE)).replace('        <','            <')+clockline(tc('ss',22,'sans-serif-light',GOLD,'android:layout_marginLeft="4dp" android:layout_marginBottom="6dp"'),'cSec').replace('        <','            <')+'        </LinearLayout>\n')
D[6]=('عمودي',clockline(tc('HH',46,'sans-serif-light',WHITE))+clockline(tc('mm',46,'sans-serif-light',GOLD),'cMin'))
D[7]=('12 ساعة','''        <LinearLayout android:layout_width="wrap_content" android:layout_height="wrap_content" android:orientation="horizontal"
            android:layoutDirection="ltr" android:gravity="center_vertical">
'''+clockline(tc('h:mm',58,'sans-serif-thin',WHITE)).replace('        <','            <')+clockline(tc('a',18,'sans-serif',GOLD,'android:layout_marginLeft="6dp"'),'cAmPm').replace('        <','            <')+'        </LinearLayout>\n')
D[8]=('أحادي',clockline(tc('HH:mm',50,'monospace',CREAM,'android:letterSpacing="0.08"')))
A={1:'ذهبي',2:'أرقام عربية',3:'أرقام لاتينية',4:'بسيط',5:'ميناء فاتح',6:'نجمة'}
for k,(name,body) in D.items():
    open(R+f'layout/widget_clock_d{k}.xml','w').write(HEAD.format(name=name,body=body))
for k,name in A.items():
    body=f'''        <AnalogClock android:id="@+id/cDial" android:layout_width="match_parent" android:layout_height="0dp" android:layout_weight="1"
            android:dial="@drawable/clock_dial_{k}" android:hand_hour="@drawable/clock_hour_{k}" android:hand_minute="@drawable/clock_minute_{k}" />
'''
    open(R+f'layout/widget_clock_a{k}.xml','w').write(HEAD.format(name=name,body=body))
# names for the settings screen
import json
json.dump({'d':{k:v[0] for k,v in D.items()},'a':A},open('/home/claude/clockgen/names.json','w'),ensure_ascii=False)
print('ok')
