import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';

/// ملف من «ملفات الرواية» (قضية متواصلة لها خط زمني في الموقع).
class DossierRef {
  final String id;
  final String title;
  final bool active;
  const DossierRef({required this.id, required this.title, this.active = true});
}

/// قائمة الملفات كما ينشرها الموقع في files/index.json (تُعرَّف في dossiers.json بفرع website).
/// يختار المحرر منها ملف الخبر في لوحة التحرير؛ يُحفظ معرّفه في حقل `dossier` بالخبر.
class DossiersService {
  DossiersService._();
  static final instance = DossiersService._();
  static const _kCache = 'dossiers_cache_v1';

  List<DossierRef>? _list;

  Future<List<DossierRef>> list() async {
    if (_list != null) return _list!;
    final pp = await SharedPreferences.getInstance();
    try {
      final r = await http.get(Uri.parse('${AppConfig.siteUrl}/files/index.json')).timeout(const Duration(seconds: 12));
      if (r.statusCode == 200) {
        await pp.setString(_kCache, utf8.decode(r.bodyBytes));
      }
    } catch (e) {
      debugPrint('dossiers: $e');
    }
    final raw = pp.getString(_kCache);
    if (raw == null) return _list = const [];
    try {
      final items = (jsonDecode(raw) as List).whereType<Map>().map((m) => DossierRef(
            id: (m['id'] ?? '').toString(),
            title: (m['title'] ?? '').toString(),
            active: (m['status'] ?? 'active') == 'active',
          ));
      final out = items.where((d) => d.id.isNotEmpty && d.title.isNotEmpty).toList()
        ..sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0));
      return _list = out;
    } catch (_) {
      return _list = const [];
    }
  }
}
