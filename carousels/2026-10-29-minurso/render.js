// Renders each .slide of carousel.html to slides/NN.png (1080x1350).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const out = path.join(__dirname, 'slides'); fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto('file://' + path.join(__dirname, 'carousel.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const slides = await page.$$('.slide');
  for (let i = 0; i < slides.length; i++) await slides[i].screenshot({ path: path.join(out, String(i + 1).padStart(2, '0') + '.png') });
  await browser.close();
  console.log(slides.length + ' slides -> ' + out);
})();
