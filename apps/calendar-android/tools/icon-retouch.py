# Retouches the owner's icon (16 Nov 2026): the lower moon phases and crescents taken off the dial, the days in one row.
import cv2, numpy as np
im=cv2.imread('src.png').astype(np.float32)
H,W=im.shape[:2]
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
rng=np.random.default_rng(3)
gray=cv2.cvtColor(im.astype(np.uint8),cv2.COLOR_BGR2GRAY).astype(np.float32)
hp=gray-cv2.GaussianBlur(gray,(0,0),4)
def grain(std,blur=0.8):
    n=rng.normal(0,1,(H,W)).astype(np.float32);n=cv2.GaussianBlur(n,(0,0),blur);return n/n.std()*std
def fit(img,sample,target,F):
    ys,xs=np.nonzero(sample);yt,xt=np.nonzero(target);res=img.copy()
    A=F(xs,ys);At=F(xt,yt)
    for c in range(3):
        coef,*_=np.linalg.lstsq(A,img[ys,xs,c],rcond=None);res[yt,xt,c]=At@coef
    return res
# ---- dial: colour as a function of the distance from its centre (its vignette), and a little of x and y
cx,cy=625,540
r=np.hypot(xx-cx,yy-cy)
hsv=cv2.cvtColor(im.astype(np.uint8),cv2.COLOR_BGR2HSV)
green=(hsv[...,0]>50)&(hsv[...,0]<95)&(hsv[...,1]>80)&(hsv[...,2]<130)
dial=r<322
tick=(np.abs(xx-625)<24)&(yy>836)
pivot=np.hypot(xx-625,yy-643)<46
tower=(np.abs(xx-625)<150)&(yy<660)
symbols=((np.hypot(xx-425,yy-355)<70)|(np.hypot(xx-830,yy-355)<70)|((np.abs(yy-527)<16)&((np.abs(xx-330)<45)|(np.abs(xx-915)<45))))
target=dial&(yy>652)&~tick&~pivot
sample=dial&green&~tower&~symbols&~target&(r<310)
sample|= dial&green&(yy>652)&~tick&~pivot&False
def F(x,y):
    x=x.astype(np.float32);y=y.astype(np.float32);rr=np.hypot(x-cx,y-cy)/320;X=(x-cx)/320;Y=(y-cy)/320
    return np.stack([np.ones_like(rr),rr,rr**2,rr**3,rr**4,X,Y,X*Y,Y*Y],1)
filled=fit(im,sample,target,F)
filled[target]+=grain(float(hp[sample].std()))[target][:,None]
m=cv2.GaussianBlur(target.astype(np.float32),(0,0),12)[...,None]
m=np.where(target[...,None],np.maximum(m,0.0),m)
out=im*(1-m)+filled*m
# ---- the day panel: one row, centred, on clean sand (fitted on the panel's margins), feathered into the original
px0,px1,py0,py1=228,1022,912,1098
panel=(xx>=px0)&(xx<=px1)&(yy>=py0)&(yy<=py1)
sq=(xx>=252)&(xx<=998)&(yy>=922)&(yy<=1096)
ps=panel&~sq&(yy>936)
med=np.median(gray[ps]);ps&=np.abs(gray-med)<25
def F2(x,y):
    X=(x.astype(np.float32)-625)/400;Y=(y.astype(np.float32)-1005)/100
    return np.stack([np.ones_like(X),X,Y,X*X,X*Y,Y*Y],1)
row=out[1004:1092,250:1000].copy()
sand=fit(out,ps,sq,F2)
sand[sq]+=grain(float(hp[ps].std()),0.7)[sq][:,None]
m2=cv2.GaussianBlur(sq.astype(np.float32),(0,0),6)[...,None]*sq[...,None]
out=out*(1-m2)+sand*m2
ty=int((py0+py1)/2)-44
a=np.ones(row.shape[:2],np.float32)
for k in range(6):a[k,:]*=k/6;a[-1-k,:]*=k/6;a[:,k]*=k/6;a[:,-1-k]*=k/6
seg=out[ty:ty+88,250:1000];out[ty:ty+88,250:1000]=seg*(1-a[...,None])+row*a[...,None]
cv2.imwrite('fixed.png',np.clip(out,0,255).astype(np.uint8))
