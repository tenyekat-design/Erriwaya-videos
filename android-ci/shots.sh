#!/bin/bash
# Installs the APK on the CI emulator and screenshots each screen.
set -x
PKG=mr.erriwaya.erriwaya
mkdir -p shots
shot() { sleep "${2:-3}"; adb exec-out screencap -p > "shots/$1.png"; }
adb shell wm size
adb install -r erriwaya-x86_64.apk
adb shell pm grant $PKG android.permission.POST_NOTIFICATIONS || true
adb logcat -c
adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1
shot 01-home 25
adb shell input swipe 540 1700 540 700 400
shot 02-home-scrolled 4
adb shell input swipe 540 700 540 1900 300
sleep 2
python3 android-ci/tap.py "الموجز" && shot 03-category 4
python3 android-ci/tap.py "الكل"
sleep 2
adb shell input tap 540 700
shot 04-player 12
adb shell input keyevent KEYCODE_BACK
python3 android-ci/tap.py "فيديوهات" && shot 05-videos 6
python3 android-ci/tap.py "قصيرة" && shot 06-videos-shorts 4
python3 android-ci/tap.py "المنصات" && shot 07-facebook 25
python3 android-ci/tap.py "تيك توك" && shot 08-tiktok 25
python3 android-ci/tap.py "تابعنا" && shot 09-follow 4
python3 android-ci/tap.py "المحفوظات" && shot 10-saved 4
python3 android-ci/tap.py "الأخبار"
sleep 2
python3 android-ci/tap.py "الإعدادات" && shot 11-settings 4
adb logcat -d > shots/logcat.txt
grep -iE "flutter|exception|E/" shots/logcat.txt | grep -i -E "flutter|erriwaya" | tail -200 > shots/flutter-log.txt
ls -la shots
exit 0
