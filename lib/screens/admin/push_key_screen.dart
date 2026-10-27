import 'package:flutter/material.dart';

import '../../services/push_sender.dart';
import '../../theme.dart';

/// يلصق المحرر هنا مرة واحدة محتوى ملف «مفتاح حساب الخدمة» من Firebase
/// ليستطيع التطبيق إرسال الإشعارات العاجلة. المفتاح يبقى على هذا الهاتف فقط.
class PushKeyScreen extends StatefulWidget {
  const PushKeyScreen({super.key});
  @override
  State<PushKeyScreen> createState() => _PushKeyScreenState();
}

class _PushKeyScreenState extends State<PushKeyScreen> {
  final _ctrl = TextEditingController();
  bool? _has;
  String? _msg;

  @override
  void initState() {
    super.initState();
    PushSender.hasKey().then((v) => setState(() => _has = v));
  }

  Future<void> _save() async {
    final err = await PushSender.saveKey(_ctrl.text);
    setState(() {
      _msg = err ?? 'حُفظ المفتاح. الإشعارات العاجلة جاهزة.';
      if (err == null) {
        _has = true;
        _ctrl.clear();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('مفتاح الإشعارات')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Card(
          child: ListTile(
            leading: Icon(_has == true ? Icons.check_circle : Icons.info_outline,
                color: _has == true ? Brand.green : Brand.muted),
            title: Text(_has == true ? 'المفتاح مضاف على هذا الهاتف' : 'لم يُضف المفتاح بعد'),
            subtitle: const Text('من Firebase: إعدادات المشروع ← حسابات الخدمة ← إنشاء مفتاح خاص جديد. '
                'افتح الملف وانسخ محتواه كاملاً والصقه هنا.'),
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _ctrl,
          minLines: 6,
          maxLines: 10,
          textDirection: TextDirection.ltr,
          style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
          decoration: const InputDecoration(
            hintText: '{ "type": "service_account", ... }',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        FilledButton(onPressed: _save, child: const Text('حفظ المفتاح')),
        if (_has == true)
          TextButton(
            onPressed: () async {
              await PushSender.clearKey();
              setState(() {
                _has = false;
                _msg = 'حُذف المفتاح من هذا الهاتف.';
              });
            },
            child: const Text('حذف المفتاح', style: TextStyle(color: Brand.red)),
          ),
        if (_msg != null) ...[
          const SizedBox(height: 10),
          Text(_msg!, style: const TextStyle(fontSize: 15)),
        ],
      ]),
    );
  }
}
