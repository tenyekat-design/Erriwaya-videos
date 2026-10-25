// Edition of 24 Oct 2026. All times are in seconds of the ORIGINAL voice-over (voiceover.mp3 in this
// folder); the template maps them onto the video timeline. Images are files in ./img.
window.TIMELINE = {
  date: 'السبت 24 أكتوبر 2026',
  title: 'الموجز الإخباري',
  audioCut: 9.40,     // the voice-over is trimmed to start at "أهلا بكم"
  audioEnd: 160.287,
  intro: 7.0,         // length of the opening sequence before the voice starts
  outroAt: 154.30,    // "شكرا لمتابعتكم"
  tail: 1.7,          // hold after the voice ends

  // Image cards for the carousel. Each card can hold several Ken Burns moves of the same image.
  // focus = [x, y] in 0..1 of the image, z = zoom over a "cover" fit.
  cards: [
    // opening teaser
    { img: 'mr-dz-signing.jpg', moves: [{ t: 9.40, a: [0.5, 0.45, 1.0], b: [0.5, 0.42, 1.12] }] },
    { img: 'unsc.jpg', moves: [{ t: 11.20, a: [0.5, 0.5, 1.0], b: [0.45, 0.5, 1.12] }] },
    { img: 'dz-parliament.webp', moves: [{ t: 13.00, a: [0.5, 0.5, 1.05], b: [0.6, 0.5, 1.15] }] },
    { img: 'ma-parliament.jpg', moves: [{ t: 14.80, a: [0.5, 0.45, 1.0], b: [0.5, 0.5, 1.12] }] },
    { img: 'tn-olives.jpg', moves: [{ t: 16.60, a: [0.55, 0.5, 1.0], b: [0.55, 0.45, 1.12] }] },
    { img: 'sn-fr.png', moves: [{ t: 18.40, a: [0.5, 0.5, 1.0], b: [0.5, 0.48, 1.1] }] },
    // Mauritania
    { img: 'mr-salute.jpg', moves: [{ t: 20.20, a: [0.32, 0.5, 1.05], b: [0.24, 0.5, 1.22] }] },
    { img: 'mr-dz-signing.jpg', moves: [{ t: 25.12, a: [0.5, 0.42, 1.0], b: [0.5, 0.4, 1.16] }] },
    { img: 'mr-salute.jpg', moves: [{ t: 32.64, a: [0.78, 0.55, 1.28], b: [0.6, 0.5, 1.08] }] },
    // Western Sahara
    { img: 'unsc.jpg', moves: [{ t: 40.86, a: [0.5, 0.5, 1.0], b: [0.5, 0.52, 1.14] }] },
    { img: 'minurso.png', moves: [{ t: 47.82, a: [0.28, 0.5, 1.18], b: [0.5, 0.48, 1.04] },
                              { t: 58.70, a: [0.68, 0.45, 1.25], b: [0.74, 0.45, 1.12] }] },
    { img: 'unsc.jpg', moves: [{ t: 64.52, a: [0.32, 0.6, 1.28], b: [0.45, 0.55, 1.1] }] },
    // Algeria
    { img: 'dz-parliament.webp', moves: [{ t: 71.38, a: [0.5, 0.5, 1.0], b: [0.55, 0.5, 1.14] }] },
    { img: 'dz-speaker.jpg', moves: [{ t: 76.68, a: [0.5, 0.42, 1.0], b: [0.5, 0.4, 1.12] }] },
    { img: 'dz-parliament.webp', moves: [{ t: 83.64, a: [0.76, 0.5, 1.4], b: [0.7, 0.5, 1.2] }] },
    // Morocco
    { img: 'ma-parliament.jpg', moves: [{ t: 91.86, a: [0.5, 0.45, 1.0], b: [0.5, 0.5, 1.14] }] },
    { img: 'ma-finance.png', moves: [{ t: 97.32, a: [0.42, 0.5, 1.04], b: [0.48, 0.48, 1.16] }] },
    { img: 'ma-parliament.jpg', moves: [{ t: 105.30, a: [0.25, 0.62, 1.35], b: [0.35, 0.58, 1.15] }] },
    // Tunisia
    { img: 'tn-cabinet.jpg', moves: [{ t: 110.10, a: [0.5, 0.45, 1.0], b: [0.5, 0.42, 1.15] }] },
    { img: 'tn-olives.jpg', moves: [{ t: 115.60, a: [0.55, 0.45, 1.0], b: [0.52, 0.5, 1.12] },
                                { t: 122.58, a: [0.5, 0.72, 1.35], b: [0.5, 0.66, 1.18] }] },
    // Africa – France
    { img: 'sn-fr.png', moves: [{ t: 129.90, a: [0.5, 0.5, 1.0], b: [0.5, 0.48, 1.08] },
                            { t: 137.22, a: [0.78, 0.42, 1.45], b: [0.74, 0.42, 1.3] },
                            { t: 144.84, a: [0.2, 0.42, 1.45], b: [0.24, 0.42, 1.3] }] },
    // wrap-up
    { img: 'tn-cabinet.jpg', moves: [{ t: 149.64, a: [0.5, 0.45, 1.05], b: [0.5, 0.45, 1.15] }] },
    { img: 'ma-parliament.jpg', moves: [{ t: 151.30, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
    { img: 'mr-salute.jpg', moves: [{ t: 152.90, a: [0.4, 0.5, 1.05], b: [0.4, 0.5, 1.15] }] },
  ],

  // Kicker + headline blocks under the progress bar.
  headlines: [
    { t: 9.40, kicker: 'الموجز الإخباري', text: 'أبرز التطورات السياسية والأمنية والاقتصادية في المنطقة المغاربية ومحيطها' },
    { t: 20.20, kicker: 'موريتانيا', text: 'تنسيق أمني موريتاني جزائري في الزويرات لحماية مشروع طريق تندوف' },
    { t: 32.64, kicker: 'موريتانيا', text: 'تكثيف مكافحة التهريب والهجرة غير النظامية والتنقيب غير المرخص عن الذهب' },
    { t: 40.86, kicker: 'الصحراء الغربية', text: 'خلافات حول مشروع قرار أمريكي في مجلس الأمن بشأن بعثة مينورسو' },
    { t: 58.70, kicker: 'الصحراء الغربية', text: 'البوليساري ترفض المسودة وتلوّح بالانسحاب من العملية السياسية' },
    { t: 71.38, kicker: 'الجزائر', text: 'البرلمان الجزائري يعقد جلستين استثنائيتين غداً الأحد' },
    { t: 79.88, kicker: 'الجزائر', text: 'تصويت محتمل على تفويض بإرسال وحدات عسكرية إلى النيجر' },
    { t: 91.86, kicker: 'المغرب', text: 'مشروع قانون المالية 2027 يخصص 400 مليار درهم للاستثمار العمومي' },
    { t: 101.18, kicker: 'المغرب', text: 'مشاريع كبرى في البنية التحتية والصحة والسدود لدفع النمو' },
    { t: 110.10, kicker: 'تونس', text: 'إجراءات حكومية جديدة لدعم قطاع زيت الزيتون' },
    { t: 120.28, kicker: 'تونس', text: 'قروض ميسرة لصغار المزارعين استعداداً لموسم 2026 – 2027' },
    { t: 129.90, kicker: 'إفريقيا وفرنسا', text: 'ماكرون يؤجل زيارته المقررة إلى السنغال ونيجيريا' },
    { t: 144.84, kicker: 'إفريقيا وفرنسا', text: 'بسبب التطورات الداخلية في فرنسا ودون الإعلان عن موعد بديل' },
    { t: 149.64, kicker: 'الموجز الإخباري', text: 'كان هذا أبرز ما جاء في موجز الأخبار المغاربية والإقليمية' },
  ],

  // Chapters drive the story counter and the ticks on the progress bar.
  chapters: [20.20, 40.86, 71.38, 91.86, 110.10, 129.90],

  // Map camera keyframes: lon/lat of the centre and w = Mercator degrees across the map width.
  camera: [
    { t: 9.40, lon: 0, lat: 24.5, w: 58, d: 0.01 },
    { t: 20.0, lon: -10.4, lat: 24.6, w: 22, d: 1.8 },
    { t: 40.7, lon: -12.6, lat: 24.6, w: 24, d: 1.6 },
    { t: 71.2, lon: 3.0, lat: 33.0, w: 28, d: 1.8 },
    { t: 80.4, lon: 3.0, lat: 25.0, w: 74, d: 2.2 },
    { t: 91.7, lon: -7.0, lat: 31.6, w: 24, d: 2.0 },
    { t: 109.9, lon: 9.6, lat: 34.6, w: 22, d: 1.8 },
    { t: 129.8, lon: -1.0, lat: 45.6, w: 34, d: 2.2 },
    { t: 135.4, lon: -4.5, lat: 14.5, w: 42, d: 2.6 },
    { t: 144.7, lon: 0.5, lat: 44.5, w: 34, d: 2.2 },
    { t: 149.5, lon: 0, lat: 24.5, w: 58, d: 2.2 },
  ],

  // Highlighted countries (world-atlas ids). kind: 'primary' | 'secondary'. origin = where the wave starts.
  highlights: [
    { t: 9.4, end: 20.0, kind: 'primary', ids: ['478', '504', '732', '012', '788', '434'], origin: [-15.98, 18.09] },
    { t: 20.6, end: 40.7, kind: 'primary', ids: ['478'], origin: [-12.47, 22.73] },
    { t: 21.6, end: 40.7, kind: 'secondary', ids: ['012'], origin: [-8.15, 27.67] },
    { t: 41.2, end: 71.2, kind: 'primary', ids: ['732'], origin: [-12.9, 24.6] },
    { t: 71.6, end: 91.7, kind: 'primary', ids: ['012'], origin: [3.06, 36.75] },
    { t: 83.6, end: 91.7, kind: 'secondary', ids: ['562'], origin: [2.11, 13.51] },
    { t: 92.2, end: 109.9, kind: 'primary', ids: ['504'], origin: [-6.84, 34.02] },
    { t: 110.4, end: 129.8, kind: 'primary', ids: ['788'], origin: [10.18, 36.81] },
    { t: 130.2, end: 149.5, kind: 'secondary', ids: ['250'], origin: [2.35, 48.85] },
    { t: 136.5, end: 149.5, kind: 'primary', ids: ['686', '566'], origin: [-17.44, 14.69] },
    { t: 150.0, end: 156.0, kind: 'primary', ids: ['478', '504', '732', '012', '788', '434'], origin: [-15.98, 18.09] },
  ],

  // Map markers. side = where the label sits relative to the dot. dot:false = area label only.
  pins: [
    { t: 10.2, end: 20.0, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'left' },
    { t: 21.0, end: 40.6, lon: -12.47, lat: 22.73, label: 'الزويرات', side: 'down', main: true },
    { t: 22.4, end: 40.6, lon: -8.15, lat: 27.67, label: 'تندوف', side: 'right' },
    { t: 41.6, end: 71.0, lon: -12.9, lat: 24.6, label: 'الصحراء الغربية', dot: false },
    { t: 71.8, end: 91.6, lon: 3.06, lat: 36.75, label: 'الجزائر العاصمة', side: 'left', main: true },
    { t: 82.6, end: 91.6, lon: 2.11, lat: 13.51, label: 'نيامي', side: 'right' },
    { t: 92.6, end: 109.8, lon: -6.84, lat: 34.02, label: 'الرباط', side: 'right', main: true },
    { t: 110.8, end: 129.7, lon: 10.18, lat: 36.81, label: 'تونس', side: 'left', main: true },
    { t: 130.8, end: 149.4, lon: 2.35, lat: 48.85, label: 'فرنسا', side: 'right', main: true },
    { t: 136.6, end: 149.4, lon: -17.44, lat: 14.69, label: 'السنغال', side: 'down' },
    { t: 137.4, end: 149.4, lon: 7.49, lat: 9.06, label: 'نيجيريا', side: 'up' },
  ],

  // Animated lines on the map. curve = bend as a fraction of the length.
  lines: [
    { t: 28.0, dur: 2.6, end: 40.6, from: [-8.15, 27.67], to: [-12.47, 22.73], curve: 0.06, style: 'route' },
    { t: 81.6, dur: 2.4, end: 91.6, from: [3.06, 36.75], to: [2.11, 13.51], curve: 0.12, style: 'arc' },
    { t: 133.2, dur: 3.0, end: 149.4, from: [2.35, 48.85], to: [-17.44, 14.69], curve: 0.18, style: 'cancel' },
    { t: 134.0, dur: 3.0, end: 149.4, from: [2.35, 48.85], to: [7.49, 9.06], curve: -0.14, style: 'cancel' },
  ],

  // Figure chips shown in the corner of the map.
  stats: [
    { t: 97.6, end: 109.8, value: 400, unit: 'مليار درهم', note: 'للاستثمار العمومي' },
    { t: 115.8, end: 120.2, value: 150, unit: 'مليون دينار', note: 'لشراء الإنتاج المحلي' },
    { t: 120.4, end: 129.7, value: 20, unit: 'مليون دينار', note: 'قروض ميسرة للمزارعين' },
    { t: 138.2, end: 149.4, text: '28 – 31 أكتوبر', note: 'زيارة مؤجلة' },
  ],
};
