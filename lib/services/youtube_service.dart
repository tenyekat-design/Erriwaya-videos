import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';
import '../models.dart';

/// يقرأ فيديوهات قناة الرواية على يوتيوب من صفحة القناة العامة (بدون مفاتيح API).
/// خلاصة RSS الخاصة بيوتيوب لم تعد تعمل لهذه القناة، فنقرأ بيانات الصفحة نفسها.
class YoutubeService {
  static const _kChannel = 'yt_channel_id';
  static const _kCache = 'yt_cache_v2';
  static const _ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
  static const _headers = {
    'User-Agent': _ua,
    'Accept-Language': 'en-US,en;q=0.8',
    'Cookie': 'CONSENT=YES+1; SOCS=CAI',
  };

  Future<List<VideoItem>> cached() async {
    final p = await SharedPreferences.getInstance();
    final raw = p.getString(_kCache);
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list.map((e) => VideoItem.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    } catch (_) {
      return [];
    }
  }

  Future<List<VideoItem>> fetch() async {
    final id = await _channelId();
    final base = 'https://www.youtube.com/channel/$id';
    final results = await Future.wait([
      _page('$base/videos?hl=en&gl=MR'),
      _page('$base/shorts?hl=en&gl=MR').catchError((_) => <String, dynamic>{}),
    ]);
    final videos = _parseVideos(results[0]);
    final shorts = _parseShorts(results[1]);
    if (videos.isEmpty && shorts.isEmpty) throw Exception('no videos');
    final seen = <String>{};
    final all = [...videos, ...shorts].where((v) => seen.add(v.id)).toList();
    final p = await SharedPreferences.getInstance();
    await p.setString(_kCache, jsonEncode(all.map((e) => e.toJson()).toList()));
    return all;
  }

  Future<String> _channelId() async {
    if (AppConfig.youtubeChannelId.isNotEmpty) return AppConfig.youtubeChannelId;
    final p = await SharedPreferences.getInstance();
    final saved = p.getString(_kChannel);
    if (saved != null && saved.startsWith('UC')) return saved;
    final res = await http
        .get(Uri.parse('https://www.youtube.com/@${AppConfig.youtubeHandle}'), headers: _headers)
        .timeout(const Duration(seconds: 20));
    final m = RegExp(r'"externalId":"(UC[\w-]{22})"').firstMatch(res.body) ??
        RegExp(r'channel_id=(UC[\w-]{22})').firstMatch(res.body) ??
        RegExp(r'youtube\.com/channel/(UC[\w-]{22})').firstMatch(res.body);
    if (m == null) throw Exception('channel not found');
    await p.setString(_kChannel, m.group(1)!);
    return m.group(1)!;
  }

  Future<Map<String, dynamic>> _page(String url) async {
    final res = await http.get(Uri.parse(url), headers: _headers).timeout(const Duration(seconds: 25));
    if (res.statusCode != 200) throw Exception('HTTP ${res.statusCode}');
    final body = utf8.decode(res.bodyBytes, allowMalformed: true);
    const marker = 'var ytInitialData = ';
    final start = body.indexOf(marker);
    if (start < 0) throw Exception('no data');
    final end = body.indexOf(';</script>', start);
    return jsonDecode(body.substring(start + marker.length, end)) as Map<String, dynamic>;
  }

  static void _find(dynamic o, String key, List<Map<String, dynamic>> out) {
    if (o is Map) {
      o.forEach((k, v) {
        if (k == key && v is Map) {
          out.add(Map<String, dynamic>.from(v));
        } else {
          _find(v, key, out);
        }
      });
    } else if (o is List) {
      for (final x in o) {
        _find(x, key, out);
      }
    }
  }

  static dynamic _at(dynamic o, List<Object> path) {
    for (final k in path) {
      if (o is Map && k is String) {
        o = o[k];
      } else if (o is List && k is int && k < o.length) {
        o = o[k];
      } else {
        return null;
      }
    }
    return o;
  }

  List<VideoItem> _parseVideos(Map<String, dynamic> data) {
    final lockups = <Map<String, dynamic>>[];
    _find(data, 'lockupViewModel', lockups);
    final now = DateTime.now();
    final out = <VideoItem>[];
    for (var i = 0; i < lockups.length; i++) {
      final l = lockups[i];
      final id = l['contentId'];
      if (id is! String || id.length != 11) continue;
      final md = _at(l, ['metadata', 'lockupMetadataViewModel']);
      final title = (_at(md, ['title', 'content']) ?? '') as String;
      final parts = <String>[];
      final rows = _at(md, ['metadata', 'contentMetadataViewModel', 'metadataRows']);
      if (rows is List) {
        for (final r in rows) {
          final ps = r is Map ? r['metadataParts'] : null;
          if (ps is List) {
            for (final pt in ps) {
              final label = _at(pt, ['accessibilityLabel']) ?? _at(pt, ['text', 'content']);
              if (label is String) parts.add(label);
            }
          }
        }
      }
      var published = now.subtract(Duration(minutes: i)); // يحفظ الترتيب إن لم نجد التاريخ
      var views = 0;
      for (final s in parts) {
        final ago = _parseAgo(s, now);
        if (ago != null) published = ago;
        final vm = RegExp(r'([\d,.]+)\s*([KMB])?\s*views?', caseSensitive: false).firstMatch(s);
        if (vm != null) views = _num(vm.group(1)!, vm.group(2));
      }
      out.add(VideoItem(
        id: id,
        title: title.trim(),
        description: '',
        published: published,
        thumbnail: 'https://i.ytimg.com/vi/$id/hqdefault.jpg',
        views: views,
      ));
    }
    return out;
  }

  List<VideoItem> _parseShorts(Map<String, dynamic> data) {
    final lockups = <Map<String, dynamic>>[];
    _find(data, 'shortsLockupViewModel', lockups);
    final out = <VideoItem>[];
    for (final l in lockups) {
      final id = _at(l, ['onTap', 'innertubeCommand', 'reelWatchEndpoint', 'videoId']) ??
          (l['entityId'] as String?)?.replaceFirst('shorts-shelf-item-', '');
      if (id is! String || id.length != 11) continue;
      final title = (_at(l, ['overlayMetadata', 'primaryText', 'content']) ?? '') as String;
      final viewsText = (_at(l, ['overlayMetadata', 'secondaryText', 'content']) ?? '') as String;
      final vm = RegExp(r'([\d,.]+)\s*([KMB])?', caseSensitive: false).firstMatch(viewsText);
      out.add(VideoItem(
        id: id,
        title: title.trim(),
        description: '',
        published: VideoItem.unknownDate,
        thumbnail: 'https://i.ytimg.com/vi/$id/oardefault.jpg',
        isShort: true,
        views: vm == null ? 0 : _num(vm.group(1)!, vm.group(2)),
      ));
    }
    return out;
  }

  static int _num(String n, String? suffix) {
    final v = double.tryParse(n.replaceAll(',', '')) ?? 0;
    final mult = switch (suffix?.toUpperCase()) { 'K' => 1e3, 'M' => 1e6, 'B' => 1e9, _ => 1.0 };
    return (v * mult).round();
  }

  static DateTime? _parseAgo(String s, DateTime now) {
    final m = RegExp(r'(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago').firstMatch(s);
    if (m == null) return null;
    final n = int.parse(m.group(1)!);
    return switch (m.group(2)) {
      'second' => now.subtract(Duration(seconds: n)),
      'minute' => now.subtract(Duration(minutes: n)),
      'hour' => now.subtract(Duration(hours: n)),
      'day' => now.subtract(Duration(days: n)),
      'week' => now.subtract(Duration(days: 7 * n)),
      'month' => now.subtract(Duration(days: 30 * n)),
      _ => now.subtract(Duration(days: 365 * n)),
    };
  }
}
