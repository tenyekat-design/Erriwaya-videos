import 'dart:convert';

import 'package:file_picker/file_picker.dart';
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

  Future<void> _pickFile() async {
    try {
      final res = await FilePicker.platform.pickFiles(type: FileType.any, withData: true);
      final bytes = res?.files.single.bytes;
      if (bytes == null) return;
      await _saveText(utf8.decode(bytes, allowMalformed: true));
    } catch (e) {
      setState(() => _msg = 'تعذر فتح الملف: $e');
    }
  }

  Future<void> _save() => _saveText(_ctrl.text);

  Future<void> _saveText(String text) async {
    final err = await PushSender.saveKey(text);
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
            subtitle: const Text('من Firebase: إعدادات المشروع ← Service accounts ← '
                'Generate new private key. ثم اختر الملف الذي نزل على هاتفك.'),
          ),
        ),
        const SizedBox(height: 14),
        FilledButton.icon(
          style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
          onPressed: _pickFile,
          icon: const Icon(Icons.file_open_outlined),
          label: const Text('اختيار ملف المفتاح', style: TextStyle(fontSize: 16)),
        ),
        const SizedBox(height: 18),
        const Text('أو الصق محتوى الملف هنا:', style: TextStyle(color: Brand.muted)),
        const SizedBox(height: 8),
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
        OutlinedButton(onPressed: _save, child: const Text('حفظ المحتوى الملصق')),
        if (_has == true) ...[
          const SizedBox(height: 12),
          FilledButton.icon(
            style: FilledButton.styleFrom(backgroundColor: Brand.red),
            onPressed: () async {
              setState(() => _msg = 'جارٍ إرسال إشعار تجريبي…');
              final err = await PushSender.sendBreaking(
                  title: 'إشعار تجريبي من لوحة التحرير', articleId: '');
              setState(() => _msg = err ?? 'أُرسل الإشعار التجريبي. يجب أن يصل خلال ثوانٍ.');
            },
            icon: const Icon(Icons.notifications_active),
            label: const Text('إرسال إشعار تجريبي'),
          ),
        ],
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
