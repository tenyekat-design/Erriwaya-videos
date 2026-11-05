// Renders the infographic frame by frame with headless Chromium and encodes it with ffmpeg.
//   node infographics/2026-11-youth-unemployment/render.js                    feed 1080x1350
//   node infographics/2026-11-youth-unemployment/render.js --format story     story 1080x1920
//   node infographics/2026-11-youth-unemployment/render.js --stills 3,12,20   PNG stills -> output/stills/
// Output: output/erriwaya-infographic-youth-unemployment[-story].mp4 and its -cover.jpg (also embedded in the video).
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const ROOT = path.join(HERE, '..', '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => {
  if (v.startsWith('--')) acc.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const FPS = 30, WORKERS = +(args.workers || 4);
const FORMAT = String(args.format || 'feed');
const SIZE = { feed: [1080, 1350], story: [1080, 1920] }[FORMAT];
if (!SIZE) { console.error('unknown format ' + FORMAT); process.exit(1); }
const NAME = 'erriwaya-infographic-youth-unemployment' + (FORMAT === 'feed' ? '' : '-' + FORMAT);
const OUT = path.join(ROOT, 'output', NAME + '.mp4');
const COVER = path.join(ROOT, 'output', NAME + '-cover.jpg');
const PAGE = 'file://' + path.join(HERE, 'index.html') + '?format=' + FORMAT;
const COVER_T = 4.6;  // the title card, fully drawn

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: SIZE[0], height: SIZE[1] } });
  page.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
  await page.goto(PAGE);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  return page;
}
async function grab(page, t, type = 'image/jpeg', q = 0.95) {
  const url = await page.evaluate(([t, type, q]) => { window.renderFrame(t); return document.getElementById('c').toDataURL(type, q); }, [t, type, q]);
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
}

async function renderRange(browser, f0, f1, file) {
  const page = await openPage(browser);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', c => (c ? rej(new Error('ffmpeg ' + c)) : res())));
  for (let f = f0; f < f1; f++) {
    const buf = await grab(page, f / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 300 === 0) console.log(`  ${path.basename(file)} ${f - f0}/${f1 - f0}`);
  }
  ff.stdin.end();
  await done;
  await page.close();
}

// Music only (no voice-over): the template's intro theme, the quiet bed raised a little, a whoosh at every
// change of scene and the outro music whose final chord lands as the closing logo and handles appear.
function buildAudio(duration, starts, outro, file) {
  const A = p => path.join(ROOT, 'assets', 'audio', p);
  const ms = s => Math.max(0, Math.round(s * 1000));
  const OUTRO_HIT = 8.0, land = outro + 2.0, outStart = land - OUTRO_HIT;
  const hits = starts.slice(1);
  const f = [
    `[0:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.8,afade=t=out:st=8.5:d=2.5[m]`,
    `[1:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${duration},volume=0.42,afade=t=in:st=0:d=2,afade=t=out:st=${outStart - 4.6}:d=2.5,adelay=4600|4600[bed]`,
    `[2:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.7,adelay=${ms(outStart)}|${ms(outStart)}[out]`,
    `[3:a]aformat=sample_rates=48000:channel_layouts=stereo,highpass=f=300,volume=0.32,asplit=${hits.length}${hits.map((_, i) => `[w${i}]`).join('')}`,
    ...hits.map((h, i) => `[w${i}]adelay=${ms(h - 0.5)}|${ms(h - 0.5)}[wd${i}]`),
    `[m][bed][out]${hits.map((_, i) => `[wd${i}]`).join('')}amix=inputs=${3 + hits.length}:normalize=0:duration=longest,apad,atrim=0:${duration},afade=t=out:st=${duration - 0.8}:d=0.8,alimiter=limit=0.95[mix]`,
  ].join(';');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', A('intro-music.wav'), '-stream_loop', '-1', '-i', A('bed.wav'), '-i', A('outro-music.wav'), '-i', A('whoosh.wav'),
    '-filter_complex', f, '-map', '[mix]', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', file]);
}

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  fs.mkdirSync(path.join(ROOT, 'output'), { recursive: true });
  if (args.stills) {
    const dir = path.join(ROOT, 'output', 'stills');
    fs.mkdirSync(dir, { recursive: true });
    const page = await openPage(browser);
    for (const t of String(args.stills).split(',').map(Number)) {
      const f = path.join(dir, `${FORMAT}-t${String(t).padStart(5, '0')}.png`);
      fs.writeFileSync(f, await grab(page, t, 'image/png'));
      console.log(f);
    }
    return browser.close();
  }
  const probe = await openPage(browser);
  const { duration, starts, outro } = await probe.evaluate(() => ({ duration: window.DURATION, starts: window.SCENE_STARTS, outro: window.OUTRO }));
  fs.writeFileSync(COVER, await grab(probe, COVER_T, 'image/jpeg', 0.92));
  await probe.close();
  const F = Math.round(duration * FPS);
  const tmp = path.join(ROOT, 'frames', NAME);
  fs.mkdirSync(tmp, { recursive: true });
  console.log(`${NAME} (${SIZE.join('x')}): ${F} frames (${duration.toFixed(1)}s), ${WORKERS} workers`);
  const per = Math.ceil(F / WORKERS), parts = [];
  await Promise.all(Array.from({ length: WORKERS }, (_, w) => {
    const a = w * per, b = Math.min(F, a + per);
    if (a >= b) return null;
    parts[w] = path.join(tmp, `part${w}.mp4`);
    return renderRange(browser, a, b, parts[w]);
  }));
  await browser.close();
  fs.writeFileSync(path.join(tmp, 'list.txt'), parts.filter(Boolean).map(p => `file '${p}'`).join('\n'));
  const video = path.join(tmp, 'video.mp4'), audio = path.join(tmp, 'audio.m4a');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', video]);
  buildAudio(duration, starts, outro, audio);
  const av = path.join(tmp, 'av.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', audio, '-map', '0:v', '-map', '1:a', '-c', 'copy', '-shortest', av]);
  // the cover as the file's picture (no -shortest here: the picture stream is a single frame)
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', av, '-i', COVER, '-map', '0', '-map', '1', '-c', 'copy',
    '-disposition:v:1', 'attached_pic', '-movflags', '+faststart', OUT]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', OUT, 'and', COVER);
})();
