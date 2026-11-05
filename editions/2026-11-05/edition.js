// Edition of 5 Nov 2026. All times are in seconds of the ORIGINAL voice-over (voiceover.mp3 in this
// folder); the template maps them onto the video timeline. Images are files in ./img.
// voiceover.mp3 = voiceover-original.mp3 (ElevenLabs) with the extra «هو» after «خليفة» removed
// (122.79 -> 122.922 s of the original, 10 ms crossfade).
window.TIMELINE = {
  date: 'الخميس 5 نوفمبر 2026',
  title: 'الموجز الإخباري',
  audioCut: 0.0,      // the voice-over starts at "أهلا بكم"
  audioEnd: 174.235,
  intro: 7.0,
  outroAt: 171.12,    // "شكرا لمتابعتكم"
  tail: 3.0,

  hook: { img: 'minurso-laayoune.jpg', f: [0.5, 0.45], kicker: 'الصحراء الغربية', topic: 'دبلوماسية',
          text: 'بعثة مينورسو تدخل مرحلة تصفية أعمالها بعد إخفاق تمديد ولايتها' },

  cards: [
    // opening teaser: one card per story
    { kicker: 'الصحراء الغربية', img: 'minurso-laayoune.jpg', moves: [{ t: 0.0, a: [0.5, 0.45, 1.0], b: [0.5, 0.42, 1.1] }] },
    { kicker: 'السنغال', img: 'sn-assembly-session.jpg', moves: [{ t: 1.09, a: [0.5, 0.5, 1.0], b: [0.5, 0.45, 1.1] }] },
    { kicker: 'موريتانيا', img: 'mr-president-site.jpg', moves: [{ t: 2.18, a: [0.55, 0.4, 1.0], b: [0.55, 0.38, 1.1] }] },
    { kicker: 'الجزائر', img: 'dz-attaf-tiani.jpg', moves: [{ t: 3.27, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.1] }] },
    { kicker: 'ليبيا', img: 'ly-hor-session2.jpg', moves: [{ t: 4.36, a: [0.5, 0.5, 1.0], b: [0.5, 0.48, 1.1] }] },
    { kicker: 'النيجر', img: 'ne-ly-meeting.jpg', moves: [{ t: 5.45, a: [0.5, 0.45, 1.0], b: [0.45, 0.45, 1.1] }] },
    { kicker: 'مالي', img: 'ml-officials.jpg', moves: [{ t: 6.54, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.1] }] },
    { kicker: 'تونس', img: 'tn-parliament-arch.jpg', moves: [{ t: 7.63, a: [0.5, 0.45, 1.0], b: [0.5, 0.45, 1.1] }] },
    // Western Sahara
    { img: 'minurso-laayoune.jpg', moves: [{ t: 8.72, a: [0.5, 0.45, 1.0], b: [0.55, 0.45, 1.14] }] },
    { img: 'ma-king.jpg', moves: [{ t: 19.26, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.1] }] },
    { img: 'polisario-official.jpg', moves: [{ t: 23.26, a: [0.55, 0.35, 1.0], b: [0.55, 0.32, 1.1] }] },
    // Senegal
    { img: 'sn-assembly.jpg', moves: [{ t: 29.18, a: [0.5, 0.45, 1.0], b: [0.45, 0.5, 1.14] }] },
    { img: 'sn-assembly-session.jpg', moves: [{ t: 38.64, a: [0.5, 0.5, 1.0], b: [0.5, 0.45, 1.12] },
                                              { t: 44.02, a: [0.5, 0.4, 1.35], b: [0.55, 0.4, 1.22] }] },
    // Mauritania
    { img: 'mr-president-site.jpg', moves: [{ t: 50.26, a: [0.55, 0.4, 1.0], b: [0.56, 0.36, 1.14] }] },
    { img: 'mr-president-greeting.jpg', moves: [{ t: 60.08, a: [0.55, 0.4, 1.0], b: [0.5, 0.38, 1.12] }] },
    { img: 'mr-president-greeting2.jpg', moves: [{ t: 66.6, a: [0.5, 0.4, 1.0], b: [0.55, 0.38, 1.12] }] },
    // Algeria
    { img: 'dz-attaf-deby.jpg', moves: [{ t: 75.16, a: [0.5, 0.35, 1.0], b: [0.5, 0.32, 1.12] }] },
    { img: 'dz-attaf-chad-minister.jpg', moves: [{ t: 80.42, a: [0.45, 0.4, 1.0], b: [0.48, 0.38, 1.1] }] },
    { img: 'dz-attaf-niger-pm.jpg', moves: [{ t: 86.6, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.1] }] },
    { img: 'dz-attaf-tiani.jpg', moves: [{ t: 92.2, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.12] }] },
    // Libya
    { img: 'ly-hor-session2.jpg', moves: [{ t: 98.82, a: [0.5, 0.5, 1.0], b: [0.5, 0.45, 1.12] }] },
    { img: 'ly-abukhuzam.jpg', moves: [{ t: 102.86, a: [0.5, 0.35, 1.0], b: [0.5, 0.32, 1.08] }] },
    { img: 'ly-central-bank.jpg', moves: [{ t: 107.44, a: [0.5, 0.5, 1.0], b: [0.5, 0.55, 1.12] }] },
    { img: 'ly-hor-session.jpg', moves: [{ t: 111.0, a: [0.5, 0.5, 1.0], b: [0.45, 0.5, 1.12] }] },
    // Niger and eastern Libya
    { img: 'ne-ly-meeting.jpg', moves: [{ t: 114.32, a: [0.5, 0.45, 1.0], b: [0.4, 0.45, 1.14] }] },
    { img: 'ne-ly-handshake.jpg', moves: [{ t: 123.32, a: [0.5, 0.35, 1.0], b: [0.5, 0.32, 1.1] }] },
    // Mali
    { img: 'ml-officials.jpg', moves: [{ t: 130.88, a: [0.5, 0.4, 1.0], b: [0.55, 0.4, 1.12] },
                                       { t: 139.6, a: [0.35, 0.4, 1.3], b: [0.42, 0.4, 1.2] }] },
    // Tunisia
    { img: 'tn-meeting.jpg', moves: [{ t: 147.40, a: [0.5, 0.45, 1.0], b: [0.45, 0.5, 1.12] }] },
    { img: 'tn-parliament-facade.jpg', moves: [{ t: 152.42, a: [0.5, 0.45, 1.0], b: [0.5, 0.5, 1.1] }] },
    { img: 'tn-parliament-arch.jpg', moves: [{ t: 158.56, a: [0.5, 0.45, 1.0], b: [0.5, 0.45, 1.12] }] },
    { img: 'tn-parliament-hall.jpg', moves: [{ t: 162.26, a: [0.5, 0.5, 1.0], b: [0.5, 0.55, 1.12] }] },
    // wrap-up
    { img: 'minurso-laayoune.jpg', moves: [{ t: 167.18, a: [0.5, 0.45, 1.05], b: [0.5, 0.45, 1.15] }] },
    { img: 'mr-president-site.jpg', moves: [{ t: 168.70, a: [0.55, 0.4, 1.05], b: [0.55, 0.4, 1.15] }] },
    { img: 'dz-attaf-tiani.jpg', moves: [{ t: 170.10, a: [0.5, 0.4, 1.05], b: [0.5, 0.4, 1.15] }] },
  ],

  headlines: [
    { t: 0.0, kicker: 'الموجز الإخباري', text: 'أبرز التطورات في المغرب العربي ومنطقة الساحل الإفريقي' },
    { t: 8.72, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'بعثة مينورسو تدخل مرحلة تصفية أعمالها بعد إخفاق تمديد ولايتها' },
    { t: 19.26, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'المغرب يؤكد التزامه بوقف إطلاق النار والبوليساريو مستعدة لحوار جاد' },
    { t: 29.18, kicker: 'السنغال', topic: 'اقتصاد', text: 'البرلمان يرفض مشروع الميزانية التصحيحية لعام 2026' },
    { t: 38.64, kicker: 'السنغال', topic: 'سياسة', text: 'بدء دراسة ميزانية 2027 وتساؤلات حول العلاقة بين الحكومة والبرلمان' },
    { t: 50.26, kicker: 'موريتانيا', topic: 'اقتصاد', text: 'الغزواني يطلق المرحلة الثانية من البرنامج الاستعجالي لتنمية نواكشوط' },
    { t: 60.08, kicker: 'موريتانيا', topic: 'اقتصاد', text: '115 مليار أوقية قديمة لمدارس ومياه وكهرباء وطرق وجسور خلال 16 شهرا' },
    { t: 75.16, kicker: 'الجزائر', topic: 'دبلوماسية', text: 'عطاف في تشاد والنيجر لتعزيز التعاون الثنائي والأمن الإقليمي' },
    { t: 93.78, kicker: 'الجزائر', topic: 'دبلوماسية', text: 'مساع جزائرية لاستعادة الحضور في منطقة الساحل' },
    { t: 98.82, kicker: 'ليبيا', topic: 'اقتصاد', text: 'مجلس النواب يعيّن فوزي أبوخزام محافظا للمصرف المركزي' },
    { t: 107.44, kicker: 'ليبيا', topic: 'سياسة', text: 'خلفا لناجي عيسى وسط استمرار الانقسام بين شرق البلاد وغربها' },
    { t: 114.32, kicker: 'النيجر', topic: 'أمن', text: 'مذكرة تفاهم بين النيجر والقيادة العسكرية في شرق ليبيا' },
    { t: 123.32, kicker: 'النيجر', topic: 'أمن', text: 'تعزيز التعاون في ظل التحديات الأمنية في المنطقة الحدودية' },
    { t: 130.88, kicker: 'مالي', topic: 'مجتمع', text: 'تنسيق مع بوركينا فاسو بشأن مواطنين بوركينيين رحّلتهم غينيا إلى مالي' },
    { t: 142.02, kicker: 'مالي', topic: 'مجتمع', text: 'انتقادات لظروف الترحيل وجهود لتوفير مساعدات عاجلة' },
    { t: 147.40, kicker: 'تونس', topic: 'اقتصاد', text: 'رفع اعتمادات برنامج التنمية الجهوية إلى أكثر من 543 مليون دينار' },
    { t: 158.56, kicker: 'تونس', topic: 'اقتصاد', text: 'ضمن ميزانية 2027 لتمويل مشاريع تنموية وتحسين الخدمات والبنية التحتية' },
    { t: 167.18, kicker: 'الموجز الإخباري', text: 'إلى هنا نصل إلى ختام هذا الموجز' },
  ],

  chapters: [8.72, 29.18, 50.26, 75.16, 98.82, 114.32, 130.88, 147.40],

  camera: [
    { t: 0.0, lon: 0, lat: 24.5, w: 58, d: 0.01 },
    { t: 8.5, lon: -12.6, lat: 24.6, w: 24, d: 1.8 },
    { t: 29.0, lon: -15.2, lat: 14.3, w: 14, d: 2.2 },
    { t: 50.1, lon: -11.5, lat: 20.0, w: 26, d: 2.0 },
    { t: 75.0, lon: 9.0, lat: 24.5, w: 50, d: 2.0 },
    { t: 98.6, lon: 16.5, lat: 30.0, w: 26, d: 2.0 },
    { t: 114.1, lon: 11.0, lat: 22.5, w: 40, d: 2.0 },
    { t: 130.7, lon: -6.5, lat: 12.0, w: 26, d: 2.0 },
    { t: 147.2, lon: 9.6, lat: 34.6, w: 14, d: 2.0 },
    { t: 167.0, lon: 0, lat: 24.5, w: 58, d: 2.2 },
  ],

  highlights: [
    { t: 0.0, end: 8.5, kind: 'primary', ids: ['478', '504', '732', '012', '788', '434'], origin: [-15.98, 18.09] },
    { t: 9.0, end: 28.8, kind: 'primary', ids: ['732'], origin: [-12.9, 24.6] },
    { t: 19.6, end: 28.8, kind: 'secondary', ids: ['504'], origin: [-6.84, 34.02] },
    { t: 29.5, end: 49.9, kind: 'primary', ids: ['686'], origin: [-17.44, 14.69] },
    { t: 50.6, end: 74.8, kind: 'primary', ids: ['478'], origin: [-15.98, 18.09] },
    { t: 75.5, end: 98.4, kind: 'primary', ids: ['012'], origin: [3.06, 36.75] },
    { t: 84.6, end: 98.4, kind: 'secondary', ids: ['148', '562'], origin: [3.06, 36.75] },
    { t: 99.2, end: 113.9, kind: 'primary', ids: ['434'], origin: [20.07, 32.12] },
    { t: 114.6, end: 130.5, kind: 'primary', ids: ['562'], origin: [2.11, 13.51] },
    { t: 117.2, end: 130.5, kind: 'secondary', ids: ['434'], origin: [20.07, 32.12] },
    { t: 131.2, end: 147.0, kind: 'primary', ids: ['466'], origin: [-8.0, 12.64] },
    { t: 133.0, end: 147.0, kind: 'secondary', ids: ['854'], origin: [-1.53, 12.37] },
    { t: 139.0, end: 147.0, kind: 'secondary', ids: ['324'], origin: [-13.68, 9.51] },
    { t: 147.7, end: 166.8, kind: 'primary', ids: ['788'], origin: [10.18, 36.81] },
    { t: 168.0, end: 176.0, kind: 'primary', ids: ['478', '504', '732', '012', '788', '434'], origin: [-15.98, 18.09] },
  ],

  pins: [
    { t: 1.0, end: 8.3, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'left' },
    { t: 9.6, end: 28.6, lon: -12.9, lat: 24.6, label: 'الصحراء الغربية', side: 'left', dot: false },
    { t: 20.0, end: 28.6, lon: -6.84, lat: 34.02, label: 'الرباط', side: 'right' },
    { t: 30.0, end: 49.7, lon: -17.44, lat: 14.69, label: 'داكار', side: 'right', main: true },
    { t: 51.0, end: 74.6, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right', main: true },
    { t: 75.8, end: 98.2, lon: 3.06, lat: 36.75, label: 'الجزائر العاصمة', side: 'down', main: true },
    { t: 85.0, end: 98.2, lon: 15.04, lat: 12.13, label: 'انجامينا', side: 'right' },
    { t: 85.6, end: 98.2, lon: 2.11, lat: 13.51, label: 'نيامي', side: 'left' },
    { t: 99.6, end: 113.7, lon: 20.07, lat: 32.12, label: 'بنغازي', side: 'down', main: true },
    { t: 107.8, end: 113.7, lon: 13.19, lat: 32.89, label: 'طرابلس', side: 'left' },
    { t: 115.0, end: 130.3, lon: 2.11, lat: 13.51, label: 'نيامي', side: 'left', main: true },
    { t: 117.6, end: 130.3, lon: 20.07, lat: 32.12, label: 'بنغازي', side: 'right' },
    { t: 131.6, end: 146.8, lon: -8.0, lat: 12.64, label: 'باماكو', side: 'down', main: true },
    { t: 133.4, end: 146.8, lon: -1.53, lat: 12.37, label: 'واغادوغو', side: 'right' },
    { t: 139.2, end: 146.8, lon: -13.68, lat: 9.51, label: 'كوناكري', side: 'left' },
    { t: 148.0, end: 166.6, lon: 10.18, lat: 36.81, label: 'تونس', side: 'left', main: true },
  ],

  lines: [
    { t: 85.0, dur: 2.0, end: 98.2, from: [3.06, 36.75], to: [15.04, 12.13], curve: -0.15, style: 'arc' },
    { t: 85.6, dur: 2.0, end: 98.2, from: [3.06, 36.75], to: [2.11, 13.51], curve: 0.12, style: 'arc' },
    { t: 117.6, dur: 2.2, end: 130.3, from: [2.11, 13.51], to: [20.07, 32.12], curve: -0.15, style: 'arc' },
    { t: 139.2, dur: 2.2, end: 146.8, from: [-13.68, 9.51], to: [-8.0, 12.64], curve: 0.2, style: 'route' },
  ],

  stats: [
    { t: 31.0, end: 38.4, text: 'ميزانية 2026', note: 'رفضها البرلمان' },
    { t: 60.5, end: 67.0, value: 115, unit: 'مليار أوقية', note: 'كلفة المرحلة الثانية' },
    { t: 70.4, end: 74.6, value: 16, unit: 'شهرا', note: 'مدة التنفيذ' },
    { t: 154.5, end: 161.5, value: 543, unit: 'مليون دينار', note: 'للتنمية الجهوية' },
  ],
};
