// Infographic: the AMAN green hydrogen project in Mauritania (Global Convention signed 16 Sep 2026).
// Sources (checked 12 Nov 2026):
//  - Global Convention signed 16 Sep 2026 in Nouakchott by the Ministry of Energy and Petroleum and CWP Global;
//    first convention of its kind signed by Mauritania: ministry statement (via attaqa.net, CWP press release)
//  - 1.2 Mt green hydrogen and 6.6 Mt green ammonia a year: Renewable Watch (21 Sep 2026), Ammonia Energy (27 Sep 2026)
//  - project at FEED stage, CWP targets a Final Investment Decision before 2030: Ammonia Energy (27 Sep 2026)
//  - Mauritania's advantages: exceptional solar and wind, coast for desalination and export, production costs
//    up to 50% lower than in northern Europe: Power Technology (GreenGo Energy agreement)
//  - minister: "a global hub for renewable energy and green hydrogen": Mohamed Ould Khaled, 16 Sep 2026
// Photos: Wikimedia Commons — NASA ISS-58 and ISS-59 (public domain), Desert Sky Wind Farm (public domain,
// shown as an illustration), Nouadhibou port (Tinga more, CC BY-SA 3.0), Mauritania desierto 1997 (LBM1948,
// CC BY-SA 4.0).
window.INFO = {
  slug: 'aman-hydrogen',
  title: 'الهيدروجين الأخضر',
  site: 'www.erriwaya.com',
  src: {
    hook: '',
    total: 'المصدر: وزارة الطاقة والنفط الموريتانية – 16 سبتمبر 2026',
    world: 'المصدر: Power Technology – اتفاقية GreenGo Energy',
    c0: 'المصدر: CWP Global – Renewable Watch (سبتمبر 2026)',
    c1: 'المصدر: CWP Global – Ammonia Energy (سبتمبر 2026)',
    c2: 'المصدر: Ammonia Energy (سبتمبر 2026)',
    rank: 'المصادر: وزارة الطاقة والنفط – Power Technology',
    outro: '',
  },
  slides: [
    { name: 'الهيدروجين الأخضر', img: 'wind-farm.jpg', credit: 'صورة تعبيرية', n: 1.2, d: 1, unit: 'مليون طن سنوياً', lon: -10.5, lat: 20.3,
      mv: { z: [1.05, 1.2], f: [[0.62, 0.12], [0.72, 0.16]] }, pins: [],
      bar: { share: 1.2 / 6.6, label: 'وزنه مقارنة بالأمونيا المستهدفة', pct: false },
      fact: ['يُنتَج بتحليل الماء بطاقة الشمس والرياح'] },
    { name: 'الأمونيا الخضراء', img: 'iss-atlantic-coast.jpg', credit: 'الساحل الأطلسي – ناسا', n: 6.6, d: 1, unit: 'مليون طن سنوياً', lon: -16.2, lat: 19.5,
      mv: { z: [1.3, 1.08], f: [[0.5, 0.62], [0.5, 0.55]] }, pins: [],
      bar: { share: 1, label: 'الحجم الأكبر في المشروع', pct: false },
      fact: ['الصيغة الأيسر لشحن الهيدروجين وتصديره'] },
    { name: 'قرار الاستثمار', img: 'nouadhibou.jpg', credit: 'نواذيبو', n: 2030, d: 0, unit: 'الموعد الذي تستهدفه الشركة', pre: 'قبل', lon: -17.03, lat: 20.94,
      mv: { z: [1.25, 1.25], f: [[0.35, 0.6], [0.65, 0.6]] }, pins: [[-17.03, 20.94]],
      steps: ['الاتفاقية الشاملة', 'الدراسات الهندسية', 'القرار النهائي'],
      fact: ['المشروع الآن في مرحلة الدراسات الهندسية'] },
  ],
  hook: { img: 'iss-mauritania-coast.jpg' },
  worldImg: 'dunes.jpg',
  // why Mauritania (summary scene)
  issues: [
    { k: 'شمس ورياح استثنائية', icon: 'sun', d: 'طاقة متجددة لتشغيل التحليل الكهربائي' },
    { k: 'ساحل أطلسي', icon: 'wave', d: 'لتحلية مياه البحر والتصدير' },
    { k: 'تكلفة أقل', v: '50%', u: 'حتى', d: 'مقارنة بشمال أوروبا' },
    { k: 'إطار قانوني', icon: 'doc', d: 'أول اتفاقية شاملة من نوعها في البلاد' },
  ],
  nkc: { name: 'نواكشوط', lon: -15.98, lat: 18.09 },
};
