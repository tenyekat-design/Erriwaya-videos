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

  /// الأقسام (كما في الموقع): اسم القسم ← كلمات تُبحث في العنوان وحده.
  /// لكل مادة قسم واحد: تصنيفها في اللوحة، وإلا أول قسم يطابق عنوانها حسب [sectionPriority].
  /// الدول في البوابات لا في الأقسام.
  static const categories = <String, List<String>>{
    'الموجز': ['موجز'],
    'التقارير': ['تقرير'],
    'التحقيقات': ['تحقيق', 'استقصائي', 'استقصاء', 'وثائقي'],
    'الرأي الحر': [r're:^\s*(مقال\s+)?رأي(?![\p{L}])', 'مقال رأي', 'الرأي الحر', 'وجهة نظر'],
  };
  static const sectionPriority = ['الرأي الحر', 'التحقيقات', 'التقارير', 'الموجز'];

  /// أسماء قديمة أو بديلة لتصنيفات محفوظة في قاعدة البيانات.
  static const categoryAliases = <String, String>{
    'تقارير': 'التقارير', 'تقرير': 'التقارير',
    'تحقيقات': 'التحقيقات', 'تحقيق': 'التحقيقات',
    'موجز': 'الموجز', 'الموجز الإخباري': 'الموجز',
    'رأي': 'الرأي الحر', 'الرأي': 'الرأي الحر', 'رأي حر': 'الرأي الحر', 'مقال رأي': 'الرأي الحر', 'مقالات': 'الرأي الحر',
  };

  /// اسم القسم المعتمد لتصنيف محفوظ، أو null إن لم يكن قسماً.
  static String? canonicalCategory(String c) {
    final t = c.trim();
    return categories.containsKey(t) ? t : categoryAliases[t];
  }

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
