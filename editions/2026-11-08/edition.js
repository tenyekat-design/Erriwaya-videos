// Edition of 8 Nov 2026. All times are in seconds of the ORIGINAL voice-over (voiceover.mp3 in this
// folder); the template maps them onto the video timeline. Images are files in ./img.
// DRAFT: the voice-over has not arrived yet; times below are estimated from the script (script.txt,
// ~2.3 words/s) and must be replaced with the transcript timings (python3 tools/transcribe.py 2026-11-08).
// Algeria-Niger photos come from earlier editions in the repo (dz-attaf-tiani: 2026-11-05,
// dz-tebboune-niger: 2026-10-27). ml-displaced-1/2 are crops of the user's photo without the TV branding.
window.TIMELINE = {
  date: 'الأحد 8 نوفمبر 2026',
  title: 'الموجز الإخباري',
  audioCut: 0.0,
  audioEnd: 152.8,
  intro: 7.0,
  outroAt: 147.8,     // "هذه أبرز التطورات الإقليمية حتى الساعة"
  tail: 3.0,

  hook: { img: 'ml-displaced-2.jpg', f: [0.5, 0.35], kicker: 'مالي', topic: 'مجتمع',
          text: 'مالي تستقبل نحو 160 ألف شخص رحّلتهم غينيا' },

  cards: [
    { kicker: 'مالي', img: 'ml-displaced-2.jpg', moves: [{ t: 0.0, a: [0.5, 0.35, 1.0], b: [0.5, 0.32, 1.08] }] },
    { kicker: 'موريتانيا', img: 'mr-assembly-session.jpg', moves: [{ t: 3.2, a: [0.5, 0.5, 1.0], b: [0.5, 0.5, 1.08] }] },
    { kicker: 'ليبيا', img: 'ly-eg-agreement.jpg', moves: [{ t: 6.4, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.06] }] },
    // Mauritania: government programme in parliament
    { img: 'mr-assembly-hall.jpg', moves: [{ t: 9.7, a: [0.5, 0.5, 1.0], b: [0.5, 0.45, 1.12] }] },
    { img: 'mr-pm-podium.jpg', moves: [{ t: 15.0, a: [0.5, 0.35, 1.0], b: [0.5, 0.3, 1.1] }] },
    { img: 'mr-assembly-session.jpg', moves: [{ t: 19.5, a: [0.5, 0.55, 1.0], b: [0.45, 0.55, 1.12] }] },
    { img: 'mr-pm-portrait.jpg', moves: [{ t: 24.5, a: [0.45, 0.35, 1.0], b: [0.45, 0.32, 1.08] }] },
    // Nouakchott: ARMA cleaning contract
    { img: 'mr-waste-loader.jpg', moves: [{ t: 30.3, a: [0.55, 0.7, 1.0], b: [0.6, 0.7, 1.08] }] },
    { img: 'mr-arma-fleet.jpg', moves: [{ t: 35.0, a: [0.5, 0.55, 1.0], b: [0.45, 0.55, 1.12] }] },
    { img: 'arma-truck.jpg', moves: [{ t: 39.5, a: [0.6, 0.5, 1.0], b: [0.65, 0.5, 1.1] }] },
    { img: 'mr-sanitation.jpg', moves: [{ t: 43.5, a: [0.5, 0.5, 1.0], b: [0.52, 0.45, 1.1] }] },
    // Algeria - Niger
    { img: 'dz-attaf-tiani.jpg', moves: [{ t: 48.3, a: [0.5, 0.4, 1.0], b: [0.5, 0.35, 1.1] }] },
    { img: 'ne-airport.jpg', moves: [{ t: 55.5, a: [0.5, 0.45, 1.0], b: [0.55, 0.42, 1.1] }] },
    { img: 'dz-tebboune-niger.jpg', moves: [{ t: 62.5, a: [0.5, 0.4, 1.0], b: [0.5, 0.36, 1.08] }] },
    // Mali: people expelled from Guinea
    { img: 'ml-displaced-2.jpg', moves: [{ t: 70.7, a: [0.5, 0.35, 1.0], b: [0.5, 0.3, 1.08] }] },
    { img: 'gold-miners.jpg', moves: [{ t: 76.0, a: [0.55, 0.4, 1.0], b: [0.6, 0.38, 1.08] }] },
    { img: 'ml-displaced-1.jpg', moves: [{ t: 82.0, a: [0.5, 0.4, 1.0], b: [0.5, 0.36, 1.08] }] },
    { img: 'ml-displaced-2.jpg', moves: [{ t: 88.5, a: [0.5, 0.3, 1.1], b: [0.5, 0.3, 1.0] }] },
    // Guinea: 1,263 arrests
    { img: 'gn-arrests.jpg', moves: [{ t: 94.3, a: [0.5, 0.5, 1.0], b: [0.5, 0.45, 1.12] }] },
    { img: 'gold-miners.jpg', moves: [{ t: 101.5, a: [0.3, 0.4, 1.1], b: [0.35, 0.4, 1.2] }] },
    // Libya - Egypt: maritime border committee
    { img: 'ly-eg-pms.jpg', moves: [{ t: 109.7, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.08] }] },
    { img: 'ly-eg-maritime-map.jpg', moves: [{ t: 115.5, a: [0.5, 0.5, 1.0], b: [0.45, 0.45, 1.12] }] },
    { img: 'ly-dbeibah-meeting.jpg', moves: [{ t: 122.0, a: [0.47, 0.4, 1.0], b: [0.47, 0.38, 1.1] }] },
    // Libya - Egypt: energy projects
    { img: 'ly-eg-mou.jpg', moves: [{ t: 128.5, a: [0.5, 0.5, 1.0], b: [0.5, 0.55, 1.08] }] },
    { img: 'ly-eg-mou-signing.jpg', moves: [{ t: 134.0, a: [0.5, 0.55, 1.0], b: [0.5, 0.6, 1.1] }] },
    { img: 'ly-energy-summit.jpg', moves: [{ t: 138.5, a: [0.6, 0.45, 1.0], b: [0.65, 0.45, 1.08] }] },
    { img: 'ly-eg-agreement.jpg', moves: [{ t: 143.0, a: [0.5, 0.4, 1.0], b: [0.5, 0.38, 1.08] }] },
    // wrap-up
    { img: 'mr-assembly-hall.jpg', moves: [{ t: 147.8, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.15] }] },
    { img: 'gn-arrests.jpg', moves: [{ t: 150.0, a: [0.5, 0.5, 1.05], b: [0.5, 0.5, 1.12] }] },
  ],

  headlines: [
    { t: 0.0, kicker: 'الموجز الإخباري', text: 'أبرز تطورات موريتانيا والمغرب العربي والساحل' },
    { t: 9.7, kicker: 'موريتانيا', topic: 'سياسة', text: 'الجمعية الوطنية تناقش غدا برنامج حكومة ولد أجاي وتصوت عليه' },
    { t: 22.0, kicker: 'موريتانيا', topic: 'اقتصاد', text: 'إحالة مشروع ميزانية 2027 إلى اللجنة البرلمانية المختصة' },
    { t: 30.3, kicker: 'موريتانيا', topic: 'مجتمع', text: 'الداخلية تواصل تقييم أداء شركة آرما المكلفة بنظافة نواكشوط' },
    { t: 40.5, kicker: 'موريتانيا', topic: 'مجتمع', text: 'اجتماع حكومي يبحث تحسين الخدمة وسط دراسة خيارات بديلة' },
    { t: 48.3, kicker: 'الجزائر', topic: 'دبلوماسية', text: 'جدل دبلوماسي حول إرسال وحدات من الجيش الجزائري إلى النيجر' },
    { t: 58.5, kicker: 'الجزائر', topic: 'دبلوماسية', text: 'الجزائر تنفي تلقي طلب أوروبي بتوضيحات: الانتشار بطلب نيجري' },
    { t: 70.7, kicker: 'مالي', topic: 'مجتمع', text: 'مالي تستقبل نحو 160 ألف شخص رحّلتهم غينيا بينهم 60 ألفا في كوريمالي' },
    { t: 84.5, kicker: 'مالي', topic: 'مجتمع', text: 'ست وفيات وإصابات، وعمليات واسعة لنقل المتضررين وإغاثتهم' },
    { t: 94.3, kicker: 'غينيا', topic: 'أمن', text: 'توقيف 1263 شخصا في حملة على التنقيب غير القانوني عن الذهب' },
    { t: 102.5, kicker: 'غينيا', topic: 'أمن', text: 'تداعيات على العلاقات والحركة السكانية بين دول المنطقة' },
    { t: 109.7, kicker: 'ليبيا', topic: 'دبلوماسية', text: 'لجنة ليبية مصرية مشتركة لبحث الخلاف على ترسيم الحدود البحرية' },
    { t: 119.5, kicker: 'ليبيا', topic: 'دبلوماسية', text: 'بما فيها مذكرة التفاهم بين ليبيا وتركيا لعام 2019' },
    { t: 128.5, kicker: 'ليبيا', topic: 'اقتصاد', text: 'القاهرة وطرابلس تسرعان مشاريع مشتركة في الغاز والنفط والكهرباء' },
    { t: 137.0, kicker: 'ليبيا', topic: 'اقتصاد', text: 'ربط خطوط الغاز وتكرير النفط الليبي في المصافي المصرية' },
    { t: 147.8, kicker: 'الموجز الإخباري', text: 'هذه أبرز التطورات الإقليمية حتى الساعة' },
  ],

  chapters: [9.7, 30.3, 48.3, 70.7, 94.3, 109.7, 128.5],

  camera: [
    { t: 0.0, lon: 2, lat: 24.5, w: 60, d: 0.01 },
    { t: 9.5, lon: -11.5, lat: 20.0, w: 26, d: 1.8 },
    { t: 48.1, lon: 4.0, lat: 30.0, w: 46, d: 2.0 },
    { t: 70.5, lon: -9.5, lat: 12.0, w: 22, d: 2.0 },
    { t: 109.5, lon: 22.0, lat: 32.0, w: 34, d: 2.0 },
    { t: 147.6, lon: 2, lat: 24.5, w: 60, d: 2.2 },
  ],

  highlights: [
    { t: 0.0, end: 9.4, kind: 'primary', ids: ['478', '012', '466', '324', '434'], origin: [-15.98, 18.09] },
    { t: 10.0, end: 47.9, kind: 'primary', ids: ['478'], origin: [-15.98, 18.09] },
    { t: 48.6, end: 70.3, kind: 'primary', ids: ['012'], origin: [3.06, 36.75] },
    { t: 49.5, end: 70.3, kind: 'secondary', ids: ['562'], origin: [2.11, 13.51] },
    { t: 71.0, end: 109.3, kind: 'primary', ids: ['466'], origin: [-8.0, 12.64] },
    { t: 72.5, end: 109.3, kind: 'secondary', ids: ['324'], origin: [-13.68, 9.51] },
    { t: 110.0, end: 147.4, kind: 'primary', ids: ['434'], origin: [13.19, 32.89] },
    { t: 111.5, end: 147.4, kind: 'secondary', ids: ['818'], origin: [31.24, 30.04] },
    { t: 148.0, end: 152.5, kind: 'primary', ids: ['478', '012', '466', '324', '434'], origin: [-15.98, 18.09] },
  ],

  pins: [
    { t: 10.2, end: 47.7, lon: -15.98, lat: 18.09, label: 'نواكشوط', side: 'right', main: true },
    { t: 48.8, end: 70.1, lon: 3.06, lat: 36.75, label: 'الجزائر', side: 'up', main: true },
    { t: 50.0, end: 70.1, lon: 2.11, lat: 13.51, label: 'نيامي', side: 'down' },
    { t: 53.0, end: 70.1, lon: 4.35, lat: 50.85, label: 'بروكسل', side: 'right' },
    { t: 71.2, end: 109.1, lon: -8.0, lat: 12.64, label: 'باماكو', side: 'right', main: true },
    { t: 78.0, end: 109.1, lon: -9.43, lat: 11.97, label: 'كوريمالي', side: 'down' },
    { t: 94.5, end: 109.1, lon: -13.68, lat: 9.51, label: 'كوناكري', side: 'left' },
    { t: 110.2, end: 147.2, lon: 13.19, lat: 32.89, label: 'طرابلس', side: 'left', main: true },
    { t: 111.8, end: 147.2, lon: 31.24, lat: 30.04, label: 'القاهرة', side: 'right' },
  ],

  lines: [
    { t: 50.0, dur: 2.2, end: 70.1, from: [3.06, 36.75], to: [2.11, 13.51], curve: 0.15, style: 'route' },
    { t: 74.0, dur: 2.0, end: 109.1, from: [-13.68, 9.51], to: [-8.0, 12.64], curve: -0.2, style: 'route' },
    { t: 112.0, dur: 2.0, end: 147.2, from: [13.19, 32.89], to: [31.24, 30.04], curve: -0.15, style: 'arc' },
  ],

  stats: [],
};
