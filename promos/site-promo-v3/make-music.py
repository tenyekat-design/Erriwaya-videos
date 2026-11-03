"""Original music for the v2 website promo (numpy only): 100 BPM, D minor, Dm-Bb-F-C.

    python3 promos/site-promo-v2/make-music.py   -> promos/site-promo-v2/music.wav

Sections follow timing.js: a swelling intro under the logo, the groove from the first site shot (GROOVE), a breakdown
under the brand statement (BREAK..OUTRO), the groove again for the outro, and a final hit on "dot com" (HIT).
"""
import os
import numpy as np
import soundfile as sf

SR = 44100
DUR = 57.1
GROOVE, BREAK, OUTRO, HIT = 4.99, 41.97, 50.43, 52.95
BPM = 100
BEAT = 60 / BPM
rng = np.random.default_rng(7)
N = int(DUR * SR)
mix = {k: np.zeros((N, 2)) for k in ("drums", "bass", "pad", "pluck", "fx")}


def t_(d):
    return np.arange(int(d * SR)) / SR


def add(bus, t0, sig, pan=0.0, gain=1.0):
    i = int(t0 * SR)
    if i >= N or i + len(sig) <= 0:
        return
    sig = sig[: N - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    mix[bus][i:i + len(sig), 0] += sig * l * 1.414
    mix[bus][i:i + len(sig), 1] += sig * r * 1.414


def lowpass(x, k):
    k = max(1, int(k))
    return np.convolve(x, np.ones(k) / k, mode="same")


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def saw(f, d, harm=8, detune=0.0):
    t = t_(d)
    return sum(np.sin(2 * np.pi * f * (1 + detune) * h * t) / h for h in range(1, harm + 1))


# ── instruments ──
def kick():
    t = t_(0.45)
    f = 45 + 85 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7) + 0.3 * rng.standard_normal(len(t)) * np.exp(-t * 300)


def hat(open_=False):
    t = t_(0.25 if open_ else 0.06)
    n = rng.standard_normal(len(t))
    n = n - lowpass(n, 6)
    return n * np.exp(-t * (14 if open_ else 70)) * 0.5


def clap():
    t = t_(0.3)
    n = rng.standard_normal(len(t))
    n = lowpass(n - lowpass(n, 30), 3)
    env = sum(np.exp(-np.clip(t - o, 0, None) * 25) * (t >= o) for o in (0, 0.012, 0.024))
    return n * env * 0.5


def bass_note(n, d):
    t = t_(d)
    s = lowpass(saw(midi(n), d, harm=6), 20) + 0.6 * np.sin(2 * np.pi * midi(n) * t)
    env = np.minimum(1, t / 0.008) * np.exp(-t * 3.5)
    return s * env


def pad_chord(notes, d):
    t = t_(d)
    s = sum(saw(midi(n), d, harm=7, detune=dt) for n in notes for dt in (-0.004, 0.0, 0.0045))
    s = lowpass(s, 28)
    env = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.5)
    return s * env / (len(notes) * 3)


def pluck(n, d=0.5):
    t = t_(d)
    f = midi(n)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return s * np.exp(-t * 9) * np.minimum(1, t / 0.003)


def riser(d):
    t = t_(d)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(n)
    seg = int(0.05 * SR)
    for i in range(0, len(n), seg):
        k = int(40 - 36 * (i / len(n)))   # the noise brightens as it rises
        out[i:i + seg] = lowpass(n[max(0, i - 200):i + seg + 200], k)[200 if i else 0:][:seg]
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 1400 * (t / d) ** 2) / SR) * 0.15
    return (out * 0.6 + sweep) * (t / d) ** 2


def impact(d=3.4):
    t = t_(d)
    boom = np.sin(2 * np.pi * np.cumsum(38 + 40 * np.exp(-t * 8)) / SR) * np.exp(-t * 1.6)
    n = rng.standard_normal(len(t))
    crash = (n - lowpass(n, 4)) * np.exp(-t * 2.2) * 0.35
    return boom + crash


# chords per 2-bar step: (bass root, pad notes, arpeggio notes)
CHORDS = [(38, [62, 65, 69], [74, 77, 81, 77]),   # Dm
          (34, [58, 62, 65], [70, 74, 77, 74]),   # Bb
          (41, [60, 65, 69], [72, 77, 81, 77]),   # F
          (36, [60, 64, 67], [72, 76, 79, 76])]   # C
BAR = 4 * BEAT


def chord_at(t):
    k = int(max(0, t - GROOVE) // (2 * BAR)) % 4
    return CHORDS[k]


# ── intro: pad swell, a low hit with the logo, riser into the groove ──
add("pad", 0.0, pad_chord([50, 57, 62, 65], GROOVE + 0.6), gain=0.9)
add("fx", 0.95, impact(3.0), gain=0.55)
add("fx", GROOVE - 2.2, riser(2.2), gain=0.5)

# ── grooves ──
def groove(a, b, full=True):
    t = a
    step = BEAT / 4
    i = 0
    while t < b - 1e-6:
        beat_pos = i % 16
        if full and beat_pos % 4 == 0:
            add("drums", t, kick(), gain=0.85)
        if full and beat_pos in (4, 12):
            add("drums", t, clap(), pan=0.05, gain=0.55)
        if full and beat_pos % 4 == 2:
            add("drums", t, hat(open_=beat_pos == 14), pan=0.3, gain=0.35)
        elif beat_pos % 2 == 1:
            add("drums", t, hat(), pan=-0.25, gain=0.16)
        root, pad, arp = chord_at(t)
        if full and beat_pos % 2 == 0:
            add("bass", t, bass_note(root, step * 2), gain=0.55)
        add("pluck", t, pluck(arp[(i // 1) % 4] + (12 if beat_pos in (6, 14) else 0)), pan=0.35 * np.sin(i), gain=0.13)
        if beat_pos == 0 and (i // 16) % 2 == 0:
            add("pad", t, pad_chord(pad, 2 * BAR), gain=0.55)
        t += step
        i += 1


groove(GROOVE, BREAK)
groove(BREAK, OUTRO, full=False)                         # breakdown under the brand statement
add("fx", OUTRO - 1.6, riser(1.6), gain=0.45)
groove(OUTRO, HIT)
# final hit on "dot com": chord, kick, crash, long tail
add("drums", HIT, kick(), gain=1.0)
add("fx", HIT, impact(DUR - HIT), gain=0.8)
add("pad", HIT, pad_chord([50, 57, 62, 65, 69], DUR - HIT) * np.exp(-t_(DUR - HIT) * 0.9), gain=1.1)

# echo on the plucks, a little room on the pad
def echo(x, d, fb, n=4):
    out = x.copy()
    k = int(d * SR)
    for j in range(1, n + 1):
        out[k * j:] += x[:-k * j] * fb ** j
    return out


mix["pluck"] = echo(mix["pluck"], 3 * BEAT / 4, 0.35)
mix["pad"] = mix["pad"] + 0.25 * echo(mix["pad"], 0.083, 0.5, 3)

out = (mix["drums"] * 1.0 + mix["bass"] * 0.9 + mix["pad"] * 0.55 + mix["pluck"] * 1.0 + mix["fx"] * 0.9)
fade = np.ones(N)
fade[-int(0.4 * SR):] = np.linspace(1, 0, int(0.4 * SR))
out *= fade[:, None]
out /= np.max(np.abs(out)) / 0.89
out = np.tanh(out * 1.15) / np.tanh(1.15)
sf.write(os.path.join(os.path.dirname(os.path.abspath(__file__)), "music.wav"), out.astype(np.float32), SR)
print("music.wav", DUR, "s")
