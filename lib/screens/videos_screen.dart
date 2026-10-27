import 'package:flutter/material.dart';

import '../models.dart';
import '../services/videos_controller.dart';
import '../theme.dart';
import '../widgets/states.dart';
import '../widgets/video_card.dart';

class VideosScreen extends StatefulWidget {
  const VideosScreen({super.key});
  @override
  State<VideosScreen> createState() => _VideosScreenState();
}

class _VideosScreenState extends State<VideosScreen> {
  int _filter = 0; // 0 الكل، 1 تقارير، 2 قصيرة
  final _ctrl = VideosController.instance;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('فيديوهات التقارير')),
      body: ListenableBuilder(
        listenable: _ctrl,
        builder: (context, _) {
          final all = _ctrl.items;
          final list = switch (_filter) {
            1 => all.where((v) => !v.isShort).toList(),
            2 => all.where((v) => v.isShort).toList(),
            _ => all,
          };
          return Column(children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
              child: SegmentedButton<int>(
                showSelectedIcon: false,
                style: SegmentedButton.styleFrom(
                  selectedBackgroundColor: Brand.green,
                  selectedForegroundColor: Colors.white,
                ),
                segments: const [
                  ButtonSegment(value: 0, label: Text('الكل')),
                  ButtonSegment(value: 1, label: Text('تقارير')),
                  ButtonSegment(value: 2, label: Text('قصيرة')),
                ],
                selected: {_filter},
                onSelectionChanged: (s) => setState(() => _filter = s.first),
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                color: Brand.green,
                onRefresh: _ctrl.refresh,
                child: _body(all.isEmpty, list),
              ),
            ),
          ]);
        },
      ),
    );
  }

  Widget _body(bool noData, List<VideoItem> list) {
    if (noData && _ctrl.loading) return const LoadingState();
    if (noData) {
      return ListView(children: [
        const SizedBox(height: 80),
        ErrorState(message: _ctrl.error ?? 'لا توجد فيديوهات بعد.', onRetry: _ctrl.refresh),
      ]);
    }
    if (list.isEmpty) {
      return ListView(children: const [
        SizedBox(height: 80),
        EmptyState(icon: Icons.video_library_outlined, text: 'لا توجد فيديوهات من هذا النوع.'),
      ]);
    }
    return GridView.builder(
      padding: const EdgeInsets.all(12),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 260,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.78,
      ),
      itemCount: list.length,
      itemBuilder: (_, i) => GridVideoCard(video: list[i]),
    );
  }
}
