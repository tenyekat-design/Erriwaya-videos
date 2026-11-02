// Infographic (إنفوجرافيك), 120 s: natural gas in the five Maghreb countries.
// Figures (researched 2 Nov 2026; sources in the description file, check before publishing):
//  - proven reserves: Algeria ~4.5 tcm (EIA: 159 tcf at the start of 2023; OPEC: 4,504 bcm), Libya ~1.5 tcm (OPEC 1,505 bcm;
//    EIA 53 tcf at the start of 2024), Tunisia 65 bcm = 0.065 tcm (EIA, 2021). Mauritania, Morocco: no recent official figure.
//  - discovered, undeveloped: BirAllah (Mauritania) gas initially in place ~50 tcf (Kosmos) to 80 tcf (other estimates).
//  - marketed production 2023 (OPEC): Algeria 104.3 bcm, Libya 11.75 bcm. Tunisia ~1.14 bcm Jan–Oct 2024 (Energy Research
//    Unit via Newsbase); Morocco < 0.1 bcm a year (small fields); Mauritania: first gas 31 Dec 2024, first LNG cargo Apr 2025.
//  - GTA phase 1: ~2.4 Mt LNG a year once fully commissioned (bp); first cargo 17 Apr 2025.
//  - exports 2024: Algeria ~49 bcm (≈35 pipeline + ≈14 LNG, OPEC data via Ecofin / Rio Times); Libya ~1.4 bcm to Italy (Majalla).
//  - Tunisia imported 64.3% of its gas supply in 2023 (IEA); GME closed to Algerian gas 1 Nov 2021, reverse flow to Morocco 2022.
//  - revenues: no official gas-only export revenue comparable across the five; Algeria oil + gas exports ~50 bn USD in 2023
//    (energy minister, via TSA). Shown with its scope.
window.GRAPHIC = {
  type: 'infographic',
  title: 'الغاز في المغرب العربي.. من يملك الثروة ومن يجني العائدات؟',
  subtitle: 'الاحتياطيات والإنتاج والتصدير والعائدات',
  duration: 124.6,
  coverAt: 1.8,
  names: { mr: 'موريتانيا', dz: 'الجزائر', ma: 'المغرب', tn: 'تونس', ly: 'ليبيا' },
  scenes: [
    // 0–2.6: hook, the strongest figure over the strongest photo
    { t: 0, type: 'hook', img: 'gas-plant-flares.jpg', fy: 0.4, tag: ['الجزائر', 'إنفوجرافيك · الغاز'],
      lines: ['نحو 4.5 تريليون متر مكعب', 'احتياطيات الجزائر المثبتة من الغاز'] },
    // 0–12: from space to the Maghreb, fields lit, then the title
    { t: 2.6, type: 'globe', from: [20, 8, 300], to: [5, 27, 1480], wordsAt: 7.0, ids: { mr: '478', dz: '012', ma: '504', tn: '788', ly: '434' },
      sites: [[3.27, 32.93], [-0.3, 35.85], [6.9, 36.9], [9.6, 28.0], [12.2, 32.85], [12.6, 33.4], [10.9, 34.2], [-2.2, 32.7], [-16.7, 16.1]],
      sitesNote: 'حقول ومنشآت رئيسية · مواقع تقريبية',
      lines: ['الغاز في المغرب العربي..', 'ثروة تحت الأرض', 'ومليارات فوقها'] },
    // 12–30: proven reserves
    { t: 14.6, type: 'hbars', n: 1, img: 'desert-gas-plant.jpg', fy: 0.5, heading: 'الاحتياطيات: من الأغنى؟', unit: 'الاحتياطيات المثبتة بالتريليون متر مكعب',
      hi: 'dz', three: true, slow: true,
      rows: [
        { c: 'dz', m: 4.5, v: 4.5, label: 'تريليون م³', year: '2023' },
        { c: 'ly', m: 1.5, v: 1.5, label: 'تريليون م³', year: '2024' },
        { c: 'tn', m: 0.065, v: 0.065, label: 'تريليون م³', year: '2021' },
        { c: 'mr', na: 'لا رقم رسمي محدّث للاحتياطيات المثبتة' },
        { c: 'ma', na: 'لا رقم رسمي محدّث للاحتياطيات المثبتة' },
      ],
      foot: 'أرقام تقديرية مقربة · EIA و OPEC' },
    // 30–38: discovered but undeveloped resources are not proven reserves
    { t: 32.6, type: 'tiles', n: 2, img: 'offshore-platform.jpg', fy: 0.5, heading: 'موارد مكتشفة غير مطورة', unit: 'ليست احتياطيات مثبتة ولا تدخل في الترتيب السابق',
      tiles: [
        { c: 'mr', txt: '50–80', label: 'تريليون قدم³', sub: 'حقل بئر الله: تقديرات الغاز في المكمن', year: 'Kosmos وتقديرات أخرى', wide: true },
      ],
      small: 'الغاز في المكمن لا يعني كميات قابلة للاستخراج تجاريا' },
    // 38–56: production, one reference year
    { t: 40.6, type: 'hbars', n: 3, img: 'gas-plant-flares.jpg', fy: 0.45, heading: 'الإنتاج: من يتصدر؟', unit: 'الإنتاج المسوق للغاز الطبيعي لعام 2023 بالمليار متر مكعب',
      hi: 'dz', three: true, slow: true, plant: true,
      rows: [
        { c: 'dz', m: 104.3, v: 104.3, label: 'مليار م³', year: '2023' },
        { c: 'ly', m: 11.75, v: 11.75, label: 'مليار م³', year: '2023' },
        { c: 'tn', na: 'نحو 1.14 مليار م³ في 10 أشهر من 2024' },
        { c: 'ma', na: 'أقل من 0.1 مليار م³ سنويا من حقول صغيرة' },
        { c: 'mr', na: 'بدأ الإنتاج مطلع 2025 مع مشروع GTA' },
      ],
      foot: 'الجزائر وليبيا: OPEC 2023 · تونس والمغرب: بيانات وطنية وتقارير قطاعية' },
    // 56–65: Algeria, the region's largest producer
    { t: 58.6, type: 'stat', img: 'gas-pipeline.jpg', fy: 0.5, c: 'dz',
      v: 104.3, label: 'مليار م³ عام 2023', line: 'الجزائر أكبر منتج للغاز في المنطقة', small: 'نحو 9 أضعاف إنتاج ليبيا في السنة نفسها' },
    // 65–86: Mauritania, the newcomer (offshore map)
    { t: 67.6, type: 'geo', n: 4, img: 'flng-breakwater.jpg', fy: 0.55, heading: 'موريتانيا.. الوافد الجديد', unit: 'المياه المقابلة لموريتانيا والسنغال · مواقع تقريبية',
      box: [-19.6, 15.2, -14.6, 18.6], ids: { mr: '478', sn: '686' }, focus: ['mr', 'sn'],
      labels: [{ ll: [-15.2, 17.4], name: 'موريتانيا' }, { ll: [-15.2, 15.5], name: 'السنغال' }, { ll: [-18.6, 18.2], name: 'المحيط الأطلسي' }],
      places: [{ ll: [-15.98, 18.09], name: 'نواكشوط' }, { ll: [-16.49, 16.03], name: 'سان لويس', side: 'r' }],
      sites: [{ ll: [-16.85, 16.05], name: 'GTA', kind: 'hub', dx: -75, dy: 0 }, { ll: [-17.05, 16.75], name: 'بئر الله', kind: 'res', dx: -100, dy: 0 }],
      ship: { from: [-16.85, 16.05], to: [-19.9, 17.6], at: 6.5, dur: 9 },
      boxes: [
        { at: 1.0, until: 10.5, title: 'السلحفاة آحميم الكبير GTA', rows: [['نحو 2.4', 'مليون طن سنويا من الغاز المسال'], ['', 'الطاقة التصميمية للمرحلة الأولى']], foot: 'أول شحنة: أبريل 2025 · مشروع مشترك مع السنغال' },
        { at: 11.0, until: 21, title: 'بئر الله', rows: [['50–80', 'تريليون قدم³ غاز في المكمن'], ['', 'موارد مكتشفة غير مطورة']], foot: 'لم يدخل الإنتاج بعد، بخلاف GTA' },
      ] },
    // 86–105: routes to Europe
    { t: 88.6, type: 'geo', n: 5, img: 'gas-pipeline.jpg', fy: 0.4, heading: 'من حقول المغرب العربي إلى أوروبا', unit: 'أنابيب ومحطات غاز مسال · مسارات تقريبية',
      box: [-12.5, 26.5, 21.0, 44.2], mapH: 520, ids: { mr: '478', dz: '012', ma: '504', tn: '788', ly: '434' }, focus: ['dz', 'ly', 'ma', 'tn'],
      labels: [{ ll: [2.5, 30.0], name: 'الجزائر' }, { ll: [15.5, 29.4], name: 'ليبيا' }, { ll: [-7.6, 30.6], name: 'المغرب' }, { ll: [9.6, 32.3], name: 'تونس' },
        { ll: [-4.0, 40.0], name: 'إسبانيا' }, { ll: [13.8, 42.2], name: 'إيطاليا' }],
      routes: [
        { name: 'ميدغاز', kind: 'on', at: 1, dx: -70, dy: 6, pts: [[3.27, 32.93], [-1.38, 35.3], [-2.46, 36.84]] },
        { name: 'ترانسميد', kind: 'on', at: 2, dx: 40, dy: 28, pts: [[3.27, 32.93], [8.3, 34.6], [10.9, 36.9], [12.59, 37.65], [14.2, 38.1]] },
        { name: 'غرين ستريم', kind: 'on', at: 1, dx: 85, dy: 0, pts: [[10.3, 28.6], [12.2, 32.85], [14.25, 37.07]] },
        { name: 'المغاربي الأوروبي', kind: 'off', at: 3, dx: -95, dy: 0, pts: [[3.27, 32.93], [-1.9, 34.68], [-5.0, 34.0], [-5.8, 35.7], [-5.6, 36.05], [-4.78, 37.88]] },
        { name: 'غالسي', kind: 'plan', at: 2, dx: 55, dy: 0, pts: [[3.27, 32.93], [7.9, 36.85], [8.6, 39.0]] },
        { name: 'نيجيريا–المغرب', kind: 'plan', pts: [[-14.6, 25.5], [-13.2, 27.15], [-9.6, 30.4], [-6.8, 34.0]] },
      ],
      sites: [{ ll: [-0.3, 35.85], name: 'أرزيو', kind: 'lng' }, { ll: [6.9, 36.9], name: 'سكيكدة', kind: 'lng' }, { ll: [19.6, 30.4], name: 'مرسى البريقة', kind: 'lng', dx: -95, dy: 0 }],
      legend: [['on', 'خط عامل'], ['off', 'متوقف أمام الغاز الجزائري منذ 2021'], ['plan', 'مشروع مقترح'], ['lng', 'محطة غاز مسال']],
      chips: [
        { at: 2.5, until: 10, c: 'dz', text: 'نحو 49 مليار م³ صادرات 2024: نحو 35 عبر الأنابيب و14 غازا مسالا' },
        { at: 2.5, until: 10, c: 'ly', text: 'نحو 1.4 مليار م³ إلى إيطاليا عام 2024 عبر غرين ستريم' },
        { at: 10.5, until: 19, c: 'ma', text: 'الأنبوب المغاربي الأوروبي يعمل بالاتجاه المعاكس منذ 2022: المغرب يستورد عبر إسبانيا' },
        { at: 10.5, until: 19, c: 'tn', text: 'استوردت 64.3% من حاجتها من الغاز عام 2023 وتحصل على إتاوة عبور ترانسميد' },
      ] },
    // 105–111.5: revenues, only where an official figure exists, with its scope
    { t: 107.6, type: 'tiles', n: 6, img: 'gas-plant-flares.jpg', fy: 0.4, heading: 'من يجني العائدات؟', unit: 'لا أرقام رسمية لعائدات الغاز وحده قابلة للمقارنة بين الدول الخمس',
      tiles: [
        { c: 'dz', pre: 'نحو', v: 50, label: 'مليار دولار', sub: 'صادرات النفط والغاز معا', year: '2023' },
        { c: 'ly', txt: '—', label: 'لا رقم منفصل', sub: 'صادرات الغاز محدودة', year: '2024' },
        { c: 'mr', txt: '—', label: 'لا رقم سنوي بعد', sub: 'أول شحنة غاز مسال', year: '2025' },
      ],
      small: 'تونس والمغرب مستوردان صافيان للغاز' },
    // closing question, then the outro
    { t: 114.1, type: 'question', wordsAt: 0.2, lines: ['ثروات غازية هائلة..', 'لكن هل تتحول إلى تنمية', 'يستفيد منها المواطن المغاربي؟'] },
    { t: 119.1, type: 'outro' },  // logo to the centre, ERRIWAYA.COM and the handles
  ],
  sources: 'المصادر: EIA · OPEC · IEA · bp و Kosmos · بيانات وطنية وتقارير قطاعية',
  natural: false,
  music: 'light',
  calm: [107.6, 114.1],
  hits: [2.6, 14.6, 40.6, 67.6, 88.6],
  outroHit: 119.1,
};
