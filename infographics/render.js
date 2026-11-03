// Renders an infographic (infographics/<name>/index.html) frame by frame and mixes the Erriwaya music.
//   node infographics/render.js --name camels-maghreb                 feed 1080x1350 -> output/erriwaya-infographic-<name>.mp4
//   node infographics/render.js --name camels-maghreb --format story  1080x1920 -> output/erriwaya-infographic-<name>-story.mp4
//   node infographics/render.js --name camels-maghreb --stills 2,8,20 PNG stills -> output/stills/
//   --cover writes only the cover image
// Each full render also writes the cover (-cover.jpg) and embeds it in the video.
// Soundtrack: <name>/score.wav (python3 infographics/<name>/score.py).
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => {
  if (v.startsWith('--')) acc.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const NAME = String(args.name || 'camels-maghreb');
const FORMAT = args.format === 'story' ? 'story' : 'feed';
const SIZE = FORMAT === 'story' ? [1080, 1920] : [1080, 1350];
const FPS = +(args.fps || 30), WORKERS = +(args.workers || 4);
const SUFFIX = FORMAT === 'feed' ? '' : '-story';
const OUT = path.join(ROOT, 'output', `erriwaya-infographic-${NAME}${SUFFIX}.mp4`);
const COVER = OUT.replace(/\.mp4$/, '-cover.jpg');
const PAGE = 'file://' + path.join(__dirname, NAME, 'index.html') + '?format=' + FORMAT;

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: SIZE[0], height: SIZE[1] } });
  page.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
  await page.goto(PAGE);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  return page;
}
async function grab(page, t, type = 'image/jpeg') {
  const url = await page.evaluate(([t, type]) => { window.renderFrame(t); return document.getElementById('c').toDataURL(type, 0.95); }, [t, type]);
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
}
async function cover(browser) {
  const page = await openPage(browser);
  const url = await page.evaluate(() => { window.renderCover(); return document.getElementById('c').toDataURL('image/jpeg', 0.92); });
  fs.writeFileSync(COVER, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
  await page.close();
  console.log('wrote', COVER);
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

// the soundtrack is <name>/score.wav (music and sound design composed to the same timeline as the
// picture, see <name>/score.py); it is rebuilt when missing or older than the timeline
function buildAudio(duration, file) {
  const dir = path.join(__dirname, NAME), score = path.join(dir, 'score.wav');
  const newer = f => fs.existsSync(f) && fs.statSync(f).mtimeMs > fs.statSync(score).mtimeMs;
  if (!fs.existsSync(score) || newer(path.join(dir, 'timeline.js')) || newer(path.join(dir, 'score.py'))) {
    execFileSync('python3', [path.join(dir, 'score.py')], { stdio: 'inherit' });
  }
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', score, '-af', `atrim=0:${duration}`, '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', file]);
}

function embedCover() {
  const tmp = OUT.replace(/\.mp4$/, '.cover-tmp.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', OUT, '-i', COVER, '-map', '0', '-map', '1', '-c', 'copy',
    '-disposition:v:1', 'attached_pic', '-movflags', '+faststart', tmp]);
  fs.renameSync(tmp, OUT);
}

(async () => {
  fs.mkdirSync(path.join(ROOT, 'output'), { recursive: true });
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  if (args.stills) {
    const dir = path.join(ROOT, 'output', 'stills');
    fs.mkdirSync(dir, { recursive: true });
    const page = await openPage(browser);
    for (const t of String(args.stills).split(',').map(Number)) {
      const f = path.join(dir, `${NAME}${SUFFIX}-t${t}.png`);
      fs.writeFileSync(f, await grab(page, t, 'image/png'));
      console.log(f);
    }
    return browser.close();
  }
  if (args.cover) { await cover(browser); return browser.close(); }
  const probe = await openPage(browser);
  const duration = await probe.evaluate(() => window.DURATION);
  await probe.close();
  const N = Math.round(duration * FPS);
  const tmp = path.join(ROOT, 'frames', 'infographic-' + NAME + SUFFIX);
  fs.mkdirSync(tmp, { recursive: true });
  const per = Math.ceil(N / WORKERS), parts = [];
  console.log(`${NAME} (${FORMAT} ${SIZE.join('x')}): ${N} frames (${duration.toFixed(2)}s), ${WORKERS} workers`);
  await Promise.all(Array.from({ length: WORKERS }, (_, w) => {
    const a = w * per, b = Math.min(N, a + per);
    if (a >= b) return null;
    parts[w] = path.join(tmp, `part${w}.mp4`);
    return renderRange(browser, a, b, parts[w]);
  }));
  fs.writeFileSync(path.join(tmp, 'list.txt'), parts.filter(Boolean).map(p => `file '${p}'`).join('\n'));
  const video = path.join(tmp, 'video.mp4'), audio = path.join(tmp, 'audio.m4a');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', video]);
  buildAudio(duration, audio);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', audio, '-map', '0:v', '-map', '1:a', '-c', 'copy', '-movflags', '+faststart', '-shortest', OUT]);
  await cover(browser);
  await browser.close();
  embedCover();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', OUT);
})();
