"""Original score + sound design for the donkeys infographic (infographics/donkeys-maghreb/score.wav).

One continuous piece at 96 BPM in D minor (with the A major / C# colour of the harmonic minor), written to the
same grid as the picture (timeline.js): every cut is on a downbeat, every on-screen accent on a beat.
  bars 0-1   opening: pad, oud-like pluck motif, riser into the first cut
  bars 2-6   drums and bass enter on an impact; map, counter, world share
  bars 7-16  five countries: groove with darbuka doum/tek, a different pluck phrase and chime per country
  bars 17-19 ranking: lift, bars on the beat with rising notes; a one-beat stop
  bar 20-    final chord as the logo lands, then the closing pad
Each cut has its own sound (zoom riser + impact, iris swell, push whoosh, blinds glissando, diagonal sweep,
rise swoosh, mosaic glitch, panel roll + crash, final hit), so no effect repeats.
    python3 infographics/camels-maghreb/score.py
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
TONES = {  # chord tones for the pluck, D harmonic minor colour
    'Dm': [62, 65, 69, 74, 77], 'Dm9': [62, 64, 65, 69, 74], 'Bb': [58, 62, 65, 70, 74], 'C': [60, 64, 67, 72, 76],
    'F': [60, 65, 69, 72, 77], 'A': [61, 64, 69, 73, 76], 'Gm': [62, 67, 70, 74, 79], 'Asus': [62, 64, 69, 74, 76],
}
PROG = ['Dm9', 'Bb', 'Dm', 'Bb', 'C', 'F', 'A',
        'Dm', 'Bb', 'F', 'C', 'Gm', 'A', 'Dm', 'Bb', 'F', 'A',
        'Bb', 'C', 'Asus', 'Dm9', 'Dm9', 'Dm9']
bar_t = lambda b: b * BAR

# pads: brighter over the stories, a long open chord at the end
for b, ch in enumerate(PROG):
    if b >= 20:
        continue
    cut = 900 if b < 2 else 1500 if b < 17 else 2200
    place(pad(CH[ch][0], BAR + 0.6, cutoff=cut, a=0.35 if b else 1.2, r=0.7), bar_t(b), 0.22 if b >= 2 else 0.26, send=0.35)
place(pad(CH['Dm9'][0] + [74, 76], DUR - 50.0, cutoff=2600, a=0.02, r=3.5), 50.0, 0.3, send=0.5)

# bass: from the first impact to the stop before the last chord
BASS_PAT = [(0, 1.5), (1.5, 0.5), (2.5, 0.5), (3, 1)]          # beats within the bar
BASS_PAT2 = [(0, 0.75), (0.75, 0.75), (1.5, 0.5), (2, 1), (3, 0.5), (3.5, 0.5)]
for b in range(2, 20):
    root = CH[PROG[b]][1]
    pat = BASS_PAT if b < 7 else BASS_PAT2
    for i, (o, d) in enumerate(pat):
        at = bar_t(b) + o * BEAT
        if b == 19 and o >= 3:
            continue
        m = root + (12 if (b >= 7 and i in (2, 4)) else 0)
        place(bass(m, d * BEAT + 0.05), at, 0.55)
place(bass(38, 4.0) * np.exp(-t_(int(4.0 * SR)) * 0.3), 50.0, 0.6)

# drums
for b in range(2, 20):
    t0 = bar_t(b)
    for beat in range(4):
        at = t0 + beat * BEAT
        if b == 19 and beat == 3:          # one-beat stop before the final chord
            continue
        if beat in (0, 2) or (b >= 7 and beat == 1 and b % 2):
            place(kick(1.0 if beat == 0 else 0.85), at, 0.8)
        if b >= 5 and beat in (1, 3):
            place(clap(), at, 0.55, pan=0.05, send=0.3)
        for s in range(4 if b >= 7 else 2):
            sub = at + s * BEAT / (4 if b >= 7 else 2)
            if b < 7 and s == 0:
                continue
            accent = 1.0 if s % 2 else 0.6
            place(hat(open_=(b >= 9 and s == 2 and beat == 3)), sub, 0.5 * accent, pan=0.35)
    if b >= 7:                                       # darbuka: doum . tek tek | doum . tek .
        for o, kind in ((0, 'd'), (1.5, 't'), (2.0, 't'), (2.5, 'd'), (3.5, 't'), (3.75, 't')):
            place(doum() if kind == 'd' else tek(), t0 + o * BEAT, 0.45 if kind == 'd' else 0.35, pan=-0.3, send=0.15)

# pluck phrases: one motif for the opening, a different phrase for each section
def phrase(b0, nbars, pattern, octave=0, gain=0.5, pan=-0.15, bright=0.8):
    for bb in range(nbars):
        tones = TONES[PROG[b0 + bb]]
        for (o, idx, d) in pattern:
            m = tones[idx % len(tones)] + octave + (12 if idx >= len(tones) else 0)
            place(pluck(m, 1.4 * d + 0.3, bright), bar_t(b0 + bb) + o * BEAT, gain, pan=pan, send=0.3)

MOTIF = [(0, 0, 1), (0.75, 2, 0.5), (1.5, 3, 0.5), (2, 1, 1), (3, 2, 0.5), (3.5, 4, 0.5)]
phrase(0, 2, MOTIF, gain=0.6)
phrase(2, 3, [(0, 0, 0.5), (1, 2, 0.5), (2, 1, 0.5), (2.5, 3, 0.5), (3, 2, 0.5)], gain=0.4)
phrase(5, 2, [(0, 3, 1), (1.5, 2, 0.5), (2, 1, 1), (3.5, 0, 0.5)], gain=0.4)
PHRASES = [
    [(0, 0, 0.5), (0.5, 2, 0.5), (1, 3, 0.5), (1.75, 2, 0.25), (2, 1, 0.5), (3, 4, 0.5), (3.5, 3, 0.5)],
    [(0, 4, 0.5), (0.5, 3, 0.25), (0.75, 2, 0.25), (1, 1, 1), (2.5, 0, 0.5), (3, 2, 1)],
    [(0, 1, 0.25), (0.25, 2, 0.25), (0.5, 3, 0.5), (1.5, 4, 0.5), (2, 3, 0.25), (2.25, 2, 0.25), (2.5, 0, 1)],
    [(0, 2, 1), (1, 0, 0.5), (1.5, 1, 0.5), (2, 2, 0.5), (2.75, 4, 0.25), (3, 3, 1)],
    [(0, 0, 0.25), (0.25, 1, 0.25), (0.5, 2, 0.25), (0.75, 3, 0.25), (1, 4, 1), (2, 3, 0.5), (3, 1, 1)],
]
for i, pat in enumerate(PHRASES):
    phrase(7 + 2 * i, 2, pat, octave=12 if i % 2 else 0, gain=0.42, pan=-0.2 if i % 2 else 0.2, bright=0.7 + 0.05 * i)
phrase(17, 3, [(0, 0, 0.5), (0.5, 1, 0.5), (1, 2, 0.5), (1.5, 3, 0.5), (2, 4, 0.5), (2.5, 3, 0.5), (3, 2, 0.5)], octave=12, gain=0.32)
phrase(20, 1, MOTIF, gain=0.4, bright=0.6)             # the opening motif returns over the logo

# ---------------------------------------------------------------- sound design, locked to the picture
c = CUTS
# 1  zoom: riser through bar 1 and an impact on the first cut
place(riser(2.5), c[0] - 2.5, 0.5, send=0.3)
place(reverse(crash(1.5)), c[0] - 1.5, 0.6, pan=0.1)
place(impact(1.0), c[0], 0.9, send=0.25)
# map: countries light on eighth notes (marimba up the chord), counter ticks, landing chime
for i, m in enumerate([74, 77, 81, 84, 86]):
    place(marimba(m), c[0] + BEAT * (1 + i * 0.5) + 0.25, 0.5, pan=-0.4 + 0.2 * i, send=0.3)
for k in range(16):                                     # ticks slow down as the figure settles
    at = c[0] + BEAT * 1.5 + (BEAT * 4.5) * (1 - (1 - k / 16) ** 1.8)
    place(tek() * 0.4, at, 0.35 * (1 - k / 20), pan=0.3)
place(bell(81), c[0] + BEAT * 6, 0.55, send=0.4)
place(bell(86), c[0] + BEAT * 6 + 0.02, 0.35, send=0.4)
# 2  iris: reversed swell into a soft low thump
place(reverse(lp(noise(int(1.0 * SR)), 3000) * np.exp(-t_(int(1.0 * SR)) * 4)), c[1] - 1.0, 0.5, send=0.4)
place(impact(0.45), c[1], 0.7)
# world ring: a tonal glide while it fills, ping on arrival; rows click in
n = int(BEAT * 2 * SR)
gl = np.sin(2 * np.pi * np.cumsum(np.geomspace(hz(57), hz(69), n)) / SR) * np.sin(np.pi * t_(n) / (BEAT * 2)) * 0.25
place(gl, c[1] + BEAT, 0.5, send=0.4)
place(bell(69), c[1] + BEAT * 3, 0.5, send=0.4)
place(marimba(62), c[1] + BEAT * 4, 0.4, pan=0.3)
place(marimba(69), c[1] + BEAT * 5, 0.4, pan=-0.3)
# 3  push: airy whoosh travelling left to right with the page
d = 0.9
place(whoosh(d, 400, 7000), c[2] - d / 2, 0.55, pan=np.linspace(-0.8, 0.8, int(d * SR)), send=0.2)
# 4  blinds: eight quick plucks falling down the chord, right to left
for k, m in enumerate([86, 84, 81, 77, 74, 72, 69, 65]):
    place(pluck(m, 0.5, 0.9), c[3] - 0.3 + k * 0.055, 0.35, pan=0.7 - k * 0.2, send=0.35)
# 5  diagonal: deeper sweep with the band
d = 1.0
place(whoosh(d, 150, 3500, q=0.5), c[4] - d / 2, 0.75, pan=np.linspace(0.7, -0.7, int(d * SR)), send=0.25)
# 6  rise: short upward swoosh and a soft landing
place(riser(0.7, 600, 12000) * 0.8, c[5] - 0.7, 0.55, send=0.2)
place(lp(impact(0.35), 400), c[5] + 0.1, 0.6)
# 7  mosaic: digital grains on the D minor pentatonic
for k in range(22):
    m = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84][rng.integers(10)]
    at = c[6] - 0.45 + k * 0.042 + rng.random() * 0.02
    nn = int(0.06 * SR)
    g = np.sign(np.sin(2 * np.pi * hz(m) * t_(nn))) * np.exp(-t_(nn) * 60) * 0.15
    place(lp(g, 5000), at, 0.5, pan=rng.random() * 1.6 - 0.8, send=0.25)
# 8  panel: snare roll into a crash and a wide whoosh, the music lifts
for k in range(8):
    place(clap() * (0.3 + 0.1 * k), c[7] - BEAT * 2 + k * BEAT / 4, 0.45, pan=0.1)
place(crash(3.5), c[7], 0.6, send=0.3)
place(whoosh(1.0, 300, 9000), c[7] - 0.5, 0.6, pan=np.linspace(0.8, -0.8, int(SR)), send=0.2)
place(kick(1.2), c[7], 0.8)
# figures on the country slides: a chime on the landing (each in its own chord), ratchet on the rolling ones
LAND = [(81, 74), (84, 77), (86, 79), (77, 81), (81, 76)]
for i in range(5):
    s = 17.5 + 5.0 * i
    place(bell(LAND[i][0]), s + BEAT * 3, 0.45, pan=0.2 - 0.1 * i, send=0.4)
    place(bell(LAND[i][1]), s + BEAT * 3 + 0.015, 0.25, send=0.4)
    if i % 2:
        for k in range(14):
            at = s + BEAT * 0.8 + (BEAT * 2.1) * (1 - (1 - k / 14) ** 1.6)
            place(tek() * 0.5, at, 0.4, pan=-0.2)
    place(marimba(TONES[PROG[7 + 2 * i]][0] + 12), s + BEAT * 5, 0.25, pan=0.4)
# ranking: one rising note per bar, then the two-note "notable" cue
for i, m in enumerate([86, 81, 77, 74, 69]):
    place(marimba(m, 0.8), c[7] + BEAT * (1 + i), 0.5, pan=0.3 - 0.15 * i, send=0.3)
place(bell(81, 1.2), c[7] + BEAT * 6, 0.35, send=0.3)
place(bell(86, 1.6), c[7] + BEAT * 6.5, 0.35, send=0.3)
# 9  final chord as the logo lands
place(reverse(crash(2.0)), c[8] - 2.0 + 0.02, 0.5)
place(impact(1.1), c[8], 0.9, send=0.3)
place(crash(5.0), c[8], 0.5, send=0.4)
for m in (62, 69, 74, 77, 81):
    place(pluck(m, 3.0, 0.75), c[8] + 0.01 * (m - 62) / 3, 0.35, send=0.5)
for k, m in enumerate([86, 81]):                         # social rows and the website
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
