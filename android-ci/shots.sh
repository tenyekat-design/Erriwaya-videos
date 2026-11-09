#!/bin/bash
# يثبّت تطبيق المصحف على محاكي CI ويلتقط صور الشاشات الرئيسية.
set -x
PKG=mr.erriwaya.erriwaya_mushaf
mkdir -p shots
shot() { sleep "${2:-3}"; adb exec-out screencap -p > "shots/$1.png"; }
dismiss() { python3 android-ci/tap.py "Wait" >/dev/null 2>&1 || true; }
adb install -r mushaf-x86_64.apk
adb logcat -c
adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1
sleep 15
dismiss
shot 01-home 2
python3 android-ci/tap.py "متابعة القراءة" && shot 02-fatiha-hafs 5
adb shell input swipe 150 1300 950 1300 300
shot 03-page2-hafs 4
adb shell input tap 540 1100
shot 04-ayah-tafsir 6
adb shell input keyevent KEYCODE_BACK
sleep 2
python3 android-ci/tap.py "استمع إلى السورة" && shot 05-reciters 14
adb shell input keyevent KEYCODE_BACK
sleep 2
adb shell input keyevent KEYCODE_BACK
sleep 2
dismiss
python3 android-ci/tap.py "ورش عن نافع" && shot 06-home-warsh 4
python3 android-ci/tap.py "متابعة القراءة" && shot 07-fatiha-warsh 5
adb shell input swipe 150 1300 950 1300 300
shot 08-page2-warsh 4
adb shell input tap 540 1100
shot 09-warsh-tafsir 6
adb shell input keyevent KEYCODE_BACK
sleep 2
adb shell input keyevent KEYCODE_BACK
sleep 2
python3 android-ci/tap.py "حفص عن عاصم"
python3 android-ci/tap.py "الأجزاء" && shot 10-juz 4
python3 android-ci/tap.py "بحث" && shot 11-search 4
adb logcat -d > shots/logcat.txt
grep -iE "flutter" shots/logcat.txt | tail -200 > shots/flutter-log.txt
ls -la shots
exit 0
