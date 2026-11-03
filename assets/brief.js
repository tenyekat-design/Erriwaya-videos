// «الموجز التفاعلي»: the latest video brief as a scene the reader drives. The voice-over plays in the page; the photo,
// story tag, headline and spoken words follow it as in the video (broadcast look), and the pixel map moves to each
// story. A story is chosen from the list, the map (its country or its number) or the progress bar.
// Data: brief/brief.json, built by scripts/brief.js from an edition of the video template.
// The page re-renders #main often, so the player is one node kept here and put back into #briefSlot each time;
// the audio is not in the DOM, so it keeps playing through re-renders.
(() => {
  const NAVY = "#0B1F4B", GREEN = "#0A8F65", LIVE = "#34D399";
  const RAD = Math.PI / 180, mercY = lat => Math.log(Math.tan(Math.PI / 4 + lat * RAD / 2)) / RAD;
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const mmss = t => { t = Math.max(0, Math.floor(t)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };

  let B, root, audio, grid, el = {}, raf = 0, last = {}, cam, camGoal, hover = -1, scrolled = false;

  const css = `
.ib, .ib-stage { scroll-margin-top: 96px }
.ib .sec-h { flex-wrap: wrap }
.ib-box { display: grid; grid-template-columns: minmax(0, 1.75fr) minmax(0, 1fr); gap: 18px; align-items: start }
.ib-stage { position: relative; aspect-ratio: 16/9; border-radius: 8px 8px 0 0; overflow: hidden; background: ${NAVY}; isolation: isolate }
.ib-ph { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .7s ease; transform-origin: 50% 45% }
.ib-ph.on { opacity: 1 }
.ib-ph.kb { animation: ib-kb 9s linear both }
.ib.paused .ib-ph.kb { animation-play-state: paused }
@keyframes ib-kb { from { transform: scale(1) } to { transform: scale(1.06) } }
.ib-stage::after { content: ""; position: absolute; inset: 40% 0 0; background: linear-gradient(transparent, rgb(0 0 0 / .45)); pointer-events: none }
.ib-logo { position: absolute; top: 14px; inset-inline-start: 16px; height: 34px; width: auto; z-index: 2; filter: brightness(0) invert(1) drop-shadow(0 1px 4px rgb(0 0 0 / .5)) }
.ib-lt { position: absolute; inset-inline: 16px; bottom: 14px; z-index: 2; display: grid; justify-items: start }
.ib-tag { display: inline-flex; font: 17px/1 var(--f-display); clip-path: polygon(0 0, 100% 0, 100% 100%, 10px 100%); transition: opacity .3s }
.ib-tag b { background: ${GREEN}; color: #fff; padding: 8px 12px 6px; font-weight: 400 }
.ib-tag i { background: #fff; color: ${NAVY}; padding: 8px 12px 6px 20px; font-style: normal }
.ib-tag i:empty { display: none }
.ib-bar { width: 100%; background: #fff; color: ${NAVY}; display: flex; align-items: center; gap: 14px; padding: 10px 16px; min-height: 66px }
.ib-head { flex: 1; font: 22px/1.45 var(--f-display); transition: opacity .35s }
.ib-head.fade { opacity: 0 }
.ib-brand { flex-shrink: 0; display: grid; justify-items: end; gap: 2px; padding-inline-start: 14px; border-inline-start: 2px solid ${GREEN}; font-size: 12px; color: #4B5874; line-height: 1.3 }
.ib-brand b { font: 15px/1.2 var(--f-display); color: ${NAVY} }
.ib-cap { width: 100%; background: ${NAVY}; color: rgb(255 255 255 / .62); padding: 7px 16px; min-height: 40px; font-size: 16px; line-height: 1.6 }
.ib-cap .s { color: #fff } .ib-cap .on { color: ${LIVE} }
.ib-go { position: absolute; inset: 0 0 auto; height: 64%; z-index: 3; display: grid; place-content: center; justify-items: center; gap: 12px; border: 0; background: rgb(11 31 75 / .35); color: #fff; padding: 16px; text-align: center }
.ib-go span:first-child { width: 78px; height: 78px; border-radius: 50%; background: ${GREEN}; display: grid; place-items: center; box-shadow: 0 6px 24px rgb(0 0 0 / .35); transition: transform .2s }
.ib-go:hover span:first-child { transform: scale(1.06) }
.ib-go svg { width: 30px; height: 30px; margin-inline-start: -4px; fill: #fff }
.ib-go strong { font: 18px/1.4 var(--f-display); text-shadow: 0 1px 6px rgb(0 0 0 / .6) }
.ib-ctl { display: flex; align-items: center; gap: 6px; background: ${NAVY}; color: #fff; border-radius: 0 0 8px 8px; padding: 8px 10px 10px; border-top: 1px solid rgb(255 255 255 / .12) }
.ib-ctl button { width: 38px; height: 38px; border-radius: 50%; border: 0; background: none; color: inherit; display: grid; place-items: center; flex-shrink: 0 }
.ib-ctl button:hover { background: rgb(255 255 255 / .12) }
.ib-ctl button.pp { background: ${GREEN} }
.ib-ctl svg { width: 18px; height: 18px; fill: currentColor }
.ib-ctl time { font-size: 13px; font-variant-numeric: tabular-nums; opacity: .85; min-width: 76px; text-align: center; direction: ltr }
.ib-prog { flex: 1; display: flex; gap: 3px; height: 26px; align-items: center; cursor: pointer; touch-action: none }
.ib-prog > div { position: relative; height: 6px; border-radius: 3px; background: rgb(255 255 255 / .2); overflow: hidden }
.ib-prog > div i { position: absolute; inset-block: 0; inset-inline-start: 0; background: ${LIVE}; width: 0 }
.ib-prog:hover > div { height: 8px }
.ib-side { display: grid; gap: 12px }
.ib-map { position: relative; aspect-ratio: 4/3; border-radius: 8px; overflow: hidden; background: var(--surface); border: 1px solid var(--line) }
.ib-map canvas { width: 100%; height: 100%; display: block }
.ib-map .hint { position: absolute; inset-inline-start: 10px; bottom: 8px; font-size: 12px; color: var(--muted); pointer-events: none }
.ib-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; max-height: 330px; overflow-y: auto; scrollbar-width: thin }
.ib-list button { width: 100%; display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 2px 10px; align-items: center; text-align: start; border: 0; border-inline-start: 3px solid transparent; background: none; color: var(--ink); padding: 7px 8px; border-radius: 0 6px 6px 0 }
.ib-list button:hover { background: var(--chip) }
.ib-list button[aria-current="true"] { background: var(--chip); border-inline-start-color: ${GREEN} }
.ib-list .n { grid-row: span 2; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--chip); color: var(--link); font-size: 14px; font-weight: 700 }
.ib-list button[aria-current="true"] .n { background: ${GREEN}; color: #fff }
.ib-list .c { font: 17px/1.3 var(--f-display) } .ib-list .c small { font: 12px var(--f-body); color: var(--muted); margin-inline-start: 6px }
.ib-list .h { font-size: 13px; line-height: 1.5; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
@media (max-width: 900px) { .ib-box { grid-template-columns: minmax(0, 1fr) } .ib-list { max-height: none } }
@media (max-width: 640px) {
  .ib .sec-h h2 { font-size: 24px } .ib .sec-h span { flex-basis: 100% }
  .ib-stage { aspect-ratio: auto; display: grid; border-radius: 8px 8px 0 0 }
  .ib-stage .ib-ph { position: absolute; inset: 0 0 auto; height: auto; aspect-ratio: 4/3 }
  .ib-stage::before { content: ""; aspect-ratio: 4/3; grid-area: 1/1 }
  .ib-stage::after { inset: 0 0 auto; height: 0 }
  .ib-lt { position: relative; inset: auto; grid-area: 2/1; margin-top: -30px; padding-inline: 0 }
  .ib-tag { margin-inline-start: 12px; font-size: 15px }
  .ib-bar { min-height: 0; padding: 10px 12px; flex-wrap: wrap }
  .ib-head { font-size: 18px; flex-basis: 100% }
  .ib-brand { display: none }
  .ib-cap { font-size: 15px; padding: 6px 12px; min-height: 64px }
  .ib-go { grid-area: 1/1; position: relative; height: auto; aspect-ratio: 4/3 }
  .ib-logo { height: 26px; top: 10px }
  .ib-ctl time { min-width: 0; font-size: 12px }
}
@media (prefers-reduced-motion: reduce) { .ib-ph.kb { animation: none } .ib-ph, .ib-head { transition: none } }`;

  const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const I = {
    play: svg("M7 4.5v15l12.5-7.5z"), pause: svg("M6 4h4.5v16H6zM13.5 4H18v16h-4.5z"),
    next: svg("M19 5.5v13l-9-6.5zM5.5 5h3v14h-3z"), prev: svg("M5 5.5v13l9-6.5zM15.5 5h3v14h-3z"),   // RTL: next points left
  };

  async function init() {
    try {
      const r = await fetch("brief/brief.json", { cache: "no-cache" });
      if (!r.ok) return;
      B = await r.json();
    } catch { return; }
    grid = Uint8Array.from(atob(B.map.grid), c => c.charCodeAt(0));
    B.stories.forEach((s, i) => {
      s.i = i;
      const p = s.pins.find(x => x.main) || s.pins[0];
      s.at = p ? [p.lon, p.lat] : [s.cam.lon, s.cam.lat];
    });
    B.phrases = B.phrases.map(([t0, t1, text]) => {
      const ws = text.split(/\s+/), tot = ws.reduce((n, w) => n + w.length + 1, 0);
      let acc = 0;
      return { t0, t1, text, words: ws.map(w => { const t = t0 + (t1 - t0) * acc / tot; acc += w.length + 1; return { w, t }; }) };
    });
    build();
    attach();
    new MutationObserver(attach).observe(document.getElementById("main"), { childList: true });
  }

  function build() {
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    audio = new Audio(B.dir + B.audio); audio.preload = "metadata";
    root = document.createElement("section");
    root.className = "ib paused"; root.id = "brief"; root.setAttribute("aria-label", "الموجز التفاعلي");
    const total = B.duration;
    root.innerHTML = `
      <div class="sec-h"><h2>الموجز التفاعلي</h2><span>${esc(B.dateText)} · ${B.stories.length} أخبار · ${mmss(total)}</span></div>
      <div class="ib-box">
        <div>
          <div class="ib-stage">
            <img class="ib-ph" alt=""><img class="ib-ph" alt="">
            <img class="ib-logo" src="assets/logo.png" alt="">
            <div class="ib-lt">
              <span class="ib-tag"><b></b><i></i></span>
              <div class="ib-bar"><div class="ib-head"></div><div class="ib-brand"><b>الموجز الإخباري</b>${esc(B.dateText)}</div></div>
              <div class="ib-cap" aria-hidden="true"></div>
            </div>
            <button class="ib-go" type="button"><span>${I.play}</span><strong>استمع إلى الموجز واختر الخبر من الخريطة</strong></button>
          </div>
          <div class="ib-ctl">
            <button class="pp" type="button" aria-label="تشغيل">${I.play}</button>
            <button class="nx" type="button" aria-label="الخبر التالي" title="الخبر التالي">${I.next}</button>
            <button class="pv" type="button" aria-label="الخبر السابق" title="الخبر السابق">${I.prev}</button>
            <div class="ib-prog" role="slider" tabindex="0" aria-label="موضع الاستماع" aria-valuemin="0" aria-valuemax="${Math.round(total)}" aria-valuenow="0">
              ${segments().map(([a, b]) => `<div style="flex:${(b - a).toFixed(2)}"><i></i></div>`).join("")}
            </div>
            <time>0:00 / ${mmss(total)}</time>
          </div>
        </div>
        <div class="ib-side">
          <div class="ib-map"><canvas aria-label="خريطة أخبار الموجز" role="img"></canvas><span class="hint">اضغط على بلد أو رقم</span></div>
          <ol class="ib-list">${B.stories.map((s, i) => `<li><button type="button" data-i="${i}"><span class="n">${i + 1}</span><span class="c">${esc(s.country)}<small>${esc(s.topic || "")}</small></span><span class="h">${esc(s.heads[0].text)}</span></button></li>`).join("")}</ol>
        </div>
      </div>`;
    const q = s => root.querySelector(s);
    el = { phs: [...root.querySelectorAll(".ib-ph")], tagB: q(".ib-tag b"), tagI: q(".ib-tag i"), tag: q(".ib-tag"), head: q(".ib-head"),
      cap: q(".ib-cap"), go: q(".ib-go"), pp: q(".pp"), prog: q(".ib-prog"), fills: [...root.querySelectorAll(".ib-prog i")],
      time: q(".ib-ctl time"), list: [...root.querySelectorAll(".ib-list button")], canvas: q("canvas"), mapBox: q(".ib-map") };

    el.go.onclick = () => play();
    el.pp.onclick = () => audio.paused ? play() : audio.pause();
    q(".nx").onclick = () => { const i = storyAt(audio.currentTime); jump(i + 1 < B.stories.length ? i + 1 : -2); };
    q(".pv").onclick = () => {
      const i = storyAt(audio.currentTime), t = audio.currentTime;
      jump(i < 0 ? (t > B.outro ? B.stories.length - 1 : 0) : t - B.stories[i].t0 > 3 || i === 0 ? i : i - 1);
    };
    el.list.forEach(b => b.onclick = () => {
      jump(+b.dataset.i);
      const r = q(".ib-stage").getBoundingClientRect();     // on a phone the list is below the photo: bring it back
      if (r.top < 60 || r.bottom > innerHeight) q(".ib-stage").scrollIntoView({ behavior: still.matches ? "auto" : "smooth", block: "start" });
    });
    const seekTo = e => {
      const r = el.prog.getBoundingClientRect();
      seek(Math.min(1, Math.max(0, (r.right - e.clientX) / r.width)) * total);   // RTL: time runs right to left
    };
    el.prog.addEventListener("pointerdown", e => { el.prog.setPointerCapture(e.pointerId); seekTo(e); el.prog.onpointermove = seekTo; });
    el.prog.addEventListener("pointerup", () => { el.prog.onpointermove = null; });
    el.prog.addEventListener("keydown", e => {
      const d = { ArrowLeft: 5, ArrowRight: -5, ArrowDown: -5, ArrowUp: 5 }[e.key];
      if (d) { e.preventDefault(); seek(audio.currentTime + d); }
      else if (e.key === "Home") seek(0); else if (e.key === "End") seek(total - 0.5);
    });
    el.canvas.addEventListener("pointermove", e => {
      const i = hit(e); if (i !== hover) { hover = i; el.canvas.style.cursor = i >= 0 ? "pointer" : ""; drawMap(); }
    });
    el.canvas.addEventListener("pointerleave", () => { if (hover >= 0) { hover = -1; drawMap(); } });
    el.canvas.addEventListener("click", e => { const i = hit(e); if (i >= 0) jump(i); });

    audio.addEventListener("play", () => { root.classList.remove("paused"); el.go.hidden = true; el.pp.innerHTML = I.pause; el.pp.setAttribute("aria-label", "إيقاف مؤقت"); loop(); });
    audio.addEventListener("pause", () => { root.classList.add("paused"); el.pp.innerHTML = I.play; el.pp.setAttribute("aria-label", "تشغيل"); });
    audio.addEventListener("ended", () => { el.go.hidden = false; el.go.querySelector("strong").textContent = "أعد الاستماع أو اختر خبراً"; });
    audio.addEventListener("seeked", () => update());
    new ResizeObserver(() => { sizeCanvas(); drawMap(); }).observe(el.mapBox);
    still.addEventListener?.("change", () => update(true));

    cam = view(-1); camGoal = cam;
    update(true);
  }

  // the player node goes back into the home page's placeholder after each re-render
  function attach() {
    const slot = document.getElementById("briefSlot");
    if (!slot || !root) return;
    slot.replaceWith(root);
    sizeCanvas(); drawMap();
    if (location.hash === "#brief" && !scrolled) { scrolled = true; root.scrollIntoView(); }
  }

  function segments() {
    const s = B.stories, out = [[0, s[0].t0]];
    s.forEach(x => out.push([x.t0, x.t1]));
    out.push([B.outro, B.duration]);
    return out;
  }
  const storyAt = t => B.stories.findIndex(s => t >= s.t0 - 0.05 && t < s.t1 - 0.05);
  function play() {
    if (audio.ended || audio.currentTime >= B.duration - 0.3) audio.currentTime = 0;
    audio.play().catch(() => {});
    media();
  }
  function seek(t) { audio.currentTime = Math.max(0, Math.min(B.duration - 0.1, t)); update(); }
  function jump(i) {
    seek(i === -2 ? B.outro : B.stories[i].t0 + 0.02);
    if (audio.paused) play();
  }
  function media() {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: `الموجز الإخباري – ${B.dateText}`, artist: "الرواية",
      artwork: [{ src: new URL("assets/icon-512.png", location.href).href, sizes: "512x512", type: "image/png" }] });
    navigator.mediaSession.setActionHandler?.("nexttrack", () => root.querySelector(".nx").click());
    navigator.mediaSession.setActionHandler?.("previoustrack", () => root.querySelector(".pv").click());
  }

  function loop() {
    cancelAnimationFrame(raf);
    const step = () => { update(); if (!audio.paused || moving()) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  }

  // ---------- scene ----------
  function update(force) {
    const t = audio.currentTime || 0, i = storyAt(t), s = B.stories[i];
    // photo
    let img = B.hook?.img;
    if (s) for (const [pt, f] of s.photos) if (t >= pt - 0.05) img = f;
    if (!s && t < B.stories[0].t0) img = B.hook?.img;
    if (img !== last.img || force) { showPhoto(img, last.img !== undefined && !force); last.img = img; }
    // tag + headline
    let kicker, topic, text;
    if (s) {
      let h = s.heads[0]; for (const x of s.heads) if (t >= x.t - 0.05) h = x;
      kicker = s.country; topic = h.topic || s.topic; text = h.text;
    } else if (t >= B.outro) { kicker = "الموجز الإخباري"; topic = ""; text = B.outroText; }
    else if (audio.paused && t < 0.1 && B.hook) {
      const hs = B.stories.find(x => x.photos.some(p => p[1] === B.hook.img));
      kicker = hs ? hs.country : "الموجز الإخباري"; topic = hs ? hs.topic : ""; text = B.hook.text;
    } else { kicker = "الموجز الإخباري"; topic = ""; text = B.intro; }
    if (text !== last.text) {
      const first = last.text === undefined;
      last.text = text;
      const set = () => { el.head.textContent = text; el.tagB.textContent = kicker; el.tagI.textContent = topic; el.head.classList.remove("fade"); };
      if (first || still.matches) set(); else { el.head.classList.add("fade"); setTimeout(() => last.text === text && set(), 300); }
    }
    // spoken words
    let p = null;
    for (const x of B.phrases) if (t >= x.t0 - 0.05) p = x;
    if (p) { const n = B.phrases[B.phrases.indexOf(p) + 1]; if (t > (n && n.t0 - p.t1 < 0.8 ? n.t0 : p.t1 + 0.4)) p = null; }
    const waiting = audio.paused && t < 0.1;                // before the first play: the opening line, not yet said
    if (waiting) p = B.phrases[0];
    const key = p ? p.t0 + ":" + (waiting ? "w" : p.words.findLastIndex(w => t >= w.t - 0.03)) : "";
    if (key !== last.cap) {
      last.cap = key;
      el.cap.innerHTML = p ? p.words.map((w, k) => {
        const on = !waiting && t >= w.t - 0.03 && (k === p.words.length - 1 || t < p.words[k + 1].t - 0.03);
        return `<span class="${on ? "on" : !waiting && t >= w.t - 0.03 ? "s" : ""}">${esc(w.w)}</span>`;
      }).join(" ") : "";
    }
    // progress + list
    segments().forEach(([a, b], k) => { el.fills[k].style.width = Math.min(100, Math.max(0, (t - a) / (b - a) * 100)) + "%"; });
    el.time.textContent = `${mmss(t)} / ${mmss(B.duration)}`;
    el.prog.setAttribute("aria-valuenow", Math.round(t));
    el.prog.setAttribute("aria-valuetext", `${mmss(t)}${s ? " · " + s.country : ""}`);
    if (i !== last.i || force) {
      last.i = i;
      el.list.forEach((b, k) => b.setAttribute("aria-current", String(k === i)));
      camGoal = view(i);
      if (still.matches) cam = camGoal;
      drawMap();
      if (audio.paused) loop();
    }
    if (moving()) drawMap();
  }

  function showPhoto(f, fade) {
    if (!f) return;
    const [a, b] = el.phs, on = a.classList.contains("on") ? a : b, off = on === a ? b : a;
    const src = B.dir + f;
    if (!fade) { on.src = src; on.classList.add("on", "kb"); return; }
    off.classList.remove("kb"); void off.offsetWidth;
    off.onload = () => { off.classList.add("on", "kb"); on.classList.remove("on"); };
    off.src = src;
    if (off.complete && off.naturalWidth) off.onload();
  }

  // ---------- map ----------
  function view(i) {
    const s = B.stories[i];
    return s ? { lon: s.cam.lon, my: mercY(s.cam.lat), w: Math.max(18, s.cam.w * 1.15) } : { lon: 3, my: mercY(23.5), w: 54 };
  }
  const moving = () => Math.abs(cam.lon - camGoal.lon) + Math.abs(cam.my - camGoal.my) + Math.abs(cam.w - camGoal.w) > 0.02;
  let W = 0, H = 0, dpr = 1;
  function sizeCanvas() {
    const r = el.canvas.getBoundingClientRect();
    if (!r.width) return;
    dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height;
    el.canvas.width = Math.round(W * dpr); el.canvas.height = Math.round(H * dpr);
  }
  const proj = () => {
    const k = W / cam.w;
    return { k, x: lon => W / 2 + (lon - cam.lon) * k, y: lat => H / 2 - (mercY(lat) - cam.my) * k };
  };
  let lastDraw = 0;
  function drawMap() {
    if (!W || !root.isConnected) return;
    const now = performance.now(), dt = Math.min(0.1, (now - lastDraw) / 1000 || 0.016); lastDraw = now;
    if (moving()) {
      const a = 1 - Math.exp(-dt * 3.2);
      cam = { lon: cam.lon + (camGoal.lon - cam.lon) * a, my: cam.my + (camGoal.my - cam.my) * a, w: Math.exp(Math.log(cam.w) + (Math.log(camGoal.w) - Math.log(cam.w)) * a) };
    }
    const cs = getComputedStyle(root), v = n => cs.getPropertyValue(n).trim();
    const dark = matchMedia("(prefers-color-scheme: dark)").matches && document.documentElement.dataset.theme !== "light" || document.documentElement.dataset.theme === "dark";
    const ctx = el.canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = v("--surface") || "#fff"; ctx.fillRect(0, 0, W, H);
    const P = proj(), M = B.map, cell = M.cell, size = cell * P.k, sq = Math.max(1, size * 0.78);
    const i = last.i, s = B.stories[i], hs = B.stories[hover];
    const idOf = k => M.ids[k];
    const storyIds = new Set(B.stories.flatMap(x => x.ids));
    const act = new Set(s ? s.ids : []), also = new Set(s ? s.also : []), hov = new Set(hs ? hs.ids : []);
    const col = {
      land: dark ? "#1F3A38" : "#D5DFDD", story: dark ? "#2E5E58" : "#A9CFC5", act: GREEN, also: dark ? "#3F8F7A" : "#7DC4AE",
      hov: dark ? "#4FA893" : "#5FB49A",
    };
    const c0 = Math.max(0, Math.floor((cam.lon - W / 2 / P.k - M.lon0) / cell) - 1), c1 = Math.min(M.cols - 1, Math.ceil((cam.lon + W / 2 / P.k - M.lon0) / cell) + 1);
    const r0 = Math.max(0, Math.floor((M.my1 - (cam.my + H / 2 / P.k)) / cell) - 1), r1 = Math.min(M.rows - 1, Math.ceil((M.my1 - (cam.my - H / 2 / P.k)) / cell) + 1);
    const paths = {};
    for (let r = r0; r <= r1; r++) {
      const y = H / 2 - (M.my1 - (r + 0.5) * cell - cam.my) * P.k - sq / 2;
      for (let c = c0; c <= c1; c++) {
        const g = grid[r * M.cols + c]; if (!g) continue;
        const id = idOf(g);
        const kind = act.has(id) ? "act" : hov.has(id) ? "hov" : also.has(id) ? "also" : storyIds.has(id) ? "story" : "land";
        (paths[kind] ||= new Path2D()).rect(W / 2 + (M.lon0 + (c + 0.5) * cell - cam.lon) * P.k - sq / 2, y, sq, sq);
      }
    }
    for (const k of ["land", "story", "also", "hov", "act"]) if (paths[k]) { ctx.fillStyle = col[k]; ctx.fill(paths[k]); }

    ctx.font = `14px ${v("--f-display") || "sans-serif"}`; ctx.textBaseline = "middle"; ctx.direction = "rtl";
    // pins of the current story
    if (s) for (const p of s.pins) {
      const x = P.x(p.lon), y = P.y(p.lat);
      if (p.dot) {
        ctx.beginPath(); ctx.arc(x, y, p.main ? 6 : 4.5, 0, 7); ctx.fillStyle = "#fff"; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = p.main ? NAVY : GREEN; ctx.stroke();
      }
      const tw = ctx.measureText(p.label).width + 14, h = 22;
      const lx = !p.dot ? x - tw / 2 : p.side === "left" ? x - 12 - tw : x + 12;
      ctx.fillStyle = p.main || !p.dot ? NAVY : "rgb(11 31 75 / .8)";
      ctx.beginPath(); ctx.roundRect(lx, y - h / 2, tw, h, 4); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText(p.label, lx + tw / 2, y + 1);
    }
    // story numbers (all stories; the current one has its pins instead)
    ctx.textAlign = "center"; ctx.font = `700 13px ${v("--f-body") || "sans-serif"}`;
    B.stories.forEach((x, k) => {
      if (k === i) return;
      const [px, py] = numAt(x, P);
      ctx.beginPath(); ctx.arc(px, py, k === hover ? 13 : 11, 0, 7);
      ctx.fillStyle = k === hover ? GREEN : NAVY; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.fillText(String(k + 1), px, py + 1);
    });
    if (moving() && audio.paused) loop();
  }
  // a story's number sits on its main pin (or its first label)
  function numAt(x, P) { return [P.x(x.at[0]), P.y(x.at[1])]; }
  function hit(e) {
    const r = el.canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, P = proj();
    let best = -1, bd = 18;
    B.stories.forEach((x, k) => { if (k === last.i) return; const [px, py] = numAt(x, P), d = Math.hypot(px - mx, py - my); if (d < bd) { bd = d; best = k; } });
    if (best >= 0) return best;
    const M = B.map, lon = cam.lon + (mx - W / 2) / P.k, mY = cam.my - (my - H / 2) / P.k;
    const c = Math.floor((lon - M.lon0) / M.cell), rr = Math.floor((M.my1 - mY) / M.cell);
    if (c < 0 || rr < 0 || c >= M.cols || rr >= M.rows) return -1;
    const id = M.ids[grid[rr * M.cols + c]];
    return id ? B.stories.findIndex(x => x.ids.includes(id)) : -1;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
