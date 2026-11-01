// Infographic (إنفوجرافيك): iron ore and steel in the five Maghreb countries. Figures exactly as given by the user;
// no other data. Years kept separate: ore production 2024, crude steel 2025, SNIM turnover 2025, exports 2024.
// Reserves (Mauritania) are kept apart from estimated resources (Gara Djebilet, Wadi Shatti) on the map.
// Photos supplied by the user (mines, steel works). Times in seconds.
window.GRAPHIC = {
  type: 'infographic',
  title: 'ثروات الحديد في المغرب العربي',
  subtitle: 'الاحتياطيات والإنتاج والتصنيع والعوائد',
  titleLines: ['ثروات الحديد', 'في المغرب العربي'],  // the last line in green
  flags: ['mr', 'ma', 'dz', 'tn', 'ly'],
  duration: 54.4,
  coverAt: 3.4,
  names: { mr: 'موريتانيا', dz: 'الجزائر', ma: 'المغرب', tn: 'تونس', ly: 'ليبيا' },
  scenes: [
    { t: 0, type: 'title', img: 'aerial-mine.jpg', fy: 0.6 },
    { t: 5.6, type: 'map', n: 1, img: 'open-pit.jpg', fy: 0.5, heading: 'مليارات الأطنان تحت الأرض', unit: 'الثروة المعدنية: خام الحديد',
      // kind: 'res' = reserves (solid green), 'est' = estimated resources (hatched navy), 'nd' = no comparable figure
      areas: {
        mr: { kind: 'res', v: '10', label: 'مليارات طن', sub: 'احتياطيات' },
        dz: { kind: 'est', pre: 'نحو', v: '3.5', label: 'مليارات طن', sub: 'موارد مقدرة · غار جبيلات' },
        ly: { kind: 'est', pre: 'نحو', v: '3.5', label: 'مليارات طن', sub: 'موارد مقدرة · وادي الشاطئ' },
        ma: { kind: 'nd' }, tn: { kind: 'nd' },
      },
      move: { mr: [-20, -60], dz: [20, -70], ly: [20, 40], ma: [-30, 0], tn: [60, -40] },  // label nudges (px)
      legend: [['res', 'احتياطيات'], ['est', 'موارد جيولوجية مقدرة'], ['nd', 'لا أرقام وطنية موحدة']],
      note: 'الاحتياطيات المثبتة تختلف عن الموارد الجيولوجية المقدرة' },
    { t: 16.4, type: 'hbars', n: 2, img: 'mine-trucks.jpg', fy: 0.5, heading: 'موريتانيا تتصدر الاستخراج', unit: 'إنتاج خام الحديد لعام 2024',
      hi: 'mr',  // bar lengths on one scale in million tonnes (m); the figure is shown as written (v + label)
      rows: [
        { c: 'mr', m: 14.3, v: 14.3, label: 'مليون طن' },
        { c: 'dz', m: 1.57, v: 1.57, label: 'مليون طن' },
        { c: 'tn', m: 0.22, v: 220, label: 'ألف طن' },
        { c: 'ma', m: 0.014, v: 14, label: 'ألف طن' },
        { c: 'ly', na: 'لا توجد كمية إنتاج تجاري موثقة' },
      ] },
    { t: 25.2, type: 'hbars', n: 3, img: 'steel-plant-hall.jpg', fy: 0.4, heading: 'الجزائر تتصدر التصنيع', unit: 'إنتاج الصلب الخام لعام 2025',
      hi: 'dz',
      rows: [
        { c: 'dz', m: 5.46, v: 5.46, label: 'ملايين طن' },
        { c: 'ma', m: 1.508, v: 1.508, label: 'مليون طن' },
        { c: 'ly', m: 1.116, v: 1.116, label: 'مليون طن' },
        { c: 'tn', m: 0.077, v: 77, label: 'ألف طن' },
        { c: 'mr', na: 'لا إنتاج وطني كبير مسجل للصلب الخام' },
      ] },
    { t: 34.0, type: 'tiles', n: 4, img: 'rolling-mill.jpg', fy: 0.55, heading: 'من الخام إلى القيمة المضافة', unit: 'العوائد الاقتصادية بالدولار الأمريكي',
      // equal cards, no ranking: Mauritania's figure is a company's turnover, the others are exports
      tiles: [
        { c: 'mr', v: 1.17, label: 'مليار دولار', sub: 'رقم أعمال شركة سنيم', year: '2025' },
        { c: 'dz', v: 702, label: 'مليون دولار', sub: 'صادرات الحديد والصلب', year: '2024' },
        { c: 'ly', pre: 'نحو', v: 469, label: 'مليون دولار', sub: 'تقدير صادرات الحديد والصلب', year: '2024' },
        { c: 'tn', v: 162, label: 'مليون دولار', sub: 'صادرات الحديد والصلب', year: '2024' },
        { c: 'ma', v: 137, label: 'مليون دولار', sub: 'صادرات الحديد والصلب', year: '2024' },
      ],
      small: 'بطاقات غير مرتبة: رقم موريتانيا رقم أعمال شركة، والبقية صادرات الحديد والصلب' },
    { t: 43.4, type: 'conclusion', img: 'steel-complex.jpg', fy: 0.45,
      lines: ['موريتانيا تتصدر استخراج خام الحديد...', 'والجزائر تتصدر صناعة الصلب'], lineFlags: ['mr', 'dz'],
      small: 'سنوات المؤشرات مختلفة: الخام 2024، الصلب 2025، سنيم 2025، الصادرات 2024' },
    { t: 49.0, type: 'outro' },
  ],
  sources: 'المصادر: USGS 2026 | World Steel Association 2025 | SNIM 2025 | بيانات التجارة الدولية 2024',
  natural: false,
  music: 'light',
  calm: [34.0, 43.4],
  hits: [5.6, 16.4, 25.2, 34.0],
  outroHit: 49.0,
};
