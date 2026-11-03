// Shared timeline (read by app.js in the browser and by score.py for the music). 96 BPM: beat 0.625 s, bar 2.5 s.
// Every scene change falls on a downbeat; each cut has its own transition and its own sound.
window.IG_TIME = {"bpm": 96, "beat": 0.625, "bar": 2.5, "duration": 57.5,
  "scenes": ["hook", "total", "world", "c0", "c1", "c2", "c3", "c4", "rank", "outro"],
  "cuts": [5.0, 12.5, 17.5, 22.5, 27.5, 32.5, 37.5, 42.5, 50.0],
  "trans": ["zoom", "iris", "push", "blinds", "diag", "rise", "mosaic", "panel", "flash"],
  "tdur": [1.0, 0.8, 0.7, 0.9, 0.8, 0.8, 1.0, 0.8, 0.8]};
