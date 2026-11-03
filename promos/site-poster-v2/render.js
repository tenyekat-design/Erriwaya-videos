// Renders the site promo stills (brand-guide style, real stories from the site):
//   node promos/site-poster-v2/render.js [--url www.erriwaya.com]
//   -> output/erriwaya-site-v2-{feed,square,story,share,cover}.png
// To refresh the stories first: python3 promos/site-poster-v2/build-content.py <gh-pages checkout> [ids...]
const { chromium } = require('playwright');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const i = process.argv.indexOf('--url'), url = i > 0 ? process.argv[i + 1] : '';
const SIZES = { feed: [1080, 1350], square: [1080, 1080], story: [1080, 1920], share: [1200, 630], cover: [1640, 624] };

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  for (const [format, [w, h]] of Object.entries(SIZES)) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
    await page.goto('file://' + path.join(__dirname, 'index.html') + `?format=${format}` + (url ? '&url=' + encodeURIComponent(url) : ''));
    await page.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
    const out = path.join(ROOT, 'output', `erriwaya-site-v2-${format}.png`);
    await page.screenshot({ path: out });
    console.log('wrote', out);
    await page.close();
  }
  await browser.close();
})();
