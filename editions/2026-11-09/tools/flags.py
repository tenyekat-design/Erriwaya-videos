# Drawn flag cards for stories with no matching photo (1800x1800, flags centred above the lower third).
import math, sys
from PIL import Image, ImageDraw, ImageFilter
S = 4
def star(d, cx, cy, r, col, rot=-90):
    d.polygon([(cx + (r if i % 2 == 0 else r * .382) * math.cos(math.radians(rot + i * 36)),
                cy + (r if i % 2 == 0 else r * .382) * math.sin(math.radians(rot + i * 36))) for i in range(10)], fill=col)
def tricolor(w, h, cols):
    im = Image.new('RGB', (w, h)); d = ImageDraw.Draw(im)
    for i, c in enumerate(cols): d.rectangle([i * w / 3, 0, (i + 1) * w / 3, h], fill=c)
    return im, d
def mali(w, h): return tricolor(w, h, ['#14B53A', '#FCD116', '#CE1126'])[0]
def senegal(w, h):
    im, d = tricolor(w, h, ['#00853F', '#FDEF42', '#E31B23']); star(d, w / 2, h / 2, h * .17, '#00853F'); return im
def card(flags, out):
    W = H = 1800
    top, bot = (22, 51, 111), (11, 31, 75)
    bg = Image.new('RGB', (W, H)); d = ImageDraw.Draw(bg)
    for y in range(H):
        f = y / H; d.line([(0, y), (W, y)], fill=tuple(int(top[k] * (1 - f) + bot[k] * f) for k in range(3)))
    fw, fh, gap = 560, 373, 70; x0 = (W - (len(flags) * fw + (len(flags) - 1) * gap)) // 2; y0 = int(H * .40 - fh / 2)
    for i, fl in enumerate(flags):
        img = fl(fw * S, fh * S).resize((fw, fh), Image.LANCZOS); x = x0 + i * (fw + gap)
        sh = Image.new('L', (W, H), 0); ImageDraw.Draw(sh).rounded_rectangle([x + 10, y0 + 22, x + fw + 10, y0 + fh + 22], 18, fill=150)
        bg.paste((5, 12, 30), (0, 0), sh.filter(ImageFilter.GaussianBlur(26)))
        m = Image.new('L', (fw, fh), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, fw - 1, fh - 1], 16, fill=255)
        bg.paste(img, (x, y0), m)
    bg.save(out, quality=93)
card([mali, senegal], sys.argv[1] + '/ml-sn-flags.jpg')
