// Precomputes the pixel-map data used by src/index.html:
//  - a square grid in Mercator space, each cell tagged with the country it falls in, plus finer grids
//    (0.2 and 0.1) that the map card switches to when the camera zooms in on a country
//  - country borders and coastlines (clipped to the region, Natural Earth 10m) as polylines
//  - the coastline traced north and south from Nouakchott (for the intro)
// Output: src/map-data.js
const fs = require('fs');
const path = require('path');
const topojson = require('topojson-client');
const d3 = require('d3-geo');

const world = require('world-atlas/countries-10m.json');
const land = require('world-atlas/land-50m.json');

const BOX = { lon0: -36, lon1: 52, lat0: -6, lat1: 60 };  // reaches Moscow for Russia-Africa stories
const CELL = 0.4; // grid step, in Mercator "degrees"
const FINE = [0.2, 0.1];

const RAD = Math.PI / 180;
const mercY = lat => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2)) / RAD;
const invMercY = y => (2 * Math.atan(Math.exp(y * RAD)) - Math.PI / 2) / RAD;

const countries = topojson.feature(world, world.objects.countries).features;
const inBox = b => !(b[1][0] < BOX.lon0 || b[0][0] > BOX.lon1 || b[1][1] < BOX.lat0 || b[0][1] > BOX.lat1);
const feats = countries
  .map(f => ({ f, b: d3.geoBounds(f) }))
  // features crossing the antimeridian (Russia) have b[0][0] > b[1][0]; keep them, their polygons are tested one by one
  .filter(({ b }) => b[0][0] > b[1][0] || inBox(b));

const ids = [''];
const names = [''];
feats.forEach(({ f }) => { ids.push(f.id); names.push(f.properties.name); });

// Planar point-in-polygon on the 10m rings (edges are short, so lon/lat ray casting is exact enough).
const shapes = feats.map(({ f }) => {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  return polys.map(rings => {
    const b = [Infinity, Infinity, -Infinity, -Infinity];
    for (const [x, y] of rings[0]) { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); }
    return { b, rings };
  });
});
function inRing(ring, x, y) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function countryAt(lon, lat) {
  for (let i = 0; i < shapes.length; i++) {
    for (const { b, rings } of shapes[i]) {
      if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
      if (inRing(rings[0], lon, lat) && !rings.slice(1).some(h => inRing(h, lon, lat))) return i + 1;
    }
  }
  return 0;
}

const y0 = mercY(BOX.lat0), y1 = mercY(BOX.lat1);
function buildGrid(cell) {
  const cols = Math.ceil((BOX.lon1 - BOX.lon0) / cell);
  const rows = Math.ceil((y1 - y0) / cell);
  const grid = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    const lat = invMercY(y1 - (r + 0.5) * cell);
    for (let c = 0; c < cols; c++) grid[r * cols + c] = countryAt(BOX.lon0 + (c + 0.5) * cell, lat);
  }
  return { cell, cols, rows, grid: Buffer.from(grid).toString('base64') };
}
const coarse = buildGrid(CELL);
const { cols, rows, grid } = coarse;
const fine = FINE.map(buildGrid);

// Polylines, kept only where they touch the region, rounded to 0.01°.
const pad = 3;
const near = p => p[0] > BOX.lon0 - pad && p[0] < BOX.lon1 + pad && p[1] > BOX.lat0 - pad && p[1] < BOX.lat1 + pad;
const round = p => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100];
function simplify(pts, tol = 0.012) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-9;
    let best = -1, bd = tol;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * (pts[i][0] - ax) - dx * (pts[i][1] - ay)) / len;
      if (d > bd) { bd = d; best = i; }
    }
    if (best >= 0) { keep[best] = 1; stack.push([a, best], [best, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
function clipLines(multi) {
  const out = [];
  for (const line of multi.coordinates) {
    let cur = [];
    for (const p of line) {
      if (near(p)) cur.push(p);
      else if (cur.length) { if (cur.length > 1) out.push(cur); cur = []; }
    }
    if (cur.length > 1) out.push(cur);
  }
  return out.map(l => simplify(l).map(round));
}
const borders = clipLines(topojson.mesh(world, world.objects.countries, (a, b) => a !== b));
const coasts = clipLines(topojson.mesh(world, world.objects.countries, (a, b) => a === b));

// Coastline walk from Nouakchott.
const NKC = [-15.98, 18.09];
const landGeo = topojson.feature(land, land.objects.land);
let best = null;
for (const poly of landGeo.geometries ? landGeo.geometries : landGeo.features.map(f => f.geometry)) {
  const polys = poly.type === 'Polygon' ? [poly.coordinates] : poly.coordinates;
  for (const p of polys) {
    const ring = p[0];
    ring.forEach((pt, i) => {
      const d = Math.hypot(pt[0] - NKC[0], pt[1] - NKC[1]);
      if (!best || d < best.d) best = { d, ring, i };
    });
  }
}
const ring = best.ring.slice(0, -1);
const n = ring.length;
function walk(step, stop) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const p = ring[(best.i + step * k + n * 4) % n];
    if (stop(p)) break;
    out.push(round(p));
  }
  return out;
}
let a = walk(1, () => false).slice(0, 40);
const northStep = a[a.length - 1][1] > NKC[1] ? 1 : -1;
// north: up the Atlantic coast, through Gibraltar, east along the Mediterranean to Libya's east edge
const north = walk(northStep, p => p[0] > 25.2 && p[1] < 33);
// south: down to the Gulf of Guinea
const south = walk(-northStep, p => p[0] > 8.6);

const out = {
  box: BOX, cell: CELL, cols, rows,
  ids, names,
  grid,
  fine,
  borders, coasts,
  coastNorth: north, coastSouth: south,
};
fs.writeFileSync(path.join(__dirname, '..', 'src', 'map-data.js'),
  '// Generated by tools/build-map.js from Natural Earth (world-atlas 50m). Do not edit.\nwindow.MAP_DATA = ' + JSON.stringify(out) + ';\n');
console.log(`grid ${cols}x${rows}, ${ids.length - 1} countries, ${borders.length} border lines, coast N ${north.length} pts, S ${south.length} pts`);
console.log('north end', north[north.length - 1], 'south end', south[south.length - 1]);

// Social icons (Simple Icons, CC0) for the outro.
const si = require('simple-icons');
const icons = {};
for (const [k, v] of Object.entries({ facebook: 'siFacebook', tiktok: 'siTiktok', youtube: 'siYoutube', instagram: 'siInstagram' })) icons[k] = si[v].path;
fs.writeFileSync(path.join(__dirname, '..', 'src', 'icons.js'),
  '// Generated by tools/build-map.js from simple-icons (CC0). Do not edit.\nwindow.ICONS = ' + JSON.stringify(icons) + ';\n');
