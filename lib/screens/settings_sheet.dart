import 'package:flutter/material.dart';

import '../services/firebase_boot.dart';
import '../services/push_service.dart';
import 'admin/login_screen.dart';
import '../theme.dart';

Future<void> showSettingsSheet(BuildContext context) async {
  final enabled = await PushService.isEnabled();
  if (!context.mounted) return;
  await showModalBottomSheet(
    context: context,
    showDragHandle: true,
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
        child: Column(mainAxisSize: MainAxisSize.min, children: [
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
            subtitle: const Text('الإصدار 1.1.0'),
          ),
        ]),
      ),
    );
  }
}
