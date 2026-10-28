"""Synthesizes the music bed of a social report (no voice-over), reusing the instruments of make-music.py.

  python3 tools/make-report-music.py out.wav DURATION OUTRO_HIT HIT [HIT ...]

96 BPM, D minor (Dm Bb Gm A, two bars each): pulsing bass, ticks and kicks; a riser and a boom on each HIT;
drums drop out for the calmer middle stretch (the account card); a brass chord on OUTRO_HIT, then decay.
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
HITS = [float(h) for h in sys.argv[4:]]
BEAT = 60 / 96
mm.reset(DUR + 4)
place, note = mm.place, mm.note

CHORDS = [(50, [62, 65, 69]), (46, [62, 65, 70]), (43, [62, 67, 70]), (45, [61, 64, 69])]  # Dm Bb Gm A
BAR = 4 * BEAT
# calm stretch: from just before the middle hit-free section to the following cut (no drums)
CALM = (39.0, 45.4)


def chord_at(t):
    return CHORDS[int(t / (2 * BAR)) % 4]


def calm(t):
    return CALM[0] <= t < CALM[1]


# pads, one per chord
t = 0.0
while t < OUTRO:
    root, tones = chord_at(t)
    d = min(2 * BAR, OUTRO - t) + 0.4
    place(mm.pad([note(n) for n in tones], d, 0.22, attack=0.8, cutoff=1600), t, pan=0.0)
    t += 2 * BAR

# pulse: eighth-note bass, sixteenth ticks, kicks on 1 and 3 (busier after the first hit)
n = 0
while n * BEAT / 2 < OUTRO - 0.05:
    t = n * BEAT / 2
    root, _ = chord_at(t)
    place(mm.bass(note(root - 12), BEAT / 2 * 0.9, 0.42 if not calm(t) else 0.2), t)
    if not calm(t):
        place(mm.tick(0.10 if n % 2 else 0.16), t, pan=0.3)
        place(mm.tick(0.07), t + BEAT / 4, pan=-0.3)
        beat = n // 2
        if n % 2 == 0 and (beat % 2 == 0 or (HITS and t >= HITS[1 if len(HITS) > 1 else 0])):
            place(mm.kick(0.75), t)
        if n % 2 == 0 and beat % 4 == 3 and HITS and t >= HITS[0]:
            place(mm.snare(0.28), t)
    elif n % 4 == 0:
        _, tones = chord_at(t)
        place(mm.pluck(note(tones[(n // 4) % 3] + 12), 0.5, 0.18), t, pan=0.25)
    n += 1

# accents
for h in HITS:
    place(mm.riser(1.6, 0.35), h - 1.6)
    place(mm.boom(0.8), h)
    place(mm.crash(0.35), h)
place(mm.riser(1.8, 0.3), OUTRO - 1.8)
place(mm.boom(0.9), OUTRO)
place(mm.crash(0.45, 2.2), OUTRO)
place(mm.brass([note(n) for n in (50, 57, 62, 65, 69)], DUR - OUTRO + 0.5, 0.55), OUTRO)

L = mm.reverb(mm.L, seed=1)
R = mm.reverb(mm.R, seed=2)
mix = np.stack([L, R], axis=1)[: int(DUR * SR)]
mix = mm.highpass(mix.T, 28).T
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.6)
mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))
tt = np.arange(len(mix)) / SR
mix *= np.clip((DUR - tt) / 1.5, 0, 1)[:, None]
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print('wrote', out, f'{DUR:.1f}s')
