"""Original music for the infographic, synthesized (numpy + scipy), synced to the scene timings of app.js.

  python3 infographics/2026-11-youth-unemployment/make-music.py   ->  music.wav next to this file (git-ignored)

112 BPM, A minor (Am F C G). Intro: pad and pluck over the title, a riser into the drop as the first chart
appears; then kick, clap, hats, pumping bass, 16th-note arpeggio and a lead melody on the chart scenes; a soft
swell and hit at every change of scene; drums stop for the outro and a final chord lands as the handles appear.
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
SCENES = [0, 5.2, 12.0, 20.4, 28.0, 34.0, 42.6, 49.8, 56.2, 60.8]   # = SCENE_STARTS in app.js
DURATION = 67.6
OUTRO = SCENES[-1]
LAND = OUTRO + 2.0          # final chord: the closing logo has settled and the handles appear
DROP = SCENES[1]
BPM = 112
B = 60 / BPM                # beat
BAR = 4 * B
G0 = DROP - 3 * BAR         # beat grid: a downbeat on the drop

rng = np.random.default_rng(7)
N = int(DURATION * SR) + SR
bus = {k: np.zeros((N, 2)) for k in ('drums', 'bass', 'music', 'fx')}


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(d):
    return np.arange(int(d * SR)) / SR


def place(name, sig, t0, pan=0.0, gain=1.0):
    i = int(round(t0 * SR))
    if i >= N or len(sig) == 0:
        return
    if i < 0:
        sig, i = sig[-i:], 0
    sig = sig[:N - i]
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    if sig.ndim == 1:
        bus[name][i:i + len(sig), 0] += sig * gl * gain * 1.414
        bus[name][i:i + len(sig), 1] += sig * gr * gain * 1.414
    else:
        bus[name][i:i + len(sig)] += sig * gain


def filt(x, kind, f, order=2):
    sos = butter(order, f, btype=kind, fs=SR, output='sos')
    return sosfilt(sos, x, axis=0)


def env(n, a=0.005, r=0.03):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


# ---------- instruments ----------
def kick():
    t = tt(0.45)
    f = 44 + 120 * np.exp(-t * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = rng.standard_normal(len(t)) * np.exp(-t * 900) * 0.4
    return np.tanh((s + click) * 1.6)


def clap():
    t = tt(0.35)
    n = rng.standard_normal(len(t))
    e = sum(np.where(t >= o, np.exp(-(t - o) * 140), 0) for o in (0, 0.011, 0.022)) * 0.6 + np.where(t >= 0.03, np.exp(-(t - 0.03) * 16), 0)
    return filt(n * e, 'band', [900, 3200]) * 1.6


def hat(open_=False):
    t = tt(0.25 if open_ else 0.07)
    return filt(rng.standard_normal(len(t)), 'high', 7500) * np.exp(-t * (11 if open_ else 60))


def saw(f, t, voices=1, spread=0.0):
    out = np.zeros_like(t)
    for v in range(voices):
        d = 1 + spread * (v - (voices - 1) / 2) / max(1, voices - 1)
        ph = (t * f * d + rng.random()) % 1.0
        out += 2 * ph - 1
    return out / voices


def bass_note(m, d):
    t = tt(d)
    f = mtof(m)
    s = filt(saw(f, t), 'low', 520) * 0.7 + np.sin(2 * np.pi * f * t) * 0.8
    return np.tanh(s * 1.4) * env(len(t), 0.004, 0.04) * (0.75 + 0.25 * np.exp(-t * 9))


def pluck(m, d=0.42, bright=1.0):
    t = tt(d)
    f = mtof(m)
    s = sum(np.sin(2 * np.pi * f * k * t + k) / k * np.exp(-t * (5 + 3.2 * k / bright)) for k in range(1, 11))
    return s * env(len(t), 0.002, 0.05) * 0.5


def pad_chord(notes, d, cutoff=1500):
    t = tt(d)
    s = sum(saw(mtof(m), t, voices=3, spread=0.012) for m in notes) / len(notes)
    s = filt(s, 'low', cutoff)
    return s * env(len(t), 0.35, 0.6)


def lead_note(m, d):
    t = tt(d)
    f = mtof(m) * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.12) * 6, 0, 1))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph)
    return s * env(len(t), 0.01, 0.08) * 0.45


def riser(d):
    t = tt(d)
    n = filt(rng.standard_normal(len(t)), 'band', [1500, 9000])
    sweep = np.sin(2 * np.pi * np.cumsum(220 + 900 * (t / d) ** 2) / SR) * 0.25
    return (n * 0.5 + sweep) * (t / d) ** 2.2


def impact(d=1.6):
    t = tt(d)
    boom = np.sin(2 * np.pi * np.cumsum(38 + 50 * np.exp(-t * 8)) / SR) * np.exp(-t * 3.2)
    noise = filt(rng.standard_normal(len(t)), 'low', 2500) * np.exp(-t * 9) * 0.5
    return np.tanh((boom + noise) * 1.3)


# ---------- arrangement ----------
CHORDS = [  # (bass root, chord tones, arpeggio tones)
    (45, [57, 60, 64], [69, 72, 76, 81]),   # Am
    (41, [57, 60, 65], [65, 69, 72, 77]),   # F
    (48, [55, 60, 64], [67, 72, 76, 79]),   # C
    (43, [55, 59, 62], [67, 71, 74, 79]),   # G
]
# lead motif, two bars per phrase: (beat offset within 8 beats, midi, beats)
MOTIF = [(0, 76, 1), (1, 74, 0.5), (1.5, 72, 0.5), (2, 74, 1), (3, 76, 0.5), (3.5, 79, 1.5),
         (5, 81, 1), (6, 79, 0.5), (6.5, 76, 0.5), (7, 74, 1)]
MOTIF2 = [(0, 72, 1), (1, 74, 0.5), (1.5, 76, 0.5), (2, 79, 1.5), (3.5, 76, 0.5),
          (4, 74, 1), (5, 72, 0.5), (5.5, 71, 0.5), (6, 69, 2)]
LEAD = [(SCENES[3], SCENES[5]), (SCENES[6], SCENES[8])]   # ranking + Libya, women + NEET
BREAK = (SCENES[5], SCENES[5] + BAR)                      # one bar without drums on the national figures

kicks = []
last_drum_bar = G0 + BAR * np.floor((OUTRO - G0) / BAR)  # drums stop on the last downbeat before the outro
bar = 0
t = G0
while t < LAND + 0.01:
    root, chord, arp = CHORDS[bar % 4]
    intro = t < DROP - 1e-6
    outro = t >= last_drum_bar - 1e-6
    if t + BAR > 0 and not outro:
        # pad
        place('music', pad_chord(chord + [chord[0] + 12], BAR + 0.5, 1100 if intro else 1700), t, gain=0.5 if intro else 0.42)
        # arpeggio: 8ths in the intro, 16ths after the drop, ping-ponged
        step = B / 2 if intro else B / 4
        pattern = [0, 1, 2, 3, 2, 1, 2, 3] if not intro else [0, 1, 2, 1]
        for k in range(int(BAR / step)):
            tk = t + k * step
            if tk < 0:
                continue
            m = arp[pattern[k % len(pattern)]]
            place('music', pluck(m, 0.5 if intro else 0.32, 1.0 if intro else 1.4), tk, pan=-0.45 if k % 2 else 0.45, gain=0.42 if intro else 0.34)
    if not intro and not outro:
        in_break = BREAK[0] - 1e-6 <= t < BREAK[1] - 1e-6
        for b in range(4):
            tb = t + b * B
            if not in_break:
                place('drums', kick(), tb, gain=0.95)
                kicks.append(tb)
                if b in (1, 3):
                    place('drums', clap(), tb, pan=0.05, gain=0.5)
                place('drums', hat(open_=(b == 3 and bar % 2 == 1)), tb + B / 2, pan=0.25, gain=0.35)
            for s in range(4):   # 16th shaker
                place('drums', hat() * (0.5 if s % 2 else 0.25), tb + s * B / 4, pan=-0.3, gain=0.3)
            # bass: root on the beat, octave on the off-beat (rests in the break)
            if not in_break:
                place('bass', bass_note(root - 12, B / 2 - 0.02), tb, gain=0.85)
                place('bass', bass_note(root, B / 2 - 0.04), tb + B / 2, gain=0.6)
        # lead melody on the chart scenes, phrases of two bars
        for a, z in LEAD:
            if a - 1e-6 <= t < z - BAR + 1e-6:
                phrase = MOTIF if int(round((t - G0) / BAR)) % 4 < 2 else MOTIF2
                half = int(round((t - G0) / BAR)) % 2
                for off, m, d in phrase:
                    if half * 4 <= off < half * 4 + 4:
                        place('music', lead_note(m, d * B * 0.95), t + (off - half * 4) * B, pan=0.1, gain=0.42)
    t += BAR
    bar += 1

# a swell and a soft hit at every change of scene; a bigger riser and impact into the drop
place('fx', riser(1.6), DROP - 1.6, gain=0.55)
place('fx', impact(2.2), DROP, gain=0.75)
for s in SCENES[2:-1]:
    place('fx', riser(0.7), s - 0.7, gain=0.28)
    place('fx', impact(1.0), s, gain=0.32)
# outro: pad held under the logo, riser, then the final chord with a chime arpeggio
place('music', pad_chord([57, 64, 69, 72], LAND - last_drum_bar + 0.4, 1300), last_drum_bar, gain=0.45)
place('fx', riser(2.0), LAND - 2.0, gain=0.5)
place('fx', impact(3.0), LAND, gain=0.8)
place('music', pad_chord([45, 57, 64, 71, 72, 76], DURATION - LAND, 2200) * np.exp(-tt(DURATION - LAND) * 0.45), LAND, gain=0.7)
place('bass', bass_note(33, 2.5) * np.exp(-tt(2.5) * 1.2), LAND, gain=0.9)
for i, m in enumerate([69, 72, 76, 79, 81, 84]):
    place('music', pluck(m, 1.6, 1.6), LAND + i * B / 3, pan=-0.5 + i * 0.2, gain=0.36)

# ---------- mix ----------
# sidechain pump from the kicks on bass and music
duck = np.ones(N)
for k in kicks:
    i = int(k * SR)
    seg = tt(0.4)
    g = 1 - 0.6 * np.exp(-seg * 11)
    j = min(N, i + len(seg))
    duck[i:j] = np.minimum(duck[i:j], g[:j - i])
for name in ('bass', 'music'):
    bus[name] *= duck[:, None]

# reverb: synthetic stereo hall (decaying noise impulse response)
ir_t = tt(2.4)
ir = np.stack([rng.standard_normal(len(ir_t)), rng.standard_normal(len(ir_t))], 1) * np.exp(-ir_t * 2.6)[:, None]
ir = filt(ir, 'low', 6000)
ir /= np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True))
send = bus['music'] * 0.35 + bus['fx'] * 0.3 + bus['drums'] * 0.05
wet = np.stack([fftconvolve(send[:, c], ir[:, c])[:N] for c in range(2)], 1)

mix = bus['drums'] + bus['bass'] + bus['music'] + bus['fx'] + wet * 0.5
mix = filt(mix, 'high', 28)
# lift the drum-less intro and outro so they sit level with the beat
tm = np.arange(N) / SR
lift = 1 + 0.9 * np.clip((DROP - tm) / 0.3, 0, 1) + 0.7 * np.clip((tm - last_drum_bar) / 0.5, 0, 1)
mix *= lift[:, None]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.5) / np.tanh(1.5)          # gentle saturation / glue
mix = mix[:int(DURATION * SR)]
tail = tt(0.8)
mix[-len(tail):] *= np.linspace(1, 0, len(tail))[:, None]
mix *= 10 ** (-1.0 / 20) / np.max(np.abs(mix))

out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'music.wav')
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print('wrote', out, f'{len(mix) / SR:.1f}s')
