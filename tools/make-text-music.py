"""Synthesizes the music of a text video, cut to its screens (called by tools/render-text.js).

    python3 tools/make-text-music.py plan.json out.wav

plan.json: { duration, outro, screens: [{ kind, t0 }] } (window.PLAN in src/text.js).
128 BPM, A minor (Am F C G), built with the instruments of tools/make-music.py:
  hook       filtered build: pulse, arpeggio, rising hats, snare roll and riser into the title
  title      the drop: boom + crash, then the full groove (four-on-the-floor kick, claps, hats,
             off-beat bass, syncopated chord stabs, arpeggio; a lead joins in the second half)
  stat       the groove stops for half a beat, then an impact on the figure
  quote      a lighter section (half-time kick, pad) while the card is read
  question   breakdown: drums out, pad and a riser into the outro
  outro      the final hit (boom, crash, brass chord) as the logo lands, then the ring-out
Only a few transition sounds: a soft swish (each one slightly different) where the layout changes.
"""
import importlib.util
import json
import os
import sys

import numpy as np

spec = importlib.util.spec_from_file_location('mm', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'make-music.py'))
mm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mm)
SR, note, place = mm.SR, mm.note, mm.place
rng = np.random.default_rng(11)

BPM = 128
BEAT = 60 / BPM
CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G (one bar each)
ROOTS = [45, 41, 36, 43]


def swish(dur, f0, f1, gain):
    n = int(dur * SR)
    t = mm.t_(n)
    s = mm.sweep_filter(rng.standard_normal(n), f0, f1, 'low')
    s = mm.highpass(s, 400)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return s * e * gain


def main():
    plan = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    D, OUTRO = plan['duration'], plan['outro']
    scr = plan['screens']
    title = next((s['t0'] for s in scr if s['kind'] == 'title'), scr[1]['t0'] if len(scr) > 1 else 3.0)
    question = next((s['t0'] for s in scr if s['kind'] == 'question'), OUTRO)
    stats = [s['t0'] for s in scr if s['kind'] == 'stat']
    # the quote card (more to read) gets a lighter section: half-time kick, no claps or stabs
    ends = [scr[k + 1]['t0'] if k + 1 < len(scr) else OUTRO for k in range(len(scr))]
    quiet = [(s['t0'], ends[k]) for k, s in enumerate(scr) if s['kind'] == 'quote']
    HIT = OUTRO + 0.35
    mm.reset(D + 0.5)

    # beat grid anchored on the drop (title); bars before it make the build
    first = title - int(title / BEAT) * BEAT
    beats = np.arange(first, D, BEAT)
    for i, tb in enumerate(beats):
        rel = int(round((tb - title) / BEAT))     # beats from the drop (negative in the build)
        bar = rel // 4
        ch, root = CHORDS[bar % 4], ROOTS[bar % 4]
        in_build = tb < title - 1e-3
        in_break = question - 1e-3 <= tb < HIT - 1e-3
        stat_gap = any(st - BEAT / 2 - 1e-3 <= tb < st - 1e-3 for st in stats)
        if tb >= HIT - 1e-3:
            break
        if in_build:
            p = np.clip(tb / title, 0, 1)
            place(mm.kick(0.35 + 0.35 * p), tb)
            for k in range(2):
                place(mm.tick(0.05 + 0.1 * p), tb + k * BEAT / 2 + BEAT / 4, pan=0.4)
            for k in range(2):
                place(mm.pluck(note(ch[(i * 2 + k) % 3] + 12), 0.2, 0.12 + 0.12 * p), tb + k * BEAT / 2, pan=-0.3 + 0.6 * k)
            if title - tb <= 4 * BEAT + 1e-3:          # snare roll in the last bar
                n = 2 if title - tb > 2 * BEAT else 4
                for k in range(n):
                    place(mm.snare(0.12 + 0.25 * (1 - (title - tb) / (4 * BEAT)), 0.08), tb + k * BEAT / n)
            continue
        if in_break:
            if rel % 4 == 0:
                place(mm.pad([note(x) for x in ch], 4 * BEAT + 0.4, 0.22, 0.3, 1800), tb)
                place(mm.bass(note(root), 4 * BEAT, 0.25), tb)
            place(mm.pluck(note(ch[i % 3] + 24), 0.25, 0.06), tb + BEAT / 2, pan=0.5)
            continue
        if stat_gap:
            continue
        second_half = tb > (title + question) / 2
        light = any(a - 1e-3 <= tb < b - 1e-3 for a, b in quiet)
        if light:
            if rel % 2 == 0:
                place(mm.kick(0.7), tb)
            place(mm.tick(0.12), tb + BEAT / 2, pan=-0.25)
            place(mm.bass(note(root), BEAT * 0.45, 0.4), tb + BEAT / 2)
            for k in range(4):
                place(mm.pluck(note(ch[(rel * 4 + k) % 3] + 24), 0.14, 0.07), tb + k * BEAT / 4, pan=-0.4 if k % 2 else 0.4)
            if rel % 4 == 0:
                place(mm.pad([note(x) for x in ch], 4 * BEAT + 0.3, 0.12, 0.2, 1600), tb)
            continue
        # drums; a short snare fill closes every eight bars
        place(mm.kick(0.95), tb)
        if rel % 32 >= 30:
            for k in range(1, 4):
                place(mm.snare(0.16 + 0.06 * k, 0.07), tb + k * BEAT / 4)
        if rel % 2 == 1:
            place(mm.snare(0.42, 0.11), tb)
            place(mm.snare(0.18, 0.06), tb + 0.012, pan=0.3)
        place(mm.tick(0.22), tb + BEAT / 2, pan=-0.25)
        for k in (1, 3):
            place(mm.tick(0.07), tb + k * BEAT / 4, pan=0.35)
        # off-beat bass
        place(mm.bass(note(root), BEAT * 0.45, 0.55), tb + BEAT / 2)
        # chord stabs: 1, the "and" of 2, and 4 of each bar
        if rel % 4 in (0, 1, 3):
            at = tb + (BEAT / 2 if rel % 4 == 1 else 0)
            place(mm.brass([note(x + 12) for x in ch], BEAT * 0.9, 0.16), at, pan=0.1)
        # sixteenth arpeggio
        for k in range(4):
            place(mm.pluck(note(ch[(rel * 4 + k) % 3] + 24), 0.14, 0.06), tb + k * BEAT / 4, pan=-0.4 if k % 2 else 0.4)
        # lead line in the second half
        if second_half and rel % 2 == 0:
            place(mm.pluck(note(ch[(rel // 2) % 3] + 36), 0.4, 0.07), tb + BEAT * 0.75, pan=0.15)
        if rel % 32 == 0:
            place(mm.crash(0.1, 1.6), tb)

    # accents
    place(mm.riser(title - 0.2 if title > 2.2 else 2.0, 0.22), 0.2)
    place(mm.boom(0.5), title)
    place(mm.crash(0.16, 2.0), title)
    for st in stats:
        place(mm.boom(0.32), st)
        place(mm.crash(0.08, 1.2), st)
    place(mm.riser(max(1.5, HIT - question - 0.1), 0.2), question + 0.1)
    place(mm.boom(0.55), HIT)
    place(mm.crash(0.18, 2.6), HIT)
    place(mm.brass([note(x) for x in [45, 57, 60, 64, 69]], 4.5, 0.3), HIT)
    place(mm.pad([note(x) for x in [57, 60, 64]], D - HIT, 0.14, 0.2, 2400), HIT)
    # soft swishes where the layout changes (not on the title or the figures, which have their impacts)
    last = -10
    for k, s in enumerate(scr[1:], 1):
        if s['kind'] in ('title', 'stat') or s['kind'] == scr[k - 1]['kind'] or s['t0'] - last < 6:
            continue
        place(swish(0.42, 500 + 300 * (k % 3), 7000 - 1200 * (k % 2), 0.09), s['t0'] - 0.3, pan=0.3 * (1 if k % 2 else -1))
        last = s['t0']

    L = mm.reverb(mm.L, 1.6, 0.16, seed=1)
    R = mm.reverb(mm.R, 1.6, 0.16, seed=2)
    mix = np.stack([L, R], axis=1)[: int(D * SR)]
    mix = mm.highpass(mix.T, 30).T
    mix = np.tanh(mix / np.max(np.abs(mix)) * 1.6)
    mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))
    t = mm.t_(len(mix))
    mix *= np.clip((D - t) / 1.5, 0, 1)[:, None]
    from scipy.io import wavfile
    wavfile.write(out, SR, (mix * 32767).astype(np.int16))
    print('wrote', out, f'{D:.1f}s, drop at {title:.2f}s, final hit at {HIT:.2f}s')


if __name__ == '__main__':
    main()
