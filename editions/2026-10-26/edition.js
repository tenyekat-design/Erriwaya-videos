// Edition of 26 Oct 2026. All times are in seconds of the ORIGINAL voice-over (voiceover.mp3 in this
// folder, generated with ElevenLabs from the script); the template maps them onto the video timeline.
// Images are files in ./img, video clips in ./clips (played muted inside the card).
window.TIMELINE = {
  date: 'الاثنين 26 أكتوبر 2026',
  title: 'الموجز الإخباري',
  audioCut: 0.0,      // the opening lines are part of the script: keep them
  audioEnd: 217.234,
  intro: 7.0,
  outroAt: 217.70,    // the outro and its music start after the last word
  tail: 9.0,          // outro length (the closing chord lands 4.5 s in)

  cards: [
    // opening teaser
    { img: 'be-courthouse.jpg', moves: [{ t: 0.0, a: [0.5, 0.5, 1.0], b: [0.55, 0.45, 1.12] }] },
    { img: 'ru-kremlin.jpg', moves: [{ t: 1.55, a: [0.45, 0.5, 1.0], b: [0.55, 0.5, 1.1] }] },
    { img: 'ma-butcher.jpg', moves: [{ t: 3.04, a: [0.5, 0.5, 1.0], b: [0.45, 0.5, 1.1] }] },
    { img: 'tn-missing.jpg', moves: [{ t: 4.66, a: [0.5, 0.55, 1.0], b: [0.5, 0.6, 1.12] }] },
    { img: 'ly-menfi-putin.jpg', moves: [{ t: 6.28, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.1] }] },
    { img: 'sn-dakar.jpg', moves: [{ t: 8.70, a: [0.5, 0.5, 1.0], b: [0.55, 0.55, 1.15] }] },
    // Mauritania
    { img: 'mr-ambassador-lux.jpg', moves: [{ t: 13.10, a: [0.5, 0.5, 1.0], b: [0.47, 0.45, 1.15] }] },
    { img: 'mr-ambassador.webp', moves: [{ t: 18.90, a: [0.45, 0.3, 1.0], b: [0.42, 0.25, 1.15] }] },
    { img: 'be-courthouse.jpg', moves: [{ t: 26.00, a: [0.4, 0.5, 1.0], b: [0.5, 0.45, 1.12] },
                                        { t: 33.20, a: [0.4, 0.3, 1.4], b: [0.45, 0.32, 1.2] }] },
    // Mali: Sangare verdict
    { img: 'ml-sangare-presser.jpg', moves: [{ t: 42.42, a: [0.5, 0.45, 1.0], b: [0.48, 0.35, 1.14] }] },
    { img: 'ml-sangare.jpg', moves: [{ t: 48.94, a: [0.5, 0.4, 1.0], b: [0.5, 0.35, 1.12] }] },
    { img: 'ml-sangare-presser.jpg', moves: [{ t: 57.32, a: [0.5, 0.3, 1.35], b: [0.5, 0.3, 1.2] }] },
    // Moscow: Goita and Menfi
    { img: 'ml-goita-salute.webp', moves: [{ t: 65.12, a: [0.45, 0.4, 1.0], b: [0.45, 0.3, 1.14] }] },
    { img: 'ml-goita-moscow.jpg', moves: [{ t: 73.26, a: [0.5, 0.5, 1.0], b: [0.45, 0.5, 1.12] }] },
    { img: 'ru-kremlin.jpg', moves: [{ t: 77.20, a: [0.4, 0.5, 1.0], b: [0.55, 0.5, 1.12] }] },
    { img: 'ly-menfi.jpg', moves: [{ t: 81.04, a: [0.5, 0.3, 1.0], b: [0.5, 0.25, 1.12] }] },
    { img: 'ly-menfi-putin.jpg', moves: [{ t: 87.50, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.12] }] },
    // Libya: chief of staff and France
    { img: 'ly-namroush.jpg', moves: [{ t: 92.90, a: [0.5, 0.5, 1.0], b: [0.5, 0.55, 1.12] },
                                      { t: 102.70, a: [0.25, 0.65, 1.5], b: [0.3, 0.65, 1.3] },
                                      { t: 108.90, a: [0.5, 0.55, 1.6], b: [0.5, 0.55, 1.4] }] },
    // Algeria: Czech prime minister (video of the business forum)
    { clip: 'dz-cz-forum.mp4', from: 0, moves: [{ t: 114.44, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }] },
    // Morocco: meat prices
    { img: 'ma-butcher.jpg', moves: [{ t: 131.68, a: [0.5, 0.5, 1.0], b: [0.62, 0.4, 1.12] }] },
    { img: 'ma-cattle.jpg', moves: [{ t: 138.20, a: [0.5, 0.5, 1.0], b: [0.45, 0.5, 1.12] }] },
    { img: 'ma-butcher.jpg', moves: [{ t: 150.74, a: [0.3, 0.5, 1.3], b: [0.6, 0.6, 1.2] }] },
    // Tunisia: the missing
    { img: 'tn-missing.jpg', moves: [{ t: 155.54, a: [0.5, 0.5, 1.0], b: [0.5, 0.65, 1.15] }] },
    { clip: 'tn-missing.mp4', from: 1.8, moves: [{ t: 165.30, a: [0.5, 0.5, 1.0], b: [0.5, 0.45, 1.08] }] },
    // Senegal: environment
    { img: 'sn-trees.jpg', moves: [{ t: 183.10, a: [0.5, 0.5, 1.0], b: [0.45, 0.45, 1.12] }] },
    { img: 'sn-waste.jpg', moves: [{ t: 189.02, a: [0.5, 0.5, 1.0], b: [0.55, 0.45, 1.12] }] },
    { img: 'sn-dakar.jpg', moves: [{ t: 195.78, a: [0.5, 0.5, 1.0], b: [0.5, 0.45, 1.15] }] },
    // wrap-up
    { img: 'ml-goita-moscow.jpg', moves: [{ t: 204.82, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
    { img: 'ma-cattle.jpg', moves: [{ t: 206.80, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
    { img: 'sn-trees.jpg', moves: [{ t: 208.70, a: [0.5, 0.5, 1.05], b: [0.5, 0.45, 1.2] }] },
  ],

  headlines: [
    { t: 0.0, kicker: 'الموجز الإخباري', text: 'من قاعات المحاكم إلى عواصم القرار: أبرز تطورات المغرب العربي وجواره' },
    { t: 13.10, kicker: 'موريتانيا', text: 'السفير لدى بلجيكا يوضح أسباب شكواه ضد الناشط محمد المختار ولد اعليوه' },
    { t: 26.00, kicker: 'موريتانيا', text: 'السفير يتحدث عن اتهامات بالفساد والناشط يربطها بتغيير مقر إقامته في بروكسل' },
    { t: 42.42, kicker: 'مالي', text: 'السجن 10 سنوات لعمدة باماكو السابق آدما سانغاري' },
    { t: 53.94, kicker: 'مالي', text: 'في قضية عقارات محيط المطار وأحكام تصل إلى 20 عاما بحق مسؤولين آخرين' },
    { t: 65.12, kicker: 'مالي', text: 'عاصمي غويتا في موسكو للمشاركة في القمة الروسية الإفريقية' },
    { t: 81.04, kicker: 'ليبيا', text: 'محمد لمنفي يتوجه إلى موسكو ولقاء مرتقب مع الرئيس فلاديمير بوتين' },
    { t: 92.90, kicker: 'ليبيا', text: 'رئيس الأركان صلاح الدين النمروش يبحث مع السفير الفرنسي التعاون العسكري' },
    { t: 105.76, kicker: 'ليبيا', text: 'تطوير قدرات القوات الخاصة ورفع جاهزيتها وتبادل الخبرات' },
    { t: 114.44, kicker: 'الجزائر', text: 'الوزير الأول سيفي غريب يجري محادثات مع نظيره التشيكي أندريه بابيش' },
    { t: 123.18, kicker: 'الجزائر', text: 'زيارة رسمية على رأس وفد تشيكي رفيع المستوى' },
    { t: 131.68, kicker: 'المغرب', text: 'مهنيون يحذرون من ارتفاع أسعار اللحوم بعد استنفاد حصة الاستيراد المعفاة' },
    { t: 144.34, kicker: 'المغرب', text: 'مطالب بحصة إضافية تضمن التموين خلال ما تبقى من السنة' },
    { t: 155.54, kicker: 'تونس', text: 'الصليب الأحمر يعيد تسليط الضوء على مأساة المفقودين' },
    { t: 170.16, kicker: 'تونس', text: 'أعدادهم بالآلاف وجمعيات تطالب بتكثيف البحث ومساندة الأسر' },
    { t: 183.10, kicker: 'السنغال', text: 'وزير البيئة يتعهد بتوسيع المساحات الخضراء وإصلاح الغابات المتدهورة' },
    { t: 195.78, kicker: 'السنغال', text: 'تحسين أحياء داكار يستمر بعد الألعاب الأولمبية للشباب' },
    { t: 204.82, kicker: 'الموجز الإخباري', text: 'تبقى العبرة بما يتغير في حياة الناس' },
  ],

  chapters: [13.10, 42.42, 65.12, 92.90, 114.44, 131.68, 155.54, 183.10],

  camera: [
    { t: 0.0, lon: 0, lat: 24.5, w: 58, d: 0.01 },
    { t: 12.9, lon: -11.5, lat: 20.0, w: 26, d: 1.8 },
    { t: 32.8, lon: 4.35, lat: 50.6, w: 20, d: 2.4 },
    { t: 42.2, lon: -8.0, lat: 13.2, w: 22, d: 2.4 },
    { t: 64.9, lon: 30.0, lat: 51.0, w: 50, d: 2.4 },
    { t: 80.9, lon: 24.0, lat: 45.0, w: 90, d: 2.2 },
    { t: 92.7, lon: 13.19, lat: 32.6, w: 26, d: 2.0 },
    { t: 114.2, lon: 3.06, lat: 36.2, w: 24, d: 2.0 },
    { t: 119.6, lon: 9.0, lat: 44.0, w: 50, d: 2.0 },
    { t: 131.5, lon: -7.0, lat: 31.6, w: 24, d: 2.0 },
    { t: 155.3, lon: 10.0, lat: 35.0, w: 20, d: 2.0 },
    { t: 182.9, lon: -15.2, lat: 14.3, w: 14, d: 2.2 },
    { t: 204.6, lon: 0, lat: 24.5, w: 58, d: 2.2 },
  ],

  highlights: [
    { t: 0.0, end: 12.9, kind: 'primary', ids: ['478', '504', '732', '012', '788', '434'], origin: [-15.98, 18.09] },
    { t: 13.4, end: 42.2, kind: 'primary', ids: ['478'], origin: [-15.98, 18.09] },
    { t: 21.5, end: 42.2, kind: 'secondary', ids: ['056'], origin: [4.35, 50.85] },
    { t: 42.7, end: 64.8, kind: 'primary', ids: ['466'], origin: [-8.0, 12.64] },
    { t: 81.3, end: 114.0, kind: 'primary', ids: ['434'], origin: [13.19, 32.89] },
    { t: 99.3, end: 114.0, kind: 'secondary', ids: ['250'], origin: [2.35, 48.86] },
    { t: 114.7, end: 131.4, kind: 'primary', ids: ['012'], origin: [3.06, 36.75] },
    { t: 119.9, end: 131.4, kind: 'secondary', ids: ['203'], origin: [14.42, 50.08] },
    { t: 132.0, end: 155.2, kind: 'primary', ids: ['504'], origin: [-6.84, 34.02] },
    { t: 155.8, end: 182.7, kind: 'primary', ids: ['788'], origin: [10.18, 36.81] },
    { t: 183.4, end: 204.4, kind: 'primary', ids: ['686'], origin: [-17.44, 14.69] },
    { t: 205.0, end: 217.6, kind: 'primary', ids: ['478', '504', '732', '012', '788', '434'], origin: [-15.98, 18.09] },
  ],

  pins: [
    { t: 1.0, end: 12.7, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'left' },
    { t: 13.6, end: 32.6, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right', main: true },
    { t: 33.6, end: 42.0, lon: 4.35, lat: 50.85, label: 'بروكسل', side: 'down', main: true },
    { t: 42.8, end: 64.7, lon: -8.0, lat: 12.64, label: 'باماكو', side: 'right', main: true },
    { t: 65.6, end: 92.5, lon: 37.62, lat: 55.75, label: 'موسكو', side: 'down', main: true },
    { t: 82.2, end: 92.5, lon: 13.19, lat: 32.89, label: 'طرابلس', side: 'right' },
    { t: 93.3, end: 114.0, lon: 13.19, lat: 32.89, label: 'طرابلس', side: 'down', main: true },
    { t: 114.8, end: 131.3, lon: 3.06, lat: 36.75, label: 'الجزائر العاصمة', side: 'down', main: true },
    { t: 120.6, end: 131.3, lon: 14.42, lat: 50.08, label: 'براغ', side: 'right' },
    { t: 132.2, end: 155.1, lon: -6.0, lat: 31.6, label: 'المغرب', dot: false },
    { t: 156.0, end: 182.6, lon: 10.18, lat: 36.81, label: 'تونس', side: 'down', main: true },
    { t: 183.6, end: 204.3, lon: -17.44, lat: 14.69, label: 'داكار', side: 'right', main: true },
  ],

  lines: [
    { t: 82.4, dur: 2.4, end: 92.5, from: [13.19, 32.89], to: [37.62, 55.75], curve: -0.15, style: 'route' },
    { t: 120.4, dur: 2.2, end: 131.3, from: [14.42, 50.08], to: [3.06, 36.75], curve: 0.18, style: 'arc' },
  ],

  stats: [
    { t: 49.6, end: 57.1, text: '10 سنوات', note: 'سجنا لعمدة باماكو السابق' },
    { t: 60.6, end: 64.7, text: '20 عاما', note: 'أعلى عقوبة في القضية' },
    { t: 76.6, end: 80.8, text: '28 – 29 أكتوبر', note: 'القمة الروسية الإفريقية' },
    { t: 141.0, end: 150.6, text: '300 ألف رأس', note: 'حصة الأبقار المعفاة من الرسوم' },
    { t: 198.0, end: 204.3, text: 'نهاية أكتوبر', note: 'الألعاب الأولمبية للشباب في داكار' },
  ],
};
