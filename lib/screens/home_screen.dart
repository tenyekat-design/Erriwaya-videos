import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../models.dart';
import '../services/articles_service.dart';
import '../services/push_service.dart';
import '../services/videos_controller.dart';
import '../theme.dart';
import '../widgets/article_card.dart';
import '../widgets/states.dart';
import '../widgets/video_card.dart';
import 'about_screen.dart';
import 'settings_sheet.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _cat = 'الكل';
  final _ctrl = VideosController.instance;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Listenable.merge([_ctrl, ArticlesService.instance, minuteTick]),
      builder: (context, _) {
        // الأخبار المكتوبة وفيديوهات يوتيوب في خلاصة واحدة مرتبة بالتاريخ.
        final all = <Object>[
          ...ArticlesService.instance.items,
          ..._ctrl.items.where((v) => !v.isShort),
        ]..sort((a, b) => feedDate(b).compareTo(feedDate(a)));
        final list =
            _cat == 'الكل' ? all : all.where((o) => feedCategories(o).contains(_cat)).toList();
        return RefreshIndicator(
          color: Brand.green,
          onRefresh: _ctrl.refresh,
          child: CustomScrollView(slivers: [
            SliverAppBar(
              pinned: true,
              expandedHeight: 150,
              backgroundColor: Brand.green,
              leading: IconButton(
                icon: const Icon(Icons.info_outline, color: Colors.white),
                tooltip: 'عن الرواية',
                onPressed: () => Navigator.of(context)
                    .push(MaterialPageRoute(builder: (_) => const AboutScreen())),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.settings_outlined, color: Colors.white),
                  tooltip: 'الإعدادات',
                  onPressed: () => showSettingsSheet(context),
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                centerTitle: true,
                titlePadding: const EdgeInsets.only(bottom: 10),
                title: Image.asset('assets/images/logo_white.png', height: 44),
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Brand.greenLight, Brand.green, Brand.greenDark],
                    ),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(child: _BreakingBanner()),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 56,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  children: ['الكل', ...AppConfig.categories.keys].map((c) {
                    final sel = c == _cat;
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: ChoiceChip(
                        label: Text(c),
                        selected: sel,
                        showCheckmark: false,
                        selectedColor: Brand.green,
                        backgroundColor: Colors.white,
                        labelStyle: TextStyle(
                            fontFamily: Brand.font, color: sel ? Colors.white : Brand.ink),
                        onSelected: (_) => setState(() => _cat = c),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            if (_ctrl.error != null && all.isNotEmpty)
              SliverToBoxAdapter(child: OfflineNote(message: _ctrl.error!)),
            if (all.isEmpty && _ctrl.loading)
              const SliverFillRemaining(child: LoadingState())
            else if (all.isEmpty)
              SliverFillRemaining(
                child: ErrorState(
                  message: _ctrl.error ?? 'لا توجد أخبار بعد.',
                  onRetry: _ctrl.refresh,
                ),
              )
            else if (list.isEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: EmptyState(icon: Icons.filter_alt_off_outlined, text: 'لا توجد مواد في هذا التصنيف حالياً.'),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 24),
                sliver: SliverList.separated(
                  itemCount: list.length + 1,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    if (i == 1) return const _SectionTitle('آخر الأخبار');
                    final o = list[i == 0 ? 0 : i - 1];
                    if (i == 0) {
                      return o is Article ? ArticleHero(article: o) : HeroCard(video: o as VideoItem);
                    }
                    return o is Article ? ArticleTile(article: o) : NewsTile(video: o as VideoItem);
                  },
                ),
              ),
          ]),
        );
      },
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 8),
        child: Row(children: [
          Container(width: 4, height: 20, color: Brand.red),
          const SizedBox(width: 8),
          Text(text, style: const TextStyle(fontSize: 18, color: Brand.ink)),
        ]),
      );
}

/// شريط «عاجل»: كل الأخبار العاجلة السارية (نصف ساعة) تتجول فيه، الأحدث أولاً، حتى يُقرأ كل عنوان كاملاً.
class _BreakingBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Listenable.merge([ArticlesService.instance, PushService.latest, minuteTick]),
      builder: (context, _) {
        final arts = ArticlesService.instance.items.where((a) => a.isFreshBreaking).toList()
          ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
        final items = <_BrItem>[
          for (final a in arts) _BrItem(a.title, () => openArticle(context, a)),
        ];
        final b = PushService.latest.value;
        if (b != null && b.isFresh && !arts.any((a) => a.id == b.articleId || a.title == b.body)) {
          final t = b.body.isEmpty ? b.title : (b.title == 'عاجل' ? b.body : '${b.title}: ${b.body}');
          items.add(_BrItem(
              t,
              b.url == null
                  ? null
                  : () => launchUrl(Uri.parse(b.url!), mode: LaunchMode.externalApplication)));
        }
        if (items.isEmpty) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
          child: Material(
            color: Brand.red,
            borderRadius: BorderRadius.circular(12),
            clipBehavior: Clip.antiAlias,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
              child: Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration:
                      BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(6)),
                  child: const Text('عاجل', style: TextStyle(color: Brand.red, fontSize: 14)),
                ),
                const SizedBox(width: 8),
                Expanded(child: _BreakingMarquee(items: items)),
              ]),
            ),
          ),
        );
      },
    );
  }
}

class _BrItem {
  final String title;
  final VoidCallback? onTap;
  const _BrItem(this.title, this.onTap);
}

/// يمرّر العناوين بلا توقف (من اليسار إلى اليمين كما تُقرأ العربية)، ويتوقف ما دام الإصبع على الشريط.
class _BreakingMarquee extends StatefulWidget {
  final List<_BrItem> items;
  const _BreakingMarquee({required this.items});
  @override
  State<_BreakingMarquee> createState() => _BreakingMarqueeState();
}

class _BreakingMarqueeState extends State<_BreakingMarquee> with SingleTickerProviderStateMixin {
  static const _speed = 45.0; // بكسل في الثانية
  final _sc = ScrollController();
  late final _ticker = createTicker(_tick);
  Duration _last = Duration.zero;
  bool _held = false;

  @override
  void initState() {
    super.initState();
    if (!WidgetsBinding.instance.platformDispatcher.accessibilityFeatures.disableAnimations) {
      _ticker.start();
    }
  }

  void _tick(Duration t) {
    final dt = (t - _last).inMicroseconds / 1e6;
    _last = t;
    if (_held || !_sc.hasClients || dt <= 0 || dt > 0.5) return;
    _sc.jumpTo(_sc.offset + _speed * dt);
  }

  @override
  void dispose() {
    _ticker.dispose();
    _sc.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.items;
    return SizedBox(
      height: 26,
      child: Listener(
        onPointerDown: (_) => _held = true,
        onPointerUp: (_) => _held = false,
        onPointerCancel: (_) => _held = false,
        child: ShaderMask(
          shaderCallback: (r) => const LinearGradient(
            colors: [Colors.transparent, Colors.white, Colors.white, Colors.transparent],
            stops: [0, .06, .94, 1],
          ).createShader(r),
          blendMode: BlendMode.dstIn,
          child: ListView.builder(
            controller: _sc,
            scrollDirection: Axis.horizontal,
            physics: const NeverScrollableScrollPhysics(),
            itemBuilder: (context, i) {
              final it = items[i % items.length];
              return InkWell(
                onTap: it.onTap,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(color: Colors.white70, shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 10),
                    Text(it.title,
                        maxLines: 1,
                        softWrap: false,
                        style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.3)),
                  ]),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
