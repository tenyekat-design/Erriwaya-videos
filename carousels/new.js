// Starts a new carousel from the template: carousels/<name>/carousel.html + img/.
// Usage: node carousels/new.js <name>      e.g. node carousels/new.js 2026-11-02-niger-algeria
const path = require('path'), fs = require('fs');
const name = process.argv[2];
if (!name || !/^[\w-]+$/.test(name)) { console.error('usage: node carousels/new.js <name>'); process.exit(1); }
const dir = path.join(__dirname, name);
if (fs.existsSync(dir)) { console.error(dir + ' already exists'); process.exit(1); }
fs.mkdirSync(path.join(dir, 'img'), { recursive: true });
fs.copyFileSync(path.join(__dirname, '_template', 'carousel.html'), path.join(dir, 'carousel.html'));
console.log('carousels/' + name + '/carousel.html  (photos in carousels/' + name + '/img/, then node carousels/render.js ' + name + ')');
