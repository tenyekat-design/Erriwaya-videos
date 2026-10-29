// Edition of 29 Oct 2026. All times are in seconds of the ORIGINAL voice-over (voiceover.mp3 in this
// folder); the template maps them onto the video timeline. Images are files in ./img.
window.TIMELINE = {
  date: 'الخميس 29 أكتوبر 2026',
  title: 'الموجز الإخباري',
  audioCut: 0.0,      // keep the spoken teaser ("من أروقة مجلس الأمن...") before "أهلا بكم"
  audioEnd: 244.689,
  intro: 7.0,
  outroAt: 241.92,    // "شكرا لمتابعتكم" (no "إلى هنا نصل" line in this script)
  tail: 3.0,

  // opening hook: the strongest story, full-frame, before the map intro
  hook: { img: 'mr-ru-putin.jpg', f: [0.5, 0.35], kicker: 'موريتانيا', topic: 'دبلوماسية',
          text: 'الرئيس الغزواني يغادر موسكو قبل لقاء ثنائي كان مرتقبا مع بوتين' },

  cards: [
    // opening teaser
    { kicker: 'الصحراء الغربية', img: 'unsc-vote.jpg', moves: [{ t: 0.0, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.1] }] },
    { kicker: 'مالي', img: 'ml-drone.webp', moves: [{ t: 5.48, a: [0.55, 0.5, 1.0], b: [0.6, 0.5, 1.1] }] },
    { kicker: 'موريتانيا', img: 'mr-ru-putin.jpg', moves: [{ t: 9.50, a: [0.5, 0.4, 1.0], b: [0.5, 0.35, 1.1] }] },
    { kicker: 'الجزائر', img: 'dz-pm-putin.jpg', moves: [{ t: 11.20, a: [0.5, 0.4, 1.0], b: [0.5, 0.35, 1.1] }] },
    { kicker: 'تونس', img: 'tn-pm-putin.jpg', moves: [{ t: 12.80, a: [0.5, 0.4, 1.0], b: [0.5, 0.35, 1.1] }] },
    { kicker: 'المغرب', img: 'ma-finance.jpg', moves: [{ t: 14.40, a: [0.5, 0.5, 1.0], b: [0.45, 0.5, 1.1] }] },
    { kicker: 'ليبيا', img: 'ly-central-bank.jpg', moves: [{ t: 16.00, a: [0.6, 0.6, 1.0], b: [0.65, 0.62, 1.1] }] },
    { kicker: 'السنغال', img: 'sn-president.jpg', moves: [{ t: 17.80, a: [0.5, 0.45, 1.0], b: [0.5, 0.42, 1.1] }] },
    // Western Sahara
    { img: 'unsc-vote.jpg', moves: [{ t: 20.04, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.14] }] },
    { img: 'minurso.jpg', moves: [{ t: 30.82, a: [0.5, 0.6, 1.0], b: [0.55, 0.62, 1.14] }] },
    // Mali
    { img: 'ml-drone.webp', moves: [{ t: 41.88, a: [0.5, 0.5, 1.0], b: [0.6, 0.5, 1.12] },
                                    { t: 56.28, a: [0.55, 0.5, 1.25], b: [0.5, 0.5, 1.12] }] },
    // Mauritania: the president leaves Moscow
    { img: 'mr-ru-putin.jpg', moves: [{ t: 65.40, a: [0.5, 0.4, 1.0], b: [0.5, 0.35, 1.12] },
                                      { t: 79.54, a: [0.3, 0.3, 1.35], b: [0.32, 0.3, 1.2] }] },
    // Mauritania: power cuts
    { img: 'mr-electricity.jpg', moves: [{ t: 90.94, a: [0.5, 0.5, 1.0], b: [0.45, 0.45, 1.14] },
                                         { t: 103.72, a: [0.6, 0.4, 1.3], b: [0.55, 0.45, 1.15] }] },
    // Mauritania: doctors
    { img: 'mr-doctors.jpg', moves: [{ t: 114.14, a: [0.55, 0.35, 1.0], b: [0.55, 0.3, 1.12] }] },
    { img: 'mr-hospital.jpg', moves: [{ t: 121.28, a: [0.35, 0.38, 1.3], b: [0.38, 0.35, 1.4] }] },
    // Morocco
    { img: 'ma-finance.jpg', moves: [{ t: 130.66, a: [0.5, 0.5, 1.0], b: [0.4, 0.5, 1.14] }] },
    { img: 'ma-parliament.jpg', moves: [{ t: 137.22, a: [0.5, 0.45, 1.0], b: [0.5, 0.5, 1.14] }] },
    // Algeria
    { img: 'dz-parliament.webp', moves: [{ t: 147.80, a: [0.5, 0.5, 1.0], b: [0.6, 0.5, 1.14] }] },
    { img: 'dz-pm-summit.jpg', moves: [{ t: 160.76, a: [0.6, 0.4, 1.0], b: [0.62, 0.35, 1.12] }] },
    { img: 'dz-pm-putin.jpg', moves: [{ t: 170.64, a: [0.5, 0.4, 1.0], b: [0.5, 0.35, 1.1] }] },
    // Tunisia
    { img: 'tn-pm-kremlin.jpg', moves: [{ t: 176.40, a: [0.55, 0.45, 1.0], b: [0.55, 0.4, 1.14] }] },
    { img: 'tn-pm-putin.jpg', moves: [{ t: 185.52, a: [0.5, 0.4, 1.0], b: [0.5, 0.35, 1.12] }] },
    // Libya
    { img: 'ly-central-bank.jpg', moves: [{ t: 195.96, a: [0.6, 0.6, 1.0], b: [0.65, 0.62, 1.12] }] },
    { img: 'ly-cbl-board.jpg', moves: [{ t: 202.94, a: [0.5, 0.45, 1.0], b: [0.5, 0.42, 1.14] }] },
    // Senegal
    { img: 'sn-president.jpg', moves: [{ t: 212.30, a: [0.52, 0.45, 1.0], b: [0.52, 0.42, 1.14] }] },
    { img: 'sn-cabinet.jpg', moves: [{ t: 220.84, a: [0.55, 0.4, 1.0], b: [0.55, 0.38, 1.12] }] },
    // wrap-up
    { img: 'unsc-vote.jpg', moves: [{ t: 235.26, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
    { img: 'mr-ru-putin.jpg', moves: [{ t: 237.40, a: [0.5, 0.4, 1.05], b: [0.5, 0.38, 1.15] }] },
    { img: 'ly-central-bank.jpg', moves: [{ t: 239.60, a: [0.6, 0.6, 1.05], b: [0.6, 0.6, 1.15] }] },
  ],

  headlines: [
    { t: 0.0, kicker: 'الموجز الإخباري', text: 'من مجلس الأمن إلى شمال مالي: أبرز أحداث اليوم في المغرب العربي وغرب إفريقيا' },
    { t: 20.04, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'مجلس الأمن يصوّت الجمعة على مشروع القرار الأمريكي بشأن بعثة مينورسو' },
    { t: 30.82, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'تعديلات على المسودة وتباين حول الحكم الذاتي وتقرير المصير' },
    { t: 41.88, kicker: 'مالي', topic: 'أمن', text: 'ناشطون: مقتل 13 مدنيا على الأقل في ضربة جوية قرب الحدود الموريتانية' },
    { t: 56.28, kicker: 'مالي', topic: 'أمن', text: 'الجيش المالي يؤكد استهداف تجمع لمسلحين ولا تحقق مستقلا من هويات الضحايا' },
    { t: 65.40, kicker: 'موريتانيا', topic: 'دبلوماسية', text: 'الرئيس الغزواني يغادر موسكو قبل لقاء ثنائي كان مرتقبا مع بوتين' },
    { t: 79.54, kicker: 'موريتانيا', topic: 'دبلوماسية', text: 'مغادرة مبكرة لم تتضح أسبابها وتوقيع اتفاقيتين للتعاون القضائي' },
    { t: 90.94, kicker: 'موريتانيا', topic: 'مجتمع', text: 'صوملك تبرمج انقطاعات مؤقتة للكهرباء في 5 مقاطعات بنواكشوط' },
    { t: 103.72, kicker: 'موريتانيا', topic: 'مجتمع', text: 'تفرغ زينة ولكصر وتيارت ودار النعيم وعرفات لمدة تصل إلى 4 ساعات' },
    { t: 114.14, kicker: 'موريتانيا', topic: 'مجتمع', text: 'حلول بديلة للأطباء الذين تعذر تسجيلهم في التخصص بالجزائر' },
    { t: 124.88, kicker: 'موريتانيا', topic: 'مجتمع', text: 'فرص دراسية في دول أخرى بسبب محدودية المقاعد المتاحة' },
    { t: 130.66, kicker: 'المغرب', topic: 'اقتصاد', text: 'البرلمان يواصل مناقشة مشروع قانون المالية لعام 2027' },
    { t: 137.22, kicker: 'المغرب', topic: 'اقتصاد', text: 'جدل حول القدرة الشرائية والتشغيل والتزامات الحكومة الجديدة' },
    { t: 147.80, kicker: 'الجزائر', topic: 'سياسة', text: 'حملة الانتخابات المحلية تنطلق في 5 نوفمبر قبل اقتراع 28 نوفمبر' },
    { t: 160.76, kicker: 'الجزائر', topic: 'دبلوماسية', text: 'الوزير الأول يلقي كلمة الجزائر في القمة الروسية الإفريقية بموسكو' },
    { t: 176.40, kicker: 'تونس', topic: 'دبلوماسية', text: 'رئيسة الحكومة سارة الزعفراني الزنزري في القمة الروسية الإفريقية' },
    { t: 188.54, kicker: 'تونس', topic: 'اقتصاد', text: 'بحث توسيع التعاون مع روسيا في التجارة والتكنولوجيا والصادرات' },
    { t: 195.96, kicker: 'ليبيا', topic: 'اقتصاد', text: 'المصرف المركزي يشكل لجنتين للمراجعة والمخاطر والسياسة النقدية' },
    { t: 202.94, kicker: 'ليبيا', topic: 'اقتصاد', text: 'تنظيم استخدامات النقد الأجنبي لدعم استقرار سعر الصرف' },
    { t: 212.30, kicker: 'السنغال', topic: 'اقتصاد', text: 'الرئيس فاي يدعو إلى تسريع تسوية الديون الداخلية واستئناف المشاريع' },
    { t: 225.72, kicker: 'السنغال', topic: 'مجتمع', text: 'داكار تستعد لافتتاح الألعاب الأولمبية للشباب يوم السبت' },
    { t: 235.26, kicker: 'الموجز الإخباري', text: 'كانت هذه أبرز التطورات المغاربية والإفريقية' },
  ],

  chapters: [20.04, 41.88, 65.40, 90.94, 114.14, 130.66, 147.80, 176.40, 195.96, 212.30],

  camera: [
    { t: 0.0, lon: 0, lat: 24.5, w: 58, d: 0.01 },
    { t: 19.9, lon: -12.6, lat: 24.6, w: 24, d: 1.8 },
    { t: 41.7, lon: -6.0, lat: 18.0, w: 30, d: 2.0 },
    { t: 65.2, lon: -11.5, lat: 20.0, w: 26, d: 2.0 },
    { t: 90.8, lon: -14.5, lat: 19.0, w: 18, d: 2.0 },
    { t: 114.0, lon: -5.0, lat: 27.0, w: 40, d: 2.0 },
    { t: 130.5, lon: -7.0, lat: 31.6, w: 24, d: 2.0 },
    { t: 147.6, lon: 2.5, lat: 29.5, w: 34, d: 2.0 },
    { t: 176.2, lon: 9.8, lat: 35.0, w: 20, d: 2.0 },
    { t: 195.8, lon: 17.5, lat: 28.5, w: 30, d: 2.0 },
    { t: 212.1, lon: -15.2, lat: 14.3, w: 14, d: 2.2 },
    { t: 235.1, lon: 0, lat: 24.5, w: 58, d: 2.2 },
  ],

  highlights: [
    { t: 0.0, end: 19.9, kind: 'primary', ids: ['732', '466', '478', '504', '012', '788', '434', '686'], origin: [-15.98, 18.09] },
    { t: 20.4, end: 41.6, kind: 'primary', ids: ['732'], origin: [-12.9, 24.6] },
    { t: 34.3, end: 41.6, kind: 'secondary', ids: ['504'], origin: [-6.84, 34.02] },
    { t: 42.2, end: 65.0, kind: 'primary', ids: ['466'], origin: [-4.0, 17.0] },
    { t: 53.3, end: 65.0, kind: 'secondary', ids: ['478'], origin: [-6.5, 16.0] },
    { t: 65.7, end: 130.3, kind: 'primary', ids: ['478'], origin: [-15.98, 18.09] },
    { t: 118.2, end: 130.3, kind: 'secondary', ids: ['012'], origin: [3.06, 36.75] },
    { t: 131.0, end: 147.4, kind: 'primary', ids: ['504'], origin: [-6.84, 34.02] },
    { t: 148.1, end: 176.0, kind: 'primary', ids: ['012'], origin: [3.06, 36.75] },
    { t: 173.2, end: 176.0, kind: 'secondary', ids: ['732'], origin: [-12.9, 24.6] },
    { t: 176.7, end: 195.6, kind: 'primary', ids: ['788'], origin: [10.18, 36.81] },
    { t: 196.3, end: 212.0, kind: 'primary', ids: ['434'], origin: [13.19, 32.89] },
    { t: 212.6, end: 235.0, kind: 'primary', ids: ['686'], origin: [-17.44, 14.69] },
    { t: 235.6, end: 244.0, kind: 'primary', ids: ['732', '466', '478', '504', '012', '788', '434', '686'], origin: [-15.98, 18.09] },
  ],

  pins: [
    { t: 1.0, end: 19.8, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'left' },
    { t: 20.8, end: 41.5, lon: -12.9, lat: 24.6, label: 'الصحراء الغربية', side: 'left', dot: false },
    { t: 34.6, end: 41.5, lon: -6.84, lat: 34.02, label: 'الرباط', side: 'right' },
    { t: 42.6, end: 64.8, lon: -1.5, lat: 19.5, label: 'شمال مالي', side: 'right', dot: false },
    { t: 46.0, end: 64.8, lon: -8.0, lat: 12.64, label: 'باماكو', side: 'right' },
    { t: 66.0, end: 90.6, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right', main: true },
    { t: 91.6, end: 113.8, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right', main: true },
    { t: 114.8, end: 130.2, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'down', main: true },
    { t: 118.6, end: 130.2, lon: 3.06, lat: 36.75, label: 'الجزائر العاصمة', side: 'down' },
    { t: 131.4, end: 147.2, lon: -6.84, lat: 34.02, label: 'الرباط', side: 'right', main: true },
    { t: 148.6, end: 175.8, lon: 3.06, lat: 36.75, label: 'الجزائر العاصمة', side: 'down', main: true },
    { t: 177.2, end: 195.4, lon: 10.18, lat: 36.81, label: 'تونس', side: 'down', main: true },
    { t: 196.8, end: 211.8, lon: 13.19, lat: 32.89, label: 'طرابلس', side: 'down', main: true },
    { t: 213.0, end: 234.8, lon: -17.44, lat: 14.69, label: 'داكار', side: 'right', main: true },
  ],

  lines: [
    { t: 121.4, dur: 2.2, end: 130.2, from: [-15.98, 18.09], to: [3.06, 36.75], curve: 0.15, style: 'cancel' },
  ],

  stats: [],
};
