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

  @override
  Widget build(BuildContext context) {
    _clear();
    final q = Quran.instance;
    final r = widget.riwaya;
    final colors = PageColors.of(context);
    final scale = Settings.instance.fontScale;
    final ayat = q.byPage[r]![widget.page - 1];
    final ornate = widget.page <= 2; // الفاتحة وأول البقرة مزخرفتان كما في المصحف المطبوع
    final textStyle = TextStyle(fontFamily: r.font, fontSize: 23 * scale, height: 2.05, color: colors.ink);

    final blocks = <Widget>[];
    var spans = <InlineSpan>[];
    void flush() {
      if (spans.isEmpty) return;
      blocks.add(Text.rich(TextSpan(children: spans),
          textAlign: ornate ? TextAlign.center : TextAlign.justify, textDirection: TextDirection.rtl));
      spans = [];
    }

    for (final a in ayat) {
      if (a.number == 1) {
        flush();
        blocks.add(SurahBanner(surah: q.surah(a.surah), riwaya: r, colors: colors));
        final hasBasmala = a.surah != 9 && !(r == Riwaya.hafs && a.surah == 1);
        if (hasBasmala) {
          blocks.add(Padding(
            padding: const EdgeInsets.only(bottom: 2),
            child: Text(r.basmala, textAlign: TextAlign.center, style: textStyle),
          ));
        }
      }
      final sel = widget.selected?.index == a.index;
      final play = widget.playing != null && widget.playing!.$1 == a.surah && widget.playing!.$2 == a.number;
      final tap = TapGestureRecognizer()..onTap = () => widget.onTap(a);
      _taps.add(tap);
      spans.add(TextSpan(
        text: '${a.text} ',
        recognizer: tap,
        style: textStyle.copyWith(backgroundColor: sel || play ? colors.highlight : null),
      ));
    }
    flush();

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
              child: LayoutBuilder(
                builder: (context, box) => SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: ornate ? box.maxHeight - 8 : 0),
                    child: Column(
                      mainAxisAlignment: ornate ? MainAxisAlignment.center : MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: blocks,
                    ),
                  ),
                ),
              ),
            ),
            Padding(padding: const EdgeInsets.only(top: 2), child: pageNo),
          ]),
        ),
      ),
    );
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
