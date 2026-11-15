# Draws the heritage wallpapers (assets/wallpapers/*.jpg) as SVG; render each page with Chrome at 1080x2400 and save as JPEG.
import math, random
W,H=1080,2400
NAVY1,NAVY2,GOLD,CREAM,RED,GREEN='#0B1F7A','#03062B','#E6BC62','#F2EEDC','#B5532E','#2E7D5B'
def defs(extra=''):
    return f'''<defs>
<radialGradient id="sky" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#10288F"/><stop offset=".55" stop-color="{NAVY1}"/><stop offset="1" stop-color="{NAVY2}"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6DFA0"/><stop offset=".5" stop-color="{GOLD}"/><stop offset="1" stop-color="#B8892B"/></linearGradient>
<linearGradient id="dune1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A2F86"/><stop offset="1" stop-color="#050C3A"/></linearGradient>
<linearGradient id="dune2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E1D63"/><stop offset="1" stop-color="#02051F"/></linearGradient>
<radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F6DFA0" stop-opacity=".55"/><stop offset="1" stop-color="#F6DFA0" stop-opacity="0"/></radialGradient>
{extra}</defs>'''
def stars(n,seed,ymax=1500):
    r=random.Random(seed);out=''
    for _ in range(n):
        x,y=r.uniform(0,W),r.uniform(0,ymax)**1.0
        s=r.choice([0.8,1,1.2,1.6,2.2]);o=r.uniform(.35,.95)
        out+=f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{s}" fill="{CREAM}" opacity="{o:.2f}"/>'
    for _ in range(7):  # a few bright four-point stars
        x,y=r.uniform(60,W-60),r.uniform(80,ymax*0.8);s=r.uniform(7,13)
        out+=f'<path d="M{x},{y-s}Q{x},{y} {x+s},{y}Q{x},{y} {x},{y+s}Q{x},{y} {x-s},{y}Q{x},{y} {x},{y-s}Z" fill="{CREAM}" opacity=".85"/>'
    return out
_cn=[0]
def crescent(cx,cy,r,col='url(#gold)'):
    _cn[0]+=1;k=_cn[0]
    return (f'<circle cx="{cx}" cy="{cy}" r="{r*3}" fill="url(#glow)" opacity=".7"/>'
            f'<mask id="cm{k}"><rect x="{cx-2*r}" y="{cy-2*r}" width="{4*r}" height="{4*r}" fill="black"/><circle cx="{cx}" cy="{cy}" r="{r}" fill="white"/>'
            f'<circle cx="{cx+r*0.42}" cy="{cy-r*0.22}" r="{r*0.86}" fill="black"/></mask>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#gold)" mask="url(#cm{k})"/>')
def dunes(y0):
    return (f'<path d="M0,{y0+120}C220,{y0} 420,{y0+40} 620,{y0+140}S960,{y0+60} {W},{y0+20}V{H}H0Z" fill="url(#dune1)"/>'
            f'<path d="M0,{y0+330}C260,{y0+200} 520,{y0+260} 760,{y0+360}S1000,{y0+300} {W},{y0+250}V{H}H0Z" fill="url(#dune2)"/>'
            f'<path d="M0,{y0+330}C260,{y0+200} 520,{y0+260} 760,{y0+360}S1000,{y0+300} {W},{y0+250}" fill="none" stroke="{GOLD}" stroke-opacity=".35" stroke-width="2"/>')
def leather_band(y,h,flip=False):
    """a band in the manner of Mauritanian leatherwork: triangles, lozenges and fine lines in gold, terracotta and green"""
    out=f'<rect x="0" y="{y}" width="{W}" height="{h}" fill="#071248"/>'
    out+=f'<line x1="0" y1="{y+6}" x2="{W}" y2="{y+6}" stroke="{GOLD}" stroke-width="3"/><line x1="0" y1="{y+h-6}" x2="{W}" y2="{y+h-6}" stroke="{GOLD}" stroke-width="3"/>'
    out+=f'<line x1="0" y1="{y+14}" x2="{W}" y2="{y+14}" stroke="{GOLD}" stroke-width="1" stroke-dasharray="6 6"/><line x1="0" y1="{y+h-14}" x2="{W}" y2="{y+h-14}" stroke="{GOLD}" stroke-width="1" stroke-dasharray="6 6"/>'
    step=90;cy=y+h/2;s=(h-40)/2
    for i in range(-1,W//step+2):
        cx=i*step+step/2
        out+=f'<path d="M{cx},{cy-s}L{cx+s*0.75},{cy}L{cx},{cy+s}L{cx-s*0.75},{cy}Z" fill="none" stroke="{GOLD}" stroke-width="2.5"/>'
        out+=f'<path d="M{cx},{cy-s*0.55}L{cx+s*0.4},{cy}L{cx},{cy+s*0.55}L{cx-s*0.4},{cy}Z" fill="{RED}"/>'
        out+=f'<circle cx="{cx}" cy="{cy}" r="{s*0.12}" fill="{GOLD}"/>'
        tx=cx+step/2
        out+=f'<path d="M{tx-s*0.3},{cy-s}L{tx+s*0.3},{cy-s}L{tx},{cy-s*0.35}Z" fill="{GREEN}"/><path d="M{tx-s*0.3},{cy+s}L{tx+s*0.3},{cy+s}L{tx},{cy+s*0.35}Z" fill="{GREEN}"/>'
        out+=f'<line x1="{tx}" y1="{cy-s*0.25}" x2="{tx}" y2="{cy+s*0.25}" stroke="{GOLD}" stroke-width="2"/>'
    return out
def zigzag(y,amp,step,col,w=2,op=1):
    pts=' '.join(f'{x},{y+(amp if (x//step)%2 else -amp)}' for x in range(0,W+step,step))
    return f'<polyline points="{pts}" fill="none" stroke="{col}" stroke-width="{w}" opacity="{op}"/>'
def page(svg): return f'<html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{svg}</svg></body></html>'

pages={}
# 1 Chinguetti night: the minaret with its ostrich eggs, the mosque's wall, dunes, crescent
def minaret(x,base,w,h):
    top=base-h;t=w*0.86
    o=f'<path d="M{x-w/2},{base}L{x-t/2},{top}L{x+t/2},{top}L{x+w/2},{base}Z" fill="#0A1450" stroke="{GOLD}" stroke-width="3"/>'
    # stone courses
    for k in range(1,9):
        yy=base-h*k/9;ww=w-(w-t)*k/9
        o+=f'<line x1="{x-ww/2+4}" y1="{yy}" x2="{x+ww/2-4}" y2="{yy}" stroke="{GOLD}" stroke-opacity=".18" stroke-width="2"/>'
    # small openings
    for k in (0.3,0.55,0.78):
        yy=base-h*k;o+=f'<rect x="{x-9}" y="{yy-22}" width="18" height="30" rx="2" fill="#F6DFA0" opacity=".55"/>'
    # crown: corner merlons and five ostrich eggs
    o+=f'<rect x="{x-t/2-8}" y="{top-14}" width="{t+16}" height="14" fill="#0A1450" stroke="{GOLD}" stroke-width="3"/>'
    for dx in (-t/2,-t/4,0,t/4,t/2):
        o+=f'<path d="M{x+dx-12},{top-14}L{x+dx},{top-48}L{x+dx+12},{top-14}Z" fill="#0A1450" stroke="{GOLD}" stroke-width="2.5"/>'
        o+=f'<ellipse cx="{x+dx}" cy="{top-58}" rx="8" ry="11" fill="{CREAM}"/>'
    return o
def wall(x0,x1,base,h):
    o=f'<rect x="{x0}" y="{base-h}" width="{x1-x0}" height="{h}" fill="#0A1450" stroke="{GOLD}" stroke-width="3"/>'
    for x in range(int(x0)+10,int(x1)-10,46):
        o+=f'<path d="M{x},{base-h}L{x+12},{base-h-26}L{x+24},{base-h}Z" fill="#0A1450" stroke="{GOLD}" stroke-width="2.5"/>'
    for x in range(int(x0)+40,int(x1)-40,110):
        o+=f'<path d="M{x},{base}V{base-h*0.55}A22,22 0 0,1 {x+44},{base-h*0.55}V{base}Z" fill="#040A33" stroke="{GOLD}" stroke-opacity=".5" stroke-width="2"/>'
    return o
s=defs()+f'<rect width="{W}" height="{H}" fill="url(#sky)"/>'+stars(260,1,1700)+crescent(800,420,70)
s+=f'<path d="M0,1850C300,1760 700,1800 {W},1730V{H}H0Z" fill="#081657"/>'
s+=wall(140,560,1880,170)+minaret(700,1890,190,560)
s+=dunes(1830)+leather_band(2230,120)
pages['chinguetti']=s
# 2 the tent: a Mauritanian khaima under the stars, its lamp glowing, a camel at rest, dunes
def tent(cx,base,w,h):
    o=f'<ellipse cx="{cx}" cy="{base-h*0.45}" rx="{w*0.9}" ry="{h*1.1}" fill="url(#glow)" opacity=".6"/>'
    l,r=cx-w/2,cx+w/2;top=base-h
    o+=f'<path d="M{l-40},{base}Q{l},{top+h*0.35} {cx-w*0.18},{top+12}Q{cx},{top-10} {cx+w*0.18},{top+12}Q{r},{top+h*0.35} {r+40},{base}Z" fill="#E9DFC7"/>'
    o+=f'<path d="M{l-40},{base}Q{l},{top+h*0.35} {cx-w*0.18},{top+12}Q{cx},{top-10} {cx+w*0.18},{top+12}Q{r},{top+h*0.35} {r+40},{base}" fill="none" stroke="{GOLD}" stroke-width="4"/>'
    # stripes of the cloth
    for k in range(-3,4):
        x=cx+k*w*0.14
        o+=f'<path d="M{x},{top+8+abs(k)*10}Q{x+k*8},{base-h*0.4} {x+k*22},{base}" stroke="#B8892B" stroke-opacity=".45" stroke-width="3" fill="none"/>'
    # the open front with the lamp
    o+=f'<path d="M{cx-w*0.2},{base}L{cx-w*0.12},{base-h*0.55}L{cx+w*0.12},{base-h*0.55}L{cx+w*0.2},{base}Z" fill="#3A2210"/>'
    o+=f'<circle cx="{cx}" cy="{base-h*0.3}" r="60" fill="url(#glow)"/><circle cx="{cx}" cy="{base-h*0.3}" r="10" fill="#FFE7A8"/>'
    # poles
    for dx in (-w*0.18,w*0.18):
        o+=f'<line x1="{cx+dx}" y1="{top+6}" x2="{cx+dx}" y2="{top-30}" stroke="{GOLD}" stroke-width="6" stroke-linecap="round"/>'
    # ropes
    o+=f'<line x1="{l-40}" y1="{base}" x2="{l-160}" y2="{base+30}" stroke="{GOLD}" stroke-opacity=".6" stroke-width="2"/><line x1="{r+40}" y1="{base}" x2="{r+160}" y2="{base+30}" stroke="{GOLD}" stroke-opacity=".6" stroke-width="2"/>'
    return o
CAMEL=("M22,64 C30,40 52,14 74,16 C96,18 104,42 116,50 C126,56 136,60 146,54 C154,48 160,32 168,22 C172,17 180,16 188,20 "
       "L197,30 C198,34 194,37 188,36 L180,35 C174,42 168,56 160,70 C152,84 144,94 134,98 L133,132 L131,158 L125,158 L126,132 L122,104 "
       "L116,105 L115,132 L113,158 L107,158 L108,132 L103,106 C92,108 76,108 66,104 L64,130 L62,158 L56,158 L57,130 L55,108 L49,108 "
       "L47,130 L45,158 L39,158 L40,130 L37,100 C28,96 22,86 20,76 C16,84 14,96 12,104 L10,102 C12,90 16,74 22,64 Z")
def camel(x,y,s,col='#050C3A',edge=.55,flip=False):
    """a standing dromedary, its feet on y; s = scale (200 x 160 at 1)"""
    t=f'translate({x},{y-160*s}) scale({-s if flip else s},{s})'+(' translate(-200,0)' if flip else '')
    return f'<path d="{CAMEL}" transform="{t}" fill="{col}" stroke="{GOLD}" stroke-opacity="{edge}" stroke-width="{2/s:.2f}" stroke-linejoin="round"/>'
s=defs()+f'<rect width="{W}" height="{H}" fill="url(#sky)"/>'+stars(300,2,1650)+crescent(250,360,55)
s+=f'<path d="M0,1900C260,1820 640,1840 {W},1780V{H}H0Z" fill="#0A1A66"/>'
s+=tent(600,1960,450,250)+camel(40,1995,1.05)
s+=dunes(1950)
s+=f'<g opacity=".9">{zigzag(2330,14,36,GOLD,3)}{zigzag(2362,14,36,RED,3,.8)}</g>'
pages['khaima']=s
# 3 leatherwork: bands at top and bottom, a lozenge medallion low in the middle, the centre left calm
def medallion(cx,cy,r):
    o=f'<circle cx="{cx}" cy="{cy}" r="{r*1.6}" fill="url(#glow)" opacity=".35"/>'
    o+=f'<path d="M{cx},{cy-r}L{cx+r*0.7},{cy}L{cx},{cy+r}L{cx-r*0.7},{cy}Z" fill="none" stroke="{GOLD}" stroke-width="4"/>'
    o+=f'<path d="M{cx},{cy-r*0.78}L{cx+r*0.54},{cy}L{cx},{cy+r*0.78}L{cx-r*0.54},{cy}Z" fill="#071248" stroke="{GOLD}" stroke-width="1.5"/>'
    o+=f'<path d="M{cx},{cy-r*0.5}L{cx+r*0.34},{cy}L{cx},{cy+r*0.5}L{cx-r*0.34},{cy}Z" fill="{RED}"/>'
    o+=f'<path d="M{cx},{cy-r*0.25}L{cx+r*0.17},{cy}L{cx},{cy+r*0.25}L{cx-r*0.17},{cy}Z" fill="{GOLD}"/>'
    for a in range(0,360,45):
        x,y=cx+r*1.08*math.sin(math.radians(a)),cy-r*1.08*math.cos(math.radians(a))
        o+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="6" fill="{GREEN if a%90 else GOLD}"/>'
    # fringes like the tassels of a leather cushion
    for k in range(-6,7):
        x=cx+k*14;o+=f'<line x1="{x}" y1="{cy+r+20}" x2="{x}" y2="{cy+r+80+(6-abs(k))*6}" stroke="{GOLD}" stroke-width="3" stroke-linecap="round"/>'
    return o
s=defs()+f'<rect width="{W}" height="{H}" fill="url(#sky)"/>'+stars(120,3,2400)
s+=leather_band(0,150)+leather_band(150,0) if False else ''
s=defs()+f'<rect width="{W}" height="{H}" fill="url(#sky)"/>'+stars(120,3,2400)
s+=leather_band(60,130)+f'<g opacity=".55">{zigzag(215,10,30,GOLD,2)}</g>'
s+=medallion(540,1850,150)
s+=f'<g opacity=".55">{zigzag(2165,10,30,GOLD,2)}</g>'+leather_band(2200,130)
pages['jild']=s
# 4 tea (atay): the teapot and glasses on a tray, steam rising, at the bottom
def teapot(cx,base,s):
    o=f'<ellipse cx="{cx}" cy="{base}" rx="{330*s}" ry="{40*s}" fill="#071248" stroke="{GOLD}" stroke-width="3"/>'
    o+=f'<ellipse cx="{cx}" cy="{base-6*s}" rx="{300*s}" ry="{30*s}" fill="none" stroke="{GOLD}" stroke-opacity=".5" stroke-width="1.5" stroke-dasharray="8 6"/>'
    by=base-20*s
    body=(f'M{cx-80*s},{by}C{cx-140*s},{by-40*s} {cx-130*s},{by-150*s} {cx-60*s},{by-170*s}L{cx+60*s},{by-170*s}'
          f'C{cx+130*s},{by-150*s} {cx+140*s},{by-40*s} {cx+80*s},{by}Z')
    o+=f'<path d="{body}" fill="url(#gold)" stroke="#8C6420" stroke-width="2"/>'
    # spout and handle
    o+=f'<path d="M{cx+100*s},{by-70*s}C{cx+170*s},{by-80*s} {cx+190*s},{by-170*s} {cx+250*s},{by-230*s}L{cx+258*s},{by-222*s}C{cx+210*s},{by-160*s} {cx+190*s},{by-60*s} {cx+110*s},{by-40*s}Z" fill="url(#gold)" stroke="#8C6420" stroke-width="2"/>'
    o+=f'<path d="M{cx-110*s},{by-140*s}C{cx-200*s},{by-150*s} {cx-210*s},{by-50*s} {cx-115*s},{by-50*s}" fill="none" stroke="url(#gold)" stroke-width="{14*s}" stroke-linecap="round"/>'
    # neck, lid and finial
    o+=f'<path d="M{cx-60*s},{by-170*s}L{cx-45*s},{by-215*s}L{cx+45*s},{by-215*s}L{cx+60*s},{by-170*s}Z" fill="url(#gold)" stroke="#8C6420" stroke-width="2"/>'
    o+=f'<path d="M{cx-55*s},{by-215*s}Q{cx},{by-300*s} {cx+55*s},{by-215*s}Z" fill="url(#gold)" stroke="#8C6420" stroke-width="2"/>'
    o+=f'<circle cx="{cx}" cy="{by-305*s}" r="{12*s}" fill="url(#gold)"/>'
    # engraved band
    o+=f'<path d="M{cx-118*s},{by-95*s}Q{cx},{by-80*s} {cx+118*s},{by-95*s}" fill="none" stroke="#8C6420" stroke-width="2"/>'
    for k in range(-4,5): o+=f'<path d="M{cx+k*24*s},{by-100*s}l{8*s},{-12*s}l{8*s},{12*s}" fill="none" stroke="#8C6420" stroke-width="1.6"/>'
    # glasses with foam
    for gx in (-260,-185,185,260):
        x=cx+gx*s;gb=base-12*s
        o+=f'<path d="M{x-24*s},{gb-90*s}L{x+24*s},{gb-90*s}L{x+19*s},{gb}L{x-19*s},{gb}Z" fill="#8A3B12" fill-opacity=".85" stroke="{CREAM}" stroke-opacity=".8" stroke-width="2"/>'
        o+=f'<path d="M{x-23*s},{gb-90*s}L{x+23*s},{gb-90*s}L{x+22*s},{gb-72*s}L{x-22*s},{gb-72*s}Z" fill="{CREAM}"/>'
        o+=f'<path d="M{x-22*s},{gb-60*s}l{6*s},{-8*s}l{6*s},{8*s}l{6*s},{-8*s}l{6*s},{8*s}l{6*s},{-8*s}l{6*s},{8*s}" fill="none" stroke="{GOLD}" stroke-width="1.6"/>'
    # steam
    for k,dx in enumerate((-30,0,30)):
        x=cx+250*s+dx*0.6;y=by-240*s
        o+=f'<path d="M{x},{y}c{-25},{-40} {25},{-70} 0,{-110}s{25},{-70} 0,{-110}" fill="none" stroke="{CREAM}" stroke-opacity="{.35-k*.08}" stroke-width="5" stroke-linecap="round"/>'
    return o
s=defs()+f'<rect width="{W}" height="{H}" fill="url(#sky)"/>'+stars(200,4,1700)+crescent(820,330,48)
s+=f'<circle cx="540" cy="2010" r="520" fill="url(#glow)" opacity=".35"/>'
s+=teapot(540,2150,1.15)
s+=f'<g opacity=".85">{zigzag(2290,12,32,GOLD,3)}{zigzag(2322,12,32,GREEN,3)}{zigzag(2354,12,32,RED,3)}</g>'
pages['atay']=s
# 5 Oualata: a door framed by the red ochre and white mouldings of Oualata's walls, in gold on night blue
def oualata(cx,base,w,h):
    o='';top=base-h
    # the wall face
    o+=f'<rect x="{cx-w}" y="{top-120}" width="{2*w}" height="{h+120}" fill="#0A1450"/>'
    # mouldings: arches of loops and spirals around the door, in ochre-red outlined in gold
    for k,(rw,rh,col,sw) in enumerate([(w*0.92,h+90,RED,26),(w*0.78,h+50,GOLD,6),(w*0.66,h+22,CREAM,4)]):
        o+=f'<path d="M{cx-rw/2*1.2},{base}V{base-rh+rw*0.6}Q{cx-rw/2*1.2},{base-rh} {cx},{base-rh}Q{cx+rw/2*1.2},{base-rh} {cx+rw/2*1.2},{base-rh+rw*0.6}V{base}" fill="none" stroke="{col}" stroke-width="{sw}" stroke-linecap="round"/>'
    # spirals and loops on both sides (Oualata's curling motifs)
    for side in (-1,1):
        for j in range(4):
            x=cx+side*w*0.72;y=base-80-j*150
            o+=f'<path d="M{x},{y}c{side*40},0 {side*40},-60 0,-60c{-side*26},0 {-side*26},38 0,38c{side*14},0 {side*14},-18 0,-18" fill="none" stroke="{GOLD}" stroke-width="5" stroke-linecap="round"/>'
            o+=f'<circle cx="{x-side*30}" cy="{y-30}" r="7" fill="{RED}"/>'
    # crown motif over the arch
    o+=f'<path d="M{cx-120},{base-h-110}Q{cx},{base-h-230} {cx+120},{base-h-110}" fill="none" stroke="{GOLD}" stroke-width="6"/>'
    for k in (-2,-1,0,1,2):
        o+=f'<circle cx="{cx+k*45}" cy="{base-h-150-(2-abs(k))*16}" r="9" fill="{CREAM if k%2 else GOLD}"/>'
    # the wooden door with its studs
    dw=w*0.42;dh=h*0.82
    o+=f'<path d="M{cx-dw/2},{base}V{base-dh+dw*0.5}Q{cx},{base-dh-dw*0.15} {cx+dw/2},{base-dh+dw*0.5}V{base}Z" fill="#3A2210" stroke="{GOLD}" stroke-width="4"/>'
    for yy in range(int(base-dh+dw*0.5)+20,int(base)-10,46):
        for xx in (cx-dw/2+22,cx,cx+dw/2-22):
            o+=f'<circle cx="{xx}" cy="{yy}" r="6" fill="url(#gold)"/>'
    o+=f'<line x1="{cx}" y1="{base-dh+dw*0.3}" x2="{cx}" y2="{base}" stroke="{GOLD}" stroke-opacity=".5" stroke-width="2"/>'
    o+=f'<circle cx="{cx+28}" cy="{base-dh*0.42}" r="14" fill="none" stroke="url(#gold)" stroke-width="5"/>'
    return o
s=defs()+f'<rect width="{W}" height="{H}" fill="url(#sky)"/>'+stars(160,5,1200)
s+=oualata(540,2300,470,760)
s+=f'<rect x="0" y="2300" width="{W}" height="100" fill="#050C3A"/><line x1="0" y1="2300" x2="{W}" y2="2300" stroke="{GOLD}" stroke-width="4"/>'
pages['walata']=s
# 6 caravan: a line of camels at dusk on the dune crest, the sky turning from gold at the horizon to night
def ridge(x):
    # the dune crest M0,1860 C200,1800 520,1760 760,1720, sampled
    best=None
    for i in range(201):
        t=i/200;px=(1-t)**3*0+3*(1-t)**2*t*200+3*(1-t)*t*t*520+t**3*760
        py=(1-t)**3*1860+3*(1-t)**2*t*1800+3*(1-t)*t*t*1760+t**3*1720
        if best is None or abs(px-x)<abs(best[0]-x): best=(px,py)
    return best[1]
cara=''.join(camel(40+i*150,ridge(40+i*150+62)+3,0.62,'#03062B',0) for i in range(5))
s=defs('<linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03062B"/><stop offset=".4" stop-color="#0B1F7A"/><stop offset=".62" stop-color="#3B3A8A"/><stop offset=".72" stop-color="#C78B3E"/><stop offset=".78" stop-color="#E6BC62"/></linearGradient>')
s+=f'<rect width="{W}" height="{H}" fill="url(#dusk)"/>'+stars(220,6,1100)+crescent(780,300,46)
s+=f'<path d="M0,1860C200,1800 520,1760 760,1720S1000,1690 {W},1700V{H}H0Z" fill="#03062B"/>'
s+=cara
s+=f'<path d="M0,2050C300,1960 700,2000 {W},1930V{H}H0Z" fill="#020418"/>'
s+=f'<path d="M0,2050C300,1960 700,2000 {W},1930" fill="none" stroke="{GOLD}" stroke-opacity=".45" stroke-width="2"/>'
s+=leather_band(2260,110)
pages['qafila']=s
for k,v in pages.items(): open(f'{k}.html','w').write(page(v))
print(list(pages))
