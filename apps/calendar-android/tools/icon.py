from PIL import Image, ImageFilter, ImageDraw
import numpy as np, os, io, base64
R='/home/claude/erriwaya-videos/apps/calendar-android/res/'
art=Image.open('art.png').convert('RGBA');full=Image.open('fixed.png').convert('RGB')
D={'mdpi':1,'hdpi':1.5,'xhdpi':2,'xxhdpi':3,'xxxhdpi':4}
def ground(px):
    y,x=np.mgrid[0:px,0:px]/px;r=np.hypot(x-.5,y-.42)
    c0=np.array([12,92,52]);c1=np.array([1,44,24]);t=np.clip(r/0.75,0,1)[...,None]
    return Image.fromarray((c0*(1-t)+c1*t).astype(np.uint8))
def fore(px):
    can=Image.new('RGBA',(px,px),(0,0,0,0))
    h=round(px*58/108);w=round(h*art.width/art.height)
    a=art.resize((w,h),Image.LANCZOS)
    x=(px-w)//2;y=(px-h)//2+round(px*1/108)
    sh=Image.new('RGBA',(px,px),(0,0,0,0));al=a.split()[3].point(lambda v:v*0.55)
    sh.paste((0,0,0,255),(x,y+round(px*1.6/108)),al);sh=sh.filter(ImageFilter.GaussianBlur(px*1.8/108))
    can.alpha_composite(sh);can.alpha_composite(a,(x,y));return can
for k,s in D.items():
    os.makedirs(R+f'mipmap-{k}',exist_ok=True)
    full.resize((round(48*s),)*2,Image.LANCZOS).save(R+f'mipmap-{k}/ic_launcher.png')
    fore(round(108*s)).save(R+f'mipmap-{k}/ic_launcher_foreground.png')
    ground(round(108*s)).save(R+f'mipmap-{k}/ic_launcher_background.png')
os.makedirs(R+'mipmap-anydpi-v26',exist_ok=True)
open(R+'mipmap-anydpi-v26/ic_launcher.xml','w').write('''<?xml version="1.0" encoding="utf-8"?>
<!-- the launcher icon from Android 8: the calendar-clock with the Chinguetti minaret (foreground) on its green (background),
     so every launcher's mask (circle, squircle…) shows it whole; made by tools/icon.py from the owner's design, 16 Nov 2026 -->
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
''')
full.resize((512,512),Image.LANCZOS).save('/home/claude/erriwaya-videos/apps/calendar-android/icon-source.png')
# a preview of the masks
prev=Image.new('RGB',(3*230+40,250),(235,235,235))
for i,shape in enumerate(['circle','squircle','square']):
    px=216;g=ground(px).convert('RGBA');g.alpha_composite(fore(px));m=Image.new('L',(px,px),0);d=ImageDraw.Draw(m)
    vis=int(px*72/108);o=(px-vis)//2
    if shape=='circle':d.ellipse((o,o,o+vis,o+vis),255)
    elif shape=='squircle':d.rounded_rectangle((o,o,o+vis,o+vis),radius=vis*0.3,fill=255)
    else:d.rounded_rectangle((o,o,o+vis,o+vis),radius=vis*0.08,fill=255)
    tile=Image.new('RGB',(px,px),(235,235,235));tile.paste(g.convert('RGB'),(0,0),m)
    prev.paste(tile.crop((o-5,o-5,o+vis+5,o+vis+5)).resize((210,210)),(10+i*240,20))
prev.save('masks.png')
# the seal in the page header (a small JPEG)
b=io.BytesIO();full.resize((160,160),Image.LANCZOS).save(b,'JPEG',quality=88);open('seal.b64','w').write(base64.b64encode(b.getvalue()).decode())
