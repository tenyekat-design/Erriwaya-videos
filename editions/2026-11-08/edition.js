// Edition of 8 Nov 2026. All times are in seconds of the ORIGINAL voice-over (voiceover.mp3 in this
// folder); the template maps them onto the video timeline. Images are files in ./img.
// Voice: ElevenLabs "Hamida" (AI). The virtual anchor (AI, ElevenLabs OmniHuman) presents the opening
// (0 - 11.88) and the closing (173.04 - end): the anchor-open / anchor-close cards are replaced by the
// lip-synced anchor clips after rendering (scratch tools, see the session notes; the template is unchanged).
// dz-ne-flags / eu-dz-flags are drawn flag cards (no photo was supplied for the Algeria story).
window.TIMELINE = {
  date: 'الأحد 8 نوفمبر 2026',
  title: 'الموجز الإخباري',
  audioCut: 0.0,      // the anchor's "أهلا بكم" starts at 0
  audioEnd: 179.604,
  intro: 7.0,
  outroAt: 173.04,    // the anchor's closing line
  tail: 3.0,

  hook: { img: 'gn-arrests.jpg', f: [0.5, 0.45], kicker: 'مالي', topic: 'مجتمع',
          text: 'مالي تستقبل نحو 160 ألف شخص رحلتهم غينيا' },

  cover: { imgs: ['anchor-open.jpg'] },

  cards: [
    // the anchor opens the brief (replaced by the lip-synced clip)
    { img: 'anchor-open.jpg', moves: [{ t: 0.0, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.0] }] },
    // Mauritania: National Assembly, government programme, 2027 budget
    { kicker: 'موريتانيا', img: 'mr-parliament-2.jpg', moves: [{ t: 12.32, a: [0.5, 0.45, 1.0], b: [0.5, 0.4, 1.12] }] },
    { img: 'mr-djay-podium.jpg', moves: [{ t: 17.28, a: [0.5, 0.3, 1.0], b: [0.5, 0.28, 1.1] }] },
    { img: 'mr-parliament-1.jpg', moves: [{ t: 23.38, a: [0.5, 0.45, 1.0], b: [0.5, 0.4, 1.12] }] },
    { img: 'mr-djay-2.jpg', moves: [{ t: 29.44, a: [0.45, 0.3, 1.0], b: [0.45, 0.28, 1.1] }] },
    // Mauritania: ARMA, Nouakchott cleaning
    { img: 'arma-nouakchott.jpg', moves: [{ t: 35.98, a: [0.5, 0.4, 1.0], b: [0.45, 0.38, 1.12] }] },
    { img: 'arma-truck.jpg', moves: [{ t: 40.16, a: [0.55, 0.45, 1.0], b: [0.6, 0.45, 1.1] }] },
    { img: 'mr-waste-loader.jpg', moves: [{ t: 43.76, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.1] }] },
    { img: 'arma-fleet.jpg', moves: [{ t: 49.26, a: [0.4, 0.5, 1.0], b: [0.5, 0.5, 1.08] }] },
    { img: 'mr-cleaning.jpg', moves: [{ t: 54.54, a: [0.5, 0.45, 1.0], b: [0.55, 0.45, 1.1] }] },
    // Algeria - Niger
    { img: 'dz-ne-flags.jpg', moves: [{ t: 58.08, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }] },
    { img: 'eu-dz-flags.jpg', moves: [{ t: 64.62, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.06] }] },
    { img: 'dz-ne-flags.jpg', moves: [{ t: 76.72, a: [0.5, 0.5, 1.06], b: [0.5, 0.5, 1.0] }] },
    // Mali / Guinea: campaign against illegal gold mining
    { img: 'gn-gold-miners.jpg', moves: [{ t: 83.96, a: [0.62, 0.4, 1.0], b: [0.66, 0.4, 1.08] }] },
    { img: 'gn-arrests.jpg', moves: [{ t: 91.78, a: [0.5, 0.45, 1.0], b: [0.45, 0.45, 1.12] }] },
    { img: 'gn-gold-miners.jpg', moves: [{ t: 101.96, a: [0.25, 0.35, 1.0], b: [0.25, 0.32, 1.1] }] },
    { img: 'gn-arrests.jpg', moves: [{ t: 111.42, a: [0.35, 0.5, 1.15], b: [0.6, 0.5, 1.15] }] },
    { img: 'gn-gold-miners.jpg', moves: [{ t: 123.00, a: [0.62, 0.4, 1.2], b: [0.62, 0.4, 1.05] }] },
    // Libya - Egypt
    { img: 'ly-dbeibah-meeting.jpg', moves: [{ t: 128.98, a: [0.47, 0.4, 1.0], b: [0.47, 0.38, 1.15] }] },
    { img: 'ly-eg-seated.jpg', moves: [{ t: 134.08, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.08] }] },
    { img: 'ly-tr-maritime-map.jpg', moves: [{ t: 139.98, a: [0.45, 0.45, 1.0], b: [0.45, 0.45, 1.1] }] },
    { img: 'ly-eg-dbeibah-madbouly.jpg', moves: [{ t: 145.50, a: [0.5, 0.35, 1.0], b: [0.5, 0.33, 1.08] }] },
    { img: 'ly-eg-mou-1.jpg', moves: [{ t: 150.56, a: [0.5, 0.45, 1.0], b: [0.5, 0.45, 1.1] }] },
    { img: 'ly-dbeibah-summit.jpg', moves: [{ t: 159.02, a: [0.72, 0.45, 1.0], b: [0.75, 0.45, 1.08] }] },
    { img: 'ly-eg-mou-2.jpg', moves: [{ t: 163.50, a: [0.5, 0.45, 1.0], b: [0.5, 0.45, 1.1] }] },
    // the anchor closes the brief (replaced by the lip-synced clip)
    { img: 'anchor-close.jpg', moves: [{ t: 173.04, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.0] }] },
  ],

  headlines: [
    { t: 0.0, kicker: 'الموجز الإخباري', text: 'أبرز تطورات موريتانيا والمغرب العربي والساحل' },
    { t: 12.32, kicker: 'موريتانيا', topic: 'سياسة', text: 'الجمعية الوطنية تناقش برنامج حكومة ولد أجاي وتصوت عليه' },
    { t: 29.44, kicker: 'موريتانيا', topic: 'اقتصاد', text: 'إحالة مشروع ميزانية 2027 إلى اللجنة البرلمانية المختصة' },
    { t: 35.98, kicker: 'موريتانيا', topic: 'مجتمع', text: 'الداخلية تقيم أداء شركة آرما المكلفة بنظافة نواكشوط' },
    { t: 49.26, kicker: 'موريتانيا', topic: 'مجتمع', text: 'اجتماع حكومي يبحث تحسين الخدمة وخيارات بديلة' },
    { t: 58.08, kicker: 'الجزائر', topic: 'دبلوماسية', text: 'جدل أوروبي حول إرسال وحدات من الجيش الجزائري إلى النيجر' },
    { t: 69.18, kicker: 'الجزائر', topic: 'دبلوماسية', text: 'الجزائر تنفي تلقي طلب توضيحات وتؤكد أن الانتشار بطلب من النيجر' },
    { t: 83.96, kicker: 'مالي', topic: 'مجتمع', text: 'مالي تستقبل نحو 160 ألف شخص رحلتهم غينيا' },
    { t: 101.96, kicker: 'مالي', topic: 'مجتمع', text: 'ست وفيات وعمليات واسعة لنقل المتضررين وإغاثتهم' },
    { t: 111.42, kicker: 'غينيا', topic: 'أمن', text: 'توقيف 1263 شخصا في حملة غينيا ضد التنقيب غير القانوني عن الذهب' },
    { t: 128.98, kicker: 'ليبيا', topic: 'دبلوماسية', text: 'لجنة ليبية مصرية لبحث خلافات ترسيم الحدود البحرية' },
    { t: 150.56, kicker: 'ليبيا', topic: 'اقتصاد', text: 'تسريع مشاريع مشتركة مع مصر في الغاز والنفط والكهرباء' },
    { t: 173.04, kicker: 'الموجز الإخباري', text: 'هذه أبرز التطورات الإقليمية حتى الساعة' },
  ],

  chapters: [12.32, 35.98, 58.08, 83.96, 128.98],

  camera: [
    { t: 0.0, lon: 0, lat: 24.5, w: 58, d: 0.01 },
    { t: 12.1, lon: -11.5, lat: 20.0, w: 26, d: 1.8 },
    { t: 57.9, lon: 4.5, lat: 23.5, w: 34, d: 2.0 },
    { t: 83.8, lon: -9.0, lat: 12.8, w: 22, d: 2.0 },
    { t: 128.8, lon: 22.0, lat: 31.0, w: 34, d: 2.0 },
    { t: 172.9, lon: 0, lat: 24.5, w: 58, d: 2.2 },
  ],

  highlights: [
    { t: 0.0, end: 11.6, kind: 'primary', ids: ['478', '012', '562', '466', '324', '434'], origin: [-15.98, 18.09] },
    { t: 12.6, end: 57.8, kind: 'primary', ids: ['478'], origin: [-15.98, 18.09] },
    { t: 40.4, end: 57.8, kind: 'secondary', ids: ['504'], origin: [-6.84, 34.02] },
    { t: 58.4, end: 83.6, kind: 'primary', ids: ['012'], origin: [3.06, 36.75] },
    { t: 60.0, end: 83.6, kind: 'secondary', ids: ['562'], origin: [2.11, 13.51] },
    { t: 84.2, end: 128.6, kind: 'primary', ids: ['466'], origin: [-8.0, 12.64] },
    { t: 85.5, end: 128.6, kind: 'secondary', ids: ['324'], origin: [-13.68, 9.64] },
    { t: 129.2, end: 172.4, kind: 'primary', ids: ['434'], origin: [13.19, 32.89] },
    { t: 134.4, end: 172.4, kind: 'secondary', ids: ['818'], origin: [31.24, 30.04] },
    { t: 173.3, end: 178.5, kind: 'primary', ids: ['478', '012', '562', '466', '324', '434'], origin: [-15.98, 18.09] },
  ],

  pins: [
    { t: 12.8, end: 57.6, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right', main: true },
    { t: 58.6, end: 83.4, lon: 3.06, lat: 36.75, label: 'الجزائر', side: 'right', main: true },
    { t: 60.5, end: 83.4, lon: 2.11, lat: 13.51, label: 'نيامي', side: 'down' },
    { t: 84.4, end: 128.4, lon: -8.0, lat: 12.64, label: 'باماكو', side: 'right', main: true },
    { t: 86.0, end: 128.4, lon: -13.68, lat: 9.64, label: 'كوناكري', side: 'down' },
    { t: 98.0, end: 111.2, lon: -9.17, lat: 12.0, label: 'كوريمالي', side: 'left' },
    { t: 129.4, end: 172.2, lon: 13.19, lat: 32.89, label: 'طرابلس', side: 'left', main: true },
    { t: 134.6, end: 172.2, lon: 31.24, lat: 30.04, label: 'القاهرة', side: 'down' },
  ],

  lines: [
    { t: 61.0, dur: 2.0, end: 83.4, from: [3.06, 36.75], to: [2.11, 13.51], curve: 0.12, style: 'route' },
    { t: 92.0, dur: 2.0, end: 111.2, from: [-13.68, 9.64], to: [-8.0, 12.64], curve: -0.18, style: 'arc' },
    { t: 134.8, dur: 2.2, end: 172.2, from: [13.19, 32.89], to: [31.24, 30.04], curve: -0.15, style: 'arc' },
  ],

  stats: [],
};
