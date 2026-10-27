import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import '../config.dart';
import '../theme.dart';

/// محتوى صفحات التواصل: فيسبوك وتيك توك داخل التطبيق، وروابط كل الحسابات.
class PlatformsScreen extends StatelessWidget {
  const PlatformsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('منصات الرواية'),
          bottom: const TabBar(
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white70,
            indicatorColor: Colors.white,
            labelStyle: TextStyle(fontFamily: Brand.font, fontSize: 15),
            tabs: [Tab(text: 'فيسبوك'), Tab(text: 'تيك توك'), Tab(text: 'تابعنا')],
          ),
        ),
        body: TabBarView(
          physics: const NeverScrollableScrollPhysics(),
          children: [
            const _FacebookCard(),
            EmbedView(
              html: '''
<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{margin:0;padding:8px;background:#fff;display:flex;justify-content:center}</style></head><body>
<blockquote class="tiktok-embed" cite="${AppConfig.tiktokUrl}" data-unique-id="${AppConfig.tiktokUser.toLowerCase()}"
 data-embed-type="creator" style="max-width:780px;min-width:288px;">
<section><a target="_blank" href="${AppConfig.tiktokUrl}">@${AppConfig.tiktokUser}</a></section></blockquote>
<script async src="https://www.tiktok.com/embed.js"></script>
</body></html>''',
              externalUrl: AppConfig.tiktokUrl,
              externalLabel: 'فتح الحساب في تيك توك',
            ),
            const _FollowUs(),
          ],
        ),
      ),
    );
  }
}

/// إضافة صفحة فيسبوك الرسمية (Page Plugin) داخل إطار، بعرض الشاشة.
String _facebookHtml(Size size) {
  final w = size.width.clamp(180, 500).round();
  final h = (size.height * 3).clamp(1200, 4000).round();
  final src = 'https://www.facebook.com/plugins/page.php?href='
      '${Uri.encodeComponent(AppConfig.facebookUrl)}'
      '&tabs=timeline&width=$w&height=$h&small_header=true'
      '&adapt_container_width=true&hide_cover=false&show_facepile=false&locale=ar_AR';
  return '''
<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;padding:0;background:#fff}iframe{display:block;margin:0 auto;border:none;overflow:hidden}</style>
</head><body>
<iframe src="$src" width="$w" height="$h" scrolling="no" frameborder="0" allowfullscreen="true"
 allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
</body></html>''';
}

class EmbedView extends StatefulWidget {
  final String? url;
  final String? html;
  final String externalUrl;
  final String externalLabel;
  const EmbedView({
    super.key,
    this.url,
    this.html,
    required this.externalUrl,
    required this.externalLabel,
  });
  @override
  State<EmbedView> createState() => _EmbedViewState();
}

class _EmbedViewState extends State<EmbedView> with AutomaticKeepAliveClientMixin {
  late final WebViewController _web;
  bool _loading = true;
  bool _failed = false;
  DateTime? _loadedAt;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _web = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (_) {
          _loadedAt ??= DateTime.now();
          if (mounted) setState(() => _loading = false);
        },
        onWebResourceError: (e) {
          if (e.isForMainFrame == true && mounted) setState(() => _failed = true);
        },
        onNavigationRequest: (req) {
          if (!req.isMainFrame) return NavigationDecision.navigate;
          final u = req.url;
          final isStart = u == widget.url || u.startsWith('https://erriwaya.mr') || u == 'about:blank';
          if (isStart) return NavigationDecision.navigate;
          // تحويلات تلقائية (تسجيل دخول وما شابه) تُمنع بصمت حتى لا يقفز القارئ خارج التطبيق.
          final auto = _loadedAt == null ||
              DateTime.now().difference(_loadedAt!) < const Duration(seconds: 3) ||
              RegExp(r'/login|/checkpoint|/plugins/|/embed|consent|/sharer').hasMatch(u);
          if (!auto) {
            // ضغطة من القارئ على منشور أو فيديو: تُفتح في تطبيق المنصة.
            launchUrl(Uri.parse(u), mode: LaunchMode.externalApplication);
          }
          return NavigationDecision.prevent;
        },
      ));
    _enableCookies();
    _load();
  }

  /// فيسبوك يحتاج ملفات تعريف الارتباط داخل الإطار لعرض المنشورات.
  void _enableCookies() {
    try {
      final platform = _web.platform;
      final cookies = WebViewCookieManager().platform;
      if (platform is AndroidWebViewController && cookies is AndroidWebViewCookieManager) {
        cookies.setAcceptThirdPartyCookies(platform, true);
        platform.setMediaPlaybackRequiresUserGesture(false);
      }
    } catch (_) {}
  }

  void _load() {
    setState(() {
      _loading = true;
      _failed = false;
    });
    if (widget.url != null) {
      _web.loadRequest(Uri.parse(widget.url!));
    } else {
      _web.loadHtmlString(widget.html!, baseUrl: 'https://erriwaya.mr/');
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Column(children: [
      Expanded(
        child: Stack(children: [
          if (!_failed) WebViewWidget(controller: _web),
          if (_failed)
            Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.wifi_off_rounded, size: 48, color: Brand.muted),
                const SizedBox(height: 12),
                const Text('تعذر التحميل', style: TextStyle(color: Brand.muted)),
                const SizedBox(height: 12),
                FilledButton(onPressed: _load, child: const Text('إعادة المحاولة')),
              ]),
            ),
          if (_loading && !_failed)
            const LinearProgressIndicator(color: Brand.green, minHeight: 3),
        ]),
      ),
      SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => launchUrl(Uri.parse(widget.externalUrl),
                  mode: LaunchMode.externalApplication),
              icon: const Icon(Icons.open_in_new),
              label: Text(widget.externalLabel),
            ),
          ),
        ),
      ),
    ]);
  }
}

/// فيسبوك لم يعد يعرض منشورات الصفحات داخل التطبيقات بدون تطبيق مطوّر من Meta،
/// فنعرض بطاقة الصفحة مع زر فتحها.
class _FacebookCard extends StatelessWidget {
  const _FacebookCard();

  @override
  Widget build(BuildContext context) {
    void open() => launchUrl(Uri.parse(AppConfig.facebookUrl), mode: LaunchMode.externalApplication);
    return ListView(padding: const EdgeInsets.all(16), children: [
      Card(
        clipBehavior: Clip.antiAlias,
        child: Column(children: [
          Container(
            height: 120,
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: [Brand.greenLight, Brand.greenDark]),
            ),
            alignment: Alignment.center,
            child: Image.asset('assets/images/logo_white.png', height: 84),
          ),
          const SizedBox(height: 14),
          const Text('الرواية', style: TextStyle(fontSize: 22, color: Brand.ink)),
          const SizedBox(height: 4),
          const Text('الصفحة الرسمية على فيسبوك',
              style: TextStyle(fontSize: 14, color: Brand.muted)),
          const SizedBox(height: 4),
          const Text('facebook.com/ERRIWAYA',
              textDirection: TextDirection.ltr,
              style: TextStyle(fontFamily: 'sans-serif', fontSize: 13, color: Brand.muted)),
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF1877F2),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: open,
                icon: const Icon(Icons.facebook),
                label: const Text('افتح الصفحة وتابعها', style: TextStyle(fontSize: 16)),
              ),
            ),
          ),
        ]),
      ),
      const SizedBox(height: 14),
      const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Row(children: [
            Icon(Icons.info_outline, color: Brand.green),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'كل تقارير الرواية وموجزاتها تجدها أيضاً في تبويبي «الأخبار» و«فيديوهات» داخل التطبيق.',
                style: TextStyle(fontSize: 14, height: 1.6, color: Brand.ink),
              ),
            ),
          ]),
        ),
      ),
    ]);
  }
}

class _FollowUs extends StatelessWidget {
  const _FollowUs();

  @override
  Widget build(BuildContext context) {
    final items = [
      ('فيسبوك', 'ERRIWAYA', Icons.facebook, const Color(0xFF1877F2), AppConfig.facebookUrl),
      ('يوتيوب', 'ERRIWAYA', Icons.smart_display, const Color(0xFFFF0000), AppConfig.youtubeUrl),
      ('تيك توك', 'ERRIWAYA', Icons.music_note, Colors.black, AppConfig.tiktokUrl),
      ('إنستغرام', 'ERRIWAYA.MR', Icons.camera_alt_outlined, const Color(0xFFC13584),
          AppConfig.instagramUrl),
    ];
    return ListView(padding: const EdgeInsets.all(16), children: [
      Container(
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(color: Brand.green, borderRadius: BorderRadius.circular(16)),
        child: Column(children: [
          Image.asset('assets/images/logo_white.png', height: 90),
          const SizedBox(height: 10),
          const Text('تابعوا الرواية على كل المنصات',
              style: TextStyle(color: Colors.white, fontSize: 16)),
        ]),
      ),
      const SizedBox(height: 14),
      for (final it in items)
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Card(
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              leading: CircleAvatar(
                backgroundColor: it.$4,
                child: Icon(it.$3, color: Colors.white),
              ),
              title: Text(it.$1, style: const TextStyle(fontSize: 16)),
              subtitle: Text(it.$2,
                  textDirection: TextDirection.ltr,
                  textAlign: TextAlign.right,
                  style: const TextStyle(fontFamily: 'sans-serif', color: Brand.muted)),
              trailing: const Icon(Icons.chevron_left),
              onTap: () => launchUrl(Uri.parse(it.$5), mode: LaunchMode.externalApplication),
            ),
          ),
        ),
    ]);
  }
}
