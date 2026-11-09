import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../audio.dart';
import '../data.dart';
import '../settings.dart';
import '../theme.dart';

/// ما يظهر عند الضغط على آية: نصّها، والاستماع، والعلامة، والنسخ، والتفسير.
Future<void> showAyahSheet(BuildContext context, Ayah a, Riwaya r) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    builder: (_) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: .62,
      minChildSize: .35,
      maxChildSize: .95,
      builder: (context, sc) => _AyahSheet(ayah: a, riwaya: r, controller: sc),
    ),
  );
}

class _AyahSheet extends StatelessWidget {
  const _AyahSheet({required this.ayah, required this.riwaya, required this.controller});
  final Ayah ayah;
  final Riwaya riwaya;
  final ScrollController controller;

  /// موضع الآية بعدّ حفص (للعلامات التي تعمل في الروايتين).
  int get _hafsRef => ayah.hafsAyat.first;

  @override
  Widget build(BuildContext context) {
    final q = Quran.instance;
    final s = Settings.instance;
    final scheme = Theme.of(context).colorScheme;
    final colors = PageColors.of(context);
    final surah = q.surah(ayah.surah);
    final plain = ayah.text.replaceAll(RegExp(r'[ \s]*[٠-٩]+\s*$'), '').trim();
    return ListenableBuilder(
      listenable: s,
      builder: (context, _) => ListView(
        controller: controller,
        padding: const EdgeInsets.fromLTRB(18, 0, 18, 28),
        children: [
          Text('سورة ${surah.name} · الآية ${ar(ayah.number)}',
              textAlign: TextAlign.center, style: TextStyle(fontSize: 17, color: scheme.primary)),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: colors.paper,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: colors.frame.withValues(alpha: .5)),
            ),
            child: Text(ayah.text,
                textAlign: TextAlign.center,
                style: TextStyle(fontFamily: riwaya.font, fontSize: 24, height: 2, color: colors.ink)),
          ),
          const SizedBox(height: 12),
          Wrap(alignment: WrapAlignment.center, spacing: 8, runSpacing: 8, children: [
            if (riwaya == Riwaya.hafs)
              FilledButton.icon(
                style: FilledButton.styleFrom(backgroundColor: Brand.green),
                onPressed: () {
                  Audio.instance.playAyah(ayah.surah, ayah.number);
                  Navigator.pop(context);
                },
                icon: const Icon(Icons.play_arrow_rounded),
                label: const Text('استمع للآية'),
              ),
            OutlinedButton.icon(
              onPressed: () => s.toggleBookmark(ayah.surah, _hafsRef),
              icon: Icon(s.isBookmarked(ayah.surah, _hafsRef) ? Icons.bookmark : Icons.bookmark_border),
              label: Text(s.isBookmarked(ayah.surah, _hafsRef) ? 'محفوظة' : 'علامة'),
            ),
            OutlinedButton.icon(
              onPressed: () {
                Clipboard.setData(ClipboardData(text: '﴿$plain﴾ [${surah.name}: ${ar(ayah.number)}]'));
                ScaffoldMessenger.of(context)
                    .showSnackBar(const SnackBar(content: Text('نُسخت الآية'), duration: Duration(seconds: 2)));
              },
              icon: const Icon(Icons.copy_rounded),
              label: const Text('نسخ'),
            ),
          ]),
          const SizedBox(height: 18),
          Row(children: [
            const Text('التفسير', style: TextStyle(fontSize: 20)),
            const Spacer(),
            SegmentedButton<String>(
              showSelectedIcon: false,
              segments: const [
                ButtonSegment(value: 'muyassar', label: Text('الميسّر')),
                ButtonSegment(value: 'jalalayn', label: Text('الجلالين')),
              ],
              selected: {s.tafsir},
              onSelectionChanged: (v) => s.setTafsir(v.first),
            ),
          ]),
          if (riwaya == Riwaya.warsh &&
              (ayah.hafsAyat.length > 1 || ayah.hafsAyat.first != ayah.number))
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'التفسير مرتّب بعدّ حفص، وهذه الآية تقابل ${ayah.hafsAyat.length > 1 ? 'الآيات' : 'الآية'} '
                '${ayah.hafsAyat.map(ar).join(' و')} فيه.',
                style: TextStyle(fontSize: 13.5, color: scheme.onSurfaceVariant),
              ),
            ),
          const SizedBox(height: 8),
          FutureBuilder(
            key: ValueKey('${s.tafsir}-${ayah.surah}-${ayah.hafsAyat}'),
            future: q.tafsir(s.tafsir, ayah.surah, ayah.hafsAyat),
            builder: (context, snap) {
              if (!snap.hasData) {
                return const Padding(
                    padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator(strokeWidth: 2)));
              }
              final list = snap.data!;
              return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                for (final (n, t) in list) ...[
                  if (list.length > 1)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text('الآية ${ar(n)}', style: TextStyle(color: scheme.primary, fontSize: 15)),
                    ),
                  SelectableText(t, style: const TextStyle(fontSize: 17.5, height: 1.9)),
                ],
                const SizedBox(height: 10),
                Text(
                  s.tafsir == 'jalalayn'
                      ? 'تفسير الجلالين: جلال الدين المحلي وجلال الدين السيوطي.'
                      : 'التفسير الميسّر: نخبة من العلماء، مجمّع الملك فهد لطباعة المصحف الشريف.',
                  style: TextStyle(fontSize: 12.5, color: scheme.onSurfaceVariant),
                ),
              ]);
            },
          ),
        ],
      ),
    );
  }
}
