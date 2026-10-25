# Erriwaya videos

Renderer for the **الموجز الإخباري** news brief by الرواية (ERRIWAYA), 1080×1350.

Layout: cinematic image carousel at the top, a player-style progress bar in the middle, a headline block, and a
pixel-grid map of the region at the bottom that follows each story (accurate borders from Natural Earth 50m).
It opens with an intro (a glowing coastline from Nouakchott, light threads from the cities, then the logo with
"الموجز الإخباري") and closes on the logo with the social handles.

```
assets/        images, logo, font (AL-Quds), voice-over
src/timeline.js  all content and timing (in voice-over seconds): cards, headlines, map camera, pins, lines, figures
src/app.js       canvas renderer (renderFrame(t))
src/map-data.js  generated pixel grid + borders (npm run build:map)
tools/render.js  headless Chromium + ffmpeg
output/          final video
```

## Usage

```
npm install            # plus playwright (preinstalled in the cloud image)
npm run build:map      # only if the map region changes
node tools/render.js --stills 12,40,95   # check frames -> output/stills/
node tools/render.js                     # full video -> output/erriwaya-brief.mp4
```

For a new edition: replace the voice-over and images, set `audioCut` (the start of "أهلا بكم"), then edit the
`timeline.js` entries.
