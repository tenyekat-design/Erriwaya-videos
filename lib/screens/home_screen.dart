import 'package:flutter/material.dart';
import '../data.dart';
import '../settings.dart';
import '../theme.dart';
import '../widgets.dart';
import 'reader_screen.dart';
import 'search_screen.dart';
import 'settings_sheet.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  static void openPage(BuildContext context, int page, {Ayah? focus}) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => ReaderScreen(initialPage: page, focus: focus)));
  }

  @override
  Widget build(BuildContext context) {
    final s = Settings.instance;
    return ListenableBuilder(
      listenable: s,
      builder: (context, _) {
        final r = s.riwaya;
        return DefaultTabController(
          length: 3,
          child: Scaffold(
            appBar: AppBar(
              title: const Text('مصحف المحظرة'),
              leading: IconButton(
                tooltip: 'الإعدادات',
                icon: const Icon(Icons.tune),
                onPressed: () => showSettingsSheet(context),
              ),
              actions: [
                IconButton(
                  tooltip: 'بحث',
                  icon: const Icon(Icons.search),
                  onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SearchScreen())),
                ),
              ],
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(118),
                child: Column(children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                    child: RiwayaSwitch(value: r, onChanged: s.setRiwaya),
                  ),
                  const TabBar(tabs: [Tab(text: 'السور'), Tab(text: 'الأجزاء'), Tab(text: 'العلامات')]),
                ]),
              ),
            ),
            body: Column(children: [
              _ContinueCard(riwaya: r, page: s.lastPage[r] ?? 1),
              Expanded(
                child: TabBarView(children: [
                  _SurahList(riwaya: r),
                  _JuzList(riwaya: r),
                  _Bookmarks(riwaya: r),
                ]),
              ),
            ]),
          ),
        );
      },
    );
  }
}

/// متابعة القراءة من آخر صفحة فُتحت في الرواية المختارة.
class _ContinueCard extends StatelessWidget {
  const _ContinueCard({required this.riwaya, required this.page});
  final Riwaya riwaya;
  final int page;

  @override
  Widget build(BuildContext context) {
    final q = Quran.instance;
    final first = q.byPage[riwaya]![page - 1].firstOrNull;
    final name = first == null ? '' : q.surah(first.surah).name;
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
      child: Material(
        color: scheme.surface,
        elevation: 1,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => HomeScreen.openPage(context, page),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 12, 12),
            child: Row(children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(color: Brand.green, borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.menu_book_rounded, color: Colors.white),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('متابعة القراءة', style: TextStyle(fontSize: 13, color: scheme.onSurfaceVariant)),
                  Text('سورة $name · الصفحة ${ar(page)}', style: const TextStyle(fontSize: 18)),
                ]),
              ),
              Text(riwaya.short, style: TextStyle(color: scheme.primary, fontSize: 15)),
              const SizedBox(width: 4),
              Icon(Icons.chevron_left, color: scheme.primary),
            ]),
          ),
        ),
      ),
    );
  }
}

class _SurahList extends StatelessWidget {
  const _SurahList({required this.riwaya});
  final Riwaya riwaya;

  @override
  Widget build(BuildContext context) {
    final q = Quran.instance;
    final scheme = Theme.of(context).colorScheme;
    return ListView.separated(
      padding: const EdgeInsets.only(bottom: 24),
      itemCount: 114,
      separatorBuilder: (_, __) => Divider(height: 1, indent: 76, color: scheme.outlineVariant.withValues(alpha: .5)),
      itemBuilder: (context, i) {
        final s = q.surahs[i];
        return ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
          leading: NumberBadge(s.n),
          title: Text(s.name, style: TextStyle(fontFamily: riwaya.font, fontSize: 23, height: 1.6)),
          subtitle: Text('${s.makki ? 'مكية' : 'مدنية'} · ${ar(s.count(riwaya))} آية',
              style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 14)),
          trailing: Text('ص ${ar(s.page(riwaya))}', style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 14)),
          onTap: () => HomeScreen.openPage(context, s.page(riwaya)),
        );
      },
    );
  }
}

class _JuzList extends StatelessWidget {
  const _JuzList({required this.riwaya});
  final Riwaya riwaya;

  @override
  Widget build(BuildContext context) {
    final q = Quran.instance;
    final scheme = Theme.of(context).colorScheme;
    final list = q.juz[riwaya]!;
    return ListView.separated(
      padding: const EdgeInsets.only(bottom: 24),
      itemCount: list.length,
      separatorBuilder: (_, __) => Divider(height: 1, indent: 76, color: scheme.outlineVariant.withValues(alpha: .5)),
      itemBuilder: (context, i) {
        final j = list[i];
        final a = q.ayat[riwaya]!.firstWhere((x) => x.surah == j.surah && x.number == j.ayah);
        return ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          leading: NumberBadge(j.juz),
          title: Text('الجزء ${juzName(j.juz)}', style: const TextStyle(fontSize: 18)),
          subtitle: Text('${q.surah(j.surah).name} · آية ${ar(j.ayah)}',
              style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 14)),
          trailing: Text('ص ${ar(j.page)}', style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 14)),
          onTap: () => HomeScreen.openPage(context, j.page, focus: a),
        );
      },
    );
  }
}

class _Bookmarks extends StatelessWidget {
  const _Bookmarks({required this.riwaya});
  final Riwaya riwaya;

  @override
  Widget build(BuildContext context) {
    final s = Settings.instance;
    final q = Quran.instance;
    final scheme = Theme.of(context).colorScheme;
    if (s.bookmarks.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.bookmark_border, size: 48, color: scheme.primary),
            const SizedBox(height: 12),
            const Text('لا علامات بعد', style: TextStyle(fontSize: 19)),
            const SizedBox(height: 6),
            Text('اضغط على أي آية أثناء القراءة، ثم اختر «علامة» لتعود إليها من هنا.',
                textAlign: TextAlign.center, style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 15)),
          ]),
        ),
      );
    }
    return ListView(
      padding: const EdgeInsets.only(bottom: 24),
      children: [
        for (final b in s.bookmarks)
          () {
            final a = q.locate(riwaya, b.surah, b.ayah);
            return ListTile(
              leading: Icon(Icons.bookmark, color: scheme.primary),
              title: Text('سورة ${q.surah(b.surah).name} · آية ${ar(riwaya == Riwaya.hafs ? b.ayah : a.number)}',
                  style: const TextStyle(fontSize: 17)),
              subtitle: Text(a.shown, maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontFamily: riwaya.font, fontSize: 18, color: scheme.onSurfaceVariant)),
              trailing: IconButton(
                tooltip: 'حذف العلامة',
                icon: const Icon(Icons.close),
                onPressed: () => s.toggleBookmark(b.surah, b.ayah),
              ),
              onTap: () => HomeScreen.openPage(context, a.page, focus: a),
            );
          }(),
      ],
    );
  }
}

const _juzNames = [
  'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
  'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر', 'السادس عشر', 'السابع عشر',
  'الثامن عشر', 'التاسع عشر', 'العشرون', 'الحادي والعشرون', 'الثاني والعشرون', 'الثالث والعشرون',
  'الرابع والعشرون', 'الخامس والعشرون', 'السادس والعشرون', 'السابع والعشرون', 'الثامن والعشرون',
  'التاسع والعشرون', 'الثلاثون',
];
String juzName(int n) => _juzNames[n - 1];
