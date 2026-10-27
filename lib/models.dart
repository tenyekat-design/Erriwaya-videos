import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/foundation.dart';

import 'config.dart';
import 'portals.dart';

/// مدة بقاء صفة «عاجل» على الخبر.
const breakingWindow = Duration(minutes: 30);

/// يتغير كل دقيقة ليُعاد رسم ما يتعلق بالوقت (انتهاء العاجل، «منذ دقائق»).
final minuteTick = ValueNotifier<int>(0);

class VideoItem {
  final String id;
  final String title;
  final String description;
  final DateTime published;
  final String thumbnail;
  final bool isShort;
  final int views;

  const VideoItem({
    required this.id,
    required this.title,
    required this.description,
    required this.published,
    required this.thumbnail,
    this.isShort = false,
    this.views = 0,
  });

  static final unknownDate = DateTime(2000);
  bool get hasDate => published.year > 2000;

  /// العنوان بدون علامات الوسوم: «#موجز_الأخبار» ← «موجز الأخبار».
  String get displayTitle {
    final t = title.replaceAll('#', ' ').replaceAll('_', ' ').replaceAll(RegExp(r'\s+'), ' ').trim();
    return t.isEmpty ? 'الرواية' : t;
  }

  String get url => isShort ? 'https://www.youtube.com/shorts/$id' : 'https://www.youtube.com/watch?v=$id';
  String get hqThumb => 'https://i.ytimg.com/vi/$id/hqdefault.jpg';
  String get bigThumb => 'https://i.ytimg.com/vi/$id/maxresdefault.jpg';

  List<String> get categories {
    final text = '$title $description';
    return AppConfig.categories.entries
        .where((e) => matchesAny(text, e.value))
        .map((e) => e.key)
        .toList();
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'published': published.toIso8601String(),
        'thumbnail': thumbnail,
        'isShort': isShort,
        'views': views,
      };

  factory VideoItem.fromJson(Map<String, dynamic> j) => VideoItem(
        id: j['id'] as String,
        title: (j['title'] ?? '') as String,
        description: (j['description'] ?? '') as String,
        published: DateTime.tryParse((j['published'] ?? '') as String) ?? DateTime.now(),
        thumbnail: (j['thumbnail'] ?? '') as String,
        isShort: (j['isShort'] ?? false) as bool,
        views: (j['views'] ?? 0) as int,
      );
}

class BreakingNews {
  final String title;
  final String body;
  final String? url;
  final String? articleId;
  final DateTime time;

  const BreakingNews(
      {required this.title, required this.body, this.url, this.articleId, required this.time});

  bool get isFresh => DateTime.now().difference(time) < breakingWindow;

  Map<String, dynamic> toJson() =>
      {'title': title, 'body': body, 'url': url, 'articleId': articleId, 'time': time.toIso8601String()};

  factory BreakingNews.fromJson(Map<String, dynamic> j) => BreakingNews(
        title: (j['title'] ?? '') as String,
        body: (j['body'] ?? '') as String,
        url: j['url'] as String?,
        articleId: j['articleId'] as String?,
        time: DateTime.tryParse((j['time'] ?? '') as String) ?? DateTime.now(),
      );
}

/// «منذ 3 ساعات» بالعربية.
String timeAgo(DateTime t) {
  if (t.year <= 2000) return '';
  final d = DateTime.now().difference(t);
  if (d.inMinutes < 1) return 'الآن';
  if (d.inMinutes < 60) return _plural(d.inMinutes, 'دقيقة', 'دقيقتين', 'دقائق');
  if (d.inHours < 24) return _plural(d.inHours, 'ساعة', 'ساعتين', 'ساعات');
  if (d.inDays < 30) return _plural(d.inDays, 'يوم', 'يومين', 'أيام');
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return '${t.day} ${months[t.month - 1]} ${t.year}';
}

String _plural(int n, String one, String two, String few) {
  if (n == 1) return 'منذ $one';
  if (n == 2) return 'منذ $two';
  if (n <= 10) return 'منذ $n $few';
  return 'منذ $n $one';
}

/// خبر مكتوب ينشره المحرر من لوحة التحرير.
class Article {
  final String id;
  final String title;
  final String body;
  final String category;
  final bool breaking;
  final String thumb; // صورة مصغرة base64 (JPEG)
  final int imageCount;
  final DateTime createdAt;
  final List<String> portals; // معرّفات البوابات التي اختارها المحرر

  Article({
    required this.id,
    required this.title,
    required this.body,
    required this.category,
    required this.breaking,
    required this.thumb,
    required this.imageCount,
    required this.createdAt,
    this.portals = const [],
  });

  Uint8List? _thumbBytes;
  Uint8List? get thumbBytes {
    if (thumb.isEmpty) return null;
    try {
      return _thumbBytes ??= base64Decode(thumb);
    } catch (_) {
      return null;
    }
  }

  /// «عاجل» لمدة نصف ساعة فقط من النشر، ثم يصبح خبراً عادياً.
  bool get isFreshBreaking => breaking && DateTime.now().difference(createdAt) < breakingWindow;

  String get excerpt {
    final t = body.replaceAll(RegExp(r'\s+'), ' ').trim();
    return t.length > 160 ? '${t.substring(0, 160)}…' : t;
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'category': category,
        'breaking': breaking,
        'thumb': thumb,
        'imageCount': imageCount,
        'createdAt': createdAt.toIso8601String(),
        'portals': portals,
      };

  factory Article.fromJson(Map<String, dynamic> j) => Article(
        id: j['id'] as String,
        title: (j['title'] ?? '') as String,
        body: (j['body'] ?? '') as String,
        category: (j['category'] ?? '') as String,
        breaking: (j['breaking'] ?? false) as bool,
        thumb: (j['thumb'] ?? '') as String,
        imageCount: (j['imageCount'] ?? 0) as int,
        createdAt: DateTime.tryParse((j['createdAt'] ?? '') as String) ?? DateTime.now(),
        portals: ((j['portals'] ?? const []) as List).map((e) => e.toString()).toList(),
      );
}

/// تاريخ أي عنصر في الخلاصة (خبر مكتوب أو فيديو).
DateTime feedDate(Object o) => o is Article ? o.createdAt : (o as VideoItem).published;

/// تصنيفات أي عنصر في الخلاصة.
List<String> feedCategories(Object o) {
  if (o is VideoItem) return o.categories;
  final a = o as Article;
  final text = '${a.title} ${a.body}';
  return {
    if (a.category.isNotEmpty) a.category,
    ...AppConfig.categories.entries.where((e) => matchesAny(text, e.value)).map((e) => e.key),
  }.toList();
}
