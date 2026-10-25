"""Transcribes an edition's voice-over and suggests the timing fields for edition.js.

    python3 tools/transcribe.py 2026-10-25

Writes editions/<id>/transcript.txt (one line per phrase with its start/end in seconds of the
original file) and prints audioCut (silence just before "أهلا بكم"), audioEnd and outroAt.
Run tools/setup-asr.sh once first.
"""
import os
import subprocess
import sys

import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SR = 16000


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768


def quietest_point(audio, t0, t1):
    """Middle of the quietest 40 ms stretch between t0 and t1."""
    w = int(0.04 * SR)
    a, b = int(max(0, t0) * SR), int(t1 * SR)
    best = None
    for i in range(a, max(a + 1, b - w), w // 4):
        e = float(np.mean(audio[i:i + w] ** 2))
        if best is None or e < best[0]:
            best = (e, i + w // 2)
    return best[1] / SR


def main():
    edition = sys.argv[1]
    edir = os.path.join(ROOT, 'editions', edition)
    voice = os.path.join(edir, 'voiceover.mp3')
    audio = load(voice)

    from faster_whisper import WhisperModel
    model = WhisperModel(os.path.join(ROOT, '.asr-model'), device='cpu', compute_type='int8')
    segs, _ = model.transcribe(audio, language='ar', word_timestamps=True, beam_size=5)
    segs = list(segs)

    lines = [f'[{s.start:7.2f} - {s.end:7.2f}] {s.text.strip()}' for s in segs]
    with open(os.path.join(edir, 'transcript.txt'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    print('\n'.join(lines))

    words = [w for s in segs for w in s.words]
    cut = None
    for i, w in enumerate(words):
        if 'أهلا' in w.word or 'اهلا' in w.word:
            prev_end = words[i - 1].end if i else 0
            cut = quietest_point(audio, prev_end - 0.3, w.start + 0.25)
            break
    outro = next((s.start for s in segs if 'شكرا' in s.text or 'شكراً' in s.text), None)
    end = len(audio) / SR
    print()
    print(f'  audioCut: {cut:.2f},' if cut is not None else '  audioCut: ?,   // "أهلا بكم" not found, set it by hand')
    print(f'  audioEnd: {end:.3f},')
    print(f'  outroAt: {outro:.2f},' if outro is not None else '  outroAt: ?,    // "شكرا لمتابعتكم" not found')


if __name__ == '__main__':
    main()
