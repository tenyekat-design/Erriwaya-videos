import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:share_plus/share_plus.dart';

import '../models.dart';

/// المحفوظات (على الهاتف) والمشاركة — للفيديوهات والأخبار المكتوبة.
class SavedService extends ChangeNotifier {
  SavedService._();
  static final instance = SavedService._();

  static const _k = 'saved_items';
  final List<Object> _items = [];
  List<Object> get items => List.unmodifiable(_items);

  static String keyOf(Object o) => o is Article ? 'a:${o.id}' : 'v:${(o as VideoItem).id}';

  Future<void> load() async {
    final p = await SharedPreferences.getInstance();
    final raw = p.getString(_k);
    if (raw == null) return;
    try {
      _items.clear();
      for (final e in jsonDecode(raw) as List) {
        final m = Map<String, dynamic>.from(e as Map);
        _items.add(m['type'] == 'article' ? Article.fromJson(m) : VideoItem.fromJson(m));
      }
      notifyListeners();
    } catch (_) {}
  }

  bool isSaved(Object o) => _items.any((e) => keyOf(e) == keyOf(o));

  Future<void> toggle(Object o) async {
    if (isSaved(o)) {
      _items.removeWhere((e) => keyOf(e) == keyOf(o));
    } else {
      _items.insert(0, o);
    }
    notifyListeners();
    final p = await SharedPreferences.getInstance();
    await p.setString(
      _k,
      jsonEncode(_items
          .map((e) => e is Article
              ? {...e.toJson(), 'type': 'article'}
              : {...(e as VideoItem).toJson(), 'type': 'video'})
          .toList()),
    );
  }

  static Future<void> share(Object o) {
    if (o is Article) {
      return Share.share('${o.title}\n\n${o.excerpt}\n\nعبر تطبيق الرواية', subject: o.title);
    }
    final v = o as VideoItem;
    return Share.share('${v.displayTitle}\n\n${v.url}\n\nعبر تطبيق الرواية', subject: v.displayTitle);
  }
}
