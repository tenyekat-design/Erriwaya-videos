import 'dart:async';
import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'firebase_boot.dart';

/// نبذة الرواية ووسائل الاتصال، يعدّلها المحرر من لوحة التحرير (Firestore: site/info).
class SiteInfo {
  final String about;
  final String email;
  final String whatsapp;
  final String phone;
  const SiteInfo({this.about = '', this.email = '', this.whatsapp = '', this.phone = ''});

  static const defaultAbout =
      'الرواية منصة إعلامية رقمية تُعنى بأخبار موريتانيا والمغرب العربي ومحيطه في الساحل والصحراء.\n\n'
      'نقدّم الموجز الإخباري والتقارير والتحقيقات بأسلوب بصري حديث يعتمد الخرائط والإنفوغراف والفيديو، '
      'وننشر محتوانا على يوتيوب وفيسبوك وتيك توك وإنستغرام، وفي هذا التطبيق.';

  String get aboutOrDefault => about.trim().isEmpty ? defaultAbout : about;

  Map<String, dynamic> toJson() =>
      {'about': about, 'email': email, 'whatsapp': whatsapp, 'phone': phone};

  factory SiteInfo.fromJson(Map<String, dynamic> j) => SiteInfo(
        about: (j['about'] ?? '').toString(),
        email: (j['email'] ?? '').toString(),
        whatsapp: (j['whatsapp'] ?? '').toString(),
        phone: (j['phone'] ?? '').toString(),
      );
}

class ContactMessage {
  final String id;
  final String name;
  final String contact;
  final String text;
  final DateTime time;
  ContactMessage(this.id, this.name, this.contact, this.text, this.time);
}

class SiteService extends ChangeNotifier {
  SiteService._();
  static final instance = SiteService._();
  static const _kCache = 'site_info';

  SiteInfo info = const SiteInfo();
  StreamSubscription? _sub;

  DocumentReference<Map<String, dynamic>> get _doc =>
      FirebaseFirestore.instance.collection('site').doc('info');
  CollectionReference<Map<String, dynamic>> get _messages =>
      FirebaseFirestore.instance.collection('messages');

  Future<void> start() async {
    final p = await SharedPreferences.getInstance();
    final raw = p.getString(_kCache);
    if (raw != null) {
      try {
        info = SiteInfo.fromJson(Map<String, dynamic>.from(jsonDecode(raw) as Map));
        notifyListeners();
      } catch (_) {}
    }
    if (!FirebaseBoot.ready) return;
    _sub = _doc.snapshots().listen((d) async {
      if (!d.exists) return;
      info = SiteInfo.fromJson(d.data()!);
      notifyListeners();
      final pp = await SharedPreferences.getInstance();
      await pp.setString(_kCache, jsonEncode(info.toJson()));
    }, onError: (e) => debugPrint('site info: $e'));
  }

  Future<void> save(SiteInfo i) => _doc.set(i.toJson());

  Future<void> sendMessage({required String name, required String contact, required String text}) =>
      _messages.add({
        'name': name,
        'contact': contact,
        'text': text,
        'createdAt': FieldValue.serverTimestamp(),
      });

  Stream<List<ContactMessage>> messages() => _messages
      .orderBy('createdAt', descending: true)
      .limit(200)
      .snapshots()
      .map((s) => s.docs.map((d) {
            final m = d.data();
            final ts = m['createdAt'];
            return ContactMessage(
              d.id,
              (m['name'] ?? '').toString(),
              (m['contact'] ?? '').toString(),
              (m['text'] ?? '').toString(),
              ts is Timestamp ? ts.toDate() : DateTime.now(),
            );
          }).toList());

  Future<void> deleteMessage(String id) => _messages.doc(id).delete();
}
