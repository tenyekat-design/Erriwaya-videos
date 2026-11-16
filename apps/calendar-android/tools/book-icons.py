import cv2,numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter
SRC='/home/claude/erriwaya-videos/apps/calendar-android/assets/img/'
def base(tpl,hue=None,sat=1.0):
    im=cv2.imread(SRC+f'book-{tpl}.webp')
    x0,y0,x1,y1=82,135,228,222
    roi=im[y0:y1,x0:x1];hsv=cv2.cvtColor(roi,cv2.COLOR_BGR2HSV)
    m=((hsv[...,2]>120)&(hsv[...,1]>60)).astype(np.uint8)*255
    m=cv2.dilate(m,np.ones((5,5),np.uint8))
    full=np.zeros(im.shape[:2],np.uint8);full[y0:y1,x0:x1]=m
    im=cv2.inpaint(im,full,7,cv2.INPAINT_TELEA)
    # smooth the repaired area a little, with grain
    blur=cv2.GaussianBlur(im,(0,0),4);f=(cv2.GaussianBlur(full,(0,0),3)/255.0)[...,None]
    im=(im*(1-f)+blur*f).astype(np.uint8)
    if hue is not None:
        hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV).astype(np.float32);V=hsv[...,2];S=hsv[...,1]
        w=np.clip((150-V)/50,0,1)*(1-((hsv[...,0]>12)&(hsv[...,0]<32)&(V>140)&(S>90)))   # dark leather and pattern, not the gold
        hsv[...,0]=(hsv[...,0]*(1-w)+hue*w)%180;hsv[...,1]=np.clip(S*(1-w)+S*sat*w,0,255)
        im=cv2.cvtColor(hsv.astype(np.uint8),cv2.COLOR_HSV2BGR)
    return Image.fromarray(im[...,::-1])
def title(img,small,big,size=40):
    d=ImageDraw.Draw(img);F=ImageFont.truetype('ruqaa.ttf',size);Fs=ImageFont.truetype('amiri.ttf',22)
    lay=Image.new('RGBA',img.size,(0,0,0,0));dl=ImageDraw.Draw(lay)
    cx=155;y=150
    if small:dl.text((cx,y),small,font=Fs,anchor='mm',fill=(240,205,120,255),direction='rtl',language='ar');y+=36
    else:y+=14
    lines=big.split('\n')
    for i,l in enumerate(lines):
        fs=size
        while True:
            F=ImageFont.truetype('ruqaa.ttf',fs);w=dl.textlength(l,font=F,direction='rtl',language='ar')
            if w<128 or fs<20:break
            fs-=2
        dl.text((cx,y+i*(fs+8)),l,font=F,anchor='mm',fill=(240,205,120,255),direction='rtl',language='ar')
    sh=lay.split()[3].filter(ImageFilter.GaussianBlur(1.5));shadow=Image.new('RGBA',img.size,(30,15,0,0));shadow.putalpha(sh.point(lambda a:a*0.8))
    img=img.convert('RGBA');img.alpha_composite(shadow,(1,2))
    # gold gradient
    gold=Image.new('RGBA',img.size);gd=ImageDraw.Draw(gold)
    for yy in range(img.size[1]):
        t=(yy-130)/100;c=(int(250-40*t),int(222-60*t),int(150-90*t),255);gd.line([(0,yy),(330,yy)],fill=c)
    gold.putalpha(lay.split()[3]);img.alpha_composite(gold)
    return img.convert('RGB')
B=[('arbaun','akhdari',75,1.0,'','الأربعون\nالنووية'),('riyad','ajrumiyya',90,1.0,'','رياض\nالصالحين'),('risala','akhdari',None,1,'','رسالة ابن\nأبي زيد'),
   ('shamail','ajrumiyya',125,1.0,'','الشمائل\nالمحمدية'),('alfiyya','akhdari',175,1.2,'','ألفية\nابن مالك'),('lamiyya','ajrumiyya',105,1.0,'','لامية\nالأفعال'),
   ('qatr','akhdari',40,1.0,'','قطر الندى'),('mulha','ajrumiyya',150,1.0,'','ملحة\nالإعراب')]
for k,tpl,h,s,sm,bg in B:
    im=title(base(tpl,h,s),sm,bg);im.save(f'book-{k}.webp',quality=88);im.save(f'p-{k}.png')
ims=[Image.open(f'p-{k}.png') for k,*_ in B];c=Image.new('RGB',(330*4,660),'white')
for i,m in enumerate(ims):c.paste(m,((i%4)*330,(i//4)*330))
c.save('all.png')
