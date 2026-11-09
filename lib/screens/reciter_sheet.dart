import 'package:flutter/material.dart';
import '../audio.dart';
import '../data.dart';
import '../settings.dart';
import '../theme.dart';

/// اختيار القارئ ثم تشغيل السورة كاملة. القائمة من mp3quran.net حسب الرواية.
Future<void> showReciterSheet(BuildContext context, Riwaya r, int surah) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    builder: (_) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: .6,
      maxChildSize: .92,
      builder: (context, sc) => _ReciterList(riwaya: r, surah: surah, controller: sc),
    ),
  );
}

class _ReciterList extends StatefulWidget {
  const _ReciterList({required this.riwaya, required this.surah, required this.controller});
  final Riwaya riwaya;
  final int surah;
  final ScrollController controller;

  @override
  State<_ReciterList> createState() => _ReciterListState();
}

class _ReciterListState extends State<_ReciterList> {
  late Future<List<Reciter>> _f = Audio.instance.load(widget.riwaya);

  @override
  Widget build(BuildContext context) {
    final q = Quran.instance;
    final scheme = Theme.of(context).colorScheme;
    final saved = Settings.instance.reciter[widget.riwaya];
    return FutureBuilder<List<Reciter>>(
      future: _f,
      builder: (context, snap) {
        final head = Padding(
          padding: const EdgeInsets.fromLTRB(18, 0, 18, 8),
          child: Column(children: [
            Text('استمع إلى سورة ${q.surah(widget.surah).name}', style: const TextStyle(fontSize: 19)),
            Text('اختر القارئ · رواية ${widget.riwaya.label}',
                style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant)),
          ]),
        );
        if (snap.connectionState != ConnectionState.done) {
          return ListView(controller: widget.controller, children: [
            head,
            const Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator())),
          ]);
        }
        final list = (snap.data ?? const <Reciter>[]).where((x) => x.surahs.contains(widget.surah)).toList();
        if (list.isEmpty) {
          return ListView(controller: widget.controller, children: [
            head,
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(children: [
                Text(Audio.instance.error ?? 'لا يوجد قارئ متاح لهذه السورة في هذه الرواية الآن.',
                    textAlign: TextAlign.center, style: const TextStyle(fontSize: 16)),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () => setState(() => _f = Audio.instance.load(widget.riwaya)),
                  child: const Text('إعادة المحاولة'),
                ),
              ]),
            ),
          ]);
        }
        final def = Audio.instance.pick(widget.riwaya, saved, widget.surah);
        list.sort((a, b) => a.id == def?.id ? -1 : (b.id == def?.id ? 1 : 0));
        return ListView.builder(
          controller: widget.controller,
          itemCount: list.length + 1,
          itemBuilder: (context, i) {
            if (i == 0) return head;
            final rc = list[i - 1];
            final mine = rc.id == def?.id;
            return ListTile(
              leading: CircleAvatar(
                backgroundColor: mine ? Brand.green : scheme.surfaceContainerHighest,
                foregroundColor: mine ? Colors.white : scheme.onSurfaceVariant,
                child: const Icon(Icons.mic_none_rounded),
              ),
              title: Text(rc.name, style: const TextStyle(fontSize: 17)),
              subtitle: Text(rc.moshaf, maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 13, color: scheme.onSurfaceVariant)),
              trailing: Icon(Icons.play_circle_fill_rounded, color: Brand.green.withValues(alpha: mine ? 1 : .6), size: 32),
              onTap: () {
                Settings.instance.setReciter(widget.riwaya, rc.id);
                Audio.instance.playSurah(widget.riwaya, widget.surah, rc);
                Navigator.pop(context);
              },
            );
          },
        );
      },
    );
  }
}
