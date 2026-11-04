"""Original score + sound design for the Murphy Oil infographic, built on the camels-maghreb score
(same instruments, key and mix; the form follows this timeline).

One continuous piece at 96 BPM in D minor (with the A major / C# colour of the harmonic minor), written to the
same grid as the picture (timeline.js): every cut is on a downbeat, every on-screen accent on a beat.
  bars 0-1   opening: pad, pluck motif, riser into the first cut
  bars 2-5   drums and bass enter on an impact; the map closes in on the coast
  bars 6-20  five fact slides (signing, C10, Tiof, Murphy Oil, Chariot): groove with darbuka, a phrase each
  bars 21-25 the open questions and the summary: lift; a one-beat stop
  bar 26-    final chord as the logo lands, then the closing pad
Each cut has its own sound (zoom riser + impact, iris swell, push whoosh, blinds glissando, diagonal sweep,
rise swoosh, mosaic glitch, panel roll + crash, final hit), so no effect repeats.
    python3 infographics/murphy-oil-mauritania/score.py
"""
import json, os, re
import numpy as np
from scipy import signal
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
TM = json.loads(re.search(r'=\s*(\{.*\});', open(os.path.join(HERE, 'timeline.js')).read(), re.S).group(1))
SR = 48000
BEAT, BAR = TM['beat'], TM['bar']
CUTS = TM['cuts']
DUR = TM['duration']
N = int(DUR * SR)
rng = np.random.default_rng(11)

# buses: dry and reverb send, stereo
DRY = np.zeros((2, N))
WET = np.zeros((2, N))


def t_(n):
    return np.arange(n) / SR


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(sig, at, gain=1.0, pan=0.0, send=0.0):
    """Mono or stereo signal at time `at`; pan -1 left .. +1 right (or an array of the same length)."""
    i = int(round(at * SR))
    if i >= N:
        return
    if i < 0:
        sig = sig[..., -i:]
        i = 0
    if sig.ndim == 1:
        n = min(len(sig), N - i)
        s = sig[:n] * gain
        p = pan[:n] if isinstance(pan, np.ndarray) else pan
        st = np.vstack([s * np.sqrt(0.5 * (1 - p)), s * np.sqrt(0.5 * (1 + p))])
    else:
        n = min(sig.shape[1], N - i)
        st = sig[:, :n] * gain
    DRY[:, i:i + n] += st
    if send:
        WET[:, i:i + n] += st * send


def env(n, a, d, sustain=None):
    t = t_(n)
    e = np.exp(-t / d) if sustain is None else np.ones(n)
    if a > 0:
        e = e * np.clip(t / a, 0, 1)
    return e


def adsr(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na) if na else e[:na]
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, 'high', fs=SR, output='sos'), x)


def bp(x, f0, f1, order=2):
    return signal.sosfilt(signal.butter(order, [f0, f1], 'band', fs=SR, output='sos'), x)


def sweep(x, f0, f1, kind='low', block=256):
    out, zi = np.zeros_like(x), None
    nb = int(np.ceil(len(x) / block))
    for b in range(nb):
        p = b / max(1, nb - 1)
        fc = min(f0 * (f1 / f0) ** p, SR * 0.45)
        sos = signal.butter(2, fc, kind, fs=SR, output='sos')
        if zi is None:
            zi = signal.sosfilt_zi(sos) * 0
        seg = x[b * block:(b + 1) * block]
        y, zi = signal.sosfilt(sos, seg, zi=zi)
        out[b * block:b * block + len(seg)] = y
    return out


noise = lambda n: rng.standard_normal(n)

# ---------------------------------------------------------------- instruments
def pluck(m, dur=1.2, bright=1.0):
    """Oud-like pluck: additive harmonics, higher ones dying faster, a little inharmonicity and a pick click."""
    n = int(dur * SR)
    t = t_(n)
    f = hz(m)
    y = np.zeros(n)
    for k in range(1, 14):
        fk = f * k * (1 + 0.0007 * k * k)
        if fk > SR * 0.45:
            break
        y += (bright ** (k - 1)) / k ** 1.1 * np.sin(2 * np.pi * fk * t + rng.random() * 6) * np.exp(-t * (2.2 + 1.6 * k))
    y += 0.25 * hp(noise(n), 2000) * np.exp(-t * 300)
    return y * adsr(n, 0.002, 0.05) * 0.5


def pad(ms, dur, cutoff=1400, a=0.5, r=0.8):
    n = int(dur * SR)
    t = t_(n)
    y = np.zeros((2, n))
    for m in ms:
        for d, side in ((-0.006, 0), (0.0, None), (0.007, 1)):
            ph = (hz(m) * (1 + d) * t + rng.random()) % 1.0
            s = 2 * ph - 1
            if side is None:
                y += s * 0.5
            else:
                y[side] += s
    y = np.vstack([lp(y[0], cutoff), lp(y[1], cutoff)]) / (len(ms) * 2)
    return y * adsr(n, a, r)


def bass(m, dur):
    n = int(dur * SR)
    t = t_(n)
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.tanh(3 * np.sin(2 * np.pi * f * t)) * 0.6 + 0.2 * np.sin(4 * np.pi * f * t)
    return lp(s, 900) * adsr(n, 0.005, 0.06) * np.exp(-t * 1.2) * 0.6


def kick(strength=1.0):
    n = int(0.45 * SR)
    t = t_(n)
    f = 45 + 110 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-t * 7.5) + 0.3 * hp(noise(n), 3000) * np.exp(-t * 400)) * strength


def clap():
    n = int(0.35 * SR)
    t = t_(n)
    e = np.zeros(n)
    for o in (0, 0.011, 0.022):
        e += np.where(t >= o, np.exp(-(t - o) * 90), 0)
    e += 0.6 * np.exp(-t * 14)
    return bp(noise(n), 900, 4200) * e * 0.5


def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    t = t_(n)
    return hp(noise(n), 7000) * np.exp(-t * (14 if open_ else 70)) * 0.35


def doum():
    n = int(0.5 * SR)
    t = t_(n)
    f = 95 + 40 * np.exp(-t * 25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.6 + 0.1 * lp(noise(n), 400) * np.exp(-t * 30)


def tek():
    n = int(0.09 * SR)
    t = t_(n)
    return (bp(noise(n), 2200, 6000) * 0.6 + 0.4 * np.sin(2 * np.pi * 3100 * t)) * np.exp(-t * 85) * 0.5


def bell(m, dur=2.2):
    n = int(dur * SR)
    t = t_(n)
    f = hz(m)
    y = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * dd) for r, a, dd in
            ((1, 1, 1.6), (2.76, 0.4, 3.2), (5.4, 0.2, 6), (8.93, 0.1, 9)))
    return y * adsr(n, 0.001, 0.2) * 0.35


def marimba(m, dur=0.6):
    n = int(dur * SR)
    t = t_(n)
    f = hz(m)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)) * np.exp(-t * 9) * 0.4


def whoosh(dur, f0, f1, q=0.6):
    n = int(dur * SR)
    x = noise(n)
    x = sweep(x, f0, f1, 'low') - 0.5 * sweep(x, f0 * q, f1 * q, 'low')
    e = np.sin(np.pi * np.clip(t_(n) / dur, 0, 1)) ** 2
    return x * e


def riser(dur, f0=300, f1=9000):
    n = int(dur * SR)
    t = t_(n)
    x = sweep(noise(n), f0, f1, 'low')
    tone = np.sin(2 * np.pi * np.cumsum(np.geomspace(110, 880, n)) / SR) * 0.15
    return (x + tone) * (t / dur) ** 2


def impact(size=1.0):
    n = int(2.5 * SR)
    t = t_(n)
    f = 38 + 70 * np.exp(-t * 6)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    hit = lp(noise(n), 2500) * np.exp(-t * 12)
    return (boom * 0.9 + hit * 0.5) * size


def crash(dur=3.0):
    n = int(dur * SR)
    t = t_(n)
    return hp(noise(n), 4000) * np.exp(-t * 1.6) * 0.35


def reverse(x):
    return x[::-1].copy()


# ---------------------------------------------------------------- harmony
CH = {  # pad voicing, bass root
    'Dm': ([50, 57, 60, 65, 69], 38), 'Dm9': ([50, 57, 64, 65, 69], 38), 'Bb': ([46, 53, 57, 62, 65], 34),
    'C': ([48, 55, 60, 64, 67], 36), 'F': ([53, 57, 60, 65, 69], 41), 'A': ([45, 52, 57, 61, 64], 33),
    'Gm': ([43, 50, 55, 58, 62], 31), 'Asus': ([45, 52, 57, 62, 64], 33),
}
TONES = {
    'Dm': [62, 65, 69, 74, 77], 'Dm9': [62, 64, 65, 69, 74], 'Bb': [58, 62, 65, 70, 74], 'C': [60, 64, 67, 72, 76],
    'F': [60, 65, 69, 72, 77], 'A': [61, 64, 69, 73, 76], 'Gm': [62, 67, 70, 74, 79], 'Asus': [62, 64, 69, 74, 76],
}
CB = [round(c / BAR) for c in CUTS]          # cut bars: 2 6 9 12 15 18 21 23 26
END = CB[-1]                                  # final chord bar
NB = int(round(DUR / BAR))
PROG = ['Dm9', 'Bb', 'Dm', 'Bb', 'C', 'A',
        'Dm', 'Bb', 'F', 'C', 'Gm', 'A', 'Dm', 'Bb', 'F', 'C', 'Gm', 'A', 'Dm', 'Bb', 'A',
        'Bb', 'C', 'Gm', 'Bb', 'Asus'] + ['Dm9'] * (NB - 26)
bar_t = lambda b: b * BAR

for b, ch in enumerate(PROG):
    if b >= END:
        continue
    cut = 1200 if b < 2 else 2000 if b < 21 else 2800
    place(pad(CH[ch][0], BAR + 0.6, cutoff=cut, a=0.35 if b else 1.2, r=0.7), bar_t(b), 0.22 if b >= 2 else 0.26, send=0.35)
place(pad(CH['Dm9'][0] + [74, 76], DUR - CUTS[-1], cutoff=2600, a=0.02, r=3.5), CUTS[-1], 0.3, send=0.5)

BASS_PAT = [(0, 1.5), (1.5, 0.5), (2.5, 0.5), (3, 1)]
BASS_PAT2 = [(0, 0.75), (0.75, 0.75), (1.5, 0.5), (2, 1), (3, 0.5), (3.5, 0.5)]
for b in range(2, END):
    root = CH[PROG[b]][1]
    pat = BASS_PAT2
    for i, (o, d) in enumerate(pat):
        if b == END - 1 and o >= 3:
            continue
        m = root + (12 if i in (2, 4) else 0)
        place(bass(m, d * BEAT + 0.05), bar_t(b) + o * BEAT, 0.55)
place(bass(38, 4.0) * np.exp(-t_(int(4.0 * SR)) * 0.3), CUTS[-1], 0.6)

for b in range(2, END):
    t0 = bar_t(b)
    calm = 21 <= b < 23                          # the open questions: lighter drums
    for beat in range(4):
        at = t0 + beat * BEAT
        if b == END - 1 and beat == 3:
            continue
        if not calm or beat in (0, 2):                 # four on the floor
            place(kick(1.0 if beat in (0, 2) else 0.8), at, 0.8 if not calm else 0.55)
        if beat in (1, 3):
            place(clap(), at, 0.55, pan=0.05, send=0.3)
        for s_ in range(4):
            sub = at + s_ * BEAT / 4
            accent = 1.0 if s_ % 2 else 0.65
            place(hat(open_=(s_ == 2 and not calm)), sub, 0.5 * accent, pan=0.35)
    if not calm:
        for o, kind in ((0, 'd'), (1.5, 't'), (2.0, 't'), (2.5, 'd'), (3.5, 't'), (3.75, 't')):
            place(doum() if kind == 'd' else tek(), t0 + o * BEAT, 0.45 if kind == 'd' else 0.35, pan=-0.3, send=0.15)

def phrase(b0, nbars, pattern, octave=0, gain=0.5, pan=-0.15, bright=0.8):
    for bb in range(nbars):
        tones = TONES[PROG[b0 + bb]]
        for (o, idx, d) in pattern:
            m = tones[idx % len(tones)] + octave + (12 if idx >= len(tones) else 0)
            place(pluck(m, 1.4 * d + 0.3, bright), bar_t(b0 + bb) + o * BEAT, gain, pan=pan, send=0.3)

for b in range(2, END):                       # running 16th arpeggio under everything
    tones = TONES[PROG[b]]
    seq = [0, 2, 1, 3, 2, 4, 3, 1]
    for k in range(16):
        if b == END - 1 and k >= 12:
            continue
        place(pluck(tones[seq[k % 8]] + 12, 0.25, 1.0), bar_t(b) + k * BEAT / 4, 0.16 if k % 4 else 0.22,
              pan=-0.45 if k % 2 else 0.45, send=0.15)
    if b >= 6 and not (21 <= b < 23):            # off-beat chord stabs
        for o in (1.5, 3.5):
            for m in tones[:3]:
                place(pluck(m, 0.35, 1.1), bar_t(b) + o * BEAT, 0.14, pan=0.1, send=0.25)

MOTIF = [(0, 0, 1), (0.75, 2, 0.5), (1.5, 3, 0.5), (2, 1, 1), (3, 2, 0.5), (3.5, 4, 0.5)]
phrase(0, 2, MOTIF, gain=0.6)
phrase(2, 4, [(0, 0, 0.5), (1, 2, 0.5), (2, 1, 0.5), (2.5, 3, 0.5), (3, 2, 0.5)], gain=0.4)
PHRASES = [
    [(0, 0, 0.5), (0.5, 2, 0.5), (1, 3, 0.5), (1.75, 2, 0.25), (2, 1, 0.5), (3, 4, 0.5), (3.5, 3, 0.5)],
    [(0, 4, 0.5), (0.5, 3, 0.25), (0.75, 2, 0.25), (1, 1, 1), (2.5, 0, 0.5), (3, 2, 1)],
    [(0, 1, 0.25), (0.25, 2, 0.25), (0.5, 3, 0.5), (1.5, 4, 0.5), (2, 3, 0.25), (2.25, 2, 0.25), (2.5, 0, 1)],
    [(0, 2, 1), (1, 0, 0.5), (1.5, 1, 0.5), (2, 2, 0.5), (2.75, 4, 0.25), (3, 3, 1)],
    [(0, 0, 0.25), (0.25, 1, 0.25), (0.5, 2, 0.25), (0.75, 3, 0.25), (1, 4, 1), (2, 3, 0.5), (3, 1, 1)],
]
for i, pat in enumerate(PHRASES):                    # one phrase per fact slide (3 bars each)
    phrase(CB[1] + 3 * i, 3, pat, octave=12 if i % 2 else 0, gain=0.4, pan=-0.2 if i % 2 else 0.2, bright=0.7 + 0.05 * i)
phrase(CB[6], 2, [(0, 0, 1), (2, 2, 1)], gain=0.3, bright=0.6)          # open questions: sparse
phrase(CB[7], 3, [(0, 0, 0.5), (0.5, 1, 0.5), (1, 2, 0.5), (1.5, 3, 0.5), (2, 4, 0.5), (2.5, 3, 0.5), (3, 2, 0.5)], octave=12, gain=0.32)
phrase(END, 1, MOTIF, gain=0.4, bright=0.6)

# ---------------------------------------------------------------- sound design, locked to the picture
c = CUTS
# 1 zoom: riser and impact on the first cut
place(riser(2.5), c[0] - 2.5, 0.5, send=0.3)
place(reverse(crash(1.5)), c[0] - 1.5, 0.6, pan=0.1)
place(impact(1.0), c[0], 0.9, send=0.25)
# map: Nouakchott, the country lights up, the camera dives; then C10, Chinguetti, Tiof on beats
place(marimba(74), c[0] + BEAT * 1.2, 0.5, pan=0.3, send=0.3)
place(bell(81), c[0] + BEAT * 2, 0.4, send=0.4)
place(whoosh(1.6, 200, 4000, q=0.5), c[0] + BEAT * 3.5, 0.45, pan=np.linspace(0.5, -0.5, int(1.6 * SR)), send=0.3)
for i, m in enumerate([77, 74, 81]):
    place(marimba(m), c[0] + BEAT * (7 + i), 0.5, pan=-0.3 + 0.3 * i, send=0.3)
place(bell(86), c[0] + BEAT * 9, 0.45, send=0.4)
# 2 iris: reversed swell into a soft thump
place(reverse(lp(noise(int(1.0 * SR)), 3000) * np.exp(-t_(int(1.0 * SR)) * 4)), c[1] - 1.0, 0.5, send=0.4)
place(impact(0.45), c[1], 0.7)
# 3 push: airy whoosh with the page
d = 0.9
place(whoosh(d, 400, 7000), c[2] - d / 2, 0.55, pan=np.linspace(-0.8, 0.8, int(d * SR)), send=0.2)
# 4 blinds: falling plucks
for k, m in enumerate([86, 84, 81, 77, 74, 72, 69, 65]):
    place(pluck(m, 0.5, 0.9), c[3] - 0.3 + k * 0.055, 0.35, pan=0.7 - k * 0.2, send=0.35)
# 5 diagonal sweep
d = 1.0
place(whoosh(d, 150, 3500, q=0.5), c[4] - d / 2, 0.75, pan=np.linspace(0.7, -0.7, int(d * SR)), send=0.25)
# 6 rise
place(riser(0.7, 600, 12000) * 0.8, c[5] - 0.7, 0.55, send=0.2)
place(lp(impact(0.35), 400), c[5] + 0.1, 0.6)
# 7 mosaic grains
for k in range(22):
    m = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84][rng.integers(10)]
    at = c[6] - 0.45 + k * 0.042 + rng.random() * 0.02
    nn = int(0.06 * SR)
    g = np.sign(np.sin(2 * np.pi * hz(m) * t_(nn))) * np.exp(-t_(nn) * 60) * 0.15
    place(lp(g, 5000), at, 0.5, pan=rng.random() * 1.6 - 0.8, send=0.25)
# 8 panel: roll, crash, whoosh into the summary
for k in range(8):
    place(clap() * (0.3 + 0.1 * k), c[7] - BEAT * 2 + k * BEAT / 4, 0.45, pan=0.1)
place(crash(3.5), c[7], 0.6, send=0.3)
place(whoosh(1.0, 300, 9000), c[7] - 0.5, 0.6, pan=np.linspace(0.8, -0.8, int(SR)), send=0.2)
place(kick(1.2), c[7], 0.8)
# fact slides: chime when the figure lands, ratchet on the rolling ones, a note per row
for i in range(5):
    s0 = c[1] + 7.5 * i
    land = [(84, 77), (81, 74), (86, 79), (77, 81), (81, 76)][i]
    place(bell(land[0]), s0 + BEAT * 3, 0.42, pan=0.2 - 0.1 * i, send=0.4)
    place(bell(land[1]), s0 + BEAT * 3 + 0.015, 0.22, send=0.4)
    if i in (1, 2, 3):
        for k in range(14):
            at = s0 + BEAT * 0.8 + (BEAT * 2.1) * (1 - (1 - k / 14) ** 1.6)
            place(tek() * 0.5, at, 0.35, pan=-0.2)
for i, d in enumerate([3, 4]):                                   # signatories
    place(marimba(74 + 5 * i), c[1] + BEAT * d, 0.35, pan=0.3)
for k in range(3):                                               # C10 partners
    place(marimba([69, 74, 77][k]), c[2] + BEAT * (5.3 + 0.6 * k), 0.35, pan=0.3 - 0.3 * k)
place(marimba(62), c[2] + BEAT * 8.5, 0.35)
place(marimba(81), c[3] + BEAT * 7, 0.35)                        # Tiof: 2026 on the line
for k in range(3):                                               # Chariot: blocks, then the steps
    place(marimba([74, 77, 70][k]), c[5] + BEAT * (1 + 0.5 * k), 0.4, pan=0.3 - 0.3 * k, send=0.3)
for k, d in enumerate([5, 6.5, 8]):
    place(bell([81, 86, 74][k], 1.2), c[5] + BEAT * d, 0.3, send=0.3)
for k in range(4):                                               # four open questions
    place(marimba([81, 77, 74, 69][k], 0.8), c[6] + BEAT * (0.8 + 0.5 * k), 0.4, pan=0.4 - 0.25 * k, send=0.3)
for k, d in enumerate([3.5, 4.5, 6, 7]):                         # summary rows
    place(marimba([69, 65, 74, 77][k]), c[7] + BEAT * d, 0.35, pan=0.2, send=0.3)
# 9 final chord as the logo lands
place(reverse(crash(2.0)), c[8] - 2.0 + 0.02, 0.5)
place(impact(1.1), c[8], 0.9, send=0.3)
place(crash(5.0), c[8], 0.5, send=0.4)
for m in (62, 69, 74, 77, 81):
    place(pluck(m, 3.0, 0.75), c[8] + 0.01 * (m - 62) / 3, 0.35, send=0.5)
for k, m in enumerate([86, 81]):
    place(marimba(m), c[8] + BEAT * (3.5 + 0.5 * k), 0.3, send=0.3)
place(bell(86, 2.0), c[8] + BEAT * 5, 0.35, send=0.4)

# ---------------------------------------------------------------- mix
ir_n = int(2.4 * SR)
irt = t_(ir_n)
IR = np.vstack([lp(noise(ir_n), 6000) * np.exp(-irt * 2.6), lp(noise(ir_n), 6000) * np.exp(-irt * 2.6)])
IR[:, :int(0.012 * SR)] = 0
IR /= np.abs(IR).sum(axis=1, keepdims=True) ** 0.5 * 12
rev = np.vstack([signal.fftconvolve(WET[ch], IR[ch])[:N] for ch in range(2)])
mix = DRY + rev
mix = np.vstack([hp(mix[ch], 30) for ch in range(2)])
fade = np.ones(N)
fade[-int(1.2 * SR):] = np.linspace(1, 0, int(1.2 * SR)) ** 2
fade[:int(0.02 * SR)] = np.linspace(0, 1, int(0.02 * SR))
mix *= fade
mix /= np.percentile(np.abs(mix), 99.9) * 1.6
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
mix *= 0.89 / np.abs(mix).max()
wavfile.write(os.path.join(HERE, 'score.wav'), SR, (mix.T * 32767).astype(np.int16))
print('wrote score.wav', round(DUR, 2), 's')
