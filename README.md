# تطبيق الرواية (أندرويد)

تطبيق Flutter بهوية الرواية: الشعار، اللون الأخضر #004A49، خط القدس.

- **الأخبار:** آخر مواد قناة يوتيوب @ERRIWAYA (بدون مفاتيح) مع التصنيفات (تُعدّل في `lib/config.dart`).
- **فيديوهات:** شبكة التقارير والفيديوهات القصيرة، تشغيل داخل التطبيق.
- **المنصات:** صفحة فيسبوك ERRIWAYA وحساب تيك توك داخل التطبيق، وروابط كل الحسابات (إنستغرام ERRIWAYA.MR).
- **المحفوظات والمشاركة.**
- **العاجل:** Firebase Cloud Messaging على الموضوع `breaking`؛ يعمل بعد ملء مفاتيح Firebase في `lib/config.dart`.

## البناء

كل دفع إلى الفرع `android-app` يبني ملف `erriwaya.apk` عبر GitHub Actions وينشره في Releases.
أحدث نسخة: https://github.com/tenyekat-design/erriwaya-videos/releases/latest/download/erriwaya.apk

مجلد `android/` يُولَّد في البناء (`flutter create`) ثم يُعدَّل بـ `android-ci/patch_android.py`.
مفتاح التوقيع في `android-ci/debug.keystore` مفتاح اختبار؛ للنشر على Google Play يُنشأ مفتاح خاص ويُحفظ في Secrets.
