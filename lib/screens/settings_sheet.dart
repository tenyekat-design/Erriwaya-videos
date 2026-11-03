import 'package:flutter/material.dart';

import '../services/firebase_boot.dart';
import '../services/push_service.dart';
import 'about_screen.dart';
import 'admin/login_screen.dart';
import '../theme.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config.dart';

void _open(String url) => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);

Future<void> showSettingsSheet(BuildContext context) async {
  final enabled = await PushService.isEnabled();
  if (!context.mounted) return;
  await showModalBottomSheet(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (_) => _Settings(initial: enabled),
  );
}

class _Settings extends StatefulWidget {
  final bool initial;
  const _Settings({required this.initial});
  @override
  State<_Settings> createState() => _SettingsState();
}

class _SettingsState extends State<_Settings> {
  late bool _on = widget.initial;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
          SwitchListTile(
            value: _on && PushService.available,
            activeTrackColor: Brand.green,
            title: const Text('إشعارات الأخبار العاجلة'),
            subtitle: Text(PushService.available
                ? 'تصلك فور نشر خبر عاجل'
                : 'ستتوفر قريباً'),
            onChanged: PushService.available
                ? (v) {
                    setState(() => _on = v);
                    PushService.setEnabled(v);
                  }
                : null,
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.info_outline, color: Brand.green),
            title: const Text('عن الرواية'),
            onTap: () {
              final nav = Navigator.of(context);
              nav.pop();
              nav.push(MaterialPageRoute(builder: (_) => const AboutScreen()));
            },
          ),
          ListTile(
            leading: const Icon(Icons.mail_outline, color: Brand.green),
            title: const Text('اتصل بنا'),
            onTap: () {
              final nav = Navigator.of(context);
              nav.pop();
              nav.push(MaterialPageRoute(builder: (_) => const ContactScreen()));
            },
          ),
          ListTile(
            leading: const Icon(Icons.language, color: Brand.green),
            title: const Text('موقع الرواية'),
            subtitle: const Text('erriwaya.com', textDirection: TextDirection.ltr, textAlign: TextAlign.right),
            onTap: () => _open(AppConfig.siteUrl),
          ),
          ExpansionTile(
            leading: const Icon(Icons.policy_outlined, color: Brand.green),
            title: const Text('سياسات الشبكة'),
            shape: const Border(),
            children: [
              for (final (t, p) in const [
                ('السياسة التحريرية', 'editorial-policy.html'),
                ('سياسة التصحيحات', 'corrections.html'),
                ('سياسة الخصوصية', 'privacy.html'),
              ])
                ListTile(
                  contentPadding: const EdgeInsetsDirectional.only(start: 56, end: 16),
                  title: Text(t),
                  trailing: const Icon(Icons.open_in_new, size: 18),
                  onTap: () => _open('${AppConfig.siteUrl}/$p'),
                ),
            ],
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.edit_note, color: Brand.green),
            title: const Text('دخول المحرر'),
            subtitle: Text(FirebaseBoot.ready ? 'نشر الأخبار والعاجل' : 'يتطلب إعداد Firebase'),
            enabled: FirebaseBoot.ready,
            onTap: () {
              final nav = Navigator.of(context);
              nav.pop();
              nav.push(editorRoute());
            },
          ),
          const Divider(),
          ListTile(
            leading: Image.asset('assets/images/logo_white.png', height: 32, color: Brand.green),
            title: const Text('الرواية'),
            subtitle: const Text('الإصدار 1.4.3'),
          ),
        ])),
      ),
    );
  }
}
