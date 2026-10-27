import 'package:firebase_core/firebase_core.dart';

/// كل الإعدادات القابلة للتعديل في مكان واحد.
class AppConfig {
  static const appName = 'الرواية';

  // الحسابات
  static const youtubeHandle = 'ERRIWAYA';

  /// اتركه فارغاً ليُكتشف معرّف القناة تلقائياً من @ERRIWAYA،
  /// أو ضع المعرّف (يبدأ بـ UC) لتسريع التحميل.
  static const youtubeChannelId = 'UCI5O5rxscjt_t1S1gSbLAEg';
  static const facebookPage = 'ERRIWAYA';
  static const tiktokUser = 'erriwaya';
  static const instagramUser = 'erriwaya.mr';

  static String get youtubeUrl => 'https://www.youtube.com/@$youtubeHandle';
  static String get facebookUrl => 'https://www.facebook.com/$facebookPage';
  static String get tiktokUrl => 'https://www.tiktok.com/@$tiktokUser';
  static String get instagramUrl => 'https://www.instagram.com/$instagramUser/';

  /// التصنيفات: اسم التصنيف ← كلمات تُبحث في عنوان الفيديو ووصفه.
  static const categories = <String, List<String>>{
    'الموجز': ['موجز'],
    'تحقيقات': ['تحقيق', 'استقصائي', 'استقصاء', 'وثائقي'],
    'تقارير': ['تقرير'],
    'موريتانيا': ['موريتاني', 'نواكشوط', 'نواذيبو', 'انواكشوط'],
    'المغرب العربي': ['مغارب', 'المغرب', 'الجزائر', 'تونس', 'ليبيا', 'السنغال', 'مالي'],
  };

  // ── الإشعارات العاجلة (Firebase Cloud Messaging) ──
  // تُملأ من مشروع Firebase: Project settings ← تطبيق Android.
  // ما دامت فارغة يعمل التطبيق بدون إشعارات.
  static const firebaseApiKey = 'AIzaSyBAPju15XYiYBEq7_AKVzqdd6KpVvH6Orc';
  static const firebaseAppId = '1:1075479073978:android:a26bb24ae045f4210d9e83';
  static const firebaseSenderId = '1075479073978';
  static const firebaseProjectId = 'erriwaya-68022';
  static const breakingTopic = 'breaking';

  static bool get firebaseEnabled =>
      firebaseApiKey.isNotEmpty && firebaseAppId.isNotEmpty && firebaseProjectId.isNotEmpty;

  static FirebaseOptions get firebaseOptions => const FirebaseOptions(
        apiKey: firebaseApiKey,
        appId: firebaseAppId,
        messagingSenderId: firebaseSenderId,
        projectId: firebaseProjectId,
      );
}
