import 'dart:typed_data';

import 'package:flutter/material.dart';

import '../models.dart';
import '../portals.dart';
import '../services/articles_service.dart';
import '../services/videos_controller.dart';
import '../theme.dart';
import '../widgets/article_card.dart';
import '../widgets/states.dart';
import '../widgets/video_card.dart';

/// كل المواد (أخبار مكتوبة وفيديوهات وقصيرة) مرتبة من الأحدث.
List<Object> _allItems() => <Object>[
      ...ArticlesService.instance.items,
      ...VideosController.instance.items,
    ]..sort((a, b) => feedDate(b).compareTo(feedDate(a)));

class PortalsScreen extends StatelessWidget {
  const PortalsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('البوابات')),
      body: ListenableBuilder(
        listenable: Listenable.merge([ArticlesService.instance, VideosController.instance]),
        builder: (context, _) {
          final all = _allItems();
          final groups = <String, List<Portal>>{};
          for (final p in portals) {
            groups.putIfAbsent(p.group, () => []).add(p);
          }
          return ListView(padding: const EdgeInsets.fromLTRB(12, 8, 12, 24), children: [
            for (final g in groups.entries) ...[
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 14, 4, 10),
                child: Row(children: [
                  Container(width: 4, height: 20, color: Brand.red),
                  const SizedBox(width: 8),
                  Text(g.key, style: const TextStyle(fontSize: 18, color: Brand.ink)),
                ]),
              ),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.45,
                children: [
                  for (final p in g.value)
                    _PortalTile(portal: p, items: all.where((o) => inPortal(p, o)).toList()),
                ],
              ),
            ],
          ]);
        },
      ),
    );
  }
}

class _PortalTile extends StatelessWidget {
  final Portal portal;
  final List<Object> items;
  const _PortalTile({required this.portal, required this.items});

  @override
  Widget build(BuildContext context) {
    // خلفية البطاقة: صورة آخر مادة في البوابة تحت طبقة خضراء.
    Widget? bg;
    if (items.isNotEmpty) {
      final o = items.first;
      if (o is Article) {
        final Uint8List? b = o.thumbBytes;
        if (b != null) bg = Image.memory(b, fit: BoxFit.cover);
      } else {
        bg = Image.network((o as VideoItem).hqThumb,
            fit: BoxFit.cover, errorBuilder: (_, __, ___) => const SizedBox());
      }
    }
    return Material(
      color: Brand.green,
      borderRadius: BorderRadius.circular(14),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Navigator.of(context)
            .push(MaterialPageRoute(builder: (_) => PortalScreen(portal: portal))),
        child: Stack(fit: StackFit.expand, children: [
          if (bg != null) bg,
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Brand.green.withValues(alpha: bg == null ? 1 : 0.55),
                  Brand.greenDark.withValues(alpha: 0.95),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(portal.latin.toUpperCase(),
                  style: const TextStyle(
                      fontFamily: 'sans-serif',
                      fontSize: 10,
                      letterSpacing: 1.2,
                      color: Colors.white70)),
              const Spacer(),
              Text(portal.name, style: const TextStyle(fontSize: 22, color: Colors.white)),
              const SizedBox(height: 2),
              Text(items.isEmpty ? 'لا مواد بعد' : '${items.length} مادة',
                  style: const TextStyle(fontSize: 12, color: Colors.white70)),
            ]),
          ),
        ]),
      ),
    );
  }
}

class PortalScreen extends StatelessWidget {
  final Portal portal;
  const PortalScreen({super.key, required this.portal});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('بوابة ${portal.name}')),
      body: ListenableBuilder(
        listenable: Listenable.merge([ArticlesService.instance, VideosController.instance]),
        builder: (context, _) {
          final list = _allItems().where((o) => inPortal(portal, o)).toList();
          if (list.isEmpty) {
            return EmptyState(
              icon: Icons.public,
              text: 'لا توجد مواد عن ${portal.name} حالياً.\nستظهر هنا تلقائياً عند نشرها.',
            );
          }
          return RefreshIndicator(
            color: Brand.green,
            onRefresh: VideosController.instance.refresh,
            child: ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final o = list[i];
                if (i == 0) {
                  return o is Article ? ArticleHero(article: o) : HeroCard(video: o as VideoItem);
                }
                return o is Article ? ArticleTile(article: o) : NewsTile(video: o as VideoItem);
              },
            ),
          );
        },
      ),
    );
  }
}
