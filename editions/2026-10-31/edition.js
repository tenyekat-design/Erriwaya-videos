// Edition of 31 Oct 2026: one story (agreement between the Ministry of Higher Education and the student front).
// No narration: voiceover.mp3 is silence with the crowd sound of the user's clip under the third part, and
// subtitles.txt holds reading captions timed at reading pace (the "voice" times below follow them).
// Images are files in ./img (clip-*.jpg are frames of the user's protest clip).
window.TIMELINE = {
  date: 'السبت 31 أكتوبر 2026',
  title: 'الموجز الإخباري',
  audioCut: 0.0,
  audioEnd: 115.1,
  intro: 7.0,
  outroAt: 110.02,    // "إلى هنا نصل إلى ختام هذا الموجز"
  tail: 3.0,

  // opening hook: the story, full-frame, before the map intro
  hook: { img: 'clip-campus-march.jpg', f: [0.5, 0.55], kicker: 'موريتانيا', topic: 'مجتمع',
          text: 'اتفاق بين وزارة التعليم العالي والطلاب ينهي أزمة النقل والمنح' },

  cards: [
    // opening teaser
    { kicker: 'موريتانيا', img: 'clip-campus-crowd.jpg', moves: [{ t: 0.0, a: [0.5, 0.6, 1.0], b: [0.5, 0.62, 1.1] }] },
    { kicker: 'موريتانيا', img: 'bhns-buses.jpg', moves: [{ t: 2.55, a: [0.5, 0.5, 1.0], b: [0.55, 0.5, 1.1] }] },
    { kicker: 'موريتانيا', img: 'lecture-hall.jpg', moves: [{ t: 5.2, a: [0.5, 0.5, 1.0], b: [0.45, 0.55, 1.1] }] },
    // the agreement
    { img: 'campus-aerial.jpg', moves: [{ t: 7.87, a: [0.5, 0.45, 1.0], b: [0.45, 0.4, 1.12] }] },
    { img: 'clip-campus-crowd.jpg', moves: [{ t: 16.99, a: [0.5, 0.6, 1.0], b: [0.5, 0.65, 1.14] }] },
    { img: 'protest-night-speaker.jpg', moves: [{ t: 24.32, a: [0.65, 0.4, 1.0], b: [0.65, 0.35, 1.12] }] },
    { img: 'un-logo.jpg', moves: [{ t: 32.55, a: [0.5, 0.45, 1.0], b: [0.5, 0.42, 1.08] }] },
    { img: 'clip-gate.jpg', moves: [{ t: 40.40, a: [0.5, 0.6, 1.0], b: [0.5, 0.62, 1.1] }] },
    { img: 'lecture-hall.jpg', moves: [{ t: 44.78, a: [0.5, 0.5, 1.0], b: [0.4, 0.55, 1.15] }] },
    // transport
    { img: 'bhns-buses.jpg', moves: [{ t: 55.21, a: [0.5, 0.5, 1.0], b: [0.55, 0.55, 1.12] },
                                     { t: 63.51, a: [0.4, 0.6, 1.4], b: [0.5, 0.6, 1.3] }] },
    { img: 'campus-aerial.jpg', moves: [{ t: 66.70, a: [0.75, 0.6, 1.3], b: [0.7, 0.65, 1.15] }] },
    { img: 'bhns-buses.jpg', moves: [{ t: 77.66, a: [0.8, 0.6, 1.5], b: [0.7, 0.6, 1.35] }] },
    { img: 'campus-aerial.jpg', moves: [{ t: 85.37, a: [0.35, 0.55, 1.35], b: [0.4, 0.5, 1.2] }] },
    // background: the protests
    { img: 'protest-night-march.jpg', moves: [{ t: 93.66, a: [0.5, 0.5, 1.0], b: [0.5, 0.55, 1.12] }] },
    { img: 'clip-campus-march.jpg', moves: [{ t: 97.51, a: [0.5, 0.6, 1.0], b: [0.5, 0.6, 1.12] }] },
    { img: 'protest-night-walk.jpg', moves: [{ t: 101.59, a: [0.55, 0.5, 1.0], b: [0.65, 0.5, 1.12] }] },
    { img: 'lecture-hall-2.jpg', moves: [{ t: 105.89, a: [0.5, 0.5, 1.0], b: [0.45, 0.55, 1.12] }] },
    // wrap-up
    { img: 'clip-campus-crowd.jpg', moves: [{ t: 110.02, a: [0.5, 0.6, 1.05], b: [0.5, 0.6, 1.15] }] },
  ],

  headlines: [
    { t: 0.0, kicker: 'الموجز الإخباري', text: 'اتفاق ينهي أزمة الطلاب مع وزارة التعليم العالي في موريتانيا' },
    { t: 7.87, kicker: 'موريتانيا', topic: 'مجتمع', text: 'اتفاق بين وزارة التعليم العالي والجبهة الطلابية ينهي الأزمة' },
    { t: 24.32, kicker: 'موريتانيا', topic: 'مجتمع', text: 'الجبهة الطلابية: الاتفاق يلبي أبرز المطالب ويوقف الاحتجاجات' },
    { t: 32.55, kicker: 'موريتانيا', topic: 'سياسة', text: 'عودة تمثيل الطلاب في المجالس ولجنة لإطار قانوني موحد للنقابات' },
    { t: 44.78, kicker: 'موريتانيا', topic: 'مجتمع', text: 'لجان مشتركة لمراجعة معايير المنح والسكن وتحسين الخدمات الجامعية' },
    { t: 55.21, kicker: 'موريتانيا', topic: 'اقتصاد', text: 'اشتراك شهري للطلاب بـ3500 أوقية قديمة مقابل 50 رحلة' },
    { t: 63.51, kicker: 'موريتانيا', topic: 'اقتصاد', text: '70 أوقية قديمة للرحلة في حافلات النقل عالي الجودة' },
    { t: 66.70, kicker: 'موريتانيا', topic: 'اقتصاد', text: 'الإبقاء على الخطوط التقليدية بتعريفة 50 أوقية والدفع بالتذكرة الإلكترونية' },
    { t: 85.37, kicker: 'موريتانيا', topic: 'اقتصاد', text: 'حزم تذاكر جديدة: 10 تذاكر لـ15 يوما و20 تذكرة لشهر' },
    { t: 93.66, kicker: 'موريتانيا', topic: 'مجتمع', text: 'احتجاجات وإضرابات طلابية رفضا لرفع أسعار النقل وإلغاء المحطات' },
    { t: 101.59, kicker: 'موريتانيا', topic: 'مجتمع', text: 'الاتحادات الطلابية تتحدث عن تجاوزات في المنح والسكن والابتعاث' },
    { t: 110.02, kicker: 'الموجز الإخباري', text: 'إلى هنا نصل إلى ختام هذا الموجز' },
  ],

  chapters: [7.87, 55.21, 93.66],

  camera: [
    { t: 0.0, lon: -11.5, lat: 20.0, w: 26, d: 0.01 },
    { t: 7.7, lon: -15.98, lat: 18.09, w: 12, d: 2.0 },
    { t: 93.5, lon: -11.5, lat: 20.0, w: 26, d: 2.0 },
  ],

  highlights: [
    { t: 0.0, end: 115.0, kind: 'primary', ids: ['478'], origin: [-15.98, 18.09] },
  ],

  pins: [
    { t: 1.0, end: 115.0, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right', main: true },
  ],

  lines: [],
  stats: [],
};
