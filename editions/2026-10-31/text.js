// Text video of 31 Oct 2026 (no narration, 1080x1920): agreement between the Ministry of Higher Education and
// the student front. Rendered with: node tools/render-text.js --edition 2026-10-31
// Screen kinds and fields: see src/text.js. media: { img, f: [x, y], z: [from, to] } or { clip, from, f };
// tag: top-right label (carries over; '' hides it); {word} is green.
window.TEXTVIDEO = {
  title: 'اتفاق بين وزارة التعليم العالي والجبهة الطلابية ينهي أزمة النقل والمنح والسكن',
  hashtags: ['موريتانيا', 'الطلاب', 'التعليم_العالي'],
  screens: [
    { kind: 'hook', media: { clip: 'clips/protest.mp4', from: 12, f: [0.5, 0.5] },
      lines: ['بعد أيام من الاحتجاجات', 'والإضرابات في {الجامعة}'] },
    { kind: 'title', media: { clip: 'clips/protest.mp4', from: 18, f: [0.5, 0.5] }, tag: 'مشاهد متداولة',
      country: 'موريتانيا', topic: 'مجتمع', lines: ['اتفاق ينهي', 'أزمة {الطلاب}'] },
    { media: { img: 'campus-aerial.jpg', f: [0.5, 0.45], z: [1.0, 1.12] }, tag: '',
      label: 'مساء الجمعة', lines: ['وزارة التعليم العالي والجبهة الطلابية', 'تطويان خلافات النقل والمنح والسكن'] },
    { media: { clip: 'clips/protest.mp4', from: 26, f: [0.5, 0.55] }, tag: 'مشاهد متداولة',
      label: 'خلفية الأزمة', lines: ['رفض الطلاب قرارات الوزارة', 'في النقل والمنح والسكن والابتعاث'] },
    { media: { img: 'protest-night-speaker.jpg', f: [0.6, 0.35], z: [1.0, 1.1] }, tag: '',
      label: 'الجبهة الطلابية', lines: ['الاتفاق يلبي أبرز مطالبها', 'ويعني توقيف تحركاتها الاحتجاجية'] },
    { kind: 'quote', media: { img: 'lecture-hall.jpg', f: [0.5, 0.45], z: [1.0, 1.1] },
      label: 'محضر الاتفاق',
      text: 'إطلاق مسار شراكة جديدة مع المنظمات الطلابية، واستئناف تمثيل الطلاب داخل المجالس الإدارية والتربوية، وتشكيل لجنة مشتركة لإطار قانوني موحد ينظم عمل النقابات الطلابية',
      source: 'وزارة التعليم العالي والجبهة الطلابية' },
    { media: { img: 'lecture-hall-2.jpg', f: [0.5, 0.5], z: [1.0, 1.12] },
      label: 'لجان مشتركة', lines: ['لمراجعة معايير المنح والسكن', 'وتحسين الخدمات الجامعية وشفافية المنح'] },
    { kind: 'stat', media: { img: 'bhns-buses.jpg', f: [0.5, 0.5], z: [1.0, 1.08] },
      lines: ['{50} رحلة شهريا', 'بـ3.500 أوقية قديمة'], caption: 'أي ما يعادل 70 أوقية قديمة للرحلة' },
    { media: { img: 'bhns-buses.jpg', f: [0.6, 0.6], z: [1.15, 1.3] },
      label: 'ملف النقل', lines: ['الإبقاء على المحطات التقليدية', 'بتعريفة 50 أوقية والدفع بالتذكرة الإلكترونية'] },
    { media: { img: 'campus-aerial.jpg', f: [0.72, 0.68], z: [1.3, 1.15] },
      label: 'حزم تذاكر جديدة', lines: ['10 تذاكر صالحة 15 يوما', 'و20 تذكرة صالحة شهرا'] },
    { media: { img: 'protest-night-march.jpg', f: [0.5, 0.5], z: [1.0, 1.12] }, tag: 'مشاهد متداولة',
      label: 'منذ أيام', lines: ['احتجاجات وإضرابات طلابية', 'رفضا لرفع أسعار النقل وإلغاء محطاته'] },
    { kind: 'question', media: { clip: 'clips/protest.mp4', from: 34, f: [0.5, 0.5] },
      lines: ['هل يطوي الاتفاق', 'أزمة {الطلاب}؟'] },
  ],
};
