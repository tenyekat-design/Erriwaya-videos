// Shared timeline (read by app.js in the browser and by score.py for the music). 96 BPM: beat 0.625 s, bar 2.5 s.
// Every scene change falls on a downbeat; each cut has its own transition and its own sound.
// 'tease' = the opening hook (2 bars) before the title; score.py runs the main piece from its end.
window.IG_TIME = {"bpm": 96, "beat": 0.625, "bar": 2.5, "duration": 77.5,
  "scenes": ["tease", "hook", "map", "sign", "c10", "tiof", "murphy", "chariot", "unknown", "summary", "outro"],
  "cuts": [5.0, 10.0, 20.0, 27.5, 35.0, 42.5, 50.0, 57.5, 62.5, 70.0],
  "trans": ["split", "zoom", "iris", "push", "blinds", "diag", "rise", "mosaic", "panel", "flash"],
  "tdur": [0.8, 1.0, 0.8, 0.7, 0.9, 0.8, 0.8, 1.0, 0.8, 0.8]};
