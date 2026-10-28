// Graphic video (جرافيك) (9:16, no voice-over): footage + stacked captions, in the Erriwaya look.
// Facts: AFP (France 24 / Monte Carlo Doualiya, 27 Oct 2026), Madar, Tawassoul, Alwiam, Elitihad.
// Times in seconds. Shots: img (fit 'cover' for portrait photos, 'framed' for landscape) or clip + from.
window.GRAPHIC = {
  title: 'احتجاجات طلاب جامعة نواكشوط',
  date: '2026-10-28',
  duration: 59.6,
  chips: { country: 'موريتانيا', topic: 'مجتمع' },
  shots: [
    { t: 0, img: 'police-pickups.jpg', fit: 'cover', fy: 0.45 },  // hook
    { t: 2.6, clip: 'dispersal', from: 0.0, source: 'مشاهد متداولة' },
    { t: 6.2, img: 'campus-aerial.jpg', fit: 'framed' },
    { t: 10.6, img: 'students-buses.jpg', fit: 'framed', fx: 0.6 },
    { t: 14.8, clip: 'campus', from: 0.0, tint: 0.62, source: 'مشاهد متداولة' },
    { t: 18.2, img: 'students-march.jpg', fit: 'framed' },
    { t: 22.6, clip: 'dispersal', from: 5.0, source: 'مشاهد متداولة' },
    { t: 26.2, clip: 'dispersal', from: 21.0, source: 'مشاهد متداولة' },
    { t: 28.2, img: 'riot-police.webp', fit: 'framed' },
    { t: 33.4, img: 'students-hands-up.jpg', fit: 'framed' },
    { t: 37.6, img: 'empty-classroom.jpg', fit: 'framed' },
    { t: 41.6, img: 'campus-courtyard.jpg', fit: 'framed', tint: 0.35 },
    { t: 48, clip: 'campus', from: 3.0, source: 'مشاهد متداولة' },
    { t: 52.2, clip: 'dispersal', from: 24.0, tint: 0.55, source: 'مشاهد متداولة' },
    { t: 55.6, outro: true },
  ],
  // big centred text; accent words are green
  kinetic: [
    { t: 0.05, end: 2.6, y: 1240, hook: true, lines: ['هراوات وغاز مسيل للدموع', 'لتفريق طلاب نواكشوط'], accent: ['نواكشوط'] },  // hook
    { t: 2.65, end: 6.1, chips: true, lines: ['احتجاجات طلابية', 'في جامعة نواكشوط'], accent: ['نواكشوط'] },
    { t: 14.95, end: 18.1, lines: ['من 5 أوقيات', 'إلى 30 أوقية'], accent: ['30'], sub: 'التعرفة تتضاعف ست مرات' },
    { t: 52.4, end: 55.5, lines: ['أزمة النقل الجامعي', 'إلى أين؟'], accent: ['أين؟'] },
  ],
  // stacked caption boxes: the first line is the navy lead
  captions: [
    { t: 6.4, end: 10.5, lines: ['منذ 22 أكتوبر', 'طلاب جامعة نواكشوط', 'يحتجون على رفع تعرفة النقل'] },
    { t: 10.8, end: 14.7, lines: ['النقل الجامعي المدعوم', 'سعر التذكرة ارتفع', 'من 5 إلى 30 أوقية'] },
    { t: 18.4, end: 22.5, lines: ['أربع نقابات طلابية', 'أسست الجبهة الطلابية', 'للدفاع عن الحقوق والمكتسبات'] },
    { t: 22.8, end: 28, lines: ['الاثنين 26 أكتوبر', 'قوات الأمن تفرّق الطلاب', 'بالهراوات والغاز المسيل للدموع'] },
    { t: 28.4, end: 33.3, lines: ['انتشار أمني', 'داخل الحرم الجامعي ومحيطه'] },
    { t: 33.6, end: 37.5, lines: ['مطالب الطلاب', 'زيادة عدد الحافلات', 'وتحسين الخدمات وظروف الدراسة'] },
    { t: 37.8, end: 41.5, lines: ['الثلاثاء 27 أكتوبر', 'إضراب ومقاطعة للدروس', 'والحرم الجامعي شبه خالٍ'] },
    { t: 48.2, end: 52.1, lines: ['المعارضة تدين', 'تفريق الطلاب المحتجين', 'والإضراب الطلابي مستمر'] },
  ],
  // white card with the other side's account
  cards: [
    { t: 41.85, end: 47.9, label: 'رواية الوزارة',
      text: 'ألغت وقفات النقل التقليدي نحو المركب الجامعي، واعتمدت خطوط الحافلات السريعة باشتراك شهري مخفض للطلاب قدره 5000 أوقية قديمة',
      source: 'وزارة التعليم العالي والبحث العلمي' },
  ],
  sources: 'المصادر: فرانس برس ووسائل إعلام موريتانية',
  // music accents (tools/make-graphic-music.py) and whooshes on the big cuts
  calm: [41.6, 48],  // no drums under the account card
  hits: [2.6, 14.8, 22.6, 52.2],
  outroHit: 55.6,
};
