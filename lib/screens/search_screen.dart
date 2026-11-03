import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../config.dart';
import '../models.dart';
import '../services/articles_service.dart';
import '../services/videos_controller.dart';
import '../theme.dart';
import '../widgets/article_card.dart';
import '../widgets/states.dart';
import '../widgets/video_card.dart';

/// تطبيع عربي للبحث (كما في الموقع): بلا تشكيل ولا تطويل، والهمزات ألفاً، والتاء المربوطة هاءً، والألف المقصورة ياءً.
String fold(String t) => t
    .toLowerCase()
    .replaceAll(RegExp('[ً-ْٰـ]'), '')
    .replaceAll(RegExp('[أإآٱ]'), 'ا')
    .replaceAll('ة', 'ه')
    .replaceAll('ى', 'ي')
    .replaceAll('ؤ', 'و')
    .replaceAll('ئ', 'ي')
    .replaceAll('_', ' ');

/// خبر من فهرس الموقع (كل الأخبار، لا آخر 60 فقط).
class _Indexed {
  final String id, title, summary, section, writer;
  final DateTime? date;
  _Indexed(this.id, this.title, this.summary, this.section, this.writer, this.date);
}

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  static List<_Indexed>? _index; // يُحمَّل مرة واحدة في كل تشغيل
  final _q = TextEditingController();
  String _query = '';
  bool _opening = false;

  @override
  void initState() {
    super.initState();
    if (_index == null) _loadIndex();
  }

  Future<void> _loadIndex() async {
    try {
      final r =
          await http.get(Uri.parse('${AppConfig.siteUrl}/search.json')).timeout(const Duration(seconds: 15));
      if (r.statusCode != 200) return;
      final list = jsonDecode(utf8.decode(r.bodyBytes)) as List;
      _index = [
        for (final x in list.cast<Map>())
          _Indexed('${x['id']}', '${x['t'] ?? ''}', '${x['s'] ?? ''}', '${x['c'] ?? ''}', '${x['w'] ?? ''}',
              DateTime.tryParse('${x['d'] ?? ''}')),
      ];
      if (mounted) setState(() {});
    } catch (_) {}
  }

  @override
  void dispose() {
    _q.dispose();
    super.dispose();
  }

  List<String> get _words => fold(_query)
      .split(RegExp(r'\s+'))
      .map((w) => w.length > 4 && w.startsWith('ال') ? w.substring(2) : w) // «الأمطار» تطابق «أمطار»
      .where((w) => w.length > 1 || RegExp(r'\d').hasMatch(w))
      .toList();

  /// النتائج: الأخبار المحمّلة، ثم أخبار الفهرس غير المحمّلة، والفيديوهات؛ ما طابق العنوان أولاً ثم الأحدث.
  List<Object> _results() {
    final words = _words;
    if (words.isEmpty) return const [];
    final scored = <(int, DateTime, Object)>[];
    void consider(Object o, String title, String rest, DateTime date) {
      final t = fold(title), all = '$t ${fold(rest)}';
      if (!words.every(all.contains)) return;
      scored.add((words.where(t.contains).length, date, o));
    }

    final arts = ArticlesService.instance.items;
    final have = {for (final a in arts) a.id};
    for (final a in arts) {
      consider(a, a.title, '${a.body} ${a.writer} ${articleLabel(a)}', a.createdAt);
    }
    for (final x in _index ?? const <_Indexed>[]) {
      if (have.contains(x.id)) continue;
      consider(x, x.title, '${x.summary} ${x.writer} ${x.section}', x.date ?? VideoItem.unknownDate);
    }
    for (final v in VideosController.instance.items) {
      consider(v, v.displayTitle, '', v.published);
    }
    scored.sort((a, b) => a.$1 != b.$1 ? b.$1.compareTo(a.$1) : b.$2.compareTo(a.$2));
    return scored.map((e) => e.$3).take(80).toList();
  }

  Future<void> _openIndexed(_Indexed x) async {
    setState(() => _opening = true);
    Article? a;
    try {
      a = await ArticlesService.instance.byId(x.id);
    } catch (_) {}
    if (!mounted) return;
    setState(() => _opening = false);
    a ??= Article(
        id: x.id,
        title: x.title,
        body: x.summary,
        category: x.section,
        breaking: false,
        thumb: '',
        imageCount: 0,
        createdAt: x.date ?? DateTime.now(),
        writer: x.writer);
    openArticle(context, a);
  }

  @override
  Widget build(BuildContext context) {
    final res = _results();
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: TextField(
          controller: _q,
          autofocus: true,
          textInputAction: TextInputAction.search,
          style: const TextStyle(color: Colors.white, fontSize: 18),
          cursorColor: Colors.white,
          decoration: const InputDecoration(
            hintText: 'ابحث في أخبار الرواية وفيديوهاتها…',
            hintStyle: TextStyle(color: Colors.white70),
            border: InputBorder.none,
          ),
          onChanged: (v) => setState(() => _query = v),
        ),
        actions: [
          if (_query.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.close),
              tooltip: 'مسح',
              onPressed: () => setState(() {
                _q.clear();
                _query = '';
              }),
            ),
        ],
        bottom: _opening
            ? const PreferredSize(
                preferredSize: Size.fromHeight(3), child: LinearProgressIndicator(minHeight: 3))
            : null,
      ),
      body: ListenableBuilder(
        listenable: Listenable.merge([ArticlesService.instance, VideosController.instance]),
        builder: (context, _) {
          if (_words.isEmpty) {
            return const EmptyState(icon: Icons.search, text: 'اكتب كلمة أو اسم دولة أو مدينة.');
          }
          if (res.isEmpty) {
            return EmptyState(icon: Icons.search_off, text: 'لا نتائج لـ«${_query.trim()}». جرّب كلمة أقصر.');
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 24),
            itemCount: res.length + 1,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, i) {
              if (i == 0) {
                return Text('${res.length} نتيجة', style: const TextStyle(color: Brand.muted, fontSize: 13));
              }
              final o = res[i - 1];
              if (o is Article) return ArticleTile(article: o);
              if (o is VideoItem) return NewsTile(video: o);
              final x = o as _Indexed;
              return Card(
                child: ListTile(
                  onTap: () => _openIndexed(x),
                  title: Text(x.title,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 15.5, height: 1.45, color: Brand.ink)),
                  subtitle: Text(
                      [
                        if (x.section.isNotEmpty) x.section,
                        if (x.writer.isNotEmpty) x.writer,
                        if (x.date != null) timeAgo(x.date!),
                      ].join('  •  '),
                      style: const TextStyle(fontSize: 12, color: Brand.muted)),
                  trailing: const Icon(Icons.article_outlined, color: Brand.green),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
