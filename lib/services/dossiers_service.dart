import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';
import '../models.dart';

/// محطة في ملف: تاريخ (YYYY-MM-DD) ووصف قصير، و`next` لمحطة قادمة.
class DossierStep {
  final String date;
  final String text;
  final bool next;
  const DossierStep(this.date, this.text, this.next);
}

/// ملف من «ملفات الرواية»: قضية متواصلة لها ملخص ومحطات وخط زمني، كما في الموقع (files/index.json،
/// يبنيه scripts/dossiers.py من dossiers.json بفرع website).
class DossierRef {
  final String id;
  final String title;
  final bool active;
  final String updated; // YYYY-MM-DD
  final String since; // YYYY-MM-DD
  final List<String> summary;
  final List<DossierStep> steps;
  final List<String> portals;
  final List<String> match;
  final Set<String> exclude;
  final Map<String, String> key; // معرّف المادة ← وصف المحطة البارزة
  final List<(String, String)> items; // (a|v، المعرّف)، الأحدث أولاً كما بناه الموقع

  const DossierRef({
    required this.id,
    required this.title,
    this.active = true,
    this.updated = '',
    this.since = '',
    this.summary = const [],
    this.steps = const [],
    this.portals = const [],
    this.match = const [],
    this.exclude = const {},
    this.key = const {},
    this.items = const [],
  });

  factory DossierRef.fromJson(Map m) {
    List<String> strs(Object? v) => v is List ? v.map((e) => e.toString()).toList() : const [];
    return DossierRef(
      id: (m['id'] ?? '').toString(),
      title: (m['title'] ?? '').toString(),
      active: (m['status'] ?? 'active') == 'active',
      updated: (m['updated'] ?? '').toString(),
      since: (m['since'] ?? '').toString(),
      summary: strs(m['summary']),
      steps: (m['steps'] is List ? m['steps'] as List : const [])
          .whereType<Map>()
          .map((s) => DossierStep((s['d'] ?? '').toString(), (s['t'] ?? '').toString(), s['next'] == true))
          .toList(),
      portals: strs(m['portals']),
      match: strs(m['match']),
      exclude: strs(m['exclude']).toSet(),
      key: m['key'] is Map ? (m['key'] as Map).map((k, v) => MapEntry(k.toString(), v.toString())) : const {},
      items: (m['items'] is List ? m['items'] as List : const [])
          .whereType<List>()
          .where((x) => x.length >= 2)
          .map((x) => (x[0].toString(), x[1].toString()))
          .toList(),
    );
  }

  /// خبر نُشر بعد آخر بناء للموقع: يُلحق بالملف بالقواعد نفسها (حقل dossier، أو كلمات match منذ since).
  bool matchesLive(Article a) {
    if (exclude.contains(a.id)) return false;
    if (a.dossier == id) return true;
    final d = DateTime.tryParse(since);
    if (d != null && a.createdAt.isBefore(d)) return false;
    final t = foldArabic('${a.title} ${a.body}');
    return match.any((w) => w.trim().isNotEmpty && t.contains(foldArabic(w)));
  }

  bool contains(Article a) => items.any((x) => x.$1 == 'a' && x.$2 == a.id) || matchesLive(a);
}

/// التطبيع نفسه في بحث الموقع وبنائه: بلا تشكيل ولا تطويل، والهمزات ألفاً، والتاء المربوطة هاءً، والألف المقصورة ياءً.
String foldArabic(String t) => t
    .toLowerCase()
    .replaceAll(RegExp('[ً-ْٰـ]'), '')
    .replaceAll(RegExp('[أإآٱ]'), 'ا')
    .replaceAll('ة', 'ه')
    .replaceAll('ى', 'ي')
    .replaceAll('ؤ', 'و')
    .replaceAll('ئ', 'ي')
    .replaceAll('_', ' ')
    .replaceAll(RegExp(r'\s+'), ' ');

/// قائمة الملفات كما ينشرها الموقع. يقرؤها القارئ (شريط «ملفات الرواية» وصفحة كل ملف)، ويختار منها المحرر
/// ملف الخبر في لوحة التحرير؛ يُحفظ معرّفه في حقل `dossier` بالخبر.
class DossiersService extends ChangeNotifier {
  DossiersService._();
  static final instance = DossiersService._();
  static const _kCache = 'dossiers_cache_v1';

  List<DossierRef> items = const [];
  bool _loaded = false;
  Future<List<DossierRef>>? _loading;

  /// يُرجع النسخة المحفوظة فوراً إن وُجدت، ويجلب الجديدة من الموقع (مرة لكل تشغيل، أو عند force).
  Future<List<DossierRef>> list({bool force = false}) {
    if (_loaded && !force) return Future.value(items);
    return _loading ??= _load().whenComplete(() => _loading = null);
  }

  Future<List<DossierRef>> _load() async {
    final pp = await SharedPreferences.getInstance();
    if (items.isEmpty) {
      final cached = pp.getString(_kCache);
      if (cached != null) {
        items = _parse(cached);
        notifyListeners();
      }
    }
    try {
      final r = await http
          .get(Uri.parse('${AppConfig.siteUrl}/files/index.json?t=${DateTime.now().millisecondsSinceEpoch ~/ 60000}'))
          .timeout(const Duration(seconds: 12));
      if (r.statusCode == 200) {
        final body = utf8.decode(r.bodyBytes);
        final fresh = _parse(body);
        await pp.setString(_kCache, body);
        items = fresh;
        _loaded = true; // لا نعدّه محمّلاً إلا بعد نجاح الجلب، فيُعاد في المرة التالية إن فشل
        notifyListeners();
      }
    } catch (e) {
      debugPrint('dossiers: $e');
    }
    return items;
  }

  static List<DossierRef> _parse(String raw) {
    try {
      final out = (jsonDecode(raw) as List)
          .whereType<Map>()
          .map(DossierRef.fromJson)
          .where((d) => d.id.isNotEmpty && d.title.isNotEmpty)
          .toList()
        ..sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0));
      return out;
    } catch (_) {
      return const [];
    }
  }

  /// الملف الذي ينتمي إليه الخبر، أو null.
  DossierRef? of(Article a) {
    for (final d in items) {
      if (d.contains(a)) return d;
    }
    return null;
  }
}
