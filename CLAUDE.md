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
   2 headlines per story (≤ 2 lines), each photo on the sentence it illustrates, camera/highlights/pins per story,
   date/number chips in `stats`. Avoid «» quotes in headlines (RTL word layout breaks them).
   A card can also be a clip (`{ video: 'x.mp4', from: 2, moves }`, file in img/, frames extracted by render.js);
   `editions/2026-10-27` is the example with clips. The user does NOT want map graphics in the media card (a map
   above and a map below): every card must be a photo or a clip. If a story has none, ask the user for one
   (`graphic` cards exist in src/app.js but are only a last resort). The map card switches to finer 0.2/0.1 grids
   (Natural Earth 10m) when zoomed in.
4. Check a few stills: `node tools/render.js --edition <date> --stills 40,100,150` (output/stills/, delete after).
5. Render: `node tools/render.js --edition <date>` (1080x1350) and, if asked, `--format youtube` (1920x1080).
   ~3–5 min each. YouTube files are git-ignored (> 100 MB). If the feed file is > 100 MB, re-encode the video stream
   (`ffmpeg -i in.mp4 -c:v libx264 -preset slow -crf 22 -c:a copy -movflags +faststart out.mp4`).
6. Commit `editions/<date>/` + `output/erriwaya-brief-<date>.mp4`, push to the session branch, send the video(s).

## Fixed decisions

- White template, AL-Quds font, the official Erriwaya logo (assets/logo-white.png, extracted from the official
  white-on-teal artwork) tinted navy `#0B1F4B` (the template's colour) inside the safe area.
- Intro from Nouakchott with the city list in src/app.js (`INTRO_CITIES`); outro with ERRIWAYA (Facebook, TikTok,
  YouTube) and ERRIWAYA.MR (Instagram).
- Audio (tools/render.js): synthesized intro theme, quiet bed, whoosh in the pause before each chapter, outro music
  whose final chord lands on the last word; all music ducks under the voice. Western Sahara is drawn as in the
  Natural Earth data (separate territory) unless the user decides otherwise.

## User preferences (from the 27 Oct 2026 session)

- Professional montage: photos and clips only in the media card, each on the sentence it illustrates, with
  re-framing moves; the teaser and the wrap-up mix clips and photos from all stories.
- Clips the user sends are often phone screen recordings (Facebook, YouTube, Chrome): crop out app/TV overlays
  (mute icon, channel logos, "بث مباشر", subtitles, sign-language inset, letterbox) and trim with ffmpeg into
  `editions/<date>/img/*.mp4` (`-an -c:v libx264 -crf 20 -r 30`). One recording can hold two stories
  (27 Oct: Tunisian parliament, then the Senegalese National Assembly); check it with scene detection.
- Map accuracy matters: zoomed-in cameras for small countries (Gambia, Senegal), Morocco highlighted without
  Western Sahara.
- Header: the title and date are sized to the logo's ink height and centred on the same axis, with a divider.
- Ask before naming a person in a photo the user did not identify (27 Oct: the man in the blue suit, used in the
  Gambia story without a name, and the interview photo in the Libya story).
- The container's network blocks news/media sites: photos and clips come from the user.
- When asked for a YouTube version, render `--format youtube` after the feed version and send it (not committed).
