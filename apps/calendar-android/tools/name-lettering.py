# Cuts the names in Thuluth calligraphy (the owner's pictures of 19 Nov 2026: white on black, one black on white) into
# res/drawable-nodpi/nm_<key>.png (white with alpha, trimmed, at most 1200 px wide) and name_preview.webp.
# Usage: python3 tools/name-lettering.py <uploads folder>
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage as nd
U = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/uploads/'
OUT = os.path.join(os.path.dirname(__file__), '..', 'res', 'drawable-nodpi') + '/'
NAMES = [  # key, source, name (the order of NameWidget.NAMES)
    ('abdurrahman', 'b48022e1', 'عبد الرحمن'), ('ahmed', 'b60398bc', 'أحمد'), ('mohamedahmed', '5ad28a03', 'محمد أحمد'),
    ('mohamedlemine', 'daaf637a', 'محمد الأمين'), ('mohamedali', '9ecb6851', 'محمد عالي'), ('mohamedsalem', 'cab21821', 'محمد سالم'),
    ('mohamedcheikh', '4d1ea45b', 'محمد الشيخ'), ('mohamedmahmoud', '2df72846', 'محمد محمود')]
def cut(path):
    g = np.asarray(Image.open(path).convert('L')).astype(float)
    if np.median(g) > 128: g = 255 - g              # black lettering on white: turn it round
    a = np.clip((g - 60) / 140, 0, 1)                # ground (dark, a little noisy) to 0, the strokes to 1
    lab, n = nd.label(a > 0.4)                       # drop specks
    if n:
        sz = nd.sum(np.ones_like(a), lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s > 60])
        a = a * nd.binary_dilation(keep, iterations=3)
    ys, xs = np.nonzero(a > 0.03)
    m = 6
    a = a[max(0, ys.min() - m):ys.max() + m + 1, max(0, xs.min() - m):xs.max() + m + 1]
    img = Image.fromarray((a * 255).astype(np.uint8))
    if img.width > 1200: img = img.resize((1200, round(img.height * 1200 / img.width)), Image.LANCZOS)
    return Image.merge('RGBA', [Image.new('L', img.size, 255)] * 3 + [img])
for k, f, _ in NAMES:
    cut(U + f + '-image.png').save(OUT + 'nm_' + k + '.png', optimize=True)
# the picker's preview: one name on the widgets' night blue
pw, ph = 500, 220
bg = Image.new('RGBA', (pw, ph), (6, 16, 74, 255))
d = Image.open(OUT + 'nm_mohamedsalem.png'); s = min((pw - 30) / d.width, (ph - 30) / d.height)
d = d.resize((round(d.width * s), round(d.height * s)), Image.LANCZOS)
bg.paste(d, ((pw - d.width) // 2, (ph - d.height) // 2), d); bg.convert('RGB').save(OUT + 'name_preview.webp', quality=90)
