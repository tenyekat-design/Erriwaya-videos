// Shared timeline (read by app.js in the browser and by score.py for the music). 96 BPM: beat 0.625 s, bar 2.5 s.
// Every scene change falls on a downbeat; each cut has its own transition and its own sound.
window.IG_TIME = {"bpm": 96, "beat": 0.625, "bar": 2.5, "duration": 72.5,
  "scenes": ["hook", "map", "sign", "c10", "tiof", "murphy", "chariot", "unknown", "summary", "outro"],
  "cuts": [5.0, 15.0, 22.5, 30.0, 37.5, 45.0, 52.5, 57.5, 65.0],
  "trans": ["zoom", "iris", "push", "blinds", "diag", "rise", "mosaic", "panel", "flash"],
  "tdur": [1.0, 0.8, 0.7, 0.9, 0.8, 0.8, 1.0, 0.8, 0.8]};
