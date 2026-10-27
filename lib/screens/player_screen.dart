import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../models.dart';
import '../services/saved_service.dart';
import '../theme.dart';

class PlayerScreen extends StatefulWidget {
  final VideoItem video;
  const PlayerScreen({super.key, required this.video});
  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  late final WebViewController _web;

  @override
  void initState() {
    super.initState();
    final id = widget.video.id;
    // تضمين يوتيوب مع مصدر (origin) صريح حتى يقبل التشغيل داخل التطبيق.
    final html = '''
<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%}</style>
</head><body>
<iframe src="https://www.youtube-nocookie.com/embed/$id?playsinline=1&rel=0&modestbranding=1&autoplay=1&origin=https://erriwaya.mr"
 allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen
 referrerpolicy="strict-origin-when-cross-origin"></iframe>
</body></html>''';
    _web = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (req) {
          if (req.isMainFrame && !req.url.startsWith('https://erriwaya.mr') && req.url != 'about:blank') {
            launchUrl(Uri.parse(req.url), mode: LaunchMode.externalApplication);
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
      ))
      ..loadHtmlString(html, baseUrl: 'https://erriwaya.mr/');
  }

  @override
  Widget build(BuildContext context) {
    final v = widget.video;
    return Scaffold(
      appBar: AppBar(title: const Text('مشاهدة')),
      body: ListView(children: [
        AspectRatio(
          aspectRatio: v.isShort ? 9 / 12 : 16 / 9,
          child: WebViewWidget(controller: _web),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(v.displayTitle, style: const TextStyle(fontSize: 20, height: 1.5, color: Brand.ink)),
            const SizedBox(height: 6),
            Text(
              [if (v.hasDate) timeAgo(v.published), if (v.views > 0) '${v.views} مشاهدة'].join('  •  '),
              style: const TextStyle(color: Brand.muted, fontSize: 13),
            ),
            const SizedBox(height: 14),
            ListenableBuilder(
              listenable: SavedService.instance,
              builder: (context, _) {
                final saved = SavedService.instance.isSaved(v.id);
                return Wrap(spacing: 8, runSpacing: 8, children: [
                  FilledButton.icon(
                    onPressed: () => SavedService.instance.toggle(v),
                    icon: Icon(saved ? Icons.bookmark : Icons.bookmark_border),
                    label: Text(saved ? 'محفوظ' : 'حفظ'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => SavedService.share(v),
                    icon: const Icon(Icons.share_outlined),
                    label: const Text('مشاركة'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () =>
                        launchUrl(Uri.parse(v.url), mode: LaunchMode.externalApplication),
                    icon: const Icon(Icons.open_in_new),
                    label: const Text('فتح في يوتيوب'),
                  ),
                ]);
              },
            ),
            if (v.description.isNotEmpty) ...[
              const SizedBox(height: 18),
              Text(v.description,
                  style: const TextStyle(fontSize: 15, height: 1.7, color: Brand.ink)),
            ],
          ]),
        ),
      ]),
    );
  }
}
