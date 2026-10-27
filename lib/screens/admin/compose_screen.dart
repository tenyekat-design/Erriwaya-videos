import 'dart:typed_data';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../config.dart';
import '../../models.dart';
import '../../portals.dart';
import '../../services/articles_service.dart';
import '../../services/push_sender.dart';
import '../../theme.dart';

class ComposeScreen extends StatefulWidget {
  /// عند تمرير خبر تُفتح الشاشة لتعديله بدل إنشاء خبر جديد.
  final Article? editing;
  const ComposeScreen({super.key, this.editing});
  @override
  State<ComposeScreen> createState() => _ComposeScreenState();
}

class _ComposeScreenState extends State<ComposeScreen> {
  static const _maxImages = 8;
  final _title = TextEditingController();
  final _body = TextEditingController();
  String _category = '';
  bool _breaking = false;
  final Set<String> _portals = {};
  final List<Uint8List> _images = [];
  bool _busy = false;
  String _status = '';
  bool _loadingImages = false;

  bool get _isEdit => widget.editing != null;

  @override
  void initState() {
    super.initState();
    final a = widget.editing;
    if (a != null) {
      _title.text = a.title;
      _body.text = a.body;
      _category = AppConfig.categories.containsKey(a.category) ? a.category : '';
      _breaking = a.breaking;
      _portals.addAll(a.portals);
      _loadingImages = a.imageCount > 0;
      ArticlesService.instance.images(a).then((imgs) {
        if (!mounted) return;
        setState(() {
          _images.addAll(imgs);
          _loadingImages = false;
        });
      }).catchError((_) {
        if (mounted) setState(() => _loadingImages = false);
      });
    }
  }

  Future<void> _pick() async {
    final files = await ImagePicker().pickMultiImage(maxWidth: 1600, imageQuality: 85);
    for (final f in files) {
      if (_images.length >= _maxImages) break;
      _images.add(await f.readAsBytes());
    }
    setState(() {});
  }

  Future<void> _publish() async {
    final title = _title.text.trim();
    if (title.isEmpty) {
      _snack('اكتب عنوان الخبر.');
      return;
    }
    if (!_breaking && _body.text.trim().isEmpty) {
      _snack('اكتب نص الخبر.');
      return;
    }
    setState(() {
      _busy = true;
      _status = _isEdit
          ? 'جارٍ حفظ التعديلات…'
          : (_images.isEmpty ? 'جارٍ النشر…' : 'جارٍ تجهيز الصور ونشر الخبر…');
    });
    if (_isEdit) {
      try {
        await ArticlesService.instance.update(
          original: widget.editing!,
          title: title,
          body: _body.text.trim(),
          category: _category,
          breaking: _breaking,
          images: _images,
          portals: _portals.toList(),
        );
        if (!mounted) return;
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('حُفظت التعديلات.')));
      } catch (e) {
        _snack('تعذر الحفظ: $e');
      } finally {
        if (mounted) setState(() => _busy = false);
      }
      return;
    }
    try {
      final id = await ArticlesService.instance.publish(
        title: title,
        body: _body.text.trim(),
        category: _category,
        breaking: _breaking,
        images: _images,
        author: FirebaseAuth.instance.currentUser?.email ?? '',
        portals: _portals.toList(),
      );
      var msg = 'نُشر الخبر.';
      if (_breaking) {
        setState(() => _status = 'جارٍ إرسال الإشعار العاجل…');
        final err = await PushSender.sendBreaking(title: title, articleId: id);
        msg = err == null ? 'نُشر الخبر وأُرسل الإشعار العاجل.' : 'نُشر الخبر، لكن الإشعار لم يُرسل: $err';
      }
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    } catch (e) {
      _snack('تعذر النشر: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _snack(String m) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? 'تعديل الخبر' : 'خبر جديد')),
      body: AbsorbPointer(
        absorbing: _busy,
        child: ListView(padding: const EdgeInsets.all(16), children: [
          TextField(
            controller: _title,
            maxLines: 3,
            minLines: 1,
            style: const TextStyle(fontSize: 18),
            decoration: const InputDecoration(labelText: 'العنوان', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _body,
            minLines: 6,
            maxLines: 20,
            style: const TextStyle(fontSize: 16, height: 1.7),
            decoration: InputDecoration(
              labelText: _breaking ? 'تفاصيل (اختياري للعاجل)' : 'نص الخبر',
              alignLabelWithHint: true,
              border: const OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            initialValue: _category,
            decoration: const InputDecoration(labelText: 'التصنيف', border: OutlineInputBorder()),
            items: [
              const DropdownMenuItem(value: '', child: Text('بدون تصنيف')),
              for (final c in AppConfig.categories.keys) DropdownMenuItem(value: c, child: Text(c)),
            ],
            onChanged: (v) => setState(() => _category = v ?? ''),
          ),
          const SizedBox(height: 14),
          const Text('البوابات (الدول المعنية بالخبر)', style: TextStyle(fontSize: 16)),
          const SizedBox(height: 8),
          Wrap(spacing: 6, runSpacing: 6, children: [
            for (final p in portals)
              FilterChip(
                label: Text(p.name),
                selected: _portals.contains(p.id),
                selectedColor: Brand.green.withValues(alpha: 0.18),
                checkmarkColor: Brand.green,
                onSelected: (v) => setState(() => v ? _portals.add(p.id) : _portals.remove(p.id)),
              ),
          ]),
          const Padding(
            padding: EdgeInsets.only(top: 6),
            child: Text('يظهر الخبر أيضاً تلقائياً في بوابة كل دولة يُذكر اسمها في نصه.',
                style: TextStyle(fontSize: 12.5, color: Brand.muted)),
          ),
          const SizedBox(height: 8),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            value: _breaking,
            activeTrackColor: Brand.red,
            title: const Text('خبر عاجل'),
            subtitle: Text(_isEdit
                ? 'شريط أحمر لمدة نصف ساعة من وقت النشر (لا يُعاد إرسال الإشعار)'
                : 'شريط أحمر أعلى الأخبار لمدة نصف ساعة، وإشعار لكل الهواتف'),
            onChanged: (v) => setState(() => _breaking = v),
          ),
          const SizedBox(height: 8),
          Row(children: [
            Text('الصور (${_images.length}/$_maxImages)', style: const TextStyle(fontSize: 16)),
            const Spacer(),
            OutlinedButton.icon(
              onPressed: _images.length >= _maxImages ? null : _pick,
              icon: const Icon(Icons.add_photo_alternate_outlined),
              label: const Text('إضافة صور'),
            ),
          ]),
          const SizedBox(height: 10),
          if (_loadingImages)
            const Padding(
              padding: EdgeInsets.all(12),
              child: Center(child: CircularProgressIndicator(color: Brand.green)),
            ),
          if (_images.isNotEmpty)
            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              children: [
                for (var i = 0; i < _images.length; i++)
                  Stack(fit: StackFit.expand, children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.memory(_images[i], fit: BoxFit.cover),
                    ),
                    if (i == 0)
                      Positioned(
                        bottom: 4,
                        right: 4,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                              color: Brand.green, borderRadius: BorderRadius.circular(6)),
                          child: const Text('الرئيسية',
                              style: TextStyle(color: Colors.white, fontSize: 11)),
                        ),
                      ),
                    Positioned(
                      top: 2,
                      left: 2,
                      child: InkWell(
                        onTap: () => setState(() => _images.removeAt(i)),
                        child: const CircleAvatar(
                          radius: 13,
                          backgroundColor: Colors.black54,
                          child: Icon(Icons.close, size: 16, color: Colors.white),
                        ),
                      ),
                    ),
                  ]),
              ],
            ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: _busy || _loadingImages ? null : _publish,
            style: FilledButton.styleFrom(
              backgroundColor: _breaking ? Brand.red : Brand.green,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            icon: _busy
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.send),
            label: Text(
                _busy
                    ? _status
                    : (_isEdit ? 'حفظ التعديلات' : (_breaking ? 'نشر عاجل' : 'نشر الخبر')),
                style: const TextStyle(fontSize: 17)),
          ),
        ]),
      ),
    );
  }
}
