# Erriwaya news brief (الموجز الإخباري – الرواية)

This repo is the approved video template. A new edition = a voice-over + photos (+ the script text) from the user.
Do not change the template (src/, assets/, tools/) unless the user asks; only add `editions/<date>/`.

## Producing an edition (keep it lean: few stills, one full render per format)

1. `node tools/new-edition.js YYYY-MM-DD "اليوم DD الشهر YYYY"`; copy the voice-over to `editions/<date>/voiceover.mp3`
   and the photos to `editions/<date>/img/` with descriptive names (`mr-dust.webp`, `ml-security.png`, ...).
2. Transcription: `tools/setup-asr.sh` once per container (Whisper small via npm; huggingface is blocked),
   then `python3 tools/transcribe.py <date>` → phrase timings + suggested `audioCut` / `audioEnd`.
   Prefer the script text the user sends for names and spelling; use the transcript only for timings.
   `outroAt` = start of the closing sentence that follows "إلى هنا نصل إلى ختام..." (~6–7 s before the end).
3. Fill `editions/<date>/edition.js`. `editions/2026-10-25/edition.js` is the reference: one chapter per story,
   2 headlines per story (≤ 2 lines), each photo on the sentence it illustrates, camera/highlights/pins per story
   (an area label `dot: false` gets a `side` when it would cover the highlighted territory),
   date/number chips in `stats`. Avoid «» quotes in headlines (RTL word layout breaks them).
4. Check a few stills: `node tools/render.js --edition <date> --stills 40,100,150` (output/stills/, delete after).
5. Render: `node tools/render.js --edition <date>` (1080x1350) and, if asked, `--format youtube` (1920x1080)
   or `--format story` (1080x1920, TikTok/Reels/Shorts). ~3–5 min each. YouTube and story videos are git-ignored (> 100 MB).
   Each render also writes `output/erriwaya-brief-<date>[-format]-cover.jpg` (thumbnail: first three stories'
   photos + all countries; `cover: { imgs: [...] }` in edition.js overrides the photos) and
   `output/erriwaya-brief-<date>-description.txt` (stories, YouTube chapter timestamps, handles, hashtags).
   `--cover` writes only these two, in seconds.
6. Commit `editions/<date>/` + `output/erriwaya-brief-<date>.mp4` + covers + description, push to the session
   branch, send the video(s), cover(s) and description.

## Fixed decisions

- White template, AL-Quds font, logo assets/logo-mark.png (white mask from the official artwork) tinted navy, inside the safe area.
- Intro from Nouakchott with the city list in src/app.js (`INTRO_CITIES`); outro with ERRIWAYA (Facebook, TikTok,
  YouTube) and ERRIWAYA.MR (Instagram).
- Audio (tools/render.js): synthesized intro theme, quiet bed, whoosh in the pause before each chapter, outro music
  whose final chord lands on the last word; all music ducks under the voice. Western Sahara is drawn as in the
  Natural Earth data (separate territory) unless the user decides otherwise.
