// Renders src/index.html frame by frame with headless Chromium and encodes it with ffmpeg.
//   node tools/render.js --edition 2026-10-24                 full video -> output/erriwaya-brief-2026-10-24.mp4
//   node tools/render.js --edition 2026-10-24 --stills 3,30   PNG stills -> output/stills/
//   node tools/render.js --edition 2026-10-24 --from 0 --to 10   partial render (no audio mix)
//   node tools/render.js --edition 2026-10-24 --cover         cover image + description text only
//   (a full render writes them too: output/erriwaya-brief-<date>[-format]-cover.jpg, -description.txt and .srt)
//   add --format youtube for the 1920x1080 layout, --format story for 1080x1920 (default: feed, 1080x1350)
// Without --edition the most recent folder in editions/ is used.
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
const EDITION = String(args.edition || fs.readdirSync(path.join(ROOT, 'editions')).filter(d => /^\d{4}-\d{2}-\d{2}/.test(d)).sort().pop());
const EDIR = path.join(ROOT, 'editions', EDITION);
if (!fs.existsSync(path.join(EDIR, 'edition.js'))) { console.error('no edition at ' + EDIR); process.exit(1); }
const FORMAT = String(args.format || 'feed');
const SIZE = { feed: [1080, 1350], youtube: [1920, 1080], story: [1080, 1920] }[FORMAT];
if (!SIZE) { console.error('unknown format ' + FORMAT); process.exit(1); }
const LOOK = args.look ? String(args.look) : '';   // trial feed looks: wide | full
const SUFFIX = (FORMAT === 'feed' ? '' : '-' + FORMAT) + (LOOK ? '-' + LOOK : '');
const OUT = path.resolve(ROOT, args.out || `output/erriwaya-brief-${EDITION}${SUFFIX}.mp4`);
const PAGE = 'file://' + path.join(ROOT, 'src', 'index.html') + '?edition=' + encodeURIComponent(EDITION) + '&format=' + FORMAT + (LOOK ? '&look=' + LOOK : '');

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

async function stills(list) {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await openPage(browser);
  const dir = path.join(ROOT, 'output', 'stills');
  fs.mkdirSync(dir, { recursive: true });
  for (const t of list) {
    const f = path.join(dir, `${LOOK ? LOOK + '-' : ''}t${String(t).padStart(6, '0')}.png`);
    fs.writeFileSync(f, await grab(page, t, 'image/png'));
    console.log(f);
  }
  await browser.close();
}

const COVER = OUT.replace(/\.mp4$/, '-cover.jpg');
async function cover(browser) {
  const page = await openPage(browser);
  const url = await page.evaluate(() => { window.renderCover(); return document.getElementById('c').toDataURL('image/jpeg', 0.92); });
  fs.writeFileSync(COVER, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
  await page.close();
  console.log('wrote', COVER);
}

// YouTube / Facebook description: the stories in order, chapter timestamps (video time) and the handles.
function description() {
  const TL = loadEdition();
  const vt = a => TL.intro + a - TL.audioCut;
  const end = vt(TL.audioEnd) + TL.tail;
  const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const stories = TL.chapters.map(c => {
    const hs = TL.headlines.filter(h => h.t >= c - 0.05);
    return { t: vt(c), kicker: hs[0].kicker, topic: hs[0].topic, text: hs[0].text };
  });
  const closing = TL.headlines[TL.headlines.length - 1];
  const marks = [{ t: 0, label: 'المقدمة' }, ...stories.map(s => ({ t: s.t, label: s.kicker }))];
  if (closing.kicker === TL.title && closing.t > TL.chapters[TL.chapters.length - 1]) marks.push({ t: vt(closing.t), label: 'الختام' });
  // YouTube needs chapters of at least 10 s: fold a short one into the one before it
  const ch = marks.filter((m, i) => i === 0 || ((marks[i + 1] ? marks[i + 1].t : end) - m.t >= 10));
  const tags = ['الرواية', 'الموجز_الإخباري', ...new Set(stories.map(s => s.kicker.replace(/\s+/g, '_')))];
  const text = [
    `${TL.title} – الرواية | ${TL.date}`,
    TL.headlines[0].text,
    '',
    'في هذا الموجز:',
    ...stories.map(s => `• ${s.kicker}${s.topic ? ` (${s.topic})` : ''}: ${s.text}`),
    '',
    ...ch.map(m => `${mmss(m.t)} ${m.label}`),
    '',
    'تابعونا على فيسبوك وتيك توك ويوتيوب: ERRIWAYA',
    'وعلى إنستغرام: ERRIWAYA.MR',
    '',
    tags.map(t => '#' + t).join(' '),
  ].join('\n') + '\n';
  const file = path.join(ROOT, 'output', `erriwaya-brief-${EDITION}-description.txt`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  console.log('wrote', file);
}

// Subtitles (.srt, video time) from editions/<date>/subtitles.txt: transcript.txt with the spelling corrected
// from the script. Short phrases are joined into cues of at most two lines.
function subtitles() {
  const TL = loadEdition();
  const vt = a => TL.intro + a - TL.audioCut;
  let src = path.join(EDIR, 'subtitles.txt');
  if (!fs.existsSync(src)) {
    src = path.join(EDIR, 'transcript.txt');
    if (!fs.existsSync(src)) return;
    console.warn('no subtitles.txt: using transcript.txt as is (copy it to subtitles.txt and correct the spelling)');
  }
  const ph = fs.readFileSync(src, 'utf8').split('\n').map(l => l.match(/^\[\s*([\d.]+)\s*-\s*([\d.]+)\]\s*(.+)$/))
    .filter(Boolean).map(m => ({ t0: +m[1], t1: +m[2], text: m[3].trim() }))
    .filter(p => p.t0 >= TL.audioCut - 0.05 && p.t0 < TL.audioEnd);
  const cues = [];
  for (const p of ph) {
    const c = cues[cues.length - 1];
    // join short phrases, but never across a story or a new sentence ("وفي ...", "نبدأ ...")
    const fresh = /^(وفي|وعلى|نبدأ|إلى هنا|ومن المقرر)\s/.test(p.text) || TL.chapters.some(ch => ch > (c ? c.t0 : 0) && ch <= p.t0 + 0.05);
    if (c && !fresh && p.t0 - c.t1 < 0.6 && c.text.length + p.text.length < 56 && p.t1 - c.t0 < 6) { c.text += ' ' + p.text; c.t1 = p.t1; }
    else cues.push({ ...p });
  }
  const split = t => {
    if (t.length <= 36) return t;
    let best = -1;
    for (let i = 0; i < t.length; i++) if (t[i] === ' ' && (best < 0 || Math.abs(i - t.length / 2) < Math.abs(best - t.length / 2))) best = i;
    return best < 0 ? t : t.slice(0, best) + '\n' + t.slice(best + 1);
  };
  const ts = s => {
    const ms = Math.max(0, Math.round(s * 1000));
    const p = (n, w = 2) => String(n).padStart(w, '0');
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
  };
  const out = cues.map((c, i) => {
    const end = Math.min(c.t1 + 0.35, cues[i + 1] ? cues[i + 1].t0 - 0.05 : c.t1 + 1);
    return `${i + 1}\n${ts(vt(c.t0))} --> ${ts(vt(end))}\n${split(c.text)}\n`;
  }).join('\n');
  const file = path.join(ROOT, 'output', `erriwaya-brief-${EDITION}.srt`);
  fs.writeFileSync(file, out);
  console.log('wrote', file);
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

function loadEdition() {
  const window = {};
  new Function('window', fs.readFileSync(path.join(EDIR, 'edition.js'), 'utf8'))(window);
  return window.TIMELINE;
}

// Decodes mono 8 kHz audio to find quiet moments in the voice-over.
function voiceEnergy(file) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', '8000', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  return new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
}
function quietest(samples, t0, t1) {
  const sr = 8000, w = 320;  // 40 ms windows
  let best = null;
  for (let i = Math.max(0, Math.round(t0 * sr)); i + w < Math.min(samples.length, t1 * sr); i += 80) {
    let e = 0;
    for (let k = 0; k < w; k++) e += samples[i + k] * samples[i + k];
    if (!best || e < best.e) best = { e, t: (i + w / 2) / sr };
  }
  return best ? best.t : t1;
}

function buildAudio(duration, file) {
  const A = p => path.join(ROOT, 'assets', 'audio', p);
  const voice = path.join(EDIR, 'voiceover.mp3');
  const TL = loadEdition();
  const intro = TL.intro, cut = TL.audioCut;
  const vt = a => intro + a - cut;
  const ms = s => Math.max(0, Math.round(s * 1000));
  const outro = vt(TL.outroAt), voiceEnd = vt(TL.audioEnd);
  // story transitions: the whoosh peaks (0.55s into the file) in the pause just before each story
  const energy = voiceEnergy(voice);
  const hits = TL.chapters.map(c => vt(quietest(energy, c - cut - 1.0, c - cut + 0.4)));
  const OUTRO_HIT = 8.0;  // final chord of outro-music.wav
  const OUTRO_LAND = outro + 2.1;  // ...lands as the closing logo settles and the social icons appear (src/app.js drawOutro)
  const inputs = ['-i', voice, '-i', A('intro-music.wav'), '-stream_loop', '-1', '-i', A('bed.wav'), '-i', A('outro-music.wav'), '-i', A('whoosh.wav')];
  const f = [
    `[0:a]atrim=start=${cut},asetpts=PTS-STARTPTS,adelay=${ms(intro)}|${ms(intro)},aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[v][vk0]`,
    `[vk0]apad[vk]`,
    // opening theme, ducked when the voice starts
    `[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume='if(lt(t,${intro - 0.1}),0.75,0.75*max(0.2,1-(t-${intro - 0.1})*1.6))':eval=frame[m]`,
    // quiet bed under the stories, handing over to the closing music
    `[2:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${duration - intro + 1},volume=0.16,afade=t=in:st=0:d=2.5,afade=t=out:st=${outro - intro - 1}:d=2,adelay=${ms(intro - 0.6)}|${ms(intro - 0.6)}[bed]`,
    `[3:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.55,adelay=${ms(OUTRO_LAND - OUTRO_HIT)}|${ms(OUTRO_LAND - OUTRO_HIT)}[out]`,
    // music ducks a further ~8 dB whenever the voice speaks
    `[bed][out]amix=inputs=2:normalize=0:duration=longest[bus]`,
    `[bus][vk]sidechaincompress=threshold=0.015:ratio=6:attack=20:release=450:knee=4[duck]`,
    `[4:a]aformat=sample_rates=48000:channel_layouts=stereo,highpass=f=300,volume=0.24,asplit=${hits.length}${hits.map((_, i) => `[w${i}]`).join('')}`,
    ...hits.map((h, i) => `[w${i}]adelay=${ms(h - 0.55)}|${ms(h - 0.55)}[wd${i}]`),
    `[v][m][duck]${hits.map((_, i) => `[wd${i}]`).join('')}amix=inputs=${3 + hits.length}:normalize=0:duration=longest,apad,atrim=0:${duration},alimiter=limit=0.95[mix]`,
  ].join(';');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', f, '-map', '[mix]', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', file]);
  console.log('transitions at', hits.map(h => h.toFixed(2)).join(' '));
}

(async () => {
  if (args.stills) return stills(String(args.stills).split(',').map(Number));
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  if (args.cover) { await cover(browser); await browser.close(); description(); return subtitles(); }
  const probe = await openPage(browser);
  const duration = await probe.evaluate(() => window.DURATION);
  await probe.close();
  const from = +(args.from || 0), to = Math.min(duration, +(args.to || duration));
  const F0 = Math.round(from * FPS), F1 = Math.round(to * FPS);
  const tmp = path.join(ROOT, 'frames', EDITION + SUFFIX);
  fs.mkdirSync(tmp, { recursive: true });
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const per = Math.ceil((F1 - F0) / WORKERS);
  const parts = [];
  console.log(`edition ${EDITION} (${FORMAT} ${SIZE.join('x')}): rendering ${F1 - F0} frames (${(to - from).toFixed(2)}s) with ${WORKERS} workers`);
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
    const b2 = await chromium.launch({ args: ['--allow-file-access-from-files'] });
    await cover(b2);
    await b2.close();
    description();
    subtitles();
  } else {
    fs.copyFileSync(video, OUT);
  }
  console.log('wrote', OUT);
})();
