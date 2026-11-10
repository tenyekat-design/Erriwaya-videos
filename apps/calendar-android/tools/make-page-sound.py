#!/usr/bin/env python3
"""Synthesises assets/sounds/page.wav, the sound of a mushaf page being turned (no recording is used).

    python3 tools/make-page-sound.py

A turned page is a soft rustle that rises as the sheet lifts, a few tiny crackles while it bends, and a light
tap as it lands. Here: band-limited noise shaped by that envelope. 0.55 s, mono, 44.1 kHz, 16 bit. Needs numpy.
"""
import pathlib, wave
import numpy as np
SR, DUR = 44100, .55
rng = np.random.default_rng(7)
n = int(SR * DUR); t = np.arange(n) / SR

def band(x, lo, hi):
    f = np.fft.rfft(x); q = np.fft.rfftfreq(len(x), 1 / SR)
    gain = 1 / (1 + (lo / np.maximum(q, 1)) ** 4) / (1 + (q / hi) ** 4)   # gentle band-pass
    return np.fft.irfft(f * gain, len(x))

# the rustle: rises over the first third, then falls away
rustle = band(rng.standard_normal(n), 1800, 7500)
env = np.minimum(t / .16, 1) ** 1.6 * np.exp(-np.maximum(t - .16, 0) / .13)
flutter = 1 + .35 * np.sin(2 * np.pi * (9 + 14 * t) * t + 1.0)            # the sheet wavers as it moves
out = rustle * env * flutter * .9
# crackles while the paper bends
for at in (.07, .12, .15, .21, .26):
    k = int(SR * .012); i = int(SR * (at + rng.uniform(-.008, .008)))
    out[i:i + k] += band(rng.standard_normal(k), 3000, 11000) * np.exp(-np.arange(k) / (SR * .003)) * rng.uniform(.5, 1.0)
# the page lands: a short, low, soft tap
i = int(SR * .40); k = int(SR * .09)
out[i:i + k] += band(rng.standard_normal(k), 250, 1800) * np.exp(-np.arange(k) / (SR * .018)) * 1.4
out *= np.minimum(1, (DUR - t) / .03)                                      # no click at the end
out = out / np.abs(out).max() * .62
p = pathlib.Path(__file__).resolve().parent.parent / 'assets/sounds/page.wav'
with wave.open(str(p), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
print(p.name, p.stat().st_size, 'bytes')
