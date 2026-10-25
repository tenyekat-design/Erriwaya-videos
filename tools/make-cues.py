"""Synthesizes the report's other audio cues, in the same key and sound as the opening theme:

  assets/audio/bed.wav         soft background loop under the voice-over (16 bars, loops seamlessly)
  assets/audio/whoosh.wav      transition between stories (peak at 0.55s)
  assets/audio/outro-music.wav closing music; its final chord lands at 8.0s

The renderer mixes them low and ducks them under the voice (tools/render.js).
"""
import importlib.util
import os

import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('theme', os.path.join(HERE, 'make-music.py'))
mm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mm)
SR, note, place, t_ = mm.SR, mm.note, mm.place, mm.t_
OUT = os.path.join(HERE, '..', 'assets', 'audio')

PROG = [(38, [62, 65, 69]), (34, [58, 62, 65]), (41, [60, 65, 69]), (36, [60, 64, 67])]   # Dm Bb F C


def master(seconds, peak_db=-1.0, fade_in=0.0, fade_out=0.0):
    L = mm.reverb(mm.L, seed=1)
    R = mm.reverb(mm.R, seed=2)
    mix = np.stack([L, R], axis=1)
    mix = mm.highpass(mix.T, 30).T
    mix *= 10 ** (peak_db / 20) / np.max(np.abs(mix))
    t = t_(len(mix))
    if fade_in:
        mix *= np.clip(t / fade_in, 0, 1)[:, None]
    if fade_out:
        mix *= np.clip((seconds - t) / fade_out, 0, 1)[:, None]
    return mix


def write(name, mix):
    path = os.path.join(OUT, name)
    wavfile.write(path, SR, (mix * 32767).astype(np.int16))
    print('wrote', os.path.relpath(path), f'{len(mix) / SR:.1f}s')


def bed():
    """Calm 100 BPM loop. Kept out of the voice band as much as possible: warm pad, airy ticks."""
    mm.rng = np.random.default_rng(21)
    beat = 0.6
    bar = 4 * beat
    loop = 16 * bar
    mm.reset(loop * 3)
    for rep in range(3):
        for b in range(16):
            root, tones = PROG[(b // 2) % 4]
            t0 = rep * loop + b * bar
            if b % 2 == 0:
                place(mm.pad([note(x - 12) for x in tones], 2 * bar + 0.3, 0.5, attack=1.2, cutoff=1300), t0)
                place(mm.bass(note(root), 2 * bar, 0.25), t0)
            place(mm.kick(0.28), t0)
            place(mm.kick(0.18), t0 + 2 * beat)
            for e in range(8):
                place(mm.tick(0.08 if e % 2 else 0.12), t0 + e * beat / 2, pan=0.5 if e % 2 else -0.3)
                tn = tones[[0, 1, 2, 1][e % 4]] + 12
                place(mm.lowpass(mm.pluck(note(tn), 0.3, 0.12), 2600), t0 + e * beat / 2, pan=-0.4 if e % 2 else 0.4)
    mix = master(loop * 3, peak_db=-3.0)
    n = int(loop * SR)
    write('bed.wav', mix[n:2 * n])        # middle pass: reverb tails already wrap around


def whoosh():
    mm.rng = np.random.default_rng(31)
    dur = 1.2
    mm.reset(dur)
    n = int(dur * SR)
    t = t_(n)
    peak = 0.55
    noise = mm.rng.standard_normal(n)
    up = mm.sweep_filter(noise, 400, 6000, 'low')
    shape = np.where(t < peak, (t / peak) ** 2.5, np.exp(-(t - peak) / 0.18))
    air = mm.highpass(up, 700, 2) * shape
    f = 220 * 2 ** (2.5 * np.clip(t / peak, 0, 1))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * shape * 0.12
    thump = np.zeros(n)
    k = mm.kick(0.25)
    i = int(peak * SR)
    thump[i:i + len(k)] = k[: n - i]
    place(air + tone + mm.highpass(thump, 120), 0.0, pan=0.0)
    write('whoosh.wav', master(dur, peak_db=-1.0, fade_out=0.25))


def outro():
    mm.rng = np.random.default_rng(41)
    beat = 0.4
    hit = 8.0
    total = 12.5
    mm.reset(total)
    # soft swell under the last sentences
    place(mm.pad([note(x - 12) for x in (62, 65, 69, 74)], hit + 0.2, 0.55, attack=5.0, cutoff=1600), 0.0)
    for k in range(int(hit / (beat / 2))):
        tt = k * beat / 2
        g = (tt / hit) ** 1.5
        place(mm.bass(note(38), beat * 0.45, 0.25 * g), tt)
        place(mm.tick(0.05 + 0.08 * g), tt, pan=0.5)
        if tt > 3.0:
            tn = [62, 65, 69, 74][k % 4] + (12 if tt > 6.0 and k % 4 == 3 else 0)
            place(mm.pluck(note(tn), 0.16, 0.18 + 0.25 * g), tt, pan=0.35 if k % 2 else -0.35)
    place(mm.riser(2.4, 0.18), hit - 2.4)
    # final chord: resolves to D major
    place(mm.boom(0.45), hit)
    place(mm.kick(0.55), hit)
    place(mm.crash(0.14, 1.8), hit)
    place(mm.brass([note(x) for x in (38, 45, 50, 54, 57, 62)], 4.2, 1.2), hit)
    place(mm.pad([note(x) for x in (50, 57, 62, 66, 69)], 4.4, 0.5, attack=0.05, cutoff=3000), hit)
    for i, (n_, d_) in enumerate([(74, 1), (69, 1), (78, 3)]):
        st = hit + 0.5 * beat + sum(x[1] for x in [(74, 1), (69, 1), (78, 3)][:i]) * beat / 2
        place(mm.brass([note(n_), note(n_ - 12)], d_ * beat / 2 + 0.4, 0.5), st, pan=0.1)
    write('outro-music.wav', master(total, peak_db=-1.0, fade_out=2.5))


if __name__ == '__main__':
    bed()
    whoosh()
    outro()
