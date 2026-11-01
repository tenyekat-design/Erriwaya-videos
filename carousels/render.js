// Renders every .slide of carousels/<name>/carousel.html to carousels/<name>/slides/NN.png (1080x1350).
// Usage: node carousels/render.js <name>      e.g. node carousels/render.js 2026-10-29-minurso
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const name = process.argv[2];
  const dir = name && path.resolve(__dirname, name);
  if (!dir || !fs.existsSync(path.join(dir, 'carousel.html'))) { console.error('usage: node carousels/render.js <name>'); process.exit(1); }
  const out = path.join(dir, 'slides');
  fs.mkdirSync(out, { recursive: true });
  for (const f of fs.readdirSync(out)) if (f.endsWith('.png')) fs.unlinkSync(path.join(out, f));
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto('file://' + path.join(dir, 'carousel.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const slides = await page.$$('.slide');
  for (let i = 0; i < slides.length; i++) await slides[i].screenshot({ path: path.join(out, String(i + 1).padStart(2, '0') + '.png') });
  await browser.close();
  console.log(slides.length + ' slides -> ' + path.relative(process.cwd(), out));
})();
