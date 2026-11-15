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

# ---- shaped dials (7..12): square, rectangle, octagon, hexagon, Roman, diamond; hands of matching shapes
def ray(a,poly):
    """distance from the centre to a convex polygon along the direction a (0 = up, clockwise)"""
    dx,dy=math.sin(a),-math.cos(a);best=1e9
    for i in range(len(poly)):
        (x1,y1),(x2,y2)=poly[i],poly[(i+1)%len(poly)]
        ex,ey=x2-x1,y2-y1;den=dx*ey-dy*ex
        if abs(den)<1e-9: continue
        t=((x1-100)*ey-(y1-100)*ex)/den;u=((x1-100)*dy-(y1-100)*dx)/den
        if t>0 and -1e-6<=u<=1+1e-6: best=min(best,t)
    return best
def polyd(poly): return 'M'+'L'.join(f'{x:.2f},{y:.2f}' for x,y in poly)+'Z'
def rounded(x0,y0,x1,y1,r):
    return (f'M{x0+r},{y0}L{x1-r},{y0}Q{x1},{y0} {x1},{y0+r}L{x1},{y1-r}Q{x1},{y1} {x1-r},{y1}'
            f'L{x0+r},{y1}Q{x0},{y1} {x0},{y1-r}L{x0},{y0+r}Q{x0},{y0} {x0+r},{y0}Z')
def ngon(n,r,rot=0): return [pt(math.radians(rot+360*k/n),r) for k in range(n)]
def marks(poly,inset,long,short,step=1):
    out_l='';out_s=''
    for i in range(0,12,step):
        a=math.radians(30*i);r=ray(a,poly)-inset
        if i%3==0: out_l+=seg(a,r-long,r)
        else: out_s+=seg(a,r-short,r)
    return out_l,out_s
def rect_hand(w,L,tail=10): return polyd([(100-w/2,100+tail),(100-w/2,100-L),(100+w/2,100-L),(100+w/2,100+tail)])
def arrow_hand(w,L,head):
    return polyd([(100-w/2,100+10),(100-w/2,100-L+head),(100-head*0.55,100-L+head),(100,100-L),(100+head*0.55,100-L+head),(100+w/2,100-L+head),(100+w/2,100+10)])
def sword(w,L,tail=12): return polyd([(100,100+tail),(100-w,100-L*0.22),(100,100-L),(100+w,100-L*0.22)])
def dauphine(w,L): return polyd([(100-w,100),(100,100-L),(100+w,100),(100,100+8)])
def square_at(cx,cy,s): return polyd([(cx-s,cy-s),(cx+s,cy-s),(cx+s,cy+s),(cx-s,cy+s)])
# 7 square
sq=[(14,14),(186,14),(186,186),(14,186)]
ml,ms=marks(sq,12,16,7)
dials[7]=[S('#C9A44C',2.6,rounded(10,10,190,190,22)),S('#55F2EEDC',1,rounded(18,18,182,182,16)),S(GOLD,5,ml,'butt'),S(CREAM,2.4,ms,'butt')]
hands[7]=([F(CREAM,rect_hand(9,52))],[F(GOLD,rect_hand(5,76)),F(GOLD,square_at(100,100,6)),F('#03062B',square_at(100,100,2.2))])
# 8 rectangle (tall)
rc=[(40,6),(160,6),(160,194),(40,194)]
ml,ms=marks(rc,10,0,8)
nums=''.join(text_path(AR,AN[i],*pt(math.radians(30*i),ray(math.radians(30*i),rc)-26),18) for i in (0,3,6,9))
dials[8]=[S('#C9A44C',2.4,rounded(36,2,164,198,14)),S(CREAM,2.2,ms,'butt'),F(CREAM,nums)]
hands[8]=([F(WHITE,rect_hand(7,36,8))],[F(GOLD,rect_hand(3.6,54,10)),F(GOLD,rounded(95,95,105,105,2))])
# 9 octagon, arrow hands
oc=ngon(8,92,22.5)
ml,ms=marks(oc,8,14,8)
dials[9]=[S('#C9A44C',2.4,polyd(oc)),S('#44C9A44C',1,polyd(ngon(8,84,22.5))),S(GOLD,4,ml),S(CREAM,2,ms)]
hands[9]=([F(CREAM,arrow_hand(5,50,16))],[F(GOLD,arrow_hand(3,74,14)),F(GOLD,circ(100,100,5.5)),F('#03062B',circ(100,100,2))])
# 10 hexagon, sword hands
hx=ngon(6,94,0)
ml,ms=marks(hx,10,14,7)
dials[10]=[F('#22E6BC62',polyd(hx)),S('#C9A44C',2.2,polyd(hx)),S(GOLD,4.5,ml,'butt'),S(CREAM,2,ms)]
hands[10]=([F(CREAM,sword(8,50))],[F(GOLD,sword(5.5,76,14)),F(GOLD,circ(100,100,5)),F('#03062B',circ(100,100,2))])
# 11 Roman numerals, skeleton hands (outlines)
ROM=['XII','I','II','III','IIII','V','VI','VII','VIII','IX','X','XI']
rom=''.join(text_path(LA,ROM[i],*pt(math.radians(30*i),73),13 if i%3 else 16) for i in range(12))
dials[11]=[S('#C9A44C',1.8,circ(100,100,94)),S('#C9A44C',0.8,circ(100,100,88)),F(CREAM,rom),
  F('#88E6BC62',''.join(circ(*pt(math.radians(6*i),91),0.8) for i in range(60)))]
skel=lambda L,w:f'M100,112Q{100-w},{100-L*0.4} 100,{100-L}Q{100+w},{100-L*0.4} 100,112Z'
hands[11]=([S(CREAM,2.4,skel(48,8),'round')],[S(GOLD,2,skel(70,6),'round'),F(GOLD,circ(100,100,4.5))])
# 12 diamond dial (a square on its point), dauphine hands
dm=ngon(4,96,0)
ml,ms=marks(dm,10,14,7)
dials[12]=[S('#C9A44C',2.6,polyd(dm)),S('#55C9A44C',1,polyd(ngon(4,86,0))),S(GOLD,4.5,ml),S(CREAM,2,ms)]
hands[12]=([F(CREAM,dauphine(7,46))],[F(GOLD,dauphine(5,70)),F(GOLD,polyd(ngon(4,7,0))),F('#03062B',circ(100,100,2))])

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

# ---- figure styles: tall condensed typefaces (SIL Open Font License, from npm @fontsource), cut down to the digits
# and the colon, in res/font/clk_*.ttf. Sizes are in dp (not sp) so the trims below stay exact; each figure is given by
# the height of its digits, and its line box is pulled in to the digits (the font's ascent above, its descent below).
from fontTools import subset as _subset
from fontTools.pens.boundsPen import BoundsPen
FS='/home/claude/fontwork/node_modules/@fontsource/'
os.makedirs(R+'font',exist_ok=True)
for f in os.listdir(R+'font'):
    if f.startswith('clk_'): os.remove(R+'font/'+f)
FONTS={}
def font(key,fam,w):
    src=f'{FS}{fam}/files/{fam}-latin-{w}-normal.woff2'
    f=TTFont(src);upm=f['head'].unitsPerEm;gs=f.getGlyphSet();cm=f.getBestCmap()
    bp=BoundsPen(gs);gs[cm[ord('0')]].draw(bp)
    FONTS[key]=dict(top=bp.bounds[3]/upm,asc=f['hhea'].ascent/upm,desc=-f['hhea'].descent/upm)
    opt=_subset.Options();opt.flavor=None;opt.layout_features=['tnum','lnum'];opt.name_IDs=['*'];opt.notdef_outline=True
    sub=_subset.Subsetter(opt);sub.populate(text='0123456789: ');sub.subset(f);f.flavor=None
    f.save(R+f'font/clk_{key}.ttf')
for key,fam,w in [('sixcaps','six-caps',400),('shoulders_light','big-shoulders-display',300),('shoulders_black','big-shoulders-display',900),
                  ('antonio','antonio',700),('league','league-gothic',400),('tulpen','tulpen-one',400),('saira','saira-extra-condensed',500),
                  ('bebas','bebas-neue',400),('pathway','pathway-gothic-one',400)]:
    font(key,fam,w)
def fig(fmt,key,H,color,idn='cTime',extra='',glow=None):
    m=FONTS[key];size=H/m['top']
    top=-(size*(m['asc']-m['top'])-1);bot=-(size*m['desc']-0.03*size)
    sh=f'android:shadowColor="{glow}" android:shadowRadius="16"' if glow else 'android:shadowColor="#80000000" android:shadowRadius="6"'
    if glow: top,bot=top/2,bot/2
    return (f'<TextClock android:id="@+id/{idn}" android:layout_width="wrap_content" android:layout_height="wrap_content"\n'
            f'    android:format24Hour="{fmt}" android:format12Hour="{fmt}" android:fontFamily="@font/clk_{key}" android:textSize="{size:.1f}dp"\n'
            f'    android:textColor="{color}" android:includeFontPadding="false" android:textDirection="ltr" android:maxLines="1"\n'
            f'    android:layout_marginTop="{top:.1f}dp" android:layout_marginBottom="{bot:.1f}dp" {sh} {extra} />\n')
def ind(s,n): return ''.join(' '*n+l+'\n' for l in s.rstrip('\n').split('\n'))
def row(inner,gravity='bottom',baseline=True):
    return (f'        <LinearLayout android:layout_width="wrap_content" android:layout_height="wrap_content" android:orientation="horizontal"\n'
            f'            android:layoutDirection="ltr" android:gravity="{gravity}" android:baselineAligned="{str(baseline).lower()}">\n'
            +ind(inner,12)+'        </LinearLayout>\n')
def col(inner,gravity='center',extra=''):
    return (f'<LinearLayout android:layout_width="wrap_content" android:layout_height="wrap_content" android:orientation="vertical"\n'
            f'    android:gravity="{gravity}" {extra}>\n'+ind(inner,4)+'</LinearLayout>\n')
def bar(w,h,color=GOLD,extra=''):
    return f'<ImageView android:layout_width="{w}" android:layout_height="{h}" android:background="{color}" android:importantForAccessibility="no" {extra} />\n'
D={}
H=80   # the hours' digits, in dp (the widget is at least 110 dp high, with the next prayer under the time)
D[1]=('ستّ',ind(fig('HH:mm','sixcaps',H,WHITE),8))
D[2]=('ستّ ذهبي',row(fig('HH','sixcaps',H,WHITE)+fig(':mm','sixcaps',50,GOLD,'cMin','android:layout_marginLeft="2dp"')))
D[3]=('الأكتاف',ind(fig('HH:mm','shoulders_light',H-6,WHITE),8))
D[4]=('الأكتاف العريض',row(fig('HH','shoulders_black',H,WHITE)+fig('mm','shoulders_black',44,GOLD,'cMin','android:layout_marginLeft="5dp"')))
D[5]=('أنطونيو',row(fig('HH','antonio',H-4,WHITE)+fig('mm','antonio',38,GOLD,'cMin','android:layout_marginLeft="4dp"'),'top',False))
D[6]=('القوطي',ind(fig('HH','league',56,WHITE)+bar('48dp','2dp',GOLD,'android:layout_marginTop="4dp" android:layout_marginBottom="4dp"')+fig('mm','league',30,GOLD,'cMin'),8))
D[7]=('الشعرة',ind(fig('HH:mm','tulpen',H,GOLD,glow='#99E6BC62'),8))
D[8]=('الأعمدة',row(fig('HH','saira',H-4,WHITE)+bar('2dp','56dp',GOLD,'android:layout_marginLeft="7dp" android:layout_marginRight="7dp"')
    +fig('mm','saira',40,GOLD,'cMin'),'center_vertical',False))
D[9]=('الشارة',row(fig('HH','bebas',H-6,WHITE)+fig('mm','bebas',28,'#0B1F5C','cMin',
    'android:background="@drawable/clock_chip" android:paddingLeft="7dp" android:paddingRight="7dp" android:paddingTop="10dp" android:paddingBottom="8dp" android:layout_marginLeft="6dp"'),'center_vertical',False))
D[10]=('اثنتا عشرة',row(fig('h','pathway',H-4,WHITE)+col(fig('mm','pathway',40,GOLD,'cMin')
    +'<TextClock android:id="@+id/cAmPm" android:layout_width="wrap_content" android:layout_height="wrap_content" android:format24Hour="a" android:format12Hour="a"\n    android:textSize="15dp" android:fontFamily="sans-serif-medium" android:textColor="#B9C2E8" android:layout_marginTop="4dp" />\n',
    'left','android:layout_marginLeft="6dp"'),'center_vertical',False))
A={1:'ذهبي',2:'أرقام عربية',3:'أرقام لاتينية',4:'بسيط',5:'ميناء فاتح',6:'نجمة',7:'مربّع',8:'مستطيل',9:'مثمّن',10:'سداسي',11:'روماني',12:'معيّن'}
for k,(name,body) in D.items():
    open(R+f'layout/widget_clock_d{k}.xml','w').write(HEAD.format(name=name,body=body))
for k,name in A.items():
    body=f'''        <AnalogClock android:id="@+id/cDial" android:layout_width="match_parent" android:layout_height="0dp" android:layout_weight="1"
            android:dial="@drawable/clock_dial_{k}" android:hand_hour="@drawable/clock_hour_{k}" android:hand_minute="@drawable/clock_minute_{k}" />
'''
    open(R+f'layout/widget_clock_a{k}.xml','w').write(HEAD.format(name=name,body=body))
# names for the settings screen
import json
json.dump({'d':{k:v[0] for k,v in D.items()},'a':A},open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'clock-models.json'),'w'),ensure_ascii=False)
print('ok')
