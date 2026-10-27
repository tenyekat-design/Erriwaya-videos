// Edition of 27 Oct 2026. All times are in seconds of the ORIGINAL voice-over (voiceover.mp3 in this
// folder); the template maps them onto the video timeline. Images are files in ./img; every card is a
// photo or a clip.
//
// Country ids (world-atlas): Mauritania 478, Morocco 504, W. Sahara 732, Algeria 012, Tunisia 788,
// Libya 434, Mali 466, Niger 562, Senegal 686, Gambia 270, Chad 148, Russia 643.
window.TIMELINE = {
  date: 'الثلاثاء 27 أكتوبر 2026',
  title: 'الموجز الإخباري',
  audioCut: 0.0,      // the voice-over starts directly with "من نواكشوط إلى الجزائر"
  audioEnd: 266.031,
  intro: 7.0,
  outroAt: 260.18,    // "كان هذا موجز آخر الأنباء..." -> closing logo
  tail: 3.0,

  cards: [
    // opening teaser (clips and photos of the day's stories)
    { video: 'mr-moscow-arrival.mp4', from: 0.6, moves: [{ t: 0.0, a: [0.5, 0.4, 1.0], b: [0.5, 0.35, 1.08] }] },
    { img: 'dz-tebboune-niger.jpg', moves: [{ t: 3.2, a: [0.5, 0.35, 1.0], b: [0.5, 0.32, 1.1] }] },
    { video: 'ma-lekjaa-parliament.mp4', from: 12.3, moves: [{ t: 6.4, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.08] }] },
    { img: 'ml-soldier.jpg', moves: [{ t: 9.6, a: [0.5, 0.5, 1.0], b: [0.6, 0.45, 1.12] }] },
    { video: 'sn-assembly.mp4', from: 2.0, moves: [{ t: 12.8, a: [0.5, 0.5, 1.0], b: [0.5, 0.55, 1.1] }] },
    { img: 'unsc-session.jpg', moves: [{ t: 16.0, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.12] }] },
    { video: 'tn-parliament.mp4', from: 21.0, moves: [{ t: 19.2, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.08] }] },
    { img: 'mr-insaf-meeting.jpg', moves: [{ t: 22.4, a: [0.5, 0.55, 1.0], b: [0.5, 0.6, 1.1] }] },
    // Mauritania: Ghazouani in Moscow
    { img: 'mr-president.jpg', moves: [{ t: 25.34, a: [0.5, 0.45, 1.0], b: [0.47, 0.32, 1.15] }] },
    { video: 'mr-moscow-arrival.mp4', from: 0, moves: [{ t: 28.0, a: [0.5, 0.45, 1.0], b: [0.5, 0.45, 1.06] },
                                                       { t: 32.4, a: [0.5, 0.45, 1.06], b: [0.55, 0.45, 1.12] }] },
    // Mauritania: ruling party and the third term
    { img: 'mr-insaf-meeting.jpg', moves: [{ t: 42.74, a: [0.5, 0.55, 1.0], b: [0.5, 0.6, 1.1] }] },
    { img: 'mr-insaf-chair.jpg', moves: [{ t: 47.30, a: [0.6, 0.55, 1.0], b: [0.68, 0.55, 1.15] }] },
    { img: 'mr-insaf-members.jpg', moves: [{ t: 51.00, a: [0.5, 0.45, 1.0], b: [0.4, 0.45, 1.12] },
                                           { t: 55.08, a: [0.35, 0.45, 1.45], b: [0.33, 0.45, 1.3] }] },
    { img: 'mr-president.jpg', moves: [{ t: 57.14, a: [0.5, 0.35, 1.25], b: [0.5, 0.3, 1.4] }] },
    // Algeria sends troops to Niger
    { img: 'dz-tebboune-niger.jpg', moves: [{ t: 60.62, a: [0.5, 0.35, 1.0], b: [0.45, 0.32, 1.1] },
                                            { t: 66.58, a: [0.27, 0.32, 1.6], b: [0.29, 0.32, 1.45] },
                                            { t: 69.58, a: [0.73, 0.3, 1.55], b: [0.7, 0.3, 1.4] }] },
    { video: 'ne-niamey.mp4', from: 0, moves: [{ t: 71.20, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.08] }] },
    { img: 'dz-parliament.webp', moves: [{ t: 74.70, a: [0.5, 0.5, 1.0], b: [0.4, 0.45, 1.15] }] },
    // Niger and Chad
    { video: 'ne-niamey.mp4', from: 0.4, moves: [{ t: 77.52, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
    { img: 'ne-minister.jpg', moves: [{ t: 81.44, a: [0.55, 0.3, 1.0], b: [0.55, 0.28, 1.12] },
                                      { t: 90.58, a: [0.5, 0.33, 1.5], b: [0.52, 0.3, 1.35] }] },
    { img: 'unsc.jpg', moves: [{ t: 97.18, a: [0.5, 0.5, 1.0], b: [0.5, 0.45, 1.12] }] },
    // Western Sahara: US draft on MINURSO
    { img: 'unsc-session.jpg', moves: [{ t: 101.78, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.14] }] },
    { img: 'minurso.webp', moves: [{ t: 109.70, a: [0.55, 0.5, 1.0], b: [0.65, 0.5, 1.12] }] },
    { img: 'minurso-patrol.png', moves: [{ t: 112.50, a: [0.5, 0.5, 1.0], b: [0.4, 0.55, 1.15] }] },
    { img: 'unsc-vote.jpg', moves: [{ t: 122.08, a: [0.5, 0.45, 1.0], b: [0.5, 0.45, 1.12] }] },
    // Morocco: 2027 budget (Lekjaa at the House of Representatives)
    { img: 'ma-parliament.jpg', moves: [{ t: 125.02, a: [0.5, 0.45, 1.0], b: [0.5, 0.5, 1.14] }] },
    { video: 'ma-lekjaa-parliament.mp4', from: 0, moves: [{ t: 128.98, a: [0.5, 0.5, 1.0], b: [0.5, 0.45, 1.1] }] },
    // Senegal: amending budget
    { img: 'sn-pm.jpg', moves: [{ t: 142.70, a: [0.5, 0.45, 1.0], b: [0.45, 0.5, 1.15] }] },
    { video: 'sn-assembly.mp4', from: 0, moves: [{ t: 146.32, a: [0.5, 0.5, 1.0], b: [0.5, 0.55, 1.12] },
                                                 { t: 153.50, a: [0.6, 0.6, 1.4], b: [0.55, 0.6, 1.25] }] },
    // Mali: army strikes
    { img: 'ml-security.png', moves: [{ t: 160.82, a: [0.5, 0.45, 1.0], b: [0.55, 0.42, 1.14] }] },
    { img: 'ml-soldier.jpg', moves: [{ t: 165.04, a: [0.5, 0.5, 1.0], b: [0.6, 0.45, 1.12] },
                                     { t: 172.62, a: [0.35, 0.4, 1.35], b: [0.3, 0.4, 1.2] }] },
    // Tunisia: new parliamentary session
    { video: 'tn-parliament.mp4', from: 0, moves: [{ t: 177.68, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.08] }] },
    // Libya: cost of delayed reforms
    { img: 'ly-interview.jpg', moves: [{ t: 193.80, a: [0.45, 0.4, 1.0], b: [0.45, 0.35, 1.12] }] },
    { img: 'ly-refinery.jpg', moves: [{ t: 200.30, a: [0.5, 0.5, 1.0], b: [0.45, 0.45, 1.12] }] },
    { img: 'ly-refinery-smoke.jpg', moves: [{ t: 206.20, a: [0.5, 0.45, 1.0], b: [0.4, 0.4, 1.12] }] },
    // Gambia: fuel subsidy
    { img: 'gm-dalasi.jpg', moves: [{ t: 210.24, a: [0.5, 0.5, 1.0], b: [0.65, 0.45, 1.15] }] },
    { img: 'gm-official.jpg', moves: [{ t: 215.40, a: [0.5, 0.35, 1.0], b: [0.5, 0.32, 1.12] }] },
    { img: 'gm-dalasi-old.jpg', moves: [{ t: 221.10, a: [0.5, 0.5, 1.0], b: [0.55, 0.5, 1.15] }] },
    // Nouakchott: transformer fire in Teyarett
    { img: 'mr-fire-teyarett.jpg', moves: [{ t: 227.78, a: [0.5, 0.5, 1.0], b: [0.5, 0.45, 1.1] },
                                           { t: 237.34, a: [0.25, 0.5, 1.5], b: [0.28, 0.5, 1.35] }] },
    { img: 'mr-fire-teyarett-tall.jpg', moves: [{ t: 243.86, a: [0.5, 0.45, 1.0], b: [0.5, 0.5, 1.12] }] },
    // wrap-up
    { img: 'ml-soldier.jpg', moves: [{ t: 248.06, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
    { video: 'ma-lekjaa-parliament.mp4', from: 16.6, moves: [{ t: 251.06, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.08] }] },
    { img: 'dz-tebboune-niger.jpg', moves: [{ t: 253.48, a: [0.5, 0.35, 1.05], b: [0.5, 0.35, 1.15] }] },
    { video: 'mr-moscow-arrival.mp4', from: 7.0, moves: [{ t: 256.00, a: [0.5, 0.45, 1.0], b: [0.5, 0.45, 1.08] }] },
  ],

  headlines: [
    { t: 0.0, kicker: 'الموجز الإخباري', text: 'تطورات سياسية وعسكرية ودبلوماسية لافتة من نواكشوط إلى الجزائر ومنطقة الساحل' },
    { t: 25.34, kicker: 'موريتانيا', text: 'الرئيس الغزواني في موسكو للمشاركة في القمة الروسية الإفريقية' },
    { t: 35.08, kicker: 'موريتانيا', text: 'مساعٍ روسية لتعزيز الحضور السياسي والاقتصادي والأمني في إفريقيا' },
    { t: 42.74, kicker: 'موريتانيا', text: 'تحركات حزب الإنصاف تعيد الجدل بشأن المأمورية الرئاسية الثالثة' },
    { t: 51.00, kicker: 'موريتانيا', text: 'اجتماع رئيس الحزب محمد ولد بلال مع رؤساء الجهات تحضيراً للحوار الوطني' },
    { t: 60.62, kicker: 'الجزائر', text: 'الرئيس تبون يعلن إرسال وحدات من الجيش إلى النيجر' },
    { t: 69.58, kicker: 'الجزائر', text: 'لحماية المصالح الطاقوية والاقتصادية المشتركة بطلب من نيامي وبموافقة البرلمان' },
    { t: 77.52, kicker: 'النيجر وتشاد', text: 'توتر دبلوماسي بعد اتهام نيامي لتشاد بضربة جوية أوقعت قتيلين مدنيين' },
    { t: 90.58, kicker: 'النيجر وتشاد', text: 'إنجامينا تنفي وتطالب بتحقيق دولي مستقل' },
    { t: 94.94, kicker: 'النيجر وتشاد', text: 'نيامي تعتزم نقل القضية إلى الأمم المتحدة والاتحاد الإفريقي' },
    { t: 101.78, kicker: 'الصحراء الغربية', text: 'تعديلات جديدة على مشروع القرار الأمريكي بشأن بعثة المينورسو' },
    { t: 112.50, kicker: 'الصحراء الغربية', text: 'التراجع عن تقليص قوات البعثة إلى النصف' },
    { t: 116.56, kicker: 'الصحراء الغربية', text: 'تخفيف صياغة دعم الحكم الذاتي مع إبقائه أساساً للمفاوضات' },
    { t: 125.02, kicker: 'المغرب', text: 'الحكومة تستعد لعرض مشروع قانون المالية لسنة 2027 أمام البرلمان' },
    { t: 132.00, kicker: 'المغرب', text: 'إجراءات مرتقبة لدعم الاستثمار والتشغيل والقدرة الشرائية' },
    { t: 142.70, kicker: 'السنغال', text: 'البرلمان يعيد مشروع الميزانية التعديلية إلى لجنة المالية بطلب من الحكومة' },
    { t: 153.50, kicker: 'السنغال', text: 'مشاورات إضافية لتجاوز الخلاف بين السلطتين التنفيذية والتشريعية' },
    { t: 160.82, kicker: 'مالي', text: 'العمليات العسكرية لا تزال تتصدر المشهد في مالي' },
    { t: 165.04, kicker: 'مالي', text: 'الجيش يعلن ضربات على مواقع لمجموعات مسلحة في كوليكورو وموبتي' },
    { t: 177.68, kicker: 'تونس', text: 'البرلمان التونسي يفتتح دورته الجديدة' },
    { t: 182.72, kicker: 'تونس', text: 'استعداد لمناقشة ميزانية العام المقبل وسط مطالب بإصلاحات' },
    { t: 193.80, kicker: 'ليبيا', text: 'تحذيرات من خسائر بمليارات الدولارات سنوياً بسبب تأخر الإصلاحات' },
    { t: 203.76, kicker: 'ليبيا', text: 'حاجة إلى استثمارات ضخمة لإعادة الإعمار وتحريك عجلة التنمية' },
    { t: 210.24, kicker: 'غامبيا', text: 'قضية دعم الوقود تعود إلى صدارة النقاش الاقتصادي' },
    { t: 215.40, kicker: 'غامبيا', text: 'إنفاق حكومي تجاوز 827 مليون دالاسي خلال سبعة أشهر' },
    { t: 227.78, kicker: 'موريتانيا', text: 'حريق جديد في محول كهرباء بمقاطعة تيارت في نواكشوط' },
    { t: 237.34, kicker: 'موريتانيا', text: 'انقطاع التيار قبل تدخل صوملك وتساؤلات حول تكرار الحوادث' },
    { t: 248.06, kicker: 'الموجز الإخباري', text: 'تحركات عسكرية في الساحل وتجاذبات سياسية وتحديات اقتصادية' },
  ],

  chapters: [25.34, 60.62, 101.78, 125.02, 142.70, 160.82, 177.68, 193.80, 210.24, 227.78],

  camera: [
    { t: 0.0, lon: 0, lat: 24.5, w: 58, d: 0.01 },
    { t: 25.1, lon: -11.5, lat: 20.0, w: 26, d: 1.8 },
    { t: 30.5, lon: 30.0, lat: 52.0, w: 40, d: 2.4 },
    { t: 42.5, lon: -11.5, lat: 20.0, w: 26, d: 2.4 },
    { t: 60.4, lon: 6.0, lat: 26.0, w: 76, d: 2.0 },
    { t: 77.3, lon: 11.5, lat: 15.5, w: 40, d: 2.0 },
    { t: 101.6, lon: -12.6, lat: 24.6, w: 24, d: 1.8 },
    { t: 124.8, lon: -7.0, lat: 31.6, w: 24, d: 2.0 },
    { t: 142.5, lon: -15.2, lat: 14.3, w: 14, d: 2.2 },
    { t: 160.6, lon: -5.8, lat: 14.0, w: 20, d: 2.0 },
    { t: 177.5, lon: 10.0, lat: 35.2, w: 20, d: 2.0 },
    { t: 193.6, lon: 17.5, lat: 27.0, w: 40, d: 2.0 },
    { t: 210.0, lon: -15.4, lat: 13.45, w: 8, d: 2.4 },
    { t: 227.6, lon: -15.6, lat: 18.4, w: 8, d: 2.4 },
    { t: 247.9, lon: 0, lat: 24.5, w: 58, d: 2.2 },
  ],

  highlights: [
    { t: 0.0, end: 25.0, kind: 'primary', ids: ['478', '012', '504', '686', '466', '562', '788', '434', '270'], origin: [-15.98, 18.09] },
    { t: 25.6, end: 60.4, kind: 'primary', ids: ['478'], origin: [-15.98, 18.09] },
    { t: 31.4, end: 42.6, kind: 'secondary', ids: ['643'], origin: [37.62, 55.75] },
    { t: 60.9, end: 77.3, kind: 'primary', ids: ['012'], origin: [3.06, 36.75] },
    { t: 66.6, end: 77.3, kind: 'secondary', ids: ['562'], origin: [2.11, 13.51] },
    { t: 77.8, end: 101.5, kind: 'primary', ids: ['562'], origin: [2.11, 13.51] },
    { t: 81.5, end: 101.5, kind: 'secondary', ids: ['148'], origin: [15.04, 12.11] },
    { t: 102.1, end: 124.7, kind: 'primary', ids: ['732'], origin: [-12.9, 24.6] },
    { t: 125.3, end: 142.4, kind: 'primary', ids: ['504'], origin: [-6.84, 34.02] },
    { t: 143.0, end: 160.5, kind: 'primary', ids: ['686'], origin: [-17.44, 14.69] },
    { t: 161.1, end: 177.4, kind: 'primary', ids: ['466'], origin: [-8.0, 12.64] },
    { t: 178.0, end: 193.5, kind: 'primary', ids: ['788'], origin: [10.18, 36.81] },
    { t: 194.1, end: 209.9, kind: 'primary', ids: ['434'], origin: [13.19, 32.89] },
    { t: 210.5, end: 227.5, kind: 'primary', ids: ['270'], origin: [-16.58, 13.45] },
    { t: 228.1, end: 247.8, kind: 'primary', ids: ['478'], origin: [-15.94, 18.13] },
    { t: 248.3, end: 262.0, kind: 'primary', ids: ['478', '012', '504', '686', '466', '562', '788', '434', '270'], origin: [-15.98, 18.09] },
  ],

  pins: [
    { t: 0.6, end: 24.8, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'left' },
    { t: 1.2, end: 24.8, lon: 3.06, lat: 36.75, label: 'الجزائر', side: 'right' },
    { t: 25.8, end: 30.4, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right', main: true },
    { t: 31.6, end: 42.4, lon: 37.62, lat: 55.75, label: 'موسكو', side: 'down', main: true },
    { t: 43.4, end: 60.2, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right', main: true },
    { t: 61.0, end: 77.1, lon: 3.06, lat: 36.75, label: 'الجزائر العاصمة', side: 'down', main: true },
    { t: 66.8, end: 77.1, lon: 2.11, lat: 13.51, label: 'نيامي', side: 'right' },
    { t: 78.0, end: 101.4, lon: 2.11, lat: 13.51, label: 'نيامي', side: 'left', main: true },
    { t: 82.0, end: 101.4, lon: 15.04, lat: 12.11, label: 'إنجامينا', side: 'right' },
    { t: 102.4, end: 124.6, lon: -12.9, lat: 24.6, label: 'الصحراء الغربية', dot: false },
    { t: 125.6, end: 142.3, lon: -6.84, lat: 34.02, label: 'الرباط', side: 'right', main: true },
    { t: 143.4, end: 160.4, lon: -17.44, lat: 14.69, label: 'داكار', side: 'right', main: true },
    { t: 144.4, end: 160.4, lon: -15.3, lat: 13.45, label: 'غامبيا', dot: false },
    { t: 167.4, end: 177.3, lon: -7.56, lat: 12.86, label: 'كوليكورو', side: 'down', main: true },
    { t: 167.9, end: 177.3, lon: -4.20, lat: 14.49, label: 'موبتي', side: 'up', main: true },
    { t: 178.4, end: 193.4, lon: 10.18, lat: 36.81, label: 'تونس', side: 'down', main: true },
    { t: 194.4, end: 209.8, lon: 13.19, lat: 32.89, label: 'طرابلس', side: 'down', main: true },
    { t: 210.9, end: 227.4, lon: -16.58, lat: 13.45, label: 'بانجول', side: 'up', main: true },
    { t: 228.4, end: 247.7, lon: -15.94, lat: 18.13, label: 'تيارت – نواكشوط', side: 'right', main: true },
  ],

  lines: [
    { t: 31.0, dur: 2.6, end: 42.4, from: [-15.98, 18.09], to: [37.62, 55.75], curve: -0.12, style: 'route' },
    { t: 66.8, dur: 2.4, end: 77.1, from: [3.06, 36.75], to: [2.11, 13.51], curve: 0.1, style: 'route' },
  ],

  stats: [
    { t: 32.4, end: 42.4, text: 'القمة الروسية الإفريقية', note: 'موسكو' },
    { t: 75.0, end: 77.1, text: 'غرفتا البرلمان', note: 'وافقتا على إرسال الوحدات' },
    { t: 86.7, end: 101.4, text: 'قتيلان مدنيان', note: 'في الضربة الجوية' },
    { t: 112.6, end: 124.6, text: 'لا تقليص', note: 'لقوات البعثة إلى النصف' },
    { t: 128.9, end: 142.3, text: 'مالية 2027', note: 'مشروع القانون أمام البرلمان' },
    { t: 174.7, end: 177.3, text: 'دون حصيلة', note: 'مستقلة للخسائر' },
    { t: 197.2, end: 209.8, text: 'مليارات الدولارات', note: 'خسائر سنوية' },
    { t: 217.5, end: 227.4, value: 827, unit: 'مليون دالاسي', note: 'دعم الوقود خلال 7 أشهر' },
  ],
};
