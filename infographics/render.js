// Renders an infographic (infographics/<name>/index.html) frame by frame and mixes the Erriwaya music.
//   node infographics/render.js --name camels-maghreb                 feed 1080x1350 -> output/erriwaya-infographic-<name>.mp4
//   node infographics/render.js --name camels-maghreb --format story  1080x1920 -> output/erriwaya-infographic-<name>-story.mp4
//   node infographics/render.js --name camels-maghreb --stills 2,8,20 PNG stills -> output/stills/
//   --cover writes only the cover image
// Each full render also writes the cover (-cover.jpg) and embeds it in the video.
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

// music only (no voice-over): opening theme, the quiet bed a little louder, a whoosh at every wipe,
// and the closing music whose final chord lands as the logo settles
function buildAudio(duration, cuts, tOut, file) {
  const A = f => path.join(ROOT, 'assets', 'audio', f);
  const ms = s => Math.max(0, Math.round(s * 1000));
  const OUTRO_HIT = 8.0, LAND = tOut + 1.0;
  const bedFrom = 3.4, bedTo = tOut - 6.5;
  const inputs = ['-i', A('intro-music.wav'), '-stream_loop', '-1', '-i', A('bed.wav'), '-i', A('outro-music.wav'), '-i', A('whoosh.wav')];
  const f = [
    `[0:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.8,afade=t=out:st=5.5:d=3[m]`,
    `[1:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${bedTo - bedFrom + 2},volume=0.42,afade=t=in:st=0:d=2.5,afade=t=out:st=${bedTo - bedFrom - 0.5}:d=2.5,adelay=${ms(bedFrom)}|${ms(bedFrom)}[bed]`,
    `[2:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.7,adelay=${ms(LAND - OUTRO_HIT)}|${ms(LAND - OUTRO_HIT)}[out]`,
    `[3:a]aformat=sample_rates=48000:channel_layouts=stereo,highpass=f=250,volume=0.32,asplit=${cuts.length}${cuts.map((_, i) => `[w${i}]`).join('')}`,
    ...cuts.map((c, i) => `[w${i}]adelay=${ms(c - 0.55)}|${ms(c - 0.55)}[wd${i}]`),
    `[m][bed][out]${cuts.map((_, i) => `[wd${i}]`).join('')}amix=inputs=${3 + cuts.length}:normalize=0:duration=longest,apad,atrim=0:${duration},afade=t=out:st=${duration - 1.2}:d=1.2,alimiter=limit=0.95[mix]`,
  ].join(';');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', f, '-map', '[mix]', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', file]);
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
  const { duration, cuts, tOut } = await probe.evaluate(() => ({ duration: window.DURATION, cuts: window.CUTS, tOut: window.T_OUT }));
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
  buildAudio(duration, cuts, tOut, audio);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', audio, '-map', '0:v', '-map', '1:a', '-c', 'copy', '-movflags', '+faststart', '-shortest', OUT]);
  await cover(browser);
  await browser.close();
  embedCover();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', OUT);
})();
