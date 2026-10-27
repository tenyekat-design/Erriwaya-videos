import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:share_plus/share_plus.dart';

import '../models.dart';

/// المحفوظات (على الهاتف) والمشاركة.
class SavedService extends ChangeNotifier {
  SavedService._();
  static final instance = SavedService._();

  static const _k = 'saved_items';
  final List<VideoItem> _items = [];
  List<VideoItem> get items => List.unmodifiable(_items);

  Future<void> load() async {
    final p = await SharedPreferences.getInstance();
    final raw = p.getString(_k);
    if (raw == null) return;
    try {
      _items
        ..clear()
        ..addAll((jsonDecode(raw) as List)
            .map((e) => VideoItem.fromJson(Map<String, dynamic>.from(e as Map))));
      notifyListeners();
    } catch (_) {}
  }

  bool isSaved(String id) => _items.any((e) => e.id == id);

  Future<void> toggle(VideoItem v) async {
    if (isSaved(v.id)) {
      _items.removeWhere((e) => e.id == v.id);
    } else {
      _items.insert(0, v);
    }
    notifyListeners();
    final p = await SharedPreferences.getInstance();
    await p.setString(_k, jsonEncode(_items.map((e) => e.toJson()).toList()));
  }

  static Future<void> share(VideoItem v) =>
      Share.share('${v.displayTitle}\n\n${v.url}\n\nعبر تطبيق الرواية', subject: v.displayTitle);
}
