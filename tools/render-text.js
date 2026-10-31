// Renders a text video (no narration) from editions/<date>/text.js with src/text.html.
//   node tools/render-text.js --edition 2026-10-31                -> output/erriwaya-text-2026-10-31.mp4 (1080x1920)
//   add --format feed for the 1080x1350 Facebook/Instagram feed version -> output/erriwaya-text-<date>-feed.mp4
//   node tools/render-text.js --edition 2026-10-31 --stills 2,20  -> PNG stills in output/stills/
//   node tools/render-text.js --edition 2026-10-31 --cover        -> cover image and description only
// A full render also writes output/erriwaya-text-<date>[-feed]-cover.jpg and -description.txt.
// Audio: music synthesized for the video by tools/make-text-music.py, with each clip's own sound under it.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => {
  if (v.startsWith('--')) acc.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const FPS = 30, WORKERS = +(args.workers || 4), FORMAT = String(args.format || 'story');
const SIZE = { story: [1080, 1920], feed: [1080, 1350] }[FORMAT];
if (!SIZE) { console.error('unknown format ' + FORMAT); process.exit(1); }
const EDITION = String(args.edition || '');
const EDIR = path.join(ROOT, 'editions', EDITION);
if (!fs.existsSync(path.join(EDIR, 'text.js'))) { console.error('no text.js in ' + EDIR); process.exit(1); }
const OUT = path.join(ROOT, 'output', `erriwaya-text-${EDITION}${FORMAT === 'feed' ? '-feed' : ''}.mp4`);
const COVER = OUT.replace(/\.mp4$/, '-cover.jpg');
const FRAMES = path.join(ROOT, 'frames', EDITION + '-text-' + FORMAT);
const page = frames => 'file://' + path.join(ROOT, 'src', 'text.html') + '?edition=' + encodeURIComponent(EDITION) + '&format=' + FORMAT +
  (frames ? '&frames=' + encodeURIComponent('file://' + FRAMES) : '');

async function open(browser, frames = true) {
  const p = await browser.newPage({ viewport: { width: SIZE[0], height: SIZE[1] } });
  p.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
  await p.goto(page(frames));
  await p.waitForFunction(() => window.READY === true || window.ERROR, null, { timeout: 60000 });
  const err = await p.evaluate(() => window.ERROR);
  if (err) { console.error(err); process.exit(1); }
  return p;
}
async function grab(p, t, type = 'image/jpeg') {
  const url = await p.evaluate(async ([t, type]) => { await window.renderFrame(t); return document.getElementById('c').toDataURL(type, 0.93); }, [t, type]);
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
}

// each clip run as JPEG frames (long side 1920); the page crops them to the full frame or the band
function extractClips(plan) {
  plan.runs.forEach((r, i) => {
    if (!r.clip) return;
    const dir = path.join(FRAMES, 'run' + i);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(r.from), '-t', String(r.dur), '-i', path.join(EDIR, r.clip),
      '-vf', `fps=${FPS},scale='if(gt(iw,ih),1920,-2)':'if(gt(iw,ih),-2,1920)'`,
      '-q:v', '3', path.join(dir, '%05d.jpg')]);
  });
}

function buildAudio(plan, file) {
  const D = plan.duration;
  const ms = s => Math.max(0, Math.round(s * 1000));
  // the music is synthesized for this video's screens (drop on the title, impacts on the figures, final hit on the logo)
  const music = path.join(FRAMES, 'music.wav');
  fs.writeFileSync(path.join(FRAMES, 'plan.json'), JSON.stringify(plan));
  execFileSync('python3', [path.join(__dirname, 'make-text-music.py'), path.join(FRAMES, 'plan.json'), music], { stdio: 'inherit' });
  const inputs = ['-i', music];
  const f = [`[0:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.8[music]`];
  const mix = ['[music]'];
  plan.runs.forEach((r, i) => {
    if (!r.clip) return;
    const k = inputs.filter(x => x === '-i').length;
    inputs.push('-ss', String(r.from), '-t', String(r.dur - 0.5), '-i', path.join(EDIR, r.clip));
    f.push(`[${k}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.3,afade=t=in:st=0:d=0.5,afade=t=out:st=${Math.max(0, r.dur - 1.3)}:d=0.8,adelay=${ms(r.start)}|${ms(r.start)}[c${i}]`);
    mix.push(`[c${i}]`);
  });
  f.push(`${mix.join('')}amix=inputs=${mix.length}:normalize=0:duration=longest,apad,atrim=0:${D},alimiter=limit=0.95[mix]`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', f.join(';'), '-map', '[mix]', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', file]);
}

function description(screens) {
  const window = {};
  new Function('window', fs.readFileSync(path.join(EDIR, 'text.js'), 'utf8'))(window);
  const TV = window.TEXTVIDEO;
  const text = [
    TV.title,
    '',
    ...screens.map(s => s.text),
    '',
    'تابعونا على فيسبوك وتيك توك ويوتيوب: ERRIWAYA',
    'وعلى إنستغرام: ERRIWAYA.MR',
    'الموقع: www.erriwaya.com',
    '',
    ['الرواية', ...(TV.hashtags || [])].map(t => '#' + t.replace(/\s+/g, '_')).join(' '),
  ].join('\n') + '\n';
  const file = path.join(ROOT, 'output', `erriwaya-text-${EDITION}-description.txt`);
  fs.writeFileSync(file, text);
  console.log('wrote', file);
}

async function writeCover(browser) {
  const p = await open(browser);
  const url = await p.evaluate(async () => { await window.renderCover(); return document.getElementById('c').toDataURL('image/jpeg', 0.92); });
  fs.writeFileSync(COVER, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
  await p.close();
  console.log('wrote', COVER);
}

async function renderRange(browser, f0, f1, file) {
  const p = await open(browser);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', c => (c ? rej(new Error('ffmpeg ' + c)) : res())));
  for (let f = f0; f < f1; f++) {
    const buf = await grab(p, f / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 300 === 0) console.log(`  ${path.basename(file)} ${f - f0}/${f1 - f0}`);
  }
  ff.stdin.end();
  await done;
  await p.close();
}

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  fs.mkdirSync(path.join(ROOT, 'output'), { recursive: true });
  const probe = await open(browser, false);
  const plan = await probe.evaluate(() => window.PLAN);
  const screens = await probe.evaluate(() => window.SCREENS);
  await probe.close();
  extractClips(plan);
  if (args.stills) {
    const p = await open(browser);
    const dir = path.join(ROOT, 'output', 'stills');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of String(args.stills).split(',').map(Number)) {
      const f = path.join(dir, `text-t${String(t).padStart(6, '0')}.png`);
      fs.writeFileSync(f, await grab(p, t, 'image/png'));
      console.log(f);
    }
    return browser.close();
  }
  if (args.cover) { await writeCover(browser); await browser.close(); return description(screens); }
  const F = Math.round(plan.duration * FPS), per = Math.ceil(F / WORKERS), parts = [];
  console.log(`text video ${EDITION}: ${F} frames (${plan.duration.toFixed(2)}s), ${screens.length} screens`);
  await Promise.all(Array.from({ length: WORKERS }, (_, w) => {
    const a = w * per, b = Math.min(F, a + per);
    if (a >= b) return null;
    parts[w] = path.join(FRAMES, `part${w}.mp4`);
    return renderRange(browser, a, b, parts[w]);
  }));
  await writeCover(browser);
  await browser.close();
  fs.writeFileSync(path.join(FRAMES, 'list.txt'), parts.filter(Boolean).map(p => `file '${p}'`).join('\n'));
  const video = path.join(FRAMES, 'video.mp4'), audio = path.join(FRAMES, 'audio.m4a');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(FRAMES, 'list.txt'), '-c', 'copy', video]);
  buildAudio(plan, audio);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', audio, '-i', COVER, '-map', '0:v', '-map', '1:a', '-map', '2',
    '-c', 'copy', '-disposition:v:1', 'attached_pic', '-movflags', '+faststart', '-t', String(plan.duration), OUT]);
  description(screens);
  console.log('wrote', OUT);
})();
