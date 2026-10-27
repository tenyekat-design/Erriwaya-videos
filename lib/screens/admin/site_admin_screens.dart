import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models.dart';
import '../../services/site_service.dart';
import '../../theme.dart';

/// رسائل «اتصل بنا» التي يرسلها القراء.
class MessagesScreen extends StatelessWidget {
  const MessagesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('رسائل القراء')),
      body: StreamBuilder<List<ContactMessage>>(
        stream: SiteService.instance.messages(),
        builder: (context, snap) {
          if (snap.hasError) {
            return Center(
                child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text('تعذر تحميل الرسائل.\n${snap.error}', textAlign: TextAlign.center),
            ));
          }
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator(color: Brand.green));
          }
          final list = snap.data!;
          if (list.isEmpty) {
            return const Center(
                child: Text('لا توجد رسائل بعد.', style: TextStyle(color: Brand.muted)));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, i) {
              final m = list[i];
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Expanded(
                        child: Text(m.name.isEmpty ? 'بدون اسم' : m.name,
                            style: const TextStyle(fontSize: 16, color: Brand.ink)),
                      ),
                      Text(timeAgo(m.time),
                          style: const TextStyle(fontSize: 12, color: Brand.muted)),
                    ]),
                    if (m.contact.isNotEmpty)
                      InkWell(
                        onTap: () {
                          final c = m.contact.trim();
                          final url = c.contains('@')
                              ? 'mailto:$c'
                              : 'https://wa.me/${c.replaceAll(RegExp(r'[^0-9]'), '')}';
                          launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
                        },
                        child: Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(m.contact,
                              textDirection: TextDirection.ltr,
                              style: const TextStyle(color: Brand.green, fontSize: 14)),
                        ),
                      ),
                    const SizedBox(height: 8),
                    SelectableText(m.text,
                        style: const TextStyle(fontSize: 15, height: 1.7, color: Brand.ink)),
                    Align(
                      alignment: AlignmentDirectional.centerEnd,
                      child: IconButton(
                        tooltip: 'حذف',
                        icon: const Icon(Icons.delete_outline, color: Brand.red),
                        onPressed: () => SiteService.instance.deleteMessage(m.id),
                      ),
                    ),
                  ]),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

/// تعديل نبذة الرواية ووسائل الاتصال.
class SiteInfoEditScreen extends StatefulWidget {
  const SiteInfoEditScreen({super.key});
  @override
  State<SiteInfoEditScreen> createState() => _SiteInfoEditScreenState();
}

class _SiteInfoEditScreenState extends State<SiteInfoEditScreen> {
  late final SiteInfo _i = SiteService.instance.info;
  late final _about = TextEditingController(text: _i.aboutOrDefault);
  late final _email = TextEditingController(text: _i.email);
  late final _wa = TextEditingController(text: _i.whatsapp);
  late final _phone = TextEditingController(text: _i.phone);
  bool _busy = false;

  Future<void> _save() async {
    setState(() => _busy = true);
    try {
      await SiteService.instance.save(SiteInfo(
        about: _about.text.trim(),
        email: _email.text.trim(),
        whatsapp: _wa.text.trim(),
        phone: _phone.text.trim(),
      ));
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('حُفظت المعلومات.')));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('تعذر الحفظ: $e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    InputDecoration d(String l) => InputDecoration(labelText: l, border: const OutlineInputBorder());
    return Scaffold(
      appBar: AppBar(title: const Text('عن الرواية والاتصال')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        TextField(
          controller: _about,
          minLines: 6,
          maxLines: 16,
          style: const TextStyle(height: 1.7),
          decoration: d('نبذة عن الرواية').copyWith(alignLabelWithHint: true),
        ),
        const SizedBox(height: 14),
        TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            textDirection: TextDirection.ltr,
            decoration: d('البريد الإلكتروني')),
        const SizedBox(height: 14),
        TextField(
            controller: _wa,
            keyboardType: TextInputType.phone,
            textDirection: TextDirection.ltr,
            decoration: d('رقم واتساب مع رمز الدولة (مثال 222xxxxxxxx)')),
        const SizedBox(height: 14),
        TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            textDirection: TextDirection.ltr,
            decoration: d('رقم الهاتف (اختياري)')),
        const SizedBox(height: 8),
        const Text('اترك الحقل فارغاً ليختفي زره من صفحة «اتصل بنا».',
            style: TextStyle(color: Brand.muted, fontSize: 13)),
        const SizedBox(height: 20),
        FilledButton(
          onPressed: _busy ? null : _save,
          style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
          child: Text(_busy ? 'جارٍ الحفظ…' : 'حفظ', style: const TextStyle(fontSize: 17)),
        ),
      ]),
    );
  }
}
