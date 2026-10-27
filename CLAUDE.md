# تطبيق الرواية (Erriwaya Android app) — handoff notes

Flutter app. This branch (`android-app`) is independent from the video-template branch of the same repo.

## Build & deliver
- Push to `android-app` → `.github/workflows/build-apk.yml`: `flutter create` generates `android/`, `android-ci/patch_android.py`
  patches manifest (label, INTERNET, notification icon), minSdk 23 and a FIXED signing key (`android-ci/debug.keystore`,
  pass `android`) so updates install over each other. Split APKs: `erriwaya.apk` (arm64), `erriwaya-old-phones.apk` (v7a).
- Release tag `app-v1.0.<run>`; stable link `.../releases/latest/download/erriwaya.apk`. Job `screenshots` runs the x86_64
  APK on an emulator (`android-ci/shots.sh`) and attaches PNGs + flutter-log.txt to the release.
- No Android SDK in the cloud container: verify through CI (public API: runs, check-run annotations, release assets).
  Build errors are emitted as `::error` annotations by the "Report errors" step.
- The user downloads most reliably when the APK is sent directly in chat (GitHub download stalls in his Chrome).
- Bump `version:` in pubspec.yaml and the label in `lib/screens/settings_sheet.dart` for each release.

## Data
- YouTube: `lib/services/youtube_service.dart` parses ytInitialData from channel UCI5O5rxscjt_t1S1gSbLAEg /videos and /shorts
  (RSS returns 404 for this channel). Titles are hashtags → `displayTitle` strips `#`/`_`.
- Firebase project `erriwaya-68022` (config in `lib/config.dart`). Firestore: `articles/{id}` (+ `images/{i}` base64 JPEG,
  thumb inline), `site/info` (about, email, whatsapp, phone), `messages` (reader contact form). Rules: public read of
  articles/site, create-only messages with field/size checks, writes only for editor email tenyekat@gmail.com.
- Breaking push: editor's phone holds the service-account JSON (PushKeyScreen) and sends FCM v1 to topic `breaking`.
- Breaking status lasts 30 min (`breakingWindow` in models.dart), then the article is regular news.

## Product decisions
- Brand: green #004A49, Al-Quds font (assets/fonts), Erriwaya logo. Arabic RTL.
- Portals list & keywords in `lib/portals.dart` (Maghreb, Sahara, Azawad, neighbours). Categories in config.dart.
- Facebook tab is a native card (Page Plugin timeline renders empty in WebView). TikTok embed @erriwaya with overload fallback.
- Pending: Google Play (needs release keystore + Play Console), iOS/App Store (Apple Developer account).
