// Shared timeline (read by app.js in the browser and by score.py for the music). 120 BPM: beat 0.5 s, bar 2.0 s.
// Every scene change falls on a downbeat; each cut has its own transition and its own sound.
window.IG_TIME = {"bpm": 120, "beat": 0.5, "bar": 2.0, "duration": 54.0,
  "scenes": ["hook", "total", "world", "c0", "c1", "c2", "rank", "outro"],
  "cuts": [6.0, 14.0, 20.0, 26.0, 32.0, 38.0, 46.0],
  "trans": ["zoom", "iris", "push", "blinds", "diag", "panel", "flash"],
  "tdur": [1.0, 0.8, 0.7, 0.9, 0.8, 0.9, 0.8]};
