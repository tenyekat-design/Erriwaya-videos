// node build.mjs <private-key-hex-file> [out.html]
// Writes the publisher's page (one self-contained HTML file) with the private key inside it.
// The key file and the page it produces must never be committed or shared: whoever has them can make codes.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const [keyFile, out = 'sub-codes.html'] = process.argv.slice(2);
if (!keyFile) { console.error('usage: node build.mjs <private-key-hex-file> [out.html]'); process.exit(1); }
const key = readFileSync(keyFile, 'utf8').trim();
if (!/^[0-9a-f]{64}$/i.test(key)) { console.error('the key file must hold 64 hex digits'); process.exit(1); }
const r = await build({ entryPoints: [join(here, 'sign.js')], bundle: true, minify: true, format: 'iife', write: false, target: 'es2019' });
const pub = /PUBLIC_KEY =\s*"([^"]+)"/.exec(readFileSync(join(here, '../../src/mr/erriwaya/calendar/Sub.java'), 'utf8'))[1];
const html = readFileSync(join(here, 'page.html'), 'utf8')
  .replace('/*__SIGN__*/', () => r.outputFiles[0].text).replace('__PRIVATE_KEY__', key).replace('__PUBLIC_KEY__', pub);
writeFileSync(out, html);
console.log('wrote', out, html.length, 'bytes');
