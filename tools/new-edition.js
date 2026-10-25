// Creates editions/<date>/ from editions/_template.
//   node tools/new-edition.js 2026-10-25 "الأحد 25 أكتوبر 2026"
const fs = require('fs');
const path = require('path');

const [date, day = ''] = process.argv.slice(2);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) { console.error('usage: node tools/new-edition.js YYYY-MM-DD "اليوم DD الشهر YYYY"'); process.exit(1); }
const dir = path.join(__dirname, '..', 'editions', date);
if (fs.existsSync(dir)) { console.error(dir + ' already exists'); process.exit(1); }
fs.mkdirSync(path.join(dir, 'img'), { recursive: true });
const tpl = fs.readFileSync(path.join(__dirname, '..', 'editions', '_template', 'edition.js'), 'utf8');
fs.writeFileSync(path.join(dir, 'edition.js'), tpl.replaceAll('__DATE__', date).replaceAll('__DAY__', day));
console.log(`created ${path.relative(process.cwd(), dir)}/
  1. put the voice-over at  editions/${date}/voiceover.mp3  and the photos in  editions/${date}/img/
  2. python3 tools/transcribe.py ${date}      (timings + transcript.txt)
  3. fill editions/${date}/edition.js
  4. node tools/render.js --edition ${date} --stills 10,40,90   then   node tools/render.js --edition ${date}`);
