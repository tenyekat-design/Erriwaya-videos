// Infographic: camels in the Maghreb (Mauritania, Algeria, Tunisia, Morocco, Libya).
// Numbers: FAOSTAT, "Production: Crops and livestock products", item Camels, element Stocks, year 2024
// (as compiled from FAOSTAT by atlasbig / statspanda; national figures are partly FAO estimates).
// Morocco: national livestock census, Ministry of Agriculture, 26 Jun - 11 Aug 2025 (Hespress).
window.INFO = {
  slug: 'camels-maghreb',
  title: 'الإبل في المنطقة المغاربية',
  year: 2024,
  world: 44.3e6,   // world camel stock 2024 (FAOSTAT)
  source: 'المصدر: منظمة الأغذية والزراعة (FAOSTAT) – بيانات 2024',
  source2: 'المغرب: الإحصاء الوطني للماشية 2025',
  site: 'www.erriwaya.com',
  countries: [
    { id: '478', name: 'موريتانيا', n: 1557920, img: 'two-camels-dunes.jpg', f: [0.62, 0.55], lon: -10.5, lat: 20.3,
      rank: 'المرتبة الأولى مغاربياً', fact: 'قرابة ثلثي إبل المنطقة' },
    { id: '012', name: 'الجزائر', n: 466642, img: 'camel-walking.jpg', f: [0.55, 0.5], lon: 2.6, lat: 28.2,
      rank: 'المرتبة الثانية', fact: 'نحو خُمس إبل المنطقة' },
    { id: '788', name: 'تونس', n: 239078, img: 'camel-grass.jpg', f: [0.5, 0.45], lon: 9.5, lat: 34.0,
      rank: 'المرتبة الثالثة', fact: 'نحو عُشر إبل المنطقة' },
    { id: '504', name: 'المغرب', n: 72000, img: 'herd-white.jpg', f: [0.55, 0.5], lon: -6.2, lat: 32.0,
      rank: 'المرتبة الرابعة', fact: 'الإحصاء الوطني 2025: 106,044 رأس', factChip: true },
    { id: '434', name: 'ليبيا', n: 63956, img: 'camel-rope.jpg', f: [0.55, 0.42], lon: 17.5, lat: 27.0,
      rank: 'المرتبة الخامسة', fact: 'أقل من 3% من إبل المنطقة' },
  ],
  hook: { img: 'camel-rope.jpg', f: [0.58, 0.45] },
  totalImg: 'herd-white.jpg',
  worldImg: 'herd-well.jpg',
};
