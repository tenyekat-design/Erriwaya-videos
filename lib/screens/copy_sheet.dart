import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../data.dart';
import '../settings.dart';
import '../theme.dart';

/// ما يُنسخ أو يُشارك: الآية، أو الصفحة، أو السورة كاملة، أو آيات من … إلى …
enum CopyScope { ayah, page, surah, range }

/// نسخ ومشاركة شاملان: يختار القارئ النطاق، ومعه التفسير إن شاء.
Future<void> showCopySheet(BuildContext context, Ayah ayah, Riwaya r) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    builder: (_) => _CopySheet(ayah: ayah, riwaya: r),
  );
}

class _CopySheet extends StatefulWidget {
  const _CopySheet({required this.ayah, required this.riwaya});
  final Ayah ayah;
  final Riwaya riwaya;
  @override
  State<_CopySheet> createState() => _CopySheetState();
}

class _CopySheetState extends State<_CopySheet> {
  CopyScope _scope = CopyScope.ayah;
  late int _from = widget.ayah.number;
  late int _to = widget.ayah.number;
  bool _withTafsir = false;
  bool _busy = false;

  Quran get q => Quran.instance;
  Surah get _surah => q.surah(widget.ayah.surah);
  int get _count => _surah.count(widget.riwaya);

  /// الآيات المختارة، مجمّعة حسب السورة (الصفحة قد تجمع سورتين).
  List<Ayah> get _selected {
    final r = widget.riwaya;
    switch (_scope) {
      case CopyScope.ayah:
        return [widget.ayah];
      case CopyScope.page:
        return q.byPage[r]![widget.ayah.page - 1];
      case CopyScope.surah:
        return q.ayat[r]!.where((a) => a.surah == widget.ayah.surah).toList();
      case CopyScope.range:
        final lo = _from < _to ? _from : _to, hi = _from < _to ? _to : _from;
        return q.ayat[r]!.where((a) => a.surah == widget.ayah.surah && a.number >= lo && a.number <= hi).toList();
    }
  }

  static String _plain(Ayah a) => a.text.replaceAll(RegExp(r'[ \s]*[٠-٩]+\s*$'), '').trim();

  Future<String> _build() async {
    final list = _selected;
    final groups = <int, List<Ayah>>{};
    for (final a in list) {
      groups.putIfAbsent(a.surah, () => []).add(a);
    }
    final kind = Settings.instance.tafsir;
    final tName = kind == 'jalalayn' ? 'تفسير الجلالين' : 'التفسير الميسّر';
    final out = StringBuffer();
    for (final e in groups.entries) {
      final ayat = e.value;
      final name = q.surah(e.key).name;
      final first = ayat.first.number, last = ayat.last.number;
      final where = first == last ? 'الآية ${ar(first)}' : 'الآيات ${ar(first)}–${ar(last)}';
      if (out.isNotEmpty) out.write('\n\n');
      out.write('﴿${ayat.map((a) => '${_plain(a)} (${ar(a.number)})').join(' ')}﴾');
      out.write('\n[سورة $name، $where · رواية ${widget.riwaya.label}]');
      if (_withTafsir) {
        final hafs = <int>{for (final a in ayat) ...a.hafsAyat}.toList()..sort();
        final t = await q.tafsir(kind, e.key, hafs);
        out.write('\n\n$tName:');
        for (final (n, text) in t) {
          out.write(t.length > 1 ? '\n(${ar(n)}) $text' : '\n$text');
        }
        if (widget.riwaya == Riwaya.warsh) out.write('\n(أرقام التفسير بعدّ حفص)');
      }
    }
    return out.toString();
  }

  Future<void> _act(bool share) async {
    setState(() => _busy = true);
    final text = await _build();
    if (!mounted) return;
    setState(() => _busy = false);
    if (share) {
      await Share.share(text, subject: 'سورة ${_surah.name}');
    } else {
      await Clipboard.setData(ClipboardData(text: text));
      if (!mounted) return;
      final n = _selected.length;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(n == 1 ? 'نُسخت الآية' : 'نُسخت ${ar(n)} آيات'),
        duration: const Duration(seconds: 2),
      ));
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final n = _selected.length;
    Widget numberPicker(String label, int value, ValueChanged<int> onChanged) => Expanded(
          child: InputDecorator(
            decoration: InputDecoration(labelText: label, border: const OutlineInputBorder(), isDense: true),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int>(
                value: value,
                isExpanded: true,
                isDense: true,
                menuMaxHeight: 360,
                items: [
                  for (var i = 1; i <= _count; i++) DropdownMenuItem(value: i, child: Text('الآية ${ar(i)}')),
                ],
                onChanged: (v) => v == null ? null : setState(() => onChanged(v)),
              ),
            ),
          ),
        );

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(18, 0, 18, 24 + MediaQuery.viewInsetsOf(context).bottom),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text('نسخ ومشاركة', textAlign: TextAlign.center, style: TextStyle(fontSize: 19, color: scheme.primary)),
        const SizedBox(height: 4),
        Text('سورة ${_surah.name} · رواية ${widget.riwaya.label}',
            textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant)),
        const SizedBox(height: 14),
        Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center, children: [
          for (final (s, label) in [
            (CopyScope.ayah, 'هذه الآية'),
            (CopyScope.page, 'الصفحة كلها'),
            (CopyScope.surah, 'السورة كاملة'),
            (CopyScope.range, 'من آية إلى آية'),
          ])
            ChoiceChip(
              label: Text(label),
              selected: _scope == s,
              onSelected: (_) => setState(() => _scope = s),
            ),
        ]),
        if (_scope == CopyScope.range) ...[
          const SizedBox(height: 14),
          Row(children: [
            numberPicker('من', _from, (v) => _from = v),
            const SizedBox(width: 10),
            numberPicker('إلى', _to, (v) => _to = v),
          ]),
        ],
        const SizedBox(height: 8),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          value: _withTafsir,
          onChanged: (v) => setState(() => _withTafsir = v),
          title: const Text('مع التفسير'),
          subtitle: Text(Settings.instance.tafsir == 'jalalayn' ? 'تفسير الجلالين' : 'التفسير الميسّر',
              style: TextStyle(color: scheme.onSurfaceVariant)),
        ),
        Text(n == 1 ? 'آية واحدة' : '${ar(n)} آية',
            textAlign: TextAlign.center, style: TextStyle(color: scheme.onSurfaceVariant)),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(
            child: FilledButton.icon(
              style: FilledButton.styleFrom(backgroundColor: Brand.green, minimumSize: const Size.fromHeight(48)),
              onPressed: _busy ? null : () => _act(false),
              icon: const Icon(Icons.copy_rounded),
              label: const Text('نسخ'),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              onPressed: _busy ? null : () => _act(true),
              icon: const Icon(Icons.share_rounded),
              label: const Text('مشاركة'),
            ),
          ),
        ]),
      ]),
    );
  }
}
