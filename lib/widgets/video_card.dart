import 'package:flutter/material.dart';

import '../models.dart';
import '../screens/player_screen.dart';
import '../services/saved_service.dart';
import '../theme.dart';

void openVideo(BuildContext context, VideoItem v) {
  Navigator.of(context).push(MaterialPageRoute(builder: (_) => PlayerScreen(video: v)));
}

class Thumb extends StatelessWidget {
  final VideoItem video;
  final double radius;
  final bool big;
  const Thumb({super.key, required this.video, this.radius = 12, this.big = false});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: Stack(fit: StackFit.expand, children: [
          Container(color: Brand.green.withValues(alpha: 0.15)),
          Image.network(
            big ? video.bigThumb : video.hqThumb,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Image.network(
              video.hqThumb,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Center(
                child: Image.asset('assets/images/logo_white.png', height: 40, color: Brand.green),
              ),
            ),
          ),
          const Center(
            child: CircleAvatar(
              radius: 20,
              backgroundColor: Color(0xCC004A49),
              child: Icon(Icons.play_arrow_rounded, color: Colors.white, size: 28),
            ),
          ),
          if (video.isShort)
            const Positioned(top: 8, left: 8, child: _Badge('قصير', Brand.red)),
        ]),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String text;
  final Color color;
  const _Badge(this.text, this.color);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(6)),
        child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 12)),
      );
}

/// البطاقة الكبيرة لأحدث خبر.
class HeroCard extends StatelessWidget {
  final VideoItem video;
  const HeroCard({super.key, required this.video});

  @override
  Widget build(BuildContext context) {
    final cat = video.categories;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => openVideo(context, video),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Thumb(video: video, radius: 0, big: true),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 6),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                if (cat.isNotEmpty) ...[
                  Text(cat.first, style: const TextStyle(color: Brand.red, fontSize: 13)),
                  const Text('  •  ', style: TextStyle(color: Brand.muted, fontSize: 13)),
                ],
                Text(video.hasDate ? timeAgo(video.published) : 'يوتيوب',
                    style: const TextStyle(color: Brand.muted, fontSize: 13)),
              ]),
              const SizedBox(height: 6),
              Text(video.displayTitle,
                  style: const TextStyle(fontSize: 20, height: 1.5, color: Brand.ink)),
            ]),
          ),
          _Actions(video: video),
        ]),
      ),
    );
  }
}

/// بطاقة خبر في القائمة: صورة صغيرة وعنوان.
class NewsTile extends StatelessWidget {
  final VideoItem video;
  const NewsTile({super.key, required this.video});

  @override
  Widget build(BuildContext context) {
    final cat = video.categories;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => openVideo(context, video),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(width: 132, child: Thumb(video: video, radius: 10)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(video.displayTitle,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 15.5, height: 1.45, color: Brand.ink)),
                const SizedBox(height: 6),
                Text(
                  [if (cat.isNotEmpty) cat.first, if (video.hasDate) timeAgo(video.published)].join('  •  '),
                  style: const TextStyle(fontSize: 12, color: Brand.muted),
                ),
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}

/// بطاقة في شبكة الفيديوهات.
class GridVideoCard extends StatelessWidget {
  final VideoItem video;
  const GridVideoCard({super.key, required this.video});

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => openVideo(context, video),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Thumb(video: video, radius: 0),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 4),
              child: Text(video.displayTitle,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 13.5, height: 1.45, color: Brand.ink)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 0, 10, 8),
            child: Text(
                video.hasDate
                    ? timeAgo(video.published)
                    : (video.views > 0 ? '${video.views} مشاهدة' : 'قصير'),
                style: const TextStyle(fontSize: 11.5, color: Brand.muted)),
          ),
        ]),
      ),
    );
  }
}

class _Actions extends StatelessWidget {
  final VideoItem video;
  const _Actions({required this.video});
  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: SavedService.instance,
      builder: (context, _) {
        final saved = SavedService.instance.isSaved(video.id);
        return Row(mainAxisAlignment: MainAxisAlignment.end, children: [
          IconButton(
            tooltip: saved ? 'إزالة من المحفوظات' : 'حفظ',
            icon: Icon(saved ? Icons.bookmark : Icons.bookmark_border, color: Brand.green),
            onPressed: () => SavedService.instance.toggle(video),
          ),
          IconButton(
            tooltip: 'مشاركة',
            icon: const Icon(Icons.share_outlined, color: Brand.green),
            onPressed: () => SavedService.share(video),
          ),
          const SizedBox(width: 4),
        ]);
      },
    );
  }
}
