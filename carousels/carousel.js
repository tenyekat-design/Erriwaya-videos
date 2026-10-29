// Erriwaya carousel chrome: logo, page dots, white footer bar (not on the last slide), handles in #big.
// Needs ../../src/icons.js loaded first.
(() => {
  // common chrome: logo, page dots, white footer bar with the red-accent rule and the handles
  const svg = (name, fill, bg) => bg
    ? `<svg viewBox="-4 -4 32 32"><rect x="-4" y="-4" width="32" height="32" rx="7" fill="${bg}"/><path d="${ICONS[name]}" fill="${fill}"/></svg>`
    : `<svg viewBox="0 0 24 24"><path d="${ICONS[name]}" fill="${fill}"/></svg>`;
  let g = 0;
  const ig = () => `<svg viewBox="0 0 24 24"><defs><radialGradient id="ig${++g}" cx="0.3" cy="1.07" r="1.3"><stop offset="0" stop-color="#FDD835"/><stop offset=".45" stop-color="#F0383E"/><stop offset=".75" stop-color="#C1338C"/><stop offset="1" stop-color="#5B51D8"/></radialGradient></defs><path d="${ICONS.instagram}" fill="url(#ig${g})"/></svg>`;
  const nets = () => `${svg('facebook', '#0866FF')}${svg('tiktok', '#fff', '#111')}${svg('youtube', '#FF0000')}`;
  const slides = document.querySelectorAll('.slide');
  slides.forEach((s, i) => {
    const dots = Array.from(slides, (_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).reverse().join('');
    // the last slide carries the handles itself, without the footer bar
    const last = i === slides.length - 1;
    s.insertAdjacentHTML('beforeend', `<div class="logo"></div><div class="page">${dots}</div>` + (last ? '' : `
      <div class="footbar"><div class="rule"></div><div class="foot"><div class="grp">${nets()}<span>ERRIWAYA</span></div><div class="sep"></div><div class="grp">${ig()}<span>ERRIWAYA.MR</span></div></div></div>`));
  });
  const big = document.getElementById('big');
  if (big) big.innerHTML = `<div>${nets()}ERRIWAYA</div><div>${ig()}ERRIWAYA.MR</div>`;
})();
