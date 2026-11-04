// Erriwaya infographic renderer (Murphy Oil contracts, built on the camels-maghreb template): draws one frame for a given time with renderFrame(t).
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
    landRGB: [222, 228, 238], wsRGB: [190, 200, 216],
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
    const s = style === 'year' ? String(n) : fmt(n);
    const fade = eout(prog(e, a0 - 0.2, a0 + 0.1));
    if (style !== 'drop' && style !== 'year') {
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
  function footer(alpha = 1, src = I.src.main) {
    text(src, W / 2, Y(1270 + EX) - 18, 24, C.mute, 'center', alpha);
  }
  // titles fade in with a short rise (no clipping, so a line is never shown cut)
  function title(s, y, e, d = 0.15) {
    const a = eout(prog(e, d, d + 0.5));
    text(s, W / 2, y + (1 - a) * 30, 56, C.ink, 'center', a);
  }

  // ---------- map ----------
  const RAD = Math.PI / 180;
  const mercY = lat => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2)) / RAD;
  const GRID = Uint8Array.from(atob(MD.grid), ch => ch.charCodeAt(0));
  (window.WS_CELLS || []).forEach(i => { GRID[i] = MD.ids.indexOf('732'); });   // Western Sahara whole
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


  // ---------- offshore detail map (vector coast, same palette as the dotted map) ----------
  const DT = window.DETAIL;
  const DLAND = {}; for (const k in DT.land) DLAND[k] = new Path2D(DT.land[k]);
  // draws the coast in rect, camera = centre (detail units) and zoom; returns a point mapper
  function drawDetail(rect, cx, cy, zoom, e, alpha = 1) {
    const k = rect.w / DT.w * zoom;
    const ox = rect.x + rect.w / 2 - cx * k, oy = rect.y + rect.h / 2 - cy * k;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
    // sea: very light navy with a dot grid
    ctx.fillStyle = '#F3F6FA'; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(11,31,75,0.07)';
    const s = 26;
    for (let y = rect.y + 13; y < rect.y + rect.h; y += s) for (let x = rect.x + 13; x < rect.x + rect.w; x += s) ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    ctx.translate(ox, oy); ctx.scale(k, k);
    ctx.fillStyle = rgb(C.landRGB); ctx.fill(DLAND.eh); ctx.fill(DLAND.sn);
    ctx.fillStyle = rgb(mix(C.landRGB, C.greenRGB, 0.35)); ctx.fill(DLAND.mr);
    ctx.lineWidth = 3 / k; ctx.strokeStyle = C.green; ctx.stroke(DLAND.mr);
    ctx.restore();
    return (p) => [ox + p[0] * k, oy + p[1] * k];
  }
  function pulse(x, y, r, col, e, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    for (let j = 0; j < 2; j++) {
      const q = ((e * 0.8 + j * 0.5) % 1);
      ctx.strokeStyle = col; ctx.lineWidth = 4 * (1 - q);
      ctx.beginPath(); ctx.arc(x, y, r + 46 * q, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.white; ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
  }
  function dot(x, y, r, col, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.white; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
  }
  function dashed(x0, y0, x1, y1, col, w, a = 1) {
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
  }
  // label pill anchored by its right or left edge
  function tag(s, x, y, size, fill, color, a, side = 'right') {
    if (a <= 0) return;
    const w = measure(s, size) + size * 0.9;
    pill(s, side === 'right' ? x - w / 2 : x + w / 2, y, size, fill, color, a, 1);
  }
  // header progress for the five detail slides
  const STEP = { sign: 0, c10: 1, tiof: 2, murphy: 3, chariot: 4 };

  // ---------- scenes (e = seconds since the scene's cut) ----------
  function sceneHook(e) {
    const img = IMG[I.img.hook];
    photo(img, 0, 0, W, H, [lerp(0.5, 0.42, e / 5), 0.38], 1.2 - 0.1 * eout(prog(e, 0, 5.5)));
    const g = ctx.createLinearGradient(0, H * 0.3, 0, H);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.9)'); g.addColorStop(0.62, '#fff'); g.addColorStop(1, '#fff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const sh = ctx.createLinearGradient(0, 0, 0, Y(380));
    sh.addColorStop(0, 'rgba(11,31,75,0.55)'); sh.addColorStop(1, 'rgba(11,31,75,0)');
    ctx.fillStyle = sh; ctx.fillRect(0, 0, W, Y(380));
    const la = eout(prog(e, 0.15, 0.9));
    logo(W / 2, Y(30 + 110) - (1 - la) * 20, 220, la, true);
    const by = Y(800 + EX);
    const a1 = eout(prog(e, BEAT, BEAT + 0.4));
    const t1 = 'إنفوجرافيك', t2 = I.kicker, ts = 34;
    const w1 = measure(t1, ts) + 40, w2 = measure(t2, ts) + 40;
    ctx.save(); ctx.beginPath(); ctx.rect(W - M - (w1 + w2) * a1, by, (w1 + w2) * a1, 58); ctx.clip();
    ctx.fillStyle = C.green; ctx.fillRect(W - M - w1, by, w1, 58);
    ctx.fillStyle = C.navy; ctx.fillRect(W - M - w1 - w2, by, w2, 58);
    text(t1, W - M - w1 / 2, by + 30, ts, C.white, 'center');
    text(t2, W - M - w1 - w2 / 2, by + 30, ts, C.white, 'center');
    ctx.restore();
    const line = (s, y, col, d) => {
      const a = eout(prog(e, d, d + 0.55));
      text(s, W - M, y + (1 - a) * 36, 96, col, 'right', a);
    };
    line('عودة الاستكشاف', by + 145, C.ink, BEAT * 2);
    line('إلى البحر الموريتاني', by + 262, C.green, BEAT * 3);
    const rw = 240 * eout(prog(e, BEAT * 4, BEAT * 4 + 0.5));
    ctx.fillStyle = C.red; ctx.fillRect(W - M - rw, by + 340, rw, 8);
    const sa = eout(prog(e, BEAT * 5, BEAT * 5 + 0.5));
    text('عقدان مع شركة مورفي أويل الأمريكية', W - M, by + 400, 38, C.ink, 'right', sa);
    run([{ s: 'نواكشوط', size: 34, color: C.mute }, { s: '·', size: 34, color: C.mute }, { s: '3', size: 34, color: C.mute, ltr: true },
         { s: 'نوفمبر', size: 34, color: C.mute }, { s: '2026', size: 34, color: C.mute, ltr: true }], W - M, by + 455, 'right', sa);
  }

  function sceneMap(e, t) {
    background(t);
    header(e);
    title('أين يقع المقطعان؟', Y(250), e);
    const rect = { x: 30, y: Y(300), w: W - 60, h: 640 + EX * 0.6 };
    // 1) the dotted region map: Mauritania lights up from Nouakchott, the camera closes in on the coast
    const z = eio(prog(e, BEAT * 3, BEAT * 6.5));
    const MR = { lon: -15.98, lat: 18.09 };
    if (z < 1) {
      const cam = { lon: lerp(-9, -16.2, z), lat: lerp(21.5, 18.7, z), w: lerp(30, 9, z) };
      drawMap(rect, cam, (ci, lon, my) => {
        if (ci === WS) return [C.wsRGB, 1];
        if (ci !== IDX['478']) return null;
        const w = wave(MR, e - BEAT * 0.6, lon, my, 12);
        return w > 0 ? [mix(C.landRGB, C.greenRGB, w), 1, w < 1 ? 1.25 : 1] : null;
      }, 1);
      const [x, y] = [rect.x + rect.w / 2 + (MR.lon - cam.lon) * rect.w / cam.w, rect.y + rect.h / 2 - (mercY(MR.lat) - mercY(cam.lat)) * rect.w / cam.w];
      const pa = eout(prog(e, BEAT * 1.2, BEAT * 1.8)) * (1 - z);
      dot(x, y, 12, C.navy, pa);
      tag('نواكشوط', x + 24, y, 30, C.navy, C.white, pa, 'left');
      const mrP = [rect.x + rect.w / 2 + (-10.0 - cam.lon) * rect.w / cam.w, rect.y + rect.h / 2 - (mercY(20.0) - mercY(cam.lat)) * rect.w / cam.w];
      pill('موريتانيا', mrP[0], mrP[1], 34, C.white, C.ink, eout(prog(e, BEAT * 2, BEAT * 2.6)) * (1 - z), 1);
      const wsP = [rect.x + rect.w / 2 + (-13.0 - cam.lon) * rect.w / cam.w, rect.y + rect.h / 2 - (mercY(24.8) - mercY(cam.lat)) * rect.w / cam.w];
      pill('الصحراء الغربية', wsP[0], wsP[1], 28, C.navy, C.white, eout(prog(e, BEAT * 2.4, BEAT * 3)) * (1 - z), 1);
    }
    // 2) the vector coast takes over for the offshore detail
    if (z > 0) {
      const ca = eout(prog(e, BEAT * 5.2, BEAT * 6.5));
      const zoom = lerp(1.0, 1.12, eio(prog(e, BEAT * 6.5, 10)));
      const P = drawDetail(rect, 560, 430, zoom, e, ca);
      const [nx, ny] = P(DT.pts.nkc), [cx, cy] = P(DT.pts.ching), [tx, ty] = P(DT.pts.tiof), [kx, ky] = P(DT.pts.c10);
      const d0 = BEAT * 7;
      dot(nx, ny, 13, C.navy, ca);
      tag('نواكشوط', nx + 24, ny, 30, C.navy, C.white, ca, 'left');
      // C10: dashed zone ~50 km offshore (approximate)
      const ka = eout(prog(e, d0, d0 + 0.5));
      if (ka > 0) {
        const r = 64;
        ctx.save(); ctx.globalAlpha = ka;
        ctx.fillStyle = 'rgba(11,31,75,0.08)'; ctx.strokeStyle = C.navy; ctx.lineWidth = 4; ctx.setLineDash([14, 10]);
        ctx.beginPath(); ctx.arc(kx, ky, r * eout(prog(e, d0, d0 + 0.8)), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
        tag('المقطع C10', kx + r + 14, ky, 32, C.navy, C.white, ka, 'left');
      }
      // Chinguetti for scale, Tiof pulses
      const ga = eout(prog(e, d0 + BEAT, d0 + BEAT + 0.4));
      dot(cx, cy, 11, '#8A96A8', ga);
      tag('حقل شنقيط', cx + 22, cy + 6, 26, C.white, C.mute, ga, 'left');
      const ta = eout(prog(e, d0 + BEAT * 2, d0 + BEAT * 2 + 0.4));
      dashed(cx, cy, cx + (tx - cx) * ta, cy + (ty - cy) * ta, '#8A96A8', 3, ga);
      pulse(tx, ty, 15, C.green, e, ta);
      tag('حقل تيوف', tx - 26, ty, 32, C.green, C.white, ta, 'right');
      tag('نحو 25 كلم', (cx + tx) / 2 + 22, (cy + ty) / 2 + 2, 24, C.white, C.ink, eout(prog(e, d0 + BEAT * 2.6, d0 + BEAT * 3)), 'left');
    }
    const by = rect.y + rect.h + 70;
    const la = eout(prog(e, BEAT * 8, BEAT * 8 + 0.5));
    text('الحوض الساحلي الموريتاني', W / 2, by + (1 - la) * 20, 52, C.ink, 'center', la);
    text(I.src.map, W / 2, by + 62, 28, C.mute, 'center', eout(prog(e, BEAT * 9, BEAT * 9 + 0.5)));
    footer(eout(prog(e, 1, 1.6)), I.src.main);
  }

  // shared photo panel with a dark foot, an optional badge and a name
  function panel(e, img, f, mv, label, badge, note) {
    const px = M, py = Y(195), pw = W - 2 * M, ph = 430 + EX * 0.7;
    const kb = eio(prog(e, -0.5, 7.5));
    ctx.save();
    rrect(px, py, pw, ph, 26); ctx.clip();
    if (typeof img === 'function') img(px, py, pw, ph, kb);
    else photo(img, px, py, pw, ph, [lerp(mv.f[0][0], mv.f[1][0], kb), lerp(mv.f[0][1], mv.f[1][1], kb)], lerp(mv.z[0], mv.z[1], kb));
    const g = ctx.createLinearGradient(0, py + ph * 0.45, 0, py + ph);
    g.addColorStop(0, 'rgba(11,31,75,0)'); g.addColorStop(1, 'rgba(11,31,75,0.9)');
    ctx.fillStyle = g; ctx.fillRect(px, py, pw, ph);
    ctx.restore();
    let nx = px + pw - 40;
    if (badge) {
      const pb = prog(e, 0.15, 0.55);
      if (pb > 0) {
        const ab = eback(pb);
        ctx.save(); ctx.translate(px + pw - 72, py + ph - 80); ctx.scale(ab, ab);
        ctx.fillStyle = C.green; ctx.fillRect(-48, -48, 96, 96);
        text(badge, 0, 4, 66, C.white, 'center', 1, true);
        ctx.restore();
      }
      nx = px + pw - 148;
    }
    const an = eout(prog(e, 0.3, 0.8));
    text(label, nx + (1 - an) * 40, py + ph - 76, 80, C.white, 'right', an);
    if (note) {
      const w = measure(note, 24) + 28;
      ctx.save(); ctx.globalAlpha = an; ctx.fillStyle = 'rgba(11,31,75,0.55)'; rrect(px + 20, py + 20, w, 42, 8); ctx.fill(); ctx.restore();
      text(note, px + 20 + w / 2, py + 42, 24, C.white, 'center', an);
    }
    return { px, py, pw, ph };
  }

  function sceneSign(e, t) {
    background(t, [0.85, 0.2]);
    header(e, STEP.sign);
    const p = panel(e, IMG[I.img.sign], null, { z: [1.12, 1.22], f: [[0.42, 0.4], [0.48, 0.38]] }, 'التوقيع في نواكشوط', null);
    const ny = p.py + p.ph + 100;
    const fa = eout(prog(e, BEAT * 0.8, BEAT * 1.4));
    run([{ s: '2', size: 120, color: C.green, ltr: true, dy: -6 }, { s: 'عقدا استكشاف وإنتاج', size: 46, color: C.ink }], W / 2, ny, 'center', fa);
    text('بنظام تقاسم الإنتاج · المقطعان C10 وتيوف', W / 2, ny + 82, 36, C.mute, 'center', eout(prog(e, BEAT * 2, BEAT * 2.5)));
    const row = (y, name, role, col, d) => {
      const a = eout(prog(e, d, d + 0.45));
      const x0 = M - (1 - a) * 60;
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(11,31,75,0.05)'; rrect(x0, y - 62, W - 2 * M, 124, 18); ctx.fill();
      ctx.fillStyle = col; ctx.fillRect(x0 + W - 2 * M - 10, y - 62, 10, 124); ctx.restore();
      text(name, W - M - 40, y - 20, 42, C.ink, 'right', a);
      text(role, W - M - 40, y + 30, 30, C.mute, 'right', a);
    };
    row(ny + 210, 'محمد ولد عبد الفتاح', 'وزير الطاقة والنفط – عن الحكومة', C.green, BEAT * 3);
    row(ny + 350, 'كريستوفر تشارلز أولسون', 'نائب الرئيس الأول للاستكشاف – مورفي أويل', C.navy, BEAT * 4);
    footer(1, I.src.main);
  }

  function sceneC10(e, t) {
    background(t, [0.15, 0.2]);
    header(e, STEP.c10);
    const p = panel(e, IMG[I.img.sea], null, { z: [1.25, 1.1], f: [[0.4, 0.45], [0.45, 0.5]] }, 'المقطع C10', '1', 'صورة تعبيرية');
    const ny = p.py + p.ph + 100;
    figure(11500, W / 2, ny, 130, C.green, e, BEAT * 0.8, BEAT * 3, 'count');
    run([{ s: 'مساحة تقريبية', size: 40, color: C.ink }, { s: '–', size: 40, color: C.mute }, { s: 'كلم²', size: 40, color: C.ink }],
      W / 2, ny + 86, 'center', eout(prog(e, BEAT * 3, BEAT * 3 + 0.4)));
    run([{ s: 'نحو', size: 32, color: C.mute }, { s: '50', size: 34, color: C.ink, ltr: true }, { s: 'كلم من الساحل', size: 32, color: C.mute },
         { s: '·', size: 32, color: C.mute }, { s: 'عمق المياه', size: 32, color: C.mute }, { s: '50 – 2000', size: 34, color: C.ink, ltr: true }, { s: 'م', size: 32, color: C.mute }],
      W / 2, ny + 140, 'center', eout(prog(e, BEAT * 3.5, BEAT * 3.5 + 0.4)));
    // partners agreed in 2023 (before the new contract)
    const by = ny + 225;
    const ba = eout(prog(e, BEAT * 5, BEAT * 5 + 0.4));
    text('الشركاء في اتفاق 2023', W - M, by, 34, C.ink, 'right', ba);
    const segs = [['شل', 50, C.navy], ['قطر للطاقة', 40, C.green], ['', 10, '#8A96A8']];
    const bw = W - 2 * M, gp = eio(prog(e, BEAT * 5.3, BEAT * 7));
    let xr = W - M;
    segs.forEach(([n, v, col], i) => {
      const w = bw * v / 100;
      const q = clamp(gp * 3 - i);
      ctx.save(); ctx.globalAlpha = ba; ctx.fillStyle = col; rrect(xr - w * eout(q), by + 34, Math.max(0, w * eout(q) - 6), 60, 8); ctx.fill(); ctx.restore();
      const la = eout(clamp((q - 0.5) * 2));
      if (n) run([{ s: n, size: 32, color: C.white }, { s: `${v}%`, size: 34, color: C.white, ltr: true, dy: -1 }], xr - w / 2, by + 65, 'center', la);
      else text(`${v}%`, xr - w / 2, by + 65, 30, C.white, 'center', la, true);
      xr -= w;
    });
    text('شل هي المشغّل · 10% للشركة الموريتانية للمحروقات', W - M, by + 128, 28, C.mute, 'right', eout(prog(e, BEAT * 7, BEAT * 7.4)));
    const ca = eout(prog(e, BEAT * 8.5, BEAT * 8.5 + 0.4));
    const cw = measure('العقد الجديد: حصص الشركاء لم تُعلن بعد', 34) + 60;
    ctx.save(); ctx.globalAlpha = ca; ctx.fillStyle = C.navy; rrect(W - M - cw * ca, by + 168, cw * ca, 64, 10); ctx.fill(); ctx.restore();
    text('العقد الجديد: حصص الشركاء لم تُعلن بعد', W - M - cw / 2, by + 201, 34, C.white, 'center', prog(e, BEAT * 8.7, BEAT * 9.1));
    footer(1, I.src.c10);
  }

  function sceneTiof(e, t) {
    background(t, [0.85, 0.2]);
    header(e, STEP.tiof);
    const drawPanel = (x, y, w, h, kb) => {
      const P = drawDetail({ x, y, w, h }, lerp(575, 555, kb), 540, lerp(1.35, 1.55, kb), e);
      const [tx, ty] = P(DT.pts.tiof), [cx, cy] = P(DT.pts.ching);
      dot(cx, cy, 11, '#8A96A8');
      dashed(cx, cy, tx, ty, '#8A96A8', 3);
      pulse(tx, ty, 16, C.green, e);
      tag('شنقيط', cx + 20, cy + 4, 24, C.white, C.mute, 1, 'left');
    };
    const p = panel(e, drawPanel, null, null, 'حقل تيوف', '2');
    const ny = p.py + p.ph + 100;
    figure(280, W / 2, ny, 140, C.green, e, BEAT * 0.8, BEAT * 3, 'drop');
    text('مليون برميل', W / 2, ny + 90, 46, C.ink, 'center', eout(prog(e, BEAT * 3, BEAT * 3 + 0.4)));
    text('تقدير وزارة الطاقة والنفط', W / 2, ny + 145, 32, C.mute, 'center', eout(prog(e, BEAT * 3.4, BEAT * 3.8)));
    // 2003 -> 2026: no commercial production
    const ly = ny + 255;
    const lp = eio(prog(e, BEAT * 4.5, BEAT * 7));
    const x0 = W - M - 30, x1 = M + 30;
    ctx.save(); ctx.globalAlpha = eout(prog(e, BEAT * 4.3, BEAT * 4.7));
    ctx.fillStyle = 'rgba(11,31,75,0.08)'; rrect(x1, ly - 8, x0 - x1, 16, 8); ctx.fill();
    ctx.fillStyle = C.navy; rrect(x0 - (x0 - x1) * lp, ly - 8, (x0 - x1) * lp, 16, 8); ctx.fill();
    ctx.restore();
    dot(x0, ly, 16, C.green, eout(prog(e, BEAT * 4.3, BEAT * 4.7)));
    text('2003', x0, ly + 50, 36, C.ink, 'center', eout(prog(e, BEAT * 4.3, BEAT * 4.7)), true);
    text('الاكتشاف', x0, ly - 46, 28, C.mute, 'center', eout(prog(e, BEAT * 4.3, BEAT * 4.7)));
    const ea = eout(prog(e, BEAT * 7, BEAT * 7.4));
    dot(x1, ly, 16, C.navy, ea);
    text('2026', x1, ly + 50, 36, C.ink, 'center', ea, true);
    text('العقد الجديد', x1, ly - 46, 28, C.mute, 'center', ea);
    run([{ s: '23', size: 40, color: C.green, ltr: true, dy: -2 }, { s: 'عامًا دون إنتاج تجاري', size: 36, color: C.ink }], W / 2, ly + 52, 'center',
      eout(prog(e, BEAT * 7.5, BEAT * 8)));
    text('تقدير تاريخي يحتاج إعادة تقييم فني واقتصادي', W / 2, ly + 130, 34, C.mute, 'center', eout(prog(e, BEAT * 8.5, BEAT * 9)));
    footer(1, I.src.tiof);
  }

  function sceneMurphy(e, t) {
    background(t, [0.15, 0.2]);
    header(e, STEP.murphy);
    // two photos of the company: the head-office sign, then its storage tanks
    const drawPanel = (x, y, w, h, kb) => {
      photo(IMG[I.img.murphy], x, y, w, h, [lerp(0.48, 0.55, kb), 0.55], lerp(1.05, 1.18, kb));
      const xa = eio(prog(e, BEAT * 5.5, BEAT * 6.5));
      if (xa > 0) {
        ctx.save(); ctx.globalAlpha = xa;
        photo(IMG[I.img.tanks], x, y, w, h, [lerp(0.55, 0.62, prog(e, BEAT * 5.5, 7.5)), 0.42], lerp(1.08, 1.16, prog(e, BEAT * 5.5, 7.5)));
        ctx.restore();
      }
    };
    const p = panel(e, drawPanel, null, null, 'مورفي أويل', null);
    const ny = p.py + p.ph + 100;
    figure(1950, W / 2, ny, 130, C.green, e, BEAT * 0.8, BEAT * 3, 'year');
    text('سنة التأسيس', W / 2, ny + 84, 40, C.ink, 'center', eout(prog(e, BEAT * 3, BEAT * 3 + 0.4)));
    const rows = [
      ['شركة أمريكية مستقلة للنفط والغاز', 'مقرها هيوستن – تكساس'],
      ['خبرة في التنقيب بالمياه العميقة', 'أنشطة في فيتنام وأمريكا الشمالية'],
    ];
    let y = ny + 175;
    rows.forEach((r, i) => {
      const a = eout(prog(e, BEAT * (4 + i), BEAT * (4 + i) + 0.4));
      text('●  ' + r[0], W - M, y, 34, C.ink, 'right', a);
      text('●  ' + r[1], W - M, y + 54, 34, C.ink, 'right', eout(prog(e, BEAT * (4.5 + i), BEAT * (4.5 + i) + 0.4)));
      y += 108;
    });
    const ca = eout(prog(e, BEAT * 6.5, BEAT * 6.9));
    ctx.save(); ctx.globalAlpha = ca; ctx.fillStyle = 'rgba(16,185,129,0.14)'; rrect(M, y - 34, W - 2 * M, 96, 14); ctx.fill();
    ctx.fillStyle = C.green; ctx.fillRect(W - M - 8, y - 34, 8, 96); ctx.restore();
    run([{ s: '2026', size: 36, color: C.green, ltr: true }, { s: 'اكتشاف ونتائج تقييم إيجابية قبالة كوت ديفوار', size: 34, color: C.ink }],
      W - M - 30, y + 14, 'right', ca);
    footer(1, I.src.murphy);
  }

  function sceneChariot(e, t) {
    background(t, [0.85, 0.2]);
    header(e, STEP.chariot);
    title('ماذا عن شاريوت البريطانية؟', Y(250), e);
    text('ثلاثة مقاطع طُلبت… ومقطعان وُقّعا', W / 2, Y(320), 40, C.green, 'center', eout(prog(e, 0.5, 1)));
    // three blocks: two signed, the third open
    const bs = 230, gap = 50, total = 3 * bs + 2 * gap, y0 = Y(390);
    const names = ['C10', 'تيوف', '؟'];
    for (let i = 0; i < 3; i++) {
      const x = W / 2 + total / 2 - (i + 1) * bs - i * gap;
      const a = eout(prog(e, BEAT * (1 + i * 0.5), BEAT * (1 + i * 0.5) + 0.4));
      const s = lerp(0.6, 1, eback(prog(e, BEAT * (1 + i * 0.5), BEAT * (1 + i * 0.5) + 0.45)));
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x + bs / 2, y0 + bs / 2); ctx.scale(s, s);
      if (i < 2) {
        const fill = prog(e, BEAT * 3.5, BEAT * 4);
        ctx.fillStyle = 'rgba(11,31,75,0.07)'; rrect(-bs / 2, -bs / 2, bs, bs, 22); ctx.fill();
        ctx.fillStyle = C.green; ctx.globalAlpha = a * eout(fill); rrect(-bs / 2, -bs / 2, bs, bs, 22); ctx.fill();
        ctx.globalAlpha = a;
        text(names[i], 0, 6, 64, fill > 0.5 ? C.white : C.ink, 'center', 1, i === 0);
      } else {
        ctx.strokeStyle = C.red; ctx.lineWidth = 5; ctx.setLineDash([16, 12]); rrect(-bs / 2 + 3, -bs / 2 + 3, bs - 6, bs - 6, 22); ctx.stroke();
        text('؟', 0, 6, 110, C.red, 'center');
      }
      ctx.restore();
    }
    const sy = y0 + bs + 110;
    const step = (y, chip, line, col, d, solid) => {
      const a = eout(prog(e, d, d + 0.45));
      const cw = measure(chip, 30) + 40;
      ctx.save(); ctx.globalAlpha = a;
      if (solid) { ctx.fillStyle = col; rrect(W - M - cw, y - 26, cw, 52, 26); ctx.fill(); }
      else { ctx.strokeStyle = col; ctx.lineWidth = 3; rrect(W - M - cw, y - 26, cw, 52, 26); ctx.stroke(); }
      ctx.restore();
      text(chip, W - M - cw / 2, y + 1, 30, solid ? C.white : col, 'center', a);
      text(line, W - M, y + 68, 36, C.ink, 'right', a);
    };
    step(sy, '8 يوليو 2026', 'عُرض على مجلس الوزراء: مورفي أويل وشاريوت – 3 مقاطع', C.navy, BEAT * 5, false);
    step(sy + 175, '3 نوفمبر 2026', 'التوقيع مع مورفي أويل وحدها – مقطعان', C.green, BEAT * 6.5, true);
    step(sy + 350, 'غير واضح', 'مصير المقطع الثالث ودور شاريوت', C.red, BEAT * 8, true);
    footer(eout(prog(e, 1, 1.6)), I.src.chariot);
  }

  function sceneUnknown(e, t) {
    background(t, [0.5, 0.1]);
    header(e);
    title('ما لم يُعلن بعد', Y(250), e);
    text('حتى 4 نوفمبر 2026', W / 2, Y(312), 34, C.mute, 'center', eout(prog(e, 0.4, 0.8)));
    const items = [['القيمة', 'الاستثمارية'], ['مدة', 'العقدين'], ['نسب', 'تقاسم الإنتاج'], ['جدول الحفر', 'وعدد الآبار']];
    const tw = (W - 2 * M - 30) / 2, th = 330 + EX * 0.3, y0 = Y(370);
    items.forEach((it, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = W - M - (col + 1) * tw - col * 30, y = y0 + row * (th + 30);
      const d = BEAT * (0.8 + i * 0.5);
      const a = eout(prog(e, d, d + 0.4));
      const s = lerp(0.85, 1, eback(prog(e, d, d + 0.45)));
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x + tw / 2, y + th / 2); ctx.scale(s, s);
      ctx.fillStyle = 'rgba(11,31,75,0.05)'; rrect(-tw / 2, -th / 2, tw, th, 24); ctx.fill();
      ctx.fillStyle = C.navy; ctx.beginPath(); ctx.arc(0, -70, 58, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      const wob = 1 + 0.06 * Math.sin((e - d) * 4);
      ctx.save(); ctx.translate(x + tw / 2, y + th / 2 - 70); ctx.scale(wob, wob); text('؟', 0, 4, 74, C.white, 'center', a); ctx.restore();
      text(it[0], x + tw / 2, y + th / 2 + 40, 40, C.ink, 'center', a);
      text(it[1], x + tw / 2, y + th / 2 + 92, 40, C.ink, 'center', a);
    });
    footer(eout(prog(e, 1, 1.6)), I.src.main);
  }

  function sceneSummary(e, t) {
    photo(IMG[I.img.sea], 0, 0, W, H, [lerp(0.3, 0.5, clamp(e / 7.5)), 0.5], 1.2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(DOTS, 0, 0);
    header(e);
    title('الخلاصة', Y(250), e);
    const a0 = eout(prog(e, BEAT, BEAT + 0.5));
    text('عودة مهمة', W / 2, Y(390) + (1 - a0) * 30, 84, C.ink, 'center', a0);
    text('للاستكشاف النفطي البحري', W / 2, Y(490) + (1 - a0) * 30, 64, C.green, 'center', eout(prog(e, BEAT * 1.6, BEAT * 1.6 + 0.5)));
    const rw = 200 * eout(prog(e, BEAT * 2.4, BEAT * 2.8));
    ctx.fillStyle = C.red; ctx.fillRect(W / 2 - rw / 2, Y(560), rw, 8);
    const row = (y, s, ok, d) => {
      const a = eout(prog(e, d, d + 0.45));
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = ok ? 'rgba(16,185,129,0.14)' : 'rgba(11,31,75,0.06)'; rrect(M - (1 - a) * 50, y - 50, W - 2 * M, 100, 18); ctx.fill();
      // icon
      const ix = W - M - 60, iy = y;
      ctx.fillStyle = ok ? C.green : C.navy; ctx.beginPath(); ctx.arc(ix, iy, 28, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.white; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
      if (ok) { ctx.moveTo(ix - 12, iy); ctx.lineTo(ix - 2, iy + 10); ctx.lineTo(ix + 14, iy - 10); }
      else { ctx.moveTo(ix - 10, iy - 10); ctx.lineTo(ix + 10, iy + 10); ctx.moveTo(ix + 10, iy - 10); ctx.lineTo(ix - 10, iy + 10); }
      ctx.stroke(); ctx.restore();
      text(s, W - M - 110, y + 2, 38, C.ink, 'right', a);
    };
    row(Y(680), 'ليست إعلانًا عن اكتشاف نفطي جديد', false, BEAT * 3.5);
    row(Y(800), 'ولا بدءًا للإنتاج', false, BEAT * 4.5);
    row(Y(920), 'الحسم: نتائج الدراسات والحفر', true, BEAT * 6);
    row(Y(1040), 'ثم قابلية الحقول للتطوير التجاري', true, BEAT * 7);
    footer(eout(prog(e, 1, 1.6)), I.src.main);
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
    drawMap({ x: 0, y: 0, w: W, h: H }, { lon: -9, lat: 21, w: lerp(34, 28, prog(e, 0, 7.5)) }, (ci) => {
      if (ci === WS) return [C.wsRGB, 1];
      return ci === IDX['478'] ? [mix(C.landRGB, C.greenRGB, 0.35), 1] : null;
    }, 0.4 * eout(prog(e, 0, 1)));
    const r = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 640);
    r.addColorStop(0, 'rgba(255,255,255,0.95)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    const cy = TOP + (BOT - TOP) * (FORMAT === 'story' ? 0.24 : 0.22);
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
    footer(eout(prog(e, BEAT * 6, BEAT * 6 + 0.6)), I.src.main);
  }

  const SCENES = { hook: sceneHook, map: sceneMap, sign: sceneSign, c10: sceneC10, tiof: sceneTiof, murphy: sceneMurphy,
    chariot: sceneChariot, unknown: sceneUnknown, summary: sceneSummary, outro: sceneOutro };
  function drawScene(k, t) {
    const e = t - STARTS[k];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.white; ctx.fillRect(0, 0, W, H);
    SCENES[TM.scenes[k]](e, t);
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
    const files = new Set(Object.values(I.img));
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
