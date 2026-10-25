"""Synthesizes the opening news theme (assets/audio/intro-music.wav).

150 BPM, D minor. Accents are aligned with the intro animation in src/app.js:
  0.05s  start, coastline draws from Nouakchott (pulse, ticks, arpeggio)
  3.25s  build while the threads accelerate (snare roll, riser)
  4.85s  hit when the logo appears (boom, brass, crash)
  ~7s    voice-over starts; the theme decays under it
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
BEAT = 0.4                 # 150 BPM
T0 = 0.05                  # first downbeat
HIT = T0 + 12 * BEAT       # 4.85s, start of bar 4
LENGTH = 11.0
rng = np.random.default_rng(7)

L = np.zeros(int(LENGTH * SR))
R = np.zeros_like(L)


def t_(n):
    return np.arange(n) / SR


def note(n):  # MIDI -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= len(L):
        return
    s = sig[: len(L) - i] * gain
    L[i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan))


def env(n, a, d):
    t = t_(n)
    e = np.exp(-t / d)
    if a > 0:
        e *= np.clip(t / a, 0, 1)
    return e


def saw(freq, n, detune=0.0):
    t = t_(n)
    ph = (freq * (1 + detune) * t + rng.random()) % 1.0
    return 2 * ph - 1


def lowpass(x, fc, order=2):
    sos = signal.butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def highpass(x, fc, order=2):
    sos = signal.butter(order, fc, 'high', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def bandpass(x, f0, f1, order=2):
    sos = signal.butter(order, [f0, f1], 'band', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def sweep_filter(x, f_start, f_end, kind='low', block=512):
    """Time-varying Butterworth filter, processed in blocks with carried state."""
    out = np.zeros_like(x)
    zi = None
    nb = int(np.ceil(len(x) / block))
    for b in range(nb):
        p = b / max(1, nb - 1)
        fc = f_start * (f_end / f_start) ** p
        sos = signal.butter(2, min(fc, SR * 0.45), kind, fs=SR, output='sos')
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        seg = x[b * block:(b + 1) * block]
        out[b * block:b * block + len(seg)], zi = signal.sosfilt(sos, seg, zi=zi)
    return out


# ---------- instruments ----------
def kick(gain=1.0):
    n = int(0.6 * SR)
    t = t_(n)
    f = 45 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * env(n, 0.001, 0.22)
    click = highpass(rng.standard_normal(n), 2000) * env(n, 0, 0.004) * 0.4
    return np.tanh((s + click) * 1.6) * gain


def tom(freq, gain=1.0):
    n = int(0.7 * SR)
    t = t_(n)
    f = freq * (1 + 0.6 * np.exp(-t / 0.05))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.25)
    s += lowpass(rng.standard_normal(n), 1500) * env(n, 0, 0.05) * 0.3
    return np.tanh(s * 1.4) * gain


def snare(gain=1.0, decay=0.14):
    n = int(0.5 * SR)
    t = t_(n)
    body = np.sin(2 * np.pi * 190 * t) * env(n, 0, 0.05)
    noise = bandpass(rng.standard_normal(n), 1200, 9000) * env(n, 0, decay)
    return (body * 0.6 + noise) * gain


def tick(gain=1.0):
    n = int(0.05 * SR)
    return highpass(rng.standard_normal(n), 6000, 4) * env(n, 0, 0.008) * gain


def crash(gain=1.0, decay=1.6):
    n = int(3.5 * SR)
    s = highpass(rng.standard_normal(n), 3500, 2) * env(n, 0.002, decay)
    s += highpass(rng.standard_normal(n), 7000, 2) * env(n, 0.002, decay * 0.6) * 0.6
    return s * gain


def boom(gain=1.0):
    n = int(3.0 * SR)
    t = t_(n)
    f = 32 + 60 * np.exp(-t / 0.12)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.9)
    s += lowpass(rng.standard_normal(n), 300) * env(n, 0.001, 0.25) * 0.8
    return np.tanh(s * 2.2) * gain


def supersaw(freq, n, voices=7, spread=0.012):
    s = sum(saw(freq, n, spread * (v - (voices - 1) / 2) / ((voices - 1) / 2)) for v in range(voices))
    return s / voices


def pluck(freq, dur=0.18, gain=1.0):
    n = int(dur * SR)
    s = supersaw(freq, n, 3, 0.006)
    t = t_(n)
    # filter envelope: bright attack that closes quickly
    out = np.zeros(n)
    blk = 256
    for b in range(0, n, blk):
        fc = 600 + 5000 * np.exp(-(b / SR) / 0.05)
        out[b:b + blk] = lowpass(s[b:b + blk], fc, 1)
    return out * env(n, 0.002, dur * 0.45) * gain


def bass(freq, dur, gain=1.0):
    n = int(dur * SR)
    s = saw(freq, n) + 0.5 * saw(freq * 0.5, n)
    s = lowpass(s, 380, 2)
    e = env(n, 0.004, dur * 0.6)
    return np.tanh(s * 2.0) * e * gain


def pad(freqs, dur, gain=1.0, attack=0.6, cutoff=2200):
    n = int(dur * SR)
    s = sum(supersaw(f, n, 7, 0.01) for f in freqs) / len(freqs)
    s = lowpass(s, cutoff, 2)
    t = t_(n)
    e = np.clip(t / attack, 0, 1) * np.clip((dur - t) / 0.4, 0, 1)
    return s * e * gain


def brass(freqs, dur, gain=1.0):
    """Stabbed brass chord: fast filter swell, then a long body."""
    n = int(dur * SR)
    s = sum(supersaw(f, n, 5, 0.007) for f in freqs) / len(freqs)
    out = np.zeros(n)
    blk = 256
    for b in range(0, n, blk):
        tt = b / SR
        fc = 700 + 4200 * np.exp(-tt / 0.18) + 900 * np.clip(tt / 1.5, 0, 1)
        out[b:b + blk] = lowpass(s[b:b + blk], fc, 2)
    t = t_(n)
    e = np.clip(t / 0.012, 0, 1) * (0.55 + 0.45 * np.exp(-t / 0.25)) * np.clip((dur - t) / 1.2, 0, 1)
    return np.tanh(out * 2.2) * e * gain


def riser(dur, gain=1.0):
    n = int(dur * SR)
    t = t_(n)
    noise = sweep_filter(rng.standard_normal(n), 300, 9000, 'low')
    f = 180 * (8 ** (t / dur))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 + np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * 0.15
    e = (t / dur) ** 2.2
    return (noise * 0.7 + tone) * e * gain


# ---------- arrangement ----------
D2, F2, A2 = 38, 41, 45
chords = {  # bar -> (root, chord tones)
    0: (38, [62, 65, 69, 74]),   # Dm
    1: (34, [58, 62, 65, 70]),   # Bb
    2: (36, [60, 64, 67, 72]),   # C
}
ARP = [0, 2, 1, 3, 2, 1, 3, 2]

# bars 1-3 (0.05s .. 4.85s)
for bar in range(3):
    root, tones = chords[bar]
    b0 = T0 + bar * 4 * BEAT
    # pulsing bass in eighths
    for e8 in range(8):
        place(bass(note(root), BEAT * 0.48, 0.3), b0 + e8 * BEAT / 2)
    # 16th arpeggio, louder and brighter each bar
    for s16 in range(16):
        tn = tones[ARP[s16 % 8]] + (12 if bar == 2 and s16 % 4 == 3 else 0)
        place(pluck(note(tn), 0.16, 0.5 + 0.15 * bar), b0 + s16 * BEAT / 4, pan=0.35 if s16 % 2 else -0.35)
    # strings pad
    place(pad([note(x - 12) for x in tones[:3]], 4 * BEAT + 0.1, 0.4 + 0.12 * bar, attack=0.5), b0)
    # drums: kick on 1 and 3, toms driving on the offbeats, clock ticks
    for bt in range(4):
        tb = b0 + bt * BEAT
        if bt in (0, 2) or bar == 2:
            place(kick(0.6), tb)
        place(tom(110 if bt % 2 else 82, 0.35), tb + BEAT / 2, pan=-0.2 if bt % 2 else 0.2)
        if bt in (1, 3):
            place(snare(0.35), tb)
    for s16 in range(16):
        place(tick(0.22 if s16 % 4 == 0 else 0.11), b0 + s16 * BEAT / 4, pan=0.5)

# opening impact
place(boom(0.35), T0)
place(crash(0.08, 0.8), T0)

# bar 3 build: snare roll accelerating into the hit
b3 = T0 + 8 * BEAT
roll_t = b3
k = 0
while roll_t < HIT - 0.02:
    p = (roll_t - b3) / (HIT - b3)
    place(snare(0.12 + 0.45 * p ** 1.5, 0.08), roll_t, pan=0.15 * (-1) ** k)
    roll_t += BEAT / 4 if p < 0.5 else BEAT / 8 if p < 0.85 else BEAT / 16
    k += 1
place(riser(HIT - (T0 + 4 * BEAT), 0.35), T0 + 4 * BEAT)

# the hit (logo)
place(boom(0.6), HIT)
place(kick(0.7), HIT)
place(crash(0.25, 1.5), HIT)
place(brass([note(x) for x in (38, 45, 50, 53, 57, 62)], 3.4, 1.7), HIT)
place(pad([note(x) for x in (50, 57, 62, 65, 69)], 5.5, 0.55, attack=0.05, cutoff=3200), HIT)
for i, tt in enumerate([0, 0.2, 0.4, 0.8]):      # timpani-like toms answering the hit
    place(tom(62 if i % 2 else 55, 0.6 - i * 0.1), HIT + 4 * BEAT * 0 + 2 * BEAT + tt)
# motif on top: D5 A4 D5 F5 E5 D5
for i, (n_, d_) in enumerate([(74, 1), (69, 1), (74, 1), (77, 2), (76, 1), (74, 3)]):
    st = HIT + 0.5 * BEAT + sum(x[1] for x in [(74, 1), (69, 1), (74, 1), (77, 2), (76, 1), (74, 3)][:i]) * BEAT / 2
    place(brass([note(n_), note(n_ - 12)], d_ * BEAT / 2 + 0.25, 0.65), st, pan=0.1)
# pulse continues softly into the voice-over
for e8 in range(24):
    tt = HIT + 4 * BEAT + e8 * BEAT / 2
    place(bass(note(38), BEAT * 0.45, 0.32 * max(0, 1 - e8 / 24)), tt)
    if e8 % 2 == 0:
        place(tick(0.08 * max(0, 1 - e8 / 24)), tt, pan=0.5)
place(boom(0.35), HIT + 8 * BEAT)
place(crash(0.08, 1.8), HIT + 8 * BEAT)

# ---------- reverb + master ----------
def reverb(x, seconds=2.2, wet=0.22, seed=1):
    n = int(seconds * SR)
    r = np.random.default_rng(seed)
    ir = r.standard_normal(n) * np.exp(-t_(n) / (seconds / 6.5))
    ir = lowpass(ir, 6000)
    ir /= np.sqrt(np.sum(ir ** 2))
    return x + wet * signal.fftconvolve(x, ir)[: len(x)]


L = reverb(L, seed=1)
R = reverb(R, seed=2)
mix = np.stack([L, R], axis=1)
mix = highpass(mix.T, 28).T
# glue compression (simple soft clip) and normalize to -1 dBFS
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.8)
mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))
# fade out the tail under the voice
t = t_(len(mix))
mix *= np.clip((LENGTH - t) / 3.0, 0, 1)[:, None]
out = sys.argv[1] if len(sys.argv) > 1 else 'assets/audio/intro-music.wav'
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print('wrote', out, f'{LENGTH:.1f}s, hit at {HIT:.2f}s')
