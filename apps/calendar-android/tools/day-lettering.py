# Cuts the weekday names out of the owner's calligraphy (white on blue, two names per image) into res/drawable-nodpi/day_0..6.png
# (1000x500, white with alpha) and day_preview.webp. The sources were the five images sent on 16 Nov 2026 (uploads).
import numpy as np, sys
from PIL import Image
from scipy import ndimage as nd
U='/mnt/user-data/uploads/'
OUT='/home/claude/erriwaya-videos/apps/calendar-android/res/drawable-nodpi/'
def alpha_of(path):
    a=np.asarray(Image.open(path).convert('RGB')).astype(float)
    R=a[...,0]
    bg=nd.minimum_filter(R,size=81)            # the ground under the letters (they are brighter than anything near)
    bg=nd.gaussian_filter(bg,20)
    al=np.clip((R-bg)/np.maximum(1,255-bg),0,1)
    al=np.clip((al-0.12)/0.7,0,1)
    # in the light glow (a bright ground), keep only the white: the glow is light blue, the letters are not
    glow=(nd.gaussian_filter(R,40)>70)&(a[...,2]-R>35)
    al[glow]=0
    return al,a
def word(path,half,cut=None):
    al,a=alpha_of(path);h=al.shape[0];BR=a[...,2]-a[...,0]
    rows=al.sum(1);mid=h//2
    # the emptiest band near the middle separates the two words
    band=range(mid-120,mid+120)
    if cut is None: cut=min(band,key=lambda y:rows[y-6:y+6].sum())
    sub=al[:cut] if half=='top' else al[cut:]
    br=BR[:cut] if half=='top' else BR[cut:]
    # drop specks, keep the components that make the word
    lab,n=nd.label(sub>0.25);sizes=nd.sum(np.ones_like(sub),lab,range(1,n+1))
    peak=nd.mean(sub,lab,range(1,n+1))
    blue=nd.mean(br,lab,range(1,n+1))   # the letters are white; a piece of the light-blue glow is not
    keep=np.isin(lab,[i+1 for i,(s,p,bl) in enumerate(zip(sizes,peak,blue)) if s>40 and p>0.55 and bl<40])
    keep=nd.binary_dilation(keep,iterations=3)
    sub=sub*keep
    ys,xs=np.nonzero(sub>0.05);sub=sub[ys.min():ys.max()+1,xs.min():xs.max()+1]
    return sub
def place(sub,name):
    W,H=1000,500;iw,ih=980,480
    s=min(iw/sub.shape[1],ih/sub.shape[0])
    img=Image.fromarray((sub*255).astype(np.uint8)).resize((round(sub.shape[1]*s),round(sub.shape[0]*s)),Image.LANCZOS)
    A=Image.new('L',(W,H),0);A.paste(img,((W-img.width)//2,(H-img.height)//2))
    out=Image.merge('RGBA',[Image.new('L',(W,H),255)]*3+[A]);out.save(OUT+name+'.png',optimize=True)
    return out
SRC={0:('6671d60b','bottom'),1:('9c1119ab','top'),2:('801beff4','top',462),3:('0ab61462','top'),4:('0ab61462','bottom'),5:('5c92d584','top'),6:('6671d60b','top')}
import os
for d,(f,half,*c) in SRC.items():
    for ext in ('.png','.webp','.jpg'):
        p=OUT+f'day_{d}'+ext
        if os.path.exists(p): os.remove(p)
    place(word(U+f+'-image.jpg',half,*c),f'day_{d}')
# a sheet to look at
sheet=Image.new('RGB',(1000,500*7),(8,20,90))
for d in range(7):
    im=Image.open(OUT+f'day_{d}.png');sheet.paste(im,(0,500*d),im)
sheet.resize((500,1750)).save('/home/claude/days2/sheet.png')

prev=Image.open(OUT.replace('drawable-nodpi/','drawable-nodpi/')+'day_preview.webp') if os.path.exists(OUT+'day_preview.webp') else None
if prev is not None:
    w,h=prev.size
    bg=Image.new('RGBA',(w,h),(6,16,74,255))
    d=Image.open(OUT+'day_5.png').resize((w,int(w/2)) if w/2<=h else (h*2,h),Image.LANCZOS)
    bg.paste(d,((w-d.width)//2,(h-d.height)//2),d);bg.convert('RGB').save(OUT+'day_preview.webp',quality=90)
    print('preview',w,h)
