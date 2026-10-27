import 'dart:async';
import 'dart:convert';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';
import '../models.dart';

@pragma('vm:entry-point')
Future<void> firebaseBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: AppConfig.firebaseOptions);
  await PushService.store(message);
}

/// الأخبار العاجلة عبر Firebase: يرسلها المحرر من لوحة Firebase إلى الموضوع «breaking».
class PushService {
  static const _kLast = 'breaking_last';
  static const _kEnabled = 'breaking_enabled';

  static final latest = ValueNotifier<BreakingNews?>(null);

  /// يُستدعى عند الضغط على إشعار يحمل رابطاً.
  static final opened = StreamController<BreakingNews>.broadcast();

  static bool get available => AppConfig.firebaseEnabled;
  static bool _ready = false;

  static Future<void> init() async {
    final p = await SharedPreferences.getInstance();
    final raw = p.getString(_kLast);
    if (raw != null) {
      try {
        latest.value = BreakingNews.fromJson(Map<String, dynamic>.from(jsonDecode(raw) as Map));
      } catch (_) {}
    }
    if (!available) return;
    try {
      await Firebase.initializeApp(options: AppConfig.firebaseOptions);
      FirebaseMessaging.onBackgroundMessage(firebaseBackgroundHandler);
      final fm = FirebaseMessaging.instance;
      await fm.requestPermission(alert: true, badge: true, sound: true);
      if (p.getBool(_kEnabled) ?? true) {
        await fm.subscribeToTopic(AppConfig.breakingTopic);
      }
      FirebaseMessaging.onMessage.listen((m) async {
        latest.value = await store(m);
      });
      FirebaseMessaging.onMessageOpenedApp.listen((m) async {
        final b = await store(m);
        latest.value = b;
        opened.add(b);
      });
      final initial = await fm.getInitialMessage();
      if (initial != null) {
        final b = await store(initial);
        latest.value = b;
        Future.delayed(const Duration(milliseconds: 800), () => opened.add(b));
      }
      _ready = true;
    } catch (e) {
      debugPrint('Push init failed: $e');
    }
  }

  static Future<BreakingNews> store(RemoteMessage m) async {
    final b = BreakingNews(
      title: m.notification?.title ?? m.data['title']?.toString() ?? 'عاجل',
      body: m.notification?.body ?? m.data['body']?.toString() ?? '',
      url: m.data['url']?.toString(),
      time: m.sentTime ?? DateTime.now(),
    );
    final p = await SharedPreferences.getInstance();
    await p.setString(_kLast, jsonEncode(b.toJson()));
    return b;
  }

  static Future<bool> isEnabled() async {
    final p = await SharedPreferences.getInstance();
    return p.getBool(_kEnabled) ?? true;
  }

  static Future<void> setEnabled(bool on) async {
    final p = await SharedPreferences.getInstance();
    await p.setBool(_kEnabled, on);
    if (!_ready) return;
    try {
      if (on) {
        await FirebaseMessaging.instance.subscribeToTopic(AppConfig.breakingTopic);
      } else {
        await FirebaseMessaging.instance.unsubscribeFromTopic(AppConfig.breakingTopic);
      }
    } catch (_) {}
  }
}
