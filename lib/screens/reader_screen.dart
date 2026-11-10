import 'package:flutter/material.dart';
import '../audio.dart';
import '../data.dart';
import '../settings.dart';
import '../theme.dart';
import '../ornament.dart';
import '../ornate_page.dart';
import '../widgets.dart';
import 'ayah_sheet.dart';
import 'home_screen.dart';
import 'reciter_sheet.dart';
import 'settings_sheet.dart';

/// قارئ المصحف: صفحة بصفحة كما في المصحف المطبوع (٦٠٤ صفحات)، والتقليب من اليمين إلى اليسار.
class ReaderScreen extends StatefulWidget {
  const ReaderScreen({super.key, required this.initialPage, this.focus});
  final int initialPage;
  final Ayah? focus;

  @override
  State<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends State<ReaderScreen> {
  late final PageController _pc = PageController(initialPage: widget.initialPage - 1);
  late int _page = widget.initialPage;
  late final Riwaya _riwaya = Settings.instance.riwaya;
  Ayah? _selected;

  @override
  void initState() {
    super.initState();
    _selected = widget.focus;
    Settings.instance.setLastPage(_riwaya, _page);
    if (_selected != null) {
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted && _selected == widget.focus) setState(() => _selected = null);
      });
    }
  }

  @override
  void dispose() {
    _pc.dispose();
    super.dispose();
  }

  Surah get _surah {
    final list = Quran.instance.byPage[_riwaya]![_page - 1];
    return Quran.instance.surah(list.isEmpty ? 1 : list.first.surah);
  }

  Future<void> _openAyah(Ayah a) async {
    setState(() => _selected = a);
    await showAyahSheet(context, a, _riwaya);
    if (mounted) setState(() => _selected = null);
  }

  @override
  Widget build(BuildContext context) {
    final q = Quran.instance;
    return ListenableBuilder(
      listenable: Listenable.merge([Settings.instance, Audio.instance]),
      builder: (context, _) {
        final audio = Audio.instance;
        return Scaffold(
          appBar: AppBar(
            toolbarHeight: 68,
            title: Column(mainAxisSize: MainAxisSize.min, children: [
              Text('سورة ${_surah.name}', style: const TextStyle(fontSize: 19, height: 1.3, color: Colors.white)),
              Text('الجزء ${juzName(q.juzOfPage(_riwaya, _page))} · ${_riwaya.short}',
                  style: const TextStyle(fontSize: 13, height: 1.3, color: Colors.white70)),
            ]),
            actions: [
              IconButton(
                tooltip: 'استمع إلى السورة',
                icon: const Icon(Icons.headphones_rounded),
                onPressed: () => showReciterSheet(context, _riwaya, _surah.n),
              ),
              IconButton(
                tooltip: 'الإعدادات',
                icon: const Icon(Icons.tune),
                onPressed: () => showSettingsSheet(context, inReader: true),
              ),
            ],
          ),
          body: Column(children: [
            Expanded(
              child: PageView.builder(
                controller: _pc,
                itemCount: Quran.pages,
                onPageChanged: (i) {
                  setState(() => _page = i + 1);
                  Settings.instance.setLastPage(_riwaya, i + 1);
                },
                itemBuilder: (context, i) => _MushafPage(
                  page: i + 1,
                  riwaya: _riwaya,
                  selected: _selected,
                  playing: audio.ayah != null && audio.riwaya == _riwaya ? (audio.surah!, audio.ayah!) : null,
                  onTap: _openAyah,
                ),
              ),
            ),
            if (audio.active || audio.error != null) const AudioBar(),
          ]),
        );
      },
    );
  }
}

class _MushafPage extends StatefulWidget {
  const _MushafPage(
      {required this.page, required this.riwaya, required this.selected, required this.playing, required this.onTap});
  final int page;
  final Riwaya riwaya;
  final Ayah? selected;
  final (int, int)? playing;
  final ValueChanged<Ayah> onTap;

  @override
  State<_MushafPage> createState() => _MushafPageState();
}

class _MushafPageState extends State<_MushafPage> {
  /// عرض كل كلمة بحجم خط ١٠٠ (يُقاس مرة واحدة، والعرض يتناسب مع حجم الخط).
  static final Map<String, double> _w100 = {};
  /// تخطيط كل صفحة لكل مقاس: حجم الخط والأسطر وارتفاع السطر.
  static final Map<String, _Layout> _cache = {};

  double _measure(String font, String word) => _w100.putIfAbsent('$font|$word', () {
        final tp = TextPainter(
          text: TextSpan(text: word, style: TextStyle(fontFamily: font, fontSize: 100, height: 1)),
          textDirection: TextDirection.rtl,
        )..layout();
        final w = tp.width;
        tp.dispose();
        return w;
      });

  static const _space = .26; // مسافة الكلمات بالنسبة لحجم الخط
  static const _minFs = 11.0;

  /// يوزّع كلمات كل مقطع على أسطر بعرض w (بلا تجاوز)، ويعيد الأسطر.
  List<List<int>> _pack(List<_Word> words, List<int> runEnds, double fs, double w) {
    final lines = <List<int>>[];
    var start = 0;
    for (final end in runEnds) {
      var cur = <int>[];
      var width = 0.0;
      for (var i = start; i < end; i++) {
        final ww = words[i].w100 * fs / 100;
        final add = cur.isEmpty ? ww : ww + _space * fs;
        if (cur.isNotEmpty && width + add > w) {
          lines.add(cur);
          cur = [i];
          width = ww;
        } else {
          cur.add(i);
          width += add;
        }
      }
      if (cur.isNotEmpty) lines.add(cur);
      start = end;
    }
    return lines;
  }

  _Layout _layout(List<_Word> words, List<int> runEnds, int slots, int target, double w, double h, bool ornate,
      double maxScale) {
    final key = '${widget.riwaya.name}/${widget.page}/${w.round()}x${h.round()}/$maxScale';
    return _cache.putIfAbsent(key, () {
      final avail = w * .985;
      int count(double fs) => _pack(words, runEnds, fs, avail).length;
      if (ornate) {
        // الفاتحة وأول البقرة: خط كبير يملأ اللوحة طولاً، والأسطر متوسّطة كما في المصحف المطبوع
        bool fits(double fs) => (count(fs) + slots) * fs * 2.0 <= h;
        var lo = _minFs, hi = 44.0 * maxScale;
        for (var i = 0; i < 12; i++) {
          final mid = (lo + hi) / 2;
          fits(mid) ? lo = mid : hi = mid;
        }
        final lines = _pack(words, runEnds, lo, avail);
        return _Layout(lo, h / (lines.length + slots), lines);
      }
      // أكبر خط يسمح به ارتفاع السطر لو كانت الأسطر كما في المصحف المطبوع
      final fsMax = (h / (target + slots) / 1.75).clamp(_minFs, 34.0) * maxScale;
      var fs = fsMax;
      if (count(fs) > target) {
        var lo = _minFs, hi = fsMax;
        for (var i = 0; i < 10; i++) {
          final mid = (lo + hi) / 2;
          count(mid) <= target ? lo = mid : hi = mid;
        }
        fs = lo;
      }
      final lines = _pack(words, runEnds, fs, avail);
      final lineH = h / (lines.length + slots);
      // إن صغر السطر عن الخط (صفحة طويلة جداً على شاشة صغيرة) نصغّر الخط ليتّسع
      if (lineH < fs * 1.6) fs = lineH / 1.6;
      return _Layout(fs, lineH, _pack(words, runEnds, fs, avail));
    });
  }

  @override
  Widget build(BuildContext context) {
    final q = Quran.instance;
    final r = widget.riwaya;
    final colors = PageColors.of(context);
    final ayat = q.byPage[r]![widget.page - 1];
    final ornate = widget.page <= 2; // الفاتحة وأول البقرة مزخرفتان كما في المصحف المطبوع

    // كلمات الصفحة ومقاطعها: شريط سورة، أو بسملة، أو تتابع آيات
    final words = <_Word>[];
    final segs = <_Seg>[];
    final runEnds = <int>[];
    void closeRun() {
      if (segs.isNotEmpty && segs.last.isRun && segs.last.end == -1) {
        segs.last.end = words.length;
        runEnds.add(words.length);
      }
    }

    for (final a in ayat) {
      if (a.number == 1) {
        closeRun();
        segs.add(_Seg.banner(q.surah(a.surah)));
        if (a.surah != 9 && !(r == Riwaya.hafs && a.surah == 1)) segs.add(_Seg.basmala());
      }
      if (segs.isEmpty || !segs.last.isRun || segs.last.end != -1) segs.add(_Seg.run(words.length));
      for (final t in a.shown.split(' ')) {
        if (t.trim().isEmpty) continue;
        words.add(_Word(a, t, _measure(r.font, t)));
      }
    }
    closeRun();
    final slots = segs.where((s) => !s.isRun).length;
    final target = q.textLines(r, widget.page);
    if (ornate) return _ornatePage(words, segs.any((s) => s.basmala), colors);

    return Container(
      color: colors.paper,
      child: SafeArea(
        top: false,
        child: PageFrame(
          colors: colors,
          ornate: ornate,
          page: widget.page,
          child: MediaQuery(
            // تخطيط المصحف ثابت لا يتأثر بتكبير نصوص النظام؛ الحجم يُختار ليملأ الصفحة
            data: MediaQuery.of(context).copyWith(textScaler: TextScaler.noScaling),
            child: LayoutBuilder(builder: (context, box) {
              final lay = _layout(words, runEnds, slots, target, box.maxWidth, box.maxHeight, ornate,
                  Settings.instance.fontScale.clamp(.8, 1.2).toDouble());
              final style = TextStyle(fontFamily: r.font, fontSize: lay.fs, color: colors.ink);
              final rows = <Widget>[];
              var li = 0;
              for (final s in segs) {
                if (s.banner != null) {
                  rows.add(SizedBox(
                      height: lay.lineH,
                      child: SurahBanner(surah: s.banner!, riwaya: r, colors: colors, height: lay.lineH)));
                } else if (s.basmala) {
                  rows.add(SizedBox(height: lay.lineH, child: Center(child: Text(r.basmala, style: style))));
                } else {
                  while (li < lay.lines.length && lay.lines[li].first < s.end) {
                    final line = lay.lines[li];
                    final lastOfRun = li + 1 >= lay.lines.length || lay.lines[li + 1].first >= s.end;
                    final natural = line.fold<double>(0, (t, i) => t + words[i].w100 * lay.fs / 100) +
                        (line.length - 1) * _space * lay.fs;
                    // الفاتحة وأول البقرة: أسطر متوسّطة بمسافات طبيعية؛ وغيرهما: أسطر ممتلئة من الحافة إلى الحافة
                    final full = !ornate && !(lastOfRun && natural < box.maxWidth * .8) && line.length > 1;
                    final wordsW = natural - (line.length - 1) * _space * lay.fs;
                    final gap = full ? (box.maxWidth - wordsW) / (line.length - 1) - 1.5 : _space * lay.fs;
                    rows.add(SizedBox(
                      height: lay.lineH,
                      child: Row(
                        textDirection: TextDirection.rtl,
                        mainAxisAlignment: full ? MainAxisAlignment.spaceBetween : MainAxisAlignment.center,
                        children: [
                          // كل كلمة تأخذ نصف الفراغ على جانبيها، فيصير الضغط على أي موضع في السطر ضغطاً على آية
                          for (var k = 0; k < line.length; k++)
                            _wordWidget(words[line[k]], style, colors,
                                EdgeInsets.only(right: k == 0 ? 0 : gap / 2, left: k == line.length - 1 ? 0 : gap / 2)),
                        ],
                      ),
                    ));
                    li++;
                  }
                }
              }
              final column = Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: rows,
              );
              final used = lay.lineH * rows.length;
              return used > box.maxHeight + 1 ? SingleChildScrollView(child: column) : column;
            }),
          ),
        ),
      ),
    );
  }

  /// الفاتحة وأول البقرة: النصّ داخل ميدالية مزخرفة، وكل سطر ممتدّ بعرض الميدالية عند موضعه
  /// فتأتي الأسطر متناظرة حول المحور وتملأ اللوحة من أعلاها إلى أسفلها.
  _Layout _ornateLayout(List<_Word> words, bool basmala, Medallion m, double yTop, double yBot) {
    final key = 'ornate/${widget.riwaya.name}/${widget.page}/${m.w.round()}x${m.h.round()}';
    return _cache.putIfAbsent(key, () {
      final d = m.textInset;
      final first = basmala ? 1 : 0;
      List<List<int>>? pack(double fs, int n, double lineH) {
        final lines = <List<int>>[];
        var i = 0;
        for (var li = first; li < n; li++) {
          final avail = 2 * m.halfW(yTop + (li + .5) * lineH, d) * .97;
          final cur = <int>[];
          var wd = 0.0;
          while (i < words.length) {
            final ww = words[i].w100 * fs / 100;
            final add = cur.isEmpty ? ww : ww + _space * fs;
            if (cur.isNotEmpty && wd + add > avail) break;
            cur.add(i);
            wd += add;
            i++;
          }
          lines.add(cur);
        }
        return i >= words.length ? lines : null;
      }

      _Layout? best;
      var bestScore = -1e9;
      for (var n = 4; n <= 18; n++) {
        final lineH = (yBot - yTop) / n;
        var lo = _minFs, hi = lineH / 1.8;
        if (hi <= lo || pack(lo, n, lineH) == null) continue;
        for (var k = 0; k < 12; k++) {
          final mid = (lo + hi) / 2;
          pack(mid, n, lineH) != null ? lo = mid : hi = mid;
        }
        final lines = pack(lo, n, lineH)!;
        // أكبر خط، دون أسطر فارغة ولا أسطر قليلة الكلمات تتّسع فراغاتها
        final empty = lines.where((l) => l.isEmpty).length;
        final sparse = lines.where((l) => l.length < 3).length;
        final score = lo - empty * 4 - sparse * 1.5;
        if (score > bestScore) {
          bestScore = score;
          best = _Layout(lo, lineH, lines.where((l) => l.isNotEmpty).toList());
        }
      }
      return best ?? _Layout(_minFs, (yBot - yTop) / 10, [List.generate(words.length, (i) => i)]);
    });
  }

  Widget _ornatePage(List<_Word> words, bool basmala, PageColors colors) {
    final r = widget.riwaya;
    final surah = Quran.instance.surah(widget.page == 1 ? 1 : 2);
    return Container(
      color: colors.paper,
      child: SafeArea(
        top: false,
        child: MediaQuery(
          data: MediaQuery.of(context).copyWith(textScaler: TextScaler.noScaling),
          child: LayoutBuilder(builder: (context, box) {
            final m = Medallion(box.biggest);
            final d = m.textInset;
            final yTop = m.ts(d) + 2, yBot = m.bs(d) - 2;
            final lay = _ornateLayout(words, basmala, m, yTop, yBot);
            // توزيع الأسطر على ارتفاع اللوحة كله
            final n = lay.lines.length + (basmala ? 1 : 0);
            final lineH = (yBot - yTop) / n;
            final style = TextStyle(fontFamily: r.font, fontSize: lay.fs, color: colors.ink);
            final kids = <Widget>[
              Positioned.fill(
                child: CustomPaint(
                  painter: MedallionPainter(
                      colors: colors, title: 'سورة ${surah.name}', titleFont: r.font, page: widget.page),
                ),
              ),
            ];
            var li = 0;
            if (basmala) {
              kids.add(Positioned(
                  top: yTop,
                  left: 0,
                  right: 0,
                  height: lineH,
                  child: Center(child: Text(r.basmala, style: style, textDirection: TextDirection.rtl))));
              li = 1;
            }
            for (var k = 0; k < lay.lines.length; k++, li++) {
              final line = lay.lines[k];
              final y = yTop + li * lineH;
              final hw = m.halfW(y + lineH / 2, d) * .97;
              final wordsW = line.fold<double>(0, (t, i) => t + words[i].w100 * lay.fs / 100);
              final natural = wordsW + (line.length - 1) * _space * lay.fs;
              final last = k == lay.lines.length - 1;
              final full = line.length > 1 && !(last && natural < 2 * hw * .8);
              final gap = full ? (2 * hw - wordsW) / (line.length - 1) - 1.5 : _space * lay.fs;
              kids.add(Positioned(
                top: y,
                left: m.cx - hw,
                width: 2 * hw,
                height: lineH,
                child: Row(
                  textDirection: TextDirection.rtl,
                  mainAxisAlignment: full ? MainAxisAlignment.spaceBetween : MainAxisAlignment.center,
                  children: [
                    for (var j = 0; j < line.length; j++)
                      _wordWidget(words[line[j]], style, colors,
                          EdgeInsets.only(right: j == 0 ? 0 : gap / 2, left: j == line.length - 1 ? 0 : gap / 2)),
                  ],
                ),
              ));
            }
            return Stack(children: kids);
          }),
        ),
      ),
    );
  }

  Widget _wordWidget(_Word w, TextStyle style, PageColors colors, EdgeInsets pad) {
    final a = w.ayah;
    final on = widget.selected?.index == a.index ||
        (widget.playing != null && widget.playing!.$1 == a.surah && widget.playing!.$2 == a.number);
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => widget.onTap(a),
      child: Container(
        padding: pad,
        color: on ? colors.highlight : null,
        child: Text(w.text, style: style, textDirection: TextDirection.rtl, softWrap: false),
      ),
    );
  }
}

class _Word {
  _Word(this.ayah, this.text, this.w100);
  final Ayah ayah;
  final String text;
  final double w100;
}

class _Layout {
  _Layout(this.fs, this.lineH, this.lines);
  final double fs, lineH;
  final List<List<int>> lines;
}

/// مقطع من الصفحة: شريط سورة، أو بسملة، أو تتابع آيات (كلمات من start إلى end).
class _Seg {
  _Seg.banner(this.banner)
      : basmala = false,
        isRun = false,
        start = 0;
  _Seg.basmala()
      : banner = null,
        basmala = true,
        isRun = false,
        start = 0;
  _Seg.run(this.start)
      : banner = null,
        basmala = false,
        isRun = true;
  final Surah? banner;
  final bool basmala;
  final bool isRun;
  final int start;
  int end = -1;
}

/// شريط التلاوة أسفل الصفحة: القارئ، تشغيل/إيقاف، التقدّم.
class AudioBar extends StatelessWidget {
  const AudioBar({super.key});

  @override
  Widget build(BuildContext context) {
    final a = Audio.instance;
    final scheme = Theme.of(context).colorScheme;
    final q = Quran.instance;
    final title = a.surah == null
        ? ''
        : a.ayah != null
            ? 'سورة ${q.surah(a.surah!).name} · آية ${ar(a.ayah!)} · مشاري العفاسي'
            : 'سورة ${q.surah(a.surah!).name} · ${a.reciter?.name ?? ''}';
    return Material(
      color: scheme.surfaceContainerHigh,
      elevation: 6,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 6, 8, 4),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            if (a.error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(a.error!, style: TextStyle(color: scheme.error, fontSize: 14)),
              ),
            Row(children: [
              IconButton.filled(
                tooltip: a.playing ? 'إيقاف مؤقت' : 'تشغيل',
                style: IconButton.styleFrom(backgroundColor: Brand.green, foregroundColor: Colors.white),
                onPressed: a.surah == null ? null : a.toggle,
                icon: a.buffering
                    ? const SizedBox(
                        width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Icon(a.playing ? Icons.pause_rounded : Icons.play_arrow_rounded),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15)),
              ),
              if (a.reciter != null && a.surah != null)
                a.isDownloaded(a.reciter!, a.surah!)
                    ? const Padding(
                        padding: EdgeInsets.all(8),
                        child: Icon(Icons.download_done_rounded, color: Brand.green, semanticLabel: 'محمّلة'))
                    : a.progress[Audio.key(a.reciter!, a.surah!)] != null
                        ? Padding(
                            padding: const EdgeInsets.all(12),
                            child: SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                    value: a.progress[Audio.key(a.reciter!, a.surah!)] == 0
                                        ? null
                                        : a.progress[Audio.key(a.reciter!, a.surah!)],
                                    strokeWidth: 2.5)))
                        : IconButton(
                            tooltip: 'تحميل السورة',
                            icon: const Icon(Icons.download_rounded),
                            onPressed: () => a.download(a.reciter!, a.surah!)),
              IconButton(tooltip: 'إغلاق التلاوة', icon: const Icon(Icons.close), onPressed: a.stop),
            ]),
            if (a.surah != null) const _Progress(),
          ]),
        ),
      ),
    );
  }
}

class _Progress extends StatelessWidget {
  const _Progress();

  String _fmt(Duration d) {
    final m = d.inMinutes, s = d.inSeconds % 60;
    return '${ar(m)}:${ar(s ~/ 10)}${ar(s % 10)}';
  }

  @override
  Widget build(BuildContext context) {
    final p = Audio.instance.player;
    return StreamBuilder<Duration>(
      stream: p.positionStream,
      builder: (context, snap) {
        final pos = snap.data ?? Duration.zero;
        final dur = p.duration ?? Duration.zero;
        final max = dur.inMilliseconds <= 0 ? 1.0 : dur.inMilliseconds.toDouble();
        return Row(children: [
          Text(_fmt(pos), style: const TextStyle(fontSize: 12)),
          Expanded(
            child: Slider(
              value: pos.inMilliseconds.clamp(0, max).toDouble(),
              max: max,
              onChanged: dur == Duration.zero ? null : (v) => p.seek(Duration(milliseconds: v.round())),
            ),
          ),
          Text(_fmt(dur), style: const TextStyle(fontSize: 12)),
        ]);
      },
    );
  }
}
