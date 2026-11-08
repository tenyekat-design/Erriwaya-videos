// node plates.js <edition> <format> <outdir> <t0> <t1> : PNG frames of video time [t0,t1) at 30 fps
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const [ed, format, out, t0, t1] = process.argv.slice(2);
const SIZE = { feed: [1080, 1350], youtube: [1920, 1080] }[format];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: SIZE[0], height: SIZE[1] } });
  await p.goto('file://' + path.resolve('src/index.html') + '?edition=' + ed + '&format=' + format);
  await p.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  const n0 = Math.round(+t0 * 30), n1 = Math.round(+t1 * 30);
  for (let n = n0; n < n1; n++) {
    const url = await p.evaluate(t => { window.renderFrame(t); return document.getElementById('c').toDataURL('image/png'); }, n / 30);
    fs.writeFileSync(path.join(out, String(n).padStart(6, '0') + '.png'), Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
  }
  await b.close(); console.log('done', ed, n0, n1);
})();
