// Infographic: gold in Mauritania (reserves, extraction, central bank, obstacles).
// Sources (checked 10 Nov 2026):
//  - potential > 25 Moz (> 777 t): government estimate, via Ecofin Agency (Apr 2026)
//  - Tasiast proven & probable reserves 4.4 Moz at 31 Dec 2025: Kinross Gold (2025 annual report; Ecofin)
//  - Tasiast produced ~5.1 Moz since 2010: Kinross 40-F 2025
//  - 2024 production 22.3 t: 19.36 t Tasiast, 0.97 t Guelb Moghrein (MCM), 1.97 t artisanal: EITI 2024 report
//  - Tasiast 2025: 503,429 oz (-19% vs 622,394 oz in 2024); no return above 600 koz before 2028: Kinross / Ecofin
//  - Tasiast = 53% of the value of mineral production 2025: EITI 2025 data (via aqlame.com)
//  - central bank gold 1.02 t: World Gold Council / IMF (latest published figure, Q4 2023)
//  - ~30 t possibly exported illicitly 2016-2022: SWISSAID report (Oct 2024)
// Gold-bar pictogram: drawn for this infographic (48x48 box).
window.INFO = {
  slug: 'gold-mauritania',
  title: 'الذهب في موريتانيا',
  year: 2024,
  site: 'www.erriwaya.com',
  production: 22.3,                       // tonnes, 2024 (EITI)
  potential: 777, potentialOz: 25,        // tonnes / million ounces (government estimate)
  proven: 137, provenOz: 4.4,             // Tasiast P&P reserves, 31 Dec 2025 (4.4 Moz = 136.9 t)
  producedOz: 5.1,                        // Tasiast output since 2010, million ounces
  bar: 'M13 12h22l9 26H4z M15.5 15h17l1.6 4.4H13.9z',
  src: {
    hook: '',
    total: 'المصدر: تقديرات حكومية موريتانية – كينروس غولد (2025)',
    world: 'المصدر: كينروس غولد – التقرير السنوي 2025',
    c0: 'المصدر: مبادرة الشفافية في الصناعات الاستخراجية – تقرير 2024',
    c1: 'المصدر: مبادرة الشفافية في الصناعات الاستخراجية – تقرير 2024',
    c2: 'المصدر: مبادرة الشفافية في الصناعات الاستخراجية – تقرير 2024',
    c3: 'المصدر: مجلس الذهب العالمي – آخر بيان منشور (2023)',
    c4: 'المصدر: تقرير منظمة SWISSAID (2024)',
    rank: 'المصادر: كينروس غولد – مبادرة الشفافية – SWISSAID',
    outro: '',
  },
  // five slides, each a location on the map of Mauritania
  slides: [
    { name: 'منجم تازيازت', n: 19.36, d: 1, unit: 'طناً من الذهب في 2024', lon: -15.5, lat: 20.6,
      cam: { lon: -14.6, lat: 20.4, w: 22 }, share: 19.36 / 22.3, shareText: 'من إنتاج البلاد',
      fact: ['أكبر منجم ذهب في البلاد'] },
    { name: 'التنقيب الأهلي', n: 1.97, d: 2, unit: 'طن من الذهب في 2024', lon: -12.5, lat: 22.7,
      pins: [[-15.95, 20.05], [-12.47, 22.73]], cam: { lon: -13.8, lat: 21.5, w: 24 },
      share: 1.97 / 22.3, shareText: 'من إنتاج البلاد', fact: ['الشامي والزويرات – معادن موريتانيا'] },
    { name: 'قلب أم أكرين', n: 0.97, d: 2, unit: 'طن من الذهب في 2024', lon: -14.38, lat: 19.74,
      cam: { lon: -14.0, lat: 19.9, w: 20 }, share: 0.97 / 22.3, shareText: 'من إنتاج البلاد',
      fact: ['ذهب يُستخرج مع النحاس في أكجوجت'] },
    { name: 'البنك المركزي', n: 1.02, d: 2, unit: 'طن احتياطي الذهب الرسمي', lon: -15.98, lat: 18.09,
      cam: { lon: -14.0, lat: 19.2, w: 22 }, share: 1.02 / 22.3, shareText: 'من إنتاج سنة واحدة',
      fact: ['آخر رقم منشور', '–', '2023'], factChip: true },
    { name: 'التهريب', n: 30, d: 0, unit: 'طناً بين 2016 و2022', lon: -10.5, lat: 21.0,
      cam: { lon: -10.5, lat: 20.8, w: 32 }, share: 30 / 22.3, shareText: 'أكثر من إنتاج سنة كاملة', over: true,
      fact: ['خرجت خارج القنوات الرسمية – تقديرات'] },
  ],
  // obstacles (summary scene)
  issues: [
    { k: 'التهريب', v: '30', u: 'طناً', d: 'بين 2016 و2022' },
    { k: 'منجم واحد', v: '53%', u: '', d: 'من قيمة الإنتاج المعدني 2025' },
    { k: 'تراجع الخام', v: '-19%', u: '', d: 'إنتاج تازيازت في 2025' },
    { k: 'أرواح المنقبين', v: '', u: '', d: 'انهيار الآبار والموت عطشاً' },
  ],
  // the gold sites lit on the reserves map
  sites: [
    { name: 'تازيازت', lon: -15.5, lat: 20.6, dy: -34 },
    { name: 'أكجوجت', lon: -14.38, lat: 19.74, dy: 30 },
    { name: 'الشامي', lon: -15.95, lat: 20.05, side: 'left' },
    { name: 'الزويرات', lon: -12.47, lat: 22.73 },
  ],
};
