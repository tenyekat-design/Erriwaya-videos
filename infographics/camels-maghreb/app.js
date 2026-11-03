// Erriwaya infographic renderer: draws one frame for a given time with renderFrame(t).
// ?format=feed (1080x1350, Facebook vertical) | story (1080x1920, Reels/TikTok/Shorts)
(() => {
  const I = window.INFO;
  const MD = window.MAP_DATA;
  const FONT = 'AlQuds';
  const q = new URLSearchParams(location.search);
  const FORMAT = q.get('format') === 'story' ? 'story' : 'feed';
  const W = 1080, H = FORMAT === 'story' ? 1920 : 1350;
  // safe area: story keeps clear of the app's top bar and the caption/buttons at the bottom
  const TOP = FORMAT === 'story' ? 210 : 40;
  const BOT = FORMAT === 'story' ? H - 330 : H - 40;
  const EX = (BOT - TOP) - 1270;  // extra height of the story layout (given to the photos)
  const Y = v => TOP + v;

  const C = {
    navy: '#0B1F4B', navy2: '#13306B', navy3: '#1B3C80',
    green: '#0A8F65', green2: '#10B981', greenRGB: [16, 185, 129],
    white: '#FFFFFF', ink: '#0B1F4B', mute: 'rgba(11,31,75,0.62)', faint: 'rgba(11,31,75,0.08)',
    red: '#E03A3E',
    landRGB: [222, 228, 238], wsRGB: [236, 239, 245],
  };

  const canvas = document.getElementById('c');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ---------- timeline ----------
  const T_TOTAL = 4.4, T_WORLD = 11.4, T_SEG = 17.0, SEG = 4.8;
  const T_RANK = T_SEG + SEG * I.countries.length;   // 41.0
  const T_OUT = T_RANK + 7.5;                         // 48.5
  const DURATION = T_OUT + 6.0;
  const CUTS = [T_TOTAL, T_WORLD, ...I.countries.map((_, i) => T_SEG + i * SEG), T_RANK, T_OUT];

  // ---------- helpers ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eout = p => 1 - Math.pow(1 - p, 3);
  const eio = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const font = s => `${s}px ${FONT}`;
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const mix = (a, b, p) => a.map((v, i) => Math.round(v + (b[i] - v) * p));
  const TOTAL = I.countries.reduce((s, c) => s + c.n, 0);
  const pct = n => (Math.round((n / TOTAL) * 1000) / 10).toFixed(1);

  function rrect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function text(s, x, y, size, color, align = 'center', alpha = 1, ltr = false) {
    if (alpha <= 0) return 0;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.font = font(size); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.direction = ltr ? 'ltr' : 'rtl';
    ctx.fillText(s, x, y);
    const w = ctx.measureText(s).width;
    ctx.restore();
    return w;
  }
  const measure = (s, size) => { ctx.save(); ctx.font = font(size); const w = ctx.measureText(s).width; ctx.restore(); return w; };
  // a run of pieces laid out right to left (numbers kept LTR); anchor 'right' | 'center'
  function run(parts, x, y, anchor = 'right', alpha = 1) {
    const gap = 14;
    const ws = parts.map(p => measure(p.s, p.size));
    const total = ws.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
    let xr = anchor === 'center' ? x + total / 2 : anchor === 'left' ? x + total : x;
    parts.forEach((p, i) => {
      text(p.s, xr, y + (p.dy || 0), p.size, p.color, 'right', alpha, !!p.ltr);
      xr -= ws[i] + gap;
    });
    return total;
  }
  function wrap(s, size, maxW) {
    const words = s.split(' '), lines = [];
    let cur = '';
    for (const w of words) {
      const tryS = cur ? cur + ' ' + w : w;
      if (cur && measure(tryS, size) > maxW) { lines.push(cur); cur = w; } else cur = tryS;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  const IMG = {};
  function loadImage(src) {
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error(src)); im.src = src; });
  }
  function tint(img, color) {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    return c;
  }
  // photo cropped to fill a box, focus f=[fx,fy], zoom z >= 1
  function photo(img, x, y, w, h, f = [0.5, 0.5], z = 1) {
    const s = Math.max(w / img.width, h / img.height) * z;
    const iw = img.width * s, ih = img.height * s;
    const px = clamp(x + w / 2 - f[0] * iw, x + w - iw, x);
    const py = clamp(y + h / 2 - f[1] * ih, y + h - ih, y);
    ctx.drawImage(img, px, py, iw, ih);
  }
  let LOGO_W, LOGO_N;
  // navy logo on white; white logo (soft shadow) on photos and panels
  function logo(cx, cy, h, alpha = 1, white = false) {
    const im = white ? LOGO_W : LOGO_N;
    const w = h * im.width / im.height;
    ctx.save(); ctx.globalAlpha *= alpha;
    if (white) { ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 2; }
    ctx.drawImage(im, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
  }

  // ---------- background ----------
  let DOTS;
  function makeDots() {
    DOTS = document.createElement('canvas');
    DOTS.width = W; DOTS.height = H;
    const g = DOTS.getContext('2d');
    g.fillStyle = 'rgba(11,31,75,0.06)';
    for (let y = 18; y < H; y += 36) for (let x = 18; x < W; x += 36) g.fillRect(x - 1.5, y - 1.5, 3, 3);
  }
  function background(t) {
    ctx.fillStyle = C.white; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(DOTS, 0, ((t * 6) % 36) - 36);
    // soft green glow
    const r = ctx.createRadialGradient(W * 0.85, H * 0.15, 20, W * 0.85, H * 0.15, W * 0.9);
    r.addColorStop(0, 'rgba(16,185,129,0.10)'); r.addColorStop(1, 'rgba(16,185,129,0)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  }
  // header shown on the data screens: logo on the left, series title on the right
  function header(alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha;
    logo(110, Y(52), 84);
    ctx.fillStyle = C.green; ctx.fillRect(W - 66, Y(36), 8, 34);
    text('إنفوجرافيك', W - 80, Y(42), 26, C.green, 'right');
    text(I.title, W - 80, Y(76), 30, C.ink, 'right');
    ctx.restore();
  }
  function footer(alpha = 1, two = false) {
    const y = Y(1270 + EX) - (two ? 40 : 18);
    text(I.source, W / 2, y, 24, C.mute, 'center', alpha);
    if (two) text(I.source2, W / 2, y + 34, 24, C.mute, 'center', alpha);
  }

  // ---------- map ----------
  const RAD = Math.PI / 180;
  const mercY = lat => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2)) / RAD;
  const GRID = Uint8Array.from(atob(MD.grid), ch => ch.charCodeAt(0));
  const GY1 = mercY(MD.box.lat1);
  const IDX = {};
  MD.ids.forEach((id, i) => { if (id) IDX[id] = i; });
  // land cells of the region (lon -26..34, lat 8..42)
  const CELLS = [];
  for (let r = 0; r < MD.rows; r++) {
    const my = GY1 - (r + 0.5) * MD.cell;
    if (my < mercY(8) || my > mercY(42)) continue;
    for (let c = 0; c < MD.cols; c++) {
      const ci = GRID[r * MD.cols + c];
      if (!ci) continue;
      const x = MD.box.lon0 + (c + 0.5) * MD.cell;
      if (x < -26 || x > 34) continue;
      CELLS.push(x, my, ci);
    }
  }
  const WS = IDX['732'];
  // colour(ci, lon, my) -> [rgb, alpha] or null for the default land colour
  function drawMap(rect, cam, colour, alpha = 1) {
    const k = rect.w / cam.w;
    const cy = mercY(cam.lat);
    const ox = rect.x + rect.w / 2, oy = rect.y + rect.h / 2;
    const size = MD.cell * k, sq = Math.max(1.5, size * 0.74);
    ctx.save();
    ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
    ctx.globalAlpha = alpha;
    const base = new Path2D();
    for (let i = 0; i < CELLS.length; i += 3) {
      const sx = ox + (CELLS[i] - cam.lon) * k, sy = oy - (CELLS[i + 1] - cy) * k;
      if (sx < rect.x - size || sx > rect.x + rect.w + size || sy < rect.y - size || sy > rect.y + rect.h + size) continue;
      const ci = CELLS[i + 2];
      const c = colour ? colour(ci, CELLS[i], CELLS[i + 1]) : null;
      if (!c) { base.rect(sx - sq / 2, sy - sq / 2, sq, sq); continue; }
      ctx.fillStyle = rgb(c[0], c[1]);
      ctx.fillRect(sx - sq / 2, sy - sq / 2, sq, sq);
    }
    ctx.fillStyle = rgb(C.landRGB);
    ctx.fill(base);
    ctx.restore();
    return (lon, lat) => [ox + (lon - cam.lon) * k, oy - (mercY(lat) - cy) * k];
  }
  // a country lights up in a wave from its centre; e = seconds since it started
  function wave(c, e, lon, my) {
    const d = Math.hypot(lon - c.lon, my - mercY(c.lat));
    return clamp((e * 22 - d) / 4);
  }
  function pill(s, x, y, size, fill, color, alpha = 1) {
    if (alpha <= 0) return;
    const w = measure(s, size) + size * 0.9, h = size * 1.55;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.fillStyle = fill; rrect(x - w / 2, y - h / 2, w, h, 8); ctx.fill();
    ctx.restore();
    text(s, x, y + 1, size, color, 'center', alpha);
  }

  // ---------- scenes ----------
  function sceneHook(t) {
    const img = IMG[I.hook.img];
    photo(img, 0, 0, W, H, I.hook.f, 1.18 - 0.1 * eout(prog(t, 0, 4.6)));
    const g = ctx.createLinearGradient(0, H * 0.3, 0, H);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.88)'); g.addColorStop(0.62, '#fff'); g.addColorStop(1, '#fff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const tg = ctx.createLinearGradient(0, 0, 0, TOP + 260);
    tg.addColorStop(0, 'rgba(11,31,75,0.55)'); tg.addColorStop(1, 'rgba(11,31,75,0)');
    ctx.fillStyle = tg; ctx.fillRect(0, 0, W, TOP + 260);
    logo(W / 2, Y(90), 130, eout(prog(t, 0.1, 0.6)), true);
    const by = Y(870 + EX);
    // tags: green "إنفوجرافيك" + white "المنطقة المغاربية"
    const a1 = eout(prog(t, 0.3, 0.8));
    ctx.save(); ctx.globalAlpha = a1;
    const t1 = 'إنفوجرافيك', t2 = 'المنطقة المغاربية', ts = 34;
    const w1 = measure(t1, ts) + 40, w2 = measure(t2, ts) + 40;
    ctx.fillStyle = C.green; ctx.fillRect(W - 70 - w1, by, w1, 58);
    ctx.fillStyle = C.navy; ctx.fillRect(W - 70 - w1 - w2, by, w2, 58);
    ctx.restore();
    text(t1, W - 70 - w1 / 2, by + 30, ts, C.white, 'center', a1);
    text(t2, W - 70 - w1 - w2 / 2, by + 30, ts, C.white, 'center', a1);
    const a2 = eout(prog(t, 0.6, 1.2));
    text('كم عدد الإبل', W - 70, by + 140 + (1 - a2) * 24, 96, C.ink, 'right', a2);
    const a3 = eout(prog(t, 0.9, 1.5));
    text('في المنطقة المغاربية؟', W - 70, by + 255 + (1 - a3) * 24, 96, C.green, 'right', a3);
    // red accent rule (red used sparingly)
    const rw = 220 * eout(prog(t, 1.3, 2.0));
    ctx.fillStyle = C.red; ctx.fillRect(W - 70 - rw, by + 330, rw, 8);
    const a4 = eout(prog(t, 1.6, 2.2));
    text('أرقام موريتانيا والجزائر وتونس والمغرب وليبيا', W - 70, by + 385, 36, C.mute, 'right', a4);
  }

  function sceneTotal(t) {
    const e = t - T_TOTAL;
    background(t);
    header(eout(prog(e, 0.2, 0.7)));
    text('مجموع الإبل في الدول الخمس', W / 2, Y(185), 52, C.ink, 'center', eout(prog(e, 0.3, 0.9)));
    // map of the region; the five countries light up one after the other
    const rect = { x: 30, y: Y(240), w: W - 60, h: 650 + EX * 0.6 };
    const cam = { lon: 3.5, lat: 26.5, w: 54 - 4 * eout(prog(e, 0, 7)) };
    const start = I.countries.map((c, i) => 0.6 + i * 0.45);
    const byId = {};
    I.countries.forEach((c, i) => { byId[IDX[c.id]] = i; });
    const P = drawMap(rect, cam, (ci, lon, my) => {
      if (ci === WS) return [C.wsRGB, 1];
      const i = byId[ci];
      if (i === undefined) return null;
      const w = wave(I.countries[i], e - start[i], lon, my);
      if (w <= 0) return null;
      return [mix(C.landRGB, i === 0 ? C.greenRGB : [10, 143, 101], w), 1];
    }, eout(prog(e, 0, 0.6)));
    I.countries.forEach((c, i) => {
      const [x, y] = P(c.lon, c.lat);
      pill(c.name, x, y, 30, C.navy, C.white, eout(prog(e, start[i] + 0.3, start[i] + 0.7)));
    });
    // big counter
    const cy = Y(990 + EX * 0.8);
    const cp = eout(prog(e, 0.8, 3.6));
    text(fmt(TOTAL * cp), W / 2, cy, 150, C.green, 'center', eout(prog(e, 0.6, 1.0)), true);
    run([{ s: 'رأس من الإبل', size: 46, color: C.ink }, { s: '–', size: 46, color: C.mute },
         { s: 'نحو', size: 46, color: C.mute }, { s: (TOTAL / 1e6).toFixed(1), size: 50, color: C.ink, ltr: true, dy: -2 },
         { s: 'مليون', size: 46, color: C.mute }], W / 2, cy + 115, 'center', eout(prog(e, 2.6, 3.2)));
    footer(eout(prog(e, 1, 1.6)));
  }

  function sceneWorld(t) {
    const e = t - T_WORLD;
    photo(IMG[I.worldImg], 0, 0, W, H, [0.5, 0.5], 1.15 - 0.08 * prog(e, 0, 6));
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(DOTS, 0, 0);
    header(1);
    text('مكانة المنطقة في العالم', W / 2, Y(185), 52, C.ink, 'center', eout(prog(e, 0.2, 0.8)));
    const cx = W / 2, cy = Y(560 + EX * 0.5), R = 250;
    const share = TOTAL / I.world;
    const p = eio(prog(e, 0.6, 2.4));
    ctx.save();
    ctx.lineWidth = 56; ctx.lineCap = 'butt';
    ctx.strokeStyle = 'rgba(11,31,75,0.1)';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = C.green;
    ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * share * p); ctx.stroke();
    ctx.restore();
    text(`${(share * 100 * p).toFixed(1)}%`, cx, cy - 20, 130, C.ink, 'center', eout(prog(e, 0.5, 0.9)), true);
    text('من إبل العالم', cx, cy + 80, 44, C.green, 'center', eout(prog(e, 0.8, 1.2)));
    // two lines of figures
    const ly = Y(930 + EX * 0.9);
    const a1 = eout(prog(e, 2.2, 2.8)), a2 = eout(prog(e, 2.7, 3.3));
    ctx.save(); ctx.globalAlpha = a1; ctx.fillStyle = 'rgba(11,31,75,0.07)'; rrect(90, ly - 50, W - 180, 100, 18); ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalAlpha = a2; ctx.fillStyle = 'rgba(16,185,129,0.16)'; rrect(90, ly + 70, W - 180, 100, 18); ctx.fill(); ctx.restore();
    text('العالم', W - 130, ly, 40, C.ink, 'right', a1);
    run([{ s: '44.3', size: 52, color: C.ink, ltr: true, dy: -2 }, { s: 'مليون رأس', size: 40, color: C.ink }], 130, ly, 'left', a1);
    text('المنطقة المغاربية', W - 130, ly + 120, 40, C.ink, 'right', a2);
    run([{ s: (TOTAL / 1e6).toFixed(1), size: 52, color: C.green, ltr: true, dy: -2 }, { s: 'مليون رأس', size: 40, color: C.green }], 130, ly + 120, 'left', a2);
    footer(eout(prog(e, 1, 1.6)));
  }

  function sceneCountry(t, i) {
    const c = I.countries[i];
    const e = t - (T_SEG + i * SEG);
    background(t);
    header(1);
    // progress: five segments, the current one green
    for (let k = 0; k < 5; k++) {
      ctx.fillStyle = k === i ? C.green : k < i ? 'rgba(11,31,75,0.55)' : 'rgba(11,31,75,0.12)';
      ctx.fillRect(W - 60 - (k + 1) * 64 + 8, Y(112), 56, 6);
    }
    // photo card
    const px = 60, py = Y(140), pw = W - 120, ph = 470 + EX * 0.75;
    ctx.save();
    rrect(px, py, pw, ph, 26); ctx.clip();
    photo(IMG[c.img], px, py, pw, ph, c.f, 1.06 + 0.1 * prog(e, 0, SEG));
    const g = ctx.createLinearGradient(0, py + ph * 0.45, 0, py + ph);
    g.addColorStop(0, 'rgba(11,31,75,0)'); g.addColorStop(1, 'rgba(11,31,75,0.92)');
    ctx.fillStyle = g; ctx.fillRect(px, py, pw, ph);
    ctx.restore();
    // rank badge + country name on the photo
    const a = eout(prog(e, 0.35, 0.8));
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = C.green; ctx.fillRect(px + pw - 120, py + ph - 130, 96, 96);
    ctx.restore();
    text(String(i + 1), px + pw - 72, py + ph - 80, 66, C.white, 'center', a, true);
    text(c.name, px + pw - 148, py + ph - 80 + (1 - a) * 16, 84, C.white, 'right', a);
    // mini map with the country highlighted (left of the name)
    const mr = { x: px + 20, y: py + 20, w: 300, h: 230 };
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; rrect(mr.x, mr.y, mr.w, mr.h, 16); ctx.fill();
    ctx.restore();
    drawMap({ x: mr.x + 8, y: mr.y + 8, w: mr.w - 16, h: mr.h - 16 }, { lon: 3.5, lat: 26.5, w: 54 }, (ci, lon, my) => {
      if (ci === WS) return [C.wsRGB, 1];
      if (ci !== IDX[c.id]) return null;
      const w = wave(c, e - 0.4, lon, my);
      return w > 0 ? [mix(C.landRGB, C.greenRGB, w), 1] : null;
    }, a);
    // number
    const ny = py + ph + 125;
    const cp = eout(prog(e, 0.5, 2.2));
    text(fmt(c.n * cp), W / 2, ny, 140, C.green, 'center', eout(prog(e, 0.4, 0.8)), true);
    text('رأس من الإبل', W / 2, ny + 100, 44, C.ink, 'center', eout(prog(e, 0.8, 1.2)));
    // share bar
    const by = ny + 200;
    const ba = eout(prog(e, 1.2, 1.6));
    run([{ s: `${pct(c.n)}%`, size: 44, color: C.green, ltr: true, dy: -2 }, { s: 'من إبل المنطقة المغاربية', size: 36, color: C.ink }], W - 60, by, 'right', ba);
    ctx.save(); ctx.globalAlpha = ba;
    ctx.fillStyle = 'rgba(11,31,75,0.08)'; rrect(60, by + 42, W - 120, 22, 11); ctx.fill();
    const bw = (W - 120) * (c.n / TOTAL) * eio(prog(e, 1.3, 2.4));
    ctx.fillStyle = C.green; rrect(W - 60 - bw, by + 42, Math.max(bw, 22), 22, 11); ctx.fill();
    ctx.restore();
    // rank + fact
    const fy = by + 125;
    const fa = eout(prog(e, 1.9, 2.4));
    text(c.rank, W - 60, fy, 40, C.ink, 'right', fa);
    if (c.factChip) {
      const s = c.fact, w = measure(s, 32) + 40;
      ctx.save(); ctx.globalAlpha = eout(prog(e, 2.2, 2.7));
      ctx.fillStyle = C.navy; rrect(60, fy - 30, w, 60, 10); ctx.fill();
      ctx.restore();
      text(s, 60 + w / 2, fy + 1, 32, C.white, 'center', eout(prog(e, 2.2, 2.7)));
    } else {
      text(c.fact, 60, fy, 36, C.green, 'left', eout(prog(e, 2.2, 2.7)));
    }
    footer(1);
  }

  function sceneRank(t) {
    const e = t - T_RANK;
    background(t);
    header(1);
    text('ترتيب الدول حسب عدد الإبل', W / 2, Y(190), 56, C.ink, 'center', eout(prog(e, 0.2, 0.8)));
    text(`تقديرات ${I.year}`, W / 2, Y(250), 32, C.mute, 'center', eout(prog(e, 0.4, 1.0)));
    const max = I.countries[0].n;
    const top = Y(300), rowH = 112 + EX * 0.2;
    const nameW = 200, barR = W - 60 - nameW - 20, barMax = barR - 60 - 220;
    I.countries.forEach((c, i) => {
      const y = top + i * rowH + rowH / 2;
      const a = eout(prog(e, 0.5 + i * 0.18, 0.9 + i * 0.18));
      text(c.name, W - 60, y, 44, C.ink, 'right', a);
      const p = eio(prog(e, 0.7 + i * 0.18, 2.0 + i * 0.18));
      const bw = Math.max(16, barMax * (c.n / max) * p);
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(11,31,75,0.06)'; rrect(barR - barMax, y - 30, barMax, 60, 10); ctx.fill();
      ctx.fillStyle = i === 0 ? C.green : C.navy; rrect(barR - bw, y - 30, bw, 60, 10); ctx.fill();
      ctx.restore();
      text(fmt(c.n * p), barR - bw - 16, y, 40, C.ink, 'right', a, true);
    });
    // insight box (red tag, used sparingly)
    const iy = top + 5 * rowH + 40;
    const ia = eout(prog(e, 2.8, 3.4));
    ctx.save(); ctx.globalAlpha = ia;
    ctx.fillStyle = 'rgba(11,31,75,0.05)'; rrect(60, iy, W - 120, 190, 18); ctx.fill();
    ctx.fillStyle = C.red; ctx.fillRect(W - 60 - 8, iy, 8, 190);
    ctx.restore();
    pill('لافت', W - 140, iy + 45, 30, C.red, C.white, ia);
    text('موريتانيا وحدها تملك قرابة ثلثي', W - 100, iy + 105, 42, C.ink, 'right', ia);
    run([{ s: 'إبل المنطقة', size: 42, color: C.ink }, { s: `(${pct(max)}%)`, size: 42, color: C.green, ltr: true }], W - 100, iy + 155, 'right', ia);
    footer(eout(prog(e, 1, 1.6)), true);
  }

  const SOCIAL = [
    { icons: ['facebook', 'tiktok', 'youtube'], handle: 'ERRIWAYA' },
    { icons: ['instagram'], handle: 'ERRIWAYA.MR' },
  ];
  function icon(name, x, y, s) {
    ctx.save();
    ctx.fillStyle = C.navy; rrect(x, y, s, s, s * 0.28); ctx.fill();
    ctx.translate(x + s * 0.2, y + s * 0.2);
    const k = (s * 0.6) / 24; ctx.scale(k, k);
    ctx.fillStyle = C.white; ctx.fill(new Path2D(window.ICONS[name]));
    ctx.restore();
  }
  function sceneOutro(t) {
    const e = t - T_OUT;
    background(t);
    // faint map
    drawMap({ x: 0, y: 0, w: W, h: H }, { lon: 3.5, lat: 26, w: 46 - 4 * prog(e, 0, 6) }, (ci) => {
      if (ci === WS) return [C.wsRGB, 1];
      return I.countries.some(c => IDX[c.id] === ci) ? [mix(C.landRGB, C.greenRGB, 0.35), 1] : null;
    }, 0.45 * eout(prog(e, 0, 1)));
    const r = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 620);
    r.addColorStop(0, 'rgba(255,255,255,0.95)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    const cy = H / 2 - 200 + (FORMAT === 'story' ? -60 : 0);
    const la = eout(prog(e, 0.2, 1.0));
    logo(W / 2, cy + (1 - la) * 30, 300, la);
    const ta = eout(prog(e, 0.8, 1.4));
    text(I.title, W / 2, cy + 225, 48, C.ink, 'center', ta);
    ctx.fillStyle = C.green; const lw = 160 * eout(prog(e, 1.0, 1.6));
    ctx.fillRect(W / 2 - lw / 2, cy + 270, lw, 6);
    const sa = eout(prog(e, 1.3, 1.9));
    ctx.save(); ctx.globalAlpha = sa;
    let y = cy + 340;
    text('تابعونا', W / 2, y, 34, C.mute, 'center');
    y += 70;
    const s = 56;
    for (const row of SOCIAL) {
      const hw = measure(row.handle, 40);
      const total = row.icons.length * (s + 12) + 10 + hw;
      let x = W / 2 - total / 2;
      for (const n of row.icons) { icon(n, x, y - s / 2, s); x += s + 12; }
      text(row.handle, x + 10, y + 2, 40, C.ink, 'left', 1, true);
      y += 84;
    }
    // website
    const ww = measure(I.site, 40) + 60;
    ctx.fillStyle = C.green; rrect(W / 2 - ww / 2, y - 34, ww, 68, 34); ctx.fill();
    text(I.site, W / 2, y + 2, 40, C.white, 'center', 1, true);
    ctx.restore();
    footer(eout(prog(e, 1.6, 2.2)), true);
  }

  // wipe between scenes: a green and a navy panel sweep from right to left, the cut happens behind them
  function wipe(t) {
    for (const b of CUTS) {
      const p = (t - (b - 0.36)) / 0.72;
      if (p <= 0 || p >= 1) continue;
      const q = eio(p);
      const draw = (lead, color) => {
        const xl = W * (1.05 - 2.4 * q) - lead;
        const sl = 160;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(xl + sl, 0); ctx.lineTo(xl + W * 1.3 + sl, 0); ctx.lineTo(xl + W * 1.3, H); ctx.lineTo(xl, H); ctx.closePath();
        ctx.fill();
      };
      draw(70, C.green);
      draw(0, C.navy);
      // logo mark in the middle of the navy panel
      const xl = W * (1.05 - 2.4 * q);
      const cx = xl + W * 0.65 + 80;
      if (cx > -200 && cx < W + 200) logo(cx, H / 2, 160, 0.9, true);
    }
  }

  function renderFrame(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.white; ctx.fillRect(0, 0, W, H);
    if (t < T_TOTAL) sceneHook(t);
    else if (t < T_WORLD) sceneTotal(t);
    else if (t < T_SEG) sceneWorld(t);
    else if (t < T_RANK) sceneCountry(t, Math.min(4, Math.floor((t - T_SEG) / SEG)));
    else if (t < T_OUT) sceneRank(t);
    else sceneOutro(t);
    wipe(t);
    // fade in from navy / fade to navy at the very end
    const f = Math.max(1 - prog(t, 0, 0.35), prog(t, DURATION - 0.6, DURATION));
    if (f > 0) { ctx.fillStyle = `rgba(255,255,255,${f})`; ctx.fillRect(0, 0, W, H); }
  }

  // cover: the hook in its final state
  function renderCover() { renderFrame(3.6); }

  async function init() {
    await document.fonts.load(font(48));
    await document.fonts.ready;
    const files = new Set([I.hook.img, I.totalImg, I.worldImg, ...I.countries.map(c => c.img)]);
    await Promise.all([...files].map(async f => { IMG[f] = await loadImage('img/' + f); }));
    const lm = await loadImage('../../assets/logo-mark.png');
    LOGO_W = tint(lm, '#fff');
    LOGO_N = tint(lm, C.navy);
    makeDots();
    window.renderFrame = renderFrame;
    window.renderCover = renderCover;
    window.DURATION = DURATION;
    window.CUTS = CUTS;
    window.T_OUT = T_OUT;
    window.SIZE = [W, H];
    window.READY = true;
    renderFrame(parseFloat(q.get('t') || '0'));
  }
  init();
})();
