import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import '../audio.dart';
import '../data.dart';
import '../settings.dart';
import '../theme.dart';
import '../ornament.dart';
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
  final List<TapGestureRecognizer> _taps = [];

  void _clear() {
    for (final t in _taps) {
      t.dispose();
    }
    _taps.clear();
  }

  @override
  void dispose() {
    _clear();
    super.dispose();
  }

  /// حجم الخط الذي تتسع به الصفحة كلها دون تمرير، محفوظ لكل صفحة ومقاس.
  static final Map<String, double> _fitCache = {};

  /// يبحث عن أكبر حجم خط (حتى الحجم المختار في الإعدادات) تتسع به الصفحة في المساحة المتاحة.
  double _fit(List<_Seg> segs, double maxFs, double w, double h, TextScaler scaler, bool ornate) {
    final key = '${widget.riwaya.name}/${widget.page}/${w.round()}x${h.round()}/$maxFs/${scaler.scale(10)}';
    final hit = _fitCache[key];
    if (hit != null) return hit;
    double measure(double fs) {
      var total = 0.0;
      for (final s in segs) {
        if (s.banner != null) {
          total += _bannerH;
          continue;
        }
        final style = TextStyle(fontFamily: widget.riwaya.font, fontSize: fs, height: _lineH);
        final tp = TextPainter(
          text: TextSpan(text: s.text, style: style),
          textDirection: TextDirection.rtl,
          textAlign: s.basmala || ornate ? TextAlign.center : TextAlign.justify,
          textScaler: scaler,
        )..layout(maxWidth: w);
        total += tp.height + (s.basmala ? 2 : 0);
        tp.dispose();
      }
      return total;
    }

    var lo = 12.0, hi = maxFs;
    if (measure(hi) <= h) {
      lo = hi;
    } else {
      for (var i = 0; i < 9; i++) {
        final mid = (lo + hi) / 2;
        measure(mid) <= h ? lo = mid : hi = mid;
      }
    }
    return _fitCache[key] = lo;
  }

  static const _lineH = 1.95;
  static const _bannerH = 78.0;

  @override
  Widget build(BuildContext context) {
    _clear();
    final q = Quran.instance;
    final r = widget.riwaya;
    final colors = PageColors.of(context);
    final scale = Settings.instance.fontScale;
    final ayat = q.byPage[r]![widget.page - 1];
    final ornate = widget.page <= 2; // الفاتحة وأول البقرة مزخرفتان كما في المصحف المطبوع
    final scaler = MediaQuery.textScalerOf(context);

    // مقاطع الصفحة: شريط سورة، بسملة، أو تتابع آيات
    final segs = <_Seg>[];
    var run = <Ayah>[];
    void flushRun() {
      if (run.isEmpty) return;
      segs.add(_Seg.run(run));
      run = [];
    }

    for (final a in ayat) {
      if (a.number == 1) {
        flushRun();
        segs.add(_Seg.banner(q.surah(a.surah)));
        final hasBasmala = a.surah != 9 && !(r == Riwaya.hafs && a.surah == 1);
        if (hasBasmala) segs.add(_Seg.basmala(r.basmala));
      }
      run.add(a);
    }
    flushRun();

    final pageNo = Text(ar(widget.page), style: TextStyle(color: colors.muted, fontSize: 15));
    return Container(
      color: colors.paper,
      child: SafeArea(
        top: false,
        child: PageFrame(
          colors: colors,
          ornate: ornate,
          child: Column(children: [
            Expanded(
              child: LayoutBuilder(builder: (context, box) {
                final fs = _fit(segs, 23 * scale, box.maxWidth, box.maxHeight - 6, scaler, ornate);
                final textStyle = TextStyle(fontFamily: r.font, fontSize: fs, height: _lineH, color: colors.ink);
                final blocks = <Widget>[
                  for (final s in segs)
                    if (s.banner != null)
                      SizedBox(height: _bannerH, child: SurahBanner(surah: s.banner!, riwaya: r, colors: colors))
                    else if (s.basmala)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 2),
                        child: Text(s.text, textAlign: TextAlign.center, style: textStyle),
                      )
                    else
                      Text.rich(
                        TextSpan(children: [
                          for (final a in s.ayat)
                            TextSpan(
                              text: '${a.text} ',
                              recognizer: (TapGestureRecognizer()..onTap = () => widget.onTap(a)).also(_taps.add),
                              style: textStyle.copyWith(
                                backgroundColor: widget.selected?.index == a.index ||
                                        (widget.playing != null &&
                                            widget.playing!.$1 == a.surah &&
                                            widget.playing!.$2 == a.number)
                                    ? colors.highlight
                                    : null,
                              ),
                            ),
                        ]),
                        textAlign: ornate ? TextAlign.center : TextAlign.justify,
                        textDirection: TextDirection.rtl,
                      ),
                ];
                // تمرير احتياطي فقط إن لم تتسع الصفحة حتى بأصغر خط
                return SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(vertical: 3),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: box.maxHeight - 6),
                    child: Column(
                      mainAxisAlignment: ornate ? MainAxisAlignment.center : MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: ornate ? blocks : [Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: blocks)],
                    ),
                  ),
                );
              }),
            ),
            Padding(padding: const EdgeInsets.only(top: 2), child: pageNo),
          ]),
        ),
      ),
    );
  }
}

/// مقطع من الصفحة: شريط سورة، أو بسملة، أو تتابع آيات.
class _Seg {
  _Seg.banner(this.banner)
      : basmala = false,
        ayat = const [],
        text = '';
  _Seg.basmala(this.text)
      : banner = null,
        basmala = true,
        ayat = const [];
  _Seg.run(this.ayat)
      : banner = null,
        basmala = false,
        text = ayat.map((a) => '${a.text} ').join();
  final Surah? banner;
  final bool basmala;
  final List<Ayah> ayat;
  final String text;
}

extension _Also<T> on T {
  T also(void Function(T) f) {
    f(this);
    return this;
  }
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
