import cv2, numpy as np
from PIL import Image, ImageFilter
im=cv2.imread('fixed.png');H,W=im.shape[:2]
hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV)
# the outer ground: dark green (and the black outside the rounded square), reached from the corners without crossing gold
bgish=((hsv[...,0]>45)&(hsv[...,0]<100)&(hsv[...,2]<140))|(hsv[...,2]<40)
m=np.zeros((H+2,W+2),np.uint8);reg=bgish.astype(np.uint8)*255
ff=reg.copy()
for seed in [(5,5),(W-6,5),(5,H-6),(W-6,H-6),(W//2,20),(20,H//2),(W-20,H//2),(W//2,H-20)]:
    if ff[seed[1],seed[0]]==255: cv2.floodFill(ff,m,seed,128)
ground=(ff==128)
art=~ground
# the calendar's body is a rounded rectangle: take it whole (its green header must not leak into the ground);
# above it, the colour cut keeps the tower's top and the two rings
body=np.zeros((H,W),np.uint8);cv2.rectangle(body,(150+58,148),(1103-58,1156),255,-1);cv2.rectangle(body,(150,148+58),(1103,1156-58),255,-1)
for c in [(150+58,148+58),(1103-58,148+58),(150+58,1156-58),(1103-58,1156-58)]:cv2.circle(body,c,58,255,-1)
art=(body>0)|(art&(np.mgrid[0:H,0:W][0]<215))
# clean: keep the largest component, fill holes
n,lab,st,_=cv2.connectedComponentsWithStats(art.astype(np.uint8),8)
k=1+np.argmax(st[1:,cv2.CC_STAT_AREA]);art=lab==k
art=cv2.morphologyEx(art.astype(np.uint8)*255,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
a=cv2.GaussianBlur(art,(0,0),0.8)
rgba=cv2.cvtColor(im,cv2.COLOR_BGR2BGRA);rgba[...,3]=a
ys,xs=np.nonzero(art);x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max();print('art box',x0,x1,y0,y1)
cv2.imwrite('art.png',rgba[y0:y1+1,x0:x1+1])
# ground colour: the median of the outer green
g=np.median(im[ground&(hsv[...,2]>40)],axis=0);print('ground BGR',g)
open('ground.txt','w').write('#%02X%02X%02X'%(int(g[2]),int(g[1]),int(g[0])))
