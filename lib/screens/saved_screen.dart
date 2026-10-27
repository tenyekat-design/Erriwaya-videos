import 'package:flutter/material.dart';

import '../services/saved_service.dart';
import '../theme.dart';
import '../widgets/states.dart';
import '../widgets/video_card.dart';

class SavedScreen extends StatelessWidget {
  const SavedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('المحفوظات')),
      body: ListenableBuilder(
        listenable: SavedService.instance,
        builder: (context, _) {
          final items = SavedService.instance.items;
          if (items.isEmpty) {
            return const EmptyState(
              icon: Icons.bookmark_border,
              text: 'لم تحفظ شيئاً بعد.\nاضغط على علامة الحفظ في أي خبر لتجده هنا.',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, i) {
              final v = items[i];
              return Dismissible(
                key: ValueKey(v.id),
                background: Container(
                  alignment: AlignmentDirectional.centerEnd,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                      color: Brand.red, borderRadius: BorderRadius.circular(14)),
                  child: const Icon(Icons.delete_outline, color: Colors.white),
                ),
                onDismissed: (_) => SavedService.instance.toggle(v),
                child: NewsTile(video: v),
              );
            },
          );
        },
      ),
    );
  }
}
