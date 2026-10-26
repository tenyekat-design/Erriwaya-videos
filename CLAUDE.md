# Erriwaya news brief (الموجز الإخباري – الرواية)

This repo is the approved video template. A new edition = a voice-over + photos (+ the script text) from the user.
Do not change the template (src/, assets/, tools/) unless the user asks; only add `editions/<date>/`.

## Producing an edition (keep it lean: few stills, one full render per format)

1. `node tools/new-edition.js YYYY-MM-DD "اليوم DD الشهر YYYY"`; copy the voice-over to `editions/<date>/voiceover.mp3`
   and the photos to `editions/<date>/img/` with descriptive names (`mr-dust.webp`, `ml-security.png`, ...).
2. Transcription: `tools/setup-asr.sh` once per container (Whisper small via npm; huggingface is blocked),
   then `python3 tools/transcribe.py <date>` → phrase timings + suggested `audioCut` / `audioEnd`.
   Prefer the script text the user sends for names and spelling; use the transcript only for timings.
   The outro comes after the report: `outroAt` = `audioEnd` + ~0.5, `tail` = 9.0 (outro music starts with it).
   No voice-over from the user → generate it from the script with ElevenLabs (voice "Rawi – Fusha narrator",
   eleven_v4) and keep the whole script (`audioCut: 0`).
3. Fill `editions/<date>/edition.js`. `editions/2026-10-25/edition.js` is the reference: one chapter per story,
   2 headlines per story (≤ 2 lines), each photo on the sentence it illustrates (a video goes in `clips/` and
   a card `{ clip: 'x.mp4', from: s, moves }` plays it muted; re-encode it 960 px wide without audio), camera/highlights/pins per story,
   date/number chips in `stats`. Avoid «» quotes in headlines (RTL word layout breaks them).
4. Check a few stills: `node tools/render.js --edition <date> --stills 40,100,150` (output/stills/, delete after).
5. Render: `node tools/render.js --edition <date>` (1080x1350) and, if asked, `--format youtube` (1920x1080).
   ~3–5 min each. YouTube files are git-ignored (> 100 MB).
6. Commit `editions/<date>/` + `output/erriwaya-brief-<date>.mp4`, push to the session branch, send the video(s).

## Fixed decisions

- White template, AL-Quds font, navy logo (assets/logo-white.png tinted, the calligraphic الرواية logo of 26 Oct)
  inside the safe area. The photo frame is larger than the map frame in both formats.
- Intro from Nouakchott with the city list in src/app.js (`INTRO_CITIES`); outro with ERRIWAYA (Facebook, TikTok,
  YouTube) and ERRIWAYA.MR (Instagram).
- Audio (tools/render.js): synthesized intro theme, quiet bed, whoosh in the pause before each chapter; the outro and
  its music start after the last word (final chord 4.5 s into the outro); all music ducks under the voice. Western Sahara is drawn as in the
  Natural Earth data (separate territory) unless the user decides otherwise.
