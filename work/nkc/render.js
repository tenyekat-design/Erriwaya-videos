// Renders work/nkc/index.html frame by frame and mixes music (no voice-over).
//   node work/nkc/render.js [--stills 2,30] [--out file.mp4]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => {
  if (v.startsWith('--')) acc.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const FPS = 30, W = 1080, H = 1350, WORKERS = 4;
const OUT = path.resolve(ROOT, args.out || 'output/erriwaya-nouakchott-infographic.mp4');
const PAGE = 'file://' + path.join(__dirname, 'index.html');

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
  await page.goto(PAGE);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  return page;
}
async function grab(page, t, type = 'image/jpeg') {
  const url = await page.evaluate(([t, type]) => { window.renderFrame(t); return document.getElementById('c').toDataURL(type, 0.95); }, [t, type]);
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
}

function buildAudio(duration, transitions, outro, file) {
  const A = p => path.join(ROOT, 'assets', 'audio', p);
  const ms = s => Math.max(0, Math.round(s * 1000));
  const OUTRO_HIT = 8.0, LAND = outro + 2.1;
  const f = [
    `[0:a]aformat=sample_rates=48000:channel_layouts=stereo,volume='if(lt(t,7),0.8,0.8*max(0.15,1-(t-7)*0.35))':eval=frame[m]`,
    `[1:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${duration},volume=0.5,afade=t=in:st=0:d=3,afade=t=out:st=${LAND - OUTRO_HIT - 6.5}:d=2.5,adelay=6000|6000[bed]`,
    `[2:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.7,adelay=${ms(LAND - OUTRO_HIT)}|${ms(LAND - OUTRO_HIT)}[out]`,
    `[3:a]aformat=sample_rates=48000:channel_layouts=stereo,highpass=f=300,volume=0.3,asplit=${transitions.length}${transitions.map((_, i) => `[w${i}]`).join('')}`,
    ...transitions.map((h, i) => `[w${i}]adelay=${ms(h - 0.3)}|${ms(h - 0.3)}[wd${i}]`),
    `[m][bed][out]${transitions.map((_, i) => `[wd${i}]`).join('')}amix=inputs=${3 + transitions.length}:normalize=0:duration=longest,apad,atrim=0:${duration},afade=t=out:st=${duration - 1.2}:d=1.2,loudnorm=I=-10.5:TP=-1:LRA=11[mix]`,
  ].join(';');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', A('intro-music.wav'), '-stream_loop', '-1', '-i', A('bed.wav'), '-i', A('outro-music.wav'), '-i', A('whoosh.wav'),
    '-filter_complex', f, '-map', '[mix]', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', file]);
}

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  if (args.stills) {
    const page = await openPage(browser);
    const dir = path.join(__dirname, 'stills'); fs.mkdirSync(dir, { recursive: true });
    for (const t of String(args.stills).split(',').map(Number)) {
      const f = path.join(dir, `t${String(t).padStart(5, '0')}.jpg`);
      fs.writeFileSync(f, await grab(page, t)); console.log(f);
    }
    return browser.close();
  }
  const probe = await openPage(browser);
  const { duration, transitions, outro } = await probe.evaluate(() => ({ duration: window.DURATION, transitions: window.TRANSITIONS, outro: window.OUTRO }));
  if (args.cover) {
    fs.writeFileSync(OUT.replace(/\.mp4$/, '-cover.jpg'), await grab(probe, +args.cover));
    return browser.close();
  }
  await probe.close();
  const N = Math.round(duration * FPS);
  const tmp = path.join(ROOT, 'frames', 'nkc'); fs.mkdirSync(tmp, { recursive: true });
  let done = 0;
  await Promise.all([...Array(WORKERS).keys()].map(async w => {
    const page = await openPage(browser);
    for (let i = w; i < N; i += WORKERS) {
      fs.writeFileSync(path.join(tmp, `f${String(i).padStart(5, '0')}.jpg`), await grab(page, i / FPS));
      if (++done % 300 === 0) console.log(done, '/', N);
    }
    await page.close();
  }));
  await browser.close();
  const audio = path.join(tmp, 'audio.m4a');
  buildAudio(duration, transitions, outro, audio);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(tmp, 'f%05d.jpg'), '-i', audio,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'copy', '-shortest', '-movflags', '+faststart', OUT], { stdio: 'inherit' });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', OUT);
})();
