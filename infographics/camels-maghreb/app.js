// Erriwaya infographic renderer: draws one frame for a given time with renderFrame(t).
// ?format=feed (1080x1350, Facebook vertical) | story (1080x1920, Reels/TikTok/Shorts)
// Timing comes from timeline.js (musical grid shared with score.py).
(() => {
  const I = window.INFO, TM = window.IG_TIME, MD = window.MAP_DATA;
  const FONT = 'AlQuds';
  const q = new URLSearchParams(location.search);
  const FORMAT = q.get('format') === 'story' ? 'story' : 'feed';
  const W = 1080, H = FORMAT === 'story' ? 1920 : 1350;
  // safe area: the story keeps clear of the app bar at the top and the caption/buttons at the bottom
  const TOP = FORMAT === 'story' ? 210 : 40;
  const BOT = FORMAT === 'story' ? H - 330 : H - 40;
  const EX = (BOT - TOP) - 1270;          // extra height of the story layout
  const Y = v => TOP + v;
  const M = 60;                           // side margin
  const LOGO_H = FORMAT === 'story' ? 170 : 150;
  const BEAT = TM.beat;

  const C = {
    navy: '#0B1F4B', ink: '#0B1F4B', white: '#FFFFFF',
    green: '#0A8F65', green2: '#10B981', greenRGB: [16, 185, 129], greenDk: [10, 143, 101],
    mute: 'rgba(11,31,75,0.62)', red: '#E03A3E',
    landRGB: [222, 228, 238], wsRGB: [236, 239, 245],
  };

  const main = document.getElementById('c');
  main.width = W; main.height = H;
  const mainCtx = main.getContext('2d');
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const BUF = [mk(), mk()];
  let ctx = mainCtx;

  // ---------- timeline ----------
  const STARTS = [0, ...TM.cuts];
  const DURATION = TM.duration;

  // ---------- helpers ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eout = p => 1 - Math.pow(1 - p, 3);
  const eio = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const eback = p => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
  const font = s => `${s}px ${FONT}`;
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const mix = (a, b, p) => a.map((v, i) => Math.round(v + (b[i] - v) * p));
  const TOTAL = I.countries.reduce((s, c) => s + c.n, 0);
  const pct = n => (Math.round((n / TOTAL) * 1000) / 10).toFixed(1);
  const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  function rrect(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function text(s, x, y, size, color, align = 'center', alpha = 1, ltr = false) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.font = font(size); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.direction = ltr ? 'ltr' : 'rtl';
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  const measure = (s, size) => { mainCtx.save(); mainCtx.font = font(size); const w = mainCtx.measureText(s).width; mainCtx.restore(); return w; };
  // pieces laid out right to left (numbers stay LTR); anchor: right | center | left
  function run(parts, x, y, anchor = 'right', alpha = 1) {
    const gap = 14;
    const ws = parts.map(p => measure(p.s, p.size));
    const total = ws.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
    let xr = anchor === 'center' ? x + total / 2 : anchor === 'left' ? x + total : x;
    parts.forEach((p, i) => { text(p.s, xr, y + (p.dy || 0), p.size, p.color, 'right', alpha, !!p.ltr); xr -= ws[i] + gap; });
  }
  // a big figure: 'count' counts up, 'drop' sets the digits one by one
  function figure(n, x, y, size, color, e, a0, a1, style) {
    if (e < a0 - 0.2) return;
    const s = fmt(n);
    const fade = eout(prog(e, a0 - 0.2, a0 + 0.1));
    if (style !== 'drop') {
      const p = eout(prog(e, a0, a1));
      const pop = 1 + 0.06 * Math.sin(Math.PI * prog(e, a1 - 0.05, a1 + 0.3));
      ctx.save(); ctx.translate(x, y); ctx.scale(pop, pop);
      text(fmt(n * p), 0, 0, size, color, 'center', fade, true);
      ctx.restore();
      return;
    }
    // 'drop': each digit drops into its own slot from above, last digit first; one glyph per slot, never stacked
    const tw = measure(s, size), lh = size * 1.15;
    let cx = x - tw / 2;
    ctx.save();
    ctx.beginPath(); ctx.rect(x - tw / 2 - 20, y - lh / 2, tw + 40, lh); ctx.clip();
    const nd = s.replace(/,/g, '').length;
    let di = 0;
    for (const ch of s) {
      const w = measure(ch, size);
      if (ch === ',') { text(ch, cx + w / 2, y, size, color, 'center', eout(prog(e, a1 - 0.3, a1)), true); cx += w; continue; }
      const st = a0 + (nd - 1 - di) * ((a1 - a0 - 0.45) / Math.max(1, nd - 1));
      const p = eout(prog(e, st, st + 0.45));
      if (p > 0) text(ch, cx + w / 2, y - (1 - p) * lh, size, color, 'center', p, true);
      cx += w; di++;
    }
    ctx.restore();
  }

  const IMG = {};
  const loadImage = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error(src)); im.src = src; });
  function tint(img, color) {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function photo(img, x, y, w, h, f = [0.5, 0.5], z = 1) {
    const s = Math.max(w / img.width, h / img.height) * z;
    const iw = img.width * s, ih = img.height * s;
    const px = clamp(x + w / 2 - f[0] * iw, x + w - iw, x);
    const py = clamp(y + h / 2 - f[1] * ih, y + h - ih, y);
    ctx.drawImage(img, px, py, iw, ih);
  }
  let LOGO_W, LOGO_N;
  function logo(cx, cy, h, alpha = 1, white = false) {
    if (alpha <= 0) return;
    const im = white ? LOGO_W : LOGO_N;
    const w = h * im.width / im.height;
    ctx.save(); ctx.globalAlpha *= alpha;
    if (white) { ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 2; }
    ctx.drawImage(im, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
  }
  const logoW = h => h * LOGO_N.width / LOGO_N.height;

  // ---------- background, header, footer ----------
  let DOTS;
  function makeDots() {
    DOTS = mk();
    const g = DOTS.getContext('2d');
    g.fillStyle = 'rgba(11,31,75,0.06)';
    for (let y = 18; y < H; y += 36) for (let x = 18; x < W; x += 36) g.fillRect(x - 1.5, y - 1.5, 3, 3);
  }
  function background(t, glow = [0.85, 0.15]) {
    ctx.fillStyle = C.white; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(DOTS, 0, ((t * 5) % 36) - 36);
    ctx.drawImage(DOTS, 0, ((t * 5) % 36) - 36 + H);
    const r = ctx.createRadialGradient(W * glow[0], H * glow[1], 20, W * glow[0], H * glow[1], W * 0.9);
    r.addColorStop(0, 'rgba(16,185,129,0.10)'); r.addColorStop(1, 'rgba(16,185,129,0)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  }
  // header: the logo at frame scale, top-left inside the safe area; series title on the right
  function header(e = 9, step = -1) {
    const lw = logoW(LOGO_H);
    logo(M + lw / 2, Y(10 + LOGO_H / 2), LOGO_H, 1);
    ctx.fillStyle = C.green; ctx.fillRect(W - M - 8, Y(34), 8, 82);
    text('إنفوجرافيك', W - M - 22, Y(52), 28, C.green, 'right');
    text(I.title, W - M - 22, Y(96), 34, C.ink, 'right');
    if (step >= 0) {
      const a = eout(prog(e, 0.1, 0.6));
      for (let k = 0; k < 5; k++) {
        const x = W - M - (k + 1) * 66 + 8;
        ctx.fillStyle = k < step ? 'rgba(11,31,75,0.55)' : 'rgba(11,31,75,0.12)'; ctx.fillRect(x, Y(140), 58, 6);
        if (k === step) { ctx.fillStyle = C.green; ctx.fillRect(x + 58 * (1 - a), Y(140), 58 * a, 6); }
      }
    }
  }
  function footer(alpha = 1, two = false) {
    const y = Y(1270 + EX) - (two ? 40 : 18);
    text(I.source, W / 2, y, 24, C.mute, 'center', alpha);
    if (two) text(I.source2, W / 2, y + 34, 24, C.mute, 'center', alpha);
  }
  // titles rise out of a mask
  function title(s, y, e, d = 0.15) {
    const a = eout(prog(e, d, d + 0.5));
    ctx.save(); ctx.beginPath(); ctx.rect(0, y - 45, W, 90); ctx.clip();
    text(s, W / 2, y + (1 - a) * 70, 56, C.ink, 'center', 1);
    ctx.restore();
  }

  // ---------- map ----------
  const RAD = Math.PI / 180;
  const mercY = lat => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2)) / RAD;
  const GRID = Uint8Array.from(atob(MD.grid), ch => ch.charCodeAt(0));
  const GY1 = mercY(MD.box.lat1);
  const IDX = {};
  MD.ids.forEach((id, i) => { if (id) IDX[id] = i; });
  const CELLS = [];
  for (let r = 0; r < MD.rows; r++) {
    const my = GY1 - (r + 0.5) * MD.cell;
    if (my < mercY(6) || my > mercY(44)) continue;
    for (let c = 0; c < MD.cols; c++) {
      const ci = GRID[r * MD.cols + c];
      if (!ci) continue;
      const x = MD.box.lon0 + (c + 0.5) * MD.cell;
      if (x < -30 || x > 38) continue;
      CELLS.push(x, my, ci);
    }
  }
  const WS = IDX['732'];
  function drawMap(rect, cam, colour, alpha = 1) {
    const k = rect.w / cam.w, cy = mercY(cam.lat);
    const ox = rect.x + rect.w / 2, oy = rect.y + rect.h / 2;
    const size = MD.cell * k, sq = Math.max(1.5, size * 0.74);
    ctx.save();
    ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
    ctx.globalAlpha *= alpha;
    const base = new Path2D();
    for (let i = 0; i < CELLS.length; i += 3) {
      const sx = ox + (CELLS[i] - cam.lon) * k, sy = oy - (CELLS[i + 1] - cy) * k;
      if (sx < rect.x - size || sx > rect.x + rect.w + size || sy < rect.y - size || sy > rect.y + rect.h + size) continue;
      const c = colour ? colour(CELLS[i + 2], CELLS[i], CELLS[i + 1]) : null;
      if (!c) { base.rect(sx - sq / 2, sy - sq / 2, sq, sq); continue; }
      ctx.fillStyle = rgb(c[0], c[1]);
      const s2 = sq * (c[2] || 1);
      ctx.fillRect(sx - s2 / 2, sy - s2 / 2, s2, s2);
    }
    ctx.fillStyle = rgb(C.landRGB); ctx.fill(base);
    ctx.restore();
    return (lon, lat) => [ox + (lon - cam.lon) * k, oy - (mercY(lat) - cy) * k];
  }
  const wave = (c, e, lon, my, speed = 22) => clamp((e * speed - Math.hypot(lon - c.lon, my - mercY(c.lat))) / 4);
  function pill(s, x, y, size, fill, color, alpha = 1, sc = 1) {
    if (alpha <= 0) return;
    const w = measure(s, size) + size * 0.9, h = size * 1.55;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = fill; rrect(-w / 2, -h / 2, w, h, 8); ctx.fill(); ctx.restore();
    text(s, 0, 1, size, color, 'center', alpha);
    ctx.restore();
  }

  // ---------- scenes (e = seconds since the scene's cut) ----------
  function sceneHook(e) {
    const img = IMG[I.hook.img];
    photo(img, 0, 0, W, H, [lerp(0.62, 0.55, e / 5), 0.45], 1.22 - 0.12 * eout(prog(e, 0, 5.5)));
    const g = ctx.createLinearGradient(0, H * 0.32, 0, H);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.9)'); g.addColorStop(0.62, '#fff'); g.addColorStop(1, '#fff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const la = eout(prog(e, 0.15, 0.9));
    logo(W / 2, Y(30 + 110) - (1 - la) * 20, 220, la, true);
    const by = Y(830 + EX);
    const a1 = eout(prog(e, BEAT, BEAT + 0.4));
    const t1 = 'إنفوجرافيك', t2 = 'المنطقة المغاربية', ts = 34;
    const w1 = measure(t1, ts) + 40, w2 = measure(t2, ts) + 40;
    ctx.save(); ctx.beginPath(); ctx.rect(W - M - (w1 + w2) * a1, by, (w1 + w2) * a1, 58); ctx.clip();
    ctx.fillStyle = C.green; ctx.fillRect(W - M - w1, by, w1, 58);
    ctx.fillStyle = C.navy; ctx.fillRect(W - M - w1 - w2, by, w2, 58);
    text(t1, W - M - w1 / 2, by + 30, ts, C.white, 'center');
    text(t2, W - M - w1 - w2 / 2, by + 30, ts, C.white, 'center');
    ctx.restore();
    const line = (s, y, col, d) => {
      const a = eout(prog(e, d, d + 0.55));
      ctx.save(); ctx.beginPath(); ctx.rect(0, y - 70, W, 140); ctx.clip();
      text(s, W - M, y + (1 - a) * 120, 100, col, 'right');
      ctx.restore();
    };
    line('كم عدد الإبل', by + 145, C.ink, BEAT * 2);
    line('في المنطقة المغاربية؟', by + 265, C.green, BEAT * 3);
    const rw = 240 * eout(prog(e, BEAT * 4, BEAT * 4 + 0.5));
    ctx.fillStyle = C.red; ctx.fillRect(W - M - rw, by + 345, rw, 8);
    text('أرقام موريتانيا والجزائر وتونس والمغرب وليبيا', W - M, by + 400, 36, C.mute, 'right', eout(prog(e, BEAT * 5, BEAT * 5 + 0.5)));
  }

  function sceneTotal(e, t) {
    background(t);
    header(e);
    title('مجموع الإبل في الدول الخمس', Y(250), e);
    const rect = { x: 30, y: Y(300), w: W - 60, h: 560 + EX * 0.6 };
    const cam = { lon: 3.0, lat: 26.0, w: lerp(64, 54, eio(prog(e, -0.5, 3))) };
    // the countries light up on successive eighth notes, Mauritania first
    const start = I.countries.map((c, i) => BEAT * (1 + i * 0.5));
    const byId = {};
    I.countries.forEach((c, i) => { byId[IDX[c.id]] = i; });
    const P = drawMap(rect, cam, (ci, lon, my) => {
      if (ci === WS) return [C.wsRGB, 1];
      const i = byId[ci];
      if (i === undefined) return null;
      const w = wave(I.countries[i], e - start[i], lon, my, 30);
      if (w <= 0) return null;
      return [mix(C.landRGB, i === 0 ? C.greenRGB : C.greenDk, w), 1, w < 1 ? 1.25 : 1];
    });
    I.countries.forEach((c, i) => {
      const [x, y] = P(c.lon, c.lat);
      const p = prog(e, start[i] + 0.25, start[i] + 0.65);
      pill(c.name, x, y, 30, C.navy, C.white, eout(p), lerp(0.6, 1, eback(p)));
    });
    const cy = Y(960 + EX * 0.8);
    figure(TOTAL, W / 2, cy, 150, C.green, e, BEAT * 1.5, BEAT * 6, 'count');
    run([{ s: 'رأس من الإبل', size: 46, color: C.ink }, { s: '–', size: 46, color: C.mute },
         { s: 'نحو', size: 46, color: C.mute }, { s: (TOTAL / 1e6).toFixed(1), size: 50, color: C.ink, ltr: true, dy: -2 },
         { s: 'مليون', size: 46, color: C.mute }], W / 2, cy + 112, 'center', eout(prog(e, BEAT * 6, BEAT * 6 + 0.5)));
    footer(eout(prog(e, 1, 1.6)));
  }

  function sceneWorld(e, t) {
    photo(IMG[I.worldImg], 0, 0, W, H, [lerp(0.4, 0.6, clamp(e / 5)), 0.5], 1.15);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(DOTS, 0, 0);
    header(e);
    title('مكانة المنطقة في العالم', Y(250), e);
    const cx = W / 2, cy = Y(570 + EX * 0.5), R = 225;
    const share = TOTAL / I.world;
    const p = eio(prog(e, BEAT, BEAT * 3));
    ctx.save();
    ctx.lineWidth = 54; ctx.lineCap = 'butt';
    ctx.strokeStyle = 'rgba(11,31,75,0.09)';
    ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * eio(prog(e, 0, BEAT * 1.6))); ctx.stroke();
    ctx.strokeStyle = C.green;
    if (p > 0) { ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * share * p); ctx.stroke(); }
    ctx.restore();
    text(`${(share * 100 * p).toFixed(1)}%`, cx, cy - 18, 124, C.ink, 'center', eout(prog(e, BEAT * 0.8, BEAT * 1.4)), true);
    text('من إبل العالم', cx, cy + 78, 42, C.green, 'center', eout(prog(e, BEAT * 3, BEAT * 3 + 0.4)));
    const ly = Y(925 + EX * 0.9);
    const row = (y, label, num, col, bg, d) => {
      const a = eout(prog(e, d, d + 0.45));
      const x0 = 90 - (1 - a) * 60;
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = bg; rrect(x0, y - 50, W - 180, 100, 18); ctx.fill(); ctx.restore();
      text(label, W - 130, y, 40, C.ink, 'right', a);
      run([{ s: num, size: 52, color: col, ltr: true, dy: -2 }, { s: 'مليون رأس', size: 40, color: col }], x0 + 40, y, 'left', a);
    };
    row(ly, 'العالم', '44.3', C.ink, 'rgba(11,31,75,0.07)', BEAT * 4);
    row(ly + 120, 'المنطقة المغاربية', (TOTAL / 1e6).toFixed(1), C.green, 'rgba(16,185,129,0.16)', BEAT * 5);
    footer(eout(prog(e, 1, 1.6)));
  }

  // each country slide shares the layout but has its own camera move, figure style and map effect
  const MOVES = [
    { z: [1.04, 1.18], f: [[0.6, 0.55], [0.64, 0.5]] },   // slow push in
    { z: [1.28, 1.28], f: [[0.3, 0.5], [0.7, 0.5]] },     // pan
    { z: [1.3, 1.05], f: [[0.5, 0.4], [0.5, 0.5]] },      // pull out
    { z: [1.3, 1.3], f: [[0.5, 0.75], [0.5, 0.3]] },      // tilt up
    { z: [1.12, 1.26], f: [[0.4, 0.35], [0.6, 0.5]] },    // diagonal drift
  ];
  const FIG = ['count', 'drop', 'count', 'drop', 'count'];
  function sceneCountry(e, t, i) {
    const c = I.countries[i], mv = MOVES[i];
    background(t, [i % 2 ? 0.15 : 0.85, 0.2]);
    header(e, i);
    const px = M, py = Y(195), pw = W - 2 * M, ph = 430 + EX * 0.7;
    const kb = eio(prog(e, -0.5, 5.2));
    ctx.save();
    rrect(px, py, pw, ph, 26); ctx.clip();
    photo(IMG[c.img], px, py, pw, ph, [lerp(mv.f[0][0], mv.f[1][0], kb), lerp(mv.f[0][1], mv.f[1][1], kb)], lerp(mv.z[0], mv.z[1], kb));
    const g = ctx.createLinearGradient(0, py + ph * 0.45, 0, py + ph);
    g.addColorStop(0, 'rgba(11,31,75,0)'); g.addColorStop(1, 'rgba(11,31,75,0.9)');
    ctx.fillStyle = g; ctx.fillRect(px, py, pw, ph);
    ctx.restore();
    // rank badge pops, then the name slides out of a mask
    const pb = prog(e, 0.15, 0.55);
    if (pb > 0) {
      const ab = eback(pb);
      ctx.save(); ctx.translate(px + pw - 72, py + ph - 80); ctx.scale(ab, ab);
      ctx.fillStyle = C.green; ctx.fillRect(-48, -48, 96, 96);
      text(String(i + 1), 0, 4, 66, C.white, 'center', 1, true);
      ctx.restore();
    }
    const an = eout(prog(e, 0.3, 0.8));
    ctx.save(); ctx.beginPath(); ctx.rect(px, py + ph - 140, pw - 140, 120); ctx.clip();
    text(c.name, px + pw - 148 + (1 - an) * 90, py + ph - 76, 84, C.white, 'right', an);
    ctx.restore();
    // mini map
    const mr = { x: px + 20, y: py + 20, w: 290, h: 220 };
    const ma = eout(prog(e, 0.4, 0.8));
    ctx.save(); ctx.globalAlpha = ma; ctx.fillStyle = 'rgba(255,255,255,0.92)'; rrect(mr.x, mr.y, mr.w, mr.h, 16); ctx.fill(); ctx.restore();
    drawMap({ x: mr.x + 8, y: mr.y + 8, w: mr.w - 16, h: mr.h - 16 }, { lon: 3.5, lat: 26.5, w: 54 }, (ci, lon, my) => {
      if (ci === WS) return [C.wsRGB, 1];
      if (ci !== IDX[c.id]) return null;
      const w = wave(c, e - 0.5, lon, my, i % 2 ? 40 : 18);
      return w > 0 ? [mix(C.landRGB, C.greenRGB, w), 1] : null;
    }, ma);
    // the figure lands on beat 3
    const ny = py + ph + 105;
    figure(c.n, W / 2, ny, 140, C.green, e, BEAT * 0.8, BEAT * 3, FIG[i]);
    text('رأس من الإبل', W / 2, ny + 92, 44, C.ink, 'center', eout(prog(e, BEAT * 3, BEAT * 3 + 0.4)));
    const by = ny + 182;
    const ba = eout(prog(e, BEAT * 3.5, BEAT * 3.5 + 0.4));
    run([{ s: `${pct(c.n)}%`, size: 44, color: C.green, ltr: true, dy: -2 }, { s: 'من إبل المنطقة المغاربية', size: 36, color: C.ink }], W - M, by, 'right', ba);
    ctx.save(); ctx.globalAlpha = ba;
    ctx.fillStyle = 'rgba(11,31,75,0.08)'; rrect(M, by + 40, W - 2 * M, 22, 11); ctx.fill();
    const bw = (W - 2 * M) * (c.n / TOTAL) * eio(prog(e, BEAT * 3.6, BEAT * 5));
    ctx.fillStyle = C.green; rrect(W - M - bw, by + 40, Math.max(bw, 22), 22, 11); ctx.fill();
    ctx.restore();
    const fy = by + 120;
    const fa = eout(prog(e, BEAT * 5, BEAT * 5 + 0.4));
    text(c.rank, W - M + (1 - fa) * 30, fy, 40, C.ink, 'right', fa);
    const fb = eout(prog(e, BEAT * 5.5, BEAT * 5.5 + 0.4));
    const parts = (arr, size, color) => arr.map(x => ({ s: x, size, color, ltr: /^[\d.,%()]+$/.test(x) }));
    if (c.factChip) {
      const ps = parts(c.fact, 32, C.white);
      const w = ps.reduce((a, p) => a + measure(p.s, 32), 0) + 14 * (ps.length - 1) + 44;
      ctx.save(); ctx.globalAlpha = fb; ctx.fillStyle = C.navy; rrect(M, fy - 30, w * fb, 60, 10); ctx.fill(); ctx.restore();
      run(ps, M + w / 2, fy + 1, 'center', prog(e, BEAT * 5.5 + 0.2, BEAT * 5.5 + 0.5));
    } else {
      run(parts(c.fact, 36, C.green), M - (1 - fb) * 30, fy, 'left', fb);
    }
    footer(1);
  }

  function sceneRank(e, t) {
    background(t, [0.5, 0.1]);
    header(e);
    title('ترتيب الدول حسب عدد الإبل', Y(250), e);
    text(`تقديرات ${I.year}`, W / 2, Y(308), 32, C.mute, 'center', eout(prog(e, 0.5, 0.9)));
    const max = I.countries[0].n;
    const top = Y(350), rowH = 104 + EX * 0.2;
    const nameW = 200, barR = W - M - nameW - 20, barMax = barR - M - 220;
    I.countries.forEach((c, i) => {
      const y = top + i * rowH + rowH / 2;
      const d = BEAT * (1 + i);                         // one bar per beat
      const a = eout(prog(e, d - 0.25, d + 0.1));
      text(c.name, W - M + (1 - a) * 40, y, 44, C.ink, 'right', a);
      const p = eout(prog(e, d, d + 0.9));
      const bw = Math.max(16, barMax * (c.n / max) * p);
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(11,31,75,0.06)'; rrect(barR - barMax, y - 30, barMax, 60, 10); ctx.fill();
      ctx.fillStyle = i === 0 ? C.green : C.navy; rrect(barR - bw, y - 30, bw, 60, 10); ctx.fill();
      ctx.restore();
      text(fmt(c.n * p), barR - bw - 16, y, 40, C.ink, 'right', a, true);
    });
    const iy = top + 5 * rowH + 35;
    const ia = eout(prog(e, BEAT * 6, BEAT * 6 + 0.45));
    ctx.save(); ctx.globalAlpha = ia;
    ctx.fillStyle = 'rgba(11,31,75,0.05)'; rrect(M, iy, W - 2 * M, 190, 18); ctx.fill();
    ctx.fillStyle = C.red; ctx.fillRect(W - M - 8, iy, 8, 190 * ia);
    ctx.restore();
    const pp = prog(e, BEAT * 6, BEAT * 6 + 0.4);
    if (pp > 0) pill('لافت', W - 140, iy + 45, 30, C.red, C.white, eout(pp), lerp(0.6, 1, eback(pp)));
    text('موريتانيا وحدها تملك قرابة ثلثي', W - 100, iy + 105, 42, C.ink, 'right', eout(prog(e, BEAT * 6.5, BEAT * 6.5 + 0.4)));
    run([{ s: 'إبل المنطقة', size: 42, color: C.ink }, { s: `(${pct(max)}%)`, size: 42, color: C.green, ltr: true }], W - 100, iy + 155, 'right', eout(prog(e, BEAT * 7, BEAT * 7 + 0.4)));
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
  function sceneOutro(e, t) {
    background(t, [0.5, 0.35]);
    drawMap({ x: 0, y: 0, w: W, h: H }, { lon: 3.5, lat: 26, w: lerp(46, 40, prog(e, 0, 7.5)) }, (ci) => {
      if (ci === WS) return [C.wsRGB, 1];
      return I.countries.some(c => IDX[c.id] === ci) ? [mix(C.landRGB, C.greenRGB, 0.35), 1] : null;
    }, 0.4 * eout(prog(e, 0, 1)));
    const r = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 640);
    r.addColorStop(0, 'rgba(255,255,255,0.95)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    const cy = TOP + (BOT - TOP) * (FORMAT === 'story' ? 0.24 : 0.22);
    // the logo lands on the final chord (the cut is on the downbeat)
    const lp = prog(e, 0, 0.7);
    const ls = lerp(1.25, 1, eout(lp));
    logo(W / 2, cy, 360 * ls, eout(prog(e, 0, 0.35)));
    let y = cy + 290;
    text('تابعونا', W / 2, y, 34, C.mute, 'center', eout(prog(e, BEAT * 3, BEAT * 3 + 0.4)));
    y += 72;
    const s = 60;
    SOCIAL.forEach((row, ri) => {
      const a = eout(prog(e, BEAT * (3.5 + ri * 0.5), BEAT * (3.5 + ri * 0.5) + 0.4));
      const hw = measure(row.handle, 42);
      const total = row.icons.length * (s + 12) + 10 + hw;
      let x = W / 2 - total / 2;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * 20);
      for (const n of row.icons) { icon(n, x, y - s / 2, s); x += s + 12; }
      text(row.handle, x + 10, y + 2, 42, C.ink, 'left', 1, true);
      ctx.restore();
      y += 88;
    });
    const wa = eout(prog(e, BEAT * 5, BEAT * 5 + 0.5));
    const ww = measure(I.site, 42) + 70;
    if (wa > 0) {
      ctx.fillStyle = C.green; rrect(W / 2 - (ww * wa) / 2, y - 37, ww * wa, 74, 37); ctx.fill();
      text(I.site, W / 2, y + 2, 42, C.white, 'center', prog(e, BEAT * 5 + 0.2, BEAT * 5 + 0.6), true);
    }
    footer(eout(prog(e, BEAT * 6, BEAT * 6 + 0.6)), true);
  }

  function drawScene(k, t) {
    const e = t - STARTS[k];
    const name = TM.scenes[k];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.white; ctx.fillRect(0, 0, W, H);
    if (name === 'hook') sceneHook(e, t);
    else if (name === 'total') sceneTotal(e, t);
    else if (name === 'world') sceneWorld(e, t);
    else if (name === 'rank') sceneRank(e, t);
    else if (name === 'outro') sceneOutro(e, t);
    else sceneCountry(e, t, +name.slice(1));
  }

  // ---------- transitions: one per cut, each different ----------
  const MOS = 60;
  const TRANS = {
    // the opening photo pushes towards the viewer and dissolves into the data
    zoom(A, B, p) {
      const q = eio(p);
      ctx.save(); ctx.translate(W / 2, H / 2); const sb = lerp(1.08, 1, q); ctx.scale(sb, sb); ctx.drawImage(B, -W / 2, -H / 2); ctx.restore();
      ctx.save(); ctx.globalAlpha = 1 - q; ctx.translate(W / 2, H * 0.45); const sa = 1 + 0.35 * q; ctx.scale(sa, sa); ctx.drawImage(A, -W / 2, -H * 0.45); ctx.restore();
    },
    // a circle opens from the centre with a green edge
    iris(A, B, p) {
      const q = eio(p), R = Math.hypot(W, H) / 2 * q;
      ctx.drawImage(A, 0, 0);
      ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H / 2, R, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(B, 0, 0); ctx.restore();
      ctx.save(); ctx.strokeStyle = C.green2; ctx.lineWidth = 14 * (1 - q) + 2; ctx.beginPath(); ctx.arc(W / 2, H / 2, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    },
    // the page is pushed to the right (reading direction), the next follows from the left
    push(A, B, p) {
      const q = eio(p);
      ctx.drawImage(A, W * q, 0);
      ctx.drawImage(B, W * (q - 1) - 24, 0);
      ctx.fillStyle = C.green; ctx.fillRect(W * q - 24, 0, 24, H);
    },
    // vertical blinds turn one after the other, right to left
    blinds(A, B, p) {
      ctx.drawImage(A, 0, 0);
      const n = 8, sw = W / n;
      for (let i = 0; i < n; i++) {
        const pi = eio(clamp(p * 1.7 - i * 0.09));
        if (pi <= 0) continue;
        const x1 = W - i * sw, w = sw * pi;
        ctx.drawImage(B, x1 - w, 0, w, H, x1 - w, 0, w, H);
        if (pi < 1) { ctx.fillStyle = C.green; ctx.fillRect(x1 - w - 6, 0, 6, H); }
      }
    },
    // a slanted green band sweeps across
    diag(A, B, p) {
      const q = eio(p), sl = 420, band = 110;
      const x = lerp(W + band, -sl - band, q);       // bottom-left corner of the band
      ctx.drawImage(A, 0, 0);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(x + band + sl, 0); ctx.lineTo(W + 10, 0); ctx.lineTo(W + 10, H); ctx.lineTo(x + band, H); ctx.closePath();
      ctx.clip(); ctx.drawImage(B, 0, 0); ctx.restore();
      ctx.fillStyle = C.green;
      ctx.beginPath(); ctx.moveTo(x + sl, 0); ctx.lineTo(x + sl + band, 0); ctx.lineTo(x + band, H); ctx.lineTo(x, H); ctx.closePath(); ctx.fill();
    },
    // the page shrinks back and lifts away, the next one rises from below
    rise(A, B, p) {
      const q = eio(p);
      ctx.fillStyle = '#E9EDF4'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = 1 - q * 0.6; ctx.translate(W / 2, H / 2 - H * 0.25 * q); const s = 1 - 0.12 * q; ctx.scale(s, s); ctx.drawImage(A, -W / 2, -H / 2); ctx.restore();
      ctx.save(); ctx.shadowColor = 'rgba(11,31,75,0.3)'; ctx.shadowBlur = 40; ctx.drawImage(B, 0, H * (1 - q)); ctx.restore();
    },
    // pixel mosaic, like the dotted map
    mosaic(A, B, p) {
      ctx.drawImage(A, 0, 0);
      const cols = Math.ceil(W / MOS), rows = Math.ceil(H / MOS);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const th = 0.05 + 0.75 * (0.5 * hash(r * 97 + c) + 0.5 * (c / cols));   // drifts right to left
        const x = W - (c + 1) * MOS, y = r * MOS;
        if (p >= th + 0.1) ctx.drawImage(B, x, y, MOS, MOS, x, y, MOS, MOS);
        else if (p >= th) { ctx.fillStyle = (r + c) % 3 ? C.green : C.navy; ctx.fillRect(x + 4, y + 4, MOS - 8, MOS - 8); }
      }
    },
    // brand panels with the logo, for the move to the summary
    panel(A, B, p) {
      const q = eio(p);
      ctx.drawImage(p < 0.5 ? A : B, 0, 0);
      const draw = (lead, color) => {
        const xl = W * (1.05 - 2.4 * q) - lead, sl = 160;
        ctx.fillStyle = color; ctx.beginPath();
        ctx.moveTo(xl + sl, 0); ctx.lineTo(xl + W * 1.3 + sl, 0); ctx.lineTo(xl + W * 1.3, H); ctx.lineTo(xl, H); ctx.closePath(); ctx.fill();
      };
      draw(70, C.green); draw(0, C.navy);
      const cx = W * (1.05 - 2.4 * q) + W * 0.65 + 80;
      if (cx > -300 && cx < W + 300) logo(cx, H / 2, 240, 1, true);
    },
    // white flash on the final chord
    flash(A, B, p) {
      ctx.drawImage(p < 0.5 ? A : B, 0, 0);
      ctx.fillStyle = `rgba(255,255,255,${1 - Math.abs(p - 0.5) * 2})`; ctx.fillRect(0, 0, W, H);
    },
  };

  function renderFrame(t) {
    let k = 0;
    while (k < TM.cuts.length && t >= TM.cuts[k]) k++;
    let tr = -1;
    TM.cuts.forEach((c, j) => { const d = TM.tdur[j]; if (t > c - d / 2 && t < c + d / 2) tr = j; });
    ctx = mainCtx;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    if (tr < 0) {
      drawScene(k, t);
    } else {
      const d = TM.tdur[tr], p = (t - (TM.cuts[tr] - d / 2)) / d;
      ctx = BUF[0].getContext('2d'); drawScene(tr, t);
      ctx = BUF[1].getContext('2d'); drawScene(tr + 1, t);
      ctx = mainCtx;
      ctx.fillStyle = C.white; ctx.fillRect(0, 0, W, H);
      TRANS[TM.trans[tr]](BUF[0], BUF[1], p);
    }
    ctx = mainCtx;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    const f = Math.max(1 - prog(t, 0, 0.3), prog(t, DURATION - 0.8, DURATION));
    if (f > 0) { ctx.fillStyle = `rgba(255,255,255,${f})`; ctx.fillRect(0, 0, W, H); }
  }
  function renderCover() { renderFrame(4.3); }

  async function init() {
    await document.fonts.load(font(48));
    await document.fonts.ready;
    const files = new Set([I.hook.img, I.worldImg, ...I.countries.map(c => c.img)]);
    await Promise.all([...files].map(async f => { IMG[f] = await loadImage('img/' + f); }));
    const lm = await loadImage('../../assets/logo-mark.png');
    LOGO_W = tint(lm, '#fff');
    LOGO_N = tint(lm, C.navy);
    makeDots();
    window.renderFrame = renderFrame;
    window.renderCover = renderCover;
    window.DURATION = DURATION;
    window.SIZE = [W, H];
    window.READY = true;
    renderFrame(parseFloat(q.get('t') || '0'));
  }
  init();
})();
