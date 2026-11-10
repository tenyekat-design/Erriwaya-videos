import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// خطّ مصحف المدينة (خطوط مجمّع الملك فهد لكل صفحة): كل صفحة لها خطّ خاص،
/// وكل كلمة فيه رسمة واحدة، فتأتي الأسطر كما في المصحف المطبوع تماماً.
///
/// assets/data/qcf.json: لكل صفحة أسطرها الخمسة عشر بالترتيب، وكل سطر واحد من:
///   {"h": سورة}            شريط اسم السورة
///   {"b": سورة}            البسملة
///   {"w": عرض, "r": [[رقم الآية في ترتيب حفص, "رسوم كلماتها"], ...]}
/// (tools/build_qcf.py)
class QcfLine {
  const QcfLine.header(this.surah)
      : basmala = false,
        width = 0,
        runs = const [];
  const QcfLine.basmala(this.surah)
      : basmala = true,
        width = 0,
        runs = const [];
  const QcfLine.text(this.width, this.runs)
      : surah = 0,
        basmala = false;
  final int surah;
  final bool basmala;
  final int width; // مجموع عرض الرسوم بوحدات الخطّ
  final List<(int, String)> runs;
  bool get isHeader => surah != 0 && !basmala;
  bool get isText => runs.isNotEmpty;
}

class Qcf {
  Qcf._();
  static final Qcf instance = Qcf._();

  /// وحدات المربّع في خطوط الصفحات.
  static const unitsPerEm = 2500.0;
  static const basmalaGlyphs = 'ﱁﱂﱃﱄ';

  List<List<QcfLine>>? _pages;
  final Map<int, Future<void>> _fonts = {};
  final Set<int> loadedFonts = {};

  Future<void> load() async {
    if (_pages != null) return;
    final raw = await rootBundle.loadString('assets/data/qcf.json');
    final list = await compute(jsonDecode, raw) as List;
    _pages = [
      for (final p in list)
        [
          for (final l in p as List)
            if (l['h'] != null)
              QcfLine.header(l['h'])
            else if (l['b'] != null)
              QcfLine.basmala(l['b'])
            else
              QcfLine.text(l['w'], [for (final r in l['r'] as List) (r[0] as int, r[1] as String)])
        ]
    ];
  }

  bool get ready => _pages != null;
  List<QcfLine> page(int p) => _pages![p - 1];

  static String family(int page) => 'QCF_P${page.toString().padLeft(3, '0')}';

  /// يحمّل خطّ الصفحة عند أول حاجة إليه (وخطّ الصفحة الأولى للبسملة).
  Future<void> ensure(int page) => Future.wait([_font(1), _font(page)]);

  Future<void> _font(int page) => _fonts.putIfAbsent(page, () async {
        final loader = FontLoader(family(page))
          ..addFont(rootBundle.load('assets/qcf/p${page.toString().padLeft(3, '0')}.ttf'));
        await loader.load();
        loadedFonts.add(page);
      });

  bool fontReady(int page) => loadedFonts.contains(page) && loadedFonts.contains(1);
}
