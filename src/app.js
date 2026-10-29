// Erriwaya news brief renderer. Draws one frame for a given time with renderFrame(t).
(() => {
  const TL = window.TIMELINE;
  const MD = window.MAP_DATA;
  const FONT = 'AlQuds';

  const C = {
    bg: '#FFFFFF',
    navy: '#0B1F4B',
    ink: '#16233F',
    gray: '#7A8599',
    soft: '#F4F6FA',
    line: '#E4E8F0',
    acc: '#10B981',
    accRGB: [16, 185, 129],
    secRGB: [92, 112, 158],
    landRGB: [218, 224, 234],
    seaDot: '#E3E8F0',
  };

  // Layouts: 'feed' (1080x1350, the default) and 'youtube' (1920x1080), chosen with ?format=
  const LAYOUTS = {
    feed: {
      W: 1080, H: 1350,
      margin: 60,
      logoH: 156, logoY: 32, hdrText: [44, 27],   // logo leads the header; title/date sizes
      card: { cx: 540, cy: 390, w: 690, h: 460 },
      side: [480, 800],                  // horizontal offset of the 1st / 2nd side cards
      bar: { x0: 160, x1: 920, y: 682, tl: 60, tr: 1020 },
      kicker: { cx: 540, y: 620 },        // story label pinned to the photo's bottom edge
      head: { cx: 540, cy: 784, maxW: 880, lineH: 62, panelH: 150 },
      map: { x: 50, y: 880, w: 980, h: 412, r: 34 },
      dotsH: 840,
      intro: { lon: 0, w: [48, 43], logo: { cx: 540, cy: 560, h: 380 }, titleY: 840 },
      outro: { lon: -2, w: [52, 46], logo: { cx: 540, cy: 530, h: 300 }, titleY: 750, followY: 890, rowsY: 960 },
      cover: { logo: { cx: 540, cy: 160, h: 190 }, title: [540, 335, 80], date: [540, 440, 36], photos: [[60, 495, 960, 400], [60, 915, 468, 220], [552, 915, 468, 220]], chips: { cx: 540, y: 1160, maxW: 960 } },
    },
    youtube: {
      W: 1920, H: 1080,
      margin: 96,                        // 5% title-safe area
      logoH: 160, logoY: 38, hdrText: [46, 28],
      card: { cx: 1344, cy: 482, w: 920, h: 540 },
      side: [570, 900],
      bar: { x0: 980, x1: 1708, y: 826, tl: 864, tr: 1824 },
      kicker: { cx: 1344, y: 752 },
      head: { cx: 1344, cy: 944, maxW: 880, lineH: 62, panelH: 150 },
      map: { x: 96, y: 236, w: 704, h: 770, r: 34 },
      dotsH: 1080,
      intro: { lon: 3, w: [78, 72], logo: { cx: 960, cy: 470, h: 380 }, titleY: 770 },
      outro: { lon: 3, w: [78, 72], logo: { cx: 960, cy: 390, h: 280 }, titleY: 590, followY: 712, rowsY: 770 },
      cover: { logo: { cx: 1440, cy: 200, h: 230 }, title: [1440, 420, 92], date: [1440, 535, 42], photos: [[80, 80, 900, 560], [80, 670, 435, 330], [545, 670, 435, 330]], chips: { cx: 1440, y: 600, maxW: 760 } },
    },
    // TikTok / Reels / Shorts: content kept clear of the top bar and the caption/buttons at the bottom
    story: {
      W: 1080, H: 1920,
      margin: 60,
      logoH: 156, logoY: 150, hdrText: [44, 27],
      card: { cx: 540, cy: 600, w: 760, h: 520 },
      side: [520, 840],
      bar: { x0: 160, x1: 920, y: 940, tl: 60, tr: 1020 },
      kicker: { cx: 540, y: 860 },
      head: { cx: 540, cy: 1050, maxW: 880, lineH: 62, panelH: 150 },
      map: { x: 50, y: 1150, w: 980, h: 460, r: 34 },
      dotsH: 1120,
      intro: { lon: -2.5, w: [40, 37], logo: { cx: 540, cy: 840, h: 400 }, titleY: 1140 },
      outro: { lon: -2, w: [36, 33], logo: { cx: 540, cy: 780, h: 320 }, titleY: 1010, followY: 1150, rowsY: 1220 },
      cover: { logo: { cx: 540, cy: 330, h: 230 }, title: [540, 545, 86], date: [540, 650, 40], photos: [[60, 710, 960, 520], [60, 1255, 468, 300], [552, 1255, 468, 300]], chips: { cx: 540, y: 1590, maxW: 960 } },
    },
  };
  const FORMAT = new URLSearchParams(location.search).get('format') || 'feed';
  const L = LAYOUTS[FORMAT] || LAYOUTS.feed;
  const W0 = L.W, H0 = L.H;
  // Looks (?look=): 'broadcast' is the approved look (29 Oct 2026) in every format and the default; 'classic'
  // is the white layout approved before it. The other looks were trials, feed only: edge-to-edge photo with
  // a small inset map (wide, full), big headline on white (card), large spoken captions (captions), frosted
  // panel and story wipes (pro), blurred backdrop with boxed headlines (bold).
  const LOOK_Q = new URLSearchParams(location.search).get('look') || 'broadcast';
  const LOOK = LOOK_Q === 'broadcast' || FORMAT === 'feed' ? LOOK_Q : 'classic';
  if (LOOK === 'wide') Object.assign(L, {
    card: { cx: 540, cy: 595, w: 1080, h: 780 }, slide: true, photoR: 0,
    kicker: { cx: 540, y: 985 },
    head: { cx: 540, cy: 1095, maxW: 880, lineH: 62, panelH: 150 },
    bar: { x0: 160, x1: 920, y: 1222, tl: 60, tr: 1020 },
    inset: { S: 700, big: { cx: 540, cy: 595, s: 1 }, small: { x: 36, y: 228, s: 0.4 } },
  });
  if (LOOK === 'full') Object.assign(L, {
    card: { cx: 540, cy: 675, w: 1080, h: 1350 }, slide: true, photoR: 0, dark: true, noPanel: true,
    kicker: { cx: 540, y: 930 },
    head: { cx: 540, cy: 1045, maxW: 900, lineH: 62, panelH: 150 },
    bar: { x0: 160, x1: 920, y: 1185, tl: 60, tr: 1020 },
    inset: { S: 700, big: { cx: 540, cy: 540, s: 0.86 }, small: { x: 36, y: 228, s: 0.4 } },
  });
  if (LOOK === 'card') Object.assign(L, {
    card: { cx: 540, cy: 555, w: 1080, h: 700 }, slide: true, photoR: 0, noPanel: true,
    kicker: { cx: 540, y: 905 },
    head: { cx: 540, cy: 1055, maxW: 960, lineH: 62, panelH: 150, size: [52, 64], color: C.navy },
    bar: { x0: 160, x1: 920, y: 1232, tl: 60, tr: 1020 },
    inset: { S: 700, big: null, small: { x: 36, y: 228, s: 0.3 } },
  });
  // modern: full-frame photo, story segments along the top, frosted panel with a big right-aligned headline
  // and the spoken words, a round locator map, and a coloured wipe with the story number at each new story
  if (LOOK === 'pro') Object.assign(L, {
    card: { cx: 540, cy: 675, w: 1080, h: 1350 }, slide: true, photoR: 0, dark: true, noPanel: true, pro: true, segments: true, wipe: true,
    logoH: 132, logoY: 58, hdrText: [38, 24],
    glass: { x: 30, y: 884, w: 1020, h: 430, r: 38 },
    kicker: { cx: 540, right: 1006, y: 930 },
    head: { cx: 540, right: 1006, cy: 1068, maxW: 930, lineH: 62, panelH: 150, size: [50, 58] },
    caption: { right: 1006, cy: 1252, maxW: 930, sizes: [38, 35], style: 'text' },
    inset: { S: 700, round: true, big: null, small: { x: 36, y: 214, s: 0.27 } },
  });
  // bold: blurred photo as the backdrop, the photo itself framed and tilted, headline lines in solid boxes,
  // the country's name drifting large behind, spoken words below, the story-number wipe from 'pro'
  if (LOOK === 'bold') Object.assign(L, {
    card: { cx: 540, cy: 492, w: 920, h: 556 }, slide: true, photoR: 26, dark: true, noPanel: true, segments: true, wipe: true,
    frame: { border: 10, tilt: -1.6 }, blurBg: true, boxed: true, marquee: { y: 1245, size: 170 },
    logoH: 132, logoY: 58, hdrText: [38, 24],
    kicker: { cx: 540, right: 1010, y: 826 },
    head: { cx: 540, right: 1010, cy: 952, maxW: 900, lineH: 62, panelH: 150, size: [46, 54] },
    caption: { right: 1010, cy: 1128, maxW: 920, sizes: [36, 33], style: 'text' },
    inset: { S: 700, round: true, big: null, small: { x: 96, y: 236, s: 0.21 } },
  });
  // broadcast: TV news style. Full-frame photo, a lower third (story tag, white headline bar, spoken words
  // strip), a ticker crawling the coming stories, and a band sting with the story number at each new story
  if (LOOK === 'broadcast') {
    Object.assign(L, {
      card: { cx: W0 / 2, cy: H0 / 2, w: W0, h: H0 }, slide: true, photoR: 0, dark: true, noPanel: true, noBar: true,
      broadcast: true, sting: true, staticText: true, titleInBar: true, plainHead: true, smoothText: true,
      logoH: 132, hdrText: [38, 24],
    });
    // per format: the lower third (lower, with the headline, spoken-words strip and tag placed from it),
    // the ticker, the inset map and the sting's height
    const BL = {
      feed: { logoY: 58, lower: { x: 30, y: 950, w: 1020, h: 178 }, maxW: 700, capW: 950, ticker: { y: 1236, h: 78 },
              inset: { x: 40, y: 214 }, stingY: 0.42 },
      story: { logoY: 150, lower: { x: 40, y: 1180, w: 990, h: 178 }, maxW: 690, capW: 940, ticker: { y: 1466, h: 78 },
               inset: { x: 40, y: 330 }, stingY: 0.42 },
      // youtube: the logo scaled with the frame's area (1920x1080 vs 1080x1350)
      youtube: { logoY: 44, logoH: 158, lower: { x: 520, y: 730, w: 1304, h: 160 }, maxW: 900, capW: 1200, ticker: { y: 988, h: 70 },
                 inset: { x: 96, y: 224 }, stingY: 0.39 },
    }[FORMAT] || null;
    const B = BL.lower, xr = B.x + B.w;
    Object.assign(L, {
      logoY: BL.logoY, logoH: BL.logoH || L.logoH, lower: B, ticker: BL.ticker, stingY: BL.stingY,
      kicker: { cx: W0 / 2, right: xr, y: B.y - 38 },
      head: { cx: W0 / 2, right: xr - 46, cy: B.y + B.h / 2, maxW: BL.maxW, lineH: 62, panelH: 150, size: [40, 50], color: C.navy },
      caption: { right: xr - 46, cy: B.y + B.h + 38, maxW: BL.capW, sizes: [31, 28, 25], lines: 1, style: 'text' },
      inset: { S: 700, big: null, small: { x: BL.inset.x, y: BL.inset.y, s: 0.3 } },
    });
  }
  if (LOOK === 'captions') Object.assign(L, {
    card: { cx: 540, cy: 675, w: 1080, h: 1350 }, slide: true, photoR: 0, dark: true, noPanel: true, noMap: true,
    kicker: { cx: 540, y: 262 },
    head: { cx: 540, cy: 345, maxW: 900, lineH: 62, panelH: 150, size: [34, 38] },
    caption: { cx: 540, cy: 930, maxW: 940, sizes: [68, 62, 56] },
    bar: { x0: 160, x1: 920, y: 1225, tl: 60, tr: 1020 },
  });
  const W = L.W, H = L.H;
  // edition cameras are framed for the feed map (980x422); keep the same visible area on other map shapes
  if (L.inset) L.map = { x: 0, y: 0, w: L.inset.S, h: L.inset.S, r: L.inset.round ? L.inset.S / 2 : 34 };
  const CAM_SCALE = Math.sqrt((422 / 980) / (L.map.h / L.map.w));

  const INTRO = TL.intro, CUT = TL.audioCut;
  const vt = a => INTRO + (a - CUT);          // voice-over time -> video time
  const at = t => t - INTRO + CUT;            // video time -> voice-over time
  // the closing logo comes after the last word; the outro music's final chord lands as the logo and the
  // social icons appear (OUTRO + 2.1, tools/render.js), and its ring is held for a few seconds
  const OUTRO = vt(TL.audioEnd) + 0.2;
  const DURATION = Math.max(vt(TL.audioEnd) + TL.tail, OUTRO + 6.0);

  // ---------- helpers ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eio = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const eout = p => 1 - Math.pow(1 - p, 3);
  const ein = p => p * p * p;
  const eback = p => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
  const fade = (t, a, b, inD = 0.4, outD = 0.4) => Math.min(eout(prog(t, a, a + inD)), b == null ? 1 : 1 - ein(prog(t, b - outD, b)));
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mix = (c1, c2, p) => [lerp(c1[0], c2[0], p), lerp(c1[1], c2[1], p), lerp(c1[2], c2[2], p)];
  const font = (s, w = '') => `${w} ${s}px ${FONT}`.trim();

  const cv = document.getElementById('c');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  // ---------- assets ----------
  const IMG = {};
  let LOGO = null, LOGO_ACC = null, LOGO_W = null;
  function loadImage(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }
  function tint(img, color) {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    return c;
  }

  // ---------- map ----------
  const RAD = Math.PI / 180;
  const mercY = lat => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2)) / RAD;
  const GRID = Uint8Array.from(atob(MD.grid), ch => ch.charCodeAt(0));
  const GY1 = mercY(MD.box.lat1);
  const idIndex = {};
  MD.ids.forEach((id, i) => { if (id) idIndex[id] = i; });

  function camFor(k) { return { x: k.lon, y: mercY(k.lat), w: k.w }; }
  function cameraAt(a) {
    const K = TL.camera;
    let s = camFor(K[0]);
    for (let i = 1; i < K.length; i++) {
      if (a < K[i].t) break;
      const tgt = camFor(K[i]);
      const p = eio(prog(a, K[i].t, K[i].t + K[i].d));
      const dist = Math.hypot(tgt.x - s.x, tgt.y - s.y);
      const bump = Math.min(0.55, dist / Math.max(s.w, tgt.w) * 0.6);
      s = {
        x: lerp(s.x, tgt.x, p),
        y: lerp(s.y, tgt.y, p),
        w: Math.exp(lerp(Math.log(s.w), Math.log(tgt.w), p)) * (1 + bump * Math.sin(Math.PI * p)),
      };
    }
    return s;
  }

  function projector(cam, rect) {
    const k = rect.w / cam.w;
    const ox = rect.x + rect.w / 2, oy = rect.y + rect.h / 2;
    const f = (lon, lat) => [ox + (lon - cam.x) * k, oy - (mercY(lat) - cam.y) * k];
    f.k = k;
    f.m = (x, my) => [ox + (x - cam.x) * k, oy - (my - cam.y) * k];
    return f;
  }

  // Draw the pixel grid. opts: { layers, reveal(cellX, cellMY) -> alpha, landRGB, seaDots }
  function drawGrid(cam, rect, opts = {}) {
    const P = projector(cam, rect);
    const k = P.k, cell = MD.cell;
    const size = cell * k;
    const sq = Math.max(1, size * (size > 9 ? 0.78 : 0.72));
    const halfW = rect.w / 2 / k, halfH = rect.h / 2 / k;
    const c0 = Math.max(0, Math.floor((cam.x - halfW - MD.box.lon0) / cell) - 1);
    const c1 = Math.min(MD.cols - 1, Math.ceil((cam.x + halfW - MD.box.lon0) / cell) + 1);
    const r0 = Math.max(0, Math.floor((GY1 - (cam.y + halfH)) / cell) - 1);
    const r1 = Math.min(MD.rows - 1, Math.ceil((GY1 - (cam.y - halfH)) / cell) + 1);
    const land = opts.landRGB || C.landRGB;
    const layers = opts.layers || [];
    const reveal = opts.reveal;

    const seaPath = new Path2D();
    const landPath = new Path2D();
    const singles = [];
    const dot = Math.max(1.2, size * 0.16);
    for (let r = r0; r <= r1; r++) {
      const my = GY1 - (r + 0.5) * cell;
      for (let c = c0; c <= c1; c++) {
        const ci = GRID[r * MD.cols + c];
        const x = MD.box.lon0 + (c + 0.5) * cell;
        const [sx, sy] = P.m(x, my);
        if (!ci) {
          if (opts.seaDots !== false && size >= 5 && (r + c) % 2 === 0) seaPath.rect(sx - dot / 2, sy - dot / 2, dot, dot);
          continue;
        }
        let alpha = reveal ? reveal(x, my) : 1;
        if (alpha <= 0) continue;
        let col = null, ha = 0;
        for (const Ly of layers) {
          if (!Ly.set.has(ci)) continue;
          const d = Math.hypot(x - Ly.ox, my - Ly.oy);
          const w = Ly.alpha * clamp((Ly.elapsed * 16 - d) / 3);
          if (w <= 0) continue;
          const shimmer = Ly.kind === 'primary' ? 0.82 + 0.18 * Math.sin(d * 0.8 - Ly.elapsed * 4.5) : 0.55;
          const target = Ly.kind === 'primary' ? C.accRGB : C.secRGB;
          col = col ? mix(col, target, w) : mix(land, target, w * shimmer);
          ha = Math.max(ha, w);
        }
        if (col || alpha < 1) singles.push(sx, sy, col || land, alpha);
        else landPath.rect(sx - sq / 2, sy - sq / 2, sq, sq);
      }
    }
    ctx.fillStyle = opts.seaColor || C.seaDot;
    ctx.fill(seaPath);
    ctx.fillStyle = rgb(land);
    ctx.fill(landPath);
    for (let i = 0; i < singles.length; i += 4) {
      ctx.fillStyle = rgb(singles[i + 2], singles[i + 3]);
      ctx.fillRect(singles[i] - sq / 2, singles[i + 1] - sq / 2, sq, sq);
    }
    return P;
  }

  function strokeLines(P, lines, style, width, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (const ln of lines) {
      ln.forEach((p, i) => { const [x, y] = P(p[0], p[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    }
    ctx.stroke();
    ctx.restore();
  }

  function layersAt(a, list) {
    return list.map(h => {
      const alpha = fade(a, h.t, h.end, 0.6, 0.6);
      if (alpha <= 0) return null;
      return { set: new Set(h.ids.map(id => idIndex[id])), kind: h.kind, alpha, elapsed: a - h.t, ox: h.origin[0], oy: mercY(h.origin[1]) };
    }).filter(Boolean);
  }

  function quadPoint(p0, c, p1, u) {
    const v = 1 - u;
    return [v * v * p0[0] + 2 * v * u * c[0] + u * u * p1[0], v * v * p0[1] + 2 * v * u * c[1] + u * u * p1[1]];
  }
  function control(p0, p1, curve) {
    const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    return [mx - dy * curve, my + dx * curve];
  }

  function glowDot(x, y, r, color, alpha = 1) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${color},${alpha})`);
    g.addColorStop(0.35, `rgba(${color},${alpha * 0.45})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  function drawMapLine(P, ln, a) {
    const alpha = fade(a, ln.t, ln.end, 0.2, 0.5);
    if (alpha <= 0) return;
    const p0 = P(ln.from[0], ln.from[1]), p1 = P(ln.to[0], ln.to[1]);
    const c = control(p0, p1, ln.curve);
    const u = eio(prog(a, ln.t, ln.t + ln.dur));
    const N = 60;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    const color = ln.style === 'cancel' ? 'rgba(11,31,75,0.75)' : C.navy;
    ctx.strokeStyle = color;
    ctx.lineWidth = ln.style === 'route' ? 5 : 3.5;
    if (ln.style !== 'arc') { ctx.setLineDash(ln.style === 'route' ? [2, 12] : [12, 10]); ctx.lineDashOffset = -a * 30; }
    ctx.beginPath();
    for (let i = 0; i <= N * u; i++) {
      const q = quadPoint(p0, c, p1, Math.min(u, i / N));
      i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
    }
    const qe = quadPoint(p0, c, p1, u);
    ctx.lineTo(qe[0], qe[1]);
    ctx.stroke();
    ctx.setLineDash([]);
    if (u < 1) {
      glowDot(qe[0], qe[1], 26, '16,185,129', 0.9);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(qe[0], qe[1], 4.5, 0, Math.PI * 2); ctx.fill();
    } else if (ln.style === 'cancel') {
      // "postponed" marker at the middle of the arc
      const m = quadPoint(p0, c, p1, 0.55);
      const s = eback(prog(a, ln.t + ln.dur, ln.t + ln.dur + 0.5));
      ctx.translate(m[0], m[1]); ctx.scale(s, s);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(11,31,75,0.25)'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#E5484D'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-6.5, -6.5); ctx.lineTo(6.5, 6.5); ctx.moveTo(6.5, -6.5); ctx.lineTo(-6.5, 6.5); ctx.stroke();
    }
    ctx.restore();
  }

  function labelPill(x, y, text, size, opts = {}) {
    ctx.font = font(size);
    ctx.direction = 'rtl';
    const tw = ctx.measureText(text).width;
    const ph = size * 1.55, pw = tw + size * 1.1;
    let bx = x - pw / 2, by = y - ph / 2;
    if (opts.bounds) {
      const b = opts.bounds;
      bx = clamp(bx, b.x + 10, b.x + b.w - pw - 10);
      by = clamp(by, b.y + 10, b.y + b.h - ph - 10);
    }
    ctx.save();
    ctx.shadowColor = 'rgba(11,31,75,0.16)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    ctx.fillStyle = opts.fill || 'rgba(255,255,255,0.96)';
    rrect(bx, by, pw, ph, ph / 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = opts.color || C.navy;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + pw / 2, by + ph / 2 + size * 0.06);
    return { x: bx, y: by, w: pw, h: ph };
  }

  function drawPin(P, pin, a, rect) {
    const alpha = fade(a, pin.t, pin.end, 0.3, 0.4);
    if (alpha <= 0) return;
    const [x, y] = P(pin.lon, pin.lat);
    const pop = eback(prog(a, pin.t, pin.t + 0.5));
    ctx.save();
    ctx.globalAlpha = alpha;
    if (pin.dot === false) {
      // area label; with a side it sits beside the area on a short leader line so the highlight stays visible
      if (pin.side) {
        const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[pin.side];
        const len = d[0] ? 170 : 90;
        const lp = eout(prog(a, pin.t, pin.t + 0.5));
        ctx.strokeStyle = C.navy; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + d[0] * (len - 60) * lp, y + d[1] * (len - 40) * lp); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.navy;
        ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = alpha * lp;
        labelPill(x + d[0] * len, y + d[1] * len, pin.label, 30, { bounds: rect, fill: C.navy, color: '#fff' });
        ctx.restore();
        return;
      }
      ctx.translate(x, y); ctx.scale(pop, pop);
      labelPill(0, 0, pin.label, 30, { fill: C.navy, color: '#fff' });
      ctx.restore();
      return;
    }
    // pulse rings
    for (let i = 0; i < 2; i++) {
      const ph = ((a - pin.t) / 1.8 + i * 0.5) % 1;
      ctx.strokeStyle = `rgba(16,185,129,${(1 - ph) * 0.8})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(x, y, 8 + ph * (pin.main ? 46 : 30), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.save();
    ctx.translate(x, y); ctx.scale(pop, pop);
    ctx.shadowColor = 'rgba(11,31,75,0.3)'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, pin.main ? 12 : 10, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = pin.main ? C.acc : C.navy;
    ctx.beginPath(); ctx.arc(0, 0, pin.main ? 7.5 : 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // label
    const off = 46;
    const d = { up: [0, -off], down: [0, off], left: [-off * 2.1, 0], right: [off * 2.1, 0] }[pin.side || 'up'];
    const la = eout(prog(a, pin.t + 0.15, pin.t + 0.6));
    ctx.globalAlpha = alpha * la;
    labelPill(x + d[0], y + d[1] + (1 - la) * 10, pin.label, pin.main ? 30 : 27, { bounds: rect, fill: pin.main ? C.navy : undefined, color: pin.main ? '#fff' : undefined });
    ctx.restore();
  }

  function drawStat(st, a, rect) {
    const alpha = fade(a, st.t, st.end, 0.4, 0.4);
    if (alpha <= 0) return;
    const p = eout(prog(a, st.t, st.t + 0.5));
    const main = st.text || `${Math.round(st.value * eout(prog(a, st.t, st.t + 1.2)))} ${st.unit}`;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.direction = 'rtl';
    ctx.font = font(34);
    const w1 = ctx.measureText(main).width;
    ctx.font = font(22);
    const w2 = ctx.measureText(st.note).width;
    const w = Math.max(w1, w2) + 48, h = 100;
    // top-left corner of the map by default; pos: 'right' when a pin sits there
    const x = st.pos === 'right' ? rect.x + rect.w - 22 - w + (1 - p) * 30 : rect.x + 22 + (1 - p) * -30, y = rect.y + 22;
    ctx.shadowColor = 'rgba(11,31,75,0.18)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#fff';
    rrect(x, y, w, h, 22); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = C.acc;
    rrect(x + w - 8, y + 22, 4, h - 44, 2); ctx.fill();
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillStyle = C.navy; ctx.font = font(34);
    ctx.fillText(main, x + w - 24, y + 38);
    ctx.fillStyle = C.gray; ctx.font = font(22);
    ctx.fillText(st.note, x + w - 24, y + 74);
    ctx.restore();
  }

  function drawMapCard(a, alpha) {
    if (alpha <= 0 || L.noMap) return;
    const R = L.map;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (L.inset) {
      // full size for a moment at each story's start (where it is), then a small locator in the photo's corner
      const I = L.inset;
      let big = 0;
      if (I.big) for (const c of TL.chapters) big = Math.max(big, eio(prog(a, c - 0.4, c)) * (1 - eio(prog(a, c + 1.6, c + 2.2))));
      const B = I.big || { cx: 0, cy: 0, s: I.small.s };
      const s = lerp(I.small.s, B.s, big);
      const x = lerp(I.small.x, B.cx - I.S * B.s / 2, big), y = lerp(I.small.y, B.cy - I.S * B.s / 2, big);
      ctx.translate(x, y); ctx.scale(s, s);
    }
    ctx.shadowColor = 'rgba(11,31,75,0.10)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
    ctx.fillStyle = C.soft;
    rrect(R.x, R.y, R.w, R.h, R.r); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.save();
    rrect(R.x, R.y, R.w, R.h, R.r); ctx.clip();
    const cam = cameraAt(a);
    cam.w *= CAM_SCALE;
    const P = drawGrid(cam, R, { layers: layersAt(a, TL.highlights) });
    strokeLines(P, MD.coasts, 'rgba(11,31,75,0.22)', 1.2);
    strokeLines(P, MD.borders, 'rgba(11,31,75,0.42)', 1.4);
    for (const ln of TL.lines) drawMapLine(P, ln, a);
    for (const pin of TL.pins) drawPin(P, pin, a, R);
    // edge fade
    const g = ctx.createLinearGradient(R.x, 0, R.x + 60, 0);
    g.addColorStop(0, 'rgba(244,246,250,1)'); g.addColorStop(1, 'rgba(244,246,250,0)');
    ctx.fillStyle = g; ctx.fillRect(R.x, R.y, 60, R.h);
    const g2 = ctx.createLinearGradient(R.x + R.w, 0, R.x + R.w - 60, 0);
    g2.addColorStop(0, 'rgba(244,246,250,1)'); g2.addColorStop(1, 'rgba(244,246,250,0)');
    ctx.fillStyle = g2; ctx.fillRect(R.x + R.w - 60, R.y, 60, R.h);
    if (!L.inset) for (const st of TL.stats) drawStat(st, a, R);
    // coordinates HUD
    const lat = (2 * Math.atan(Math.exp(cam.y * RAD)) - Math.PI / 2) / RAD;
    const hud = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}   ${Math.abs(cam.x).toFixed(2)}°${cam.x >= 0 ? 'E' : 'W'}`;
    ctx.direction = 'ltr'; ctx.font = font(20); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const hw = L.inset && L.inset.round ? -1e4 : ctx.measureText(hud).width;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    rrect(R.x + 18, R.y + R.h - 50, hw + 24, 34, 17); ctx.fill();
    ctx.fillStyle = 'rgba(11,31,75,0.55)';
    ctx.fillText(hud, R.x + 30, R.y + R.h - 26);
    ctx.restore();
    ctx.strokeStyle = L.inset ? '#fff' : C.line; ctx.lineWidth = L.inset ? 6 : 1.5;
    rrect(R.x, R.y, R.w, R.h, R.r); ctx.stroke();
    ctx.restore();
    if (L.inset) {
      // date/number chips stay full size, beside the inset
      const I = L.inset, Rs = { x: I.small.x + I.S * I.small.s + 4, y: I.small.y - 22, w: 600, h: 100 };
      ctx.save(); ctx.globalAlpha = alpha;
      for (const st of TL.stats) drawStat({ ...st, pos: 'left' }, a, Rs);
      ctx.restore();
    }
  }

  // ---------- carousel ----------
  const CARDS = TL.cards.map((c, i) => ({ ...c, start: c.moves[0].t, end: i + 1 < TL.cards.length ? TL.cards[i + 1].moves[0].t : TL.audioEnd }));
  function carouselPos(a) {
    let p = 0;
    for (let i = 1; i < CARDS.length; i++) p += eio(prog(a, CARDS[i].start - 0.55, CARDS[i].start + 0.3));
    return p;
  }

  function coverDraw(img, x, y, w, h, fx, fy, z) {
    const s = Math.max(w / img.width, h / img.height) * z;
    const sw = w / s, sh = h / s;
    const sx = clamp(fx * img.width - sw / 2, 0, img.width - sw);
    const sy = clamp(fy * img.height - sh / 2, 0, img.height - sh);
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function drawCardImage(card, x, y, w, h, a) {
    const img = IMG[card.img];
    const mv = card.moves;
    let m = 0;
    for (let i = 0; i < mv.length; i++) if (a >= mv[i].t - 0.25) m = i;
    const span = i => [mv[i].t - 0.6, (i + 1 < mv.length ? mv[i + 1].t : card.end) + 0.6];
    const state = (i, aa) => {
      const [s0, s1] = span(i);
      const p = clamp((aa - s0) / (s1 - s0));
      const A = mv[i].a, B = mv[i].b;
      const e = p * 0.85 + eio(p) * 0.15;
      return [lerp(A[0], B[0], e), lerp(A[1], B[1], e), lerp(A[2], B[2], e)];
    };
    const s = state(m, a);
    coverDraw(img, x, y, w, h, s[0], s[1], s[2]);
    if (m > 0) {
      const xf = prog(a, mv[m].t - 0.25, mv[m].t + 0.35);
      if (xf < 1) {
        // cross-zoom from the previous framing
        const sp = state(m - 1, a);
        ctx.save();
        ctx.globalAlpha = 1 - eio(xf);
        coverDraw(img, x, y, w, h, sp[0], sp[1], sp[2] * (1 + 0.12 * xf));
        ctx.restore();
      }
    }
  }

  function drawCarousel(a, alpha, outP = 0) {
    if (alpha <= 0) return;
    const p = carouselPos(a);
    const base = Math.floor(p);
    const { cx, cy, w, h } = L.card;
    const items = [];
    for (let i = Math.max(0, base - 2); i <= Math.min(CARDS.length - 1, base + 3); i++) {
      const r = i - p;
      const ar = Math.abs(r);
      if (ar > 2.6) continue;
      const sgn = Math.sign(r);
      // next cards sit on the left (RTL reading order)
      const off = L.slide ? ar * W : ar <= 1 ? lerp(0, L.side[0], ar) : lerp(L.side[0], L.side[1], ar - 1);
      const sc = L.slide ? 1 : ar <= 1 ? lerp(1, 0.7, ar) : lerp(0.7, 0.5, ar - 1);
      items.push({ i, r, ar, x: cx - sgn * off, sc });
    }
    items.sort((A, B) => B.ar - A.ar);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (L.blurBg) {
      // the current photo, blurred and darkened, fills the frame; cross-fades with the next one
      const i0 = clamp(base, 0, CARDS.length - 1), fr = p - base;
      ctx.filter = 'blur(36px)';
      coverDraw(IMG[CARDS[i0].img], -60, -60, W + 120, H + 120, 0.5, 0.5, 1);
      if (fr > 0 && i0 + 1 < CARDS.length) { ctx.globalAlpha = alpha * fr; coverDraw(IMG[CARDS[i0 + 1].img], -60, -60, W + 120, H + 120, 0.5, 0.5, 1); }
      ctx.filter = 'none';
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(11,31,75,0.5)'; ctx.fillRect(0, 0, W, H);
    }
    if (L.marquee) {
      const seg = chipSegment(Math.max(a, CUT));
      if (seg) {
        const M = L.marquee;
        ctx.font = font(M.size); ctx.direction = 'rtl'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const unit = seg.kicker + '  •  ', uw = ctx.measureText(unit).width;
        const off = ((a - seg.t0) * 70) % uw;
        ctx.fillStyle = 'rgba(255,255,255,0.17)';
        for (let x = -uw + off; x < W; x += uw) ctx.fillText(unit, x, M.y);
      }
    }
    for (const it of items) {
      const cw = w * it.sc, ch = h * it.sc;
      const x = it.x - cw / 2, y = cy - ch / 2 + outP * 60;
      const card = CARDS[it.i];
      ctx.save();
      if (L.frame) {
        // white frame, slightly tilted; lands straighter as it settles
        const tl = L.frame.tilt * RAD * (1 + 0.6 * Math.min(1, it.ar)) * (it.r < 0 ? -1 : 1);
        ctx.translate(it.x, y + ch / 2); ctx.rotate(tl); ctx.translate(-it.x, -(y + ch / 2));
        const b = L.frame.border;
        ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 26;
        ctx.fillStyle = '#fff';
        rrect(x - b, y - b, cw + 2 * b, ch + 2 * b, L.photoR + b); ctx.fill();
      }
      ctx.shadowColor = `rgba(11,31,75,${0.22 * (1 - Math.min(1, it.ar) * 0.5)})`;
      ctx.shadowBlur = 50; ctx.shadowOffsetY = 22;
      ctx.fillStyle = '#fff';
      rrect(x, y, cw, ch, (L.photoR ?? 30) * it.sc); ctx.fill();
      ctx.shadowColor = 'transparent';
      rrect(x, y, cw, ch, (L.photoR ?? 30) * it.sc); ctx.clip();
      drawCardImage(card, x, y, cw, ch, a);
      // depth: fade side cards toward the white background
      const dim = L.slide ? 0 : Math.min(1, it.ar) * 0.55 + Math.max(0, it.ar - 1) * 0.3;
      if (dim > 0) { ctx.fillStyle = `rgba(255,255,255,${dim})`; ctx.fillRect(x, y, cw, ch); }
      if (it.ar < 0.5) {
        // light sweep when a card lands
        const sp = prog(a, card.start - 0.1, card.start + 0.9);
        if (sp > 0 && sp < 1) {
          const sx = x - cw * 0.5 + sp * cw * 2;
          const g = ctx.createLinearGradient(sx - 140, y, sx + 140, y + ch);
          g.addColorStop(0, 'rgba(255,255,255,0)');
          g.addColorStop(0.5, `rgba(255,255,255,${0.28 * Math.sin(sp * Math.PI)})`);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g; ctx.fillRect(x, y, cw, ch);
        }
        const gb = ctx.createLinearGradient(0, y + ch * 0.6, 0, y + ch);
        gb.addColorStop(0, 'rgba(11,31,75,0)'); gb.addColorStop(1, 'rgba(11,31,75,0.35)');
        ctx.fillStyle = gb; ctx.fillRect(x, y + ch * 0.6, cw, ch * 0.4);
        // photo credit, top-left corner, small
        if (card.credit) {
          ctx.globalAlpha = alpha * (1 - it.ar * 2);
          ctx.font = font(19); ctx.direction = 'rtl'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          const ct = 'الصورة: ' + card.credit;
          const tw = ctx.measureText(ct).width;
          ctx.fillStyle = 'rgba(11,31,75,0.45)';
          rrect(x + 16, y + 16, tw + 24, 32, 16); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.fillText(ct, x + 28, y + 33);
          ctx.globalAlpha = alpha;
        }
      }
      ctx.restore();
      if (L.slide) continue;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3;
      rrect(x + 1.5, y + 1.5, cw - 3, ch - 3, (L.photoR ?? 30) * it.sc - 1.5); ctx.stroke();
      ctx.restore();
    }
    if (L.dark) {
      // full-frame photo: navy shade at the top (header) and bottom (headline)
      const th = LOOK === 'captions' ? 480 : 320;
      const gt = ctx.createLinearGradient(0, 0, 0, th);
      gt.addColorStop(0, 'rgba(11,31,75,0.9)'); gt.addColorStop(LOOK === 'captions' ? 0.6 : 0, `rgba(11,31,75,${LOOK === 'captions' ? 0.7 : 0.85})`); gt.addColorStop(1, 'rgba(11,31,75,0)');
      ctx.fillStyle = gt; ctx.fillRect(0, 0, W, th);
      const gb = ctx.createLinearGradient(0, H * 0.5, 0, H);
      gb.addColorStop(0, 'rgba(11,31,75,0)'); gb.addColorStop(0.45, `rgba(11,31,75,${L.pro ? 0.45 : 0.8})`); gb.addColorStop(1, `rgba(11,31,75,${L.pro ? 0.7 : 0.96})`);
      if (!L.blurBg) { ctx.fillStyle = gb; ctx.fillRect(0, H * 0.5, W, H * 0.5); }
    }
    ctx.restore();
  }

  // ---------- progress ----------
  const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function drawProgress(a, alpha) {
    if (alpha <= 0) return;
    const { x0, x1, y } = L.bar;
    const total = TL.audioEnd - CUT;
    const p = clamp((a - CUT) / total);
    const xr = x1, xk = x1 - (x1 - x0) * p;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = L.dark ? 'rgba(255,255,255,0.28)' : '#E7EBF2';
    rrect(x0, y - 4, x1 - x0, 8, 4); ctx.fill();
    const g = ctx.createLinearGradient(x1, 0, x0, 0);
    g.addColorStop(0, L.dark ? '#fff' : '#0B1F4B'); g.addColorStop(1, C.acc);
    ctx.fillStyle = g;
    rrect(xk, y - 4, xr - xk, 8, 4); ctx.fill();
    // chapter ticks
    for (const ch of TL.chapters) {
      const tx = x1 - (x1 - x0) * ((ch - CUT) / total);
      ctx.fillStyle = '#fff';
      ctx.fillRect(tx - 2, y - 6, 4, 12);
    }
    // knob
    ctx.shadowColor = 'rgba(11,31,75,0.25)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(xk, y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = C.acc;
    ctx.beginPath(); ctx.arc(xk, y, 7, 0, Math.PI * 2); ctx.fill();
    // times (RTL: elapsed on the right)
    drawTime(mmss(Math.max(0, a - CUT)), L.bar.tr, y + 2, 'right');
    drawTime(mmss(TL.audioEnd - CUT), L.bar.tl, y + 2, 'left');
    ctx.restore();
  }
  // AL-Quds draws ':' as a small Arabic-style mark; draw the clock colon as two round dots instead
  function drawTime(text, x, y, align, size = 24) {
    const [m, s] = text.split(':');
    ctx.font = font(size); ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = L.dark ? 'rgba(255,255,255,0.8)' : C.gray;
    const wm = ctx.measureText(m).width, ws = ctx.measureText(s).width, wc = size * 0.36;
    const x0 = align === 'right' ? x - wm - wc - ws : x;
    ctx.fillText(m, x0, y);
    ctx.fillText(s, x0 + wm + wc, y);
    const r = size * 0.075;
    for (const dy of [-0.17, 0.17]) { ctx.beginPath(); ctx.arc(x0 + wm + wc / 2, y + dy * size - size * 0.13, r, 0, Math.PI * 2); ctx.fill(); }
  }

  // ---------- headline ----------
  // Topic colours for the second part of the story label (headline `topic`).
  const TOPICS = { 'سياسة': '#2B4FA8', 'اقتصاد': '#B7640A', 'أمن': '#C0392B', 'دبلوماسية': '#6D3FB5', 'مناخ': '#0B7FA3', 'مجتمع': '#B03A7A' };
  // The label follows the headline; a card with its own `kicker` (the opening teaser) overrides it.
  const CHIP_SEGS = (() => {
    const times = [...new Set([...TL.headlines.map(h => h.t), ...TL.cards.map(c => c.moves[0].t)])].sort((x, y) => x - y);
    const segs = [];
    for (const t of times) {
      let h = null, card = null;
      for (const x of TL.headlines) if (x.t <= t) h = x;
      for (const c of TL.cards) if (c.moves[0].t <= t) card = c;
      if (!h) continue;
      const kicker = (card && card.kicker) || h.kicker, topic = card && card.kicker ? card.topic : h.topic;
      const last = segs[segs.length - 1];
      if (last && last.kicker === kicker && last.topic === topic) continue;
      if (last) last.t1 = t - 0.05;
      segs.push({ t0: t, t1: null, kicker, topic });
    }
    return segs;
  })();
  function chipSegment(a) {
    let s = null;
    for (const x of CHIP_SEGS) if (a >= x.t0 - 0.05) s = x;
    return s;
  }
  function chipWidth(kicker, topic, size) {
    ctx.font = font(size); ctx.direction = 'rtl';
    const kw = ctx.measureText(kicker).width;
    const ts = Math.round(size * 0.8);
    ctx.font = font(ts);
    const tw = topic ? ctx.measureText(topic).width + ts * 1.4 : 0;
    return kw + size * 2.6 + (topic ? tw + size * 0.25 : 0);
  }
  function drawChip(kicker, topic, cx, cy, size) {
    ctx.font = font(size); ctx.direction = 'rtl';
    const kw = ctx.measureText(kicker).width;
    const ts = Math.round(size * 0.8);
    ctx.font = font(ts);
    const tw = topic ? ctx.measureText(topic).width + ts * 1.4 : 0;
    const ch = size * 1.875, pad = size * 0.25;
    const cw = kw + size * 2.6 + (topic ? tw + pad : 0);
    const x = cx - cw / 2, y = cy - ch / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(11,31,75,0.30)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#0A8F65';  // deep green: stands apart from the navy headline panel, keeps white text legible
    rrect(x, y, cw, ch, ch / 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3;
    rrect(x, y, cw, ch, ch / 2); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + cw - size * 0.94, y + ch / 2, size * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.font = font(size);
    ctx.fillText(kicker, x + cw - size * 1.56, y + ch / 2 + 2);
    if (topic) {
      const th = ch - pad * 2;
      ctx.fillStyle = '#fff';
      rrect(x + pad, y + pad, tw, th, th / 2); ctx.fill();
      ctx.fillStyle = TOPICS[topic] || C.navy;
      ctx.font = font(ts); ctx.textAlign = 'center';
      ctx.fillText(topic, x + pad + tw / 2, y + ch / 2 + 2);
    }
  }
  const layoutCache = {};
  function layoutText(text, maxW, sizes, maxLines) {
    const key = text + '|' + maxW + '|' + sizes.join(',');
    if (layoutCache[key]) return layoutCache[key];
    ctx.direction = 'rtl';
    let res;
    for (const size of sizes) {
      ctx.font = font(size);
      const space = ctx.measureText(' ').width;
      const words = text.split(/\s+/).map(w => ({ w, width: ctx.measureText(w).width }));
      const lines = [];
      let cur = [], cw = 0;
      for (const wd of words) {
        const nw = cur.length ? cw + space + wd.width : wd.width;
        if (nw > maxW && cur.length) { lines.push({ words: cur, width: cw }); cur = [wd]; cw = wd.width; }
        else { cur.push(wd); cw = nw; }
      }
      if (cur.length) lines.push({ words: cur, width: cw });
      res = { size, space, lines };
      if (lines.length <= maxLines) break;
    }
    // balance two-line headlines so the last line is not a single orphan word
    if (res.lines.length === 2) {
      const all = res.lines[0].words.concat(res.lines[1].words);
      let best = null;
      for (let k = 1; k < all.length; k++) {
        const wA = all.slice(0, k).reduce((s, w) => s + w.width, 0) + res.space * (k - 1);
        const wB = all.slice(k).reduce((s, w) => s + w.width, 0) + res.space * (all.length - k - 1);
        if (wA > maxW || wB > maxW) continue;
        const score = Math.abs(wA - wB);
        if (!best || score < best.score) best = { score, k, wA, wB };
      }
      if (best) res.lines = [{ words: all.slice(0, best.k), width: best.wA }, { words: all.slice(best.k), width: best.wB }];
    }
    layoutCache[key] = res;
    return res;
  }

  // Headlines: two balanced lines at a size in step with the rest of the frame; the shorter line is
  // then stretched toward the longer one with tatweel (kashida) in its longest words and slightly wider
  // spaces. Both are capped so a much shorter line stays shorter (centred) instead of looking torn apart.
  const NO_JOIN_AFTER = new Set('اأإآدذرزوؤةىء');
  const AR_LETTER = /[\u0621-\u064A]/;
  function kashidaSpot(word) {
    // last place inside the word where a letter joins the next one (never splitting lam-alif)
    const ch = [...word];
    for (let i = ch.length - 2; i >= 1; i--) {
      const a = ch[i], b = ch[i + 1];
      if (!AR_LETTER.test(a) || !AR_LETTER.test(b) || NO_JOIN_AFTER.has(a) || a === 'ء') continue;
      if (a === 'ل' && 'اأإآ'.includes(b)) continue;
      return i + 1;
    }
    return -1;
  }
  function stretchWord(word, n) {
    const i = kashidaSpot(word);
    if (i < 0 || n <= 0) return word;
    const ch = [...word];
    return ch.slice(0, i).join('') + '\u0640'.repeat(n) + ch.slice(i).join('');
  }
  function layoutHeadline(text, maxW) {
    const key = 'H|' + text + '|' + maxW;
    if (layoutCache[key]) return layoutCache[key];
    const target = maxW * 0.86;
    const ref = layoutText(text, 1e6, [48], 1);
    const words = ref.lines[0].words;
    const sumW = k0 => words.slice(0, k0).reduce((s, w) => s + w.width, 0);
    let best = { k: words.length, w: ref.lines[0].width };
    for (let k = 1; k < words.length; k++) {
      const w = Math.max(sumW(k) + ref.space * (k - 1), sumW(words.length) - sumW(k) + ref.space * (words.length - k - 1));
      if (w < best.w) best = { k, w };
    }
    const [s0, s1] = L.head.size || [36, 42];
    const size = clamp(Math.floor(48 * target / best.w), s0, s1);
    ctx.direction = 'rtl';
    ctx.font = font(size);
    const space = ctx.measureText(' ').width;
    const tw = ctx.measureText('\u0640').width;
    const raw = words.map(w => w.w);
    const groups = best.k < raw.length ? [raw.slice(0, best.k), raw.slice(best.k)] : [raw];
    const measure = ws => ws.reduce((s, w) => s + ctx.measureText(w).width, 0) + space * (ws.length - 1);
    const goal = Math.max(...groups.map(measure));
    const lines = groups.map(ws => {
      const n = ws.map(() => 0);
      // longest words first, at most one tatweel per word
      const order = ws.map((w, i) => i).filter(i => ws[i].length > 3 && kashidaSpot(ws[i]) >= 0)
        .sort((i, j) => ws[j].length - ws[i].length);
      let cur = measure(ws);
      for (const i of order) {
        if (L.plainHead || cur + tw > goal) break;   // plainHead: no tatweel
        n[i]++; cur += tw;
      }
      const out = ws.map((w, i) => stretchWord(w, n[i]));
      const sized = out.map(w => ({ w, width: ctx.measureText(w).width }));
      const ink = sized.reduce((s, w) => s + w.width, 0);
      const gap = sized.length > 1 ? (goal - ink) / (sized.length - 1) : space;
      const sp = L.plainHead ? space : clamp(gap, space, space * 1.45);
      return { words: sized, width: ink + sp * (sized.length - 1), space: sp };
    });
    return (layoutCache[key] = { size, space, lines });
  }

  function drawWords(lay, cx, cy, lineH, color, a, tIn, tOut, right) {
    const n = lay.lines.length;
    let idx = 0;
    ctx.font = font(lay.size);
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const base = L.lower ? ctx.globalAlpha : 1;  // broadcast: follow the frame's fade (outro)
    // smoothText: the whole headline fades out and the next fades in, without moving
    const outP = tOut == null || (L.staticText && !L.smoothText) ? 0 : eio(prog(a, tOut - 0.35, tOut));
    lay.lines.forEach((ln, li) => {
      const y = cy + (li - (n - 1) / 2) * lineH;
      let x = right != null ? right : cx + ln.width / 2;
      for (const wd of ln.words) {
        const p = L.smoothText ? eio(prog(a, tIn - 0.05, tIn + 0.4)) : L.staticText ? 1 : eout(prog(a, tIn + idx * 0.05, tIn + idx * 0.05 + 0.45));
        if (p > 0) {
          ctx.globalAlpha = base * p * (1 - outP);
          ctx.fillStyle = color;
          ctx.fillText(wd.w, x, L.staticText ? y : y + (1 - p) * 22 - outP * 16);
        }
        x -= wd.width + (ln.space ?? lay.space);
        idx++;
      }
    });
    ctx.globalAlpha = 1;
  }

  function drawHeadline(a, alpha) {
    if (alpha <= 0) return;
    const HL = TL.headlines;
    let i = -1;
    for (let k = 0; k < HL.length; k++) if (a >= HL[k].t - 0.05) i = k;
    if (i < 0) return;
    const h = HL[i];
    const next = HL[i + 1];
    const tOut = next ? next.t - 0.05 : null;
    ctx.save();
    ctx.globalAlpha = alpha;
    // story label (country + optional topic); stays put while it does not change
    const seg = chipSegment(a);
    const kp = seg ? eout(prog(a, seg.t0, seg.t0 + 0.45)) * (seg.t1 == null ? 1 : 1 - eio(prog(a, seg.t1 - 0.35, seg.t1))) : 0;
    if (kp > 0) {
      ctx.globalAlpha = alpha * kp;
      const kx = L.kicker.right ? L.kicker.right - chipWidth(seg.kicker, seg.topic, 32) / 2 : L.kicker.cx;
      if (L.lower) { ctx.globalAlpha = alpha; drawTag(seg.kicker, seg.topic, kp); }
      else drawChip(seg.kicker, seg.topic, kx, L.kicker.y + (1 - kp) * 12, 32);
    }
    // navy panel behind the headlines: wipes in from the right with the first one, then stays
    const pw = L.bar.tr - L.bar.tl, ph = L.head.panelH;
    const px = L.head.cx - pw / 2, py = L.head.cy - ph / 2;
    const wipe = eio(prog(a, HL[0].t - 0.45, HL[0].t + 0.1));
    ctx.globalAlpha = alpha;
    ctx.save();
    if (L.noPanel) ctx.globalAlpha = 0;  // trial looks: words straight on the photo or the white page
    ctx.shadowColor = 'rgba(11,31,75,0.28)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 12;
    const pg = ctx.createLinearGradient(px + pw, 0, px, 0);
    pg.addColorStop(0, '#0B1F4B'); pg.addColorStop(1, '#142E66');
    ctx.fillStyle = pg;
    rrect(px + pw * (1 - wipe), py, pw * wipe, ph, 26); ctx.fill();
    ctx.restore();
    let lw = wipe;
    if (L.lower) {
      // the bar slides out to the right before each new story and back in with it
      for (const c of TL.chapters) lw = Math.min(lw, 1 - eio(prog(a, c - 0.5, c - 0.15)) * (1 - eio(prog(a, c + 0.05, c + 0.45))));
      drawLower(a, lw);
    }
    if (wipe > 0.2 && !L.noPanel) {
      ctx.fillStyle = C.acc;
      rrect(px + pw - 22, py + 26, 8, ph - 52, 4); ctx.fill();
    }
    const lay = layoutHeadline(h.text, L.head.maxW);
    if (L.boxed) { drawBoxed(lay, a, h.t, tOut); ctx.restore(); return; }
    if (L.dark && !L.lower) { ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 16; }  // no halo on the white bar
    if (L.lower) { const B = L.lower; ctx.beginPath(); ctx.rect(B.x + B.w * (1 - lw), B.y, B.w * lw, B.h); ctx.clip(); }
    drawWords(lay, L.head.cx - (L.noPanel ? 0 : 6), L.head.cy, Math.round(lay.size * 1.4), L.head.color || '#FFFFFF', a, h.t, tOut, L.head.right);
    ctx.restore();
  }

  // ---------- spoken captions (look 'captions') ----------
  // Phrases from subtitles.txt; word times spread over each phrase by word length.
  let CAPS = [];
  function loadCaptions() {
    try {
      const x = new XMLHttpRequest();
      x.open('GET', window.EDITION_DIR + '/subtitles.txt', false); x.send();
      CAPS = x.responseText.split('\n').map(l => l.match(/^\[\s*([\d.]+)\s*-\s*([\d.]+)\]\s*(.+)$/)).filter(Boolean)
        .map(m => ({ t0: +m[1], t1: +m[2], text: m[3].trim() })).filter(p => p.t0 < TL.audioEnd);
      for (const p of CAPS) {
        const ws = p.text.split(/\s+/), tot = ws.reduce((n, w) => n + w.length + 1, 0);
        let acc = 0;
        p.words = ws.map(w => { const t = p.t0 + (p.t1 - p.t0) * acc / tot; acc += w.length + 1; return { w, t }; });
      }
    } catch (e) { CAPS = []; }
  }
  function drawCaptions(a, alpha) {
    if (!L.caption || alpha <= 0) return;
    let i = -1;
    for (let k = 0; k < CAPS.length; k++) if (a >= CAPS[k].t0 - 0.05) i = k;
    if (i < 0) return;
    const p = CAPS[i], next = CAPS[i + 1];
    const end = next && next.t0 - p.t1 < 0.8 ? next.t0 : p.t1 + 0.4;
    if (a > end) return;
    const C2 = L.caption;
    const lay = layoutText(p.text, C2.maxW, C2.sizes, C2.lines || 2);
    const lineH = Math.round(lay.size * 1.45);
    const pin = L.staticText ? 1 : eout(prog(a, p.t0 - 0.05, p.t0 + 0.2));
    ctx.save();
    ctx.font = font(lay.size); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    let idx = 0;
    const top = C2.cy - (lay.lines.length - 1) * lineH / 2 + (1 - pin) * 14;
    lay.lines.forEach((ln, li) => {
      let x = C2.right != null ? C2.right : C2.cx + ln.width / 2;
      const y = top + li * lineH;
      for (const wd of ln.words) {
        const w = p.words[idx];
        const nx = p.words[idx + 1];
        const on = w && a >= w.t - 0.03 && (!nx || a < nx.t - 0.03);
        const said = w && a >= w.t - 0.03;
        ctx.globalAlpha = alpha * pin;
        if (on && C2.style !== 'text') {
          ctx.fillStyle = '#0A8F65';
          rrect(x - wd.width - 12, y - lay.size * 0.62, wd.width + 24, lay.size * 1.3, 14); ctx.fill();
        }
        ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = on ? 0 : 14;
        ctx.fillStyle = on && C2.style === 'text' ? '#34D399' : said ? '#fff' : 'rgba(255,255,255,0.6)';
        ctx.fillText(wd.w, x, y + lay.size * 0.05);
        ctx.shadowColor = 'transparent';
        x -= wd.width + lay.space;
        idx++;
      }
    });
    ctx.restore();
  }

  // ---------- modern look extras ----------
  // broadcast lower third: white headline bar with a green edge, navy strip for the spoken words below
  function drawLower(a, wipe) {
    const B = L.lower, xr = B.x + B.w, w = B.w * wipe;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(xr, B.y); ctx.lineTo(xr - w, B.y); ctx.lineTo(xr - w + 26 * wipe, B.y + B.h); ctx.lineTo(xr, B.y + B.h); ctx.closePath(); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#0A8F65'; ctx.fillRect(xr - 16, B.y, 16, B.h);
    if (L.titleInBar && wipe > 0.98) {
      // programme name and date at the bar's left end, apart from the headline by a thin rule
      const bx = B.x + 46, bw = 230, cy = B.y + B.h / 2;
      ctx.fillStyle = '#E2E7EF'; ctx.fillRect(bx + bw + 14, B.y + 30, 2, B.h - 60);
      ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = C.navy; ctx.font = font(34);
      ctx.fillText(TL.title, bx + bw / 2, cy - 18);
      ctx.fillStyle = C.gray; ctx.font = font(22);
      ctx.fillText(TL.date, bx + bw / 2, cy + 26);
    }
    const sw = (B.w - 26) * eio(clamp(wipe * 1.2 - 0.2));
    ctx.fillStyle = 'rgba(11,31,75,0.94)';
    ctx.fillRect(xr - sw, B.y + B.h, sw, 76);
    ctx.restore();
  }
  // broadcast story tag in the lower third's style: one chip, green (country) then white (topic), square
  // corners and the same slanted left edge, sitting on the headline bar; wipes in from the right
  function drawTag(kicker, topic, p, centre) {
    const B = L.lower, th = 58, sl = 9;
    ctx.save();
    ctx.font = font(32); ctx.direction = 'rtl';
    const kw = ctx.measureText(kicker).width + 56;
    ctx.font = font(27);
    const tw = topic ? ctx.measureText(topic).width + 44 : 0;
    const full = kw + tw + sl, vis = full * eio(p);
    // on the headline bar, or centred on a given point (the opening hook)
    const xr = centre ? centre[0] + full / 2 : B.x + B.w, y = centre ? centre[1] - th / 2 : B.y - th;
    ctx.beginPath(); ctx.rect(xr - vis - sl, y - 30, vis + sl, th + 30); ctx.clip();
    const x0 = xr - full;
    ctx.beginPath(); ctx.moveTo(xr, y); ctx.lineTo(x0, y); ctx.lineTo(x0 + sl, y + th); ctx.lineTo(xr, y + th); ctx.closePath();
    ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
    ctx.fillStyle = topic ? '#fff' : '#0A8F65'; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#0A8F65'; ctx.fillRect(xr - kw, y, kw, th);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = font(32); ctx.fillStyle = '#fff';
    ctx.fillText(kicker, xr - kw / 2, y + th / 2 + 2);
    if (topic) { ctx.font = font(27); ctx.fillStyle = TOPICS[topic] || C.navy; ctx.fillText(topic, xr - kw - tw / 2 + sl / 2, y + th / 2 + 2); }
    ctx.restore();
  }
  // ticker: the coming stories crawl along the bottom (left to right, as Arabic tickers run)
  let TICKS = null;
  function drawTicker(a, alpha) {
    if (alpha <= 0) return;
    const T = L.ticker;
    if (!TICKS) TICKS = TL.chapters.map(c => TL.headlines.find(h => h.t >= c - 0.05)).filter(Boolean);
    let cur = -1;
    TL.chapters.forEach((c, i) => { if (a >= c - 0.05) cur = i; });
    // one fixed list crawling at a steady pace: nothing jumps when a new story starts
    const text = TICKS.map(h => h.kicker + ': ' + h.text).join('     ◆     ') + '     ◆     ';
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(11,31,75,0.96)'; ctx.fillRect(0, T.y, W, T.h);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, T.y, W, 2);
    const lw = 190;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, T.y, W - lw, T.h); ctx.clip();
    ctx.font = font(30); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(text).width;
    const off = (Math.max(0, a - CUT) * 85) % tw;
    ctx.fillStyle = '#fff';
    for (let x = W - lw - 30 + off - tw; x < W + tw; x += tw) if (x > -tw && x - tw < W) ctx.fillText(text, x, T.y + T.h / 2 + 2);
    ctx.restore();
    ctx.fillStyle = '#0A8F65';
    ctx.beginPath(); ctx.moveTo(W, T.y); ctx.lineTo(W - lw, T.y); ctx.lineTo(W - lw - 22, T.y + T.h); ctx.lineTo(W, T.y + T.h); ctx.closePath(); ctx.fill();
    ctx.font = font(32); ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText('الأخبار', W - lw / 2 + 4, T.y + T.h / 2 + 2);
    ctx.restore();
  }
  // sting: a navy square in the middle with the story number, country and topic, at each new story
  function drawSting(a) {
    TL.chapters.forEach((c, i) => {
      const p = prog(a, c - 0.5, c + 0.75);
      if (p <= 0 || p >= 1) return;
      const h = TL.headlines.find(x => x.t >= c - 0.05) || {};
      // slides in from the right with a slight turn and a small overshoot, then leaves to the left;
      // the green rule draws itself once the square has landed
      const inP = prog(p, 0, 0.32), outP = ein(prog(p, 0.72, 1));
      const S = 440, cy = H * (L.stingY || 0.42);
      const cx = W / 2 + (1 - eback(inP)) * (W / 2 + S) - outP * (W / 2 + S);
      const rot = (1 - eout(inP)) * 8 * RAD - outP * 6 * RAD;
      ctx.save();
      ctx.globalAlpha = Math.min(1, inP * 3);
      ctx.translate(cx, cy); ctx.rotate(rot);
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
      ctx.fillStyle = 'rgba(11,31,75,0.93)'; ctx.fillRect(-S / 2, -S / 2, S, S);
      ctx.shadowColor = 'transparent';
      const gl = S * eout(prog(p, 0.25, 0.55));
      ctx.fillStyle = '#34D399'; ctx.fillRect(S / 2 - gl, S / 2 - 8, gl, 8);
      ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      ctx.direction = 'ltr'; ctx.font = font(150); ctx.fillStyle = '#34D399';
      ctx.fillText(String(i + 1).padStart(2, '0'), 0, -78);
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-60, 18, 120, 3);
      ctx.direction = 'rtl'; ctx.font = font(h.kicker && h.kicker.length > 10 ? 50 : 62); ctx.fillStyle = '#fff';
      ctx.fillText(h.kicker || '', 0, 82);
      if (h.topic) { ctx.font = font(34); ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.fillText(h.topic, 0, 152); }
      ctx.restore();
    });
  }
  // headline lines on solid boxes (white, then green) that wipe in from the right and out to the left
  function drawBoxed(lay, a, tIn, tOut) {
    const n = lay.lines.length, lineH = Math.round(lay.size * 1.62), R = L.head.right + 24;
    const outP = tOut == null || L.staticText ? 0 : eio(prog(a, tOut - 0.35, tOut));
    lay.lines.forEach((ln, li) => {
      const y = L.head.cy + (li - (n - 1) / 2) * lineH;
      const p = eio(prog(a, tIn + li * 0.12, tIn + li * 0.12 + 0.4));
      const bw = ln.width + 48, bh = lay.size * 1.4;
      const left = R - bw * p, right = R - bw * eio(prog(outP, li * 0.15, 0.85 + li * 0.15));
      if (right - left <= 1) return;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = li === 1 ? '#0A8F65' : '#fff';
      rrect(left, y - bh / 2, right - left, bh, 12); ctx.fill();
      ctx.clip();
      ctx.font = font(lay.size); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillStyle = li === 1 ? '#fff' : C.navy;
      let x = R - 24;
      for (const wd of ln.words) { ctx.fillText(wd.w, x, y + lay.size * 0.06); x -= wd.width + (ln.space ?? lay.space); }
      ctx.restore();
    });
  }
  function drawGlass(alpha) {
    const G = L.glass;
    ctx.save();
    ctx.globalAlpha = alpha;
    rrect(G.x, G.y, G.w, G.h, G.r); ctx.clip();
    ctx.filter = 'blur(26px)';
    ctx.drawImage(cv, G.x - 40, G.y - 40, G.w + 80, G.h + 80, G.x - 40, G.y - 40, G.w + 80, G.h + 80);
    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(11,31,75,0.62)'; ctx.fillRect(G.x, G.y, G.w, G.h);
    const g = ctx.createLinearGradient(0, G.y, 0, G.y + G.h);
    g.addColorStop(0, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(G.x, G.y, G.w, G.h);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2;
    rrect(G.x + 1, G.y + 1, G.w - 2, G.h - 2, G.r); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(G.x + 44, G.y + 312, G.w - 88, 2);  // rule between headline and spoken words
    ctx.restore();
  }
  // story segments along the top, filling right to left
  function drawSegments(a, alpha) {
    const n = TL.chapters.length, gap = 10, x0 = L.margin, x1 = W - L.margin, sw = (x1 - x0 - gap * (n - 1)) / n, y = 30;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let i = 0; i < n; i++) {
      const c0 = TL.chapters[i], c1 = i + 1 < n ? TL.chapters[i + 1] : TL.audioEnd;
      const f = clamp((a - c0) / (c1 - c0));
      const x = x1 - (i + 1) * sw - i * gap;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      rrect(x, y, sw, 7, 3.5); ctx.fill();
      if (f > 0) { ctx.fillStyle = f < 1 ? '#34D399' : '#fff'; rrect(x + sw * (1 - f), y, sw * f, 7, 3.5); ctx.fill(); }
    }
    ctx.restore();
  }
  // at each new story: a green and a navy panel sweep across with the story number and the country
  function drawStoryWipe(a) {
    TL.chapters.forEach((c, i) => {
      const p = prog(a, c - 0.55, c + 0.75);
      if (p <= 0 || p >= 1) return;
      const h = TL.headlines.find(x => x.t >= c - 0.05) || {};
      const enter = eio(prog(p, 0, 0.32)), leave = eio(prog(p, 0.62, 1));
      const sk = 220;  // slant
      const panel = (d, col) => {
        const e = eio(prog(p, d, 0.32 + d)), l = eio(prog(p, 0.62 - d, 1 - d));
        const xr = W + sk - (W + 2 * sk) * e * 0 - (W + sk) * l;   // right edge moves left on leave
        const xl = W + sk - (W + 2 * sk) * e;                       // left edge moves left on enter
        if (xr <= xl) return;
        ctx.beginPath();
        ctx.moveTo(xl, 0); ctx.lineTo(xr, 0); ctx.lineTo(xr - sk, H); ctx.lineTo(xl - sk, H); ctx.closePath();
        ctx.fillStyle = col; ctx.fill();
      };
      ctx.save();
      panel(0, '#0A8F65');
      panel(0.06, C.navy);
      // number + country, visible while the navy panel covers the frame
      const ta = eout(prog(p, 0.22, 0.36)) * (1 - ein(prog(p, 0.56, 0.7)));
      if (ta > 0) {
        const dx = (1 - eout(prog(p, 0.22, 0.4))) * 60 - eio(prog(p, 0.56, 0.7)) * 60;
        ctx.globalAlpha = ta;
        ctx.direction = 'ltr'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = font(300); ctx.fillStyle = 'rgba(52,211,153,0.95)';
        ctx.fillText(String(i + 1).padStart(2, '0'), W / 2 + dx, H * 0.42);
        ctx.direction = 'rtl';
        ctx.font = font(96); ctx.fillStyle = '#fff';
        ctx.fillText(h.kicker || '', W / 2 + dx * 1.5, H * 0.42 + 210);
        if (h.topic) {
          ctx.font = font(44); ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillText(h.topic, W / 2 + dx * 2, H * 0.42 + 300);
        }
      }
      ctx.restore();
    });
  }

  // ---------- header ----------
  function logoBox() {
    const h = L.logoH, w = h * LOGO.width / LOGO.height;
    return { x: W - L.margin - w, y: L.logoY, w, h };
  }
  function drawLogoAt(cx, cy, h, alpha = 1, img = LOGO) {
    const w = h * img.width / img.height;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
  }

  function drawHeader(a, alpha) {
    if (alpha <= 0) return;
    const lb = logoBox();
    ctx.save();
    ctx.globalAlpha = alpha;
    // title and date span the logo's body so the two read as one block, top and bottom aligned
    // text block centred on the logo's visual weight (its lower half), with a clear gap from it
    const tx = lb.x - 52;
    const titleY = lb.y + lb.h * 0.38, dateY = lb.y + lb.h * 0.69;
    ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const ink = L.dark ? '#fff' : C.navy, dim = L.dark ? 'rgba(255,255,255,0.8)' : C.gray;
    if (!L.titleInBar) {
      ctx.fillStyle = ink; ctx.font = font(L.hdrText[0]);
      ctx.fillText(TL.title, tx, titleY);
      ctx.fillStyle = dim; ctx.font = font(L.hdrText[1]);
      ctx.fillText(TL.date, tx, dateY);
    }
    // story counter on the left
    let ch = 0;
    TL.chapters.forEach((c, i) => { if (a >= c) ch = i + 1; });
    if (a >= TL.headlines[TL.headlines.length - 1].t) ch = TL.chapters.length;
    const n = TL.chapters.length;
    ctx.direction = 'ltr'; ctx.textAlign = 'left';
    ctx.font = font(34); ctx.fillStyle = ink;
    const num = String(ch).padStart(2, '0');
    ctx.fillText(num, L.margin, titleY);
    const nw = ctx.measureText(num).width;
    ctx.font = font(24); ctx.fillStyle = dim;
    ctx.fillText(` / ${String(n).padStart(2, '0')}`, L.margin + nw, titleY + 3);
    for (let i = 0; i < (L.segments ? 0 : n); i++) {
      const bx = L.margin + i * 30, by = dateY - 3;
      // segments fill right-to-left in reading order
      const k = n - 1 - i;
      ctx.fillStyle = k < ch ? (k === ch - 1 ? C.acc : ink) : (L.dark ? 'rgba(255,255,255,0.3)' : '#E1E6EE');
      rrect(bx, by, 24, 6, 3); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- background ----------
  function drawBackground() {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    const g1 = ctx.createRadialGradient(80, 120, 0, 80, 120, 560);
    g1.addColorStop(0, 'rgba(16,185,129,0.07)'); g1.addColorStop(1, 'rgba(16,185,129,0)');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createRadialGradient(W - 80, H * 0.56, 0, W - 80, H * 0.56, 620);
    g2.addColorStop(0, 'rgba(11,31,75,0.05)'); g2.addColorStop(1, 'rgba(11,31,75,0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#EDF0F5';
    for (let y = 18; y < L.dotsH; y += 36) for (let x = 18; x < W; x += 36) ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  }

  // ---------- intro ----------
  const NKC = [-15.98, 18.09];
  const INTRO_CITIES = [
    { name: 'سينلوي', lon: -16.49, lat: 16.03, side: 'left' },
    { name: 'داكار', lon: -17.44, lat: 14.69, side: 'down' },
    { name: 'نواذيبو', lon: -17.03, lat: 20.94, side: 'left' },
    { name: 'الداخلة', lon: -15.93, lat: 23.70, side: 'left' },
    { name: 'العيون', lon: -13.20, lat: 27.15, side: 'down' },
    { name: 'لاس بالماس', lon: -15.41, lat: 28.12, side: 'up' },
    { name: 'الرباط', lon: -6.84, lat: 34.02, side: 'left' },
    { name: 'الجزائر', lon: 3.06, lat: 36.75, side: 'up' },
    { name: 'تونس', lon: 10.18, lat: 36.81, side: 'right' },
    { name: 'طرابلس', lon: 13.19, lat: 32.89, side: 'down' },
    { name: 'أبيدجان', lon: -4.03, lat: 5.32, side: 'down' },
    { name: 'تندوف', lon: -8.15, lat: 27.67, side: 'right', at: 1.25 },
    { name: 'تمبكتو', lon: -3.0, lat: 16.77, side: 'up', at: 1.5 },
    { name: 'باماكو', lon: -8.0, lat: 12.64, side: 'down', at: 1.75 },
    { name: 'كيدال', lon: 1.41, lat: 18.44, side: 'right', at: 1.95 },
    { name: 'نيامي', lon: 2.11, lat: 13.51, side: 'right', at: 2.2 },
    { name: 'تمنراست', lon: 5.52, lat: 22.79, side: 'right', at: 2.45 },
  ];
  const coastProg = t => eio(prog(t, 0.35, 3.3));
  function prepCoast(pts) {
    const m = pts.map(p => [p[0], mercY(p[1])]);
    const cum = [0];
    for (let i = 1; i < m.length; i++) cum.push(cum[i - 1] + Math.hypot(m[i][0] - m[i - 1][0], m[i][1] - m[i - 1][1]));
    return { pts, m, cum, total: cum[cum.length - 1] };
  }
  const COASTS = [prepCoast(MD.coastNorth), prepCoast(MD.coastSouth)];
  INTRO_CITIES.forEach(c => {
    if (c.at) return;
    const my = mercY(c.lat);
    let best = null;
    for (const cs of COASTS) cs.m.forEach((p, i) => {
      const d = Math.hypot(p[0] - c.lon, p[1] - my);
      if (!best || d < best.d) best = { d, f: cs.cum[i] / cs.total };
    });
    for (let t = 0; t < 4; t += 0.01) if (coastProg(t) >= best.f) { c.at = t; break; }
  });

  function introCam(t) {
    const [w0, w1] = L.intro.w;
    let cam = { x: L.intro.lon, y: mercY(23), w: lerp(w0, w1, eio(prog(t, 0, 4.2))) };
    const z = ein(prog(t, 4.15, 5.0));
    if (z > 0) {
      cam.x = lerp(cam.x, NKC[0], eout(prog(t, 4.15, 4.9)));
      cam.y = lerp(cam.y, mercY(NKC[1]), eout(prog(t, 4.15, 4.9)));
      cam.w = Math.exp(lerp(Math.log(cam.w), Math.log(3), z));
    }
    return cam;
  }

  function threadPath(P, c) {
    const p0 = P(c.lon, c.lat), p1 = P(NKC[0], NKC[1]);
    const ctl = control(p0, p1, 0.2);
    return { p0, p1, ctl };
  }
  function strokeQuad(th, u0, u1) {
    const N = 40;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const q = quadPoint(th.p0, th.ctl, th.p1, lerp(u0, u1, i / N));
      i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
    }
    ctx.stroke();
  }

  function drawIntro(t) {
    const rect = { x: 0, y: 0, w: W, h: H };
    const cam = introCam(t);
    const mapA = 1 - eio(prog(t, 4.55, 5.0));
    if (mapA > 0) {
      ctx.save();
      ctx.globalAlpha = mapA;
      const nkm = [NKC[0], mercY(NKC[1])];
      const P = drawGrid(cam, rect, {
        landRGB: [222, 228, 237],
        reveal: (x, my) => clamp((t * 24 - Math.hypot(x - nkm[0], my - nkm[1])) / 5),
        seaColor: `rgba(227,232,240,${eout(prog(t, 0, 1.2))})`,
      });
      strokeLines(P, MD.borders, 'rgba(11,31,75,0.25)', 1.3, eout(prog(t, 1.0, 2.6)));

      // glowing coastline from Nouakchott
      const u = coastProg(t);
      for (const cs of COASTS) {
        const L0 = u * cs.total;
        const pts = [];
        let head = null;
        for (let i = 0; i < cs.m.length; i++) {
          if (cs.cum[i] > L0) {
            if (i > 0) {
              const f = (L0 - cs.cum[i - 1]) / (cs.cum[i] - cs.cum[i - 1]);
              head = P.m(lerp(cs.m[i - 1][0], cs.m[i][0], f), lerp(cs.m[i - 1][1], cs.m[i][1], f));
              pts.push(head);
            }
            break;
          }
          pts.push(P.m(cs.m[i][0], cs.m[i][1]));
        }
        if (pts.length < 2) continue;
        if (!head) head = pts[pts.length - 1];
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        for (const [lw, col] of [[14, 'rgba(16,185,129,0.10)'], [7, 'rgba(16,185,129,0.30)'], [3, 'rgba(16,185,129,0.95)'], [1.2, 'rgba(255,255,255,0.9)']]) {
          ctx.strokeStyle = col; ctx.lineWidth = lw;
          ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
        }
        if (u > 0 && u < 1) {
          glowDot(head[0], head[1], 40, '16,185,129', 0.9);
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(head[0], head[1], 5, 0, Math.PI * 2); ctx.fill();
        }
      }

      // threads from each city to Nouakchott
      const hub = P(NKC[0], NKC[1]);
      let arrivals = 0;
      const accel = t > 3.4 ? 0.7 * (t - 3.4) + 2.4 * Math.pow(t - 3.4, 2) : 0;
      for (const c of INTRO_CITIES) {
        const th = threadPath(P, c);
        const len = Math.hypot(th.p1[0] - th.p0[0], th.p1[1] - th.p0[1]);
        const s0 = c.at + 0.2, dur = 0.55 + len / 1400;
        const tau = prog(t, s0, s0 + dur);
        if (tau <= 0) continue;
        const f = Math.pow(tau, 2.3);
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(11,31,75,0.16)'; ctx.lineWidth = 1.5;
        strokeQuad(th, 0, f);
        ctx.strokeStyle = 'rgba(16,185,129,0.9)'; ctx.lineWidth = 3;
        if (tau < 1) {
          strokeQuad(th, Math.max(0, f - 0.3), f);
          const q = quadPoint(th.p0, th.ctl, th.p1, f);
          glowDot(q[0], q[1], 22, '16,185,129', 0.95);
        } else {
          arrivals++;
          const rp = prog(t, s0 + dur, s0 + dur + 0.7);
          if (rp < 1) {
            ctx.strokeStyle = `rgba(16,185,129,${0.7 * (1 - rp)})`; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(hub[0], hub[1], 12 + rp * 70, 0, Math.PI * 2); ctx.stroke();
          }
          if (accel > 0) {
            for (let k = 0; k < 2; k++) {
              const ph = (accel + k * 0.5 + c.lon * 0.013) % 1;
              const e = ph * ph;
              ctx.strokeStyle = 'rgba(16,185,129,0.85)'; ctx.lineWidth = 3;
              strokeQuad(th, Math.max(0, e - 0.18), e);
            }
          }
        }
      }
      // cities
      for (const c of INTRO_CITIES) {
        const a = fade(t, c.at, null, 0.35);
        if (a <= 0) continue;
        const [x, y] = P(c.lon, c.lat);
        const pop = eback(prog(t, c.at, c.at + 0.4));
        ctx.save();
        ctx.globalAlpha = mapA * a;
        glowDot(x, y, 24 * pop, '16,185,129', 0.5);
        ctx.fillStyle = C.navy;
        ctx.beginPath(); ctx.arc(x, y, 6 * pop, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x, y, 2.4 * pop, 0, Math.PI * 2); ctx.fill();
        const off = 34;
        const d = { up: [0, -off], down: [0, off], left: [-off * 1.9, 0], right: [off * 1.9, 0] }[c.side];
        ctx.font = font(28); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = C.navy;
        ctx.fillText(c.name, x + d[0], y + d[1]);
        ctx.restore();
      }
      // Nouakchott hub
      const hubGlow = 40 + Math.min(arrivals, 12) * 9 + accel * 40;
      glowDot(hub[0], hub[1], hubGlow, '16,185,129', 0.85);
      ctx.fillStyle = C.navy;
      ctx.beginPath(); ctx.arc(hub[0], hub[1], 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(hub[0], hub[1], 4, 0, Math.PI * 2); ctx.fill();
      const na = eout(prog(t, 0.1, 0.6)) * (1 - prog(t, 3.9, 4.3));
      if (na > 0) {
        ctx.globalAlpha = mapA * na;
        labelPill(hub[0] + 104, hub[1], 'نواكشوط', 32, { fill: C.navy, color: '#fff' });
      }
      ctx.restore();
    }

    // bloom that melts into the logo
    const bloom = eio(prog(t, 4.4, 5.05)) * (1 - eio(prog(t, 5.05, 5.7)));
    if (bloom > 0) {
      const r = 60 + 900 * bloom;
      const g = ctx.createRadialGradient(L.intro.logo.cx, L.intro.logo.cy + 40, 0, L.intro.logo.cx, L.intro.logo.cy + 40, r);
      g.addColorStop(0, `rgba(255,255,255,${bloom})`);
      g.addColorStop(0.3, `rgba(190,245,225,${bloom * 0.9})`);
      g.addColorStop(0.65, `rgba(16,185,129,${bloom * 0.25})`);
      g.addColorStop(1, 'rgba(16,185,129,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }

  // Logo + subtitle of the opening, then the glide into the header.
  function drawIntroLogo(t) {
    const lp = prog(t, 4.85, 5.75);
    if (lp <= 0) return;
    const glide = eio(prog(t, 6.0, 6.85));
    const lb = logoBox();
    const { h: h0, cx: cx0, cy: cy0 } = L.intro.logo;
    const h = lerp(h0, lb.h, glide);
    const cx = lerp(cx0, lb.x + lb.w / 2, glide), cy = lerp(cy0, lb.y + lb.h / 2, glide);
    const s = lerp(1.25, 1, eout(lp));
    ctx.save();
    if (lp < 1) {
      ctx.filter = `blur(${(1 - eout(lp)) * 22}px)`;
      drawLogoAt(cx, cy, h * s, eout(lp), LOGO_ACC);
      ctx.filter = 'none';
    }
    drawLogoAt(cx, cy, h * s, eio(prog(t, 5.1, 5.9)));
    ctx.restore();
    // subtitle
    const sp = prog(t, 5.35, 6.05);
    const so = 1 - eio(prog(t, 5.95, 6.3));
    if (sp > 0 && so > 0) {
      ctx.save();
      ctx.globalAlpha = so;
      ctx.font = font(70); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const tw = ctx.measureText(TL.title).width;
      const y = L.intro.titleY, mx = L.intro.logo.cx;
      ctx.save();
      const rev = eout(sp);
      ctx.beginPath(); ctx.rect(mx + tw / 2 + 20 - (tw + 40) * rev, y - 70, (tw + 40) * rev, 140); ctx.clip();
      ctx.fillStyle = C.navy;
      ctx.fillText(TL.title, mx, y);
      ctx.restore();
      const lw = (tw * 0.55) * eout(prog(t, 5.5, 6.1));
      ctx.fillStyle = C.acc;
      rrect(mx - lw / 2, y + 62, lw, 6, 3); ctx.fill();
      ctx.restore();
    }
  }

  // ---------- hook ----------
  // Optional first seconds (TL.hook): the day's strongest story full-frame with one big line, so the video
  // opens on news. The map intro then plays faster up to the logo, which keeps its time (and the music's hit).
  const HOOK = TL.hook ? 2.6 : 0;
  const MAP_END = 4.15;  // intro time at which the map zooms into Nouakchott; unchanged from here on
  const introTime = t => (t >= MAP_END || !HOOK ? t : Math.max(0, (t - HOOK) * MAP_END / (MAP_END - HOOK)));
  const HOOK_LAYOUT = {
    feed: { cy: 900, maxW: 960, sizes: [92, 84, 76, 70], logoH: 110 },
    youtube: { cy: 760, maxW: 1500, sizes: [100, 90, 80], logoH: 120 },
    story: { cy: 1180, maxW: 960, sizes: [96, 86, 78, 70], logoH: 120 },
  };
  function drawHook(t) {
    const hk = TL.hook, HL = HOOK_LAYOUT[FORMAT] || HOOK_LAYOUT.feed;
    const img = IMG[hk.img];
    const out = eio(prog(t, HOOK - 0.3, HOOK));
    ctx.save();
    ctx.globalAlpha = 1 - out;
    // photo: punch-in at the start, slow push, a quick zoom as it hands over to the map
    const f = hk.f || [0.5, 0.5];
    const z = lerp(1.22, 1.06, eout(prog(t, 0, 0.5))) + 0.05 * prog(t, 0.5, HOOK) + 0.25 * ein(out);
    coverDraw(img, 0, 0, W, H, f[0], f[1], z);
    const g = ctx.createLinearGradient(0, H * 0.35, 0, H);
    g.addColorStop(0, 'rgba(11,31,75,0)'); g.addColorStop(0.45, 'rgba(11,31,75,0.72)'); g.addColorStop(1, 'rgba(11,31,75,0.94)');
    ctx.fillStyle = g; ctx.fillRect(0, H * 0.35, W, H * 0.65);
    const gt = ctx.createLinearGradient(0, 0, 0, H * 0.22);
    gt.addColorStop(0, 'rgba(11,31,75,0.55)'); gt.addColorStop(1, 'rgba(11,31,75,0)');
    ctx.fillStyle = gt; ctx.fillRect(0, 0, W, H * 0.22);
    // white flash on the first frame
    const fl = 1 - prog(t, 0, 0.25);
    if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${0.7 * fl})`; ctx.fillRect(0, 0, W, H); }
    // logo, top right in the safe area
    const lh = HL.logoH, lw = lh * LOGO_W.width / LOGO_W.height;
    drawLogoAt(W - L.margin - lw / 2, L.logoY + lh / 2 + 10, lh, eout(prog(t, 0.1, 0.5)), LOGO_W);
    // headline: words rise in one after another
    const lay = layoutText(hk.text, HL.maxW, HL.sizes, 2);
    const lineH = Math.round(lay.size * 1.35);
    const top = HL.cy - (lay.lines.length - 1) * lineH / 2;
    const kp = eout(prog(t, 0.15, 0.5));
    if (hk.kicker) {
      ctx.globalAlpha = (1 - out) * kp;
      if (L.lower) drawTag(hk.kicker, hk.topic, kp, [W / 2, top - lineH * 0.5 - 60]);
      else drawChip(hk.kicker, hk.topic, W / 2, top - lineH * 0.5 - 60 + (1 - kp) * 12, 38);
      ctx.globalAlpha = 1 - out;
    }
    ctx.font = font(lay.size); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    let idx = 0;
    lay.lines.forEach((ln, li) => {
      let x = W / 2 + ln.width / 2;
      const y = top + li * lineH;
      for (const wd of ln.words) {
        const p = L.staticText ? eio(prog(t, 0.3, 0.7)) : eout(prog(t, 0.3 + idx * 0.07, 0.65 + idx * 0.07));
        if (p > 0) {
          ctx.globalAlpha = (1 - out) * p;
          ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 18;
          ctx.fillStyle = '#fff';
          ctx.fillText(wd.w, x, L.staticText ? y : y + (1 - p) * 26);
          ctx.shadowColor = 'transparent';
        }
        x -= wd.width + lay.space;
        idx++;
      }
    });
    ctx.globalAlpha = 1 - out;
    const bw = 180 * eout(prog(t, 0.6, 1.1));
    ctx.fillStyle = C.acc;
    rrect(W / 2 - bw / 2, top + (lay.lines.length - 0.5) * lineH + 22, bw, 7, 3.5); ctx.fill();
    ctx.restore();
  }

  // ---------- outro ----------
  const SOCIAL = [
    { icons: ['facebook', 'tiktok', 'youtube'], handle: 'ERRIWAYA' },
    { icons: ['instagram'], handle: 'ERRIWAYA.MR' },
  ];
  function drawIcon(name, x, y, s) {
    ctx.save();
    ctx.fillStyle = C.navy;
    rrect(x, y, s, s, s * 0.3); ctx.fill();
    ctx.translate(x + s * 0.22, y + s * 0.22);
    const k = (s * 0.56) / 24;
    ctx.scale(k, k);
    ctx.fillStyle = '#fff';
    ctx.fill(new Path2D(window.ICONS[name]));
    ctx.restore();
  }

  function drawOutro(t) {
    const o = t - OUTRO;
    if (o < 0) return;
    // faint region map in the background
    const ma = eout(prog(o, 0.4, 1.6));
    if (ma > 0) {
      ctx.save();
      ctx.globalAlpha = ma * 0.55;
      const cam = { x: L.outro.lon, y: mercY(24), w: lerp(L.outro.w[0], L.outro.w[1], prog(o, 0, 8)) };
      const P = drawGrid(cam, { x: 0, y: 0, w: W, h: H }, {
        landRGB: [232, 236, 243], seaColor: '#F1F3F7',
        layers: [{ set: new Set(['478', '504', '732', '012', '788', '434'].map(id => idIndex[id])), kind: 'primary', alpha: 0.18, elapsed: o + 2, ox: NKC[0], oy: mercY(NKC[1]) }],
      });
      strokeLines(P, MD.borders, 'rgba(11,31,75,0.12)', 1.2);
      ctx.restore();
      // keep the centre readable
      const g = ctx.createRadialGradient(W / 2, L.outro.logo.cy + 110, 100, W / 2, L.outro.logo.cy + 110, 640);
      g.addColorStop(0, `rgba(255,255,255,${0.92 * ma})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    // logo glides from the header to the centre
    const lb = logoBox();
    const gp = eio(prog(o, 0.15, 1.15));
    const h = lerp(lb.h, L.outro.logo.h, gp);
    const cx = lerp(lb.x + lb.w / 2, L.outro.logo.cx, gp), cy = lerp(lb.y + lb.h / 2, L.outro.logo.cy, gp);
    if (gp > 0.02 && gp < 0.98) {
      ctx.save(); ctx.globalAlpha = 0.35 * Math.sin(gp * Math.PI);
      ctx.filter = 'blur(18px)'; drawLogoAt(cx, cy, h, 1, LOGO_ACC); ctx.filter = 'none';
      ctx.restore();
    }
    drawLogoAt(cx, cy, h);
    // subtitle
    const sp = eout(prog(o, 0.9, 1.5));
    ctx.save();
    ctx.globalAlpha = sp;
    ctx.font = font(52); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = C.navy;
    ctx.fillText(TL.title, W / 2, L.outro.titleY + (1 - sp) * 20);
    ctx.fillStyle = C.acc;
    const lw = 160 * eout(prog(o, 1.1, 1.7));
    rrect(W / 2 - lw / 2, L.outro.titleY + 50, lw, 5, 2.5); ctx.fill();
    ctx.restore();
    // social rows
    const kp = eout(prog(o, 1.3, 1.8));
    ctx.save();
    ctx.globalAlpha = kp;
    ctx.font = font(28); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = C.gray;
    ctx.fillText('تابعونا على', W / 2, L.outro.followY);
    ctx.restore();
    const S = 72, gap = 16;
    SOCIAL.forEach((row, ri) => {
      const y = L.outro.rowsY + ri * 112;
      ctx.font = font(46); ctx.direction = 'ltr';
      const tw = ctx.measureText(row.handle).width;
      const iw = row.icons.length * S + (row.icons.length - 1) * gap;
      const total = iw + 30 + tw;
      const x0 = W / 2 - total / 2;
      const rp = prog(o, 1.5 + ri * 0.25, 2.1 + ri * 0.25);
      if (rp <= 0) return;
      ctx.save();
      ctx.globalAlpha = eout(rp);
      // pill behind the row
      ctx.shadowColor = 'rgba(11,31,75,0.12)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
      ctx.fillStyle = '#fff';
      rrect(x0 - 18, y - 12, total + 54, S + 24, (S + 24) / 2); ctx.fill();
      ctx.shadowColor = 'transparent';
      row.icons.forEach((ic, i) => {
        const ip = eback(prog(o, 1.55 + ri * 0.25 + i * 0.08, 2.0 + ri * 0.25 + i * 0.08));
        const ix = x0 + i * (S + gap) + S / 2, iy = y + S / 2;
        ctx.save(); ctx.translate(ix, iy); ctx.scale(ip, ip);
        drawIcon(ic, -S / 2, -S / 2, S);
        ctx.restore();
      });
      ctx.fillStyle = C.navy; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(row.handle, x0 + iw + 30 + (1 - eout(rp)) * 20, y + S / 2 + 3);
      ctx.restore();
    });
  }

  // ---------- cover (thumbnail) ----------
  // Logo, title and date, the photos of the first three stories (or TL.cover.imgs) and every country covered.
  function coverPhotos() {
    if (TL.cover && TL.cover.imgs) return TL.cover.imgs.map(img => ({ img, f: [0.5, 0.5, 1], kicker: null }));
    const kickerAt = a => { let k = null; for (const h of TL.headlines) if (h.t <= a + 0.05) k = h.kicker; return k; };
    return TL.chapters.slice(0, 3).map(c => {
      const card = CARDS.find(cd => cd.start >= c - 0.05) || CARDS[0];
      return { img: card.img, f: card.moves[0].a, kicker: kickerAt(c) };
    });
  }
  function renderCover() {
    const V = L.cover;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    drawBackground();
    drawLogoAt(V.logo.cx, V.logo.cy, V.logo.h);
    ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = C.navy; ctx.font = font(V.title[2]);
    ctx.fillText(TL.title, V.title[0], V.title[1]);
    ctx.fillStyle = C.acc;
    rrect(V.title[0] - 80, V.title[1] + V.title[2] * 0.58, 160, 6, 3); ctx.fill();
    ctx.fillStyle = C.gray; ctx.font = font(V.date[2]);
    ctx.fillText(TL.date, V.date[0], V.date[1]);
    coverPhotos().forEach((ph, i) => {
      const [x, y, w, h] = V.photos[i] || [];
      if (w == null || !IMG[ph.img]) return;
      ctx.save();
      ctx.shadowColor = 'rgba(11,31,75,0.22)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
      ctx.fillStyle = '#fff';
      rrect(x, y, w, h, 28); ctx.fill();
      ctx.shadowColor = 'transparent';
      rrect(x, y, w, h, 28); ctx.clip();
      coverDraw(IMG[ph.img], x, y, w, h, ph.f[0], ph.f[1], ph.f[2]);
      const gb = ctx.createLinearGradient(0, y + h * 0.55, 0, y + h);
      gb.addColorStop(0, 'rgba(11,31,75,0)'); gb.addColorStop(1, 'rgba(11,31,75,0.45)');
      ctx.fillStyle = gb; ctx.fillRect(x, y + h * 0.55, w, h * 0.45);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 4;
      rrect(x + 2, y + 2, w - 4, h - 4, 26); ctx.stroke();
      if (ph.kicker) {
        const sz = i ? 28 : 34;
        ctx.font = font(sz); ctx.direction = 'rtl';
        const pw = ctx.measureText(ph.kicker).width + sz * 1.6, phh = sz * 1.7;
        ctx.fillStyle = '#0A8F65';
        rrect(x + w - pw - 18, y + h - phh - 18, pw, phh, phh / 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ph.kicker, x + w - 18 - pw / 2, y + h - 18 - phh / 2 + 2);
      }
    });
    // every country covered, as chips in reading order (right to left), centred line by line
    const names = [...new Set(TL.headlines.map(h => h.kicker).filter(k => k && k !== TL.title))];
    const sz = 34, ch = 66, gap = 14;
    ctx.font = font(sz); ctx.direction = 'rtl';
    const chips = names.map(n => ({ n, w: ctx.measureText(n).width + sz * 1.4 }));
    const rows = [[]];
    let rw = 0;
    for (const c of chips) {
      if (rw && rw + gap + c.w > V.chips.maxW) { rows.push([]); rw = 0; }
      rows[rows.length - 1].push(c); rw += (rw ? gap : 0) + c.w;
    }
    rows.forEach((row, ri) => {
      const total = row.reduce((s, c) => s + c.w, 0) + gap * (row.length - 1);
      let x = V.chips.cx + total / 2;
      const y = V.chips.y + ri * (ch + gap);
      for (const c of row) {
        ctx.save();
        ctx.shadowColor = 'rgba(11,31,75,0.14)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
        ctx.fillStyle = C.navy;
        rrect(x - c.w, y, c.w, ch, ch / 2); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(c.n, x - c.w / 2, y + ch / 2 + 2);
        x -= c.w + gap;
      }
    });
  }

  // ---------- frame ----------
  function renderFrame(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    const a = at(t);
    const bgA = eio(prog(t, 5.6, 6.6));
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    if (t < INTRO + 0.5 && t >= HOOK - 0.3) drawIntro(introTime(t));
    if (t < HOOK) drawHook(t);
    if (bgA > 0) {
      ctx.save(); ctx.globalAlpha = bgA; drawBackground(); ctx.restore();
    }
    if (t >= 5.6) {
      const out = eio(prog(t, OUTRO, OUTRO + 0.7));
      const inA = k => eout(prog(t, 6.45 + k * 0.12, 7.15 + k * 0.12)) * (1 - out);
      if (t >= OUTRO) { ctx.save(); ctx.translate(0, out * 40); }
      drawCarousel(Math.max(a, CUT), inA(0), 0);
      if (L.glass) drawGlass(inA(1));
      if (!L.segments && !L.noBar) drawProgress(Math.max(a, CUT), inA(2));
      drawHeadline(a, inA(3));
      drawMapCard(Math.max(a, CUT), inA(4));
      drawCaptions(a, inA(3));
      if (L.wipe) drawStoryWipe(a);
      if (L.ticker) drawTicker(a, inA(3));
      if (L.sting) drawSting(a);
      if (t >= OUTRO) ctx.restore();
      const hdr = eout(prog(t, 6.8, 7.4)) * (1 - eio(prog(t, OUTRO, OUTRO + 0.4)));
      drawHeader(a, hdr);
      if (L.segments) drawSegments(a, hdr);
      if (t >= 6.85 && t < OUTRO + 0.15) {
        const lb = logoBox();
        ctx.drawImage(L.dark ? LOGO_W : LOGO, lb.x, lb.y, lb.w, lb.h);
      }
      drawOutro(t);
    }
    if (t < 6.85) drawIntroLogo(t);
  }

  async function init() {
    await document.fonts.load(font(48));
    await document.fonts.ready;
    const files = [...new Set([...TL.cards.map(c => c.img), ...(TL.hook ? [TL.hook.img] : [])])];
    await Promise.all(files.map(async f => { IMG[f] = await loadImage(window.EDITION_DIR + '/img/' + f); }));
    const logo = await loadImage('../assets/logo-mark.png');
    LOGO = tint(logo, C.navy);
    LOGO_ACC = tint(logo, C.acc);
    LOGO_W = tint(logo, '#fff');
    if (L.caption) loadCaptions();
    window.renderFrame = renderFrame;
    window.renderCover = renderCover;
    window.DURATION = DURATION;
    window.SIZE = [W, H];
    window.READY = true;
    const q = new URLSearchParams(location.search);
    renderFrame(parseFloat(q.get('t') || '0'));
  }
  init();
})();
