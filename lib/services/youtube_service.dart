import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:xml/xml.dart';

import '../config.dart';
import '../models.dart';

/// يقرأ آخر فيديوهات قناة الرواية على يوتيوب عبر خلاصة RSS العامة (بدون مفاتيح).
class YoutubeService {
  static const _kChannel = 'yt_channel_id';
  static const _kCache = 'yt_cache';
  static const _ua =
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';

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
    List<VideoItem> items;
    try {
      items = await _feed('https://www.youtube.com/feeds/videos.xml?channel_id=$id');
    } catch (_) {
      // مسار احتياطي: قائمة «الرفع» الخاصة بالقناة.
      items = await _feed('https://www.youtube.com/feeds/videos.xml?playlist_id=UU${id.substring(2)}');
    }
    items.sort((a, b) => b.published.compareTo(a.published));
    final p = await SharedPreferences.getInstance();
    await p.setString(_kCache, jsonEncode(items.map((e) => e.toJson()).toList()));
    return items;
  }

  Future<String> _channelId() async {
    if (AppConfig.youtubeChannelId.isNotEmpty) return AppConfig.youtubeChannelId;
    final p = await SharedPreferences.getInstance();
    final saved = p.getString(_kChannel);
    if (saved != null && saved.startsWith('UC')) return saved;

    final res = await http.get(
      Uri.parse('https://www.youtube.com/@${AppConfig.youtubeHandle}'),
      headers: {'User-Agent': _ua, 'Accept-Language': 'ar', 'Cookie': 'CONSENT=YES+1'},
    ).timeout(const Duration(seconds: 20));
    final body = res.body;
    final patterns = [
      RegExp(r'"externalId":"(UC[\w-]{22})"'),
      RegExp(r'channel_id=(UC[\w-]{22})'),
      RegExp(r'"channelId":"(UC[\w-]{22})"'),
      RegExp(r'youtube\.com/channel/(UC[\w-]{22})'),
    ];
    for (final r in patterns) {
      final m = r.firstMatch(body);
      if (m != null) {
        final id = m.group(1)!;
        await p.setString(_kChannel, id);
        return id;
      }
    }
    throw Exception('تعذر العثور على قناة يوتيوب');
  }

  Future<List<VideoItem>> _feed(String url) async {
    final res = await http
        .get(Uri.parse(url), headers: {'User-Agent': _ua})
        .timeout(const Duration(seconds: 20));
    if (res.statusCode != 200) throw Exception('RSS ${res.statusCode}');
    final doc = XmlDocument.parse(utf8.decode(res.bodyBytes));
    final out = <VideoItem>[];
    for (final e in doc.findAllElements('entry', namespace: '*')) {
      String text(String name) {
        final it = e.findAllElements(name, namespace: '*');
        return it.isEmpty ? '' : it.first.innerText.trim();
      }

      final id = text('videoId');
      if (id.isEmpty) continue;
      final link = e.findElements('link', namespace: '*');
      final href = link.isEmpty ? '' : (link.first.getAttribute('href') ?? '');
      final thumbs = e.findAllElements('thumbnail', namespace: '*');
      final thumb = thumbs.isEmpty ? '' : (thumbs.first.getAttribute('url') ?? '');
      final stats = e.findAllElements('statistics', namespace: '*');
      final views = stats.isEmpty ? 0 : int.tryParse(stats.first.getAttribute('views') ?? '') ?? 0;
      out.add(VideoItem(
        id: id,
        title: text('title'),
        description: text('description'),
        published: DateTime.tryParse(text('published'))?.toLocal() ?? DateTime.now(),
        thumbnail: thumb,
        isShort: href.contains('/shorts/'),
        views: views,
      ));
    }
    if (out.isEmpty) throw Exception('RSS empty');
    return out;
  }
}
