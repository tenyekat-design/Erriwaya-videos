// Renders src/index.html frame by frame with headless Chromium and encodes it with ffmpeg.
//   node tools/render.js                      full video -> output/erriwaya-brief.mp4
//   node tools/render.js --stills 3,30,95     PNG stills -> output/stills/
//   node tools/render.js --from 0 --to 10     partial render (no audio mix)
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => {
  if (v.startsWith('--')) acc.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const FPS = +(args.fps || 30);
const WORKERS = +(args.workers || 4);
const OUT = path.resolve(ROOT, args.out || 'output/erriwaya-brief.mp4');
const PAGE = 'file://' + path.join(ROOT, 'src', 'index.html');

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  page.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
  await page.goto(PAGE);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  return page;
}

async function grab(page, t, type = 'image/jpeg') {
  const url = await page.evaluate(([t, type]) => { window.renderFrame(t); return document.getElementById('c').toDataURL(type, 0.95); }, [t, type]);
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
}

async function stills(list) {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await openPage(browser);
  const dir = path.join(ROOT, 'output', 'stills');
  fs.mkdirSync(dir, { recursive: true });
  for (const t of list) {
    const f = path.join(dir, `t${String(t).padStart(6, '0')}.png`);
    fs.writeFileSync(f, await grab(page, t, 'image/png'));
    console.log(f);
  }
  await browser.close();
}

async function renderRange(browser, f0, f1, file) {
  const page = await openPage(browser);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', c => (c ? rej(new Error('ffmpeg ' + c)) : res())));
  for (let f = f0; f < f1; f++) {
    const buf = await grab(page, f / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 150 === 0) console.log(`  ${path.basename(file)} ${f - f0}/${f1 - f0}`);
  }
  ff.stdin.end();
  await done;
  await page.close();
}

function buildAudio(duration, file) {
  const voice = path.join(ROOT, 'assets', 'audio', 'voiceover.mp3');
  const tl = fs.readFileSync(path.join(ROOT, 'src', 'timeline.js'), 'utf8');
  const cut = parseFloat(tl.match(/audioCut:\s*([\d.]+)/)[1]);
  const intro = parseFloat(tl.match(/intro:\s*([\d.]+)/)[1]);
  const delay = Math.round(intro * 1000);
  // voice trimmed at "أهلا بكم" + a soft synthesized riser and hit for the opening
  const filter = [
    `[0:a]atrim=start=${cut},asetpts=PTS-STARTPTS,adelay=${delay}|${delay},aformat=channel_layouts=stereo[v]`,
    `anoisesrc=d=4.4:c=pink:a=0.5,bandpass=f=2200:w=1800,afade=t=in:d=4.1:curve=exp,afade=t=out:st=4.15:d=0.25,volume=0.22,adelay=350|350,aformat=channel_layouts=stereo[r]`,
    `sine=f=52:d=1.8,afade=t=out:st=0.02:d=1.75,volume=0.9,adelay=4850|4850,aformat=channel_layouts=stereo[h]`,
    `anoisesrc=d=0.6:c=brown:a=0.6,lowpass=f=500,afade=t=out:st=0:d=0.6,volume=0.5,adelay=4850|4850,aformat=channel_layouts=stereo[n]`,
    `[v][r][h][n]amix=inputs=4:normalize=0:duration=longest,apad,atrim=0:${duration},alimiter=limit=0.95[out]`,
  ].join(';');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', voice, '-filter_complex', filter, '-map', '[out]', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', file]);
}

(async () => {
  if (args.stills) return stills(String(args.stills).split(',').map(Number));
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const probe = await openPage(browser);
  const duration = await probe.evaluate(() => window.DURATION);
  await probe.close();
  const from = +(args.from || 0), to = Math.min(duration, +(args.to || duration));
  const F0 = Math.round(from * FPS), F1 = Math.round(to * FPS);
  const tmp = path.join(ROOT, 'frames');
  fs.mkdirSync(tmp, { recursive: true });
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const per = Math.ceil((F1 - F0) / WORKERS);
  const parts = [];
  console.log(`rendering ${F1 - F0} frames (${(to - from).toFixed(2)}s) with ${WORKERS} workers`);
  await Promise.all(Array.from({ length: WORKERS }, (_, w) => {
    const a = F0 + w * per, b = Math.min(F1, a + per);
    if (a >= b) return null;
    const file = path.join(tmp, `part${w}.mp4`);
    parts[w] = file;
    return renderRange(browser, a, b, file);
  }));
  await browser.close();
  fs.writeFileSync(path.join(tmp, 'list.txt'), parts.filter(Boolean).map(p => `file '${p}'`).join('\n'));
  const video = path.join(tmp, 'video.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', video]);
  if (from === 0 && to === duration) {
    const audio = path.join(tmp, 'audio.m4a');
    buildAudio(duration, audio);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-i', audio, '-map', '0:v', '-map', '1:a', '-c', 'copy', '-movflags', '+faststart', '-shortest', OUT]);
  } else {
    fs.copyFileSync(video, OUT);
  }
  console.log('wrote', OUT);
})();
