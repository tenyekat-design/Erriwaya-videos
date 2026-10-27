import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../models.dart';
import '../../services/articles_service.dart';
import '../../theme.dart';
import '../../widgets/article_card.dart';
import 'compose_screen.dart';
import 'push_key_screen.dart';
import 'site_admin_screens.dart';

class AdminScreen extends StatelessWidget {
  const AdminScreen({super.key});

  Future<void> _delete(BuildContext context, Article a) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('حذف الخبر؟'),
        content: Text(a.title),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Brand.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('حذف'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ArticlesService.instance.delete(a);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('تعذر الحذف: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    return Scaffold(
      appBar: AppBar(
        title: const Text('لوحة التحرير'),
        actions: [
          IconButton(
            tooltip: 'رسائل القراء',
            icon: const Icon(Icons.inbox_outlined),
            onPressed: () => Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => const MessagesScreen())),
          ),
          IconButton(
            tooltip: 'عن الرواية والاتصال',
            icon: const Icon(Icons.info_outline),
            onPressed: () => Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => const SiteInfoEditScreen())),
          ),
          IconButton(
            tooltip: 'مفتاح الإشعارات',
            icon: const Icon(Icons.notifications_active_outlined),
            onPressed: () => Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => const PushKeyScreen())),
          ),
          IconButton(
            tooltip: 'خروج',
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: Brand.green,
        foregroundColor: Colors.white,
        onPressed: () => Navigator.of(context)
            .push(MaterialPageRoute(builder: (_) => const ComposeScreen())),
        icon: const Icon(Icons.edit),
        label: const Text('خبر جديد'),
      ),
      body: ListenableBuilder(
        listenable: ArticlesService.instance,
        builder: (context, _) {
          final items = ArticlesService.instance.items;
          return ListView(padding: const EdgeInsets.fromLTRB(12, 12, 12, 96), children: [
            Text('مسجل باسم ${user?.email ?? ''}',
                style: const TextStyle(color: Brand.muted, fontSize: 13)),
            const SizedBox(height: 10),
            if (items.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 60),
                child: Center(
                  child: Text('لا توجد أخبار منشورة بعد.\nاضغط «خبر جديد» لنشر أول خبر.',
                      textAlign: TextAlign.center, style: TextStyle(color: Brand.muted)),
                ),
              ),
            for (final a in items)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Stack(children: [
                  ArticleTile(article: a),
                  Positioned(
                    left: 4,
                    bottom: 4,
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      IconButton(
                        tooltip: 'تعديل',
                        icon: const Icon(Icons.edit_outlined, color: Brand.green),
                        onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                            builder: (_) => ComposeScreen(editing: a))),
                      ),
                      IconButton(
                        tooltip: 'حذف',
                        icon: const Icon(Icons.delete_outline, color: Brand.red),
                        onPressed: () => _delete(context, a),
                      ),
                    ]),
                  ),
                ]),
              ),
          ]);
        },
      ),
    );
  }
}
