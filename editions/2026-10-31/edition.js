// Edition of 31 Oct 2026. All times are in seconds of the ORIGINAL voice-over (voiceover.mp3 in this
// folder); the template maps them onto the video timeline. Images are files in ./img.
// Voice-over: ElevenLabs "Hamida" (eleven_v4) supplied by the user (parts/part2b-v4.mp3), loudness-normalized only.
window.TIMELINE = {
  date: 'السبت 31 أكتوبر 2026',
  title: 'الموجز الإخباري',
  audioCut: 0.0,      // keep the opening lead-in ("من مجلس الأمن ... نرصد لكم أبرز أحداث اليوم")
  audioEnd: 294.687,
  intro: 7.0,
  outroAt: 288.36,    // "كان هذا موجز أبرز الأخبار..." (reference only)
  tail: 3.0,

  // opening hook: the strongest story, full-frame, before the map intro
  hook: { img: 'unsc-vote.webp', f: [0.5, 0.42], kicker: 'الصحراء الغربية', topic: 'دبلوماسية',
          text: 'فيتو روسي يُسقط تمديد ولاية بعثة مينورسو' },

  cards: [
    // opening teaser (the lead-in names the Security Council, Dakar's Olympic event, then the region)
    { kicker: 'الصحراء الغربية', img: 'unsc-vote.webp', moves: [{ t: 0.00, a: [0.5, 0.45, 1.0], b: [0.48, 0.45, 1.12] }] },
    { kicker: 'السنغال', img: 'sn-cauldron.jpg', moves: [{ t: 5.12, a: [0.42, 0.42, 1.0], b: [0.4, 0.4, 1.1] }] },
    { kicker: 'الجزائر', img: 'dz-tebboune.webp', moves: [{ t: 9.22, a: [0.5, 0.4, 1.0], b: [0.5, 0.36, 1.1] }] },
    { kicker: 'ليبيا', img: 'ly-refinery.jpg', moves: [{ t: 10.80, a: [0.5, 0.5, 1.0], b: [0.55, 0.45, 1.1] }] },
    { kicker: 'مالي', img: 'ml-convoy.jpg', moves: [{ t: 12.35, a: [0.5, 0.5, 1.0], b: [0.45, 0.5, 1.1] }] },
    { kicker: 'المغرب', img: 'ma-office-changes.webp', moves: [{ t: 13.82, a: [0.5, 0.4, 1.0], b: [0.62, 0.35, 1.12] }] },
    { kicker: 'تونس', img: 'tn-zarzis.jpg', moves: [{ t: 15.26, a: [0.5, 0.5, 1.0], b: [0.5, 0.55, 1.1] }] },
    { kicker: 'موريتانيا', img: 'sn-summit.jpg', moves: [{ t: 18.18, a: [0.5, 0.35, 1.0], b: [0.5, 0.3, 1.1] }] },
    // Western Sahara
    { img: 'unsc-vote.webp', moves: [{ t: 21.12, a: [0.5, 0.5, 1.0], b: [0.5, 0.45, 1.14] },
                                     { t: 32.03, a: [0.42, 0.42, 1.55], b: [0.44, 0.38, 1.35] }] },
    { img: 'dz-tebboune.webp', moves: [{ t: 38.54, a: [0.5, 0.35, 1.0], b: [0.5, 0.3, 1.14] }] },
    { img: 'unsc-vote.webp', moves: [{ t: 47.72, a: [0.62, 0.55, 1.4], b: [0.55, 0.5, 1.2] },
                                     { t: 53.68, a: [0.5, 0.5, 1.12], b: [0.5, 0.5, 1.0] }] },
    // Mauritania: Dakar summit on sport and sustainable development
    { img: 'sn-summit.jpg', moves: [{ t: 61.88, a: [0.45, 0.32, 1.25], b: [0.47, 0.3, 1.45] },
                                    { t: 70.26, a: [0.5, 0.4, 1.0], b: [0.55, 0.38, 1.12] }] },
    { img: 'sn-stage.jpg', moves: [{ t: 74.54, a: [0.47, 0.42, 1.0], b: [0.47, 0.38, 1.14] }] },
    { img: 'sn-torch.jpg', moves: [{ t: 80.34, a: [0.6, 0.5, 1.0], b: [0.6, 0.45, 1.12] }] },
    // Mauritania: Guidimakha emergency programme
    { img: 'mr-guidimakha-town.jpg', moves: [{ t: 86.62, a: [0.5, 0.5, 1.0], b: [0.45, 0.5, 1.14] }] },
    { img: 'mr-guidimakha-mosque.jpg', moves: [{ t: 97.92, a: [0.5, 0.42, 1.0], b: [0.5, 0.4, 1.12] }] },
    // Algeria: presidential pardon
    { img: 'dz-tebboune.webp', moves: [{ t: 105.56, a: [0.5, 0.4, 1.0], b: [0.5, 0.35, 1.12] },
                                       { t: 119.56, a: [0.48, 0.3, 1.6], b: [0.48, 0.32, 1.4] },
                                       { t: 128.34, a: [0.2, 0.45, 1.3], b: [0.3, 0.42, 1.15] }] },
    // Morocco: foreign direct investment
    { img: 'ma-office-changes.webp', moves: [{ t: 133.42, a: [0.5, 0.45, 1.0], b: [0.6, 0.35, 1.15] },
                                             { t: 146.20, a: [0.72, 0.33, 1.6], b: [0.68, 0.35, 1.4] }] },
    // Tunisia: Zarzis economic activity zone
    { img: 'tn-zarzis.jpg', moves: [{ t: 155.28, a: [0.5, 0.5, 1.0], b: [0.45, 0.6, 1.15] },
                                    { t: 167.18, a: [0.6, 0.72, 1.4], b: [0.5, 0.7, 1.25] }] },
    // Libya: pipeline valve closed, Hamada field -> Zawiya refinery
    { img: 'ly-pipeline.webp', moves: [{ t: 179.24, a: [0.4, 0.45, 1.0], b: [0.35, 0.42, 1.14] }] },
    { img: 'ly-zawiya-tanks.jpg', moves: [{ t: 184.50, a: [0.5, 0.5, 1.0], b: [0.5, 0.55, 1.12] }] },
    { img: 'ly-refinery.jpg', moves: [{ t: 190.58, a: [0.5, 0.5, 1.0], b: [0.4, 0.45, 1.14] },
                                      { t: 198.92, a: [0.6, 0.4, 1.3], b: [0.55, 0.4, 1.15] }] },
    // Mali: fuel convoy reaches Bamako
    { img: 'ml-convoy.jpg', moves: [{ t: 204.48, a: [0.5, 0.5, 1.0], b: [0.4, 0.55, 1.15] }] },
    { img: 'ml-tankers.png', moves: [{ t: 216.56, a: [0.5, 0.5, 1.0], b: [0.55, 0.5, 1.1] }] },
    // Niger and Chad
    { img: 'ne-moscow.jpg', moves: [{ t: 226.10, a: [0.5, 0.45, 1.0], b: [0.6, 0.4, 1.15] }] },
    { img: 'td-minister.jpg', moves: [{ t: 237.24, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.12] }] },
    // Senegal: Dakar 2026 Youth Olympic Games
    { img: 'sn-summit.jpg', moves: [{ t: 250.60, a: [0.72, 0.38, 1.3], b: [0.7, 0.35, 1.5] }] },
    { img: 'sn-cauldron.jpg', moves: [{ t: 258.24, a: [0.42, 0.45, 1.0], b: [0.42, 0.42, 1.12] }] },
    { img: 'sn-drummer.jpg', moves: [{ t: 262.94, a: [0.45, 0.35, 1.0], b: [0.45, 0.32, 1.12] }] },
    { img: 'sn-parade.jpg', moves: [{ t: 269.14, a: [0.5, 0.5, 1.0], b: [0.5, 0.48, 1.1] }] },
    // wrap-up
    { img: 'unsc-vote.webp', moves: [{ t: 272.82, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
    { img: 'ly-refinery.jpg', moves: [{ t: 276.32, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
    { img: 'tn-zarzis.jpg', moves: [{ t: 278.70, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
    { img: 'sn-stage.jpg', moves: [{ t: 283.94, a: [0.5, 0.42, 1.05], b: [0.5, 0.42, 1.15] }] },
  ],

  headlines: [
    { t: 0.00, kicker: 'الموجز الإخباري', text: 'أبرز التطورات السياسية والاقتصادية والأمنية في المغرب العربي والساحل الإفريقي' },
    { t: 21.12, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'إخفاق مجلس الأمن في تمديد ولاية بعثة مينورسو بعد فيتو روسي' },
    { t: 38.54, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'الجزائر تأسف لعدم التجديد والمغرب يرحب ويدعو لإنهاء وجود البعثة' },
    { t: 53.68, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'البوليساريو: الفيتو الروسي منع مشروعا يمس حق تقرير المصير' },
    { t: 61.88, kicker: 'موريتانيا', topic: 'دبلوماسية', text: 'الرئيس الغزواني يشارك في قمة داكار حول الرياضة والتنمية المستدامة' },
    { t: 74.54, kicker: 'موريتانيا', topic: 'اقتصاد', text: 'القمة تبحث تحويل الاستثمار في الرياضة إلى فرص للتشغيل والتنمية' },
    { t: 86.62, kicker: 'موريتانيا', topic: 'مجتمع', text: 'إنجاز 54% من المرحلة الأولى للبرنامج الاستعجالي في كيدي ماغا' },
    { t: 97.92, kicker: 'موريتانيا', topic: 'مجتمع', text: 'اكتمال 115 تدخلا من أصل 215 وتسعة تدخلات لم تنطلق بعد' },
    { t: 105.56, kicker: 'الجزائر', topic: 'سياسة', text: 'الرئيس تبون يعفو عن 5539 محبوسا في الذكرى 72 لثورة أول نوفمبر' },
    { t: 119.56, kicker: 'الجزائر', topic: 'سياسة', text: 'عفو عن عقوبات لا تتجاوز 24 شهرا مع استثناء الإرهاب والقتل والفساد' },
    { t: 133.42, kicker: 'المغرب', topic: 'اقتصاد', text: 'صافي تدفقات الاستثمار الأجنبي المباشر يرتفع بنسبة 58.4%' },
    { t: 146.20, kicker: 'المغرب', topic: 'اقتصاد', text: 'نحو 35 مليارا و240 مليون درهم في الأشهر التسعة الأولى من العام' },
    { t: 155.28, kicker: 'تونس', topic: 'اقتصاد', text: 'ثلاثة مشاريع استثمارية جديدة في جرجيس بقيمة 213 مليون دينار' },
    { t: 167.18, kicker: 'تونس', topic: 'اقتصاد', text: 'بين 174 و190 فرصة عمل في قطاعي الحبوب والطاقة الحيوية' },
    { t: 179.24, kicker: 'ليبيا', topic: 'أمن', text: 'مجموعة مسلحة تغلق صماما رئيسيا في خط حقل الحمادة ومصفاة الزاوية' },
    { t: 190.58, kicker: 'ليبيا', topic: 'اقتصاد', text: 'المؤسسة الوطنية للنفط تحذر من فقدان 15 ألف برميل يوميا' },
    { t: 204.48, kicker: 'مالي', topic: 'أمن', text: 'وصول قافلة من 596 شاحنة صهريج محملة بالمحروقات إلى باماكو' },
    { t: 216.56, kicker: 'مالي', topic: 'أمن', text: 'بحماية الجيش لضمان تزويد العاصمة بالوقود رغم التحديات الأمنية' },
    { t: 226.10, kicker: 'النيجر وتشاد', topic: 'دبلوماسية', text: 'لقاء وزيري خارجية النيجر وتشاد على هامش قمة روسيا وإفريقيا' },
    { t: 237.24, kicker: 'النيجر وتشاد', topic: 'أمن', text: 'نيامي تتهم إنجامينا بضربة مسيرة قرب أغاديز وتشاد تنفي' },
    { t: 250.60, kicker: 'السنغال', topic: 'اقتصاد', text: 'الرئيس فاي يدعو لتحويل استثمارات أولمبياد الشباب داكار 2026 إلى وظائف' },
    { t: 262.94, kicker: 'السنغال', topic: 'مجتمع', text: 'إرث تنموي يتجاوز المنافسات ويعزز فرص الشباب والاقتصاد' },
    { t: 272.82, kicker: 'الموجز الإخباري', text: 'مرحلة جديدة تتداخل فيها الملفات السياسية والاقتصادية والأمنية' },
  ],

  chapters: [21.12, 61.88, 86.62, 105.56, 133.42, 155.28, 179.24, 204.48, 226.10, 250.60],

  camera: [
    { t: 0.00, lon: 0, lat: 24.5, w: 58, d: 0.01 },
    { t: 20.98, lon: -12.6, lat: 24.6, w: 24, d: 1.8 },
    { t: 38.39, lon: -6.0, lat: 29.0, w: 36, d: 2.0 },
    { t: 61.65, lon: -15.6, lat: 16.4, w: 14, d: 2.0 },
    { t: 86.51, lon: -12.4, lat: 16.2, w: 14, d: 2.0 },
    { t: 105.38, lon: 2.5, lat: 30.0, w: 32, d: 2.0 },
    { t: 133.27, lon: -7.0, lat: 31.6, w: 24, d: 2.0 },
    { t: 155.17, lon: 10.4, lat: 34.6, w: 14, d: 2.0 },
    { t: 179.12, lon: 13.0, lat: 31.0, w: 16, d: 2.0 },
    { t: 204.36, lon: -7.0, lat: 15.5, w: 26, d: 2.0 },
    { t: 225.86, lon: 10.0, lat: 15.5, w: 34, d: 2.0 },
    { t: 250.37, lon: -15.4, lat: 14.5, w: 14, d: 2.0 },
    { t: 272.62, lon: 0, lat: 24.5, w: 58, d: 2.2 },
  ],

  highlights: [
    { t: 0.00, end: 20.90, kind: 'primary', ids: ['732', '686', '478', '012', '504', '788', '434', '466', '562', '148'], origin: [-15.98, 18.09] },
    { t: 21.36, end: 61.65, kind: 'primary', ids: ['732'], origin: [-13.2, 27.15] },
    { t: 38.73, end: 47.66, kind: 'secondary', ids: ['012'], origin: [3.06, 36.75] },
    { t: 47.94, end: 61.65, kind: 'secondary', ids: ['504'], origin: [-6.84, 34.02] },
    { t: 62.11, end: 86.44, kind: 'primary', ids: ['478'], origin: [-15.98, 18.09] },
    { t: 63.99, end: 86.44, kind: 'secondary', ids: ['686'], origin: [-17.44, 14.69] },
    { t: 86.84, end: 105.29, kind: 'primary', ids: ['478'], origin: [-12.18, 15.16] },
    { t: 105.83, end: 133.20, kind: 'primary', ids: ['012'], origin: [3.06, 36.75] },
    { t: 133.63, end: 155.06, kind: 'primary', ids: ['504'], origin: [-6.84, 34.02] },
    { t: 155.48, end: 178.99, kind: 'primary', ids: ['788'], origin: [11.11, 33.5] },
    { t: 179.42, end: 204.23, kind: 'primary', ids: ['434'], origin: [12.73, 32.76] },
    { t: 204.78, end: 225.65, kind: 'primary', ids: ['466'], origin: [-8.0, 12.64] },
    { t: 226.35, end: 250.16, kind: 'primary', ids: ['562'], origin: [2.11, 13.51] },
    { t: 227.08, end: 250.16, kind: 'primary', ids: ['148'], origin: [15.04, 12.11] },
    { t: 250.90, end: 272.42, kind: 'primary', ids: ['686'], origin: [-17.44, 14.69] },
    { t: 273.32, end: 289.10, kind: 'primary', ids: ['732', '686', '478', '012', '504', '788', '434', '466', '562', '148'], origin: [-15.98, 18.09] },
  ],

  pins: [
    { t: 0.81, end: 20.74, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'left' },
    { t: 21.81, end: 61.46, lon: -12.9, lat: 24.6, label: 'الصحراء الغربية', side: 'left', dot: false },
    { t: 39.06, end: 47.52, lon: 3.06, lat: 36.75, label: 'الجزائر العاصمة', side: 'left' },
    { t: 48.44, end: 61.46, lon: -6.84, lat: 34.02, label: 'الرباط', side: 'right' },
    { t: 62.56, end: 86.30, lon: -17.44, lat: 14.69, label: 'داكار', side: 'down', main: true },
    { t: 63.45, end: 86.30, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right' },
    { t: 87.22, end: 105.13, lon: -12.18, lat: 15.16, label: 'كيدي ماغا', side: 'right', main: true },
    { t: 106.22, end: 133.08, lon: 3.06, lat: 36.75, label: 'الجزائر العاصمة', side: 'down', main: true },
    { t: 133.96, end: 154.94, lon: -6.84, lat: 34.02, label: 'الرباط', side: 'right', main: true },
    { t: 155.80, end: 178.92, lon: 11.11, lat: 33.5, label: 'جرجيس', side: 'right', main: true },
    { t: 179.64, end: 204.11, lon: 12.73, lat: 32.76, label: 'الزاوية', side: 'up', main: true },
    { t: 180.43, end: 204.11, lon: 12.2, lat: 29.6, label: 'حقل الحمادة', side: 'down' },
    { t: 205.05, end: 225.54, lon: -8.0, lat: 12.64, label: 'باماكو', side: 'right', main: true },
    { t: 226.71, end: 249.96, lon: 2.11, lat: 13.51, label: 'نيامي', side: 'left', main: true },
    { t: 227.44, end: 249.96, lon: 15.04, lat: 12.11, label: 'إنجامينا', side: 'right' },
    { t: 238.24, end: 249.96, lon: 7.99, lat: 16.97, label: 'أغاديز', side: 'up' },
    { t: 251.33, end: 272.22, lon: -17.44, lat: 14.69, label: 'داكار', side: 'right', main: true },
  ],

  lines: [
    { t: 179.87, dur: 2.2, end: 204.11, from: [12.2, 29.6], to: [12.73, 32.76], curve: 0.1, style: 'route' },
    { t: 227.98, dur: 2.2, end: 249.96, from: [2.11, 13.51], to: [15.04, 12.11], curve: 0.18, style: 'arc' },
  ],

  stats: [],
};
