import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

import '../config.dart';

/// تهيئة Firebase مرة واحدة. ما دامت إعدادات Firebase فارغة يعمل التطبيق بيوتيوب فقط.
class FirebaseBoot {
  static bool ready = false;

  static Future<void> init() async {
    if (!AppConfig.firebaseEnabled || ready) return;
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(options: AppConfig.firebaseOptions);
      }
      ready = true;
    } catch (e) {
      debugPrint('Firebase init failed: $e');
    }
  }
}
