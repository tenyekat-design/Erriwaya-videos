import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'data.dart';

/// علامة محفوظة: موضع بعدّ حفص (سورة/آية) حتى تعمل في الروايتين.
class Bookmark {
  const Bookmark(this.surah, this.ayah, this.at);
  final int surah, ayah;
  final DateTime at;
  String encode() => '$surah:$ayah:${at.millisecondsSinceEpoch}';
  static Bookmark? decode(String s) {
    final p = s.split(':');
    if (p.length != 3) return null;
    return Bookmark(int.parse(p[0]), int.parse(p[1]), DateTime.fromMillisecondsSinceEpoch(int.parse(p[2])));
  }
}

/// إعدادات القارئ: الرواية، حجم الخط، الوضع الليلي، آخر صفحة، العلامات، التفسير والقارئ المختار.
class Settings extends ChangeNotifier {
  Settings._();
  static final Settings instance = Settings._();
  late SharedPreferences _p;

  Riwaya riwaya = Riwaya.hafs;
  double fontScale = 1.0;
  ThemeMode themeMode = ThemeMode.system;
  String tafsir = 'muyassar';
  final Map<Riwaya, int> lastPage = {Riwaya.hafs: 1, Riwaya.warsh: 1};
  final Map<Riwaya, int?> reciter = {Riwaya.hafs: null, Riwaya.warsh: null};
  List<Bookmark> bookmarks = [];

  Future<void> load() async {
    _p = await SharedPreferences.getInstance();
    riwaya = _p.getString('riwaya') == 'warsh' ? Riwaya.warsh : Riwaya.hafs;
    fontScale = (_p.getDouble('fontScale') ?? 1.0).clamp(.8, 1.2).toDouble();
    themeMode = ThemeMode.values[(_p.getInt('theme') ?? 0).clamp(0, 2)];
    tafsir = _p.getString('tafsir') ?? 'muyassar';
    for (final r in Riwaya.values) {
      lastPage[r] = _p.getInt('last_${r.name}') ?? 1;
      reciter[r] = _p.getInt('reciter_${r.name}');
    }
    bookmarks = (_p.getStringList('bookmarks') ?? []).map(Bookmark.decode).whereType<Bookmark>().toList();
  }

  void setRiwaya(Riwaya r) {
    riwaya = r;
    _p.setString('riwaya', r.name);
    notifyListeners();
  }

  void setFontScale(double v) {
    fontScale = v;
    _p.setDouble('fontScale', v);
    notifyListeners();
  }

  void setTheme(ThemeMode m) {
    themeMode = m;
    _p.setInt('theme', m.index);
    notifyListeners();
  }

  void setTafsir(String k) {
    tafsir = k;
    _p.setString('tafsir', k);
    notifyListeners();
  }

  void setLastPage(Riwaya r, int page) {
    if (lastPage[r] == page) return;
    lastPage[r] = page;
    _p.setInt('last_${r.name}', page);
    notifyListeners();
  }

  void setReciter(Riwaya r, int id) {
    reciter[r] = id;
    _p.setInt('reciter_${r.name}', id);
    notifyListeners();
  }

  bool isBookmarked(int surah, int ayah) => bookmarks.any((b) => b.surah == surah && b.ayah == ayah);

  void toggleBookmark(int surah, int ayah) {
    if (isBookmarked(surah, ayah)) {
      bookmarks.removeWhere((b) => b.surah == surah && b.ayah == ayah);
    } else {
      bookmarks.insert(0, Bookmark(surah, ayah, DateTime.now()));
    }
    _p.setStringList('bookmarks', bookmarks.map((b) => b.encode()).toList());
    notifyListeners();
  }
}
