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
   date/number chips in `stats` (`pos: 'right'` when a pin sits in the map's top-left). Each headline gets a
   `topic` (سياسة / اقتصاد / أمن / دبلوماسية / مناخ / مجتمع); the opening teaser cards get the `kicker` of their
   story; a card gets `credit` when the user gives the photo's source (never guess one).
   `hook` = the opening 2.6 s: pick the strongest story, its best photo and one short factual line (≤ 2 lines,
   no exaggeration); the map intro then plays faster so the logo, music and voice keep their times.
   Avoid «» quotes in headlines (RTL word layout breaks them).
   Copy transcript.txt to `subtitles.txt` and correct names/spelling from the script (timings unchanged).
4. Check a few stills: `node tools/render.js --edition <date> --stills 40,100,150` (output/stills/, delete after).
5. Render: `node tools/render.js --edition <date>` (1080x1350) and, if asked, `--format youtube` (1920x1080)
   or `--format story` (1080x1920, TikTok/Reels/Shorts). ~3–5 min each. YouTube and story videos are git-ignored (> 100 MB).
   Each render also writes `output/erriwaya-brief-<date>[-format]-cover.jpg` (thumbnail: first three stories'
   photos + all countries; `cover: { imgs: [...] }` in edition.js overrides the photos) and
   `output/erriwaya-brief-<date>-description.txt` (stories, YouTube chapter timestamps, handles, hashtags)
   and `output/erriwaya-brief-<date>.srt` (subtitles for YouTube/Facebook, from subtitles.txt).
   `--cover` writes only these, in seconds.
6. Commit `editions/<date>/` + `output/erriwaya-brief-<date>.mp4` + covers + description + .srt, push to the session
   branch, send the video(s), cover(s), description and .srt.

## Fixed decisions

- White template, AL-Quds font, logo assets/logo-mark.png (white mask from the official artwork) tinted navy, inside the safe area.
- Approved 28 Oct 2026 (current reference): header title and date set apart from the logo by a clear gap; story label
  = green country chip + coloured topic; teaser labels per country; opening hook (top story full-frame) before a faster map intro; three formats (feed, youtube, story) with a cover
  each; description, chapters and .srt with every edition. Re-render 2026-10-25 to compare when changing the look.
- Intro from Nouakchott with the city list in src/app.js (`INTRO_CITIES`); outro with ERRIWAYA (Facebook, TikTok,
  YouTube) and ERRIWAYA.MR (Instagram).
- Audio (tools/render.js): synthesized intro theme, quiet bed, whoosh in the pause before each chapter, outro music
  whose final chord lands on the last word; all music ducks under the voice. Western Sahara is drawn as in the
  Natural Earth data (separate territory) unless the user decides otherwise.

## Graphic video (جرافيك) – a separate template, not the news brief

The repo holds two templates: the news brief above (voice-over, map, several stories) and the graphic video:
one topic, no voice-over, full-bleed photos/footage with stacked captions, in the Erriwaya look.
Use it when the user sends photos/clips without a voice-over and asks for a graphic on one topic.
Files: `src/graphic.html`, `tools/render-graphic.js`, `tools/make-graphic-music.py`, content in `graphics/<date>-<slug>/`.
Reference (approved 28 Oct 2026): `graphics/2026-10-28-una-students/graphic.js` (Nouakchott University student protests).

1. Research the topic (web search, several sources, prefer AFP/agency facts; no exaggeration; give the other
   side's account in a card). Photos in `graphics/<date>-<slug>/img/`, clips in `clips/`, descriptive names.
2. Fill `graphic.js`: `shots` (img with `fit: 'cover'` for portrait / `'framed'` for landscape, or `clip` + `from`;
   `source: 'مشاهد متداولة'` on footage of unknown origin), `kinetic` (big centred text: first the `hook: true`
   line over the strongest photo for ~2.6 s, then the title with `chips: true`, a number card, a closing question),
   `captions` (2–3 lines, first line is the navy lead), `cards` (the other side's account), `sources`, `calm`
   (no drums under the card), `hits` (whoosh/boom on the big cuts), `outroHit`. ~55–60 s.
3. Stills: `node tools/render-graphic.js --graphic <folder> --stills 2,9,17` (output/stills/, delete after).
4. Render: `node tools/render-graphic.js --graphic <folder>` (1080x1920, TikTok/Reels/Shorts) and
   `--format feed` (1080x1350, Facebook). ~2.5 min each; each writes a cover (the hook frame).
   Write `output/erriwaya-graphic-<folder>-description.txt` (summary, sources, handles, hashtags).
5. Commit the graphic folder + outputs, push, send video(s), cover(s), description.

Fixed look: logo top-left; lead caption line and chips navy (no green lead); chips, tags and cards rectangular
(no rounded pills); green only as accent (side bar, accent words, frame line); AL-Quds font; outro with
ERRIWAYA handles and the sources line; synthesized music + the clips' own sound, low.
