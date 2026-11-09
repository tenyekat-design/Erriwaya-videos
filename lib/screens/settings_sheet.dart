import 'package:flutter/material.dart';
import '../data.dart';
import '../settings.dart';
import '../theme.dart';

/// الإعدادات: حجم خط المصحف، الوضع الليلي، التفسير المفضّل، والمصادر.
Future<void> showSettingsSheet(BuildContext context, {bool inReader = false}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    builder: (_) => const _SettingsSheet(),
  );
}

class _SettingsSheet extends StatelessWidget {
  const _SettingsSheet();

  @override
  Widget build(BuildContext context) {
    final s = Settings.instance;
    final scheme = Theme.of(context).colorScheme;
    return ListenableBuilder(
      listenable: s,
      builder: (context, _) => SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const Text('الإعدادات', textAlign: TextAlign.center, style: TextStyle(fontSize: 20)),
          const SizedBox(height: 14),
          const Text('حجم خط المصحف', style: TextStyle(fontSize: 16)),
          Row(children: [
            const Text('أ', style: TextStyle(fontSize: 14)),
            Expanded(
              child: Slider(
                value: s.fontScale,
                min: .8,
                max: 1.8,
                divisions: 10,
                onChanged: s.setFontScale,
              ),
            ),
            const Text('أ', style: TextStyle(fontSize: 26)),
          ]),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(color: PageColors.of(context).paper, borderRadius: BorderRadius.circular(12)),
            child: Text(
              Quran.instance.ayat[s.riwaya]![1].text,
              textAlign: TextAlign.center,
              style: TextStyle(
                  fontFamily: s.riwaya.font, fontSize: 23 * s.fontScale, height: 2, color: PageColors.of(context).ink),
            ),
          ),
          const SizedBox(height: 18),
          const Text('المظهر', style: TextStyle(fontSize: 16)),
          const SizedBox(height: 8),
          SegmentedButton<ThemeMode>(
            showSelectedIcon: false,
            segments: const [
              ButtonSegment(value: ThemeMode.system, label: Text('تلقائي'), icon: Icon(Icons.brightness_auto)),
              ButtonSegment(value: ThemeMode.light, label: Text('نهاري'), icon: Icon(Icons.light_mode)),
              ButtonSegment(value: ThemeMode.dark, label: Text('ليلي'), icon: Icon(Icons.dark_mode)),
            ],
            selected: {s.themeMode},
            onSelectionChanged: (v) => s.setTheme(v.first),
          ),
          const SizedBox(height: 18),
          const Text('التفسير المفضّل', style: TextStyle(fontSize: 16)),
          const SizedBox(height: 8),
          SegmentedButton<String>(
            showSelectedIcon: false,
            segments: const [
              ButtonSegment(value: 'muyassar', label: Text('التفسير الميسّر')),
              ButtonSegment(value: 'jalalayn', label: Text('تفسير الجلالين')),
            ],
            selected: {s.tafsir},
            onSelectionChanged: (v) => s.setTafsir(v.first),
          ),
          const SizedBox(height: 22),
          Text(
            'نصّ المصحف وخطّاه (رواية حفص عن عاصم، ورواية ورش عن نافع) من مجمّع الملك فهد لطباعة المصحف الشريف. '
            'التلاوات الكاملة من mp3quran.net، وتلاوة الآية الواحدة من everyayah.com. '
            'من شبكة الرواية الإعلامية.',
            style: TextStyle(fontSize: 13, height: 1.7, color: scheme.onSurfaceVariant),
          ),
          const SizedBox(height: 4),
          Text('الإصدار 1.0.0', style: TextStyle(fontSize: 13, color: scheme.onSurfaceVariant)),
        ]),
      ),
    );
  }
}
