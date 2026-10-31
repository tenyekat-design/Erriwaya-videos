# Erriwaya news brief (الموجز الإخباري – الرواية)

## Keywords (the user starts a request with one of these; apply that approved template without asking)

| keyword | template | output |
|---|---|---|
| `موجز` | news brief with voice-over, broadcast look (approved 29 Oct 2026) | 1080x1350 feed (`node tools/render.js`) |
| `موجز يوتيوب` / `موجز ستوري` | same, other format | `--format youtube` (1920x1080) / `--format story` (1080x1920) |
| `موجز كلاسيكي` | news brief, white layout approved 28 Oct 2026 | `--look classic` |
| `نصي` | text video without narration (approved 31 Oct 2026, below), Facebook version | 1080x1350 (`node tools/render-text.js --format feed`) |
| `نصي طولي` | same text video for TikTok / Reels / Shorts | 1080x1920 (`node tools/render-text.js`) |
| `نصي كامل` | text video in both formats | feed + story |

A request without a keyword: voice-over sent → `موجز`; text + photos/clips without voice-over → `نصي`.

This repo is the approved video template. A new edition = a voice-over + photos (+ the script text) from the user.
Do not change the template (src/, assets/, tools/) unless the user asks; only add `editions/<date>/`.

## Producing an edition (keep it lean: few stills, one full render per format)

1. `node tools/new-edition.js YYYY-MM-DD "اليوم DD الشهر YYYY"`; copy the voice-over to `editions/<date>/voiceover.mp3`
   and the photos to `editions/<date>/img/` with descriptive names (`mr-dust.webp`, `ml-security.png`, ...).
2. Transcription: `tools/setup-asr.sh` once per container (Whisper small via npm; huggingface is blocked),
   then `python3 tools/transcribe.py <date>` → phrase timings + suggested `audioCut` / `audioEnd`.
   Prefer the script text the user sends for names and spelling; use the transcript only for timings.
   `outroAt` = start of the closing sentence that follows "إلى هنا نصل إلى ختام..." (~6–7 s before the end); kept for
   reference: the closing logo now starts after the voice-over ends (`audioEnd`).
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
   Each render also writes `output/erriwaya-brief-<date>[-format]-cover.jpg` (thumbnail in the broadcast look: the
   hook's photo full-frame, its tag and line on the white bar, all countries in the strip below; `cover: { imgs: [...] }`
   in edition.js overrides the photo; it is also embedded in that video file as its picture) and
   `output/erriwaya-brief-<date>-description.txt` (stories, YouTube chapter timestamps, handles, hashtags)
   and `output/erriwaya-brief-<date>.srt` (subtitles for YouTube/Facebook, from subtitles.txt).
   `--cover` writes only these, in seconds.
6. Commit `editions/<date>/` + `output/erriwaya-brief-<date>.mp4` + covers + description + .srt, push to the session
   branch, send the video(s), cover(s), description and .srt.

## Fixed decisions

- AL-Quds font, logo assets/logo-mark.png (white mask from the official artwork), inside the safe area.
- Approved 29 Oct 2026 (current reference, all formats, the default): the "broadcast" look. Full-frame photo; logo
  at the top (white, soft shadow, no shade, no story counter); lower third = one two-colour story tag (green country, white topic, square
  corners, slanted left edge) on a white headline bar (navy text, no tatweel, no halo) that carries «الموجز الإخباري»
  and the date at its left end, then a navy strip with the spoken words (from subtitles.txt, the spoken word in
  green); a navy ticker titled «الأخبار» crawling all the stories at a steady pace; small inset map in the top corner
  (YouTube: bottom-left, level with the headline bar); no date/number chips.
  Text has no motion: headlines cross-fade; the bar slides out and back in between stories while a navy square with
  the story number, country and topic slides in from the right and leaves to the left. The opening hook uses the
  same tag. Three formats (feed, youtube, story) with a cover each; description, chapters and .srt with every
  edition. Re-render 2026-10-25 to compare when changing the look. `--look classic` renders the white layout
  approved on 28 Oct; the other `--look` values in src/app.js were trials (feed only).
- Intro from Nouakchott with the city list in src/app.js (`INTRO_CITIES`); outro with ERRIWAYA (Facebook, TikTok,
  YouTube) and ERRIWAYA.MR (Instagram).
- Audio (tools/render.js): synthesized intro theme, quiet bed, whoosh in the pause before each chapter, outro music
  whose final chord lands as the closing logo and social icons appear; all music ducks under the voice. Western Sahara is drawn as in the
  Natural Earth data (separate territory) unless the user decides otherwise.

## Text video (no narration)

When the user sends text + photos/clips without a voice-over: `editions/<date>/text.js` (window.TEXTVIDEO), rendered by
`node tools/render-text.js --edition <date>` (`--stills 2,30` to check) with src/text.html + src/text.js, 1080x1920.
Approved 31 Oct 2026 from the user's model video (~60 s; reference: editions/2026-10-31, the Facebook version
`output/erriwaya-text-2026-10-31-feed.mp4` is the approved default): hook (full-frame clip, navy boxes, words appear one by one)
→ title (green country pill + white topic pill, big centred headline) → lower thirds (16:9 band on a blurred copy,
green rule, navy label line then white lines against a green bar) with a `stat` card (big figure + navy caption), a
`quote` card (white card, green label, quote mark, source) → closing `question` → navy outro (logo, تابعوا الرواية,
ERRIWAYA / ERRIWAYA.MR, www.erriwaya.com, `sources` line only when the user gives them). Motion approved 31 Oct: punch-in + light flash on cuts, boxes slide in with overshoot, words rise in, green figures count up, progress line at the bottom. Music (tools/make-text-music.py, needs scipy): energetic 128 BPM track synthesized per video: build under the hook, drop on the title, impact on each figure, lighter under the quote, breakdown on the question, final hit on the logo; only a few soft swishes on layout changes (no repeated whoosh). `{word}` = green word; `tag` top-right
(«مشاهد متداولة» on circulated footage). `clipAudio: false` in text.js (or `--music-only`) drops the clips' own sound — use it for YouTube (it blocked the 31 Oct video with the crowd sound); `--remux` rebuilds only the sound. Keep it to ~60 s: one idea per screen, 2–3 short lines.
Output: `output/erriwaya-text-<date>.mp4` + `-cover.jpg` + `-description.txt`; `--format feed` = the Facebook version
(1080x1350, same screens re-laid out) → `output/erriwaya-text-<date>-feed.mp4` + `-feed-cover.jpg`.
