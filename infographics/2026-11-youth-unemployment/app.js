// Erriwaya infographic: youth unemployment in the Maghreb (Nov 2026). Draws one frame with renderFrame(t).
// ?format=feed (1080x1350, Facebook portrait, default) or ?format=story (1080x1920, Reels/Stories/TikTok).
(() => {
  const FORMAT = new URLSearchParams(location.search).get('format') || 'feed';
  const W = 1080, H = FORMAT === 'story' ? 1920 : 1350;
  const MD = window.MAP_DATA;

  // ---------- data (all checked against the sources listed in README.md) ----------
  // ILO modelled estimates 2025, youth 15-24 (World Bank WDI, Feb 2026 release)
  const ILO = [
    { id: '434', name: 'ليبيا', v: 50.1, at: [17.5, 27.0] },
    { id: '788', name: 'تونس', v: 38.1, at: [9.4, 34.0], label: [13.6, 36.6] },
    { id: '012', name: 'الجزائر', v: 29.4, at: [2.6, 28.0] },
    { id: '478', name: 'موريتانيا', v: 22.9, at: [-10.4, 20.6] },
    { id: '504', name: 'المغرب', v: 21.9, at: [-6.2, 32.0], label: [-13.6, 33.6] },
  ];
  const WORLD = 12.4, NAFR = 22.6, ARAB = 26.2, NEET_NAFR = 30.1, NEET_WORLD = 20;

  // ---------- palette (Erriwaya broadcast look) ----------
  const C = {
    navy: '#0B1F4B', deep: '#071433', panel: '#12295C', line: 'rgba(255,255,255,0.14)',
    green: '#10B981', greenD: '#0A8F65', greenL: '#34D399', mint: '#A7F3D0',
    white: '#FFFFFF', mute: 'rgba(255,255,255,0.62)', faint: 'rgba(255,255,255,0.35)', red: '#F0565B',
  };

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
    OCTX.globalCompositeOperation = 'destination-in';
    const gv = OCTX.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    const fy = Math.min(0.49, feather / rect.h);
    gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(fy, '#000'); gv.addColorStop(1 - fy, '#000'); gv.addColorStop(1, 'rgba(0,0,0,0)');
    OCTX.fillStyle = gv; OCTX.fillRect(0, 0, W, H);
    OCTX.globalCompositeOperation = 'destination-in';
    const gh = OCTX.createLinearGradient(rect.x, 0, rect.x + rect.w, 0);
    const fx = Math.min(0.49, feather / rect.w);
    gh.addColorStop(0, 'rgba(0,0,0,0)'); gh.addColorStop(fx, '#000'); gh.addColorStop(1 - fx, '#000'); gh.addColorStop(1, 'rgba(0,0,0,0)');
    OCTX.fillStyle = gh; OCTX.fillRect(0, 0, W, H);
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
  const mix = (a, b, p) => a.map((v, i) => Math.round(v + (b[i] - v) * p));
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const font = s => `${s}px AlQuds`;
  const fmt = v => v.toFixed(1);

  function rrect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
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

  // ---------- assets ----------
  const LOGO = new Image();
  LOGO.src = '../../assets/logo-mark.png';
  function drawLogo(cx, cy, h, alpha = 1) {
    if (alpha <= 0) return;
    const w = h * LOGO.width / LOGO.height;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
    ctx.drawImage(LOGO, cx - w / 2, cy - h / 2, w, h);
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

  function projector(cam, rect) {
    const k = rect.w / cam.w;
    const ox = rect.x + rect.w / 2, oy = rect.y + rect.h / 2, cy = mercY(cam.lat);
    const f = (lon, lat) => [ox + (lon - cam.lon) * k, oy - (mercY(lat) - cy) * k];
    f.m = (lon, my) => [ox + (lon - cam.lon) * k, oy - (my - cy) * k];
    f.k = k;
    return f;
  }
  // colour scale for the rates: 20% deep green -> 35% brand green -> 50% mint
  const SCALE = [[20, [12, 96, 82]], [35, [16, 185, 129]], [50, [190, 248, 222]]];
  function scaleRGB(v) {
    if (v <= SCALE[0][0]) return SCALE[0][1];
    for (let i = 1; i < SCALE.length; i++) if (v <= SCALE[i][0]) return mix(SCALE[i - 1][1], SCALE[i][1], (v - SCALE[i - 1][0]) / (SCALE[i][0] - SCALE[i - 1][0]));
    return SCALE[SCALE.length - 1][1];
  }
  // cellColor(ci, lon, my) -> [rgb, alpha] | null
  function drawGrid(cam, rect, cellColor, landA = 0.1) {
    const P = projector(cam, rect);
    const k = P.k, cell = MD.cell, size = cell * k, sq = Math.max(1, size * 0.78);
    const halfW = rect.w / 2 / k, halfH = rect.h / 2 / k, cy = mercY(cam.lat);
    const c0 = Math.max(0, Math.floor((cam.lon - halfW - MD.box.lon0) / cell) - 1);
    const c1 = Math.min(MD.cols - 1, Math.ceil((cam.lon + halfW - MD.box.lon0) / cell) + 1);
    const r0 = Math.max(0, Math.floor((GY1 - (cy + halfH)) / cell) - 1);
    const r1 = Math.min(MD.rows - 1, Math.ceil((GY1 - (cy - halfH)) / cell) + 1);
    const land = new Path2D(), sea = new Path2D(), singles = [];
    const dot = Math.max(1, size * 0.14);
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
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill(sea);
    ctx.fillStyle = `rgba(255,255,255,${landA})`; ctx.fill(land);
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
  function pictoRow(n, on, cx, by, h, gap, t0, lt) {
    const per = 5, total = per * h * 0.62 + (per - 1) * gap;
    for (let i = 0; i < n; i++) {
      // reading order: right to left, then the next row
      const x = cx + total / 2 - h * 0.31 - (i % per) * (h * 0.62 + gap);
      const y = by + Math.floor(i / per) * h * 1.08;
      const p = eback(prog(lt, t0 + i * 0.07, t0 + i * 0.07 + 0.45));
      const lit = i < on && lt > t0 + 0.6 + i * 0.1;
      ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
      person(0, 0, h, lit ? C.greenL : 'rgba(255,255,255,0.22)');
      ctx.restore();
    }
  }

  // tag pill (green, square corners, slanted left edge: the broadcast story tag)
  function tag(s, xr, y, size, p, color = C.greenD) {
    if (p <= 0) return 0;
    const w = measure(s, size) + size * 1.2, h = size * 1.7, sl = h * 0.35;
    const vis = (w + sl) * eout(p);
    ctx.save();
    ctx.beginPath(); ctx.rect(xr - vis, y - h, vis, h * 2); ctx.clip();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(xr, y - h / 2); ctx.lineTo(xr - w, y - h / 2); ctx.lineTo(xr - w - sl, y + h / 2); ctx.lineTo(xr, y + h / 2); ctx.closePath(); ctx.fill();
    text(s, xr - size * 0.6, y + 2, size, C.white, 'right');
    ctx.restore();
    return w + sl;
  }

  // scene title: tag + headline (1 or 2 lines), right-aligned under the header
  function sceneTitle(lt, kicker, lines, y0 = 0) {
    const xr = W - 70;
    tag(kicker, xr, Y(y0 + 24), 30, prog(lt, 0.05, 0.5));
    lines.forEach((ln, i) => wipeText(ln, xr, Y(y0 + 100) + i * 76, 62, C.white, prog(lt, 0.25 + i * 0.15, 0.85 + i * 0.15)));
  }

  // ---------- scenes ----------
  const SCENES = [];
  const scene = (d, opts) => { const t0 = SCENES.length ? SCENES[SCENES.length - 1].t1 : 0; SCENES.push({ t0, t1: t0 + d, ...opts }); };

  // 0. title
  scene(5.2, { chrome: false, draw(lt) {
    const cam = { lon: 3.5, lat: 26.5, w: lerp(62, 54, prog(lt, 0, 5.2)) };
    const rect = { x: 0, y: FORMAT === 'story' ? 380 : 180, w: W, h: 1000 };
    const wave = lt * 14;
    const tr = MAIN.getTransform(), ga = MAIN.globalAlpha;
    masked(rect, 220, () => { ctx.setTransform(tr); ctx.globalAlpha = ga * 0.85;
    const P = drawGrid(cam, rect, (ci, lon, my) => {
      if (!MAGHREB.has(ci)) return null;
      const d = Math.hypot(lon + 15.9, my - mercY(18.1));   // from Nouakchott
      const a = clamp((wave - d) / 4);
      return a > 0 ? [mix([60, 80, 130], [16, 185, 129], a), 0.25 + 0.35 * a] : null;
    }, 0.08);
    strokeLines(P, MD.borders, 'rgba(255,255,255,0.12)', 1.2);
    });
    // keep the centre readable
    const cy = FORMAT === 'story' ? 960 : 700;
    const g = ctx.createRadialGradient(W / 2, cy, 80, W / 2, cy, 620);
    g.addColorStop(0, 'rgba(11,31,75,0.92)'); g.addColorStop(1, 'rgba(11,31,75,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const lp = eout(prog(lt, 0.15, 1.0));
    drawLogo(W / 2, cy - 330 + (1 - lp) * 30, 230, lp);
    const tp = prog(lt, 0.9, 1.4);
    const tw = measure('إنفوجرافيك', 32) + 38;
    tag('إنفوجرافيك', W / 2 + tw / 2 + 6, cy - 150, 32, tp);
    wipeText('بطالة الشباب', W / 2, cy - 40, 128, C.white, prog(lt, 1.15, 1.8), 'center');
    wipeText('في المغرب العربي', W / 2, cy + 90, 92, C.greenL, prog(lt, 1.4, 2.05), 'center');
    const lw = 220 * eout(prog(lt, 1.8, 2.3));
    ctx.fillStyle = C.green; rrect(W / 2 - lw / 2, cy + 168, lw, 6, 3); ctx.fill();
    text('الشباب من 15 إلى 24 سنة · أحدث الأرقام حتى نوفمبر 2026', W / 2, cy + 225, 34, C.mute, 'center', eout(prog(lt, 2.0, 2.6)));
    // the five countries
    const names = ['موريتانيا', 'المغرب', 'الجزائر', 'تونس', 'ليبيا'];
    const ws = names.map(n => measure(n, 32) + 44), gap = 14;
    let x = W / 2 + (ws.reduce((a, b) => a + b, 0) + gap * 4) / 2;
    names.forEach((n, i) => {
      const p = eback(prog(lt, 2.4 + i * 0.12, 2.9 + i * 0.12));
      if (p > 0) {
        ctx.save(); ctx.translate(x - ws[i] / 2, cy + 315); ctx.scale(p, p);
        ctx.strokeStyle = 'rgba(52,211,153,0.7)'; ctx.lineWidth = 2; rrect(-ws[i] / 2, -28, ws[i], 56, 28); ctx.stroke();
        text(n, 0, 2, 32, C.white, 'center');
        ctx.restore();
      }
      x -= ws[i] + gap;
    });
  } });

  // 1. the region against the world
  scene(6.8, { src: 'المصدر: منظمة العمل الدولية، اتجاهات تشغيل الشباب في العالم 2026 (بيانات 2025)', draw(lt) {
    sceneTitle(lt, 'السياق العالمي', ['شمال إفريقيا: ثاني أعلى', 'بطالة شباب في العالم']);
    const cols = [
      { name: 'العالم', v: WORLD, c: 'rgba(255,255,255,0.55)' },
      { name: 'شمال إفريقيا', v: NAFR, c: C.green, hi: true },
      { name: 'الدول العربية', v: ARAB, c: 'rgba(255,255,255,0.8)' },
    ];
    const base = Y(860), maxH = Y(860) - Y(330), cw = 210, gap = 80;
    const total = cols.length * cw + (cols.length - 1) * gap;
    // grid lines
    for (let g = 0; g <= 30; g += 10) {
      const y = base - maxH * g / 30;
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(110, y, W - 220, 2);
      text(g + '%', 100, y, 24, C.faint, 'right', prog(lt, 0.6, 1.0), 'ltr');
    }
    cols.forEach((c, i) => {
      const x = W / 2 + total / 2 - cw - i * (cw + gap);   // right to left
      const p = eio(prog(lt, 0.9 + i * 0.35, 2.1 + i * 0.35));
      const h = maxH * c.v / 30 * p;
      ctx.save();
      if (c.hi) { ctx.shadowColor = 'rgba(16,185,129,0.6)'; ctx.shadowBlur = 40; }
      ctx.fillStyle = c.c; rrect(x, base - h, cw, h, 12); ctx.fill();
      ctx.restore();
      if (p > 0) text(fmt(c.v * p) + '%', x + cw / 2, base - h - 42, c.hi ? 64 : 52, c.hi ? C.greenL : C.white, 'center', 1, 'ltr');
      text(c.name, x + cw / 2, base + 46, 36, c.hi ? C.greenL : C.white, 'center', prog(lt, 0.9 + i * 0.35, 1.4 + i * 0.35));
    });
    const np = prog(lt, 3.6, 4.2);
    text('أكثر من شاب من كل خمسة يبحث عن عمل ولا يجده', W / 2, Y(990), 38, C.white, 'center', np);
  } });

  // 2. the map
  scene(8.4, { src: 'المصدر: تقديرات منظمة العمل الدولية المنمذجة لعام 2025 (البنك الدولي)', draw(lt) {
    sceneTitle(lt, 'الخريطة', ['نسبة البطالة بين الشباب', 'في دول المغرب العربي']);
    const cam = { lon: 3.6, lat: 27.0, w: lerp(46, 44, prog(lt, 0, 8.4)) };
    const rect = { x: 20, y: Y(250), w: W - 40, h: Y(880) - Y(250) };
    const order = ['478', '504', '012', '788', '434'];
    const startOf = {}; order.forEach((id, i) => { startOf[idIndex[id]] = 0.9 + i * 0.75; });
    const mp = eout(prog(lt, 0.2, 0.9));
    const tr = MAIN.getTransform(), ga = MAIN.globalAlpha;
    const P = masked(rect, 70, () => { ctx.setTransform(tr); ctx.globalAlpha = ga * mp;
    const P = drawGrid(cam, rect, (ci, lon, my) => {
      if (ci === WSAHARA) return [[120, 135, 170], 0.32];
      if (!MAGHREB.has(ci)) return null;
      const c = VAL[ci], e = lt - startOf[ci];
      const d = Math.hypot(lon - c.at[0], my - mercY(c.at[1]));
      const a = clamp((e * 22 - d) / 3);
      return [mix([70, 92, 140], scaleRGB(c.v), a), 0.45 + 0.55 * a];
    }, 0.12);
    strokeLines(P, MD.borders, 'rgba(255,255,255,0.35)', 1.4);
    return P; });
    // labels
    ILO.slice().reverse().forEach(c => {
      const e = lt - startOf[idIndex[c.id]] - 0.25;
      const p = eback(prog(e, 0, 0.5));
      if (p <= 0) return;
      const [ax, ay] = P(c.at[0], c.at[1]);
      const [lx, ly] = c.label ? P(c.label[0], c.label[1]) : [ax, ay];
      if (c.label) {
        ctx.save(); ctx.globalAlpha = clamp(e * 3);
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(lx, ly); ctx.stroke();
        ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      const v = c.v * eout(prog(e, 0, 0.9));
      const big = fmt(v) + '%';
      const bw = Math.max(measure(big, 46), measure(c.name, 26)) + 40, bh = 96;
      ctx.save(); ctx.translate(lx, ly); ctx.scale(p, p);
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
      ctx.fillStyle = C.white; rrect(-bw / 2, -bh / 2, bw, bh, 14); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = rgb(scaleRGB(c.v)); ctx.fillRect(-bw / 2, bh / 2 - 7, bw, 7);
      text(big, 0, -12, 46, C.navy, 'center', 1, 'ltr');
      text(c.name, 0, 26, 26, C.greenD, 'center');
      ctx.restore();
    });
    // legend
    const lp = prog(lt, 4.8, 5.4);
    if (lp > 0) {
      ctx.save(); ctx.globalAlpha = lp;
      const lx0 = 200, lx1 = W - 200, ly = Y(925);
      const g = ctx.createLinearGradient(lx1, 0, lx0, 0);
      SCALE.forEach(([v, c]) => g.addColorStop((v - 20) / 30, rgb(c)));
      ctx.fillStyle = g; rrect(lx0, ly - 9, lx1 - lx0, 18, 9); ctx.fill();
      text('20%', lx1, ly + 38, 26, C.mute, 'center', 1, 'ltr');
      text('35%', (lx0 + lx1) / 2, ly + 38, 26, C.mute, 'center', 1, 'ltr');
      text('50%', lx0, ly + 38, 26, C.mute, 'center', 1, 'ltr');
      ctx.restore();
      text('الفئة العمرية من 15 إلى 24 سنة', W / 2, Y(1005), 30, C.mute, 'center', lp);
    }
  } });

  // 3. ranking
  scene(7.6, { src: 'المصدر: تقديرات منظمة العمل الدولية المنمذجة لعام 2025 (البنك الدولي)', draw(lt) {
    sceneTitle(lt, 'الترتيب', ['ليبيا في الصدارة بأربعة', 'أضعاف المتوسط العالمي']);
    const xr = W - 70, nameW = 190, x0 = xr - nameW, x1 = 90;   // bars grow leftwards from x0
    const span = x0 - x1, maxV = 55;
    const rowH = (Y(900) - Y(300)) / ILO.length;
    // world average marker
    const wp = prog(lt, 2.8, 3.4);
    if (wp > 0) {
      const x = x0 - span * WORLD / maxV;
      ctx.save(); ctx.globalAlpha = wp;
      ctx.strokeStyle = C.white; ctx.lineWidth = 3; ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(x, Y(300) - 10); ctx.lineTo(x, Y(300) - 10 + (Y(910) - Y(300)) * eout(wp)); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.globalAlpha = wp;
      const lbl = 'المتوسط العالمي 12.4%';
      const lw = measure(lbl, 28) + 30;
      ctx.fillStyle = C.white; rrect(x - lw / 2, Y(950) - 24, lw, 48, 24); ctx.fill();
      ctx.restore();
      text(lbl, x, Y(950) + 1, 28, C.navy, 'center', wp);
    }
    ILO.forEach((c, i) => {
      const y = Y(300) + rowH * (i + 0.5);
      const p = eio(prog(lt, 0.8 + i * 0.25, 2.0 + i * 0.25));
      const ap = prog(lt, 0.7 + i * 0.25, 1.1 + i * 0.25);
      text(c.name, xr, y, 44, i === 0 ? C.greenL : C.white, 'right', ap);
      ctx.fillStyle = 'rgba(255,255,255,0.07)'; rrect(x1, y - 30, span, 60, 10); ctx.fill();
      const w = span * c.v / maxV * p;
      ctx.save();
      if (i === 0) { ctx.shadowColor = 'rgba(16,185,129,0.6)'; ctx.shadowBlur = 30; }
      ctx.fillStyle = rgb(scaleRGB(c.v)); rrect(x0 - w, y - 30, w, 60, 10); ctx.fill();
      ctx.restore();
      if (p > 0.05) {
        const s = fmt(c.v * p) + '%';
        const inside = w > measure(s, 40) + 40;
        text(s, inside ? x0 - w + 20 : x0 - w - 16, y + 2, 40, inside ? C.navy : C.white, inside ? 'left' : 'right', 1, 'ltr');
      }
    });
  } });

  // 4. Libya: one in two
  scene(6.0, { src: 'المصدر: منظمة العمل الدولية، اتجاهات تشغيل الشباب في العالم 2026', draw(lt) {
    sceneTitle(lt, 'ليبيا', ['شاب من كل اثنين في سوق', 'العمل الليبية بلا وظيفة']);
    const p = prog(lt, 0.6, 2.2);
    const big = fmt(50.1 * eout(p)) + '%';
    ctx.save();
    ctx.shadowColor = 'rgba(16,185,129,0.55)'; ctx.shadowBlur = 50;
    text(big, W / 2, Y(430), 210, C.greenL, 'center', clamp(p * 3), 'ltr');
    ctx.restore();
    text('نسبة البطالة بين الشباب الليبيين في 2025', W / 2, Y(560), 38, C.white, 'center', prog(lt, 1.4, 2.0));
    pictoRow(10, 5, W / 2, Y(740), 120, 34, 1.6, lt);
    text('الأعلى في شمال إفريقيا', W / 2, Y(980), 40, C.mint, 'center', prog(lt, 3.2, 3.8));
  } });

  // 5. the latest official national figures
  scene(8.6, { src: 'المصادر: المندوبية السامية للتخطيط (المغرب) · المعهد الوطني للإحصاء (تونس)', draw(lt) {
    sceneTitle(lt, 'أحدث الأرقام الرسمية', ['بطالة الشباب في 2026', 'وفق الإحصاءات الوطنية']);
    const cards = [
      { name: 'المغرب', period: 'الربع الثالث 2026', v: 30.5, prev: 27.2, prevLbl: 'الربع الثاني', up: true, note: 'ارتفاع 3.3 نقاط' },
      { name: 'تونس', period: 'الربع الثاني 2026', v: 35.4, prev: 37.5, prevLbl: 'الربع الأول', up: false, note: 'تراجع 2.1 نقطة' },
    ];
    const ch = (Y(900) - Y(280) - 40) / 2;
    cards.forEach((c, i) => {
      const y = Y(280) + i * (ch + 40), t0 = 0.8 + i * 0.9;
      const p = eout(prog(lt, t0, t0 + 0.6));
      if (p <= 0) return;
      const x = 70 + (1 - p) * 80, w = W - 140;
      ctx.save(); ctx.globalAlpha = p;
      ctx.fillStyle = C.panel; rrect(x, y, w, ch, 22); ctx.fill();
      ctx.fillStyle = C.green; ctx.fillRect(x + w - 10, y + 24, 10, ch - 48);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = p;
      text(c.name, x + w - 44, y + 62, 54, C.white);
      text(c.period, x + w - 44, y + 124, 32, C.mute);
      // trend: previous -> current
      const tp = eio(prog(lt, t0 + 0.7, t0 + 1.6));
      const sx1 = x + w - 44, sx0 = x + w - 330, sy = y + ch - 70;
      const range = 12, mid = (c.v + c.prev) / 2;
      const yv = v => sy - (v - mid) / range * 70;
      ctx.strokeStyle = c.up ? C.red : C.greenL; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx0, yv(c.prev)); ctx.lineTo(lerp(sx0, sx1, tp), lerp(yv(c.prev), yv(c.v), tp)); ctx.stroke();
      ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(sx0, yv(c.prev), 8, 0, 7); ctx.fill();
      if (tp > 0.98) { ctx.fillStyle = c.up ? C.red : C.greenL; ctx.beginPath(); ctx.arc(sx1, yv(c.v), 11, 0, 7); ctx.fill(); }
      text(fmt(c.prev) + '%', sx0, yv(c.prev) + (c.up ? 34 : -34), 26, C.mute, 'center', 1, 'ltr');
      text(c.prevLbl, sx0 - 18, yv(c.prev), 24, C.faint, 'right');
      ctx.restore();
      // big number
      const np = prog(lt, t0 + 0.3, t0 + 1.5);
      text(fmt(c.v * eout(np)) + '%', x + 50, y + ch / 2 - 18, 120, C.white, 'left', p, 'ltr');
      const nw = measure(c.note, 30) + 56;
      const ap = prog(lt, t0 + 1.4, t0 + 1.9);
      if (ap > 0) {
        ctx.save(); ctx.globalAlpha = ap;
        ctx.fillStyle = c.up ? 'rgba(240,86,91,0.18)' : 'rgba(52,211,153,0.18)';
        rrect(x + 50, y + ch / 2 + 50, nw, 52, 26); ctx.fill();
        // arrow
        const axc = x + 50 + nw - 28, ayc = y + ch / 2 + 76;
        ctx.fillStyle = c.up ? C.red : C.greenL; ctx.beginPath();
        if (c.up) { ctx.moveTo(axc, ayc - 10); ctx.lineTo(axc + 9, ayc + 7); ctx.lineTo(axc - 9, ayc + 7); }
        else { ctx.moveTo(axc, ayc + 10); ctx.lineTo(axc + 9, ayc - 7); ctx.lineTo(axc - 9, ayc - 7); }
        ctx.fill();
        ctx.restore();
        text(c.note, x + 50 + nw - 48, y + ch / 2 + 77, 30, c.up ? '#FF9A9D' : C.greenL, 'right', ap);
      }
    });
    text('تختلف الأرقام الوطنية عن تقديرات المنظمة الدولية لاختلاف المنهجية والفترة', W / 2, Y(975), 28, C.mute, 'center', prog(lt, 3.6, 4.2));
  } });

  // 6. young women
  scene(7.2, { src: 'المصادر: منظمة العمل الدولية (الجزائر 2025) · المعهد الوطني للإحصاء (تونس، الربع الثاني 2026)', draw(lt) {
    sceneTitle(lt, 'الفجوة بين الجنسين', ['الشابات يدفعن', 'الثمن الأكبر']);
    const groups = [
      { name: 'الجزائر', sub: 'تقديرات 2025', f: 45.0, m: 26.5 },
      { name: 'تونس', sub: 'الربع الثاني 2026', f: 37.1, m: 34.6 },
    ];
    const xr = W - 70, labelW = 230, x0 = xr - labelW, x1 = 90, span = x0 - x1, maxV = 50;
    const gh = (Y(860) - Y(300)) / 2;
    groups.forEach((g, gi) => {
      const y = Y(300) + gi * gh + 30, t0 = 0.8 + gi * 0.9;
      const ap = prog(lt, t0 - 0.1, t0 + 0.4);
      text(g.name, xr, y + 48, 48, C.white, 'right', ap);
      text(g.sub, xr, y + 102, 26, C.mute, 'right', ap);
      [['الشابات', g.f, C.greenL], ['الشبان', g.m, 'rgba(255,255,255,0.75)']].forEach(([lbl, v, col], k) => {
        const by = y + 30 + k * 82;
        const p = eio(prog(lt, t0 + k * 0.2, t0 + 1.1 + k * 0.2));
        const w = span * v / maxV * p;
        ctx.fillStyle = 'rgba(255,255,255,0.07)'; rrect(x1, by, span, 58, 10); ctx.fill();
        ctx.fillStyle = col; rrect(x0 - w, by, w, 58, 10); ctx.fill();
        if (p > 0.05) {
          text(lbl, x0 - 18, by + 31, 28, C.navy, 'right', clamp((w - 140) / 40));
          text(fmt(v * p) + '%', x0 - w - 16, by + 31, 38, C.white, 'right', 1, 'ltr');
        }
      });
    });
    const cp = prog(lt, 3.4, 4.0);
    if (cp > 0) {
      const s = 'في الجزائر: بطالة الشابات أعلى بنحو 1.7 مرة';
      const w = measure(s, 36) + 60;
      ctx.save(); ctx.globalAlpha = cp;
      ctx.fillStyle = C.greenD; rrect(W / 2 - w / 2, Y(950) - 34, w, 68, 34); ctx.fill();
      ctx.restore();
      text(s, W / 2, Y(950) + 1, 36, C.white, 'center', cp);
    }
  } });

  // 7. NEET
  scene(6.4, { src: 'المصدر: منظمة العمل الدولية، اتجاهات تشغيل الشباب في العالم 2026 (بيانات 2025)', draw(lt) {
    sceneTitle(lt, 'خارج العمل والدراسة', ['3 من كل 10 شباب في', 'شمال إفريقيا خارج الحسابات']);
    const p = prog(lt, 0.6, 2.0);
    ctx.save(); ctx.shadowColor = 'rgba(16,185,129,0.55)'; ctx.shadowBlur = 50;
    text(fmt(NEET_NAFR * eout(p)) + '%', W / 2, Y(420), 190, C.greenL, 'center', clamp(p * 3), 'ltr');
    ctx.restore();
    text('لا يعملون ولا يدرسون ولا يتلقون تدريبا', W / 2, Y(545), 40, C.white, 'center', prog(lt, 1.3, 1.9));
    pictoRow(10, 3, W / 2, Y(730), 120, 34, 1.5, lt);
    const wp = prog(lt, 3.2, 3.8);
    text('المعدل العالمي: 20%', W / 2, Y(975), 38, C.mint, 'center', wp);
  } });

  // 8. sources
  scene(4.6, { draw(lt) {
    sceneTitle(lt, 'المنهجية', ['المصادر']);
    const rows = [
      ['منظمة العمل الدولية', 'تقرير اتجاهات تشغيل الشباب في العالم 2026'],
      ['البنك الدولي', 'تقديرات منظمة العمل الدولية المنمذجة لعام 2025'],
      ['المندوبية السامية للتخطيط', 'المغرب، الربع الثالث 2026'],
      ['المعهد الوطني للإحصاء', 'تونس، الربع الثاني 2026'],
    ];
    rows.forEach((r, i) => {
      const y = Y(270) + i * 150 * SP, p = prog(lt, 0.5 + i * 0.2, 1.0 + i * 0.2);
      ctx.save(); ctx.globalAlpha = eout(p);
      ctx.fillStyle = C.green; ctx.fillRect(W - 76, y - 4, 6, 92);
      ctx.restore();
      wipeText(r[0], W - 100, y + 22, 42, C.white, p);
      wipeText(r[1], W - 100, y + 70, 30, C.mute, prog(lt, 0.65 + i * 0.2, 1.15 + i * 0.2));
    });
    text('الشباب: الفئة العمرية من 15 إلى 24 سنة', W - 100, Y(900), 32, C.mint, 'right', prog(lt, 1.6, 2.1));
  } });

  // 9. outro
  scene(6.8, { chrome: false, outro: true, draw(lt) {
    const cy = FORMAT === 'story' ? 820 : 520;
    const lp = eout(prog(lt, 0.1, 0.9));
    const cam = { lon: 3.5, lat: 26.5, w: lerp(56, 50, prog(lt, 0, 6.8)) };
    const orect = { x: 0, y: cy - 200, w: W, h: 1100 }, tr = MAIN.getTransform(), ga = MAIN.globalAlpha;
    masked(orect, 240, () => { ctx.setTransform(tr); ctx.globalAlpha = ga * lp * 0.5;
      drawGrid(cam, orect, (ci) => (MAGHREB.has(ci) ? [[16, 185, 129], 0.35] : null), 0.06); });
    const g = ctx.createRadialGradient(W / 2, cy + 120, 60, W / 2, cy + 120, 600);
    g.addColorStop(0, 'rgba(11,31,75,0.95)'); g.addColorStop(1, 'rgba(11,31,75,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // the header logo glides to the centre
    const gp = eio(prog(lt, 0.1, 1.1));
    drawLogo(lerp(L.logo.x, W / 2, gp), lerp(L.logo.y, cy, gp), lerp(L.logo.h, 300, gp));
    text('بطالة الشباب في المغرب العربي', W / 2, cy + 230, 50, C.white, 'center', eout(prog(lt, 0.9, 1.5)));
    const lw = 160 * eout(prog(lt, 1.1, 1.7));
    ctx.fillStyle = C.green; rrect(W / 2 - lw / 2, cy + 282, lw, 5, 2.5); ctx.fill();
    text('تابعونا على', W / 2, cy + 360, 30, C.mute, 'center', eout(prog(lt, 1.3, 1.8)));
    const S = 72, gap = 16;
    [{ icons: ['facebook', 'tiktok', 'youtube'], handle: 'ERRIWAYA' }, { icons: ['instagram'], handle: 'ERRIWAYA.MR' }].forEach((row, ri) => {
      const y = cy + 420 + ri * 112;
      const tw = measure(row.handle, 46);
      const iw = row.icons.length * S + (row.icons.length - 1) * gap, total = iw + 30 + tw, x0 = W / 2 - total / 2;
      const rp = prog(lt, 1.5 + ri * 0.25, 2.1 + ri * 0.25);
      if (rp <= 0) return;
      ctx.save(); ctx.globalAlpha = eout(rp);
      ctx.fillStyle = C.white; rrect(x0 - 18, y - 12, total + 54, S + 24, (S + 24) / 2); ctx.fill();
      row.icons.forEach((ic, i) => {
        const ip = eback(prog(lt, 1.55 + ri * 0.25 + i * 0.08, 2.0 + ri * 0.25 + i * 0.08));
        ctx.save(); ctx.translate(x0 + i * (S + gap) + S / 2, y + S / 2); ctx.scale(ip, ip);
        ctx.fillStyle = C.navy; rrect(-S / 2, -S / 2, S, S, S * 0.3); ctx.fill();
        ctx.translate(-S / 2 + S * 0.22, -S / 2 + S * 0.22); ctx.scale(S * 0.56 / 24, S * 0.56 / 24);
        ctx.fillStyle = C.white; ctx.fill(new Path2D(window.ICONS[ic]));
        ctx.restore();
      });
      ctx.restore();
      text(row.handle, x0 + iw + 30 + (1 - eout(rp)) * 20, y + S / 2 + 3, 46, C.navy, 'left', eout(rp), 'ltr');
    });
  } });

  const DURATION = SCENES[SCENES.length - 1].t1;
  const CONTENT = SCENES.filter(s => s.chrome !== false);

  // ---------- background ----------
  function background(t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0E2558'); g.addColorStop(0.55, C.navy); g.addColorStop(1, C.deep);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // drifting dot grid
    const step = 36, off = (t * 6) % step;
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    for (let y = -step + off; y < H + step; y += step) for (let x = (Math.floor(y / step) % 2) * step / 2; x < W; x += step) ctx.fillRect(x, y, 2, 2);
    // soft green glow, top left
    const r = ctx.createRadialGradient(140, 180, 10, 140, 180, 700);
    r.addColorStop(0, 'rgba(16,185,129,0.13)'); r.addColorStop(1, 'rgba(16,185,129,0)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  }

  // header (logo + programme line), source line and the scene progress bar
  function chrome(t, a, sc) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    drawLogo(L.logo.x, L.logo.y, L.logo.h);
    const lw = L.logo.h * LOGO.width / LOGO.height;
    const xr = L.logo.x - lw / 2 - 26;
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(xr, L.logo.y - 34, 2, 68);
    text('بطالة الشباب في المغرب العربي', xr - 22, L.logo.y - 14, 32, C.white);
    text('إنفوجرافيك · نوفمبر 2026', xr - 22, L.logo.y + 24, 24, C.greenL);
    // progress: one segment per content scene, right to left
    const n = CONTENT.length, gap = 10, x0 = 70, x1 = W - 70, sw = (x1 - x0 - gap * (n - 1)) / n;
    CONTENT.forEach((s, i) => {
      const x = x1 - (i + 1) * sw - i * gap;
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x, L.prog, sw, 6);
      const f = prog(t, s.t0, s.t1);
      if (f > 0) { ctx.fillStyle = f < 1 ? C.greenL : 'rgba(255,255,255,0.75)'; ctx.fillRect(x + sw * (1 - f), L.prog, sw * f, 6); }
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
    background(t);
    const sc = SCENES.find(s => t >= s.t0 && t < s.t1) || SCENES[SCENES.length - 1];
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
    // a thin green sweep marks each change of scene
    const sw = prog(lt, 0, 0.55);
    if (sc.t0 > 0 && sw < 1) {
      const x = W - W * 1.3 * eio(sw);
      const g = ctx.createLinearGradient(x - 160, 0, x + 160, 0);
      g.addColorStop(0, 'rgba(52,211,153,0)'); g.addColorStop(0.5, 'rgba(52,211,153,0.16)'); g.addColorStop(1, 'rgba(52,211,153,0)');
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
  ]).then(() => { renderFrame(0); window.READY = true; });
})();
