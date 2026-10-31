// Erriwaya text video (no narration): the story is told in short lines of text stacked in boxes under a
// 16:9 media band (photos with a slow push-in, or clips), on a blurred, darkened copy of the media.
// Layout from the reference frame: logo top-left, a navy tag with a red dot top-right, a green rule under
// the band, the lines right-aligned against a green bar (first line navy on white text, the rest white
// boxes with navy text). Content: editions/<date>/text.js (window.TEXTVIDEO). Rendered by tools/render-text.js.
(async () => {
  const TV = window.TEXTVIDEO;
  const W = 1080, H = 1350, FPS = 30;
  const C = { navy: '#0B1F4B', acc: '#10B981', red: '#E5484D', dark: 'rgba(14,18,28,0.66)' };
  const FONT = 'AlQuds';
  const L = {
    band: { y: 259, h: 608 },
    logo: { x: 44, y: 58, h: 128 },
    tag: { r: 1025, y: 79, h: 100, size: 40 },
    rule: { y: 866, h: 6 },
    lines: { r: 1003, y: 802, h: 97, gap: 11, size: 64, maxW: 940, pad: 30 },
    bar: { x: 1016, w: 9 },
  };

  const cv = document.getElementById('c');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eout = p => 1 - Math.pow(1 - p, 3);
  const eio = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const font = s => `${s}px ${FONT}`;

  // ---------- plan: screen times and media runs ----------
  const IN = 0.35, OUT = 0.3, STAGGER = 0.14, GAP = 0.12;
  const screens = [];
  let t = 0.25;
  for (const s of TV.screens) {
    const chars = s.lines.join(' ').length;
    const dur = s.dur || clamp(1.1 + chars / 15, 3.0, 6.0);  // reading pace
    screens.push({ ...s, t0: t, t1: t + dur });
    t += dur + GAP;
  }
  const OUTRO = t + 0.1, OUTRO_DUR = TV.outro || 4.0;
  const DURATION = OUTRO + OUTRO_DUR;
  // a run = consecutive screens sharing one photo or clip; it starts with the screen that names it
  const runs = [];
  // the top-right tag carries over from the screen before unless a screen sets its own ('' hides it)
  screens.forEach((s, i) => {
    if (s.media || !runs.length) runs.push({ ...(s.media || {}), start: i === 0 ? 0 : s.t0 - GAP / 2 });
    s.run = runs.length - 1;
    if (s.tag === undefined) s.tag = i ? screens[i - 1].tag : '';
  });
  runs.forEach((r, i) => { r.end = i + 1 < runs.length ? runs[i + 1].start : DURATION; r.dur = r.end - r.start; });
  window.PLAN = { duration: DURATION, outro: OUTRO, runs: runs.map(r => ({ clip: r.clip, from: r.from || 0, fy: r.fy ?? 0.5, start: r.start, dur: r.dur + 0.5 })) };

  // ---------- assets ----------
  const loadImage = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('cannot load ' + src)); im.src = src; });
  await document.fonts.load(font(60));
  const logoSrc = await loadImage('../assets/logo-mark.png');
  const LOGO = document.createElement('canvas');
  LOGO.width = logoSrc.width; LOGO.height = logoSrc.height;
  { const g = LOGO.getContext('2d'); g.drawImage(logoSrc, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, LOGO.width, LOGO.height); }
  for (const r of runs) if (r.img) r.image = await loadImage(window.EDITION_DIR + '/img/' + r.img);
  const cache = new Map();
  async function clipFrame(ri, tt) {
    const r = runs[ri];
    const n = clamp(Math.floor((tt - r.start) * FPS), 0, Math.round((r.dur + 0.4) * FPS)) + 1;
    const key = ri + ':' + n;
    if (!cache.has(key)) {
      if (cache.size > 24) cache.delete(cache.keys().next().value);
      cache.set(key, loadImage(`${window.FRAMES_DIR}/run${ri}/${String(n).padStart(5, '0')}.jpg`).catch(() => null));
    }
    return cache.get(key);
  }
  async function mediaAt(ri, tt) {
    const r = runs[ri];
    if (r.clip) {
      if (!window.FRAMES_DIR) return null;
      const im = await clipFrame(ri, tt);
      return im && { im, sx: 0, sy: 0, sw: im.width, sh: im.height };
    }
    // photo: cover the 16:9 band, slow push-in toward the focus point
    const im = r.image, f = r.f || [0.5, 0.5], z = r.z || [1.0, 1.1];
    const p = eio(prog(tt, r.start, r.end));
    const zoom = lerp(z[0], z[1], p);
    const base = Math.min(im.width / W, im.height / L.band.h);
    const sw = W * base / zoom, sh = L.band.h * base / zoom;
    return { im, sx: clamp(f[0] * im.width - sw / 2, 0, im.width - sw), sy: clamp(f[1] * im.height - sh / 2, 0, im.height - sh), sw, sh };
  }

  // ---------- drawing ----------
  const small = document.createElement('canvas');
  small.width = 216; small.height = 270;
  const sg = small.getContext('2d');
  function drawBackground(m, alpha) {
    if (!m) return;
    // blurred copy filling the frame (drawn small, blurred, scaled up)
    const k = Math.max(small.width / m.sw, small.height / m.sh);
    sg.filter = 'blur(6px)';
    sg.drawImage(m.im, m.sx, m.sy, m.sw, m.sh, (small.width - m.sw * k) / 2, (small.height - m.sh * k) / 2, m.sw * k, m.sh * k);
    sg.filter = 'none';
    ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, -20, -20, W + 40, H + 40);
    ctx.restore();
  }
  function drawBand(m, alpha) {
    if (!m) return;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.drawImage(m.im, m.sx, m.sy, m.sw, m.sh, 0, L.band.y, W, L.band.h);
    ctx.restore();
  }

  function drawTag(tt) {
    const s = screens.find(x => tt < x.t1 + GAP) || screens[screens.length - 1];
    const text = s.tag;
    if (!text || tt > OUTRO + 0.3) return;
    let j = screens.indexOf(s);
    while (j > 0 && screens[j - 1].tag === text) j--;
    const first = screens[j];  // the tag wipes in with the first screen that carries it
    const p = eout(prog(tt, first.t0 - 0.05, first.t0 + 0.3)) * (1 - prog(tt, OUTRO - 0.1, OUTRO + 0.3));
    if (p <= 0) return;
    const T = L.tag;
    ctx.font = font(T.size); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(text).width;
    const w = tw + 34 + 34 + 30;
    ctx.save();
    ctx.beginPath(); ctx.rect(T.r - w * p, T.y, w * p, T.h); ctx.clip();
    ctx.fillStyle = 'rgba(11,31,75,0.92)'; ctx.fillRect(T.r - w, T.y, w, T.h);
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(T.r - 40, T.y + T.h / 2, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(text, T.r - 66, T.y + T.h / 2 + 3);
    ctx.restore();
  }

  function layoutLines(lines) {
    const P = L.lines;
    let size = P.size;
    ctx.font = font(size);
    const widest = Math.max(...lines.map(l => ctx.measureText(l).width));
    if (widest + 2 * P.pad > P.maxW) size = Math.floor(size * (P.maxW - 2 * P.pad) / widest);
    ctx.font = font(size);
    return { size, items: lines.map(l => ({ text: l, w: ctx.measureText(l).width + 2 * P.pad })) };
  }
  function drawScreen(s, tt) {
    if (tt < s.t0 || tt > s.t1) return 0;
    const P = L.lines, lay = layoutLines(s.lines);
    const n = lay.items.length;
    let barBottom = P.y;
    lay.items.forEach((it, k) => {
      const pin = eout(prog(tt, s.t0 + k * STAGGER, s.t0 + k * STAGGER + IN));
      const pout = eio(prog(tt, s.t1 - OUT - (n - 1 - k) * 0.05, s.t1 - (n - 1 - k) * 0.05));
      const vis = pin * (1 - pout);
      if (vis <= 0) return;
      const y = P.y + k * (P.h + P.gap);
      const lead = k === 0 && !s.plain;
      ctx.save();
      ctx.beginPath(); ctx.rect(P.r - it.w * vis, y, it.w * vis, P.h); ctx.clip();
      ctx.fillStyle = lead ? C.navy : '#fff';
      ctx.fillRect(P.r - it.w, y, it.w, P.h);
      ctx.font = font(lay.size); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillStyle = lead ? '#fff' : C.navy;
      ctx.fillText(it.text, P.r - P.pad + (1 - pin) * 30, y + P.h / 2 + lay.size * 0.06);
      ctx.restore();
      barBottom = Math.max(barBottom, y + P.h * Math.min(1, vis * 1.4));
    });
    return barBottom;
  }

  const SOCIAL = [
    { icons: ['facebook', 'tiktok', 'youtube'], handle: 'ERRIWAYA' },
    { icons: ['instagram'], handle: 'ERRIWAYA.MR' },
  ];
  function drawOutro(tt) {
    const o = tt - OUTRO;
    if (o < 0) return;
    ctx.save();
    ctx.globalAlpha = eout(prog(o, 0, 0.6));
    ctx.fillStyle = 'rgba(11,18,34,0.9)'; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    const lp = eout(prog(o, 0.2, 0.9));
    const lh = 300, lw = lh * LOGO.width / LOGO.height;
    ctx.save(); ctx.globalAlpha = lp;
    ctx.drawImage(LOGO, W / 2 - lw / 2, 360 + (1 - lp) * 20, lw, lh);
    ctx.font = font(34); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = eout(prog(o, 0.8, 1.3));
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('تابعونا على', W / 2, 780);
    ctx.restore();
    const S = 70, gap = 16;
    SOCIAL.forEach((row, ri) => {
      const rp = eout(prog(o, 1.0 + ri * 0.25, 1.6 + ri * 0.25));
      if (rp <= 0) return;
      const y = 840 + ri * 110;
      ctx.font = font(46); ctx.direction = 'ltr';
      const tw = ctx.measureText(row.handle).width;
      const iw = row.icons.length * S + (row.icons.length - 1) * gap;
      const x0 = W / 2 - (iw + 28 + tw) / 2;
      ctx.save(); ctx.globalAlpha = rp;
      row.icons.forEach((name, k) => {
        const x = x0 + k * (S + gap);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x, y, S, S, S * 0.3); ctx.fill();
        ctx.save(); ctx.translate(x + S * 0.22, y + S * 0.22); ctx.scale(S * 0.56 / 24, S * 0.56 / 24);
        ctx.fillStyle = C.navy; ctx.fill(new Path2D(window.ICONS[name])); ctx.restore();
      });
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(row.handle, x0 + iw + 28, y + S / 2 + 3);
      ctx.restore();
    });
  }

  async function renderFrame(tt) {
    ctx.fillStyle = '#10141c'; ctx.fillRect(0, 0, W, H);
    let ri = runs.length - 1;
    while (ri > 0 && tt < runs[ri].start) ri--;
    const m = await mediaAt(ri, tt);
    // short cross-fade from the previous photo or clip
    const xf = ri > 0 ? eio(prog(tt, runs[ri].start, runs[ri].start + 0.4)) : 1;
    const prev = xf < 1 ? await mediaAt(ri - 1, tt) : null;
    if (prev) drawBackground(prev, 1);
    drawBackground(m, xf);
    ctx.fillStyle = C.dark; ctx.fillRect(0, 0, W, H);
    // soft dark top and bottom so the logo and tag read on any photo
    const g = ctx.createLinearGradient(0, 0, 0, L.band.y);
    g.addColorStop(0, 'rgba(10,14,22,0.55)'); g.addColorStop(1, 'rgba(10,14,22,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, L.band.y);
    if (prev) drawBand(prev, 1);
    drawBand(m, xf);
    // rule under the band
    ctx.fillStyle = C.acc; ctx.fillRect(0, L.rule.y, W, L.rule.h);
    // logo
    const lw = L.logo.h * LOGO.width / LOGO.height;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 16;
    ctx.drawImage(LOGO, L.logo.x, L.logo.y, lw, L.logo.h);
    ctx.restore();
    drawTag(tt);
    // text and the green bar beside it
    let bottom = 0;
    for (const s of screens) bottom = Math.max(bottom, drawScreen(s, tt));
    if (bottom > L.lines.y) { ctx.fillStyle = C.acc; ctx.fillRect(L.bar.x, L.lines.y, L.bar.w, bottom - L.lines.y); }
    drawOutro(tt);
  }

  window.DURATION = DURATION;
  window.SCREENS = screens.map(s => ({ t0: s.t0, t1: s.t1, lines: s.lines, tag: s.tag }));
  window.renderFrame = renderFrame;
  window.renderCover = () => renderFrame(screens[0].t0 + 1.4);
  window.READY = true;
})().catch(e => { window.ERROR = String(e); throw e; });
