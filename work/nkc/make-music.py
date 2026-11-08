"""Synthesizes the music for the Nouakchott infographic (work/nkc/music.wav).

90 BPM, C minor. Sections follow the scenes in index.html:
  0      history: pad, soft plucked arpeggio
  20.6   data: add a soft pulse and ticks
  44.6   achievements: brighter chords (Eb / Ab / Bb)
  57.1   hit on 'لكن المشاكل أكبر', then the problems: low ostinato, heartbeat kick, tense chords
  86.1   closing line: pad only
  93.2   final chord as the outro settles; decays to the end
Usage: python3 work/nkc/make-music.py <duration> <out.wav>
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 98.1
OUT = sys.argv[2] if len(sys.argv) > 2 else 'music.wav'
BEAT = 60 / 90
rng = np.random.default_rng(11)
N = int(DUR * SR)
L = np.zeros(N); R = np.zeros(N)

HIST, DATA, GOOD, HIT, PROB, CLOSE, LAND = 0.0, 20.6, 44.6, 57.1, 58.5, 86.1, 93.2


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(n):
    return np.arange(n) / SR


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i < 0:
        return
    s = sig[: N - i] * gain
    L[i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan))


def lp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, 'high', fs=SR, output='sos'), x)


def pad(notes, dur, bright=1800):
    n = int(dur * SR); t = tt(n); s = np.zeros(n)
    for m in notes:
        for d in (-0.004, 0.0, 0.005):
            ph = rng.random()
            s += 2 * ((hz(m) * (1 + d) * t + ph) % 1.0) - 1
    s = lp(s, bright, 2) / (len(notes) * 3)
    a = np.clip(t / 0.9, 0, 1); r = np.clip((dur - t) / 1.0, 0, 1)
    return s * a * r


def pluck(m, dur=1.6, bright=1.0):
    n = int(dur * SR); t = tt(n); f = hz(m)
    s = sum((0.6 ** k) * np.sin(2 * np.pi * f * (k + 1) * t) for k in range(5))
    e = np.exp(-t / (0.35 * bright)) * np.clip(t / 0.004, 0, 1)
    return s * e * 0.5


def kick(gain=1.0):
    n = int(0.45 * SR); t = tt(n)
    f = 45 + 70 * np.exp(-t / 0.03)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    return s * gain


def tick():
    n = int(0.06 * SR)
    return hp(rng.standard_normal(n), 6000) * np.exp(-tt(n) / 0.012) * 0.25


def boom():
    n = int(3.5 * SR); t = tt(n)
    f = 38 + 60 * np.exp(-t / 0.08)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.1)
    noise = lp(rng.standard_normal(n), 900) * np.exp(-t / 0.5) * 0.4
    return s + noise


def riser(dur):
    n = int(dur * SR); t = tt(n)
    x = rng.standard_normal(n)
    out = np.zeros(n); step = int(0.05 * SR)
    for i in range(0, n, step):   # sweep the filter upward
        fc = 300 + 5000 * (i / n) ** 2
        out[i:i + step] = lp(x[i:i + step], fc, 2)
    return out * (t / dur) ** 2 * 0.35


# chord progressions (MIDI notes); one chord per two bars
BAR = 4 * BEAT
P_MINOR = [[48, 55, 60, 63], [44, 51, 56, 60], [51, 58, 63, 67], [46, 53, 58, 62]]   # Cm Ab Eb Bb
P_BRIGHT = [[51, 58, 63, 67], [44, 51, 56, 60], [46, 53, 58, 62], [51, 58, 63, 70]]  # Eb Ab Bb Eb
P_TENSE = [[48, 55, 60, 63], [49, 56, 61, 65], [44, 51, 56, 60], [43, 50, 55, 59]]   # Cm Db Ab G


def section(t0, t1, prog, *, arp=0.0, pulse=0.0, ticks=0.0, ost=0.0, pad_gain=0.35, bright=1800):
    t = t0; k = 0
    while t < t1 - 0.05:
        ch = prog[k % len(prog)]
        d = min(2 * BAR, t1 - t)
        place(pad(ch, d + 0.6, bright), t, pad_gain, -0.2)
        place(pad([ch[0] - 12], d + 0.6, 400), t, pad_gain * 0.9, 0.0)
        steps = int(d / (BEAT / 2))
        for s in range(steps):
            at = t + s * BEAT / 2
            if arp:
                m = ch[[0, 2, 1, 3, 2, 1, 3, 2][s % 8]] + 12
                place(pluck(m), at, arp * (1.0 if s % 2 == 0 else 0.7), 0.3 if s % 2 else -0.3)
            if ost:   # low eighth-note ostinato
                m = ch[0] - 12 + (0 if s % 4 != 3 else 7)
                place(lp(pluck(m, 0.5, 0.5), 900), at, ost)
            if pulse and s % 2 == 0:
                place(kick(), at, pulse * (1.0 if s % 4 == 0 else 0.55))
            if ticks and s % 2 == 1:
                place(tick(), at, ticks, 0.4)
        t += 2 * BAR; k += 1


section(HIST, DATA, P_MINOR, arp=0.16, pad_gain=0.32)
section(DATA, GOOD, P_MINOR, arp=0.16, pulse=0.32, ticks=0.6, pad_gain=0.3)
section(GOOD, HIT, P_BRIGHT, arp=0.2, pulse=0.25, ticks=0.5, pad_gain=0.3, bright=2600)
place(riser(2.0), HIT - 2.0, 1.0)
place(boom(), HIT, 0.45)
section(PROB, CLOSE, P_TENSE, arp=0.1, pulse=0.42, ticks=0.45, ost=0.35, pad_gain=0.3, bright=1500)
section(CLOSE, LAND - 0.2, [[48, 55, 60, 63], [44, 51, 56, 60]], arp=0.12, pad_gain=0.34)
# final chord (C minor, wide), as the closing logo settles
place(riser(1.6), LAND - 1.6, 0.6)
place(boom(), LAND, 0.35)
final = pad([36, 48, 55, 60, 63, 67, 72], DUR - LAND + 0.5, 2200)
place(final, LAND, 0.55)
for m in (60, 63, 67, 72):
    place(pluck(m, 3.0, 2.5), LAND, 0.25)

mix = np.stack([L, R], axis=1)
# gentle room: short stereo delays
for d, g in ((0.031, 0.18), (0.047, 0.14), (0.089, 0.1)):
    k = int(d * SR)
    mix[k:, 0] += mix[:-k, 1] * g; mix[k:, 1] += mix[:-k, 0] * g
fade = np.ones(N); fn = int(1.5 * SR); fade[-fn:] = np.linspace(1, 0, fn)
mix *= fade[:, None]
mix /= np.max(np.abs(mix)) / 0.9
wavfile.write(OUT, SR, (mix * 32767).astype(np.int16))
print('wrote', OUT, f'{DUR:.1f}s')
