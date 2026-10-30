// Graphic (جرافيك): renewal talks for the EU–Mauritania fisheries protocol (expires 14 Nov 2026).
// Facts: European Commission (protocol 15 Nov 2021 – 14 Nov 2026, €60.8M/yr), Agence Europe (talks ongoing,
// "top priority"), Tawassoul / Spanish press (Mauritania asks > €68M/yr), Atlasinfo (4 states ask an extension).
// Footage: screen recordings sent by the user (documentary clips, INA archive), cut into clips/.
window.GRAPHIC = {
  title: 'اتفاق الصيد بين موريتانيا والاتحاد الأوروبي',
  date: '2026-10-30',
  duration: 45.4,
  chips: { country: 'موريتانيا', topic: 'اقتصاد' },
  shots: [
    { t: 0, img: 'net-catch.jpg', fit: 'framed' },  // hook
    { t: 2.6, clip: 'boat-waves', from: 0, fit: 'framed', source: 'لقطات أرشيفية' },
    { t: 6.2, clip: 'port-pirogues', from: 0, fit: 'framed', source: 'لقطات أرشيفية' },
    { t: 10.6, img: 'trawler-birds.jpg', fit: 'framed', fx: 0.4 },
    { t: 14.8, clip: 'beach-aerial', from: 0, fit: 'framed', tint: 0.5, source: 'لقطات أرشيفية' },
    { t: 18.2, img: 'deck-catch.jpg', fit: 'framed' },
    { t: 22.4, img: 'kadis.jpg', fit: 'framed', fy: 0.2 },
    { t: 29.0, clip: 'ship-crew', from: 0.3, fit: 'framed', source: 'لقطات أرشيفية' },
    { t: 33.2, clip: 'fish-quay', from: 0, fit: 'framed', source: 'لقطات أرشيفية' },
    { t: 35.2, clip: 'quay-workers', from: 0, fit: 'framed', source: 'لقطات أرشيفية' },
    { t: 37.4, clip: 'pirogues-aerial', from: 0, fit: 'framed', tint: 0.3, source: 'لقطات أرشيفية' },
    { t: 39.4, clip: 'beach-haul', from: 0.5, fit: 'framed', tint: 0.3, source: 'أرشيف INA' },
    { t: 41.4, outro: true },
  ],
  natural: false,  // the recordings carry other outlets' narration and music
  kinetic: [
    { t: 0.05, end: 2.6, y: 1240, hook: true, lines: ['60.8 مليون يورو سنوياً', 'على طاولة التفاوض'], accent: ['60.8'] },
    { t: 2.65, end: 6.1, chips: true, lines: ['اتفاق الصيد', 'بين موريتانيا وأوروبا'], accent: ['موريتانيا'] },
    { t: 14.95, end: 18.1, lines: ['من 60.8', 'إلى أكثر من 68'], accent: ['68'], sub: 'مليون يورو سنوياً · مطلب موريتاني' },
    { t: 37.6, end: 41.3, lines: ['قبل 14 نوفمبر', 'تجديد أم تمديد؟'], accent: ['تمديد؟'] },
  ],
  captions: [
    { t: 6.4, end: 10.5, lines: ['14 نوفمبر', 'ينتهي بروتوكول الصيد', 'الساري منذ نوفمبر 2021'] },
    { t: 10.8, end: 14.7, lines: ['سفن من عشر دول أوروبية', 'تصيد في المياه الموريتانية', 'بسقف نحو 280 ألف طن سنوياً'] },
    { t: 18.4, end: 22.3, lines: ['جوهر الخلاف', 'نواكشوط تطالب بأكثر من 68 مليوناً', 'وفق الصحافة الإسبانية'] },
    { t: 29.2, end: 33.1, lines: ['إسبانيا والبرتغال', 'وهولندا ولاتفيا', 'تطلب تمديد البروتوكول'] },
    { t: 33.4, end: 37.3, lines: ['3.3 ملايين يورو سنوياً', 'من المقابل الحالي', 'لدعم قطاع الصيد الموريتاني'] },
  ],
  cards: [
    { t: 22.65, end: 28.9, label: 'رواية بروكسل',
      text: 'المفوضية الأوروبية تقول إن تجديد الاتفاق أولوية قصوى وإنه لم يتم التوصل إلى اتفاق بعد، وتربط المقابل المالي بحجم فرص الصيد',
      source: 'المفوضية الأوروبية' },
  ],
  sources: 'المصادر: المفوضية الأوروبية ووسائل إعلام موريتانية وإسبانية',
  calm: [22.4, 29],
  hits: [2.6, 14.8, 37.4],
  outroHit: 41.4,
};
