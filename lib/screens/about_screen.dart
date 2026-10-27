import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../services/firebase_boot.dart';
import '../services/site_service.dart';
import '../theme.dart';

void _open(String url) => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('عن الرواية')),
      body: ListenableBuilder(
        listenable: SiteService.instance,
        builder: (context, _) {
          final info = SiteService.instance.info;
          return ListView(padding: const EdgeInsets.all(16), children: [
            Container(
              padding: const EdgeInsets.symmetric(vertical: 28),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: const LinearGradient(colors: [Brand.greenLight, Brand.greenDark]),
              ),
              child: Column(children: [
                Image.asset('assets/images/logo_white.png', height: 110),
                const SizedBox(height: 8),
                const Text('الأخبار المغاربية والإقليمية',
                    style: TextStyle(color: Colors.white, fontSize: 16)),
              ]),
            ),
            const SizedBox(height: 18),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(info.aboutOrDefault,
                    style: const TextStyle(fontSize: 16.5, height: 1.9, color: Brand.ink)),
              ),
            ),
            const SizedBox(height: 18),
            const Text('تابعونا', style: TextStyle(fontSize: 18, color: Brand.ink)),
            const SizedBox(height: 10),
            Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
              _Social(Icons.facebook, const Color(0xFF1877F2), 'فيسبوك', AppConfig.facebookUrl),
              _Social(Icons.smart_display, const Color(0xFFFF0000), 'يوتيوب', AppConfig.youtubeUrl),
              _Social(Icons.music_note, Colors.black, 'تيك توك', AppConfig.tiktokUrl),
              _Social(Icons.camera_alt_outlined, const Color(0xFFC13584), 'إنستغرام',
                  AppConfig.instagramUrl),
            ]),
            const SizedBox(height: 24),
            FilledButton.icon(
              style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
              onPressed: () => Navigator.of(context)
                  .push(MaterialPageRoute(builder: (_) => const ContactScreen())),
              icon: const Icon(Icons.mail_outline),
              label: const Text('اتصل بنا', style: TextStyle(fontSize: 17)),
            ),
          ]);
        },
      ),
    );
  }
}

class _Social extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final String url;
  const _Social(this.icon, this.color, this.label, this.url);
  @override
  Widget build(BuildContext context) => InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _open(url),
        child: Padding(
          padding: const EdgeInsets.all(6),
          child: Column(children: [
            CircleAvatar(radius: 24, backgroundColor: color, child: Icon(icon, color: Colors.white)),
            const SizedBox(height: 6),
            Text(label, style: const TextStyle(fontSize: 13, color: Brand.ink)),
          ]),
        ),
      );
}

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});
  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  final _name = TextEditingController();
  final _contact = TextEditingController();
  final _text = TextEditingController();
  bool _busy = false;
  bool _sent = false;

  Future<void> _send() async {
    final text = _text.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('اكتب رسالتك أولاً.')));
      return;
    }
    setState(() => _busy = true);
    try {
      await SiteService.instance.sendMessage(
        name: _name.text.trim(),
        contact: _contact.text.trim(),
        text: text.length > 2900 ? text.substring(0, 2900) : text,
      );
      setState(() => _sent = true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('تعذر الإرسال. تحقق من الاتصال وأعد المحاولة.')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('اتصل بنا')),
      body: ListenableBuilder(
        listenable: SiteService.instance,
        builder: (context, _) {
          final info = SiteService.instance.info;
          final wa = info.whatsapp.replaceAll(RegExp(r'[^0-9]'), '');
          return ListView(padding: const EdgeInsets.all(16), children: [
            if (info.email.isNotEmpty || wa.isNotEmpty || info.phone.isNotEmpty) ...[
              Wrap(spacing: 8, runSpacing: 8, children: [
                if (wa.isNotEmpty)
                  FilledButton.icon(
                    style: FilledButton.styleFrom(backgroundColor: const Color(0xFF25D366)),
                    onPressed: () => _open('https://wa.me/$wa'),
                    icon: const Icon(Icons.chat),
                    label: const Text('واتساب'),
                  ),
                if (info.email.isNotEmpty)
                  OutlinedButton.icon(
                    onPressed: () => _open('mailto:${info.email}'),
                    icon: const Icon(Icons.mail_outline),
                    label: const Text('البريد'),
                  ),
                if (info.phone.isNotEmpty)
                  OutlinedButton.icon(
                    onPressed: () => _open('tel:${info.phone}'),
                    icon: const Icon(Icons.phone_outlined),
                    label: const Text('اتصال'),
                  ),
              ]),
              const SizedBox(height: 20),
            ],
            if (_sent)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Column(children: [
                    Icon(Icons.check_circle, color: Brand.green, size: 48),
                    SizedBox(height: 10),
                    Text('وصلت رسالتك، شكراً لتواصلك مع الرواية.',
                        textAlign: TextAlign.center, style: TextStyle(fontSize: 16)),
                  ]),
                ),
              )
            else if (!FirebaseBoot.ready)
              const Text('إرسال الرسائل غير متاح حالياً.')
            else ...[
              const Text('أرسل لنا رسالة أو خبراً أو ملاحظة:',
                  style: TextStyle(fontSize: 16, color: Brand.ink)),
              const SizedBox(height: 12),
              TextField(
                controller: _name,
                decoration: const InputDecoration(labelText: 'الاسم', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _contact,
                decoration: const InputDecoration(
                    labelText: 'الهاتف أو البريد (اختياري، لنرد عليك)',
                    border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _text,
                minLines: 5,
                maxLines: 12,
                maxLength: 2900,
                decoration: const InputDecoration(
                    labelText: 'الرسالة', alignLabelWithHint: true, border: OutlineInputBorder()),
              ),
              const SizedBox(height: 8),
              FilledButton.icon(
                style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                onPressed: _busy ? null : _send,
                icon: _busy
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.send),
                label: const Text('إرسال', style: TextStyle(fontSize: 17)),
              ),
            ],
          ]);
        },
      ),
    );
  }
}
