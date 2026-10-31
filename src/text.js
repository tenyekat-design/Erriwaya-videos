// Erriwaya text video (no narration), 1080x1920, after the model video approved on 31 Oct 2026.
// Content: editions/<date>/text.js (window.TEXTVIDEO); rendered by tools/render-text.js.
// Screen kinds (words in {braces} are drawn in green):
//   hook     the opening: full-frame photo/clip, navy boxes, words appear one by one
//   title    full-frame, a green country pill and a white topic pill over a big centred headline
//   lower    (default) 16:9 band on a blurred copy; navy label line then white lines against a green bar
//   stat     blurred full-frame, a big two-line figure and a navy caption box
//   quote    band + white card: green label, quote mark, text, rule and the source
//   question blurred full-frame, a big centred closing line
// then the navy outro (logo, تابعوا الرواية, handles, www.erriwaya.com, optional sources line).
// Motion: punch-in and a light flash on each cut, boxes slide in with a slight overshoot, words rise as they
// fade in, green figures count up, a progress line along the bottom; tools/render-text.js adds the whooshes.
(async () => {
  const TV = window.TEXTVIDEO;
  // ?format=feed: the 1080x1350 version for the Facebook/Instagram feed (default: story, 1080x1920)
  const FEED = window.FORMAT === 'feed';
  const W = 1080, H = FEED ? 1350 : 1920, FPS = 30;
  const C = { navy: '#0B1F4B', navyA: 'rgba(11,31,75,0.92)', acc: '#10B981', red: '#E5484D', topic: '#9D174D', gray: '#5B6577' };
  const FONT = 'AlQuds';
  const L = FEED ? {
    logo: { x: 44, y: 48, h: 124 },
    tag: { r: 1026, y: 66, h: 90, size: 30 },
    band: { y: 226, h: 607 },
    rule: { y: 831, h: 6 },
    lower: { r: 1003, y: 776, h: 88, step: 103, size: 48, pad: 24 },
    bar: { x: 1014, w: 10 },
    hook: { r: 992, y: 900, h: 106, step: 118, size: 62, pad: 26 },
    title: { pills: 395, head: 610, step: 145, size: 92 },
    stat: { y: 520, step: 145, size: 86 }, question: { y: 570, step: 150, size: 90 },
    quote: { y: 600, head: 180, size: 42, lh: 72 },
    outro: { logo: 400, logoH: 380, follow: 735, rows: 830, site: 1080, sources: 1270 },
  } : {
    logo: { x: 58, y: 72, h: 152 },
    tag: { r: 1014, y: 103, h: 102, size: 30 },
    band: { y: 497, h: 607 },
    rule: { y: 1102, h: 6 },
    lower: { r: 1003, y: 1043, h: 91, step: 108, size: 50, pad: 24 },
    bar: { x: 1014, w: 10 },
    hook: { r: 992, y: 1120, h: 112, step: 124, size: 66, pad: 26 },
    title: { pills: 660, head: 900, step: 160, size: 100 },
    stat: { y: 740, step: 160, size: 92 }, question: { y: 815, step: 160, size: 96 },
    quote: { y: 876, head: 205, size: 46, lh: 81 },
    outro: { logo: 662, logoH: 470, follow: 1066, rows: 1180, site: 1440, sources: 1760 },
  };

  const cv = document.getElementById('c');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eout = p => 1 - Math.pow(1 - p, 3);
  const eback = p => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
  const eio = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const font = s => `${s}px ${FONT}`;
  const plain = s => s.replace(/[{}]/g, '');

  // ---------- plan ----------
  const WORD = 0.085, GAP = 0.1, OUT = 0.25;
  const screens = [];
  let t = 0;
  for (const s of TV.screens) {
    const kind = s.kind || 'lower';
    const text = [s.label, ...(s.lines || []), s.caption, s.text, s.source].filter(Boolean).map(plain).join(' ');
    const auto = kind === 'quote' ? 2.0 + text.length / 18 : 1.2 + text.length / 18;
    const dur = s.dur || clamp(auto, 3.0, 7.0);
    screens.push({ ...s, kind, t0: t, t1: t + dur });
    t += dur + GAP;
  }
  const OUTRO = t, OUTRO_DUR = TV.outro || 4.2;
  const DURATION = OUTRO + OUTRO_DUR;
  // a run = consecutive screens on one photo or clip; the tag carries over unless a screen sets one ('' hides it)
  const runs = [];
  screens.forEach((s, i) => {
    if (s.media || !runs.length) runs.push({ ...(s.media || {}), start: s.t0 });
    s.run = runs.length - 1;
    if (s.tag === undefined) s.tag = i ? screens[i - 1].tag : '';
  });
  runs.forEach((r, i) => { r.end = i + 1 < runs.length ? runs[i + 1].start : DURATION; r.dur = r.end - r.start; });
  window.PLAN = { duration: DURATION, outro: OUTRO, screens: screens.map(s => ({ kind: s.kind, t0: s.t0 })), runs: runs.map(r => ({ clip: r.clip, from: r.from || 0, start: r.start, dur: r.dur + 0.5 })) };

  // ---------- assets ----------
  const loadImage = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('cannot load ' + src)); im.src = src; });
  await document.fonts.load(font(60));
  const logoSrc = await loadImage('../assets/logo-mark.png');
  const LOGO = document.createElement('canvas');
  LOGO.width = logoSrc.width; LOGO.height = logoSrc.height;
  { const g = LOGO.getContext('2d'); g.drawImage(logoSrc, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, LOGO.width, LOGO.height); }
  for (const r of runs) if (r.img) r.image = await loadImage(window.EDITION_DIR + '/img/' + r.img);
  const cache = new Map();
  function clipFrame(ri, tt) {
    const r = runs[ri];
    const n = clamp(Math.floor((tt - r.start) * FPS), 0, Math.round((r.dur + 0.4) * FPS)) + 1;
    const key = ri + ':' + n;
    if (!cache.has(key)) {
      if (cache.size > 24) cache.delete(cache.keys().next().value);
      cache.set(key, loadImage(`${window.FRAMES_DIR}/run${ri}/${String(n).padStart(5, '0')}.jpg`).catch(() => null));
    }
    return cache.get(key);
  }
  // the source image of a run at time tt, with the slow push-in of photos
  async function source(ri, tt) {
    const r = runs[ri];
    if (r.clip) {
      if (!window.FRAMES_DIR) return null;
      const im = await clipFrame(ri, tt);
      return im && { im, f: r.f || [0.5, 0.5], zoom: lerp(1.0, 1.08, prog(tt, r.start, r.end)) };
    }
    const z = r.z || [1.0, 1.1];
    return { im: r.image, f: r.f || [0.5, 0.5], zoom: lerp(z[0], z[1], eio(prog(tt, r.start, r.end))) };
  }
  // draw src covering the box (x, y, w, h), centred on its focus point
  function cover(s, x, y, w, h, alpha = 1) {
    if (!s) return;
    const im = s.im, base = Math.min(im.width / w, im.height / h);
    const sw = w * base / s.zoom, sh = h * base / s.zoom;
    const sx = clamp(s.f[0] * im.width - sw / 2, 0, im.width - sw), sy = clamp(s.f[1] * im.height - sh / 2, 0, im.height - sh);
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.drawImage(im, sx, sy, sw, sh, x, y, w, h);
    ctx.restore();
  }
  const small = document.createElement('canvas');
  small.width = 180; small.height = Math.round(180 * H / W);
  const sg = small.getContext('2d');
  function blurred(s, alpha = 1) {
    if (!s) return;
    const im = s.im, base = Math.min(im.width / small.width, im.height / small.height);
    const sw = small.width * base, sh = small.height * base;
    sg.filter = 'blur(5px)';
    sg.drawImage(im, (im.width - sw) * s.f[0], (im.height - sh) * s.f[1], sw, sh, 0, 0, small.width, small.height);
    sg.filter = 'none';
    ctx.save(); ctx.globalAlpha *= alpha; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, -24, -24, W + 48, H + 48);
    ctx.restore();
  }

  // ---------- text ----------
  // words of a line with their colour; {word} is green
  function words(line) {
    const out = [];
    let green = false;
    for (const tok of line.split(/\s+/)) {
      if (tok.startsWith('{')) green = true;
      out.push({ w: plain(tok), green });
      if (tok.endsWith('}')) green = false;
    }
    return out;
  }
  // a line drawn right to left, word by word fading in from k0 (time of its first word)
  function drawWords(line, xr, y, size, color, tt, k0, alpha = 1, align = 'right', count = false) {
    const ws = words(line);
    ctx.font = font(size); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const sp = ctx.measureText(' ').width;
    const widths = ws.map(w => ctx.measureText(w.w).width);
    const total = widths.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
    let x = align === 'center' ? xr + total / 2 : xr;
    ws.forEach((w, i) => {
      const p = eout(prog(tt, k0 + i * WORD, k0 + i * WORD + 0.3));
      ctx.globalAlpha = alpha * (0.12 + 0.88 * p);
      ctx.fillStyle = w.green ? C.acc : color;
      let txt = w.w;
      if (count && w.green && /^\d+$/.test(txt)) txt = String(Math.round(+txt * eout(prog(tt, k0, k0 + 0.9))));
      ctx.fillText(txt, x, y + size * 0.06 + (1 - p) * size * 0.25);
      x -= widths[i] + sp;
    });
    ctx.globalAlpha = 1;
    return total;
  }
  const lineW = (line, size) => { ctx.font = font(size); return ctx.measureText(plain(line)).width; };
  const vis = (s, tt) => (1 - eio(prog(tt, s.t1 - OUT, s.t1)));

  // boxes stacked right-aligned, each wiping in from the right before its words appear
  function drawBoxes(s, tt, lines, B, styles) {
    let k = s.t0 + 0.15, bottom = B.y;
    const out = vis(s, tt);
    lines.forEach((line, i) => {
      const st = styles(i);
      const w = lineW(line, B.size) + 2 * B.pad;
      const y = B.y + i * B.step;
      const pin = prog(tt, k - 0.12, k + 0.28), v = Math.min(1, eout(pin)) * out;
      if (v > 0) {
        const dx = (1 - eback(pin)) * 70 * out + (1 - out) * 40;
        ctx.save();
        ctx.translate(dx, 0);
        ctx.beginPath(); ctx.rect(B.r - w * v, y, w * v, B.h); ctx.clip();
        ctx.fillStyle = st.bg; ctx.fillRect(B.r - w, y, w, B.h);
        if (st.bg !== '#fff') sweep(B.r - w, y, w, B.h, tt, k + 0.3);
        drawWords(line, B.r - B.pad, y + B.h / 2, B.size, st.fg, tt, k);
        ctx.restore();
        bottom = Math.max(bottom, y + B.h * Math.min(1, v * 1.3));
      }
      k += words(line).length * WORD + 0.12;
    });
    return bottom;
  }

  // a soft diagonal light crossing a box once, starting at time t0
  function sweep(x, y, w, h, tt, t0) {
    const p = prog(tt, t0, t0 + 0.7);
    if (p <= 0 || p >= 1) return;
    const cx = x + w + 120 - (w + 240) * eio(p);
    const g = ctx.createLinearGradient(cx - 80, y, cx + 80, y + h);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.28)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  }

  function drawTag(s, tt) {
    const text = s.tag;
    if (!text) return;
    let j = screens.indexOf(s);
    while (j > 0 && screens[j - 1].tag === text) j--;
    let e = screens.indexOf(s);
    while (e + 1 < screens.length && screens[e + 1].tag === text) e++;
    const p = eout(prog(tt, screens[j].t0, screens[j].t0 + 0.3)) * (1 - eio(prog(tt, screens[e].t1 - OUT, screens[e].t1)));
    if (p <= 0) return;
    const T = L.tag;
    ctx.font = font(T.size); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 98;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = C.navyA; ctx.fillRect(T.r - w, T.y, w, T.h);
    const pulse = (tt * 1.2) % 1;
    ctx.fillStyle = `rgba(229,72,77,${0.5 * (1 - pulse)})`; ctx.beginPath(); ctx.arc(T.r - 32, T.y + T.h / 2, 7 + 12 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(T.r - 32, T.y + T.h / 2, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(text, T.r - 54, T.y + T.h / 2 + 3);
    ctx.restore();
  }

  function shadeFull(a) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgba(10,14,24,${0.35 * a})`); g.addColorStop(0.45, `rgba(10,14,24,${0.15 * a})`); g.addColorStop(1, `rgba(10,14,24,${0.55 * a})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // background of a screen kind from the run's source
  function drawMedia(kind, s, alpha) {
    if (kind === 'hook' || kind === 'title') { cover(s, 0, 0, W, H, alpha); ctx.save(); ctx.globalAlpha = alpha; shadeFull(kind === 'title' ? 1.4 : 1); ctx.restore(); return; }
    blurred(s, alpha);
    ctx.save(); ctx.globalAlpha = alpha;
    if (kind === 'stat' || kind === 'question') { ctx.fillStyle = 'rgba(24,34,60,0.62)'; ctx.fillRect(0, 0, W, H); ctx.restore(); return; }
    ctx.fillStyle = 'rgba(16,22,36,0.5)'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, L.band.y + L.band.h, 0, H);
    g.addColorStop(0, 'rgba(16,22,36,0.25)'); g.addColorStop(1, 'rgba(16,22,36,0.75)');
    ctx.fillStyle = g; ctx.fillRect(0, L.band.y + L.band.h, W, H);
    ctx.restore();
    cover(s, 0, L.band.y, W, L.band.h, alpha);
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = C.acc; ctx.fillRect(0, L.rule.y, W, L.rule.h); ctx.restore();
  }

  function drawScreen(s, tt) {
    const k = s.kind;
    if (k === 'hook') {
      drawBoxes(s, tt, s.lines, L.hook, () => ({ bg: C.navyA, fg: '#fff' }));
    } else if (k === 'lower') {
      const lines = [s.label, ...s.lines].filter(Boolean);
      const bottom = drawBoxes(s, tt, lines, L.lower, i => (i === 0 && s.label ? { bg: C.navy, fg: '#fff' } : { bg: '#fff', fg: C.navy }));
      if (bottom > L.lower.y) { ctx.fillStyle = C.acc; ctx.fillRect(L.bar.x, L.lower.y, L.bar.w, bottom - L.lower.y); }
    } else if (k === 'title') {
      const out = vis(s, tt);
      const pp = eout(prog(tt, s.t0 + 0.1, s.t0 + 0.45)) * out;
      // pills: green country (with a dot) and white topic, centred
      ctx.font = font(40); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      const cw = ctx.measureText(s.country).width + 96, tw = s.topic ? ctx.measureText(s.topic).width + 64 : 0;
      const x0 = W / 2 + (cw + tw) / 2, y = L.title.pills, h = 118;
      const pop = eback(prog(tt, s.t0 + 0.1, s.t0 + 0.5));
      ctx.save(); ctx.globalAlpha = pp; ctx.translate(W / 2, y + h / 2); ctx.scale(lerp(0.6, 1, pop), lerp(0.6, 1, pop)); ctx.translate(-W / 2, -y - h / 2);
      ctx.fillStyle = '#12A06B'; ctx.fillRect(x0 - cw, y, cw, h);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x0 - 34, y + h / 2, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(s.country, x0 - 54, y + h / 2 + 3);
      if (s.topic) { ctx.fillStyle = '#fff'; ctx.fillRect(x0 - cw - tw, y, tw, h); ctx.fillStyle = C.topic; ctx.fillText(s.topic, x0 - cw - 32, y + h / 2 + 3); }
      ctx.restore();
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 24;
      let k0 = s.t0 + 0.4;
      s.lines.forEach((line, i) => {
        const sc = lerp(1.25, 1, eout(prog(tt, k0 - 0.05, k0 + 0.45)));
        ctx.save(); ctx.translate(W / 2, L.title.head + i * L.title.step); ctx.scale(sc, sc);
        drawWords(line, 0, 0, L.title.size, '#fff', tt, k0, out, 'center');
        ctx.restore();
        k0 += words(line).length * WORD + 0.1;
      });
      ctx.restore();
    } else if (k === 'stat' || k === 'question') {
      const out = vis(s, tt);
      const Q = L[k], size = Q.size, y0 = Q.y;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 20;
      let k0 = s.t0 + 0.15;
      s.lines.forEach((line, i) => {
        const sc = lerp(1.2, 1, eout(prog(tt, k0 - 0.05, k0 + 0.45)));
        ctx.save(); ctx.translate(W / 2, y0 + i * Q.step); ctx.scale(sc, sc);
        drawWords(line, 0, 0, size, '#fff', tt, k0, out, 'center', k === 'stat');
        ctx.restore();
        k0 += words(line).length * WORD + 0.12;
      });
      ctx.restore();
      if (s.caption) {
        const cp = eout(prog(tt, k0, k0 + 0.3)) * out;
        const w = lineW(s.caption, 38) + 72, y = y0 + (s.lines.length - 1) * Q.step + 120;
        ctx.save(); ctx.globalAlpha = cp;
        ctx.fillStyle = C.navyA; ctx.fillRect(W / 2 - w * cp / 2, y, w * cp, 124);
        ctx.fillStyle = C.acc; ctx.fillRect(W / 2 - w * cp / 2, y + 118, w * cp, 6);
        ctx.restore();
        if (cp > 0) drawWords(s.caption, W / 2, y + 62, 38, '#fff', tt, k0 + 0.1, cp, 'center');
      }
    } else if (k === 'quote') {
      const out = vis(s, tt);
      const cp = eout(prog(tt, s.t0 + 0.05, s.t0 + 0.4)) * out;
      const X = 69, Y = L.quote.y, R = 1009, P = 54;
      // body text wrapped to the card
      const size = L.quote.size, lh = L.quote.lh, maxW = R - X - 2 * P;
      ctx.font = font(size);
      const rows = [];
      let cur = '';
      for (const w of s.text.split(/\s+/)) {
        const next = cur ? cur + ' ' + w : w;
        if (cur && ctx.measureText(plain(next)).width > maxW) { rows.push(cur); cur = w; } else cur = next;
      }
      if (cur) rows.push(cur);
      const bodyY = Y + L.quote.head, ruleY = bodyY + rows.length * lh + 10, Hc = ruleY - Y + 140;
      ctx.save(); ctx.globalAlpha = cp; ctx.translate(0, (1 - cp) * 30);
      ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#fff'; ctx.fillRect(X, Y, R - X, Hc);
      ctx.shadowColor = 'transparent';
      ctx.font = font(38); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      const lw = ctx.measureText(s.label).width + 56;
      ctx.fillStyle = '#12A06B'; ctx.fillRect(R - P - lw, Y + 40, lw, 108);
      ctx.fillStyle = '#fff'; ctx.fillText(s.label, R - P - 28, Y + 94 + 2);
      ctx.font = `150px Georgia, serif`; ctx.textAlign = 'left'; ctx.fillStyle = C.acc;
      ctx.fillText('”', X + P - 6, Y + 120);
      ctx.fillStyle = '#E4E8F0'; ctx.fillRect(X + P, ruleY, R - X - 2 * P, 3);
      ctx.restore();
      let k0 = s.t0 + 0.45;
      rows.forEach((row, i) => {
        ctx.save(); ctx.translate(0, (1 - cp) * 30);
        drawWords(row, R - P, bodyY + i * lh, size, C.navy, tt, k0, cp);
        ctx.restore();
        k0 += words(row).length * WORD * 0.7;
      });
      if (s.source) {
        ctx.save(); ctx.globalAlpha = cp; ctx.translate(0, (1 - cp) * 30);
        ctx.fillStyle = C.navy; ctx.fillRect(R - P - 7, ruleY + 46, 7, 40);
        ctx.font = font(30); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillStyle = C.gray; ctx.fillText(s.source, R - P - 24, ruleY + 68);
        ctx.restore();
      }
    }
  }

  const SOCIAL = [
    { icons: ['facebook', 'tiktok', 'youtube'], handle: 'ERRIWAYA' },
    { icons: ['instagram'], handle: 'ERRIWAYA.MR' },
  ];
  function drawOutro(tt) {
    const o = tt - OUTRO;
    if (o < 0) return;
    const a = eout(prog(o, 0, 0.45));
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0B1F4B'); g.addColorStop(1, '#123A8C');
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    const lp = eout(prog(o, 0.15, 0.7));
    const O = L.outro;
    const lh = O.logoH * lerp(0.7, 1, eback(prog(o, 0.15, 0.75))), lw = lh * LOGO.width / LOGO.height;
    const glow = ctx.createRadialGradient(W / 2, O.logo, 40, W / 2, O.logo, 520);
    glow.addColorStop(0, `rgba(16,185,129,${0.22 * lp})`); glow.addColorStop(1, 'rgba(16,185,129,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, O.logo - 520, W, 1040);
    ctx.save(); ctx.globalAlpha = lp;
    ctx.drawImage(LOGO, W / 2 - lw / 2, O.logo - lh / 2, lw, lh);
    const fp = eout(prog(o, 0.7, 1.2));
    ctx.globalAlpha = fp;
    ctx.font = font(54); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.fillText('تابعوا الرواية', W / 2, O.follow);
    const full = ctx.measureText('تابعوا الرواية').width, part = ctx.measureText('الرواية').width;
    ctx.fillStyle = C.acc; ctx.fillRect(W / 2 - full / 2, O.follow + 44, part * fp, 6);
    ctx.restore();
    const S = 76, gap = 16;
    SOCIAL.forEach((row, ri) => {
      const rp = eout(prog(o, 1.0 + ri * 0.2, 1.5 + ri * 0.2));
      if (rp <= 0) return;
      const y = O.rows + ri * 106;
      ctx.font = font(58); ctx.direction = 'ltr'; ctx.letterSpacing = '6px';
      const tw = ctx.measureText(row.handle).width;
      const iw = row.icons.length * S + (row.icons.length - 1) * gap;
      const x0 = W / 2 - (iw + 30 + tw) / 2;
      ctx.save(); ctx.globalAlpha = rp;
      row.icons.forEach((name, k) => {
        const x = x0 + k * (S + gap);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x, y, S, S, S * 0.26); ctx.fill();
        ctx.save(); ctx.translate(x + S * 0.2, y + S * 0.2); ctx.scale(S * 0.6 / 24, S * 0.6 / 24);
        ctx.fillStyle = C.navy; ctx.fill(new Path2D(window.ICONS[name])); ctx.restore();
      });
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(row.handle, x0 + iw + 30, y + S / 2 + 4);
      ctx.restore();
      ctx.letterSpacing = '0px';
    });
    // website
    const wp = eout(prog(o, 1.5, 2.0));
    if (wp > 0) {
      const site = 'www.erriwaya.com';
      ctx.save(); ctx.globalAlpha = wp; ctx.translate(0, (1 - wp) * 20);
      ctx.font = font(48); ctx.direction = 'ltr'; ctx.letterSpacing = '3px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const sw = ctx.measureText(site).width + 90, y = O.site;
      ctx.fillStyle = C.acc; ctx.beginPath(); ctx.roundRect(W / 2 - sw / 2, y - 48, sw, 96, 48); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(site, W / 2, y + 3);
      ctx.letterSpacing = '0px';
      ctx.restore();
    }
    if (TV.sources) {
      ctx.save(); ctx.globalAlpha = eout(prog(o, 1.4, 1.9)) * 0.75;
      ctx.font = font(30); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff'; ctx.fillText('المصادر: ' + TV.sources, W / 2, O.sources);
      ctx.restore();
    }
  }

  async function renderFrame(tt) {
    ctx.fillStyle = '#10141c'; ctx.fillRect(0, 0, W, H);
    let si = screens.length - 1;
    while (si > 0 && tt < screens[si].t0) si--;
    const s = screens[si];
    // short cross-fade from the screen before when the layout or the media changes
    const prev = si > 0 ? screens[si - 1] : null;
    const xf = prev && (prev.kind !== s.kind || prev.run !== s.run) ? eio(prog(tt, s.t0, s.t0 + 0.3)) : 1;
    const cut = !!prev && (prev.kind !== s.kind || prev.run !== s.run);
    if (xf < 1) { const ps = await source(prev.run, tt); if (ps) ps.zoom *= 1 + 0.06 * xf; drawMedia(prev.kind, ps, 1); }
    const cs = await source(s.run, tt);
    if (cs && cut) cs.zoom *= 1 + 0.1 * (1 - eout(prog(tt, s.t0, s.t0 + 0.6)));
    drawMedia(s.kind, cs, xf);
    if (cut) { const fl = 1 - prog(tt, s.t0, s.t0 + 0.2); if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${0.22 * fl})`; ctx.fillRect(0, 0, W, H); } }
    const lw = L.logo.h * LOGO.width / LOGO.height;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 16;
    ctx.drawImage(LOGO, L.logo.x, L.logo.y, lw, L.logo.h);
    ctx.restore();
    if (tt < OUTRO) {
      drawTag(s, tt); drawScreen(s, tt);
      // progress along the bottom edge
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(0, H - 8, W, 8);
      ctx.fillStyle = C.acc; ctx.fillRect(W - W * tt / OUTRO, H - 8, W * tt / OUTRO, 8);
    }
    drawOutro(tt);
  }

  window.DURATION = DURATION;
  window.SCREENS = screens.map(s => ({ kind: s.kind, t0: s.t0, t1: s.t1, text: [s.label, ...(s.lines || []), s.caption, s.text].filter(Boolean).map(plain).join(' ') }));
  window.renderFrame = renderFrame;
  window.renderCover = () => renderFrame((screens.find(s => s.kind === 'title') || screens[0]).t1 - 0.6);
  window.READY = true;
})().catch(e => { window.ERROR = String(e); throw e; });
