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
  const W = L.W, H = L.H;
  // edition cameras are framed for the feed map (980x422); keep the same visible area on other map shapes
  const CAM_SCALE = Math.sqrt((422 / 980) / (L.map.h / L.map.w));

  const INTRO = TL.intro, CUT = TL.audioCut;
  const vt = a => INTRO + (a - CUT);          // voice-over time -> video time
  const at = t => t - INTRO + CUT;            // video time -> voice-over time
  const OUTRO = vt(TL.outroAt);
  const DURATION = vt(TL.audioEnd) + TL.tail;

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
  let LOGO = null, LOGO_ACC = null;
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
    if (alpha <= 0) return;
    const R = L.map;
    ctx.save();
    ctx.globalAlpha = alpha;
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
    for (const st of TL.stats) drawStat(st, a, R);
    // coordinates HUD
    const lat = (2 * Math.atan(Math.exp(cam.y * RAD)) - Math.PI / 2) / RAD;
    const hud = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}   ${Math.abs(cam.x).toFixed(2)}°${cam.x >= 0 ? 'E' : 'W'}`;
    ctx.direction = 'ltr'; ctx.font = font(20); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const hw = ctx.measureText(hud).width;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    rrect(R.x + 18, R.y + R.h - 50, hw + 24, 34, 17); ctx.fill();
    ctx.fillStyle = 'rgba(11,31,75,0.55)';
    ctx.fillText(hud, R.x + 30, R.y + R.h - 26);
    ctx.restore();
    ctx.strokeStyle = C.line; ctx.lineWidth = 1.5;
    rrect(R.x, R.y, R.w, R.h, R.r); ctx.stroke();
    ctx.restore();
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
      const off = ar <= 1 ? lerp(0, L.side[0], ar) : lerp(L.side[0], L.side[1], ar - 1);
      const sc = ar <= 1 ? lerp(1, 0.7, ar) : lerp(0.7, 0.5, ar - 1);
      items.push({ i, r, ar, x: cx - sgn * off, sc });
    }
    items.sort((A, B) => B.ar - A.ar);
    ctx.save();
    ctx.globalAlpha = alpha;
    for (const it of items) {
      const cw = w * it.sc, ch = h * it.sc;
      const x = it.x - cw / 2, y = cy - ch / 2 + outP * 60;
      const card = CARDS[it.i];
      ctx.save();
      ctx.shadowColor = `rgba(11,31,75,${0.22 * (1 - Math.min(1, it.ar) * 0.5)})`;
      ctx.shadowBlur = 50; ctx.shadowOffsetY = 22;
      ctx.fillStyle = '#fff';
      rrect(x, y, cw, ch, 30 * it.sc); ctx.fill();
      ctx.shadowColor = 'transparent';
      rrect(x, y, cw, ch, 30 * it.sc); ctx.clip();
      drawCardImage(card, x, y, cw, ch, a);
      // depth: fade side cards toward the white background
      const dim = Math.min(1, it.ar) * 0.55 + Math.max(0, it.ar - 1) * 0.3;
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
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3;
      rrect(x + 1.5, y + 1.5, cw - 3, ch - 3, 30 * it.sc - 1.5); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- progress ----------
  const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function drawProgress(a, alpha) {
    if (alpha <= 0) return;
    const { x0, x1, y } = L.bar;
    const total = TL.outroAt - CUT;
    const p = clamp((a - CUT) / total);
    const xr = x1, xk = x1 - (x1 - x0) * p;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#E7EBF2';
    rrect(x0, y - 4, x1 - x0, 8, 4); ctx.fill();
    const g = ctx.createLinearGradient(x1, 0, x0, 0);
    g.addColorStop(0, '#0B1F4B'); g.addColorStop(1, C.acc);
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
    ctx.font = font(size); ctx.direction = 'ltr'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = C.gray;
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
    const size = clamp(Math.floor(48 * target / best.w), 36, 42);
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
        if (cur + tw > goal) break;
        n[i]++; cur += tw;
      }
      const out = ws.map((w, i) => stretchWord(w, n[i]));
      const sized = out.map(w => ({ w, width: ctx.measureText(w).width }));
      const ink = sized.reduce((s, w) => s + w.width, 0);
      const gap = sized.length > 1 ? (goal - ink) / (sized.length - 1) : space;
      const sp = clamp(gap, space, space * 1.45);
      return { words: sized, width: ink + sp * (sized.length - 1), space: sp };
    });
    return (layoutCache[key] = { size, space, lines });
  }

  function drawWords(lay, cx, cy, lineH, color, a, tIn, tOut) {
    const n = lay.lines.length;
    let idx = 0;
    ctx.font = font(lay.size);
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const outP = tOut == null ? 0 : eio(prog(a, tOut - 0.35, tOut));
    lay.lines.forEach((ln, li) => {
      const y = cy + (li - (n - 1) / 2) * lineH;
      let x = cx + ln.width / 2;
      for (const wd of ln.words) {
        const p = eout(prog(a, tIn + idx * 0.05, tIn + idx * 0.05 + 0.45));
        if (p > 0) {
          ctx.globalAlpha = p * (1 - outP);
          ctx.fillStyle = color;
          ctx.fillText(wd.w, x, y + (1 - p) * 22 - outP * 16);
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
      drawChip(seg.kicker, seg.topic, L.kicker.cx, L.kicker.y + (1 - kp) * 12, 32);
    }
    // navy panel behind the headlines: wipes in from the right with the first one, then stays
    const pw = L.bar.tr - L.bar.tl, ph = L.head.panelH;
    const px = L.head.cx - pw / 2, py = L.head.cy - ph / 2;
    const wipe = eio(prog(a, HL[0].t - 0.45, HL[0].t + 0.1));
    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.shadowColor = 'rgba(11,31,75,0.28)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 12;
    const pg = ctx.createLinearGradient(px + pw, 0, px, 0);
    pg.addColorStop(0, '#0B1F4B'); pg.addColorStop(1, '#142E66');
    ctx.fillStyle = pg;
    rrect(px + pw * (1 - wipe), py, pw * wipe, ph, 26); ctx.fill();
    ctx.restore();
    if (wipe > 0.2) {
      ctx.fillStyle = C.acc;
      rrect(px + pw - 22, py + 26, 8, ph - 52, 4); ctx.fill();
    }
    const lay = layoutHeadline(h.text, L.head.maxW);
    drawWords(lay, L.head.cx - 6, L.head.cy, Math.round(lay.size * 1.4), '#FFFFFF', a, h.t, tOut);
    ctx.restore();
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
    ctx.fillStyle = C.navy; ctx.font = font(L.hdrText[0]);
    ctx.fillText(TL.title, tx, titleY);
    ctx.fillStyle = C.gray; ctx.font = font(L.hdrText[1]);
    ctx.fillText(TL.date, tx, dateY);
    // story counter on the left
    let ch = 0;
    TL.chapters.forEach((c, i) => { if (a >= c) ch = i + 1; });
    if (a >= TL.headlines[TL.headlines.length - 1].t) ch = TL.chapters.length;
    const n = TL.chapters.length;
    ctx.direction = 'ltr'; ctx.textAlign = 'left';
    ctx.font = font(34); ctx.fillStyle = C.navy;
    const num = String(ch).padStart(2, '0');
    ctx.fillText(num, L.margin, titleY);
    const nw = ctx.measureText(num).width;
    ctx.font = font(24); ctx.fillStyle = C.gray;
    ctx.fillText(` / ${String(n).padStart(2, '0')}`, L.margin + nw, titleY + 3);
    for (let i = 0; i < n; i++) {
      const bx = L.margin + i * 30, by = dateY - 3;
      // segments fill right-to-left in reading order
      const k = n - 1 - i;
      ctx.fillStyle = k < ch ? (k === ch - 1 ? C.acc : C.navy) : '#E1E6EE';
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
    if (t < INTRO + 0.5) drawIntro(t);
    if (bgA > 0) {
      ctx.save(); ctx.globalAlpha = bgA; drawBackground(); ctx.restore();
    }
    if (t >= 5.6) {
      const out = eio(prog(t, OUTRO, OUTRO + 0.7));
      const inA = k => eout(prog(t, 6.45 + k * 0.12, 7.15 + k * 0.12)) * (1 - out);
      if (t >= OUTRO) { ctx.save(); ctx.translate(0, out * 40); }
      drawCarousel(Math.max(a, CUT), inA(0), 0);
      drawProgress(Math.max(a, CUT), inA(2));
      drawHeadline(a, inA(3));
      drawMapCard(Math.max(a, CUT), inA(4));
      if (t >= OUTRO) ctx.restore();
      const hdr = eout(prog(t, 6.8, 7.4)) * (1 - eio(prog(t, OUTRO, OUTRO + 0.4)));
      drawHeader(a, hdr);
      if (t >= 6.85 && t < OUTRO + 0.15) {
        const lb = logoBox();
        ctx.drawImage(LOGO, lb.x, lb.y, lb.w, lb.h);
      }
      drawOutro(t);
    }
    if (t < 6.85) drawIntroLogo(t);
  }

  async function init() {
    await document.fonts.load(font(48));
    await document.fonts.ready;
    const files = [...new Set(TL.cards.map(c => c.img))];
    await Promise.all(files.map(async f => { IMG[f] = await loadImage(window.EDITION_DIR + '/img/' + f); }));
    const logo = await loadImage('../assets/logo-mark.png');
    LOGO = tint(logo, C.navy);
    LOGO_ACC = tint(logo, C.acc);
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
