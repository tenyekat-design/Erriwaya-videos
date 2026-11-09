import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// الروايتان المتاحتان. النصّ والخطّان من مجمّع الملك فهد لطباعة المصحف الشريف.
enum Riwaya { hafs, warsh }

extension RiwayaX on Riwaya {
  String get label => this == Riwaya.hafs ? 'حفص عن عاصم' : 'ورش عن نافع';
  String get short => this == Riwaya.hafs ? 'حفص' : 'ورش';
  String get font => this == Riwaya.hafs ? 'Hafs' : 'Warsh';
  String get basmala => this == Riwaya.hafs
      ? 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ'
      : 'بِسْمِ اِ۬للَّهِ اِ۬لرَّحْمَٰنِ اِ۬لرَّحِيمِ';
}

class Ayah {
  const Ayah(this.index, this.surah, this.number, this.page, this.juz, this.text, this.hafsAyat, this.lineStart,
      this.lineEnd, this.shown);
  final int index; // الترتيب داخل الرواية (يبدأ من 0)
  final int surah;
  final int number;
  final int page;
  final int juz;
  final String text; // نصّ الآية مع علامة رقمها في آخرها (يرسمها الخطّ)
  final List<int> hafsAyat; // أرقام آيات حفص المقابلة (للتفسير والبحث)؛ في حفص هي الآية نفسها
  final int lineStart, lineEnd; // أسطر الآية في صفحة المصحف المطبوع (١–١٥)


  /// النصّ كما يُرسم بخطّ الرواية (في ورش تُصحَّح «لا»، انظر [fixLamAlef]). النسخ والبحث يستعملان [text].
  final String shown;
}

final _lamAlef = RegExp('\u0644([\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08F0-\u08F3]+)([\u0627\u0623\u0625\u0622])');

/// خطّ ورش من المجمّع يضع حركة اللام في «لَا» فوق الألف إذا جاءت الحركة بين اللام والألف.
/// للرسم فقط ننقل حركات اللام بعد الألف («لَا» ← «لاَ»)، فيرسم الخطّ «لا» متصلة والحركة فوق اللام.
String fixLamAlef(String t) => t.replaceAllMapped(_lamAlef, (m) => '\u0644${m[2]}${m[1]}');

class Surah {
  const Surah(this.n, this.name, this.en, this.makki, this.hafsCount, this.warshCount, this.hafsPage, this.warshPage);
  final int n;
  final String name;
  final String en;
  final bool makki;
  final int hafsCount;
  final int warshCount;
  final int hafsPage;
  final int warshPage;
  int count(Riwaya r) => r == Riwaya.hafs ? hafsCount : warshCount;
  int page(Riwaya r) => r == Riwaya.hafs ? hafsPage : warshPage;
}

class JuzStart {
  const JuzStart(this.juz, this.page, this.surah, this.ayah);
  final int juz, page, surah, ayah;
}

/// بيانات المصحف كاملة، تُحمَّل مرة واحدة من ملفات التطبيق (بلا إنترنت).
class Quran {
  Quran._();
  static final Quran instance = Quran._();

  static const pages = 604;
  late final List<Surah> surahs;
  late final Map<Riwaya, List<Ayah>> ayat;
  late final Map<Riwaya, List<List<Ayah>>> byPage; // [رقم الصفحة - 1] → آياتها
  late final Map<Riwaya, List<JuzStart>> juz;
  late final List<String> searchText; // النصّ الإملائي لآيات حفص
  late final List<int> hafsIndex; // بداية كل سورة في ترتيب حفص
  List<String>? _muyassar;
  List<String>? _jalalayn;
  bool loaded = false;

  Future<void> load() async {
    if (loaded) return;
    final raw = await Future.wait([
      rootBundle.loadString('assets/data/hafs.json'),
      rootBundle.loadString('assets/data/warsh.json'),
      rootBundle.loadString('assets/data/surahs.json'),
      rootBundle.loadString('assets/data/juz.json'),
      rootBundle.loadString('assets/data/search.json'),
    ]);
    final decoded = await compute(_decodeAll, raw);
    final h = decoded[0] as List, w = decoded[1] as List, s = decoded[2] as List;
    final j = decoded[3] as Map, q = decoded[4] as List;

    surahs = [
      for (final x in s)
        Surah(x['n'], x['name'], x['en'], x['makki'], x['hafs'], x['warsh'], x['hp'], x['wp'])
    ];
    final hafs = <Ayah>[
      for (var i = 0; i < h.length; i++)
        Ayah(i, h[i][0], h[i][1], h[i][2], h[i][3], h[i][4], [h[i][1] as int], h[i][5], h[i][6], h[i][4])
    ];
    final warsh = <Ayah>[
      for (var i = 0; i < w.length; i++)
        Ayah(i, w[i][0], w[i][1], w[i][2], w[i][3], w[i][4], List<int>.from(w[i][5]), w[i][6], w[i][7],
            fixLamAlef(w[i][4]))
    ];
    ayat = {Riwaya.hafs: hafs, Riwaya.warsh: warsh};
    byPage = {for (final r in Riwaya.values) r: _paginate(ayat[r]!)};
    juz = {
      for (final r in Riwaya.values)
        r: [
          for (var k = 0; k < (j[r.name] as List).length; k++)
            JuzStart(k + 1, j[r.name][k][0], j[r.name][k][1], j[r.name][k][2])
        ]
    };
    searchText = List<String>.from(q);
    hafsIndex = List.filled(115, 0);
    for (final a in hafs.reversed) {
      hafsIndex[a.surah] = a.index;
    }
    loaded = true;
  }

  static List<Object> _decodeAll(List<String> raw) => raw.map(jsonDecode).cast<Object>().toList();

  static List<List<Ayah>> _paginate(List<Ayah> list) {
    final out = List.generate(pages, (_) => <Ayah>[]);
    for (final a in list) {
      out[a.page - 1].add(a);
    }
    return out;
  }

  Surah surah(int n) => surahs[n - 1];

  /// آية حفص بعينها (سورة، رقم).
  Ayah hafsAyah(int surah, int number) => ayat[Riwaya.hafs]![hafsIndex[surah] + number - 1];

  /// موضع آية حفص في رواية أخرى (للانتقال من البحث أو من علامة).
  Ayah locate(Riwaya r, int surah, int hafsNumber) {
    if (r == Riwaya.hafs) return hafsAyah(surah, hafsNumber);
    final list = ayat[r]!;
    return list.firstWhere((a) => a.surah == surah && a.hafsAyat.contains(hafsNumber),
        orElse: () => list.firstWhere((a) => a.surah == surah));
  }

  /// عدد أسطر النصّ في الصفحة كما في المصحف المطبوع (دون أسطر أسماء السور والبسملة).
  int textLines(Riwaya r, int page) {
    final lines = <int>{};
    for (final a in byPage[r]![page - 1]) {
      for (var l = a.lineStart; l <= (a.lineEnd < a.lineStart ? 15 : a.lineEnd); l++) {
        lines.add(l);
      }
    }
    return lines.isEmpty ? 15 : lines.length;
  }

  int juzOfPage(Riwaya r, int page) {
    final list = byPage[r]![page - 1];
    return list.isEmpty ? 1 : list.first.juz;
  }

  /// التفسير (الميسّر أو الجلالين) لآيات حفص المقابلة. يُحمَّل عند أول طلب.
  Future<List<(int, String)>> tafsir(String kind, int surah, List<int> hafsAyat) async {
    if (kind == 'jalalayn') {
      _jalalayn ??= List<String>.from(
          await compute(jsonDecode, await rootBundle.loadString('assets/data/jalalayn.json')) as List);
    } else {
      _muyassar ??= List<String>.from(
          await compute(jsonDecode, await rootBundle.loadString('assets/data/muyassar.json')) as List);
    }
    final src = kind == 'jalalayn' ? _jalalayn! : _muyassar!;
    return [for (final n in hafsAyat) (n, src[hafsIndex[surah] + n - 1])];
  }

  /// بحث في نصّ الآيات (بالإملاء الحديث، بلا تشكيل ولا همزات ولا تاء مربوطة).
  List<Ayah> search(String query, {int limit = 300}) {
    final q = normalize(query);
    if (q.length < 2) return const [];
    final out = <Ayah>[];
    final hafs = ayat[Riwaya.hafs]!;
    for (var i = 0; i < searchText.length && out.length < limit; i++) {
      if (_norm[i].contains(q)) out.add(hafs[i]);
    }
    return out;
  }

  late final List<String> _norm = searchText.map(normalize).toList();

  static String normalize(String s) {
    final b = StringBuffer();
    for (final r in s.runes) {
      // تشكيل وعلامات قرآنية وتطويل
      if ((r >= 0x064B && r <= 0x065F) || r == 0x0670 || (r >= 0x06D6 && r <= 0x06ED) || r == 0x0640) continue;
      switch (r) {
        case 0x0623 || 0x0625 || 0x0622 || 0x0671:
          b.writeCharCode(0x0627); // أ إ آ ٱ → ا
        case 0x0629:
          b.writeCharCode(0x0647); // ة → ه
        case 0x0649:
          b.writeCharCode(0x064A); // ى → ي
        case 0x0624:
          b.writeCharCode(0x0648); // ؤ → و
        case 0x0626:
          b.writeCharCode(0x064A); // ئ → ي
        default:
          b.writeCharCode(r);
      }
    }
    return b.toString().replaceAll(RegExp(r'\s+'), ' ').trim();
  }
}

/// أرقام عربية (١٢٣) للواجهة.
String ar(int n) {
  const d = '٠١٢٣٤٥٦٧٨٩';
  return n.toString().split('').map((c) => d[c.codeUnitAt(0) - 48]).join();
}
