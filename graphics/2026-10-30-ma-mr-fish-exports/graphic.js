// Infographic (إنفوجرافيك): Morocco vs Mauritania seafood exports in 2025. Figures exactly as given by the user;
// no other data. Sources: official Mauritanian foreign-trade data 2025, Moroccan sea-fisheries sector data 2025.
// Photos: section bands (catch on deck, trawler, fillets, processing line) and a processing hall in the conclusion.
// Countries: mr = Mauritania (navy), ma = Morocco (Erriwaya green). Times in seconds.
window.GRAPHIC = {
  type: 'infographic',
  title: 'المغرب وموريتانيا.. من يصدر أسماكًا أكثر ومن يجني أموالًا أكثر؟',
  subtitle: 'مقارنة صادرات المنتجات البحرية خلال سنة 2025',
  duration: 46,
  coverAt: 3.4,
  names: { mr: 'موريتانيا', ma: 'المغرب' },
  scenes: [
    { t: 0, type: 'title', clip: 'port-pirogues' },
    { t: 5.6, type: 'hbars', n: 1, img: 'deck-catch.jpg', fy: 0.65, heading: 'حجم الصادرات', unit: 'بالطن',
      rows: [{ c: 'mr', v: 788644, label: 'طن' }, { c: 'ma', v: 742097, label: 'طن' }],
      diff: true,  // the longer bar's extra length is drawn in red
      note: 'موريتانيا تصدر نحو 46.5 ألف طن أكثر' },
    { t: 14.4, type: 'vbars', n: 2, img: 'trawler-birds.jpg', fy: 0.35, heading: 'العائدات المالية', unit: 'بمليار دولار',
      cols: [{ c: 'ma', v: 2.7, label: 'مليار دولار' }, { c: 'mr', v: 1.1, label: 'مليار دولار' }], grid: [1, 2],
      note: 'المغرب يحقق نحو 2.5 ضعف عائدات موريتانيا' },
    { t: 22.8, type: 'cards', n: 3, img: 'salmon-fillets.jpg', fy: 0.55, heading: 'متوسط عائد الطن المصدّر', unit: 'قيمة الصادرات مقسومة على الكمية المصدرة',
      cards: [{ c: 'ma', v: 3600, label: 'دولار للطن' }, { c: 'mr', v: 1400, label: 'دولار للطن' }] },
    { t: 30.0, type: 'share', n: 4, img: 'processing-line.jpg', fy: 0.45, heading: 'صناعة التعليب', unit: 'نسبة المعلبات من إجمالي قيمة الصادرات البحرية',
      rows: [{ c: 'ma', v: 19, approx: false }, { c: 'mr', v: 1.3, approx: true }], max: 20, ticks: [0, 5, 10, 15, 20],
      note: 'فارق واسع في القيمة المضافة' },
    { t: 38.2, type: 'conclusion', img: 'processing-hall.jpg', fy: 0.45,
      lines: ['موريتانيا تصدر كمية أكبر..', 'والمغرب يجني عائدات أعلى'],
      small: 'الأرقام تعبر عن قيمة الصادرات وليس الأرباح الصافية أو إيرادات خزينة الدولة.' },
  ],
  sources: 'المصادر: البيانات الرسمية للتجارة الخارجية الموريتانية 2025، وبيانات قطاع الصيد البحري المغربي 2025',
  natural: false,
  music: 'light',  // tools/make-infographic-music.py
  calm: [22.8, 30.0],  // softer under the per-tonne cards
  hits: [5.6, 14.4, 30.0],
  outroHit: 38.2,
};
