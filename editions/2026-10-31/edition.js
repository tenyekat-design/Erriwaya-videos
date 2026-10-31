// Edition of 31 Oct 2026. All times are in seconds of the ORIGINAL voice-over (voiceover.mp3 in this
// folder); the template maps them onto the video timeline. Images are files in ./img.
// Voice-over: ElevenLabs "Hamida" read from the diacritized script, assembled from three parts
// (parts/part1-take2 + parts/part2a + parts/part2b-v4 from "إلى مالي"), loudness- and tone-matched.
window.TIMELINE = {
  date: 'السبت 31 أكتوبر 2026',
  title: 'الموجز الإخباري',
  audioCut: 0.0,      // keep the opening lead-in ("من مجلس الأمن ... نرصد لكم أبرز أحداث اليوم")
  audioEnd: 367.558,
  intro: 7.0,
  outroAt: 361.26,    // "كان هذا موجز أبرز الأخبار..." (reference only)
  tail: 3.0,

  // opening hook: the strongest story, full-frame, before the map intro
  hook: { img: 'unsc-vote.webp', f: [0.5, 0.42], kicker: 'الصحراء الغربية', topic: 'دبلوماسية',
          text: 'فيتو روسي يُسقط تمديد ولاية بعثة مينورسو' },

  cards: [
    // opening teaser (the lead-in names the Security Council, Dakar's Olympic event, then the region)
    { kicker: 'الصحراء الغربية', img: 'unsc-vote.webp', moves: [{ t: 0.0, a: [0.5, 0.45, 1.0], b: [0.48, 0.45, 1.12] }] },
    { kicker: 'السنغال', img: 'sn-cauldron.jpg', moves: [{ t: 6.36, a: [0.42, 0.42, 1.0], b: [0.4, 0.4, 1.1] }] },
    { kicker: 'الجزائر', img: 'dz-tebboune.webp', moves: [{ t: 11.36, a: [0.5, 0.4, 1.0], b: [0.5, 0.36, 1.1] }] },
    { kicker: 'ليبيا', img: 'ly-refinery.jpg', moves: [{ t: 13.40, a: [0.5, 0.5, 1.0], b: [0.55, 0.45, 1.1] }] },
    { kicker: 'مالي', img: 'ml-convoy.jpg', moves: [{ t: 15.40, a: [0.5, 0.5, 1.0], b: [0.45, 0.5, 1.1] }] },
    { kicker: 'المغرب', img: 'ma-office-changes.webp', moves: [{ t: 17.30, a: [0.5, 0.4, 1.0], b: [0.62, 0.35, 1.12] }] },
    { kicker: 'تونس', img: 'tn-zarzis.jpg', moves: [{ t: 19.16, a: [0.5, 0.5, 1.0], b: [0.5, 0.55, 1.1] }] },
    { kicker: 'موريتانيا', img: 'sn-summit.jpg', moves: [{ t: 22.60, a: [0.5, 0.35, 1.0], b: [0.5, 0.3, 1.1] }] },
    // Western Sahara
    { img: 'unsc-vote.webp', moves: [{ t: 26.28, a: [0.5, 0.5, 1.0], b: [0.5, 0.45, 1.14] },
                                     { t: 41.14, a: [0.42, 0.42, 1.55], b: [0.44, 0.38, 1.35] }] },
    { img: 'dz-tebboune.webp', moves: [{ t: 50.62, a: [0.5, 0.35, 1.0], b: [0.5, 0.3, 1.14] }] },
    { img: 'unsc-vote.webp', moves: [{ t: 64.08, a: [0.62, 0.55, 1.4], b: [0.55, 0.5, 1.2] },
                                     { t: 70.08, a: [0.5, 0.5, 1.12], b: [0.5, 0.5, 1.0] }] },
    // Mauritania: Dakar summit on sport and sustainable development
    { img: 'sn-summit.jpg', moves: [{ t: 78.64, a: [0.45, 0.32, 1.25], b: [0.47, 0.3, 1.45] },
                                    { t: 87.90, a: [0.5, 0.4, 1.0], b: [0.55, 0.38, 1.12] }] },
    { img: 'sn-stage.jpg', moves: [{ t: 93.90, a: [0.47, 0.42, 1.0], b: [0.47, 0.38, 1.14] }] },
    { img: 'sn-torch.jpg', moves: [{ t: 101.34, a: [0.6, 0.5, 1.0], b: [0.6, 0.45, 1.12] }] },
    // Mauritania: Guidimakha emergency programme
    { img: 'mr-guidimakha-town.jpg', moves: [{ t: 110.36, a: [0.5, 0.5, 1.0], b: [0.45, 0.5, 1.14] }] },
    { img: 'mr-guidimakha-mosque.jpg', moves: [{ t: 122.44, a: [0.5, 0.42, 1.0], b: [0.5, 0.4, 1.12] }] },
    // Algeria: presidential pardon
    { img: 'dz-tebboune.webp', moves: [{ t: 131.12, a: [0.5, 0.4, 1.0], b: [0.5, 0.35, 1.12] },
                                       { t: 147.08, a: [0.48, 0.3, 1.6], b: [0.48, 0.32, 1.4] },
                                       { t: 157.38, a: [0.2, 0.45, 1.3], b: [0.3, 0.42, 1.15] }] },
    // Morocco: foreign direct investment
    { img: 'ma-office-changes.webp', moves: [{ t: 165.34, a: [0.5, 0.45, 1.0], b: [0.6, 0.35, 1.15] },
                                             { t: 182.50, a: [0.72, 0.33, 1.6], b: [0.68, 0.35, 1.4] }] },
    // Tunisia: Zarzis economic activity zone
    { img: 'tn-zarzis.jpg', moves: [{ t: 197.98, a: [0.5, 0.5, 1.0], b: [0.45, 0.6, 1.15] },
                                    { t: 216.74, a: [0.6, 0.72, 1.4], b: [0.5, 0.7, 1.25] }] },
    // Libya: pipeline valve closed, Hamada field -> Zawiya refinery
    { img: 'ly-pipeline.webp', moves: [{ t: 235.29, a: [0.4, 0.45, 1.0], b: [0.35, 0.42, 1.14] }] },
    { img: 'ly-zawiya-tanks.jpg', moves: [{ t: 244.58, a: [0.5, 0.5, 1.0], b: [0.5, 0.55, 1.12] }] },
    { img: 'ly-refinery.jpg', moves: [{ t: 252.52, a: [0.5, 0.5, 1.0], b: [0.4, 0.45, 1.14] },
                                      { t: 267.78, a: [0.6, 0.4, 1.3], b: [0.55, 0.4, 1.15] }] },
    // Mali: fuel convoy reaches Bamako
    { img: 'ml-convoy.jpg', moves: [{ t: 276.38, a: [0.5, 0.5, 1.0], b: [0.4, 0.55, 1.15] }] },
    { img: 'ml-tankers.png', moves: [{ t: 289.44, a: [0.5, 0.5, 1.0], b: [0.55, 0.5, 1.1] }] },
    // Niger and Chad
    { img: 'ne-moscow.jpg', moves: [{ t: 298.32, a: [0.5, 0.45, 1.0], b: [0.6, 0.4, 1.15] }] },
    { img: 'td-minister.jpg', moves: [{ t: 310.64, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.12] }] },
    // Senegal: Dakar 2026 Youth Olympic Games
    { img: 'sn-summit.jpg', moves: [{ t: 323.52, a: [0.72, 0.38, 1.3], b: [0.7, 0.35, 1.5] }] },
    { img: 'sn-cauldron.jpg', moves: [{ t: 330.60, a: [0.42, 0.45, 1.0], b: [0.42, 0.42, 1.12] }] },
    { img: 'sn-drummer.jpg', moves: [{ t: 335.84, a: [0.45, 0.35, 1.0], b: [0.45, 0.32, 1.12] }] },
    { img: 'sn-parade.jpg', moves: [{ t: 342.02, a: [0.5, 0.5, 1.0], b: [0.5, 0.48, 1.1] }] },
    // wrap-up
    { img: 'unsc-vote.webp', moves: [{ t: 345.70, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
    { img: 'ly-refinery.jpg', moves: [{ t: 349.20, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
    { img: 'tn-zarzis.jpg', moves: [{ t: 351.58, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
    { img: 'sn-stage.jpg', moves: [{ t: 356.80, a: [0.5, 0.42, 1.05], b: [0.5, 0.42, 1.15] }] },
  ],

  headlines: [
    { t: 0.0, kicker: 'الموجز الإخباري', text: 'أبرز التطورات السياسية والاقتصادية والأمنية في المغرب العربي والساحل الإفريقي' },
    { t: 26.28, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'إخفاق مجلس الأمن في تمديد ولاية بعثة مينورسو بعد فيتو روسي' },
    { t: 50.62, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'الجزائر تأسف لعدم التجديد والمغرب يرحب ويدعو لإنهاء وجود البعثة' },
    { t: 70.08, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'البوليساريو: الفيتو الروسي منع مشروعا يمس حق تقرير المصير' },
    { t: 78.64, kicker: 'موريتانيا', topic: 'دبلوماسية', text: 'الرئيس الغزواني يشارك في قمة داكار حول الرياضة والتنمية المستدامة' },
    { t: 93.90, kicker: 'موريتانيا', topic: 'اقتصاد', text: 'القمة تبحث تحويل الاستثمار في الرياضة إلى فرص للتشغيل والتنمية' },
    { t: 110.36, kicker: 'موريتانيا', topic: 'مجتمع', text: 'إنجاز 54% من المرحلة الأولى للبرنامج الاستعجالي في كيدي ماغا' },
    { t: 122.44, kicker: 'موريتانيا', topic: 'مجتمع', text: 'اكتمال 115 تدخلا من أصل 215 وتسعة تدخلات لم تنطلق بعد' },
    { t: 131.12, kicker: 'الجزائر', topic: 'سياسة', text: 'الرئيس تبون يعفو عن 5539 محبوسا في الذكرى 72 لثورة أول نوفمبر' },
    { t: 147.08, kicker: 'الجزائر', topic: 'سياسة', text: 'عفو عن عقوبات لا تتجاوز 24 شهرا مع استثناء الإرهاب والقتل والفساد' },
    { t: 165.34, kicker: 'المغرب', topic: 'اقتصاد', text: 'صافي تدفقات الاستثمار الأجنبي المباشر يرتفع بنسبة 58.4%' },
    { t: 182.50, kicker: 'المغرب', topic: 'اقتصاد', text: 'نحو 35 مليارا و240 مليون درهم في الأشهر التسعة الأولى من العام' },
    { t: 197.98, kicker: 'تونس', topic: 'اقتصاد', text: 'ثلاثة مشاريع استثمارية جديدة في جرجيس بقيمة 213 مليون دينار' },
    { t: 216.74, kicker: 'تونس', topic: 'اقتصاد', text: 'بين 174 و190 فرصة عمل في قطاعي الحبوب والطاقة الحيوية' },
    { t: 235.29, kicker: 'ليبيا', topic: 'أمن', text: 'مجموعة مسلحة تغلق صماما رئيسيا في خط حقل الحمادة ومصفاة الزاوية' },
    { t: 252.52, kicker: 'ليبيا', topic: 'اقتصاد', text: 'المؤسسة الوطنية للنفط تحذر من فقدان 15 ألف برميل يوميا' },
    { t: 276.38, kicker: 'مالي', topic: 'أمن', text: 'وصول قافلة من 596 شاحنة صهريج محملة بالمحروقات إلى باماكو' },
    { t: 289.44, kicker: 'مالي', topic: 'أمن', text: 'بحماية الجيش لضمان تزويد العاصمة بالوقود رغم التحديات الأمنية' },
    { t: 298.32, kicker: 'النيجر وتشاد', topic: 'دبلوماسية', text: 'لقاء وزيري خارجية النيجر وتشاد على هامش قمة روسيا وإفريقيا' },
    { t: 310.64, kicker: 'النيجر وتشاد', topic: 'أمن', text: 'نيامي تتهم إنجامينا بضربة مسيرة قرب أغاديز وتشاد تنفي' },
    { t: 323.52, kicker: 'السنغال', topic: 'اقتصاد', text: 'الرئيس فاي يدعو لتحويل استثمارات أولمبياد الشباب داكار 2026 إلى وظائف' },
    { t: 335.84, kicker: 'السنغال', topic: 'مجتمع', text: 'إرث تنموي يتجاوز المنافسات ويعزز فرص الشباب والاقتصاد' },
    { t: 345.70, kicker: 'الموجز الإخباري', text: 'مرحلة جديدة تتداخل فيها الملفات السياسية والاقتصادية والأمنية' },
  ],

  chapters: [26.28, 78.64, 110.36, 131.12, 165.34, 197.98, 235.29, 276.38, 298.32, 323.52],

  camera: [
    { t: 0.0, lon: 0, lat: 24.5, w: 58, d: 0.01 },
    { t: 26.1, lon: -12.6, lat: 24.6, w: 24, d: 1.8 },
    { t: 50.4, lon: -6.0, lat: 29.0, w: 36, d: 2.0 },
    { t: 78.4, lon: -15.6, lat: 16.4, w: 14, d: 2.0 },
    { t: 110.2, lon: -12.4, lat: 16.2, w: 14, d: 2.0 },
    { t: 130.9, lon: 2.5, lat: 30.0, w: 32, d: 2.0 },
    { t: 165.1, lon: -7.0, lat: 31.6, w: 24, d: 2.0 },
    { t: 197.8, lon: 10.4, lat: 34.6, w: 14, d: 2.0 },
    { t: 235.1, lon: 13.0, lat: 31.0, w: 16, d: 2.0 },
    { t: 276.2, lon: -7.0, lat: 15.5, w: 26, d: 2.0 },
    { t: 298.1, lon: 10.0, lat: 15.5, w: 34, d: 2.0 },
    { t: 323.3, lon: -15.4, lat: 14.5, w: 14, d: 2.0 },
    { t: 345.5, lon: 0, lat: 24.5, w: 58, d: 2.2 },
  ],

  highlights: [
    { t: 0.0, end: 26.0, kind: 'primary', ids: ['732', '686', '478', '012', '504', '788', '434', '466', '562', '148'], origin: [-15.98, 18.09] },
    { t: 26.6, end: 78.4, kind: 'primary', ids: ['732'], origin: [-13.2, 27.15] },
    { t: 50.9, end: 64.0, kind: 'secondary', ids: ['012'], origin: [3.06, 36.75] },
    { t: 64.3, end: 78.4, kind: 'secondary', ids: ['504'], origin: [-6.84, 34.02] },
    { t: 78.9, end: 110.1, kind: 'primary', ids: ['478'], origin: [-15.98, 18.09] },
    { t: 81.0, end: 110.1, kind: 'secondary', ids: ['686'], origin: [-17.44, 14.69] },
    { t: 110.6, end: 130.8, kind: 'primary', ids: ['478'], origin: [-12.18, 15.16] },
    { t: 131.4, end: 165.0, kind: 'primary', ids: ['012'], origin: [3.06, 36.75] },
    { t: 165.6, end: 197.6, kind: 'primary', ids: ['504'], origin: [-6.84, 34.02] },
    { t: 198.3, end: 234.9, kind: 'primary', ids: ['788'], origin: [11.11, 33.5] },
    { t: 235.6, end: 276.0, kind: 'primary', ids: ['434'], origin: [12.73, 32.76] },
    { t: 276.7, end: 297.9, kind: 'primary', ids: ['466'], origin: [-8.0, 12.64] },
    { t: 298.6, end: 323.1, kind: 'primary', ids: ['562'], origin: [2.11, 13.51] },
    { t: 299.4, end: 323.1, kind: 'primary', ids: ['148'], origin: [15.04, 12.11] },
    { t: 323.8, end: 345.3, kind: 'primary', ids: ['686'], origin: [-17.44, 14.69] },
    { t: 346.2, end: 362.0, kind: 'primary', ids: ['732', '686', '478', '012', '504', '788', '434', '466', '562', '148'], origin: [-15.98, 18.09] },
  ],

  pins: [
    { t: 1.0, end: 25.8, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'left' },
    { t: 27.2, end: 78.2, lon: -12.9, lat: 24.6, label: 'الصحراء الغربية', side: 'left', dot: false },
    { t: 51.4, end: 63.8, lon: 3.06, lat: 36.75, label: 'الجزائر العاصمة', side: 'left' },
    { t: 64.8, end: 78.2, lon: -6.84, lat: 34.02, label: 'الرباط', side: 'right' },
    { t: 79.4, end: 109.9, lon: -17.44, lat: 14.69, label: 'داكار', side: 'down', main: true },
    { t: 80.4, end: 109.9, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right' },
    { t: 111.0, end: 130.6, lon: -12.18, lat: 15.16, label: 'كيدي ماغا', side: 'right', main: true },
    { t: 131.8, end: 164.8, lon: 3.06, lat: 36.75, label: 'الجزائر العاصمة', side: 'down', main: true },
    { t: 166.0, end: 197.4, lon: -6.84, lat: 34.02, label: 'الرباط', side: 'right', main: true },
    { t: 198.8, end: 234.8, lon: 11.11, lat: 33.5, label: 'جرجيس', side: 'right', main: true },
    { t: 236.0, end: 275.8, lon: 12.73, lat: 32.76, label: 'الزاوية', side: 'up', main: true },
    { t: 237.4, end: 275.8, lon: 12.2, lat: 29.6, label: 'حقل الحمادة', side: 'down' },
    { t: 277.0, end: 297.8, lon: -8.0, lat: 12.64, label: 'باماكو', side: 'right', main: true },
    { t: 299.0, end: 322.9, lon: 2.11, lat: 13.51, label: 'نيامي', side: 'left', main: true },
    { t: 299.8, end: 322.9, lon: 15.04, lat: 12.11, label: 'إنجامينا', side: 'right' },
    { t: 311.6, end: 322.9, lon: 7.99, lat: 16.97, label: 'أغاديز', side: 'up' },
    { t: 324.2, end: 345.1, lon: -17.44, lat: 14.69, label: 'داكار', side: 'right', main: true },
  ],

  lines: [
    { t: 236.4, dur: 2.2, end: 275.8, from: [12.2, 29.6], to: [12.73, 32.76], curve: 0.1, style: 'route' },
    { t: 300.4, dur: 2.2, end: 322.9, from: [2.11, 13.51], to: [15.04, 12.11], curve: 0.18, style: 'arc' },
  ],

  stats: [],
};
