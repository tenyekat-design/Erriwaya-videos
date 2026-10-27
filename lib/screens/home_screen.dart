import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../models.dart';
import '../services/push_service.dart';
import '../services/videos_controller.dart';
import '../theme.dart';
import '../widgets/states.dart';
import '../widgets/video_card.dart';
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
      listenable: _ctrl,
      builder: (context, _) {
        final all = _ctrl.items.where((v) => !v.isShort).toList();
        final list = _cat == 'الكل' ? all : all.where((v) => v.categories.contains(_cat)).toList();
        return RefreshIndicator(
          color: Brand.green,
          onRefresh: _ctrl.refresh,
          child: CustomScrollView(slivers: [
            SliverAppBar(
              pinned: true,
              expandedHeight: 150,
              backgroundColor: Brand.green,
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
                    if (i == 0) return HeroCard(video: list.first);
                    if (i == 1) return const _SectionTitle('آخر الأخبار');
                    return NewsTile(video: list[i - 1]);
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

class _BreakingBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<BreakingNews?>(
      valueListenable: PushService.latest,
      builder: (context, b, _) {
        if (b == null || !b.isFresh) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
          child: Material(
            color: Brand.red,
            borderRadius: BorderRadius.circular(12),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: b.url == null
                  ? null
                  : () => launchUrl(Uri.parse(b.url!), mode: LaunchMode.externalApplication),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                        color: Colors.white, borderRadius: BorderRadius.circular(6)),
                    child: const Text('عاجل', style: TextStyle(color: Brand.red, fontSize: 14)),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      b.body.isEmpty ? b.title : '${b.title}: ${b.body}',
                      style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.4),
                    ),
                  ),
                ]),
              ),
            ),
          ),
        );
      },
    );
  }
}
