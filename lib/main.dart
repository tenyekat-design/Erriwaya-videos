import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:url_launcher/url_launcher.dart';

import 'config.dart';
import 'models.dart';
import 'screens/home_screen.dart';
import 'screens/platforms_screen.dart';
import 'screens/saved_screen.dart';
import 'screens/videos_screen.dart';
import 'services/articles_service.dart';
import 'services/firebase_boot.dart';
import 'services/push_service.dart';
import 'services/saved_service.dart';
import 'services/videos_controller.dart';
import 'theme.dart';
import 'widgets/article_card.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));
  await SavedService.instance.load();
  await FirebaseBoot.init();
  runApp(const ErriwayaApp());
  // الشبكة والإشعارات بعد ظهور الواجهة حتى لا يتأخر فتح التطبيق.
  unawaited(VideosController.instance.start());
  unawaited(ArticlesService.instance.start());
  unawaited(PushService.init());
}

class ErriwayaApp extends StatelessWidget {
  const ErriwayaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: const Shell(),
    );
  }
}

class Shell extends StatefulWidget {
  const Shell({super.key});
  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int _index = 0;
  final _visited = <int>{0};
  static const _screens = [HomeScreen(), VideosScreen(), PlatformsScreen(), SavedScreen()];
  StreamSubscription<BreakingNews>? _sub;

  @override
  void initState() {
    super.initState();
    _sub = PushService.opened.stream.listen((b) async {
      if (b.articleId != null && b.articleId!.isNotEmpty) {
        final a = await ArticlesService.instance.byId(b.articleId!);
        if (a != null && mounted) openArticle(context, a);
      } else if (b.url != null && b.url!.isNotEmpty) {
        launchUrl(Uri.parse(b.url!), mode: LaunchMode.externalApplication);
      } else {
        setState(() => _index = 0);
      }
    });
    PushService.latest.addListener(_onBreaking);
  }

  BreakingNews? _shown;
  void _onBreaking() {
    final b = PushService.latest.value;
    if (b == null || identical(b, _shown) || !mounted) return;
    // لا نعيد عرض خبر قديم محفوظ عند فتح التطبيق.
    if (DateTime.now().difference(b.time).inMinutes > 2) {
      _shown = b;
      return;
    }
    _shown = b;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      backgroundColor: Brand.red,
      behavior: SnackBarBehavior.floating,
      duration: const Duration(seconds: 6),
      content: Text('عاجل: ${b.title}${b.body.isEmpty ? '' : ' – ${b.body}'}',
          style: const TextStyle(fontFamily: Brand.font, fontSize: 15)),
    ));
  }

  @override
  void dispose() {
    _sub?.cancel();
    PushService.latest.removeListener(_onBreaking);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // كل شاشة تُبنى عند أول زيارة لها فقط (لا تُحمَّل صفحات فيسبوك وتيك توك عند فتح التطبيق).
      body: IndexedStack(index: _index, children: [
        for (var i = 0; i < 4; i++)
          _visited.contains(i) ? _screens[i] : const SizedBox.shrink(),
      ]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() {
          _index = i;
          _visited.add(i);
        }),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.newspaper_outlined),
              selectedIcon: Icon(Icons.newspaper, color: Brand.green),
              label: 'الأخبار'),
          NavigationDestination(
              icon: Icon(Icons.play_circle_outline),
              selectedIcon: Icon(Icons.play_circle, color: Brand.green),
              label: 'فيديوهات'),
          NavigationDestination(
              icon: Icon(Icons.public_outlined),
              selectedIcon: Icon(Icons.public, color: Brand.green),
              label: 'المنصات'),
          NavigationDestination(
              icon: Icon(Icons.bookmark_border),
              selectedIcon: Icon(Icons.bookmark, color: Brand.green),
              label: 'المحفوظات'),
        ],
      ),
    );
  }
}
