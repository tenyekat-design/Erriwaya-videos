// Renders the long website promo (edited voice-over) (promos/site-launch-full/index.html) frame by frame and mixes the template's music.
//   node promos/site-launch-full/render.js                      feed 1080x1350 -> output/erriwaya-site-promo.mp4
//   node promos/site-launch-full/render.js --format story       1080x1920 (TikTok/Reels/Shorts)
//   node promos/site-launch-full/render.js --format youtube     1920x1080
//   node promos/site-launch-full/render.js --stills 1,6,11      PNG stills -> output/stills/
//   --url erriwaya.mr                                      address shown at the end
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => {
  if (v.startsWith('--')) acc.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const FPS = 30, WORKERS = +(args.workers || 4);
const FORMAT = String(args.format || 'feed');
const SIZE = { feed: [1080, 1350], youtube: [1920, 1080], story: [1080, 1920] }[FORMAT];
const OUT = path.join(ROOT, 'output', `erriwaya-site-promo${FORMAT === 'feed' ? '' : '-' + FORMAT}.mp4`);
const PAGE = 'file://' + path.join(__dirname, 'index.html') + (args.url ? '?url=' + encodeURIComponent(args.url) : '');

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: SIZE[0], height: SIZE[1] } });
  page.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
  await page.goto(PAGE);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  return page;
}
const grab = async (page, t, type = 'jpeg') => { await page.evaluate(t => window.renderFrame(t), t); return page.screenshot({ type, quality: type === 'jpeg' ? 92 : undefined }); };

// Music from assets/audio: intro theme, quiet bed, a whoosh on every cut, outro whose final chord lands at the end.
// voiceover.mp3 (if present) starts at voStart and the music ducks under it.
function mixAudio(dur, cuts, voStart, file) {
  const VO = path.join(__dirname, 'voiceover.mp3'), vo = voStart != null && fs.existsSync(VO);
  const A = f => path.join(ROOT, 'assets', 'audio', f);
  const outro = 12.5, os = dur - outro + 0.4;
  const inputs = ['-i', A('intro-music.wav'), '-stream_loop', '-1', '-i', A('bed.wav'), '-i', A('outro-music.wav'), ...cuts.flatMap(() => ['-i', A('whoosh.wav')]), ...(vo ? ['-i', VO] : [])];
  const nv = 3 + cuts.length, d = Math.round((voStart || 0) * 1000);
  const f = [
    `[0]atrim=0:11,afade=t=out:st=8.5:d=2.5,volume=0.9[a0]`,
    `[1]atrim=0:${dur},afade=t=in:st=4:d=5,afade=t=out:st=${os}:d=1.5,volume=0.55[a1]`,
    `[2]adelay=${Math.round(os * 1000)}|${Math.round(os * 1000)},volume=0.95[a2]`,
    ...cuts.map((c, i) => `[${3 + i}]adelay=${Math.max(0, Math.round((c - 0.45) * 1000))}|${Math.max(0, Math.round((c - 0.45) * 1000))},volume=0.6[w${i}]`),
    `[a0][a1][a2]${cuts.map((_, i) => `[w${i}]`).join('')}amix=inputs=${3 + cuts.length}:normalize=0,atrim=0:${dur}[mus]`,
    ...(vo ? [
      `[${nv}]aresample=48000,aformat=channel_layouts=stereo,adelay=${d}|${d},apad,atrim=0:${dur},asplit[v1][v2]`,
      `[mus]aresample=48000,aformat=channel_layouts=stereo[m]`,
      `[m][v1]sidechaincompress=threshold=0.02:ratio=6:attack=30:release=450[duck]`,
      `[duck][v2]amix=inputs=2:normalize=0:weights=0.8 1.25[mix]`,
    ] : ['[mus]anull[mix]']),
    `[mix]afade=t=out:st=${dur - 0.8}:d=0.8,alimiter=limit=0.9[out]`,
  ].join(';');
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', f, '-map', '[out]', '-ar', '48000', file]);
}

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  if (args.stills) {
    const page = await openPage(browser), dir = path.join(ROOT, 'output', 'stills');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of String(args.stills).split(',').map(Number)) {
      const f = path.join(dir, `promo-${FORMAT}-${t}.png`);
      fs.writeFileSync(f, await grab(page, t, 'png'));
      console.log(f);
    }
    return browser.close();
  }
  const page0 = await openPage(browser);
  const { dur, cuts, voStart } = await page0.evaluate(() => ({ dur: window.DURATION, cuts: window.SCENES.slice(1), voStart: (window.PROMO_TIMING || {}).voStart }));
  await page0.close();
  const N = Math.round(dur * FPS), tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'promo-'));
  const frames = new Array(N);
  let next = 0, done = 0;
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    const page = await openPage(browser);
    while (next < N) {
      const i = next++;
      frames[i] = await grab(page, i / FPS);
      if (++done % 90 === 0) console.log(`${done}/${N}`);
    }
    await page.close();
  }));
  await browser.close();
  const wav = path.join(tmp, 'mix.wav');
  mixAudio(dur, cuts, voStart, wav);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-i', wav,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  for (const b of frames) if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r));
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', OUT);
})();
