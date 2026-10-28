// Social report (9:16, no voice-over): footage + stacked captions, in the Erriwaya look.
// Facts: AFP (France 24 / Monte Carlo Doualiya, 27 Oct 2026), Madar, Tawassoul, Alwiam, Elitihad.
// Times in seconds. Shots: img (fit 'cover' for portrait photos, 'framed' for landscape) or clip + from.
window.REPORT = {
  title: 'احتجاجات طلاب جامعة نواكشوط',
  date: '2026-10-28',
  duration: 57,
  chips: { country: 'موريتانيا', topic: 'مجتمع' },
  shots: [
    { t: 0.0, clip: 'dispersal', from: 0.0, source: 'مشاهد متداولة' },
    { t: 3.6, img: 'campus-aerial.jpg', fit: 'framed' },
    { t: 8.0, img: 'students-buses.jpg', fit: 'framed', fx: 0.6 },
    { t: 12.2, clip: 'campus', from: 0.0, tint: 0.62, source: 'مشاهد متداولة' },
    { t: 15.6, img: 'students-march.jpg', fit: 'framed' },
    { t: 20.0, clip: 'dispersal', from: 5.0, source: 'مشاهد متداولة' },
    { t: 23.6, clip: 'dispersal', from: 21.0, source: 'مشاهد متداولة' },
    { t: 25.6, img: 'police-pickups.jpg', fit: 'cover', fy: 0.45 },
    { t: 28.6, img: 'riot-police.webp', fit: 'framed' },
    { t: 30.8, img: 'students-hands-up.jpg', fit: 'framed' },
    { t: 35.0, img: 'empty-classroom.jpg', fit: 'framed' },
    { t: 39.0, img: 'campus-courtyard.jpg', fit: 'framed', tint: 0.35 },
    { t: 45.4, clip: 'campus', from: 3.0, source: 'مشاهد متداولة' },
    { t: 49.6, clip: 'dispersal', from: 24.0, tint: 0.55, source: 'مشاهد متداولة' },
    { t: 53.0, outro: true },
  ],
  // big centred text; accent words are green
  kinetic: [
    { t: 0.05, end: 3.5, chips: true, lines: ['احتجاجات طلابية', 'في جامعة نواكشوط'], accent: ['نواكشوط'] },
    { t: 12.35, end: 15.5, lines: ['من 5 أوقيات', 'إلى 30 أوقية'], accent: ['30'], sub: 'التعرفة تتضاعف ست مرات' },
    { t: 49.8, end: 52.9, lines: ['أزمة النقل الجامعي', 'إلى أين؟'], accent: ['أين؟'] },
  ],
  // stacked caption boxes: the first line is the green lead
  captions: [
    { t: 3.8, end: 7.9, lines: ['منذ 22 أكتوبر', 'طلاب جامعة نواكشوط', 'يحتجون على رفع تعرفة النقل'] },
    { t: 8.2, end: 12.1, lines: ['النقل الجامعي المدعوم', 'سعر التذكرة ارتفع', 'من 5 إلى 30 أوقية'] },
    { t: 15.8, end: 19.9, lines: ['أربع نقابات طلابية', 'أسست الجبهة الطلابية', 'للدفاع عن الحقوق والمكتسبات'] },
    { t: 20.2, end: 25.4, lines: ['الاثنين 26 أكتوبر', 'قوات الأمن تفرّق الطلاب', 'بالهراوات والغاز المسيل للدموع'] },
    { t: 25.8, end: 30.7, lines: ['انتشار أمني', 'داخل الحرم الجامعي ومحيطه'] },
    { t: 31.0, end: 34.9, lines: ['مطالب الطلاب', 'زيادة عدد الحافلات', 'وتحسين الخدمات وظروف الدراسة'] },
    { t: 35.2, end: 38.9, lines: ['الثلاثاء 27 أكتوبر', 'إضراب ومقاطعة للدروس', 'والحرم الجامعي شبه خالٍ'] },
    { t: 45.6, end: 49.5, lines: ['المعارضة تدين', 'تفريق الطلاب المحتجين', 'والإضراب الطلابي مستمر'] },
  ],
  // white card with the other side's account
  cards: [
    { t: 39.25, end: 45.3, label: 'رواية الوزارة',
      text: 'ألغت وقفات النقل التقليدي نحو المركب الجامعي، واعتمدت خطوط الحافلات السريعة باشتراك شهري مخفض للطلاب قدره 5000 أوقية قديمة',
      source: 'وزارة التعليم العالي والبحث العلمي' },
  ],
  sources: 'المصادر: فرانس برس ووسائل إعلام موريتانية',
  // music accents (tools/make-report-music.py) and whooshes on the big cuts
  hits: [12.2, 20.0, 49.6],
  outroHit: 53.0,
};
