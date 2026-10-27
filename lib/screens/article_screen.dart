import 'dart:typed_data';

import 'package:flutter/material.dart';

import '../models.dart';
import '../services/articles_service.dart';
import '../services/saved_service.dart';
import '../theme.dart';

class ArticleScreen extends StatefulWidget {
  final Article article;
  const ArticleScreen({super.key, required this.article});
  @override
  State<ArticleScreen> createState() => _ArticleScreenState();
}

class _ArticleScreenState extends State<ArticleScreen> {
  late final Future<List<Uint8List>> _images = ArticlesService.instance.images(widget.article);
  int _page = 0;

  @override
  Widget build(BuildContext context) {
    final a = widget.article;
    return Scaffold(
      appBar: AppBar(title: Text(a.isFreshBreaking ? 'عاجل' : 'خبر')),
      body: ListView(children: [
        FutureBuilder<List<Uint8List>>(
          future: _images,
          builder: (context, snap) {
            final imgs = snap.data ?? const <Uint8List>[];
            if (imgs.isEmpty) {
              final t = a.thumbBytes;
              if (t == null) return const SizedBox.shrink();
              return AspectRatio(
                aspectRatio: 16 / 10,
                child: Stack(fit: StackFit.expand, children: [
                  Image.memory(t, fit: BoxFit.cover),
                  if (snap.connectionState == ConnectionState.waiting && a.imageCount > 0)
                    const Align(
                      alignment: Alignment.bottomCenter,
                      child: LinearProgressIndicator(color: Brand.green, minHeight: 3),
                    ),
                ]),
              );
            }
            return Column(children: [
              AspectRatio(
                aspectRatio: 16 / 10,
                child: PageView.builder(
                  itemCount: imgs.length,
                  onPageChanged: (i) => setState(() => _page = i),
                  itemBuilder: (_, i) => GestureDetector(
                    onTap: () => _fullscreen(context, imgs, i),
                    child: Image.memory(imgs[i], fit: BoxFit.cover, gaplessPlayback: true),
                  ),
                ),
              ),
              if (imgs.length > 1)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    for (var i = 0; i < imgs.length; i++)
                      Container(
                        width: i == _page ? 18 : 7,
                        height: 7,
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        decoration: BoxDecoration(
                          color: i == _page ? Brand.green : Brand.green.withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                  ]),
                ),
            ]);
          },
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              if (a.isFreshBreaking)
                Container(
                  margin: const EdgeInsetsDirectional.only(end: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration:
                      BoxDecoration(color: Brand.red, borderRadius: BorderRadius.circular(6)),
                  child: const Text('عاجل', style: TextStyle(color: Colors.white, fontSize: 13)),
                ),
              Text(
                [if (a.category.isNotEmpty) a.category, timeAgo(a.createdAt)].join('  •  '),
                style: const TextStyle(color: Brand.muted, fontSize: 13),
              ),
            ]),
            const SizedBox(height: 10),
            Text(a.title, style: const TextStyle(fontSize: 22, height: 1.5, color: Brand.ink)),
            const SizedBox(height: 14),
            ListenableBuilder(
              listenable: SavedService.instance,
              builder: (context, _) {
                final saved = SavedService.instance.isSaved(a);
                return Wrap(spacing: 8, children: [
                  FilledButton.icon(
                    onPressed: () => SavedService.instance.toggle(a),
                    icon: Icon(saved ? Icons.bookmark : Icons.bookmark_border),
                    label: Text(saved ? 'محفوظ' : 'حفظ'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => SavedService.share(a),
                    icon: const Icon(Icons.share_outlined),
                    label: const Text('مشاركة'),
                  ),
                ]);
              },
            ),
            const SizedBox(height: 18),
            SelectableText(a.body,
                style: const TextStyle(fontSize: 17, height: 1.9, color: Brand.ink)),
          ]),
        ),
      ]),
    );
  }

  void _fullscreen(BuildContext context, List<Uint8List> imgs, int start) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(backgroundColor: Colors.black),
        body: PageView.builder(
          controller: PageController(initialPage: start),
          itemCount: imgs.length,
          itemBuilder: (_, i) => InteractiveViewer(child: Center(child: Image.memory(imgs[i]))),
        ),
      ),
    ));
  }
}
