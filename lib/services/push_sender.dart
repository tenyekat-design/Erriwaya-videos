import 'dart:convert';

import 'package:googleapis_auth/auth_io.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';

/// يرسل إشعار «عاجل» لكل المشتركين عبر FCM HTTP v1، باستخدام مفتاح حساب الخدمة
/// الذي يلصقه المحرر مرة واحدة على هاتفه (لا يُرفع إلى أي مكان آخر).
class PushSender {
  static const _k = 'fcm_service_account';

  static Future<String?> savedKey() async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_k);
  }

  static Future<bool> hasKey() async => (await savedKey()) != null;

  /// يتحقق من المفتاح ويحفظه. يعيد رسالة خطأ أو null عند النجاح.
  static Future<String?> saveKey(String json) async {
    try {
      final m = jsonDecode(json.trim()) as Map<String, dynamic>;
      if (m['type'] != 'service_account' || m['private_key'] == null || m['client_email'] == null) {
        return 'هذا ليس ملف مفتاح حساب خدمة من Firebase.';
      }
      if (AppConfig.firebaseProjectId.isNotEmpty && m['project_id'] != AppConfig.firebaseProjectId) {
        return 'المفتاح لمشروع آخر (${m['project_id']}).';
      }
      ServiceAccountCredentials.fromJson(m);
      final p = await SharedPreferences.getInstance();
      await p.setString(_k, json.trim());
      return null;
    } catch (_) {
      return 'تعذر قراءة المفتاح. الصق محتوى الملف كاملاً.';
    }
  }

  static Future<void> clearKey() async {
    final p = await SharedPreferences.getInstance();
    await p.remove(_k);
  }

  /// يعيد null عند النجاح أو رسالة الخطأ.
  static Future<String?> sendBreaking({required String title, required String articleId}) async {
    final key = await savedKey();
    if (key == null) return 'لم يُضف مفتاح الإشعارات بعد.';
    AutoRefreshingAuthClient? client;
    try {
      final creds = ServiceAccountCredentials.fromJson(jsonDecode(key));
      client = await clientViaServiceAccount(
          creds, ['https://www.googleapis.com/auth/firebase.messaging']);
      final res = await client.post(
        Uri.parse('https://fcm.googleapis.com/v1/projects/${AppConfig.firebaseProjectId}/messages:send'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'message': {
            'topic': AppConfig.breakingTopic,
            'notification': {'title': 'عاجل | الرواية', 'body': title},
            'data': {'articleId': articleId, 'title': 'عاجل', 'body': title},
            'android': {
              'priority': 'HIGH',
              'notification': {'color': '#004A49', 'sound': 'default'},
            },
          }
        }),
      );
      if (res.statusCode == 200) return null;
      return 'رفض Firebase الإشعار (${res.statusCode}).';
    } catch (e) {
      return 'تعذر إرسال الإشعار: $e';
    } finally {
      client?.close();
    }
  }
}
