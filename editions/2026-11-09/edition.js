// Edition of 9 Nov 2026. All times are in seconds of the ORIGINAL voice-over (voiceover.mp3 in this
// folder). Voice: ElevenLabs "Hamida" (AI), three parts: opening 0 - 12.04, body 12.74 - 194.45,
// closing 195.20 - end. Edition without the anchor (user's decision): teaser photos open and close it.
// ml-sn-flags is a drawn card (tools/flags.py): the Goita photos supplied show a Beninese visitor, not
// Cheikh Niang, so they are not used.
// YouTube (16:9) crops the photos vertically: some cards get their own framing there (YT ? youtube : feed).
const YT = /format=youtube/.test(location.search);
window.TIMELINE = {
  date: 'الاثنين 9 نوفمبر 2026',
  title: 'الموجز الإخباري',
  audioCut: 0.0,
  audioEnd: 206.62,
  intro: 7.0,
  outroAt: 195.20,
  tail: 3.0,

  hook: { img: 'mr-parliament-wide.jpg', f: [0.45, 0.45], kicker: 'موريتانيا', topic: 'سياسة',
          text: 'دعوات نيابية لتمكين الغزواني من مأمورية ثالثة' },

  cards: [
    // opening teasers
    { kicker: 'موريتانيا', img: 'mr-parliament-wide.jpg', moves: [{ t: 0.0, a: [0.5, 0.45, 1.12], b: [0.45, 0.45, 1.0] }] },
    { kicker: 'المغرب', img: 'ma-ecuador-bourita.jpg', moves: [YT ? { t: 3.14, a: [0.5, 0.0, 1.0], b: [0.5, 0.0, 1.04] } : { t: 3.14, a: [0.5, 0.3, 1.0], b: [0.5, 0.28, 1.08] }] },
    { kicker: 'تونس', img: 'tn-dam-low.jpg', moves: [{ t: 8.24, a: [0.5, 0.45, 1.0], b: [0.55, 0.45, 1.1] }] },
    // Mauritania: third-term calls
    { kicker: 'موريتانيا', img: 'mr-parliament-wide.jpg', moves: [{ t: 12.68, a: [0.45, 0.4, 1.0], b: [0.4, 0.38, 1.12] }] },
    { img: 'mr-government-benches.jpg', moves: [{ t: 21.00, a: [0.6, 0.35, 1.0], b: [0.65, 0.35, 1.1] }] },
    { img: 'mr-cheikh-ould-amine.jpg', moves: [YT ? { t: 27.16, a: [0.5, 0.3, 1.0], b: [0.5, 0.3, 1.06] } : { t: 27.16, a: [0.55, 0.35, 1.0], b: [0.55, 0.33, 1.08] }] },
    { img: 'mr-jamila-nahah.jpg', moves: [YT ? { t: 30.54, a: [0.5, 0.27, 1.0], b: [0.5, 0.26, 1.04] } : { t: 30.54, a: [0.5, 0.18, 1.0], b: [0.5, 0.16, 1.06] }] },
    { img: 'mr-parliament-wide.jpg', moves: [{ t: 34.58, a: [0.3, 0.5, 1.2], b: [0.5, 0.45, 1.05] }] },
    // Mauritania: electricity company fires
    { img: 'mr-mp-sidi-maouloud.jpg', moves: [YT ? { t: 43.46, a: [0.45, 0.0, 1.0], b: [0.45, 0.0, 1.03] } : { t: 43.46, a: [0.45, 0.3, 1.0], b: [0.45, 0.28, 1.1] }] },
    { img: 'mr-government-benches.jpg', moves: [{ t: 52.16, a: [0.35, 0.55, 1.15], b: [0.6, 0.5, 1.15] }] },
    { img: 'mr-mp-sidi-maouloud.jpg', moves: [YT ? { t: 59.46, a: [0.45, 0.0, 1.03], b: [0.45, 0.0, 1.0] } : { t: 59.46, a: [0.45, 0.28, 1.12], b: [0.45, 0.3, 1.0] }] },
    // Mali: Goita receives Senegal's foreign minister
    { img: 'ml-sn-flags.jpg', moves: [{ t: 63.62, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }] },
    { img: 'ml-goita-faye.jpg', moves: [{ t: 70.16, a: [0.5, 0.35, 1.0], b: [0.5, 0.33, 1.1] }] },
    { img: 'ml-sn-flags.jpg', moves: [{ t: 78.72, a: [0.5, 0.5, 1.06], b: [0.5, 0.5, 1.0] }] },
    { img: 'ml-goita-faye.jpg', moves: [{ t: 84.80, a: [0.7, 0.35, 1.2], b: [0.6, 0.35, 1.1] }] },
    // Senegal: Faye to the Paris Peace Forum
    { img: 'sn-faye-plane.jpg', moves: [{ t: 89.46, a: [0.4, 0.3, 1.0], b: [0.4, 0.28, 1.1] }] },
    { img: 'sn-faye-stairs.jpg', moves: [{ t: 94.00, a: [0.55, 0.3, 1.0], b: [0.55, 0.28, 1.1] }] },
    { img: 'sn-faye-forum.jpg', moves: [{ t: 103.12, a: [0.5, 0.35, 1.0], b: [0.5, 0.33, 1.1] }] },
    // Morocco: Ecuador backs Morocco's position on Western Sahara
    { img: 'ma-ecuador-bourita.jpg', moves: [YT ? { t: 107.06, a: [0.5, 0.0, 1.0], b: [0.5, 0.0, 1.04] } : { t: 107.06, a: [0.5, 0.3, 1.0], b: [0.5, 0.28, 1.08] }] },
    { img: 'ma-ecuador-bourita.jpg', moves: [YT ? { t: 116.96, a: [0.4, 0.0, 1.08], b: [0.6, 0.0, 1.08] } : { t: 116.96, a: [0.3, 0.3, 1.25], b: [0.7, 0.3, 1.25] }] },
    // Libya: salary protests in Tripoli
    { img: 'ly-tripoli-protest.jpg', moves: [{ t: 126.82, a: [0.5, 0.4, 1.0], b: [0.45, 0.4, 1.1] }] },
    { img: 'ly-audit-bureau.jpg', moves: [{ t: 135.50, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.1] }] },
    { img: 'ly-tripoli-protest.jpg', moves: [{ t: 142.10, a: [0.3, 0.4, 1.15], b: [0.6, 0.4, 1.15] }] },
    // Algeria: 2027 finance bill
    { img: 'dz-apn-bureau.jpg', moves: [{ t: 148.30, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.1] }] },
    { img: 'dz-finance-committee.jpg', moves: [{ t: 158.42, a: [0.5, 0.35, 1.0], b: [0.5, 0.33, 1.08] }] },
    { img: 'dz-apn-vote.jpg', moves: [{ t: 163.50, a: [0.5, 0.4, 1.0], b: [0.55, 0.4, 1.1] }] },
    // Tunisia: water projects, olive oil producers
    { img: 'tn-dam-low.jpg', moves: [{ t: 168.40, a: [0.5, 0.45, 1.0], b: [0.5, 0.45, 1.1] }] },
    { img: 'tn-dam-kammoun.jpg', credit: 'Zaher Kammoun', moves: [{ t: 176.88, a: [0.5, 0.4, 1.0], b: [0.55, 0.4, 1.08] }] },
    { img: 'tn-desalination.jpg', moves: [{ t: 181.10, a: [0.5, 0.45, 1.0], b: [0.5, 0.45, 1.1] }] },
    { img: 'tn-dam-low.jpg', moves: [{ t: 185.52, a: [0.65, 0.45, 1.2], b: [0.5, 0.45, 1.05] }] },
    // closing
    { img: 'dz-apn-vote.jpg', moves: [{ t: 195.20, a: [0.5, 0.4, 1.1], b: [0.5, 0.4, 1.0] }] },
  ],

  headlines: [
    { t: 0.0, kicker: 'الموجز الإخباري', text: 'أحدث تطورات موريتانيا والمغرب العربي والساحل' },
    { t: 12.68, kicker: 'موريتانيا', topic: 'سياسة', text: 'دعوات نيابية لتمكين الغزواني من مأمورية ثالثة تثير جدلا' },
    { t: 27.16, kicker: 'موريتانيا', topic: 'سياسة', text: 'نائبان يدعوان إلى إتاحة الفرصة للرئيس للاستمرار في الحكم' },
    { t: 41.20, kicker: 'موريتانيا', topic: 'سياسة', text: 'نائب معارض ينتقد تعامل الحكومة مع حرائق منشآت الكهرباء' },
    { t: 56.06, kicker: 'موريتانيا', topic: 'سياسة', text: 'انتقاد لإعادة تعيين مسؤولين حملهم التقرير مسؤوليات' },
    { t: 63.62, kicker: 'مالي', topic: 'دبلوماسية', text: 'غويتا يستقبل وزير الخارجية السنغالي الشيخ نيانغ' },
    { t: 76.84, kicker: 'مالي', topic: 'دبلوماسية', text: 'مساع لتقريب وجهات النظر بين تحالف الساحل وإيكواس' },
    { t: 89.46, kicker: 'السنغال', topic: 'دبلوماسية', text: 'الرئيس فاي يتوجه إلى باريس للمشاركة في منتدى السلام' },
    { t: 97.98, kicker: 'السنغال', topic: 'دبلوماسية', text: 'تحركات دبلوماسية تشمل المشاركة في القمة الفرنكوفونية' },
    { t: 107.06, kicker: 'المغرب', topic: 'دبلوماسية', text: 'الإكوادور تعلن دعمها للموقف المغربي بشأن الصحراء الغربية' },
    { t: 116.96, kicker: 'المغرب', topic: 'دبلوماسية', text: 'موقف جديد في سياق التحركات الدبلوماسية حول النزاع' },
    { t: 126.82, kicker: 'ليبيا', topic: 'اقتصاد', text: 'احتجاجات في مؤسسات رقابية بطرابلس على تخفيض رواتب أكتوبر' },
    { t: 142.10, kicker: 'ليبيا', topic: 'اقتصاد', text: 'الاحتجاجات تعيد ملف إصلاح منظومة الرواتب إلى الواجهة' },
    { t: 148.30, kicker: 'الجزائر', topic: 'اقتصاد', text: 'تواصل الإجراءات التشريعية لمشروع قانون المالية 2027' },
    { t: 155.94, kicker: 'الجزائر', topic: 'اقتصاد', text: 'مكتب المجلس الشعبي الوطني يدرس التعديلات المقترحة' },
    { t: 168.40, kicker: 'تونس', topic: 'اقتصاد', text: 'أكثر من 786 مليون دينار لمشاريع المياه في ميزانية العام المقبل' },
    { t: 185.52, kicker: 'تونس', topic: 'اقتصاد', text: 'تمويل لدعم صغار المنتجين في قطاع زيت الزيتون' },
    { t: 195.20, kicker: 'الموجز الإخباري', text: 'شكرا لمتابعتكم وإلى اللقاء في موجز جديد' },
  ],

  chapters: [12.68, 41.20, 63.62, 89.46, 107.06, 126.82, 148.30, 168.40],

  camera: [
    { t: 0.0, lon: 0, lat: 24.5, w: 58, d: 0.01 },
    { t: 12.5, lon: -11.0, lat: 20.0, w: 24, d: 1.8 },
    { t: 63.4, lon: -10.0, lat: 15.5, w: 24, d: 2.0 },
    { t: 89.3, lon: -14.5, lat: 14.5, w: 16, d: 2.0 },
    { t: 106.9, lon: -8.0, lat: 28.5, w: 24, d: 2.0 },
    { t: 126.6, lon: 16.0, lat: 28.5, w: 26, d: 2.0 },
    { t: 148.1, lon: 3.0, lat: 30.0, w: 26, d: 2.0 },
    { t: 168.2, lon: 9.5, lat: 34.0, w: 14, d: 2.0 },
    { t: 195.0, lon: 0, lat: 24.5, w: 58, d: 2.2 },
  ],

  highlights: [
    { t: 0.0, end: 11.8, kind: 'primary', ids: ['478', '466', '686', '504', '434', '012', '788'], origin: [-15.98, 18.09] },
    { t: 13.0, end: 63.2, kind: 'primary', ids: ['478'], origin: [-15.98, 18.09] },
    { t: 63.9, end: 89.0, kind: 'primary', ids: ['466'], origin: [-8.0, 12.64] },
    { t: 65.5, end: 89.0, kind: 'secondary', ids: ['686'], origin: [-17.44, 14.69] },
    { t: 89.8, end: 106.6, kind: 'primary', ids: ['686'], origin: [-17.44, 14.69] },
    { t: 107.4, end: 126.4, kind: 'primary', ids: ['504'], origin: [-6.84, 34.02] },
    { t: 127.2, end: 147.9, kind: 'primary', ids: ['434'], origin: [13.19, 32.89] },
    { t: 148.6, end: 168.0, kind: 'primary', ids: ['012'], origin: [3.06, 36.75] },
    { t: 168.7, end: 194.6, kind: 'primary', ids: ['788'], origin: [10.18, 36.81] },
    { t: 195.5, end: 205.5, kind: 'primary', ids: ['478', '466', '686', '504', '434', '012', '788'], origin: [-15.98, 18.09] },
  ],

  pins: [
    { t: 13.2, end: 63.0, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right', main: true },
    { t: 64.0, end: 88.8, lon: -8.0, lat: 12.64, label: 'باماكو', side: 'right', main: true },
    { t: 66.0, end: 88.8, lon: -17.44, lat: 14.69, label: 'دكار', side: 'left' },
    { t: 90.0, end: 106.4, lon: -17.44, lat: 14.69, label: 'دكار', side: 'right', main: true },
    { t: 107.6, end: 126.2, lon: -6.84, lat: 34.02, label: 'الرباط', side: 'right', main: true },
    { t: 127.4, end: 147.7, lon: 13.19, lat: 32.89, label: 'طرابلس', side: 'left', main: true },
    { t: 148.8, end: 167.8, lon: 3.06, lat: 36.75, label: 'الجزائر', side: 'right', main: true },
    { t: 168.9, end: 194.4, lon: 10.18, lat: 36.81, label: 'تونس', side: 'right', main: true },
  ],

  lines: [
    { t: 66.5, dur: 2.0, end: 88.8, from: [-17.44, 14.69], to: [-8.0, 12.64], curve: -0.18, style: 'arc' },
  ],

  stats: [],
};
