import 'package:flutter/material.dart';

import '../models.dart';
import '../screens/article_screen.dart';
import '../services/saved_service.dart';
import '../theme.dart';

void openArticle(BuildContext context, Article a) {
  Navigator.of(context).push(MaterialPageRoute(builder: (_) => ArticleScreen(article: a)));
}

class ArticleThumb extends StatelessWidget {
  final Article article;
  final double radius;
  const ArticleThumb({super.key, required this.article, this.radius = 12});

  @override
  Widget build(BuildContext context) {
    final bytes = article.thumbBytes;
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: Stack(fit: StackFit.expand, children: [
          if (bytes != null)
            Image.memory(bytes, fit: BoxFit.cover, gaplessPlayback: true)
          else
            Container(
              color: Brand.green,
              alignment: Alignment.center,
              child: Image.asset('assets/images/logo_white.png', height: 44),
            ),
          if (article.breaking)
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration:
                    BoxDecoration(color: Brand.red, borderRadius: BorderRadius.circular(6)),
                child: const Text('عاجل', style: TextStyle(color: Colors.white, fontSize: 12)),
              ),
            ),
          if (article.imageCount > 1)
            Positioned(
              bottom: 8,
              left: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                    color: Colors.black54, borderRadius: BorderRadius.circular(6)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.photo_library_outlined, size: 13, color: Colors.white),
                  const SizedBox(width: 3),
                  Text('${article.imageCount}',
                      style: const TextStyle(color: Colors.white, fontSize: 12)),
                ]),
              ),
            ),
        ]),
      ),
    );
  }
}

String _meta(Article a) =>
    [if (a.category.isNotEmpty) a.category, timeAgo(a.createdAt)].join('  •  ');

class ArticleHero extends StatelessWidget {
  final Article article;
  const ArticleHero({super.key, required this.article});

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => openArticle(context, article),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          ArticleThumb(article: article, radius: 0),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(_meta(article), style: const TextStyle(color: Brand.red, fontSize: 13)),
              const SizedBox(height: 6),
              Text(article.title,
                  style: const TextStyle(fontSize: 20, height: 1.5, color: Brand.ink)),
              if (article.excerpt.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(article.excerpt,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 14, height: 1.6, color: Brand.muted)),
              ],
            ]),
          ),
          ArticleActions(article: article),
        ]),
      ),
    );
  }
}

class ArticleTile extends StatelessWidget {
  final Article article;
  const ArticleTile({super.key, required this.article});

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => openArticle(context, article),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(width: 132, child: ArticleThumb(article: article, radius: 10)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(article.title,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 15.5, height: 1.45, color: Brand.ink)),
                const SizedBox(height: 6),
                Text(_meta(article), style: const TextStyle(fontSize: 12, color: Brand.muted)),
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}

class ArticleActions extends StatelessWidget {
  final Article article;
  const ArticleActions({super.key, required this.article});
  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: SavedService.instance,
      builder: (context, _) {
        final saved = SavedService.instance.isSaved(article);
        return Row(mainAxisAlignment: MainAxisAlignment.end, children: [
          IconButton(
            tooltip: saved ? 'إزالة من المحفوظات' : 'حفظ',
            icon: Icon(saved ? Icons.bookmark : Icons.bookmark_border, color: Brand.green),
            onPressed: () => SavedService.instance.toggle(article),
          ),
          IconButton(
            tooltip: 'مشاركة',
            icon: const Icon(Icons.share_outlined, color: Brand.green),
            onPressed: () => SavedService.share(article),
          ),
          const SizedBox(width: 4),
        ]);
      },
    );
  }
}
