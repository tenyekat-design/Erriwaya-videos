// Renders a graphic video (src/graphic.html, 1080x1920, no voice-over) to MP4 with music.
// add --format feed for the 1080x1350 Facebook/Instagram feed version (-feed.mp4)
//   node tools/render-graphic.js --graphic 2026-10-28-una-students              -> output/erriwaya-graphic-<graphic>.mp4 (+ -cover.jpg)
//   node tools/render-graphic.js --graphic 2026-10-28-una-students --stills 2,10   PNG stills -> output/stills/
// type: 'infographic' in graphic.js renders src/infographic.html instead (animated charts, 1080x1350;
// --format story for the 1080x1920 TikTok version, -story.mp4; --format youtube for 1920x1080, -youtube.mp4).
// Clip frames (fit inside 1080x1920, aspect kept) are extracted once to frames/graphic-<graphic>/<clip>/ (git-ignored).
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => {
  if (v.startsWith('--')) acc.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const FPS = 30, WORKERS = +(args.workers || 4);
const NAME = String(args.graphic || '');
const RDIR = path.join(ROOT, 'graphics', NAME);
if (!NAME || !fs.existsSync(path.join(RDIR, 'graphic.js'))) { console.error('no graphic at ' + RDIR); process.exit(1); }
function loadGraphic() {
  const window = {};
  new Function('window', fs.readFileSync(path.join(RDIR, 'graphic.js'), 'utf8'))(window);
  return window.GRAPHIC;
}
const INFO = loadGraphic().type === 'infographic';
const STORY = INFO && args.format === 'story';  // infographics are 1080x1350 unless --format story / youtube
const YT = INFO && args.format === 'youtube';
const FEED = (args.format === 'feed' || INFO) && !STORY && !YT, HT = YT ? 1080 : FEED ? 1350 : 1920, WD = YT ? 1920 : 1080;
const SFX = STORY ? '-story' : YT ? '-youtube' : '';
const PREFIX = INFO ? 'erriwaya-infographic-' : 'erriwaya-graphic-';
const OUT = path.join(ROOT, 'output', `${PREFIX}${NAME}${FEED && !INFO ? '-feed' : ''}${SFX}.mp4`);
const PAGE = 'file://' + path.join(ROOT, 'src', INFO ? 'infographic.html' : 'graphic.html') + '?graphic=' + encodeURIComponent(NAME) + (FEED ? '&format=feed' : '') + (STORY || YT ? '&format=' + args.format : '');
const FRAMES = path.join(ROOT, 'frames', 'graphic-' + NAME);

function extractClips() {
  if (!fs.existsSync(path.join(RDIR, 'clips'))) return;
  for (const f of fs.readdirSync(path.join(RDIR, 'clips'))) {
    const dir = path.join(FRAMES, f.replace(/\.\w+$/, ''));
    if (fs.existsSync(path.join(dir, 'f00001.jpg'))) continue;
    fs.mkdirSync(dir, { recursive: true });
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(RDIR, 'clips', f), '-vf',
      `fps=${FPS},scale=1080:1920:force_original_aspect_ratio=decrease:flags=lanczos`, '-q:v', '3', path.join(dir, 'f%05d.jpg')]);
    console.log('frames for', f);
  }
}

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: WD, height: HT } });
  page.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
  await page.goto(PAGE);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  return page;
}
async function grab(page, t, type = 'jpeg') {
  await page.evaluate(t => window.renderFrame(t), t);
  return page.screenshot({ type, ...(type === 'jpeg' ? { quality: 92 } : {}), clip: { x: 0, y: 0, width: WD, height: HT } });
}

async function renderRange(browser, f0, f1, file) {
  const page = await openPage(browser);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r));
  for (let f = f0; f < f1; f++) {
    const buf = await grab(page, f / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 150 === 0) console.log(`  ${path.basename(file)} ${f - f0}/${f1 - f0}`);
  }
  ff.stdin.end();
  await done;
  await page.close();
}

// music (tools/make-graphic-music.py) + the clips' own sound, low, while their footage is on screen + whooshes
function buildAudio(R, file) {
  const music = path.join(FRAMES, 'music.wav');
  execFileSync('python3', [path.join(ROOT, 'tools', R.music === 'light' ? 'make-infographic-music.py' : 'make-graphic-music.py'), music, String(R.duration), String(R.outroHit), ...R.calm.map(String), ...R.hits.map(String)], { stdio: 'inherit' });
  const ms = s => Math.max(0, Math.round(s * 1000));
  // natural: false mutes the clips (e.g. footage with someone else's narration or music)
  const shots = R.natural === false || !R.shots ? [] : R.shots.map((s, i) => ({ ...s, end: R.shots[i + 1] ? R.shots[i + 1].t : R.duration })).filter(s => s.clip);
  const clips = [...new Set(shots.map(s => s.clip))];
  const inputs = ['-i', music, '-i', path.join(ROOT, 'assets', 'audio', 'whoosh.wav'), ...clips.flatMap(c => ['-i', path.join(RDIR, 'clips', fs.readdirSync(path.join(RDIR, 'clips')).find(f => f.startsWith(c + '.')))])];
  const f = [`[0:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.8[m]`];
  const nat = shots.map((s, i) => {
    const ci = 2 + clips.indexOf(s.clip), d = s.end - s.t;
    f.push(`[${ci}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=${s.from}:${s.from + d},asetpts=PTS-STARTPTS,highpass=f=120,volume=0.32,afade=t=in:d=0.15,afade=t=out:st=${d - 0.2}:d=0.2,adelay=${ms(s.t)}|${ms(s.t)}[n${i}]`);
    return `[n${i}]`;
  });
  const hits = [...R.hits, R.outroHit];
  f.push(`[1:a]aformat=sample_rates=48000:channel_layouts=stereo,highpass=f=300,volume=0.3,asplit=${hits.length}${hits.map((_, i) => `[w${i}]`).join('')}`);
  hits.forEach((h, i) => f.push(`[w${i}]adelay=${ms(h - 0.55)}|${ms(h - 0.55)}[wd${i}]`));
  f.push(`[m]${nat.join('')}${hits.map((_, i) => `[wd${i}]`).join('')}amix=inputs=${1 + nat.length + hits.length}:normalize=0:duration=first,atrim=0:${R.duration},alimiter=limit=0.95[mix]`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', f.join(';'), '-map', '[mix]', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', file]);
}

(async () => {
  extractClips();
  const R = loadGraphic();
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  if (args.stills) {
    const page = await openPage(browser);
    const dir = path.join(ROOT, 'output', 'stills');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of String(args.stills).split(',').map(Number)) {
      const f = path.join(dir, `graphic-t${String(t).padStart(6, '0')}.png`);
      fs.writeFileSync(f, await grab(page, t, 'png'));
      console.log(f);
    }
    return browser.close();
  }
  const F = Math.round(R.duration * FPS), per = Math.ceil(F / WORKERS), parts = [];
  console.log(`graphic ${NAME}: rendering ${F} frames with ${WORKERS} workers`);
  await Promise.all(Array.from({ length: WORKERS }, (_, w) => {
    const a = w * per, b = Math.min(F, a + per);
    if (a >= b) return null;
    parts[w] = path.join(FRAMES, `part${w}${FEED ? '-feed' : ''}${SFX}.mp4`);
    return renderRange(browser, a, b, parts[w]);
  }));
  // cover: the hook once its line has settled
  const page = await openPage(browser);
  const cover = OUT.replace(/\.mp4$/, '-cover.jpg');
  fs.writeFileSync(cover, await grab(page, +(args.coverAt || R.coverAt || 2.0)));
  await browser.close();
  fs.writeFileSync(path.join(FRAMES, 'list.txt'), parts.filter(Boolean).map(p => `file '${p}'`).join('\n'));
  const video = path.join(FRAMES, FEED ? 'video-feed.mp4' : SFX ? `video${SFX}.mp4` : 'video.mp4'), audio = path.join(FRAMES, 'audio.m4a');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(FRAMES, 'list.txt'), '-c', 'copy', video]);
  buildAudio(R, audio);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', audio, '-map', '0:v', '-map', '1:a', '-c', 'copy', '-movflags', '+faststart', '-shortest', OUT]);
  console.log('wrote', OUT, 'and', cover);
})();
