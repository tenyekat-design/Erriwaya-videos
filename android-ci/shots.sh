#!/bin/bash
# يثبّت تطبيق المصحف على محاكي CI ويلتقط صور الشاشات الرئيسية.
set -x
PKG=mr.erriwaya.erriwaya_mushaf
mkdir -p shots
alive() { timeout 10 adb get-state >/dev/null 2>&1; }
finish() { grep -iE "flutter|FATAL|SIGSEGV|SIGABRT|crash|tombstone|DEBUG  " shots/live-log.txt | tail -300 > shots/flutter-log.txt; ls -la shots; exit 0; }
# المحاكي قد يتوقف فجأة: نحفظ ما التُقط ونخرج بدل الانتظار حتى نهاية الوقت
shot() { sleep "${2:-3}"; alive || { echo "emulator gone before $1"; finish; }; timeout 20 adb exec-out screencap -p > "shots/$1.png"; }
dismiss() { python3 android-ci/tap.py "Wait" >/dev/null 2>&1 || true; }
adb install -r mushaf-x86_64.apk
adb logcat -c
# سجلّ حيّ يبقى حتى لو توقّف المحاكي
(adb logcat -v time > shots/live-log.txt 2>&1 &)
# تشغيل مضمون: نكرر حتى يصبح التطبيق في الواجهة
for i in 1 2 3; do
  adb shell am start -W -n $PKG/.MainActivity
  sleep 8
  adb shell dumpsys activity activities | grep -q "mResumedActivity.*$PKG" && break
done
sleep 15
dismiss
shot 01-home 2
python3 android-ci/tap.py "متابعة القراءة" && shot 02-fatiha-hafs 5
dismiss
adb shell input swipe 150 1300 950 1300 300
shot 03-page2-hafs 4
adb shell input swipe 150 1300 950 1300 300
shot 03b-page3-hafs 4
adb shell input swipe 950 1300 150 1300 300
sleep 2
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
python3 android-ci/tap.py "الأجزاء" && sleep 2
python3 android-ci/tap.py "الثاني" && shot 06b-warsh-juz2 5
adb shell input keyevent KEYCODE_BACK
sleep 2
python3 android-ci/tap.py "السور" && sleep 2
# صفحتا ورش المزخرفتان: البقرة (٢) أولاً ثم الفاتحة (١)
python3 android-ci/tap.py "البَقَرَة" && shot 06c-warsh-p2-ornate 6
adb shell input keyevent KEYCODE_BACK
sleep 2
python3 android-ci/tap.py "الفَاتِحة" && shot 06d-warsh-p1-ornate 6
adb shell input keyevent KEYCODE_BACK
sleep 2
python3 android-ci/tap.py "متابعة القراءة" && shot 07-fatiha-warsh 5
dismiss
adb shell input swipe 150 1300 950 1300 300
shot 08-page2-warsh 4
adb shell input swipe 150 1300 950 1300 300
shot 08b-page3-warsh 4
adb shell input swipe 950 1300 150 1300 300
sleep 2
adb shell input tap 540 1100
shot 09-warsh-tafsir 6
adb shell input keyevent KEYCODE_BACK
sleep 2
adb shell input keyevent KEYCODE_BACK
sleep 2
dismiss
python3 android-ci/tap.py "حفص عن عاصم"
python3 android-ci/tap.py "الأجزاء" && shot 10-juz 4
python3 android-ci/tap.py "بحث" && shot 11-search 4
adb shell input keyevent KEYCODE_BACK
sleep 2
python3 android-ci/tap.py "الإعدادات" && shot 12-settings 4
finish
