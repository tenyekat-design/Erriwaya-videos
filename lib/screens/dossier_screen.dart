import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../config.dart';
import '../models.dart';
import '../portals.dart';
import '../services/articles_service.dart';
import '../services/dossiers_service.dart';
import '../services/videos_controller.dart';
import '../theme.dart';
import '../widgets/article_card.dart';
import '../widgets/video_card.dart';

const _months = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];
const _days = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

String _longDate(String iso, {bool year = true}) {
  final d = DateTime.tryParse(iso);
  if (d == null) return iso;
  return year ? '${d.day} ${_months[d.month - 1]} ${d.year}' : '${d.day} ${_months[d.month - 1]}';
}

// نواكشوط على توقيت غرينتش: الأيام والساعات بتوقيتها، كما في الموقع
String _dayName(DateTime t) {
  final u = t.toUtc();
  return '${_days[u.weekday - 1]} ${u.day} ${_months[u.month - 1]}';
}

String _hhmm(DateTime t) {
  final u = t.toUtc();
  return '${u.hour.toString().padLeft(2, '0')}:${u.minute.toString().padLeft(2, '0')}';
}

void openDossier(BuildContext context, DossierRef d) {
  Navigator.of(context).push(MaterialPageRoute(builder: (_) => DossierScreen(dossier: d)));
}

/// صفحة ملف: «ما تحتاج معرفته»، والمحطات، والخط الزمني بكل ما نُشر عن القضية، الأحدث أولاً.
class DossierScreen extends StatefulWidget {
  final DossierRef dossier;
  const DossierScreen({super.key, required this.dossier});
  @override
  State<DossierScreen> createState() => _DossierScreenState();
}

class _DossierScreenState extends State<DossierScreen> {
  late Future<List<Object>> _items = _resolve();

  /// مواد الملف: من الأخبار المحمّلة في التطبيق، وما سواها من Firestore، والفيديوهات من قائمة القناة،
  /// ثم ما نُشر بعد آخر بناء للموقع ويطابق قواعد الملف.
  Future<List<Object>> _resolve() async {
    final d = widget.dossier;
    final arts = ArticlesService.instance;
    final vids = {for (final v in VideosController.instance.items) v.id: v};
    final out = <Object>[];
    final have = <String>{};
    final pending = <Future<void>>[];
    for (final (k, id) in d.items) {
      if (k == 'v') {
        final v = vids[id];
        if (v != null) out.add(v);
        continue;
      }
      have.add(id);
      final local = arts.items.where((a) => a.id == id);
      if (local.isNotEmpty) {
        out.add(local.first);
      } else {
        pending.add(arts.byId(id).then((a) {
          if (a != null) out.add(a);
        }).catchError((_) {}));
      }
    }
    await Future.wait(pending);
    for (final a in arts.items) {
      if (!have.contains(a.id) && d.matchesLive(a)) out.add(a);
    }
    out.sort((a, b) => feedDate(b).compareTo(feedDate(a)));
    return out;
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.dossier;
    return Scaffold(
      appBar: AppBar(
        title: const Text('ملفات الرواية'),
        actions: [
          IconButton(
            tooltip: 'مشاركة الملف',
            icon: const Icon(Icons.share_outlined),
            onPressed: () => Share.share('${d.title} — ${AppConfig.siteUrl}/files/${d.id}.html'),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: Brand.green,
        onRefresh: () async {
          await DossiersService.instance.list(force: true);
          setState(() => _items = _resolve());
          await _items;
        },
        child: FutureBuilder<List<Object>>(
          future: _items,
          builder: (context, snap) {
            final items = snap.data ?? const <Object>[];
            final rows = <Widget>[
              _Header(dossier: d, count: snap.hasData ? items.length : d.items.length),
              if (d.summary.isNotEmpty) _Know(lines: d.summary),
              if (d.steps.isNotEmpty) _Steps(steps: d.steps),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 6),
                child: Row(children: [
                  Container(width: 4, height: 20, color: Brand.red),
                  const SizedBox(width: 8),
                  const Text('الخط الزمني', style: TextStyle(fontSize: 19, color: Brand.ink)),
                  const Spacer(),
                  const Text('الأحدث أولاً', style: TextStyle(fontSize: 13, color: Brand.green)),
                ]),
              ),
            ];
            if (!snap.hasData) {
              rows.add(const Padding(
                padding: EdgeInsets.all(32),
                child: Center(child: CircularProgressIndicator(color: Brand.green)),
              ));
            } else if (items.isEmpty) {
              rows.add(const Padding(
                padding: EdgeInsets.all(24),
                child: Text('لا مواد في هذا الملف بعد.', style: TextStyle(color: Brand.muted)),
              ));
            } else {
              String day = '';
              for (final o in items) {
                final t = feedDate(o);
                final dn = _dayName(t);
                if (dn != day) {
                  day = dn;
                  rows.add(Padding(
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
                    child: Row(children: [
                      Container(
                          width: 12,
                          height: 12,
                          decoration:
                              BoxDecoration(color: Brand.green, borderRadius: BorderRadius.circular(3))),
                      const SizedBox(width: 8),
                      Text(dn, style: const TextStyle(fontSize: 16, color: Brand.green)),
                    ]),
                  ));
                }
                final id = o is Article ? o.id : (o as VideoItem).id;
                rows.add(_Event(item: o, keyLabel: d.key[id], time: _hhmm(t)));
              }
              if (d.since.isNotEmpty) {
                rows.add(Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                  child: Center(
                    child: Text('بداية الملف: ${_longDate(d.since)}',
                        style: const TextStyle(color: Brand.muted, fontSize: 13)),
                  ),
                ));
              }
            }
            return ListView(padding: const EdgeInsets.only(bottom: 32), children: rows);
          },
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final DossierRef dossier;
  final int count;
  const _Header({required this.dossier, required this.count});
  @override
  Widget build(BuildContext context) {
    final d = dossier;
    final por = d.portals.map((id) => portals.where((p) => p.id == id)).where((x) => x.isNotEmpty).map((x) => x.first);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(d.title, style: const TextStyle(fontSize: 24, height: 1.45, color: Brand.ink)),
        const SizedBox(height: 8),
        Wrap(spacing: 10, runSpacing: 6, crossAxisAlignment: WrapCrossAlignment.center, children: [
          Row(mainAxisSize: MainAxisSize.min, children: [
            Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(color: d.active ? Brand.red : Brand.muted, shape: BoxShape.circle)),
            const SizedBox(width: 5),
            Text(d.active ? 'ملف متواصل' : 'ملف مغلق',
                style: TextStyle(color: d.active ? Brand.red : Brand.muted, fontSize: 13, fontWeight: FontWeight.w600)),
          ]),
          if (d.updated.isNotEmpty)
            Text('آخر تحديث: ${_longDate(d.updated)}', style: const TextStyle(color: Brand.muted, fontSize: 13)),
          Text('$count مادة', style: const TextStyle(color: Brand.muted, fontSize: 13)),
          for (final p in por)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 1),
              decoration: BoxDecoration(color: Brand.green.withValues(alpha: 0.09), borderRadius: BorderRadius.circular(20)),
              child: Text(p.name, style: const TextStyle(color: Brand.green, fontSize: 12.5)),
            ),
        ]),
      ]),
    );
  }
}

class _Know extends StatelessWidget {
  final List<String> lines;
  const _Know({required this.lines});
  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
        padding: const EdgeInsets.fromLTRB(16, 12, 14, 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: const BorderDirectional(start: BorderSide(color: Brand.green, width: 4)),
          boxShadow: const [BoxShadow(color: Color(0x14000000), blurRadius: 6, offset: Offset(0, 1))],
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('ما تحتاج معرفته', style: TextStyle(fontSize: 18, color: Brand.ink)),
          const SizedBox(height: 6),
          for (final l in lines)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Padding(
                  padding: EdgeInsets.only(top: 9),
                  child: CircleAvatar(radius: 3, backgroundColor: Brand.ink),
                ),
                const SizedBox(width: 10),
                Expanded(child: Text(l, style: const TextStyle(fontSize: 15.5, height: 1.75, color: Brand.ink))),
              ]),
            ),
        ]),
      );
}

class _Steps extends StatelessWidget {
  final List<DossierStep> steps;
  const _Steps({required this.steps});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('المحطات الرئيسية', style: TextStyle(fontSize: 16, color: Brand.ink)),
          const SizedBox(height: 6),
          for (final s in steps)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(children: [
                Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    color: s.next ? Colors.transparent : Brand.green,
                    shape: BoxShape.circle,
                    border: s.next ? Border.all(color: Brand.green, width: 2) : null,
                  ),
                ),
                const SizedBox(width: 10),
                SizedBox(
                  width: 82,
                  child: Text(_longDate(s.date, year: false),
                      style: const TextStyle(fontSize: 15, color: Brand.ink, fontWeight: FontWeight.w600)),
                ),
                Expanded(
                  child: Text(s.next ? '${s.text} (قادمة)' : s.text,
                      style: const TextStyle(fontSize: 14, color: Brand.muted)),
                ),
              ]),
            ),
        ]),
      );
}

class _Event extends StatelessWidget {
  final Object item;
  final String? keyLabel;
  final String time;
  const _Event({required this.item, required this.keyLabel, required this.time});
  @override
  Widget build(BuildContext context) {
    final o = item;
    final isKey = keyLabel != null;
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 2, 12, 6),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
          child: Row(children: [
            if (isKey)
              Container(
                margin: const EdgeInsetsDirectional.only(end: 8),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: Brand.red, borderRadius: BorderRadius.circular(4)),
                child: Text('محطة بارزة: $keyLabel', style: const TextStyle(color: Colors.white, fontSize: 12.5)),
              ),
            Text(o is Article ? 'خبر' : 'فيديو',
                style: TextStyle(fontSize: 12.5, color: o is Article ? Brand.green : Brand.red, fontWeight: FontWeight.w600)),
            const SizedBox(width: 8),
            Text(time, style: const TextStyle(fontSize: 12.5, color: Brand.muted)),
          ]),
        ),
        DecoratedBox(
          decoration: isKey
              ? BoxDecoration(border: Border.all(color: Brand.red, width: 1.5), borderRadius: BorderRadius.circular(14))
              : const BoxDecoration(),
          child: o is Article ? (isKey ? ArticleHero(article: o) : ArticleTile(article: o)) : NewsTile(video: o as VideoItem),
        ),
      ]),
    );
  }
}

/// شريط «ملفات الرواية» في الرئيسية: الملفات المتواصلة، كل ملف ببطاقة تفتح صفحته.
class DossiersStrip extends StatelessWidget {
  const DossiersStrip({super.key});
  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: DossiersService.instance,
      builder: (context, _) {
        final live = DossiersService.instance.items.where((d) => d.active).toList();
        if (live.isEmpty) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.fromLTRB(12, 4, 12, 4),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 6, 4, 8),
              child: Row(children: [
                Container(width: 4, height: 20, color: Brand.red),
                const SizedBox(width: 8),
                const Text('ملفات الرواية', style: TextStyle(fontSize: 18, color: Brand.ink)),
              ]),
            ),
            for (final d in live.take(3)) _DossierCard(dossier: d),
          ]),
        );
      },
    );
  }
}

class _DossierCard extends StatelessWidget {
  final DossierRef dossier;
  const _DossierCard({required this.dossier});
  @override
  Widget build(BuildContext context) {
    final d = dossier;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Brand.green.withValues(alpha: 0.25)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => openDossier(context, d),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
          child: Row(children: [
            const Icon(Icons.folder_open_outlined, color: Brand.green, size: 30),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('ملف متواصل  •  ${d.items.length} مادة',
                    style: const TextStyle(fontSize: 12.5, color: Brand.red, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(d.title, style: const TextStyle(fontSize: 17, height: 1.4, color: Brand.ink)),
                if (d.summary.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 3),
                    child: Text(d.summary.first,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13.5, height: 1.6, color: Brand.muted)),
                  ),
              ]),
            ),
            const Icon(Icons.chevron_left, color: Brand.muted),
          ]),
        ),
      ),
    );
  }
}

/// إشارة في صفحة الخبر: «هذا الخبر ضمن ملف …» تفتح الخط الزمني.
class DossierBox extends StatelessWidget {
  final Article article;
  const DossierBox({super.key, required this.article});
  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: DossiersService.instance,
      builder: (context, _) {
        final d = DossiersService.instance.of(article);
        if (d == null) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.only(top: 18),
          child: Material(
            color: Brand.green.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(8),
            child: InkWell(
              borderRadius: BorderRadius.circular(8),
              onTap: () => openDossier(context, d),
              child: Container(
                padding: const EdgeInsets.fromLTRB(14, 10, 10, 10),
                decoration: const BoxDecoration(
                  border: BorderDirectional(start: BorderSide(color: Brand.green, width: 4)),
                ),
                child: Row(children: [
                  Expanded(
                    child: Text.rich(TextSpan(children: [
                      const TextSpan(text: 'هذا الخبر ضمن ملف: ', style: TextStyle(color: Brand.muted, fontSize: 14)),
                      TextSpan(text: d.title, style: const TextStyle(color: Brand.ink, fontSize: 16)),
                    ])),
                  ),
                  const SizedBox(width: 8),
                  const Text('الخط الزمني', style: TextStyle(color: Brand.green, fontSize: 13)),
                  const Icon(Icons.chevron_left, color: Brand.green, size: 20),
                ]),
              ),
            ),
          ),
        );
      },
    );
  }
}
