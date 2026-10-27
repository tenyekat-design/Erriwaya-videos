import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

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
            EmbedView(
              url: 'https://www.facebook.com/plugins/page.php?href='
                  '${Uri.encodeComponent(AppConfig.facebookUrl)}'
                  '&tabs=timeline&width=500&height=3000&small_header=true'
                  '&adapt_container_width=true&hide_cover=false&show_facepile=false&locale=ar_AR',
              externalUrl: AppConfig.facebookUrl,
              externalLabel: 'فتح الصفحة في فيسبوك',
            ),
            EmbedView(
              html: '''
<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{margin:0;padding:8px;background:#fff;display:flex;justify-content:center}</style></head><body>
<blockquote class="tiktok-embed" cite="${AppConfig.tiktokUrl}" data-unique-id="${AppConfig.tiktokUser}"
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
          if (mounted) setState(() => _loading = false);
        },
        onWebResourceError: (e) {
          if (e.isForMainFrame == true && mounted) setState(() => _failed = true);
        },
        onNavigationRequest: (req) {
          // أي رابط يضغطه القارئ يُفتح في التطبيق الأصلي (فيسبوك/تيك توك/المتصفح).
          final first = widget.url;
          final isStart = req.url == first || req.url.startsWith('https://erriwaya.mr') ||
              req.url == 'about:blank';
          if (req.isMainFrame && !isStart) {
            launchUrl(Uri.parse(req.url), mode: LaunchMode.externalApplication);
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
      ));
    _load();
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
