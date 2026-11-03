// Edition of 3 Nov 2026. All times are in seconds of the voice-over (voiceover.mp3 in this folder: the
// ElevenLabs take in voiceover-original.mp3, cut before the hashtag line and sped up 7% with atempo=1.07).
// Images are files in ./img.
window.TIMELINE = {
  date: 'الثلاثاء 3 نوفمبر 2026',
  title: 'الموجز الإخباري',
  audioCut: 0.0,      // the voice-over starts at "أهلا بكم"
  audioEnd: 166.374,
  intro: 7.0,
  outroAt: 161.50,    // "إلى هنا ينتهي موجز الأخبار..."
  tail: 3.0,

  hook: { img: 'sn-parliament-session.jpg', f: [0.5, 0.45], kicker: 'السنغال', topic: 'اقتصاد',
          text: 'البرلمان السنغالي يرفض مشروع قانون المالية المعدل لسنة 2026' },

  // gentle framing: whole scene kept, zoom ≤ 6% (the template caps it and places wide photos)
  cards: [
    // opening teaser
    { kicker: 'السنغال', img: 'sn-parliament-top.webp', moves: [{ t: 0.00, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }] },
    { kicker: 'مالي', img: 'ml-patrol.jpg', moves: [{ t: 1.25, a: [0.55, 0.5, 1.0], b: [0.55, 0.5, 1.06] }] },
    // Mauritania
    { img: 'mr-ghazouani-marlaska.jpg', moves: [{ t: 2.50, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }, { t: 10.94, a: [0.5, 0.45, 1.04], b: [0.5, 0.45, 1.08] }] },
    { img: 'es-marlaska.jpg', moves: [{ t: 14.50, a: [0.45, 0.5, 1.0], b: [0.45, 0.5, 1.06] }] },
    { img: 'mr-ghazouani-marlaska.jpg', moves: [{ t: 18.00, a: [0.45, 0.5, 1.0], b: [0.55, 0.5, 1.04] }] },
    // Senegal
    { img: 'sn-parliament-session.jpg', moves: [{ t: 21.44, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }] },
    { img: 'sn-parliament.webp', moves: [{ t: 27.82, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }] },
    { img: 'sn-parliament-top.webp', moves: [{ t: 34.00, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }, { t: 40.66, a: [0.5, 0.45, 1.04], b: [0.5, 0.45, 1.08] }] },
    // Western Sahara (UN General Assembly)
    { img: 'un-ga.webp', moves: [{ t: 44.94, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }, { t: 51.94, a: [0.5, 0.45, 1.04], b: [0.5, 0.45, 1.08] }, { t: 57.76, a: [0.45, 0.5, 1.0], b: [0.55, 0.5, 1.04] }] },
    // Chad and Algeria
    { img: 'td-deby-attaf.jpg', moves: [{ t: 62.64, a: [0.48, 0.45, 1.0], b: [0.48, 0.45, 1.06] }, { t: 72.20, a: [0.5, 0.45, 1.03], b: [0.5, 0.45, 1.07] }] },
    { img: 'td-dz-handshake.jpg', moves: [{ t: 79.90, a: [0.5, 0.45, 1.0], b: [0.5, 0.45, 1.06] }] },
    // Mali
    { img: 'ml-patrol.jpg', moves: [{ t: 85.58, a: [0.55, 0.5, 1.0], b: [0.55, 0.5, 1.06] }] },
    { img: 'ml-vehicles.jpg', moves: [{ t: 91.00, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }] },
    { img: 'ml-armour.jpg', moves: [{ t: 96.92, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }] },
    { img: 'ml-patrol2.jpg', moves: [{ t: 100.80, a: [0.55, 0.5, 1.0], b: [0.55, 0.5, 1.06] }] },
    // Morocco
    { img: 'ma-mansouri-portrait.webp', moves: [{ t: 104.68, a: [0.5, 0.45, 1.0], b: [0.5, 0.45, 1.06] }] },
    { img: 'ma-meeting.jpg', moves: [{ t: 110.98, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }, { t: 115.14, a: [0.55, 0.5, 1.03], b: [0.55, 0.5, 1.07] }] },
    { img: 'ma-mansouri.jpg', moves: [{ t: 120.50, a: [0.5, 0.45, 1.0], b: [0.5, 0.45, 1.06] }] },
    // Tunisia
    { img: 'tn-pharmacy-closed.jpg', moves: [{ t: 124.36, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }] },
    { img: 'tn-pharmacy.jpg', moves: [{ t: 131.00, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }, { t: 136.54, a: [0.5, 0.45, 1.03], b: [0.5, 0.45, 1.07] }] },
    // Libya
    { img: 'ly-teacher-sign.jpg', moves: [{ t: 142.36, a: [0.45, 0.5, 1.0], b: [0.45, 0.5, 1.06] }] },
    { img: 'ly-teachers-signs.webp', moves: [{ t: 147.14, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }] },
    { img: 'ly-teachers-crowd.webp', moves: [{ t: 152.34, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }, { t: 157.54, a: [0.5, 0.45, 1.03], b: [0.5, 0.45, 1.07] }] },
    // wrap-up
    { img: 'td-deby-attaf.jpg', moves: [{ t: 161.50, a: [0.48, 0.45, 1.0], b: [0.48, 0.45, 1.04] }] },
    { img: 'sn-parliament.webp', moves: [{ t: 163.00, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.04] }] },
    { img: 'ml-patrol.jpg', moves: [{ t: 164.50, a: [0.55, 0.5, 1.0], b: [0.55, 0.5, 1.04] }] },
  ],

  headlines: [
    { t: 0.0, kicker: 'الموجز الإخباري', text: 'أبرز التطورات السياسية والاقتصادية والأمنية في دول المغرب العربي والساحل' },
    { t: 2.50, kicker: 'موريتانيا', topic: 'دبلوماسية', text: 'الرئيس الغزواني يستقبل وزير الداخلية الإسباني فرناندو غراندي مارلاسكا' },
    { t: 10.94, kicker: 'موريتانيا', topic: 'أمن', text: 'تعاون في مكافحة الهجرة غير النظامية والجريمة العابرة للحدود' },
    { t: 21.44, kicker: 'السنغال', topic: 'اقتصاد', text: 'البرلمان يرفض مشروع قانون المالية المعدل لسنة 2026' },
    { t: 34.00, kicker: 'السنغال', topic: 'سياسة', text: 'نواب يبررون الرفض بغياب الوثائق اللازمة لتقييم الإيرادات والنفقات' },
    { t: 44.94, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'الجمعية العامة للأمم المتحدة تدعو إلى جلسة في 10 نوفمبر حول الفيتو' },
    { t: 51.94, kicker: 'الصحراء الغربية', topic: 'دبلوماسية', text: 'عقب تعثر تمديد ولاية بعثة مينورسو في مجلس الأمن' },
    { t: 62.64, kicker: 'تشاد', topic: 'دبلوماسية', text: 'الرئيس التشادي يستقبل وزير الخارجية الجزائري أحمد عطاف' },
    { t: 72.20, kicker: 'تشاد', topic: 'أمن', text: 'رسالة من الرئيس تبون واستعداد جزائري للعمل على تعزيز أمن المنطقة' },
    { t: 85.58, kicker: 'مالي', topic: 'أمن', text: 'الجيش يعلن ضربات قرب نيونو وتيساليت وغورما راروس' },
    { t: 96.92, kicker: 'مالي', topic: 'أمن', text: 'استهداف تجمعات ومعدات لجماعات مسلحة دون حصيلة مفصلة للخسائر' },
    { t: 104.68, kicker: 'المغرب', topic: 'اقتصاد', text: 'الحكومة تشكل لجنة وزارية لمتابعة تقلبات الأسعار' },
    { t: 115.14, kicker: 'المغرب', topic: 'مجتمع', text: 'حماية القدرة الشرائية للأسر وضمان توافر المواد الأساسية' },
    { t: 124.36, kicker: 'تونس', topic: 'مجتمع', text: 'تحذير برلماني من إغلاق نحو 300 صيدلية' },
    { t: 136.54, kicker: 'تونس', topic: 'اقتصاد', text: 'دعوة إلى إصلاحات هيكلية لمعالجة أزمة الصناديق الاجتماعية' },
    { t: 142.36, kicker: 'ليبيا', topic: 'مجتمع', text: 'إضراب المعلمين يدخل شهره الثاني للمطالبة بتحسين الرواتب' },
    { t: 152.34, kicker: 'ليبيا', topic: 'مجتمع', text: 'جدول المرتبات الجديد لا ينهي الخلاف مع النقابات والدراسة معطلة' },
    { t: 161.50, kicker: 'الموجز الإخباري', text: 'إلى هنا ينتهي موجز الأخبار من الرواية' },
  ],

  chapters: [2.50, 21.44, 44.94, 62.64, 85.58, 104.68, 124.36, 142.36],

  camera: [
    { t: 0.0, lon: 0, lat: 24.5, w: 58, d: 0.01 },
    { t: 2.3, lon: -9.5, lat: 28.5, w: 34, d: 1.8 },
    { t: 21.3, lon: -15.2, lat: 14.3, w: 14, d: 2.0 },
    { t: 44.8, lon: -12.6, lat: 24.6, w: 24, d: 1.8 },
    { t: 62.5, lon: 9.0, lat: 24.5, w: 40, d: 2.0 },
    { t: 85.4, lon: -2.5, lat: 17.0, w: 22, d: 2.0 },
    { t: 104.5, lon: -7.0, lat: 31.6, w: 24, d: 2.0 },
    { t: 124.2, lon: 9.6, lat: 34.2, w: 14, d: 2.0 },
    { t: 142.2, lon: 17.0, lat: 27.5, w: 34, d: 2.0 },
    { t: 161.3, lon: 0, lat: 24.5, w: 58, d: 2.2 },
  ],

  highlights: [
    { t: 0.0, end: 2.3, kind: 'primary', ids: ['478', '686', '732', '148', '466', '504', '788', '434'], origin: [-15.98, 18.09] },
    { t: 2.7, end: 21.2, kind: 'primary', ids: ['478'], origin: [-15.98, 18.09] },
    { t: 4.4, end: 21.2, kind: 'secondary', ids: ['724'], origin: [-3.70, 40.42] },
    { t: 21.7, end: 44.7, kind: 'primary', ids: ['686'], origin: [-17.44, 14.69] },
    { t: 45.2, end: 62.4, kind: 'primary', ids: ['732'], origin: [-12.9, 24.6] },
    { t: 62.9, end: 85.3, kind: 'primary', ids: ['148'], origin: [15.04, 12.13] },
    { t: 66.3, end: 85.3, kind: 'secondary', ids: ['012'], origin: [3.06, 36.75] },
    { t: 85.9, end: 104.4, kind: 'primary', ids: ['466'], origin: [-8.0, 12.64] },
    { t: 105.0, end: 124.1, kind: 'primary', ids: ['504'], origin: [-6.84, 34.02] },
    { t: 124.6, end: 142.1, kind: 'primary', ids: ['788'], origin: [10.18, 36.81] },
    { t: 142.6, end: 161.2, kind: 'primary', ids: ['434'], origin: [13.19, 32.89] },
    { t: 162.0, end: 168.0, kind: 'primary', ids: ['478', '686', '732', '148', '466', '504', '788', '434'], origin: [-15.98, 18.09] },
  ],

  pins: [
    { t: 3.2, end: 21.0, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right', main: true },
    { t: 5.0, end: 21.0, lon: -3.70, lat: 40.42, label: 'مدريد', side: 'right' },
    { t: 22.2, end: 44.5, lon: -17.44, lat: 14.69, label: 'داكار', side: 'right', main: true },
    { t: 45.6, end: 62.2, lon: -12.9, lat: 24.6, label: 'الصحراء الغربية', side: 'left', dot: false },
    { t: 63.4, end: 85.1, lon: 15.04, lat: 12.13, label: 'إنجامينا', side: 'right', main: true },
    { t: 66.6, end: 85.1, lon: 3.06, lat: 36.75, label: 'الجزائر العاصمة', side: 'left' },
    { t: 91.4, end: 104.2, lon: -5.99, lat: 14.25, label: 'نيونو', side: 'left', main: true },
    { t: 92.6, end: 104.2, lon: 1.01, lat: 20.20, label: 'تيساليت', side: 'right' },
    { t: 93.8, end: 104.2, lon: -1.93, lat: 16.88, label: 'غورما راروس', side: 'right' },
    { t: 105.4, end: 123.9, lon: -6.84, lat: 34.02, label: 'الرباط', side: 'right', main: true },
    { t: 125.0, end: 141.9, lon: 10.18, lat: 36.81, label: 'تونس', side: 'right', main: true },
    { t: 143.0, end: 161.0, lon: 13.19, lat: 32.89, label: 'طرابلس', side: 'left', main: true },
  ],

  lines: [
    { t: 5.4, dur: 2.2, end: 21.0, from: [-3.70, 40.42], to: [-15.98, 18.09], curve: 0.15, style: 'arc' },
    { t: 67.0, dur: 2.4, end: 85.1, from: [3.06, 36.75], to: [15.04, 12.13], curve: -0.12, style: 'arc' },
  ],

  stats: [],
};
