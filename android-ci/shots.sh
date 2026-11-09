#!/bin/bash
# يثبّت تطبيق المصحف على محاكي CI ويلتقط صور الشاشات الرئيسية.
set -x
PKG=mr.erriwaya.erriwaya_mushaf
mkdir -p shots
shot() { sleep "${2:-3}"; adb exec-out screencap -p > "shots/$1.png"; }
adb install -r mushaf-x86_64.apk
adb logcat -c
adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1
shot 01-home 15
python3 android-ci/tap.py "البقرة" && shot 02-baqarah 5
adb shell input tap 540 1200
shot 03-ayah-tafsir 5
adb shell input keyevent KEYCODE_BACK
sleep 2
adb shell input swipe 900 1200 150 1200 300
shot 04-next-page 4
python3 android-ci/tap.py "استمع إلى السورة" && shot 05-reciters 12
adb shell input keyevent KEYCODE_BACK
adb shell input keyevent KEYCODE_BACK
sleep 2
python3 android-ci/tap.py "ورش" && shot 06-home-warsh 4
python3 android-ci/tap.py "الفَاتِحة" && shot 07-fatiha-warsh 5
adb shell input tap 540 900
shot 08-warsh-tafsir 5
adb shell input keyevent KEYCODE_BACK
adb shell input keyevent KEYCODE_BACK
sleep 2
python3 android-ci/tap.py "حفص" && sleep 2
python3 android-ci/tap.py "الأجزاء" && shot 09-juz 4
python3 android-ci/tap.py "بحث" && shot 10-search 4
adb logcat -d > shots/logcat.txt
grep -iE "flutter|exception" shots/logcat.txt | tail -200 > shots/flutter-log.txt
ls -la shots
exit 0
