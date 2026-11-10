#!/usr/bin/env python3
"""Draws the ornamental frame laid over the plain sky-blue band of the Qalun page images and prints it
as the CSS `border-image` value used by `.qfr` in web/index-source.html.

    python3 tools/build-frame.py            # prints the url("data:image/svg+xml,...") value
    python3 tools/build-frame.py frame.svg  # also writes the SVG, to look at it
    python3 tools/build-frame.py opening 1.jpg  # the two opening pages: prints the tile and the two masks of `.qop`

The opening pages (al-Fatiha and the start of al-Baqara, same artwork) are one large sky-blue field with a
scalloped outline around a white medallion. `opening` takes page 1 of the Qalun images, finds that field, and
prints: a seamless tile to fill it (lattice and rosettes), a mask of the field, and a mask of its rim (a gold
rule along every edge and a hairline inside it). Needs Pillow, numpy and scipy.

The SVG is 300 x 300: four 66 x 66 corners and, between them, a 168-wide edge strip holding two periods
of the pattern (a gold braid with a rosette in each loop), so `border-image-slice:66` and `repeat:round`.
"""
import math, sys, urllib.parse
T, S, P = 66, 300, 84                      # frame thickness, svg size, pattern period
BLUE, DEEP, GOLD, LIGHT, SKY, WHITE = '#1B5C8E', '#123F66', '#C9A44C', '#F0DC9C', '#BFE4F8', '#FFFFFF'
C, A = 33, 13.5                            # braid: centre line and amplitude

def wave(sign, x0, x1, n=48):
    pts = [(x0 + (x1 - x0) * i / n) for i in range(n + 1)]
    return 'M' + ' L'.join(f'{x:.2f} {C + sign * A * math.sin(2 * math.pi * x / P):.2f}' for x in pts)

def rosette(cx, cy, r, petals=8):
    out = []
    for k in range(petals):
        a = 2 * math.pi * k / petals
        px, py = cx + r * .58 * math.cos(a), cy + r * .58 * math.sin(a)
        out.append(f'<ellipse cx="{px:.2f}" cy="{py:.2f}" rx="{r*.44:.2f}" ry="{r*.25:.2f}" '
                   f'transform="rotate({math.degrees(a):.1f} {px:.2f} {py:.2f})" fill="{SKY}" stroke="{WHITE}" stroke-width=".7"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{r*.26:.2f}" fill="{GOLD}" stroke="{LIGHT}" stroke-width=".7"/>')
    return ''.join(out)

def star(cx, cy, r, fill, stroke, w=1.2):
    pts = []
    for k in range(16):
        a = math.pi * k / 8 - math.pi / 2
        rr = r if k % 2 == 0 else r * .72
        pts.append(f'{cx + rr * math.cos(a):.2f} {cy + rr * math.sin(a):.2f}')
    return f'<path d="M{" L".join(pts)}Z" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round"/>'

def leaf(x, y, ang):
    return (f'<path d="M0 0C3 -3.2 7 -3.2 10 0C7 3.2 3 3.2 0 0Z" fill="{LIGHT}" opacity=".9" '
            f'transform="translate({x:.2f} {y:.2f}) rotate({ang:.1f})"/>')

def edge():
    """One 168 x 66 strip, outer side up (y = 0), inner side down."""
    w = S - 2 * T
    g = [f'<rect width="{w}" height="{T}" fill="{BLUE}"/>',
         f'<rect y="9" width="{w}" height="48" fill="{DEEP}"/>',
         # rules: a bold gold line and a hairline on each side
         f'<rect y="1.2" width="{w}" height="2.6" fill="{GOLD}"/><rect y="6" width="{w}" height="1" fill="{LIGHT}"/>',
         f'<rect y="{T-4.2}" width="{w}" height="3" fill="{GOLD}"/><rect y="{T-8}" width="{w}" height="1" fill="{LIGHT}"/>',
         f'<rect y="9" width="{w}" height=".9" fill="{GOLD}"/><rect y="56.1" width="{w}" height=".9" fill="{GOLD}"/>']
    for s in (1, -1):
        g.append(f'<path d="{wave(s, 0, w)}" fill="none" stroke="{GOLD}" stroke-width="3.4" stroke-linecap="round"/>')
        g.append(f'<path d="{wave(s, 0, w)}" fill="none" stroke="{LIGHT}" stroke-width="1.1" stroke-linecap="round"/>')
    for k in range(w // (P // 2) + 1):
        x = k * P / 2                                         # the braid crosses here
        g.append(f'<path d="M{x} {C-5}L{x+5} {C}L{x} {C+5}L{x-5} {C}Z" fill="{GOLD}" stroke="{LIGHT}" stroke-width=".8"/>')
        for dy in (-1, 1):                                    # small leaves in the outer hollows of the braid
            g.append(leaf(x, C + dy * 15.5, -90 if dy < 0 else 90))
    for k in range(w // (P // 2)):
        g.append(rosette(P / 4 + k * P / 2, C, 10.5))         # a rosette in each loop
    return ''.join(g)

def corner():
    c = T / 2
    g = [f'<rect width="{T}" height="{T}" fill="{BLUE}"/>',
         f'<rect x="1.2" y="1.2" width="{T-2.4}" height="{T-2.4}" fill="none" stroke="{GOLD}" stroke-width="2.6"/>',
         f'<rect x="6.5" y="6.5" width="{T-13}" height="{T-13}" fill="{DEEP}" stroke="{LIGHT}" stroke-width="1"/>',
         star(c, c, 24, BLUE, GOLD, 1.8), star(c, c, 17.5, DEEP, LIGHT, .9), rosette(c, c, 12.5)]
    return ''.join(g)

def svg():
    w = S - 2 * T
    d = f'<defs><g id="e">{edge()}</g><g id="c">{corner()}</g></defs>'
    b = [f'<use href="#e" x="{T}"/>',                                                    # top
         f'<use href="#e" transform="translate({T} {S}) scale(1 -1)"/>',                 # bottom
         f'<use href="#e" transform="translate(0 {T+w}) rotate(-90)"/>',                 # left
         f'<use href="#e" transform="translate({S} {T}) rotate(90)"/>',                  # right
         '<use href="#c"/>', f'<use href="#c" x="{S-T}"/>', f'<use href="#c" y="{S-T}"/>', f'<use href="#c" x="{S-T}" y="{S-T}"/>']
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{S}" height="{S}" viewBox="0 0 {S} {S}">{d}{"".join(b)}</svg>'

def uri(svg_text):
    return 'url("data:image/svg+xml,' + urllib.parse.quote(svg_text, safe="/:=,;()' ").replace('"', '%22') + '")'

def tile():
    """A seamless 60 x 60 tile: a gold diamond lattice, a rosette in each cell and at each crossing of four cells."""
    n = 60; h = n / 2
    g = [f'<rect width="{n}" height="{n}" fill="{DEEP}"/>',
         f'<path d="M0 {h}L{h} 0L{n} {h}L{h} {n}Z" fill="{BLUE}" stroke="{GOLD}" stroke-width="2.2"/>',
         f'<path d="M0 {h}L{h} 0L{n} {h}L{h} {n}Z" fill="none" stroke="{LIGHT}" stroke-width=".7"/>',
         rosette(h, h, 10.5)]
    for x, y in ((0, 0), (n, 0), (0, n), (n, n)):
        g.append(star(x, y, 11, DEEP, GOLD, 1.4) + f'<circle cx="{x}" cy="{y}" r="3.2" fill="{LIGHT}"/>')
    for x, y in ((h / 2, h / 2), (n - h / 2, h / 2), (h / 2, n - h / 2), (n - h / 2, n - h / 2)):
        g.append(f'<path d="M{x} {y-3.4}L{x+3.4} {y}L{x} {y+3.4}L{x-3.4} {y}Z" fill="{GOLD}"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{n}" height="{n}" viewBox="0 0 {n} {n}">{"".join(g)}</svg>'

def opening(path, width=740):
    import base64, io
    import numpy as np
    from PIL import Image
    from scipy import ndimage as nd
    im = np.asarray(Image.open(path).convert('RGB')).astype(int)
    blue = (im[..., 2] - im[..., 0]) > 60
    lab, n = nd.label(blue)
    fld = lab == 1 + int(np.argmax(nd.sum(blue, lab, range(1, n + 1))))   # the big field, without the verse markers
    er = lambda k: nd.binary_erosion(fld, iterations=k)
    grow = nd.binary_dilation(fld, iterations=2)                            # over the soft edge of the print
    rim = (grow & ~er(6)) | (er(11) & ~er(13))
    def png(mask):
        a = Image.fromarray((mask * 255).astype(np.uint8))
        a = a.resize((width, round(width * a.height / a.width)), Image.LANCZOS)
        p = a.point(lambda v: min(3, v // 52)).convert('P')                 # four levels of alpha, two bits a pixel
        p.putpalette([0] * 12)
        b = io.BytesIO(); p.save(b, 'PNG', optimize=True, bits=2, transparency=bytes([0, 85, 170, 255]))
        return 'url("data:image/png;base64,' + base64.b64encode(b.getvalue()).decode() + '")'
    return uri(tile()), png(grow), png(rim)

if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == 'opening':
        for name, v in zip(('tile', 'field', 'rim'), opening(sys.argv[2])):
            print(f'--{name}:{v};')
        sys.exit()
    s = svg()
    if len(sys.argv) > 1:
        open(sys.argv[1], 'w', encoding='utf-8').write(s)
    print(uri(s))
