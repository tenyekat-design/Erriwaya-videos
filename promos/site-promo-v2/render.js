// Renders the v2 website promo frame by frame and mixes music.wav with the voice-over (the music ducks under the voice).
//   node promos/site-promo-v2/render.js                      feed 1080x1350 -> output/erriwaya-site-promo-v2.mp4
//   node promos/site-promo-v2/render.js --format story       1080x1920 (TikTok/Reels/Shorts)
//   node promos/site-promo-v2/render.js --format youtube     1920x1080
//   node promos/site-promo-v2/render.js --stills 2,9,30      PNG stills -> output/stills/
//   --url www.erriwaya.com                                   address shown at the end
// Run python3 promos/site-promo-v2/make-music.py first if music.wav is missing.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => {
  if (v.startsWith('--')) acc.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const FPS = 30, WORKERS = +(args.workers || 4);
const FORMAT = String(args.format || 'feed');
const SIZE = { feed: [1080, 1350], youtube: [1920, 1080], story: [1080, 1920] }[FORMAT];
const OUT = path.join(ROOT, 'output', `erriwaya-site-promo-v2${FORMAT === 'feed' ? '' : '-' + FORMAT}.mp4`);
const PAGE = 'file://' + path.join(__dirname, 'index.html') + (args.url ? '?url=' + encodeURIComponent(args.url) : '');

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: SIZE[0], height: SIZE[1] } });
  page.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
  await page.goto(PAGE);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  return page;
}
const grab = async (page, t, type = 'jpeg') => { await page.evaluate(t => window.renderFrame(t), t); return page.screenshot({ type, quality: type === 'jpeg' ? 92 : undefined }); };

function mixAudio(dur, voStart, file) {
  const d = Math.round(voStart * 1000);
  const f = [
    `[0]aresample=48000,aformat=channel_layouts=stereo,volume=0.62[m]`,
    `[1]aresample=48000,aformat=channel_layouts=stereo,adelay=${d}|${d},apad,atrim=0:${dur},asplit[v1][v2]`,
    `[m][v1]sidechaincompress=threshold=0.02:ratio=7:attack=25:release=380[duck]`,
    `[duck][v2]amix=inputs=2:normalize=0:weights=1 1.3,atrim=0:${dur},alimiter=limit=0.92[out]`,
  ].join(';');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(__dirname, 'music.wav'), '-i', path.join(__dirname, 'voiceover.mp3'),
    '-filter_complex', f, '-map', '[out]', '-ar', '48000', file]);
}

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  if (args.stills) {
    const page = await openPage(browser), dir = path.join(ROOT, 'output', 'stills');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of String(args.stills).split(',').map(Number)) {
      const f = path.join(dir, `v2-${FORMAT}-${t}.png`);
      fs.writeFileSync(f, await grab(page, t, 'png'));
      console.log(f);
    }
    return browser.close();
  }
  const page0 = await openPage(browser);
  const { dur, voStart } = await page0.evaluate(() => ({ dur: window.DURATION, voStart: window.VO_START }));
  await page0.close();
  const N = Math.round(dur * FPS), frames = new Array(N);
  let next = 0, done = 0;
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    const page = await openPage(browser);
    while (next < N) {
      const i = next++;
      frames[i] = await grab(page, i / FPS);
      if (++done % 150 === 0) console.log(`${done}/${N}`);
    }
    await page.close();
  }));
  await browser.close();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'promo2-')), wav = path.join(tmp, 'mix.wav');
  mixAudio(dur, voStart, wav);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-i', wav,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  for (const b of frames) if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r));
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', OUT);
})();
