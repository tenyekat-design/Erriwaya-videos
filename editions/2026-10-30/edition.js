// Edition of 30 Oct 2026. All times are in seconds of the ORIGINAL voice-over (voiceover.mp3 in this
// folder); the template maps them onto the video timeline. Images are files in ./img.
window.TIMELINE = {
  date: 'الجمعة 30 أكتوبر 2026',
  title: 'الموجز الإخباري',
  audioCut: 0.0,      // keep the spoken teaser ("من مجلس الأمن الدولي...") before "أهلا بكم"
  audioEnd: 177.680,
  intro: 7.0,
  outroAt: 169.72,    // "كان هذا موجز أبرز أخبار اليوم"
  tail: 3.0,
  map: 'low',         // inset map just above the headline bar so it stays off the faces

  // opening hook: the strongest story, full-frame, before the map intro
  hook: { img: 'unsc-russia-veto.webp', f: [0.42, 0.4], kicker: 'الصحراء الغربية', topic: 'دبلوماسية',
          text: 'روسيا تسقط بالفيتو مشروع القرار الأمريكي بشأن الصحراء الغربية' },

  cards: [
    // opening teaser
    { kicker: 'الصحراء الغربية', img: 'unsc-russia-veto.webp', moves: [{ t: 0.0, a: [0.45, 0.4, 1.0], b: [0.45, 0.35, 1.08] }] },
    { kicker: 'موريتانيا', img: 'mr-forum-hall.jpg', moves: [{ t: 6.02, a: [0.5, 0.5, 1.0], b: [0.55, 0.5, 1.1] }] },
    { kicker: 'السنغال', img: 'mr-sn-arrival.jpg', moves: [{ t: 7.60, a: [0.45, 0.45, 1.0], b: [0.45, 0.42, 1.08] }] },
    { kicker: 'ليبيا', img: 'ly-refinery.jpg', moves: [{ t: 9.14, a: [0.5, 0.5, 1.0], b: [0.55, 0.45, 1.1] }] },
    { kicker: 'الجزائر', img: 'dz-cocaine.jpg', moves: [{ t: 10.70, a: [0.5, 0.5, 1.0], b: [0.52, 0.45, 1.1] }] },
    { kicker: 'المغرب', img: 'sn-migrants-return.jpg', moves: [{ t: 12.90, a: [0.5, 0.5, 1.0], b: [0.55, 0.5, 1.1] }] },
    // Western Sahara: the Russian veto
    { img: 'unsc-vote2.jpg', moves: [{ t: 15.42, a: [0.5, 0.5, 1.0], b: [0.55, 0.45, 1.12] }] },
    { img: 'unsc-russia-veto.webp', moves: [{ t: 22.94, a: [0.45, 0.4, 1.0], b: [0.45, 0.35, 1.1] }] },
    { img: 'minurso-vehicles.jpg', moves: [{ t: 30.84, a: [0.5, 0.55, 1.0], b: [0.6, 0.55, 1.12] }] },
    { img: 'unsc-vote.jpg', moves: [{ t: 41.20, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.12] }] },
    // Mauritania: diaspora forum
    { img: 'mr-forum-hall.jpg', moves: [{ t: 51.78, a: [0.5, 0.5, 1.0], b: [0.55, 0.5, 1.12] }] },
    { img: 'mr-forum-stage.jpg', moves: [{ t: 56.12, a: [0.5, 0.55, 1.0], b: [0.55, 0.62, 1.3] }] },
    { img: 'mr-forum-front.jpg', moves: [{ t: 60.04, a: [0.55, 0.45, 1.0], b: [0.55, 0.42, 1.1] }] },
    // Mauritania: the president to Dakar
    { img: 'mr-president-plane.jpg', moves: [{ t: 68.48, a: [0.45, 0.45, 1.0], b: [0.45, 0.42, 1.1] }] },
    { img: 'mr-sn-arrival.jpg', moves: [{ t: 73.92, a: [0.45, 0.45, 1.0], b: [0.45, 0.42, 1.08] }] },
    { img: 'mr-sn-anthem.jpg', moves: [{ t: 77.36, a: [0.5, 0.45, 1.0], b: [0.5, 0.42, 1.08] }] },
    { img: 'mr-sn-meeting.jpg', moves: [{ t: 79.06, a: [0.52, 0.55, 1.0], b: [0.52, 0.52, 1.1] }] },
    // Libya: Hamada pipeline
    { img: 'ly-refinery.jpg', moves: [{ t: 83.32, a: [0.5, 0.5, 1.0], b: [0.55, 0.45, 1.12] }] },
    { img: 'ly-refinery-night.jpg', moves: [{ t: 95.10, a: [0.6, 0.5, 1.0], b: [0.55, 0.5, 1.12] }] },
    // Libya: Osama Najim
    { img: 'ly-najim.webp', moves: [{ t: 104.52, a: [0.4, 0.4, 1.0], b: [0.4, 0.36, 1.1] }] },
    { img: 'ly-najim-plane.jpg', moves: [{ t: 115.32, a: [0.4, 0.4, 1.0], b: [0.42, 0.38, 1.08] }] },
    // Morocco: Senegalese migrants
    { img: 'sn-migrants-return.jpg', moves: [{ t: 123.84, a: [0.5, 0.5, 1.0], b: [0.55, 0.5, 1.12] }] },
    { img: 'migrants-bags.jpg', moves: [{ t: 132.60, a: [0.5, 0.5, 1.0], b: [0.45, 0.5, 1.1] }] },
    // Algeria: cocaine seizure
    { img: 'dz-cocaine.jpg', moves: [{ t: 139.78, a: [0.5, 0.5, 1.0], b: [0.5, 0.45, 1.1] },
                                     { t: 151.30, a: [0.53, 0.38, 1.4], b: [0.53, 0.36, 1.25] }] },
    // Western Sahara: closing
    { img: 'unsc-russia-veto.webp', moves: [{ t: 157.50, a: [0.45, 0.4, 1.0], b: [0.45, 0.35, 1.1] }] },
    { img: 'minurso-vehicles.jpg', moves: [{ t: 163.42, a: [0.4, 0.55, 1.0], b: [0.3, 0.55, 1.12] }] },
    // wrap-up
    { img: 'unsc-vote2.jpg', moves: [{ t: 169.72, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
    { img: 'mr-sn-arrival.jpg', moves: [{ t: 172.40, a: [0.45, 0.45, 1.0], b: [0.45, 0.42, 1.08] }] },
    { img: 'ly-refinery.jpg', moves: [{ t: 174.80, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
  ],

  headlines: [
    { t: 0.0, kicker: 'الموجز الإخباري', text: 'من الفيتو الروسي في مجلس الأمن إلى نواكشوط وداكار وطرابلس والجزائر' },
    { t: 15.42, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'روسيا تسقط بالفيتو مشروع القرار الأمريكي بشأن الصحراء الغربية' },
    { t: 22.94, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'تأييد 11 دولة وامتناع الصين وباكستان والصومال عن التصويت' },
    { t: 30.84, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'المشروع جعل الحكم الذاتي الأساس الوحيد واقترح تغيير اسم مينورسو' },
    { t: 41.20, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'مقترح روسي بديل لتمديد ولاية البعثة عاما مع الإبقاء على اسمها' },
    { t: 51.78, kicker: 'موريتانيا', topic: 'مجتمع', text: 'الغزواني يفتتح النسخة الأولى من منتدى الجاليات الموريتانية بالخارج' },
    { t: 60.04, kicker: 'موريتانيا', topic: 'مجتمع', text: 'نحو 700 مشارك يبحثون حقوق المغتربين وتمثيلهم ومساهمتهم في التنمية' },
    { t: 68.48, kicker: 'موريتانيا', topic: 'دبلوماسية', text: 'الغزواني يتوجه إلى داكار لحضور افتتاح الألعاب الأولمبية للشباب' },
    { t: 79.06, kicker: 'موريتانيا', topic: 'مجتمع', text: 'أول نسخة من هذه الألعاب تحتضنها القارة الإفريقية' },
    { t: 83.32, kicker: 'ليبيا', topic: 'اقتصاد', text: 'توقف ضخ الخام عبر خط الحمادة نحو مصفاة الزاوية بعد إغلاق صمام' },
    { t: 95.10, kicker: 'ليبيا', topic: 'اقتصاد', text: 'المؤسسة الوطنية للنفط تحذر من خسارة نحو 15 ألف برميل يوميا' },
    { t: 104.52, kicker: 'ليبيا', topic: 'أمن', text: 'واشنطن تفرض قيودا على دخول أسامة نجيم وزوجته إلى أراضيها' },
    { t: 115.32, kicker: 'ليبيا', topic: 'أمن', text: 'اتهامات بانتهاكات جسيمة بينها تعذيب معتقلين في سجني معيتيقة والجديدة' },
    { t: 123.84, kicker: 'المغرب', topic: 'مجتمع', text: 'إعادة طوعية لنحو 400 مهاجر سنغالي من مراكز استقبال جنوب المملكة' },
    { t: 132.60, kicker: 'المغرب', topic: 'مجتمع', text: 'قوافل متتالية بعد اعتراض قوارب تقل مئات المهاجرين قبالة السواحل' },
    { t: 139.78, kicker: 'الجزائر', topic: 'أمن', text: 'تفكيك شبكة عابرة للحدود لتهريب المخدرات في ولاية تمنراست' },
    { t: 151.30, kicker: 'الجزائر', topic: 'أمن', text: 'حجز 69 كيلوغراما من الكوكايين وتوقيف شخصين من أفراد الشبكة' },
    { t: 157.50, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'الفيتو الروسي يفتح باب التساؤلات بشأن مصير بعثة مينورسو' },
    { t: 163.42, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'تساؤلات حول تسوية تجنب البعثة فراغا في التفويض الأممي' },
    { t: 169.72, kicker: 'الموجز الإخباري', text: 'كان هذا موجز أبرز أخبار اليوم' },
  ],

  chapters: [15.42, 51.78, 68.48, 83.32, 104.52, 123.84, 139.78, 157.50],

  camera: [
    { t: 0.0, lon: 0, lat: 24.5, w: 58, d: 0.01 },
    { t: 15.3, lon: -12.6, lat: 24.6, w: 24, d: 1.8 },
    { t: 51.6, lon: -11.5, lat: 20.0, w: 26, d: 2.0 },
    { t: 68.3, lon: -15.5, lat: 16.5, w: 14, d: 2.0 },
    { t: 83.2, lon: 13.5, lat: 31.0, w: 16, d: 2.0 },
    { t: 104.4, lon: 17.5, lat: 28.5, w: 30, d: 2.0 },
    { t: 123.7, lon: -11.5, lat: 23.5, w: 40, d: 2.0 },
    { t: 139.6, lon: 4.0, lat: 26.0, w: 28, d: 2.0 },
    { t: 157.3, lon: -12.6, lat: 24.6, w: 24, d: 2.0 },
    { t: 169.6, lon: 0, lat: 24.5, w: 58, d: 2.2 },
  ],

  highlights: [
    { t: 0.0, end: 15.3, kind: 'primary', ids: ['732', '478', '686', '434', '012', '504'], origin: [-15.98, 18.09] },
    { t: 15.7, end: 51.6, kind: 'primary', ids: ['732'], origin: [-12.9, 24.6] },
    { t: 30.8, end: 51.6, kind: 'secondary', ids: ['504'], origin: [-6.84, 34.02] },
    { t: 52.1, end: 83.1, kind: 'primary', ids: ['478'], origin: [-15.98, 18.09] },
    { t: 71.3, end: 83.1, kind: 'secondary', ids: ['686'], origin: [-17.44, 14.69] },
    { t: 83.6, end: 123.6, kind: 'primary', ids: ['434'], origin: [13.19, 32.89] },
    { t: 124.1, end: 139.5, kind: 'primary', ids: ['504'], origin: [-6.84, 34.02] },
    { t: 127.3, end: 139.5, kind: 'secondary', ids: ['686'], origin: [-17.44, 14.69] },
    { t: 140.1, end: 157.2, kind: 'primary', ids: ['012'], origin: [5.52, 22.79] },
    { t: 157.8, end: 169.5, kind: 'primary', ids: ['732'], origin: [-12.9, 24.6] },
    { t: 170.0, end: 177.0, kind: 'primary', ids: ['732', '478', '686', '434', '012', '504'], origin: [-15.98, 18.09] },
  ],

  pins: [
    { t: 1.0, end: 15.2, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'left' },
    { t: 16.0, end: 51.4, lon: -12.9, lat: 24.6, label: 'الصحراء الغربية', side: 'left', dot: false },
    { t: 52.4, end: 68.2, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right', main: true },
    { t: 68.8, end: 83.0, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right' },
    { t: 71.6, end: 83.0, lon: -17.44, lat: 14.69, label: 'داكار', side: 'right', main: true },
    { t: 84.0, end: 104.2, lon: 12.72, lat: 32.76, label: 'الزاوية', side: 'down', main: true },
    { t: 87.4, end: 104.2, lon: 12.6, lat: 29.6, label: 'الحمادة', side: 'left', dot: false },
    { t: 105.0, end: 123.4, lon: 13.19, lat: 32.89, label: 'طرابلس', side: 'down', main: true },
    { t: 128.0, end: 139.4, lon: -17.44, lat: 14.69, label: 'داكار', side: 'right', main: true },
    { t: 140.6, end: 157.0, lon: 5.52, lat: 22.79, label: 'تمنراست', side: 'right', main: true },
    { t: 158.2, end: 169.4, lon: -12.9, lat: 24.6, label: 'الصحراء الغربية', side: 'left', dot: false },
  ],

  lines: [
    { t: 71.4, dur: 2.2, end: 83.0, from: [-15.98, 18.09], to: [-17.44, 14.69], curve: 0.2, style: 'route' },
    { t: 87.6, dur: 2.0, end: 104.2, from: [12.6, 29.6], to: [12.72, 32.76], curve: 0.1, style: 'route' },
    { t: 128.2, dur: 2.4, end: 139.4, from: [-9.6, 30.42], to: [-17.44, 14.69], curve: 0.15, style: 'route' },
  ],

  stats: [],
};
