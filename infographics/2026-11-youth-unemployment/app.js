// Erriwaya infographic: youth unemployment in the Maghreb (Nov 2026). Draws one frame with renderFrame(t).
// ?format=feed (1080x1350, Facebook portrait, default) or ?format=story (1080x1920, Reels/Stories/TikTok).
// Infographic palette (not the news-brief look): cool light background (blue-grey white), one vivid colour per country,
// kept the same in every scene (title chips, map, ranking).
(() => {
  const FORMAT = new URLSearchParams(location.search).get('format') || 'feed';
  const W = 1080, H = FORMAT === 'story' ? 1920 : 1350;
  const MD = window.MAP_DATA;

  // ---------- palette ----------
  const C = {
    paper: '#F4F7FA', paper2: '#DFE6EE', ink: '#1B2635', dark: '#1B2635', card: '#FFFFFF', panel: '#FFFFFF',
    mute: 'rgba(27,38,53,0.66)', faint: 'rgba(27,38,53,0.45)', track: 'rgba(27,38,53,0.07)',
    coral: '#F94144', orange: '#F3722C', amber: '#F8961E', yellow: '#F9C74F', green: '#43AA8B',
    blue: '#2D8FC4', slate: '#577590', purple: '#9B5DE5', cyan: '#00BBF9',
    up: '#E63946', down: '#2A9D8F',
  };
  // fill: bars / map / chips; text: the same hue dark enough to read on paper; on: text drawn on the fill
  const COUNTRY = {
    '434': { fill: C.coral, text: C.coral, on: '#fff' },
    '788': { fill: C.orange, text: C.orange, on: '#fff' },
    '012': { fill: C.yellow, text: '#B7860B', on: C.dark },
    '478': { fill: C.green, text: '#2F8A6E', on: '#fff' },
    '504': { fill: C.blue, text: '#1F6F9E', on: '#fff' },
  };

  // ---------- data (all checked against the sources listed in README.md) ----------
  // ILO modelled estimates 2025, youth 15-24 (World Bank WDI, Feb 2026 release)
  const ILO = [
    { id: '434', name: 'ليبيا', v: 50.1, at: [17.5, 27.0] },
    { id: '788', name: 'تونس', v: 38.1, at: [9.4, 34.0], label: [13.6, 36.6] },
    { id: '012', name: 'الجزائر', v: 29.4, at: [2.6, 28.0] },
    { id: '478', name: 'موريتانيا', v: 22.9, at: [-10.4, 20.6] },
    { id: '504', name: 'المغرب', v: 21.9, at: [-6.2, 32.0], label: [-13.6, 33.6] },
  ];
  const WORLD = 12.4, NAFR = 22.6, ARAB = 26.2, NEET_NAFR = 30.1;

  // ---------- layout ----------
  const L = FORMAT === 'story'
    ? { logo: { x: 960, y: 200, h: 112 }, top: 330, bot: 1530, src: 1572, prog: 1618 }
    : { logo: { x: 960, y: 92, h: 104 }, top: 196, bot: 1222, src: 1258, prog: 1302 };
  const SP = (L.bot - L.top) / 1026;          // vertical spread: scenes are laid out on a 1026 px block
  const Y = y => L.top + y * SP;

  const cv = document.getElementById('c');
  cv.width = W; cv.height = H;
  const MAIN = cv.getContext('2d');
  let ctx = MAIN;
  // draw fn() into an offscreen layer, fade its edges (feather px) outside rect and composite it
  const OFF = document.createElement('canvas'); OFF.width = W; OFF.height = H;
  const OCTX = OFF.getContext('2d');
  function masked(rect, feather, fn) {
    OCTX.setTransform(1, 0, 0, 1, 0, 0); OCTX.globalAlpha = 1; OCTX.globalCompositeOperation = 'source-over';
    OCTX.clearRect(0, 0, W, H);
    ctx = OCTX; let r;
    try { r = fn(); } finally { ctx = MAIN; }
    OCTX.setTransform(1, 0, 0, 1, 0, 0); OCTX.globalAlpha = 1;
    for (const [a0, a1, horiz] of [[rect.y, rect.y + rect.h, false], [rect.x, rect.x + rect.w, true]]) {
      OCTX.globalCompositeOperation = 'destination-in';
      const g = horiz ? OCTX.createLinearGradient(a0, 0, a1, 0) : OCTX.createLinearGradient(0, a0, 0, a1);
      const f = Math.min(0.49, feather / (a1 - a0));
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(f, '#000'); g.addColorStop(1 - f, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
      OCTX.fillStyle = g; OCTX.fillRect(0, 0, W, H);
    }
    OCTX.globalCompositeOperation = 'source-over';
    MAIN.drawImage(OFF, 0, 0);
    return r;
  }

  // ---------- helpers ----------
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eout = p => 1 - Math.pow(1 - p, 3);
  const eio = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const eback = p => { const c = 1.7; return p <= 0 ? 0 : 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, p) => a.map((v, i) => Math.round(v + (b[i] - v) * p));
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const tint = (h, a) => rgb(hex(h), a);
  const font = s => `${s}px AlQuds`;
  const fmt = v => v.toFixed(1);

  function rrect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function shadow(blur = 28, y = 10, a = 0.12) { ctx.shadowColor = `rgba(27,38,53,${a})`; ctx.shadowBlur = blur; ctx.shadowOffsetY = y; }
  function noShadow() { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }
  // text: dir rtl by default; align 'right' | 'center' | 'left'
  function text(s, x, y, size, color, align = 'right', alpha = 1, dir = 'rtl') {
    if (alpha <= 0) return 0;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.font = font(size); ctx.fillStyle = color; ctx.direction = dir; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
    const w = ctx.measureText(s).width;
    ctx.restore();
    return w;
  }
  function measure(s, size) { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  // text revealed by a soft wipe from the right (reading direction) plus a small rise
  function wipeText(s, x, y, size, color, p, align = 'right') {
    if (p <= 0) return;
    const w = measure(s, size);
    const right = align === 'right' ? x : align === 'center' ? x + w / 2 : x + w;
    ctx.save();
    ctx.beginPath(); ctx.rect(right - w * eout(p) - 10, y - size, w * eout(p) + 20, size * 2); ctx.clip();
    text(s, x, y + (1 - eout(p)) * 14, size, color, align, clamp(p * 2));
    ctx.restore();
  }
  // five-colour rule (the five countries), used under titles
  function rainbow(cx, y, w, h, p) {
    if (p <= 0) return;
    const cols = [C.green, C.blue, C.yellow, C.orange, C.coral], seg = w / 5, vis = w * eout(p);
    ctx.save(); ctx.beginPath(); ctx.rect(cx + w / 2 - vis, y - h, vis, h * 3); ctx.clip();
    cols.forEach((c, i) => { ctx.fillStyle = c; rrect(cx - w / 2 + i * seg + 2, y, seg - 4, h, h / 2); ctx.fill(); });
    ctx.restore();
  }

  // ---------- assets ----------
  const LOGO = new Image();
  LOGO.src = '../../assets/logo-mark.png';
  let LOGO_INK = null;   // the white logo mask tinted in ink for the paper background
  function inkLogo() {
    const c = document.createElement('canvas'); c.width = LOGO.width; c.height = LOGO.height;
    const g = c.getContext('2d');
    g.drawImage(LOGO, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = C.ink; g.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function drawLogo(cx, cy, h, alpha = 1) {
    if (alpha <= 0 || !LOGO_INK) return;
    const w = h * LOGO_INK.width / LOGO_INK.height;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.drawImage(LOGO_INK, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
  }

  // ---------- map ----------
  const RAD = Math.PI / 180;
  const mercY = lat => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2)) / RAD;
  const GRID = Uint8Array.from(atob(MD.grid), ch => ch.charCodeAt(0));
  const GY1 = mercY(MD.box.lat1);
  const idIndex = {};
  MD.ids.forEach((id, i) => { if (id) idIndex[id] = i; });
  const MAGHREB = new Set(['478', '504', '012', '788', '434'].map(id => idIndex[id]));
  const WSAHARA = idIndex['732'];
  const VAL = {}; ILO.forEach(c => { VAL[idIndex[c.id]] = c; });
  const FILL = {}; Object.keys(COUNTRY).forEach(id => { FILL[idIndex[id]] = hex(COUNTRY[id].fill); });
  const LAND = [200, 209, 220];

  function projector(cam, rect) {
    const k = rect.w / cam.w;
    const ox = rect.x + rect.w / 2, oy = rect.y + rect.h / 2, cy = mercY(cam.lat);
    const f = (lon, lat) => [ox + (lon - cam.lon) * k, oy - (mercY(lat) - cy) * k];
    f.m = (lon, my) => [ox + (lon - cam.lon) * k, oy - (my - cy) * k];
    f.k = k;
    return f;
  }
  // cellColor(ci, lon, my) -> [rgb, alpha] | null (null: plain land)
  function drawGrid(cam, rect, cellColor, landA = 0.55) {
    const P = projector(cam, rect);
    const k = P.k, cell = MD.cell, size = cell * k, sq = Math.max(1, size * 0.8);
    const halfW = rect.w / 2 / k, halfH = rect.h / 2 / k, cy = mercY(cam.lat);
    const c0 = Math.max(0, Math.floor((cam.lon - halfW - MD.box.lon0) / cell) - 1);
    const c1 = Math.min(MD.cols - 1, Math.ceil((cam.lon + halfW - MD.box.lon0) / cell) + 1);
    const r0 = Math.max(0, Math.floor((GY1 - (cy + halfH)) / cell) - 1);
    const r1 = Math.min(MD.rows - 1, Math.ceil((GY1 - (cy - halfH)) / cell) + 1);
    const land = new Path2D(), sea = new Path2D(), singles = [];
    const dot = Math.max(1, size * 0.16);
    for (let r = r0; r <= r1; r++) {
      const my = GY1 - (r + 0.5) * cell;
      for (let c = c0; c <= c1; c++) {
        const ci = GRID[r * MD.cols + c];
        const lon = MD.box.lon0 + (c + 0.5) * cell;
        const [sx, sy] = P.m(lon, my);
        if (!ci) { if ((r + c) % 2 === 0) sea.rect(sx - dot / 2, sy - dot / 2, dot, dot); continue; }
        const col = cellColor ? cellColor(ci, lon, my) : null;
        if (col) singles.push(sx, sy, col[0], col[1]); else land.rect(sx - sq / 2, sy - sq / 2, sq, sq);
      }
    }
    ctx.fillStyle = 'rgba(45,143,196,0.15)'; ctx.fill(sea);
    ctx.fillStyle = rgb(LAND, landA); ctx.fill(land);
    for (let i = 0; i < singles.length; i += 4) {
      ctx.fillStyle = rgb(singles[i + 2], singles[i + 3]);
      ctx.fillRect(singles[i] - sq / 2, singles[i + 1] - sq / 2, sq, sq);
    }
    return P;
  }
  function strokeLines(P, lines, style, width) {
    ctx.save(); ctx.strokeStyle = style; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.beginPath();
    for (const ln of lines) ln.forEach((p, i) => { const [x, y] = P(p[0], p[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke(); ctx.restore();
  }

  // ---------- pictogram person ----------
  function person(cx, by, h, color, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx, by - h * 0.78, h * 0.17, 0, Math.PI * 2); ctx.fill();
    const bw = h * 0.5, bh = h * 0.52;
    ctx.beginPath();
    ctx.moveTo(cx - bw / 2, by);
    ctx.lineTo(cx - bw / 2, by - bh + bw * 0.42);
    ctx.quadraticCurveTo(cx - bw / 2, by - bh, cx, by - bh);
    ctx.quadraticCurveTo(cx + bw / 2, by - bh, cx + bw / 2, by - bh + bw * 0.42);
    ctx.lineTo(cx + bw / 2, by); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function pictoRow(n, on, cx, by, h, gap, t0, lt, color) {
    const per = 5, total = per * h * 0.62 + (per - 1) * gap;
    for (let i = 0; i < n; i++) {
      // reading order: right to left, then the next row
      const x = cx + total / 2 - h * 0.31 - (i % per) * (h * 0.62 + gap);
      const y = by + Math.floor(i / per) * h * 1.08;
      const p = eback(prog(lt, t0 + i * 0.07, t0 + i * 0.07 + 0.45));
      const lit = i < on && lt > t0 + 0.6 + i * 0.1;
      ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
      person(0, 0, h, lit ? color : 'rgba(27,38,53,0.14)');
      ctx.restore();
    }
  }

  // web icon: a globe in white strokes
  function globe(x, y, r, col = '#fff') {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = r * 0.16;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.45, r, 0, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - r * 0.86, y - r * 0.5); ctx.lineTo(x + r * 0.86, y - r * 0.5);
    ctx.moveTo(x - r * 0.86, y + r * 0.5); ctx.lineTo(x + r * 0.86, y + r * 0.5); ctx.stroke();
    ctx.restore();
  }
  // website pill: globe + erriwaya.com
  function sitePill(cx, cy, size, alpha) {
    if (alpha <= 0) return;
    const s = 'erriwaya.com', tw = measure(s, size), r = size * 0.42, w = tw + r * 2 + size * 1.5, h = size * 1.7;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.fillStyle = 'rgba(27,38,53,0.08)'; rrect(cx - w / 2, cy - h / 2, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(27,38,53,0.18)'; ctx.lineWidth = 1.5; ctx.stroke();
    globe(cx - w / 2 + size * 0.6 + r, cy, r, C.blue);
    ctx.restore();
    text(s, cx - w / 2 + size * 1.0 + r * 2, cy + 2, size, C.ink, 'left', alpha, 'ltr');
  }

  // tag pill (scene colour, white text), grows from the right
  function tag(s, xr, y, size, p, color) {
    if (p <= 0) return 0;
    const w = measure(s, size) + size * 1.4, h = size * 1.75;
    const vis = w * eout(p);
    ctx.save();
    ctx.beginPath(); ctx.rect(xr - vis, y - h, vis, h * 2); ctx.clip();
    ctx.fillStyle = color; rrect(xr - w, y - h / 2, w, h, h / 2); ctx.fill();
    text(s, xr - size * 0.7, y + 2, size, '#fff', 'right');
    ctx.restore();
    return w;
  }

  // scene title: tag + headline (1 or 2 lines), right-aligned under the header
  function sceneTitle(lt, kicker, lines, acc) {
    const xr = W - 70;
    tag(kicker, xr, Y(24), 30, prog(lt, 0.05, 0.5), acc);
    lines.forEach((ln, i) => wipeText(ln, xr, Y(100) + i * 76, 62, C.ink, prog(lt, 0.25 + i * 0.15, 0.85 + i * 0.15)));
  }
  // big headline number with a soft colour halo
  function bigNumber(s, x, y, size, color, alpha) {
    if (alpha <= 0) return;
    ctx.save(); ctx.shadowColor = tint(color, 0.28); ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
    text(s, x, y, size, color, 'center', alpha, 'ltr');
    ctx.restore();
  }

  // ---------- scenes ----------
  const SCENES = [];
  const scene = (d, opts) => { const t0 = SCENES.length ? SCENES[SCENES.length - 1].t1 : 0; SCENES.push({ t0, t1: t0 + d, ...opts }); };

  // 0. title
  scene(5.2, { chrome: false, acc: C.coral, draw(lt) {
    const cam = { lon: 3.5, lat: 26.5, w: lerp(62, 54, prog(lt, 0, 5.2)) };
    const rect = { x: 0, y: FORMAT === 'story' ? 380 : 180, w: W, h: 1000 };
    const wave = lt * 14, tr = MAIN.getTransform(), ga = MAIN.globalAlpha;
    masked(rect, 220, () => {
      ctx.setTransform(tr); ctx.globalAlpha = ga * 0.6;
      drawGrid(cam, rect, (ci, lon, my) => {
        if (!MAGHREB.has(ci)) return null;
        const d = Math.hypot(lon + 15.9, my - mercY(18.1));   // from Nouakchott
        const a = clamp((wave - d) / 4);
        return [mix(LAND, FILL[ci], a), 0.55 + 0.45 * a];
      }, 0.4);
    });
    // keep the centre readable
    const cy = FORMAT === 'story' ? 960 : 700;
    const g = ctx.createRadialGradient(W / 2, cy, 80, W / 2, cy, 620);
    g.addColorStop(0, 'rgba(244,247,250,0.95)'); g.addColorStop(1, 'rgba(244,247,250,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const lp = eout(prog(lt, 0.15, 1.0));
    drawLogo(W / 2, cy - 330 + (1 - lp) * 30, 230, lp);
    const tw = measure('إنفوجرافيك', 32) + 45;
    tag('إنفوجرافيك', W / 2 + tw / 2, cy - 150, 32, prog(lt, 0.9, 1.4), C.blue);
    wipeText('بطالة الشباب', W / 2, cy - 40, 128, C.ink, prog(lt, 1.15, 1.8), 'center');
    wipeText('في المغرب العربي', W / 2, cy + 90, 92, C.blue, prog(lt, 1.4, 2.05), 'center');
    rainbow(W / 2, cy + 166, 300, 9, prog(lt, 1.8, 2.4));
    text('الشباب من 15 إلى 24 سنة · أحدث الأرقام حتى نوفمبر 2026', W / 2, cy + 225, 34, C.mute, 'center', eout(prog(lt, 2.0, 2.6)));
    // the five countries, each in its colour
    const list = ['478', '504', '012', '788', '434'].map(id => ({ id, name: ILO.find(c => c.id === id).name }));
    const ws = list.map(c => measure(c.name, 32) + 48), gap = 14;
    let x = W / 2 + (ws.reduce((a, b) => a + b, 0) + gap * 4) / 2;
    list.forEach((c, i) => {
      const p = eback(prog(lt, 2.4 + i * 0.12, 2.9 + i * 0.12));
      if (p > 0) {
        ctx.save(); ctx.translate(x - ws[i] / 2, cy + 315); ctx.scale(p, p);
        shadow(16, 6, 0.12); ctx.fillStyle = COUNTRY[c.id].fill; rrect(-ws[i] / 2, -29, ws[i], 58, 29); ctx.fill(); noShadow();
        text(c.name, 0, 2, 32, COUNTRY[c.id].on, 'center');
        ctx.restore();
      }
      x -= ws[i] + gap;
    });
    sitePill(W / 2, cy + 410, 30, eout(prog(lt, 3.1, 3.6)));
  } });

  // 1. the region against the world
  scene(6.8, { acc: C.amber, src: 'المصدر: منظمة العمل الدولية، اتجاهات تشغيل الشباب في العالم 2026 (بيانات 2025)', draw(lt) {
    sceneTitle(lt, 'السياق العالمي', ['شمال إفريقيا: ثاني أعلى', 'بطالة شباب في العالم'], C.amber);
    const cols = [
      { name: 'العالم', v: WORLD, c: C.slate },
      { name: 'شمال إفريقيا', v: NAFR, c: C.coral, hi: true },
      { name: 'الدول العربية', v: ARAB, c: C.amber },
    ];
    const base = Y(860), maxH = Y(860) - Y(330), cw = 210, gap = 80;
    const total = cols.length * cw + (cols.length - 1) * gap;
    for (let g = 0; g <= 30; g += 10) {
      const y = base - maxH * g / 30;
      ctx.fillStyle = 'rgba(27,38,53,0.08)'; ctx.fillRect(110, y, W - 220, 2);
      text(g + '%', 100, y, 24, C.faint, 'right', prog(lt, 0.6, 1.0), 'ltr');
    }
    cols.forEach((c, i) => {
      const x = W / 2 + total / 2 - cw - i * (cw + gap);   // right to left
      const p = eio(prog(lt, 0.9 + i * 0.35, 2.1 + i * 0.35));
      const h = maxH * c.v / 30 * p;
      ctx.save(); shadow(30, 12, c.hi ? 0.2 : 0.1);
      ctx.fillStyle = c.c; rrect(x, base - h, cw, h, 16); ctx.fill();
      ctx.restore();
      if (p > 0) text(fmt(c.v * p) + '%', x + cw / 2, base - h - 42, c.hi ? 64 : 52, c.hi ? C.coral : C.ink, 'center', 1, 'ltr');
      text(c.name, x + cw / 2, base + 46, 36, c.hi ? C.coral : C.ink, 'center', prog(lt, 0.9 + i * 0.35, 1.4 + i * 0.35));
    });
    text('أكثر من شاب من كل خمسة يبحث عن عمل ولا يجده', W / 2, Y(990), 38, C.ink, 'center', prog(lt, 3.6, 4.2));
  } });

  // 2. the map
  scene(8.4, { acc: C.blue, src: 'المصدر: تقديرات منظمة العمل الدولية المنمذجة لعام 2025 (البنك الدولي)', draw(lt) {
    sceneTitle(lt, 'الخريطة', ['نسبة البطالة بين الشباب', 'في دول المغرب العربي'], C.blue);
    const cam = { lon: 3.6, lat: 27.0, w: lerp(46, 44, prog(lt, 0, 8.4)) };
    const rect = { x: 20, y: Y(250), w: W - 40, h: Y(900) - Y(250) };
    const order = ['478', '504', '012', '788', '434'];
    const startOf = {}; order.forEach((id, i) => { startOf[idIndex[id]] = 0.9 + i * 0.75; });
    const mp = eout(prog(lt, 0.2, 0.9)), tr = MAIN.getTransform(), ga = MAIN.globalAlpha;
    const P = masked(rect, 70, () => {
      ctx.setTransform(tr); ctx.globalAlpha = ga * mp;
      const P = drawGrid(cam, rect, (ci, lon, my) => {
        if (ci === WSAHARA) return [[176, 185, 198], 0.85];
        if (!MAGHREB.has(ci)) return null;
        const c = VAL[ci], e = lt - startOf[ci];
        const d = Math.hypot(lon - c.at[0], my - mercY(c.at[1]));
        const a = clamp((e * 22 - d) / 3);
        return [mix([196, 205, 216], FILL[ci], a), 1];
      });
      strokeLines(P, MD.borders, 'rgba(255,255,255,0.95)', 2);
      return P;
    });
    // labels: white cards, value in ink, name in the country's colour
    ILO.slice().reverse().forEach(c => {
      const e = lt - startOf[idIndex[c.id]] - 0.25;
      const p = eback(prog(e, 0, 0.5));
      if (p <= 0) return;
      const [ax, ay] = P(c.at[0], c.at[1]);
      const [lx, ly] = c.label ? P(c.label[0], c.label[1]) : [ax, ay];
      if (c.label) {
        ctx.save(); ctx.globalAlpha = clamp(e * 3);
        ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(lx, ly); ctx.stroke();
        ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      const big = fmt(c.v * eout(prog(e, 0, 0.9))) + '%';
      const bw = Math.max(measure(big, 46), measure(c.name, 26)) + 40, bh = 96;
      ctx.save(); ctx.translate(lx, ly); ctx.scale(p, p);
      shadow(22, 8, 0.18);
      ctx.fillStyle = C.card; rrect(-bw / 2, -bh / 2, bw, bh, 16); ctx.fill();
      noShadow();
      ctx.fillStyle = COUNTRY[c.id].fill; rrect(-bw / 2, bh / 2 - 9, bw, 9, 4); ctx.fill();
      text(big, 0, -12, 46, C.dark, 'center', 1, 'ltr');
      text(c.name, 0, 26, 26, COUNTRY[c.id].text, 'center');
      ctx.restore();
    });
    text('الفئة العمرية من 15 إلى 24 سنة', W / 2, Y(975), 32, C.mute, 'center', prog(lt, 4.8, 5.4));
  } });

  // 3. ranking
  scene(7.6, { acc: C.coral, src: 'المصدر: تقديرات منظمة العمل الدولية المنمذجة لعام 2025 (البنك الدولي)', draw(lt) {
    sceneTitle(lt, 'الترتيب', ['ليبيا في الصدارة بأربعة', 'أضعاف المتوسط العالمي'], C.coral);
    const xr = W - 70, nameW = 190, x0 = xr - nameW, x1 = 90;   // bars grow leftwards from x0
    const span = x0 - x1, maxV = 55;
    const rowH = (Y(900) - Y(300)) / ILO.length;
    ILO.forEach((c, i) => {
      const y = Y(300) + rowH * (i + 0.5);
      ctx.fillStyle = C.track; rrect(x1, y - 32, span, 64, 32); ctx.fill();
    });
    // world average marker (behind the bars)
    const wp = prog(lt, 2.8, 3.4);
    const wx = x0 - span * WORLD / maxV;
    if (wp > 0) {
      ctx.save(); ctx.globalAlpha = wp;
      ctx.strokeStyle = C.slate; ctx.lineWidth = 3; ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(wx, Y(300) - 10); ctx.lineTo(wx, Y(300) - 10 + (Y(910) - Y(300)) * eout(wp)); ctx.stroke();
      ctx.restore();
    }
    ILO.forEach((c, i) => {
      const y = Y(300) + rowH * (i + 0.5), K = COUNTRY[c.id];
      const p = eio(prog(lt, 0.8 + i * 0.25, 2.0 + i * 0.25));
      const ap = prog(lt, 0.7 + i * 0.25, 1.1 + i * 0.25);
      text(c.name, xr, y, 44, K.text, 'right', ap);
      const w = Math.max(64 * clamp(p * 4), span * c.v / maxV * p);
      if (p > 0) {
        ctx.save(); shadow(18, 6, 0.12);
        ctx.fillStyle = K.fill; rrect(x0 - w, y - 32, w, 64, 32); ctx.fill();
        ctx.restore();
      }
      if (p > 0.05) {
        const s = fmt(c.v * p) + '%';
        const inside = w > measure(s, 40) + 50;
        text(s, inside ? x0 - w + 26 : x0 - w - 16, y + 2, 40, inside ? K.on : C.ink, inside ? 'left' : 'right', 1, 'ltr');
      }
    });
    if (wp > 0) {
      const lbl = 'المتوسط العالمي 12.4%';
      const lw = measure(lbl, 28) + 34;
      ctx.save(); ctx.globalAlpha = wp;
      ctx.fillStyle = C.slate; rrect(wx - lw / 2, Y(950) - 25, lw, 50, 25); ctx.fill();
      ctx.restore();
      text(lbl, wx, Y(950) + 1, 28, '#fff', 'center', wp);
    }
  } });

  // 4. Libya: one in two
  scene(6.0, { acc: C.coral, src: 'المصدر: منظمة العمل الدولية، اتجاهات تشغيل الشباب في العالم 2026', draw(lt) {
    sceneTitle(lt, 'ليبيا', ['شاب من كل اثنين في سوق', 'العمل الليبية بلا وظيفة'], C.coral);
    const p = prog(lt, 0.6, 2.2);
    bigNumber(fmt(50.1 * eout(p)) + '%', W / 2, Y(430), 210, C.coral, clamp(p * 3));
    text('نسبة البطالة بين الشباب الليبيين في 2025', W / 2, Y(560), 38, C.ink, 'center', prog(lt, 1.4, 2.0));
    pictoRow(10, 5, W / 2, Y(740), 120, 34, 1.6, lt, C.coral);
    text('الأعلى في شمال إفريقيا', W / 2, Y(980), 40, C.coral, 'center', prog(lt, 3.2, 3.8));
  } });

  // 5. the latest official national figures
  scene(8.6, { acc: C.green, src: 'المصادر: المندوبية السامية للتخطيط (المغرب) · المعهد الوطني للإحصاء (تونس)', draw(lt) {
    sceneTitle(lt, 'أحدث الأرقام الرسمية', ['بطالة الشباب في 2026', 'وفق الإحصاءات الوطنية'], C.green);
    const cards = [
      { id: '504', name: 'المغرب', period: 'الربع الثالث 2026', v: 30.5, prev: 27.2, prevLbl: 'الربع الثاني', up: true, note: 'ارتفاع 3.3 نقاط' },
      { id: '788', name: 'تونس', period: 'الربع الثاني 2026', v: 35.4, prev: 37.5, prevLbl: 'الربع الأول', up: false, note: 'تراجع 2.1 نقطة' },
    ];
    const ch = (Y(900) - Y(280) - 40) / 2;
    cards.forEach((c, i) => {
      const y = Y(280) + i * (ch + 40), t0 = 0.8 + i * 0.9, K = COUNTRY[c.id];
      const p = eout(prog(lt, t0, t0 + 0.6));
      if (p <= 0) return;
      const x = 70 + (1 - p) * 80, w = W - 140;
      ctx.save(); ctx.globalAlpha = p;
      shadow(34, 14, 0.12); ctx.fillStyle = C.panel; rrect(x, y, w, ch, 26); ctx.fill(); noShadow();
      ctx.fillStyle = K.fill; rrect(x + w - 14, y + 26, 14, ch - 52, 7); ctx.fill();
      text(c.name, x + w - 48, y + 62, 54, K.text);
      text(c.period, x + w - 48, y + 124, 32, C.mute);
      // trend: previous -> current
      const tp = eio(prog(lt, t0 + 0.7, t0 + 1.6));
      const sx1 = x + w - 48, sx0 = x + w - 330, sy = y + ch - 70;
      const mid = (c.v + c.prev) / 2;
      const yv = v => sy - (v - mid) / 12 * 70;
      const col = c.up ? C.up : C.down;
      ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx0, yv(c.prev)); ctx.lineTo(lerp(sx0, sx1, tp), lerp(yv(c.prev), yv(c.v), tp)); ctx.stroke();
      ctx.fillStyle = C.faint; ctx.beginPath(); ctx.arc(sx0, yv(c.prev), 8, 0, 7); ctx.fill();
      if (tp > 0.98) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sx1, yv(c.v), 11, 0, 7); ctx.fill(); }
      text(fmt(c.prev) + '%', sx0, yv(c.prev) + (c.up ? 34 : -34), 26, C.mute, 'center', 1, 'ltr');
      text(c.prevLbl, sx0 - 18, yv(c.prev), 24, C.faint, 'right');
      ctx.restore();
      const np = prog(lt, t0 + 0.3, t0 + 1.5);
      text(fmt(c.v * eout(np)) + '%', x + 50, y + ch / 2 - 18, 120, C.ink, 'left', p, 'ltr');
      const nw = measure(c.note, 30) + 56;
      const ap = prog(lt, t0 + 1.4, t0 + 1.9);
      if (ap > 0) {
        ctx.save(); ctx.globalAlpha = ap;
        ctx.fillStyle = tint(col, 0.14); rrect(x + 50, y + ch / 2 + 50, nw, 52, 26); ctx.fill();
        const axc = x + 50 + nw - 28, ayc = y + ch / 2 + 76;
        ctx.fillStyle = col; ctx.beginPath();
        if (c.up) { ctx.moveTo(axc, ayc - 10); ctx.lineTo(axc + 9, ayc + 7); ctx.lineTo(axc - 9, ayc + 7); }
        else { ctx.moveTo(axc, ayc + 10); ctx.lineTo(axc + 9, ayc - 7); ctx.lineTo(axc - 9, ayc - 7); }
        ctx.fill();
        ctx.restore();
        text(c.note, x + 50 + nw - 48, y + ch / 2 + 77, 30, col, 'right', ap);
      }
    });
    text('تختلف الأرقام الوطنية عن تقديرات المنظمة الدولية لاختلاف المنهجية والفترة', W / 2, Y(975), 28, C.mute, 'center', prog(lt, 3.6, 4.2));
  } });

  // 6. young women
  scene(7.2, { acc: C.purple, src: 'المصادر: منظمة العمل الدولية (الجزائر 2025) · المعهد الوطني للإحصاء (تونس، الربع الثاني 2026)', draw(lt) {
    sceneTitle(lt, 'الفجوة بين الجنسين', ['الشابات يدفعن', 'الثمن الأكبر'], C.purple);
    const groups = [
      { id: '012', name: 'الجزائر', sub: 'تقديرات 2025', f: 45.0, m: 26.5 },
      { id: '788', name: 'تونس', sub: 'الربع الثاني 2026', f: 37.1, m: 34.6 },
    ];
    const xr = W - 70, labelW = 230, x0 = xr - labelW, x1 = 90, span = x0 - x1, maxV = 50;
    const gh = (Y(860) - Y(300)) / 2;
    groups.forEach((g, gi) => {
      const y = Y(300) + gi * gh + 30, t0 = 0.8 + gi * 0.9;
      const ap = prog(lt, t0 - 0.1, t0 + 0.4);
      text(g.name, xr, y + 48, 48, C.ink, 'right', ap);
      text(g.sub, xr, y + 102, 26, C.mute, 'right', ap);
      [['الشابات', g.f, C.purple, '#fff'], ['الشبان', g.m, C.cyan, C.dark]].forEach(([lbl, v, col, on], k) => {
        const by = y + 30 + k * 82;
        const p = eio(prog(lt, t0 + k * 0.2, t0 + 1.1 + k * 0.2));
        const w = span * v / maxV * p;
        ctx.fillStyle = C.track; rrect(x1, by, span, 60, 30); ctx.fill();
        if (w > 1) { ctx.fillStyle = col; rrect(x0 - w, by, w, 60, 30); ctx.fill(); }
        if (p > 0.05) {
          text(lbl, x0 - 24, by + 32, 28, on, 'right', clamp((w - 140) / 40));
          text(fmt(v * p) + '%', x0 - w - 16, by + 32, 38, C.ink, 'right', 1, 'ltr');
        }
      });
    });
    const cp = prog(lt, 3.4, 4.0);
    if (cp > 0) {
      const s = 'في الجزائر: بطالة الشابات أعلى بنحو 1.7 مرة';
      const w = measure(s, 36) + 60;
      ctx.save(); ctx.globalAlpha = cp;
      shadow(20, 8, 0.15); ctx.fillStyle = C.purple; rrect(W / 2 - w / 2, Y(950) - 34, w, 68, 34); ctx.fill();
      ctx.restore();
      text(s, W / 2, Y(950) + 1, 36, '#fff', 'center', cp);
    }
  } });

  // 7. NEET
  scene(6.4, { acc: C.orange, src: 'المصدر: منظمة العمل الدولية، اتجاهات تشغيل الشباب في العالم 2026 (بيانات 2025)', draw(lt) {
    sceneTitle(lt, 'خارج العمل والدراسة', ['3 من كل 10 شباب في', 'شمال إفريقيا خارج الحسابات'], C.orange);
    const p = prog(lt, 0.6, 2.0);
    bigNumber(fmt(NEET_NAFR * eout(p)) + '%', W / 2, Y(420), 190, C.orange, clamp(p * 3));
    text('لا يعملون ولا يدرسون ولا يتلقون تدريبا', W / 2, Y(545), 40, C.ink, 'center', prog(lt, 1.3, 1.9));
    pictoRow(10, 3, W / 2, Y(730), 120, 34, 1.5, lt, C.orange);
    text('المعدل العالمي: 20%', W / 2, Y(975), 38, C.slate, 'center', prog(lt, 3.2, 3.8));
  } });

  // 8. sources
  scene(4.6, { acc: C.blue, draw(lt) {
    sceneTitle(lt, 'المنهجية', ['المصادر'], C.blue);
    const rows = [
      ['منظمة العمل الدولية', 'تقرير اتجاهات تشغيل الشباب في العالم 2026', C.coral],
      ['البنك الدولي', 'تقديرات منظمة العمل الدولية المنمذجة لعام 2025', C.amber],
      ['المندوبية السامية للتخطيط', 'المغرب، الربع الثالث 2026', C.blue],
      ['المعهد الوطني للإحصاء', 'تونس، الربع الثاني 2026', C.orange],
    ];
    rows.forEach((r, i) => {
      const y = Y(270) + i * 150 * SP, p = prog(lt, 0.5 + i * 0.2, 1.0 + i * 0.2);
      ctx.save(); ctx.globalAlpha = eout(p);
      ctx.fillStyle = r[2]; rrect(W - 80, y - 4, 10, 92, 5); ctx.fill();
      ctx.restore();
      wipeText(r[0], W - 100, y + 22, 42, C.ink, p);
      wipeText(r[1], W - 100, y + 70, 30, C.mute, prog(lt, 0.65 + i * 0.2, 1.15 + i * 0.2));
    });
    text('الشباب: الفئة العمرية من 15 إلى 24 سنة', W - 100, Y(900), 32, C.blue, 'right', prog(lt, 1.6, 2.1));
  } });

  // 9. outro
  scene(6.8, { chrome: false, outro: true, acc: C.coral, draw(lt) {
    const cy = FORMAT === 'story' ? 820 : 520;
    const lp = eout(prog(lt, 0.1, 0.9));
    const cam = { lon: 3.5, lat: 26.5, w: lerp(56, 50, prog(lt, 0, 6.8)) };
    const orect = { x: 0, y: cy - 200, w: W, h: 1100 }, tr = MAIN.getTransform(), ga = MAIN.globalAlpha;
    masked(orect, 240, () => {
      ctx.setTransform(tr); ctx.globalAlpha = ga * lp * 0.45;
      drawGrid(cam, orect, (ci) => (MAGHREB.has(ci) ? [FILL[ci], 1] : null), 0.5);
    });
    const g = ctx.createRadialGradient(W / 2, cy + 120, 60, W / 2, cy + 120, 600);
    g.addColorStop(0, 'rgba(244,247,250,0.96)'); g.addColorStop(1, 'rgba(244,247,250,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // the header logo glides to the centre
    const gp = eio(prog(lt, 0.1, 1.1));
    drawLogo(lerp(L.logo.x, W / 2, gp), lerp(L.logo.y, cy, gp), lerp(L.logo.h, 300, gp));
    text('بطالة الشباب في المغرب العربي', W / 2, cy + 230, 50, C.ink, 'center', eout(prog(lt, 0.9, 1.5)));
    rainbow(W / 2, cy + 280, 220, 7, prog(lt, 1.1, 1.7));
    text('تابعونا على', W / 2, cy + 360, 30, C.mute, 'center', eout(prog(lt, 1.3, 1.8)));
    const S = 72, gap = 16;
    [{ icons: ['facebook', 'tiktok', 'youtube'], handle: 'ERRIWAYA' }, { icons: ['instagram'], handle: 'ERRIWAYA.MR' }, { icons: ['web'], handle: 'erriwaya.com', web: true }].forEach((row, ri) => {
      const y = cy + 420 + ri * 112;
      const tw = measure(row.handle, 46);
      const iw = row.icons.length * S + (row.icons.length - 1) * gap, total = iw + 30 + tw, x0 = W / 2 - total / 2;
      const rp = prog(lt, 1.5 + ri * 0.25, 2.1 + ri * 0.25);
      if (rp <= 0) return;
      ctx.save(); ctx.globalAlpha = eout(rp);
      shadow(30, 10, 0.12); ctx.fillStyle = C.card; rrect(x0 - 18, y - 12, total + 54, S + 24, (S + 24) / 2); ctx.fill(); noShadow();
      row.icons.forEach((ic, i) => {
        const ip = eback(prog(lt, 1.55 + ri * 0.25 + i * 0.08, 2.0 + ri * 0.25 + i * 0.08));
        ctx.save(); ctx.translate(x0 + i * (S + gap) + S / 2, y + S / 2); ctx.scale(ip, ip);
        ctx.fillStyle = row.web ? C.blue : C.dark; rrect(-S / 2, -S / 2, S, S, S * 0.3); ctx.fill();
        if (ic === 'web') { globe(0, 0, S * 0.3); ctx.restore(); return; }
        ctx.translate(-S / 2 + S * 0.22, -S / 2 + S * 0.22); ctx.scale(S * 0.56 / 24, S * 0.56 / 24);
        ctx.fillStyle = '#fff'; ctx.fill(new Path2D(window.ICONS[ic]));
        ctx.restore();
      });
      ctx.restore();
      text(row.handle, x0 + iw + 30 + (1 - eout(rp)) * 20, y + S / 2 + 3, 46, C.dark, 'left', eout(rp), 'ltr');
    });
  } });

  const DURATION = SCENES[SCENES.length - 1].t1;
  const CONTENT = SCENES.filter(s => s.chrome !== false);

  // ---------- background: paper, faint dot grid, two soft blobs in the scene colour, drifting shapes ----------
  const SHAPES = Array.from({ length: 14 }, (_, i) => {
    const r = n => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
    return { x: r(1) * W, y: r(2) * H, s: 8 + r(3) * 16, k: Math.floor(r(4) * 3), c: [C.blue, C.slate, C.green, C.blue, C.orange, C.slate][i % 6], sp: 6 + r(5) * 10, ph: r(6) * 6.28 };
  });
  function background(t, acc) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.paper); g.addColorStop(1, C.paper2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const step = 36, off = (t * 6) % step;
    ctx.fillStyle = 'rgba(27,38,53,0.06)';
    for (let y = -step + off; y < H + step; y += step) for (let x = (Math.floor(y / step) % 2) * step / 2; x < W; x += step) ctx.fillRect(x, y, 2.5, 2.5);
    const blob = (x, y, r, a, col) => {
      const rg = ctx.createRadialGradient(x, y, 10, x, y, r);
      rg.addColorStop(0, tint(col, a)); rg.addColorStop(1, tint(col, 0));
      ctx.fillStyle = rg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    blob(80 + Math.sin(t * 0.3) * 40, 260, 560, 0.14, C.blue);
    blob(W - 60, H - 220 + Math.cos(t * 0.25) * 40, 620, 0.1, C.green);
    // small geometric confetti: rings, dots and plus signs drifting upwards
    SHAPES.forEach(s => {
      const y = ((s.y - t * s.sp) % H + H) % H, x = s.x + Math.sin(t * 0.6 + s.ph) * 14;
      ctx.save(); ctx.globalAlpha = 0.28; ctx.translate(x, y); ctx.rotate(t * 0.3 + s.ph);
      ctx.strokeStyle = s.c; ctx.fillStyle = s.c; ctx.lineWidth = 4;
      if (s.k === 0) { ctx.beginPath(); ctx.arc(0, 0, s.s, 0, 7); ctx.stroke(); }
      else if (s.k === 1) { ctx.beginPath(); ctx.arc(0, 0, s.s * 0.45, 0, 7); ctx.fill(); }
      else { ctx.fillRect(-s.s, -2.5, s.s * 2, 5); ctx.fillRect(-2.5, -s.s, 5, s.s * 2); }
      ctx.restore();
    });
  }

  // header (logo + programme line), source line and the scene progress bar
  function chrome(t, a, sc) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    drawLogo(L.logo.x, L.logo.y, L.logo.h);
    const lw = L.logo.h * LOGO.width / LOGO.height;
    const xr = L.logo.x - lw / 2 - 26;
    ctx.fillStyle = 'rgba(27,38,53,0.2)'; ctx.fillRect(xr, L.logo.y - 34, 2, 68);
    text('بطالة الشباب في المغرب العربي', xr - 22, L.logo.y - 14, 32, C.ink);
    text('إنفوجرافيك · نوفمبر 2026', xr - 22, L.logo.y + 24, 24, C.blue);
    ctx.save(); ctx.globalAlpha *= 0.9; globe(84, L.logo.y, 13, C.blue); ctx.restore();
    text('erriwaya.com', 108, L.logo.y + 2, 28, C.mute, 'left', 0.9, 'ltr');
    // progress: one segment per content scene, right to left, each in its scene colour
    const n = CONTENT.length, gap = 10, x0 = 70, x1 = W - 70, sw = (x1 - x0 - gap * (n - 1)) / n;
    CONTENT.forEach((s, i) => {
      const x = x1 - (i + 1) * sw - i * gap;
      ctx.fillStyle = 'rgba(27,38,53,0.1)'; rrect(x, L.prog, sw, 7, 3.5); ctx.fill();
      const f = prog(t, s.t0, s.t1);
      if (f > 0) { ctx.fillStyle = s.acc; rrect(x + sw * (1 - f), L.prog, sw * f, 7, 3.5); ctx.fill(); }
    });
    ctx.restore();
    if (sc && sc.src) {
      const fa = Math.min(prog(t, sc.t0 + 0.4, sc.t0 + 0.9), 1 - prog(t, sc.t1 - 0.35, sc.t1));
      text(sc.src, W - 70, L.src, 24, C.faint, 'right', a * fa);
    }
  }

  function renderFrame(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    const sc = SCENES.find(s => t >= s.t0 && t < s.t1) || SCENES[SCENES.length - 1];
    background(t, sc.acc);
    // header shows from the end of the title to the start of the outro
    const c0 = CONTENT[0].t0, c1 = CONTENT[CONTENT.length - 1].t1;
    chrome(t, Math.min(prog(t, c0 - 0.1, c0 + 0.5), 1 - prog(t, c1 - 0.05, c1 + 0.15)), sc.chrome === false ? null : sc);
    const lt = t - sc.t0, d = sc.t1 - sc.t0;
    // scene transition: fade + slight rise in, fade + lift out (the outro holds to the end)
    const ain = eout(prog(lt, 0, 0.45));
    const aout = sc.outro ? 1 : 1 - eio(prog(lt, d - 0.4, d));
    ctx.save();
    ctx.globalAlpha = ain * aout;
    ctx.translate(0, (1 - ain) * 30 - (1 - aout) * 30);
    sc.draw(lt);
    ctx.restore();
    // a colour wipe marks each change of scene
    const sw = prog(lt, 0, 0.55);
    if (sc.t0 > 0 && sw < 1) {
      const x = W - W * 1.3 * eio(sw);
      const g = ctx.createLinearGradient(x - 160, 0, x + 160, 0);
      g.addColorStop(0, tint(sc.acc, 0)); g.addColorStop(0.5, tint(sc.acc, 0.14)); g.addColorStop(1, tint(sc.acc, 0));
      ctx.fillStyle = g; ctx.fillRect(x - 160, 0, 320, H);
    }
  }

  window.renderFrame = renderFrame;
  window.DURATION = DURATION;
  window.SCENE_STARTS = SCENES.map(s => s.t0);
  window.OUTRO = SCENES[SCENES.length - 1].t0;
  Promise.all([
    document.fonts.load(font(40)),
    new Promise(r => { if (LOGO.complete && LOGO.naturalWidth) r(); else { LOGO.onload = r; LOGO.onerror = r; } }),
  ]).then(() => { LOGO_INK = inkLogo(); renderFrame(0); window.READY = true; });
})();
