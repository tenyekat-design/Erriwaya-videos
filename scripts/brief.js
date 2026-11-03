// Builds the interactive brief («الموجز التفاعلي») from a video edition of the Erriwaya-videos template.
//   node scripts/brief.js <Erriwaya-videos checkout> <YYYY-MM-DD>
// Reads editions/<date>/edition.js, subtitles.txt, voiceover.mp3, img/ and src/map-data.js there, and writes:
//   brief/brief.json            stories, headlines, photos, spoken phrases, map crop (the page reads only this)
//   brief/<date>/voice.mp3      the voice-over, mono 64 kb/s
//   brief/<date>/*.webp         the photos, 1280 px wide at most
// Needs node and ffmpeg. Older editions' folders are removed: the site keeps only the latest brief.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [src, date] = process.argv.slice(2);
if (!src || !/^\d{4}-\d\d-\d\d$/.test(date || '')) {
  console.error('usage: node scripts/brief.js <Erriwaya-videos checkout> <YYYY-MM-DD>');
  process.exit(1);
}
const ed = path.join(src, 'editions', date);
const out = path.join(__dirname, '..', 'brief');
const outEd = path.join(out, date);

const load = file => { const window = {}; new Function('window', fs.readFileSync(file, 'utf8'))(window); return window; };
const TL = load(path.join(ed, 'edition.js')).TIMELINE;
const MD = load(path.join(src, 'src', 'map-data.js')).MAP_DATA;
const r2 = x => Math.round(x * 100) / 100;

// spoken phrases (subtitles.txt: "[ t0 - t1] text")
const phrases = fs.readFileSync(path.join(ed, 'subtitles.txt'), 'utf8').split('\n')
  .map(l => l.match(/^\[\s*([\d.]+)\s*-\s*([\d.]+)\]\s*(.+)$/)).filter(Boolean)
  .map(m => [+m[1], +m[2], m[3].trim()]).filter(p => p[0] < TL.audioEnd);

// stories: one per chapter, up to the closing sentence
const starts = TL.chapters;
const ends = starts.slice(1).concat(TL.outroAt);
const photoAt = [];                      // every photo move, in time order: [t, img]
TL.cards.forEach(c => c.moves.forEach(m => photoAt.push([m.t, c.img])));
photoAt.sort((a, b) => a[0] - b[0]);
const imgs = new Set();
const stories = starts.map((t0, i) => {
  const t1 = ends[i];
  const inside = t => t >= t0 - 0.01 && t < t1 - 0.01;
  const heads = TL.headlines.filter(h => inside(h.t));
  const hl = TL.highlights.filter(h => h.t >= t0 - 0.5 && h.t < t1);
  const primary = hl.find(h => h.kind === 'primary');
  const photos = photoAt.filter(p => inside(p[0])).map(p => [r2(p[0]), p[1]]);
  photos.forEach(p => imgs.add(p[1]));
  const pins = TL.pins.filter(p => p.t >= t0 - 0.5 && p.t < t1)
    .map(p => ({ lon: p.lon, lat: p.lat, label: p.label, main: !!p.main, dot: p.dot !== false, side: p.side || 'right' }));
  const cam = TL.camera.filter(c => c.t <= t0 + 0.5).pop();
  return {
    t0: r2(t0), t1: r2(t1),
    country: heads[0].kicker, topic: heads[0].topic,
    heads: heads.map(h => ({ t: r2(h.t), text: h.text, topic: h.topic })),
    photos, pins,
    ids: primary ? primary.ids : [],
    also: hl.filter(h => h.kind === 'secondary').flatMap(h => h.ids),
    cam: { lon: cam.lon, lat: cam.lat, w: cam.w },
  };
});

// map crop around the stories (in the template's Mercator grid)
const BOX = { lon0: -26, lon1: 32, lat0: 2, lat1: 44 };
const RAD = Math.PI / 180, mercY = lat => Math.log(Math.tan(Math.PI / 4 + lat * RAD / 2)) / RAD;
const GY1 = mercY(MD.box.lat1);
const grid = Buffer.from(MD.grid, 'base64');
const c0 = Math.floor((BOX.lon0 - MD.box.lon0) / MD.cell), c1 = Math.ceil((BOX.lon1 - MD.box.lon0) / MD.cell);
const rr0 = Math.floor((GY1 - mercY(BOX.lat1)) / MD.cell), rr1 = Math.ceil((GY1 - mercY(BOX.lat0)) / MD.cell);
const cols = c1 - c0, rows = rr1 - rr0;
const crop = Buffer.alloc(cols * rows);
for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) crop[r * cols + c] = grid[(r + rr0) * MD.cols + c + c0];
const map = {
  lon0: r2(MD.box.lon0 + c0 * MD.cell), my1: r2(GY1 - rr0 * MD.cell), cell: MD.cell, cols, rows,
  ids: MD.ids, grid: crop.toString('base64'),
};

// media
if (TL.hook) imgs.add(TL.hook.img);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(outEd, { recursive: true });
const ff = args => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args]);
ff(['-i', path.join(ed, 'voiceover.mp3'), '-ac', '1', '-b:a', '64k', path.join(outEd, 'voice.mp3')]);
const webp = f => f.replace(/\.\w+$/, '.webp');
for (const f of imgs) {
  ff(['-i', path.join(ed, 'img', f), '-vf', "scale='min(1280,iw)':-2", '-quality', '78', path.join(outEd, webp(f))]);
}
stories.forEach(s => s.photos.forEach(p => { p[1] = webp(p[1]); }));
const hook = TL.hook ? { text: TL.hook.text, img: webp(TL.hook.img) } : null;

const brief = {
  date, dateText: TL.date, dir: `brief/${date}/`, audio: 'voice.mp3', duration: r2(TL.audioEnd),
  intro: TL.headlines[0].text, outro: r2(TL.outroAt), outroText: TL.headlines[TL.headlines.length - 1].text, hook, stories, phrases, map,
};
fs.writeFileSync(path.join(out, 'brief.json'), JSON.stringify(brief));
const kb = f => Math.round(fs.statSync(f).size / 1024);
console.log(`${stories.length} stories, ${phrases.length} phrases, ${imgs.size} photos, map ${cols}x${rows};`,
  `brief.json ${kb(path.join(out, 'brief.json'))} KB, voice ${kb(path.join(outEd, 'voice.mp3'))} KB`);
