import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:image/image.dart' as img;
import 'package:shared_preferences/shared_preferences.dart';

import '../models.dart';
import 'firebase_boot.dart';

/// الأخبار المكتوبة: تُقرأ مباشرة من Firestore (تحديث فوري) وتُحفظ نسخة على الهاتف.
/// الصور تُخزَّن داخل Firestore نفسه (بعد ضغطها) فلا نحتاج خطة Firebase مدفوعة.
class ArticlesService extends ChangeNotifier {
  ArticlesService._();
  static final instance = ArticlesService._();

  static const _kCache = 'articles_cache';
  List<Article> items = [];
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _sub;

  CollectionReference<Map<String, dynamic>> get _col =>
      FirebaseFirestore.instance.collection('articles');

  Future<void> start() async {
    final p = await SharedPreferences.getInstance();
    final raw = p.getString(_kCache);
    if (raw != null) {
      try {
        items = (jsonDecode(raw) as List)
            .map((e) => Article.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
        notifyListeners();
      } catch (_) {}
    }
    if (!FirebaseBoot.ready) return;
    _sub?.cancel();
    _sub = _col.orderBy('createdAt', descending: true).limit(60).snapshots().listen((snap) async {
      items = snap.docs.map(_fromDoc).toList();
      notifyListeners();
      final pp = await SharedPreferences.getInstance();
      await pp.setString(_kCache, jsonEncode(items.map((e) => e.toJson()).toList()));
    }, onError: (e) => debugPrint('articles stream: $e'));
  }

  static Article _fromDoc(DocumentSnapshot<Map<String, dynamic>> d) {
    final m = d.data() ?? {};
    final ts = m['createdAt'];
    return Article(
      id: d.id,
      title: (m['title'] ?? '') as String,
      body: (m['body'] ?? '') as String,
      category: (m['category'] ?? '') as String,
      breaking: (m['breaking'] ?? false) as bool,
      thumb: (m['thumb'] ?? '') as String,
      imageCount: (m['imageCount'] ?? 0) as int,
      createdAt: ts is Timestamp ? ts.toDate() : DateTime.now(),
    );
  }

  Future<Article?> byId(String id) async {
    for (final a in items) {
      if (a.id == id) return a;
    }
    if (!FirebaseBoot.ready) return null;
    final d = await _col.doc(id).get();
    return d.exists ? _fromDoc(d) : null;
  }

  Future<List<Uint8List>> images(Article a) async {
    if (!FirebaseBoot.ready || a.imageCount == 0) return [];
    final q = await _col.doc(a.id).collection('images').orderBy('i').get();
    return q.docs.map((d) => base64Decode(d.data()['data'] as String)).toList();
  }

  /// ينشر خبراً جديداً ويعيد معرّفه.
  Future<String> publish({
    required String title,
    required String body,
    required String category,
    required bool breaking,
    required List<Uint8List> images,
    required String author,
  }) async {
    final prepared = await compute(_prepareImages, images);
    final doc = _col.doc();
    final batch = FirebaseFirestore.instance.batch();
    batch.set(doc, {
      'title': title,
      'body': body,
      'category': category,
      'breaking': breaking,
      'thumb': prepared.thumb,
      'imageCount': prepared.full.length,
      'author': author,
      'createdAt': FieldValue.serverTimestamp(),
    });
    for (var i = 0; i < prepared.full.length; i++) {
      batch.set(doc.collection('images').doc('$i'), {'i': i, 'data': prepared.full[i]});
    }
    await batch.commit();
    return doc.id;
  }

  Future<void> delete(Article a) async {
    final imgs = await _col.doc(a.id).collection('images').get();
    final batch = FirebaseFirestore.instance.batch();
    for (final d in imgs.docs) {
      batch.delete(d.reference);
    }
    batch.delete(_col.doc(a.id));
    await batch.commit();
  }
}

class _Prepared {
  final String thumb;
  final List<String> full;
  _Prepared(this.thumb, this.full);
}

/// يضغط الصور (عرض أقصى 1280) ويصنع صورة مصغرة 480 للقائمة.
_Prepared _prepareImages(List<Uint8List> images) {
  final full = <String>[];
  var thumb = '';
  for (var i = 0; i < images.length; i++) {
    final decoded = img.decodeImage(images[i]);
    if (decoded == null) continue;
    final big = decoded.width > 1280 ? img.copyResize(decoded, width: 1280) : decoded;
    var q = 75;
    var bytes = img.encodeJpg(big, quality: q);
    while (bytes.length > 700 * 1024 && q > 40) {
      q -= 10;
      bytes = img.encodeJpg(big, quality: q);
    }
    full.add(base64Encode(bytes));
    if (thumb.isEmpty) {
      final small = img.copyResize(decoded, width: 480);
      thumb = base64Encode(img.encodeJpg(small, quality: 70));
    }
  }
  return _Prepared(thumb, full);
}
