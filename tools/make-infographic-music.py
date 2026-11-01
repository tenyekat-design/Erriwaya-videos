"""Light, upbeat bed for infographics (economy/data), reusing the instruments of make-music.py.

  python3 tools/make-infographic-music.py out.wav DURATION OUTRO_HIT CALM_FROM CALM_TO HIT [HIT ...]

110 BPM, F major (F C Dm Bb, one bar each): plucked sixteenth arpeggios, warm pad, soft kick and claps,
shaker; a short riser and a light crash on each HIT (no booms); only pad and plucks between CALM_FROM and
CALM_TO; a sustained final chord on OUTRO_HIT, then a fade.
"""
import importlib.util
import os
import sys
import numpy as np
from scipy.io import wavfile

spec = importlib.util.spec_from_file_location('mm', os.path.join(os.path.dirname(__file__), 'make-music.py'))
mm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mm)
SR = mm.SR

out = sys.argv[1]
DUR = float(sys.argv[2])
OUTRO = float(sys.argv[3])
CALM = (float(sys.argv[4]), float(sys.argv[5]))
HITS = [float(h) for h in sys.argv[6:]]
BEAT = 60 / 110
BAR = 4 * BEAT
mm.reset(DUR + 4)
place, note = mm.place, mm.note

CHORDS = [(41, [65, 69, 72, 77]), (36, [64, 67, 72, 76]), (38, [62, 65, 69, 74]), (34, [62, 65, 70, 74])]  # F C Dm Bb


def chord_at(t):
    return CHORDS[int(t / BAR) % 4]


def calm(t):
    return CALM[0] <= t < CALM[1]


def clap(gain=1.0):
    n = int(0.3 * SR)
    noise = mm.bandpass(mm.rng.standard_normal(n), 900, 6000)
    e = np.zeros(n)
    for k, d in enumerate((0, 0.011, 0.022)):  # three quick bursts, like hands
        i = int(d * SR)
        e[i:] += mm.env(n - i, 0.0005, 0.012 if k < 2 else 0.09)
    return noise * e * gain


def shaker(gain=1.0):
    n = int(0.08 * SR)
    return mm.highpass(mm.rng.standard_normal(n), 5000, 4) * mm.env(n, 0.006, 0.02) * gain


# warm pad, one chord per bar
t = 0.0
while t < OUTRO:
    root, tones = chord_at(t)
    place(mm.pad([note(n) for n in tones[:3]], min(BAR, OUTRO - t) + 0.3, 0.16, attack=0.25, cutoff=1800), t)
    t += BAR

# sixteenth-note pluck arpeggio, bass on the beat, light drums
n = 0
step = BEAT / 4
while n * step < OUTRO - 0.05:
    t = n * step
    root, tones = chord_at(t)
    pattern = [0, 1, 2, 3, 2, 1, 2, 3]
    place(mm.pluck(note(tones[pattern[n % 8]]), 0.22, 0.20 if n % 4 == 0 else 0.13), t, pan=0.35 if n % 2 else -0.35)
    if n % 4 == 0:
        place(mm.bass(note(root), BEAT * 0.8, 0.30), t)
    if not calm(t):
        place(shaker(0.09 if n % 2 else 0.05), t, pan=0.2)
        beat = n // 4
        if n % 4 == 0 and beat % 2 == 0:
            place(mm.kick(0.5), t)
        if n % 4 == 0 and beat % 2 == 1:
            place(clap(0.35), t, pan=-0.1)
    n += 1

for h in HITS:
    place(mm.riser(1.0, 0.18), h - 1.0)
    place(mm.crash(0.18, 1.2), h)
place(mm.riser(1.2, 0.18), OUTRO - 1.2)
place(mm.crash(0.22, 2.0), OUTRO)
place(mm.pad([note(n) for n in (53, 60, 65, 69, 72)], DUR - OUTRO + 0.5, 0.32, attack=0.05, cutoff=2600), OUTRO)
for k, m in enumerate((77, 81, 84, 89)):
    place(mm.pluck(note(m), 0.5, 0.2), OUTRO + k * step * 2, pan=0.2 * (k - 1.5))

L = mm.reverb(mm.L, seconds=1.6, wet=0.2, seed=1)
R = mm.reverb(mm.R, seconds=1.6, wet=0.2, seed=2)
mix = np.stack([L, R], axis=1)[: int(DUR * SR)]
mix = mm.highpass(mix.T, 30).T
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.4)
mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))
tt = np.arange(len(mix)) / SR
mix *= np.clip((DUR - tt) / 1.8, 0, 1)[:, None]
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print('wrote', out, f'{DUR:.1f}s')
