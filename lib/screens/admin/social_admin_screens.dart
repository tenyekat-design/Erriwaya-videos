import 'package:flutter/material.dart';

import '../../models.dart';
import '../../services/articles_service.dart';
import '../../services/social_service.dart';
import '../../theme.dart';

/// مراجعة تعليقات القراء: لا يظهر تعليق في الموقع أو التطبيق إلا بعد الموافقة عليه هنا.
class CommentsAdminScreen extends StatelessWidget {
  const CommentsAdminScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('تعليقات القراء'),
          bottom: const TabBar(
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white70,
            indicatorColor: Colors.white,
            tabs: [Tab(text: 'بانتظار المراجعة'), Tab(text: 'المنشورة')],
          ),
        ),
        body: TabBarView(children: [
          _CommentsList(stream: SocialService.instance.pendingComments(), pending: true),
          _CommentsList(stream: SocialService.instance.publishedComments(), pending: false),
        ]),
      ),
    );
  }
}

class _CommentsList extends StatelessWidget {
  final Stream<List<ReaderComment>> stream;
  final bool pending;
  const _CommentsList({required this.stream, required this.pending});

  String _articleTitle(String id) {
    for (final a in ArticlesService.instance.items) {
      if (a.id == id) return a.title;
    }
    return '';
  }

  Future<void> _run(BuildContext context, Future<void> Function() f, String ok) async {
    try {
      await f();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ok)));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('تعذر التنفيذ: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<ReaderComment>>(
      stream: stream,
      builder: (context, snap) {
        if (snap.hasError) {
          return Center(
              child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text('تعذر تحميل التعليقات.\n${snap.error}', textAlign: TextAlign.center),
          ));
        }
        if (!snap.hasData) return const Center(child: CircularProgressIndicator(color: Brand.green));
        final list = snap.data!;
        if (list.isEmpty) {
          return Center(
              child: Text(pending ? 'لا تعليقات جديدة.' : 'لا تعليقات منشورة بعد.',
                  style: const TextStyle(color: Brand.muted)));
        }
        return ListView.separated(
          padding: const EdgeInsets.all(12),
          itemCount: list.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (context, i) {
            final c = list[i];
            final t = _articleTitle(c.articleId);
            return Card(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Expanded(
                        child: Text(c.name, style: const TextStyle(fontSize: 16, color: Brand.ink))),
                    Text(timeAgo(c.time), style: const TextStyle(fontSize: 12, color: Brand.muted)),
                  ]),
                  if (t.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text('على: $t',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: Brand.green)),
                    ),
                  const SizedBox(height: 6),
                  SelectableText(c.text, style: const TextStyle(fontSize: 15, height: 1.7)),
                  Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                    if (pending)
                      TextButton.icon(
                        onPressed: () => _run(context, () => SocialService.instance.approve(c.id), 'نُشر التعليق'),
                        icon: const Icon(Icons.check_circle_outline, color: Brand.green),
                        label: const Text('نشر', style: TextStyle(color: Brand.green)),
                      ),
                    TextButton.icon(
                      onPressed: () => _run(context, () => SocialService.instance.deleteComment(c.id), 'حُذف التعليق'),
                      icon: const Icon(Icons.delete_outline, color: Brand.red),
                      label: const Text('حذف', style: TextStyle(color: Brand.red)),
                    ),
                  ]),
                ]),
              ),
            );
          },
        );
      },
    );
  }
}

/// استطلاعات الرأي: استطلاع واحد مفتوح يظهر في رئيسية الموقع والتطبيق.
class PollsAdminScreen extends StatelessWidget {
  const PollsAdminScreen({super.key});

  Future<void> _new(BuildContext context) async {
    final q = TextEditingController();
    final opts = [TextEditingController(), TextEditingController()];
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setD) => AlertDialog(
          title: const Text('استطلاع جديد'),
          content: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              TextField(
                controller: q,
                maxLines: 3,
                minLines: 1,
                decoration: const InputDecoration(labelText: 'السؤال'),
              ),
              for (var i = 0; i < opts.length; i++)
                TextField(controller: opts[i], decoration: InputDecoration(labelText: 'الإجابة ${i + 1}')),
              if (opts.length < 5)
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: TextButton.icon(
                    onPressed: () => setD(() => opts.add(TextEditingController())),
                    icon: const Icon(Icons.add),
                    label: const Text('إجابة أخرى'),
                  ),
                ),
              const SizedBox(height: 6),
              const Text('نشر استطلاع جديد يغلق الاستطلاع المفتوح حالياً.',
                  style: TextStyle(fontSize: 12, color: Brand.muted)),
            ]),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('إلغاء')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('نشر')),
          ],
        ),
      ),
    );
    if (ok != true) return;
    final options = opts.map((c) => c.text.trim()).where((t) => t.isNotEmpty).toList();
    if (q.text.trim().isEmpty || options.length < 2) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('اكتب السؤال وإجابتين على الأقل.')));
      }
      return;
    }
    try {
      await SocialService.instance.createPoll(q.text, options);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('تعذر النشر: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('استطلاعات الرأي')),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: Brand.green,
        foregroundColor: Colors.white,
        onPressed: () => _new(context),
        icon: const Icon(Icons.add_chart),
        label: const Text('استطلاع جديد'),
      ),
      body: StreamBuilder<List<Poll>>(
        stream: SocialService.instance.allPolls(),
        builder: (context, snap) {
          if (snap.hasError) {
            return Center(child: Text('تعذر التحميل.\n${snap.error}', textAlign: TextAlign.center));
          }
          if (!snap.hasData) return const Center(child: CircularProgressIndicator(color: Brand.green));
          final list = snap.data!;
          if (list.isEmpty) {
            return const Center(
                child: Text('لا استطلاعات بعد.\nاضغط «استطلاع جديد».',
                    textAlign: TextAlign.center, style: TextStyle(color: Brand.muted)));
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 96),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, i) => _PollAdminTile(poll: list[i]),
          );
        },
      ),
    );
  }
}

class _PollAdminTile extends StatefulWidget {
  final Poll poll;
  const _PollAdminTile({required this.poll});
  @override
  State<_PollAdminTile> createState() => _PollAdminTileState();
}

class _PollAdminTileState extends State<_PollAdminTile> {
  @override
  void initState() {
    super.initState();
    SocialService.instance.loadVotes(widget.poll);
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.poll;
    return ListenableBuilder(
      listenable: SocialService.instance,
      builder: (context, _) {
        final ns = SocialService.instance.voteCounts(p.id) ?? List.filled(p.options.length, 0);
        final total = ns.fold<int>(0, (a, b) => a + b);
        return Card(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                      color: p.active ? Brand.green : Brand.muted, borderRadius: BorderRadius.circular(6)),
                  child: Text(p.active ? 'مفتوح' : 'مغلق',
                      style: const TextStyle(color: Colors.white, fontSize: 12)),
                ),
                const Spacer(),
                Text('$total صوت', style: const TextStyle(color: Brand.muted, fontSize: 13)),
              ]),
              const SizedBox(height: 8),
              Text(p.question, style: const TextStyle(fontSize: 16, color: Brand.ink)),
              const SizedBox(height: 6),
              for (var i = 0; i < p.options.length; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(children: [
                    Expanded(child: Text(p.options[i])),
                    Text('${ns[i]}  (${total == 0 ? 0 : (ns[i] * 100 / total).round()}%)',
                        style: const TextStyle(color: Brand.muted)),
                  ]),
                ),
              Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                TextButton(
                  onPressed: () => SocialService.instance.setPollActive(p.id, !p.active),
                  child: Text(p.active ? 'إغلاق' : 'إعادة فتح'),
                ),
                IconButton(
                  tooltip: 'حذف',
                  icon: const Icon(Icons.delete_outline, color: Brand.red),
                  onPressed: () async {
                    final ok = await showDialog<bool>(
                      context: context,
                      builder: (_) => AlertDialog(
                        title: const Text('حذف الاستطلاع؟'),
                        content: Text(p.question),
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
                    if (ok == true) await SocialService.instance.deletePoll(p.id);
                  },
                ),
              ]),
            ]),
          ),
        );
      },
    );
  }
}
