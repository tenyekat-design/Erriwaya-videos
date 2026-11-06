// Edition of 7 Nov 2026. All times are in seconds of the ORIGINAL voice-over (voiceover.mp3 in this
// folder); the template maps them onto the video timeline. Images are files in ./img.
window.TIMELINE = {
  date: 'السبت 7 نوفمبر 2026',
  title: 'الموجز الإخباري',
  audioCut: 0.0,      // the voice-over starts at "أهلا بكم"
  audioEnd: 142.160,
  intro: 7.0,
  outroAt: 133.96,    // "إلى هنا نصل إلى ختام هذا الموجز"
  tail: 3.0,

  hook: { img: 'minurso-laayoune.jpg', f: [0.5, 0.45], kicker: 'الصحراء الغربية', topic: 'دبلوماسية',
          text: 'الأمم المتحدة تبدأ تصفية بعثة المينورسو' },

  cards: [
    { kicker: 'الصحراء الغربية', img: 'minurso-laayoune.jpg', moves: [{ t: 0.0, a: [0.5, 0.45, 1.0], b: [0.5, 0.45, 1.1] }] },
    // Western Sahara
    { img: 'minurso-patrol.jpg', moves: [{ t: 3.90, a: [0.5, 0.5, 1.0], b: [0.6, 0.5, 1.12] }] },
    { img: 'minurso-vehicles.jpg', moves: [{ t: 9.98, a: [0.5, 0.5, 1.0], b: [0.45, 0.55, 1.12] }] },
    { img: 'un-helicopter.jpg', moves: [{ t: 14.00, a: [0.5, 0.5, 1.0], b: [0.55, 0.5, 1.1] }] },
    // Mauritania: telecom fines
    { img: 'mr-mattel.jpg', moves: [{ t: 16.94, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.1] }] },
    { img: 'mr-mauritel-full.jpg', moves: [{ t: 21.40, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.05] }] },
    { img: 'mr-chinguitel-full.jpg', moves: [{ t: 24.20, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.05] }] },
    { img: 'mr-mattel.jpg', moves: [{ t: 31.38, a: [0.5, 0.5, 1.15], b: [0.5, 0.5, 1.0] }] },
    // Mauritania - Morocco military visits
    { img: 'mr-ma-navy-shield.jpg', credit: 'الجيش الموريتاني', moves: [{ t: 40.22, a: [0.5, 0.5, 1.0], b: [0.53, 0.45, 1.12] }] },
    { img: 'mr-ma-navy-casablanca.jpg', credit: 'الجيش الموريتاني', moves: [{ t: 47.60, a: [0.5, 0.55, 1.0], b: [0.5, 0.6, 1.12] }] },
    { img: 'ma-navy-nouakchott.jpg', credit: 'الجيش الموريتاني', moves: [{ t: 51.20, a: [0.5, 0.45, 1.0], b: [0.45, 0.4, 1.12] }] },
    { img: 'mr-ma-kenitra-up.jpg', credit: 'الجيش الموريتاني', moves: [{ t: 54.60, a: [0.5, 0.5, 1.0], b: [0.5, 0.45, 1.05] }] },
    { img: 'ma-g5-college.jpg', credit: 'الجيش الموريتاني', moves: [{ t: 59.36, a: [0.62, 0.5, 1.0], b: [0.75, 0.5, 1.08] }] },
    { img: 'mr-ma-navy-shield.jpg', credit: 'الجيش الموريتاني', moves: [{ t: 63.28, a: [0.53, 0.4, 1.3], b: [0.53, 0.4, 1.15] }] },
    // Mauritania: UN commission, Medina
    { img: 'mr-un-lghdhaf.jpg', moves: [{ t: 68.58, a: [0.5, 0.4, 1.0], b: [0.5, 0.35, 1.15] }] },
    { img: 'mr-foreign-ministry.webp', moves: [{ t: 80.10, a: [0.5, 0.4, 1.0], b: [0.5, 0.35, 1.12] }] },
    { img: 'medina.webp', moves: [{ t: 85.36, a: [0.5, 0.5, 1.0], b: [0.5, 0.55, 1.12] }] },
    // Sahel
    { img: 'ml-ne-goita-tiani.jpg', moves: [{ t: 92.58, a: [0.5, 0.4, 1.0], b: [0.5, 0.35, 1.12] }] },
    { img: 'ml-bf-goita-traore.jpg', moves: [{ t: 96.66, a: [0.26, 0.45, 1.0], b: [0.3, 0.45, 1.05] },
                                            { t: 101.82, a: [0.64, 0.45, 1.0], b: [0.68, 0.45, 1.05] }] },
    // Tunisia
    { img: 'tn-kasbah.jpg', moves: [{ t: 109.50, a: [0.5, 0.5, 1.0], b: [0.5, 0.45, 1.12] }] },
    { img: 'amnesty.jpg', moves: [{ t: 113.50, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.08] }] },
    { img: 'tn-amnesty-director.jpg', moves: [{ t: 116.12, a: [0.45, 0.4, 1.0], b: [0.45, 0.38, 1.12] }] },
    { img: 'tn-parliament.jpg', moves: [{ t: 125.18, a: [0.5, 0.55, 1.0], b: [0.5, 0.6, 1.1] }] },
    { img: 'tn-journalist-1.jpg', moves: [{ t: 129.18, a: [0.5, 0.35, 1.0], b: [0.5, 0.32, 1.1] }] },
    { img: 'tn-journalist-2.jpg', moves: [{ t: 131.20, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.1] }] },
    // wrap-up
    { img: 'mr-ma-navy-casablanca.jpg', credit: 'الجيش الموريتاني', moves: [{ t: 133.96, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
    { img: 'ml-bf-goita-traore.jpg', moves: [{ t: 136.40, a: [0.64, 0.45, 1.0], b: [0.66, 0.45, 1.06] }] },
    { img: 'tn-kasbah.jpg', moves: [{ t: 138.90, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
  ],

  headlines: [
    { t: 0.0, kicker: 'الموجز الإخباري', text: 'أبرز تطورات موريتانيا والمغرب العربي والساحل' },
    { t: 1.80, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'الأمم المتحدة تبدأ تصفية بعثة المينورسو' },
    { t: 7.56, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'لاكروا: انتهاء الولاية جاء مفاجئاً ودعوة الأطراف إلى ضبط النفس' },
    { t: 16.94, kicker: 'موريتانيا', topic: 'اقتصاد', text: 'غرامات تتجاوز 4.2 مليار أوقية قديمة على موريتل وماتل وشنقيتل' },
    { t: 29.54, kicker: 'موريتانيا', topic: 'اقتصاد', text: 'بسبب تدهور الخدمات، مع تدقيق فني ومالي للشبكات الثلاث' },
    { t: 40.22, kicker: 'موريتانيا', topic: 'أمن', text: 'أسبوع من الزيارات العسكرية المتبادلة بين موريتانيا والمغرب' },
    { t: 54.60, kicker: 'موريتانيا', topic: 'أمن', text: 'من القنيطرة إلى كلية الدفاع لمجموعة الساحل ضمن خطة اللجنة المختلطة' },
    { t: 68.58, kicker: 'موريتانيا', topic: 'دبلوماسية', text: 'موريتاني على رأس لجنة الخدمة المدنية الدولية بالأمم المتحدة' },
    { t: 80.10, kicker: 'موريتانيا', topic: 'دبلوماسية', text: 'نواكشوط تدين محاولة الحوثيين استهداف المدينة المنورة' },
    { t: 92.58, kicker: 'مالي', topic: 'أمن', text: 'غويتا في نيامي وواغادوغو لتعزيز التنسيق داخل تحالف الساحل' },
    { t: 98.12, kicker: 'مالي', topic: 'أمن', text: 'اتفاق مع تراوري على تعميق التعاون في مكافحة الإرهاب' },
    { t: 109.50, kicker: 'تونس', topic: 'سياسة', text: 'العفو الدولية تحذر من تراجع الحريات وحقوق الإنسان في تونس' },
    { t: 125.18, kicker: 'تونس', topic: 'سياسة', text: 'انتقاد لتراجع دور القضاء ولاحتجاز الصحفيين الهاني واليوسفي' },
    { t: 133.96, kicker: 'الموجز الإخباري', text: 'إلى هنا نصل إلى ختام هذا الموجز' },
  ],

  chapters: [1.80, 16.94, 40.22, 68.58, 92.58, 109.50],

  camera: [
    { t: 0.0, lon: 0, lat: 24.5, w: 58, d: 0.01 },
    { t: 1.6, lon: -12.6, lat: 24.6, w: 24, d: 1.8 },
    { t: 16.8, lon: -11.5, lat: 20.0, w: 26, d: 1.8 },
    { t: 40.0, lon: -10.5, lat: 26.0, w: 34, d: 2.0 },
    { t: 68.4, lon: -11.5, lat: 20.0, w: 26, d: 1.8 },
    { t: 80.0, lon: 11.5, lat: 23.0, w: 66, d: 2.2 },
    { t: 92.4, lon: -2.5, lat: 14.5, w: 28, d: 2.0 },
    { t: 109.3, lon: 10.0, lat: 35.2, w: 20, d: 2.0 },
    { t: 133.8, lon: 0, lat: 24.5, w: 58, d: 2.2 },
  ],

  highlights: [
    { t: 0.0, end: 1.5, kind: 'primary', ids: ['478', '504', '732', '012', '788', '434'], origin: [-15.98, 18.09] },
    { t: 2.0, end: 16.6, kind: 'primary', ids: ['732'], origin: [-13.2, 27.15] },
    { t: 17.2, end: 39.8, kind: 'primary', ids: ['478'], origin: [-15.98, 18.09] },
    { t: 40.5, end: 68.2, kind: 'primary', ids: ['478'], origin: [-15.98, 18.09] },
    { t: 47.6, end: 68.2, kind: 'secondary', ids: ['504'], origin: [-7.59, 33.57] },
    { t: 68.8, end: 92.2, kind: 'primary', ids: ['478'], origin: [-15.98, 18.09] },
    { t: 85.4, end: 92.2, kind: 'secondary', ids: ['682'], origin: [39.61, 24.47] },
    { t: 92.8, end: 109.1, kind: 'primary', ids: ['466'], origin: [-8.0, 12.64] },
    { t: 94.0, end: 109.1, kind: 'secondary', ids: ['562', '854'], origin: [2.11, 13.51] },
    { t: 109.8, end: 133.6, kind: 'primary', ids: ['788'], origin: [10.18, 36.81] },
    { t: 134.2, end: 140.0, kind: 'primary', ids: ['478', '504', '732', '012', '788', '434'], origin: [-15.98, 18.09] },
  ],

  pins: [
    { t: 2.2, end: 16.4, lon: -13.2, lat: 27.15, label: 'العيون', side: 'right', main: true },
    { t: 3.0, end: 16.4, lon: -13.4, lat: 24.0, label: 'الصحراء الغربية', side: 'left', dot: false },
    { t: 17.4, end: 39.6, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right', main: true },
    { t: 40.8, end: 68.0, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right', main: true },
    { t: 48.0, end: 68.0, lon: -7.59, lat: 33.57, label: 'الدار البيضاء', side: 'left' },
    { t: 55.0, end: 68.0, lon: -6.58, lat: 34.26, label: 'القنيطرة', side: 'up' },
    { t: 69.0, end: 92.0, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right', main: true },
    { t: 85.6, end: 92.0, lon: 39.61, lat: 24.47, label: 'المدينة المنورة', side: 'left' },
    { t: 93.0, end: 108.9, lon: -8.0, lat: 12.64, label: 'باماكو', side: 'left', main: true },
    { t: 95.4, end: 108.9, lon: 2.11, lat: 13.51, label: 'نيامي', side: 'up' },
    { t: 96.8, end: 108.9, lon: -1.52, lat: 12.37, label: 'واغادوغو', side: 'down' },
    { t: 110.0, end: 133.4, lon: 10.18, lat: 36.81, label: 'تونس', side: 'right', main: true },
  ],

  lines: [
    { t: 48.0, dur: 2.2, end: 68.0, from: [-15.98, 18.09], to: [-7.59, 33.57], curve: 0.18, style: 'arc' },
    { t: 51.4, dur: 2.2, end: 68.0, from: [-7.59, 33.57], to: [-15.98, 18.09], curve: 0.18, style: 'route' },
    { t: 55.2, dur: 2.2, end: 68.0, from: [-15.98, 18.09], to: [-6.58, 34.26], curve: -0.15, style: 'arc' },
    { t: 85.8, dur: 2.4, end: 92.0, from: [-15.98, 18.09], to: [39.61, 24.47], curve: -0.1, style: 'arc' },
    { t: 94.6, dur: 1.8, end: 108.9, from: [-8.0, 12.64], to: [2.11, 13.51], curve: -0.2, style: 'arc' },
    { t: 96.8, dur: 1.6, end: 108.9, from: [2.11, 13.51], to: [-1.52, 12.37], curve: -0.2, style: 'route' },
  ],

  stats: [],
};
