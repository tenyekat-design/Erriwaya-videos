import cv2,numpy as np,json
def ext(img,yc,hh,xmin,xmax):
    a=img[int(yc-hh*.6):int(yc+hh*.6),xmin:xmax].astype(int);r,g,b=a[...,2],a[...,1],a[...,0]
    ink=(r<70)&(g<70)&(b<70)&(abs(r-b)<14)&(abs(r-g)<14);cols=np.where(ink.sum(0)>1)[0]
    return (xmin+cols.min()-4,xmin+cols.max()+4)
def build(f,sura,lines,marks,hh,rad,xmin,xmax,clamp=None):
    """lines: y centers of verse lines (reading order); marks: [(ayah, line index, x)] in order"""
    img=cv2.imread(f);H=img.shape[0];E=[ext(img,y,hh,xmin,xmax) for y in lines]
    if clamp:E=[(max(e[0],c[0]),min(e[1],c[1])) for e,c in zip(E,clamp)]
    out=[];cur=(0,E[0][1])
    for ay,li,x in marks:
        rs=[];l0,x0=cur
        def add(l,xa,xb):
            xa=max(xa,E[l][0]);xb=min(xb,E[l][1])
            if xb-xa>10:rs.extend([int(xa),int(H-(lines[l]+hh/2)),int(xb-xa),int(hh)])
        if l0==li:add(li,x-rad,x0)
        else:
            add(l0,E[l0][0],x0)
            for l in range(l0+1,li):add(l,E[l][0],E[l][1])
            add(li,x-rad,E[li][1])
        out.append([sura,ay]+rs)
        cur=(li,x-rad-2)
        if cur[1]-E[li][0]<20 and li+1<len(lines):cur=(li+1,E[li+1][1])
    return out
R={}
R['warsh']={1:build('w1.webp',1,[802,902,995,1091,1193,1285],[(1,0,426),(2,1,655),(3,1,314),(4,2,420),(5,3,631),(6,4,736),(7,5,517)],90,27,275,965),
            2:build('w2.webp',2,[809,900,991,1081,1172,1259],[(1,1,833),(2,2,636),(3,3,274),(4,5,519)],90,26,240,1000)}
R['hafs']={1:build('h1.jpg',1,[413,467,520,573,626,679,732],[(1,0,318),(2,1,275),(3,2,446),(4,2,231),(5,3,309),(6,4,419),(7,6,342)],52,16,215,632,[(298,545),(255,575),(212,630),(212,630),(212,630),(230,605),(320,560)]),
           2:build('h2.jpg',2,[468,521,573,625,679,732],[(1,0,527),(2,1,528),(3,2,421),(4,3,237),(5,5,340)],52,16,215,632,[(230,615),(212,630),(212,630),(212,630),(240,600),(320,560)])}
R['qaloon']={1:build('q1.jpg',1,[600,677,754,830,907,980],[(1,0,446),(2,1,694),(3,1,421),(4,2,429),(5,3,515),(6,4,560),(7,5,440)],74,17,150,960),
             2:build('q2.jpg',2,[591,670,748,826,902,980],[(1,1,676),(2,2,555),(3,3,304),(4,5,456)],74,17,150,960)}
json.dump(R,open('rg12.json','w'))
from PIL import Image,ImageDraw
for k,f in [('warsh','w'),('hafs','h'),('qaloon','q')]:
    for p in (1,2):
        im=Image.open(f'{f}{p}.'+('webp' if f=='w' else 'jpg')).convert('RGB');d=ImageDraw.Draw(im,'RGBA');H=im.height
        cols=[(255,0,0,70),(0,0,255,70)]
        for i,v in enumerate(R[k][p]):
            for j in range(2,len(v),4):
                x,b,w,h=v[j:j+4];d.rectangle([x,H-b-h,x+w,H-b],fill=cols[i%2],outline=(0,0,0,150))
        im.thumbnail((520,760));im.save(f'chk-{k}{p}.png')
