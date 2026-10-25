// Edition of __DATE__. All times are in seconds of the ORIGINAL voice-over (voiceover.mp3 in this
// folder); the template maps them onto the video timeline. Images are files in ./img.
// Fill audioCut / audioEnd / outroAt from `python3 tools/transcribe.py __DATE__`, and use
// transcript.txt to time the cards, headlines and map. editions/2026-10-24 is a complete example.
//
// Country ids (world-atlas): Mauritania 478, Morocco 504, W. Sahara 732, Algeria 012, Tunisia 788,
// Libya 434, Mali 466, Niger 562, Senegal 686, Gambia 270, Guinea 324, Burkina Faso 854, Chad 148,
// Egypt 818, Nigeria 566, France 250, Spain 724.
window.TIMELINE = {
  date: '__DAY__',     // e.g. 'السبت 24 أكتوبر 2026'
  title: 'الموجز الإخباري',
  audioCut: 0,        // silence just before "أهلا بكم"
  audioEnd: 0,        // length of voiceover.mp3
  intro: 7.0,         // opening length; keep at 7.0 (the music and animation are built for it)
  outroAt: 0,         // "شكرا لمتابعتكم"
  tail: 1.7,

  // Carousel cards. A card shows one image; give it several moves to re-frame it without changing card.
  // a/b = [focusX, focusY, zoom] at the start/end of the move (focus 0..1 in the image, zoom >= 1).
  cards: [
    { img: 'example.jpg', moves: [{ t: 0, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.12] }] },
  ],

  // Kicker (country) + headline under the progress bar; at most two lines are shown.
  headlines: [
    { t: 0, kicker: 'الموجز الإخباري', text: 'أبرز التطورات السياسية والأمنية والاقتصادية في المنطقة المغاربية ومحيطها' },
  ],

  // Start of each story (story counter + ticks on the progress bar).
  chapters: [],

  // Map camera: centre lon/lat and w = Mercator degrees across the map width; d = move duration.
  // Overview of the region: { lon: 0, lat: 24.5, w: 58 }.
  camera: [
    { t: 0, lon: 0, lat: 24.5, w: 58, d: 0.01 },
  ],

  // Highlighted countries. kind: 'primary' (green) | 'secondary' (grey-blue). origin = start of the wave.
  highlights: [
    // { t: 20.6, end: 40.7, kind: 'primary', ids: ['478'], origin: [-15.98, 18.09] },
  ],

  // Map pins. side: 'up' | 'down' | 'left' | 'right'; main: true for the story's city; dot: false for an area label.
  pins: [
    // { t: 21.0, end: 40.6, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'down', main: true },
  ],

  // Animated lines. style: 'route' (dotted) | 'arc' (solid) | 'cancel' (dashed, with a red mark).
  lines: [
    // { t: 28.0, dur: 2.6, end: 40.6, from: [-8.15, 27.67], to: [-12.47, 22.73], curve: 0.06, style: 'route' },
  ],

  // Figure chips in the map corner: either value (counts up) + unit, or plain text.
  stats: [
    // { t: 97.6, end: 109.8, value: 400, unit: 'مليار درهم', note: 'للاستثمار العمومي' },
  ],
};
