"""Original score + sound design for the AMAN green-hydrogen infographic (infographics/aman-hydrogen/score.wav).
Modern, catchy version (user, 12 Nov 2026): 120 BPM future-house in A minor (Am F C G), sidechain-pumped
supersaw chords, offbeat sub bass, four-on-the-floor kick, 16th hats, a synth-pluck hook and vocal-chop stabs.
(The template notes below describe the gold score this file started from.)

One continuous piece at 96 BPM in D minor (with the A major / C# colour of the harmonic minor), written to the
same grid as the picture (timeline.js): every cut is on a downbeat, every on-screen accent on a beat.
  bars 0-1   opening: pad, oud-like pluck motif, riser into the first cut
  bars 2-6   drums and bass enter on an impact; map, counter, world share
  bars 7-16  five countries: groove with darbuka doum/tek, a different pluck phrase and chime per country
  bars 17-19 ranking: lift, bars on the beat with rising notes; a one-beat stop
  bar 20-    final chord as the logo lands, then the closing pad
Each cut has its own sound (zoom riser + impact, iris swell, push whoosh, blinds glissando, diagonal sweep,
rise swoosh, mosaic glitch, panel roll + crash, final hit), so no effect repeats.
    python3 infographics/gold-mauritania/score.py
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
rng = np.random.default_rng(23)

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



# ---------------------------------------------------------------- modern instruments
SC = np.zeros((2, N))          # sidechained bus (chords, bass, chops)

def place_sc(sig, at, gain=1.0, pan=0.0):
    i = int(round(at * SR))
    if i >= N:
        return
    if sig.ndim == 1:
        sig = np.vstack([sig * np.sqrt(0.5 * (1 - pan)), sig * np.sqrt(0.5 * (1 + pan))])
    n = min(sig.shape[1], N - i)
    SC[:, i:i + n] += sig[:, :n] * gain


def supersaw(ms, dur, cutoff=3000, a=0.01, r=0.25, voices=7, spread=0.012):
    n = int(dur * SR); t = t_(n)
    y = np.zeros((2, n))
    for m in ms:
        f = hz(m)
        for v in range(voices):
            dt = spread * (v - (voices - 1) / 2) / ((voices - 1) / 2)
            ph = (f * (1 + dt) * t + rng.random()) % 1.0
            side = v % 2
            y[side] += 2 * ph - 1
    y = np.vstack([lp(y[0], cutoff, 2), lp(y[1], cutoff, 2)]) / (len(ms) * voices) * 2.2
    return y * adsr(n, a, r)


def sub(m, dur):
    n = int(dur * SR); t = t_(n); f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.tanh(4 * np.sin(2 * np.pi * f * t))
    return lp(s, 700) * adsr(n, 0.004, 0.03) * 0.7


def synthpluck(m, dur=0.4, bright=6000):
    n = int(dur * SR); t = t_(n); f = hz(m)
    ph1 = (f * t) % 1.0; ph2 = (f * 1.006 * t + 0.3) % 1.0
    sq = np.sign(np.sin(2 * np.pi * f * 0.5 * t)) * 0.3
    x = (2 * ph1 - 1) + (2 * ph2 - 1) + sq
    y = sweep(x, bright, 600, 'low', block=128)
    return y * np.exp(-t * 7) * adsr(n, 0.002, 0.05) * 0.32


def chop(m, dur=0.22):
    """Vocal-chop-like stab: a buzzy source through two formant bands ("ah")."""
    n = int(dur * SR); t = t_(n); f = hz(m)
    src = sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 18) if f * k < SR * 0.45)
    y = bp(src, 650, 1000) * 1.2 + bp(src, 1100, 1500) * 0.8 + bp(src, 2400, 2900) * 0.35
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t)
    return y * vib * adsr(n, 0.008, 0.06) * 0.6


def kick4():
    n = int(0.42 * SR); t = t_(n)
    f = 48 + 140 * np.exp(-t * 38)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    click = hp(noise(n), 2500) * np.exp(-t * 500) * 0.5
    return np.tanh((body + click) * 1.6) * 0.9


def snare():
    n = int(0.3 * SR); t = t_(n)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)
    return (bp(noise(n), 1200, 7000) * np.exp(-t * 18) + tone * 0.6) * 0.55


# ---------------------------------------------------------------- arrangement
CHORDS = {'Am': [57, 60, 64, 69, 72], 'F': [53, 57, 60, 65, 69], 'C': [52, 55, 60, 64, 67], 'G': [55, 59, 62, 67, 71]}
ROOT = {'Am': 33, 'F': 29, 'C': 36, 'G': 31}
PROG = ['Am', 'F', 'C', 'G']
NB = int(round(DUR / BAR))
bar_t = lambda b: b * BAR
CB = [int(round(c / BAR)) for c in CUTS]            # cut bars: 3 7 10 13 16 19 23
DROP, RANK, OUT = CB[0], CB[5], CB[6]
chord = lambda b: PROG[b % 4]

# hook melody (the catchy motif), eighth-note grid, per chord: (beat, semitone in A minor scale index)
SCALE = [69, 71, 72, 74, 76, 77, 79, 81, 83, 84, 86, 88]
HOOK = [(0, 4), (0.5, 4), (1, 2), (1.5, 4), (2.5, 7), (3, 6), (3.5, 4)]
HOOK2 = [(0, 2), (0.5, 2), (1, 0), (1.5, 2), (2.5, 4), (3, 2), (3.25, 1), (3.5, 0)]

for b in range(NB):
    t0 = bar_t(b); ch = chord(b)
    if b < OUT:
        # chords: filtered in the intro, opening up on the drop, darker under the ranking
        if b < DROP:
            cut = 500 + 1600 * (b / DROP)
            place_sc(supersaw(CHORDS[ch], BAR, cutoff=cut, a=0.2, r=0.3), t0, 1.1)
            if b >= 1:                               # filtered heartbeat kick builds into the drop
                for beat in range(4):
                    place(lp(kick4(), 300), t0 + beat * BEAT, 0.5 + 0.15 * b)
        else:
            cut = 1500 if RANK <= b < OUT - 1 else 4200
            for beat in range(4):                    # rhythmic stabs that the sidechain pumps
                place_sc(supersaw(CHORDS[ch], BEAT * 0.95, cutoff=cut), t0 + beat * BEAT, 0.55)
        # offbeat sub bass (house) from the drop
        if b >= DROP:
            for beat in range(4):
                place_sc(sub(ROOT[ch], BEAT * 0.45), t0 + beat * BEAT + BEAT / 2, 0.75)
        # synth-pluck hook: intro and from the drop, two phrases alternating
        if b < DROP or b >= DROP:
            pat = HOOK if (b // 2) % 2 == 0 else HOOK2
            gain = 0.55 if b < DROP else 0.42 if b < RANK else 0.3
            for o, k in pat:
                place(synthpluck(SCALE[k] - (12 if b < DROP else 0) + 12, 0.35), t0 + o * BEAT, gain, pan=0.25 * ((o * 2) % 2 - 0.5), send=0.35)
        # vocal chops on the slides
        if CB[2] <= b < RANK:
            for o, m in ((1.5, CHORDS[ch][3] + 12), (3.5, CHORDS[ch][4] + 12)):
                place_sc(chop(m), t0 + o * BEAT, 0.45, pan=-0.3 if o < 2 else 0.3)
    # drums
    if DROP <= b < OUT:
        for beat in range(4):
            at = t0 + beat * BEAT
            stop = (b == OUT - 1 and beat == 3) or (b == RANK and beat == 0 and False)
            if not stop:
                place(kick4(), at, 0.85)
            if beat in (1, 3) and not stop:
                place(clap(), at, 0.6, pan=0.05, send=0.25)
                place(snare(), at, 0.18)
            for s16 in range(4):
                acc = (1.0, 0.45, 0.75, 0.45)[s16]
                place(lp(hat(open_=(s16 == 2 and b >= CB[1])), 11000), at + s16 * BEAT / 4, 0.28 * acc, pan=0.35)
    # snare roll into the drop and into the outro
    if b in (DROP - 1, OUT - 1):
        for k in range(16 if b == DROP - 1 else 8):
            off = (BAR / 2) + k * BEAT / 8 if b == DROP - 1 else (BAR / 2) + k * BEAT / 4
            if b == OUT - 1 and k >= 6:
                break
            place(snare(), t0 + off, 0.12 + 0.03 * k, send=0.2)

# sidechain: duck the SC bus on every beat from the drop until the outro
env_sc = np.ones(N)
for b in range(DROP, OUT):
    for beat in range(4):
        i = int((bar_t(b) + beat * BEAT) * SR); n = int(BEAT * SR)
        tt = t_(n)
        env_sc[i:i + n] = np.minimum(env_sc[i:i + n], 1 - 0.8 * np.exp(-tt / 0.07) * (tt < BEAT))
DRY += SC * env_sc
WET += SC * env_sc * 0.25

# ---------------------------------------------------------------- sound design, locked to the picture
c = CUTS
# 1  zoom: riser into the drop, impact on the first cut
place(riser(BAR * 1.5, 300, 12000), c[0] - BAR * 1.5, 0.45, send=0.3)
place(impact(1.1), c[0], 0.85, send=0.25)
place(crash(3.0), c[0], 0.5, send=0.3)
# map: Nouakchott lights, the date digits drop (plucks), landing chime
for i, m in enumerate([81, 84, 88]):
    place(marimba(m), c[0] + BEAT * (1.5 + i * 0.5), 0.45, pan=-0.3 + 0.3 * i, send=0.3)
place(bell(88), c[0] + BEAT * 5, 0.5, send=0.4)
place(bell(81), c[0] + BEAT * 5 + 0.02, 0.3, send=0.4)
# 2  iris: reversed swell and a soft thump; the ring fills with a rising glide
place(reverse(lp(noise(int(1.0 * SR)), 3000) * np.exp(-t_(int(1.0 * SR)) * 4)), c[1] - 1.0, 0.45, send=0.4)
n = int(BEAT * 3 * SR)
gl = np.sin(2 * np.pi * np.cumsum(np.geomspace(hz(57), hz(81), n)) / SR) * np.sin(np.pi * t_(n) / (BEAT * 3)) * 0.22
place(gl, c[1] + BEAT, 0.5, send=0.4)
place(bell(81), c[1] + BEAT * 4, 0.45, send=0.4)
place(marimba(76), c[1] + BEAT * 5, 0.4, pan=0.3)
place(marimba(72), c[1] + BEAT * 6, 0.4, pan=-0.3)
# 3  push: airy whoosh left to right
d = 0.9
place(whoosh(d, 400, 7000), c[2] - d / 2, 0.55, pan=np.linspace(-0.8, 0.8, int(d * SR)), send=0.2)
# 4  blinds: falling plucks
for k, m in enumerate([88, 84, 81, 79, 76, 72, 69, 64]):
    place(synthpluck(m, 0.3), c[3] - 0.3 + k * 0.05, 0.4, pan=0.7 - k * 0.2, send=0.35)
# 5  diagonal sweep
d = 1.0
place(whoosh(d, 150, 3500, q=0.5), c[4] - d / 2, 0.7, pan=np.linspace(0.7, -0.7, int(d * SR)), send=0.25)
# figures on the slides land on beat 3: chime + chop
for i, s0 in enumerate([c[2], c[3], c[4]]):
    place(bell([88, 86, 84][i]), s0 + BEAT * 3, 0.4, send=0.4)
    place_tick = [s0 + BEAT * 0.8 + (BEAT * 2.2) * (1 - (1 - k / 12) ** 1.6) for k in range(12)]
    for at in place_tick:
        place(tek() * 0.4, at, 0.3, pan=-0.2)
# timeline steps on slide 3
for k in range(3):
    place(marimba([76, 81, 88][k]), c[4] + BEAT * (3.6 + k * 1.6), 0.45, send=0.3)
# 6  panel: crash and wide whoosh into the ranking
place(crash(3.0), c[5], 0.5, send=0.3)
place(whoosh(1.0, 300, 9000), c[5] - 0.5, 0.55, pan=np.linspace(0.8, -0.8, int(SR)), send=0.2)
for i, m in enumerate([81, 84, 86, 88]):
    place(marimba(m, 0.8), c[5] + BEAT * (1 + i), 0.45, pan=0.3 - 0.2 * i, send=0.3)
place(bell(84, 1.4), c[5] + BEAT * 6, 0.35, send=0.3)
# 7  final hit as the logo lands, then the outro: big chord + hook once more, filtered down
place(riser(BAR, 500, 12000), c[6] - BAR, 0.4, send=0.3)
place(impact(1.2), c[6], 0.9, send=0.3)
place(crash(5.0), c[6], 0.5, send=0.4)
place(supersaw(CHORDS['Am'] + [76, 81], DUR - c[6], cutoff=2500, a=0.01, r=3.5), c[6], 0.7, send=0.5)
place(sub(33, 3.0), c[6], 0.8)
for o, k in HOOK:
    place(synthpluck(SCALE[k] + 12, 0.5, 3500), c[6] + BAR + o * BEAT, 0.3, send=0.5)
for k2, m in enumerate([88, 84]):
    place(marimba(m), c[6] + BEAT * (3.5 + 0.5 * k2), 0.3, send=0.3)
place(bell(88, 2.0), c[6] + BEAT * 5, 0.35, send=0.4)

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
