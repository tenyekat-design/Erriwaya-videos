#!/usr/bin/env bash
# Android test of «ذاكرة موريتانيا» on an emulator (GitHub Actions, .github/workflows/calendar-android-test.yml):
# installs the built APK, opens the home page and the encyclopedia, turns the daily notification on, fires a test
# notification, opens the share sheet, and checks the screens' text (uiautomator) and the WebView's console errors.
set -u
cd "$(dirname "$0")/.."
OUT=test-out; rm -rf $OUT; mkdir -p $OUT
PKG=mr.erriwaya.calendar
FAIL=0
ADB=$(command -v adb)
adb(){ timeout 90 "$ADB" "$@"; }
# stop at once if the emulator is gone, instead of running every step against nothing
alive(){ [ "$(timeout 15 adb get-state 2>/dev/null)" = device ] || { echo "FAIL: the emulator stopped responding (step ${STEP:-?})"; adb logcat -d > $OUT/logcat.txt 2>/dev/null; exit 1; }; }
ok(){ echo "PASS: $1"; }
ko(){ echo "FAIL: $1"; FAIL=1; }
shot(){ alive; timeout 40 adb shell screencap -p /sdcard/s.png && timeout 40 adb pull /sdcard/s.png $OUT/$1.png >/dev/null; }
dump(){ alive; timeout 60 adb shell uiautomator dump /sdcard/u.xml >/dev/null 2>&1; adb shell cat /sdcard/u.xml > $OUT/$1.xml; }
has(){ grep -q "$2" $OUT/$1.xml; }
# taps the centre of the first node whose text (or content-desc) contains $2
tap(){ python3 - "$OUT/$1.xml" "$2" <<'PY' | { read x y && [ -n "$x" ] && adb shell input tap $x $y && echo "tap $x $y"; }
import re,sys
s=open(sys.argv[1],encoding='utf-8').read()
for m in re.finditer(r'<node [^>]*>',s):
    n=m.group(0)
    if sys.argv[2] in n:
        b=re.search(r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"',n)
        if b:
            x1,y1,x2,y2=map(int,b.groups())
            if y2>y1 and x2>x1: print((x1+x2)//2,(y1+y2)//2); break
PY
}
adb wait-for-device
adb shell settings put global window_animation_scale 0; adb shell settings put global transition_animation_scale 0; adb shell settings put global animator_duration_scale 0
# a log of the whole run, kept even if the emulator dies
("$ADB" logcat -v time > $OUT/logcat-live.txt 2>&1 &)
# baseline: the version now published, to tell an emulator problem from one of this build
STEP=baseline
curl -sSL -o $OUT/published.apk https://github.com/tenyekat-design/erriwaya-videos/releases/download/calendar/mauritania-calendar.apk && \
  adb install -r --no-incremental $OUT/published.apk && adb shell am start -W -n $PKG/.MainActivity || echo "FAIL: baseline did not start"
adb shell pidof $PKG && echo "published version running"
for i in $(seq 1 30); do sleep 2; alive; done
echo "PASS: the published version runs 60 s on this emulator"
shot 0-published
adb shell am force-stop $PKG
STEP=install; adb uninstall $PKG; adb install -r --no-incremental dist/mauritania-calendar.apk || { echo "install failed"; exit 1; }
adb shell pm grant $PKG android.permission.POST_NOTIFICATIONS 2>/dev/null || true
adb logcat -c
STEP=launch; adb shell am start -W -n $PKG/.MainActivity
for i in $(seq 1 30); do sleep 2; alive; done
adb shell pidof $PKG && echo "PASS: this build runs 60 s"
adb logcat -d > $OUT/logcat-launch.txt
STEP=home
shot 1-home; dump 1-home
has 1-home "ذاكرة اليوم" && ok "home card «ذاكرة اليوم»" || ko "home card «ذاكرة اليوم»"
has 1-home "مواقيت\|الفجر" && ok "the home page still shows the prayer times" || ko "prayer times on the home page"
# open the encyclopedia from the home card
for i in 1 2 3; do tap 1-home "ذاكرة اليوم" && break; adb shell input swipe 540 1700 540 700 300; sleep 1; dump 1-home; done
sleep 3; shot 2-memory; dump 2-memory
has 2-memory "ذاكرة موريتانيا" && ok "the card opens the encyclopedia" || ko "the card opens the encyclopedia"
has 2-memory "الموسوعة" && ok "encyclopedia list" || ko "encyclopedia list"
# favourite and share on the first item
tap 2-memory "المفضلة" >/dev/null; sleep 1; dump 2b; has 2b "في المفضلة" && ok "favourite" || ko "favourite"
tap 2b "مشاركة" >/dev/null; sleep 3; shot 3-share
adb shell dumpsys activity activities | grep -q "ChooserActivity\|ResolverActivity\|chooser" && ok "share sheet opens" || ko "share sheet opens"
adb shell input keyevent KEYCODE_BACK; sleep 2
# scroll to the notification setting, turn it on, fire the test notification
for i in $(seq 1 40); do dump 4; has 4 "نبّهني كل يوم" && break; adb shell input swipe 540 1600 540 500 250; sleep 1; done
tap 4 "نبّهني كل يوم" >/dev/null; sleep 2; dump 4b; shot 4-note
has 4b "جرّب التنبيه الآن" && ok "daily notification turned on" || ko "daily notification turned on"
adb shell dumpsys alarm | grep -q "MEMORY_NOTE" && ok "daily alarm scheduled" || ko "daily alarm scheduled"
tap 4b "جرّب التنبيه الآن" >/dev/null; sleep 3
adb shell dumpsys notification --noredact > $OUT/notifications.txt
grep -q "channel=memory\|id=4343" $OUT/notifications.txt && ok "notification posted" || ko "notification posted"
adb shell cmd statusbar expand-notifications; sleep 2; shot 5-notification; adb shell cmd statusbar collapse
# the library entry
adb shell am start -n $PKG/.MainActivity --es hash "#lib"; sleep 3; dump 6-lib; shot 6-lib
has 6-lib "ذاكرة موريتانيا" && ok "library entry" || ko "library entry"
# offline: no network, the encyclopedia still opens
adb shell svc wifi disable; adb shell svc data disable; sleep 1
adb shell am force-stop $PKG; adb shell am start -W -n $PKG/.MainActivity --es hash "#memory"; sleep 10
dump 7-offline; shot 7-offline
has 7-offline "ذاكرة موريتانيا" && ok "works offline" || ko "works offline"
adb shell svc wifi enable; adb shell svc data enable
# the other sections still open
for h in quran manazil tasbih qibla; do adb shell am start -n $PKG/.MainActivity --es hash "#$h"; sleep 3; done
shot 8-last
adb logcat -d > $OUT/logcat.txt
grep -i "Uncaught\|SyntaxError\|ReferenceError\|TypeError" $OUT/logcat.txt | grep -i "chromium\|console" > $OUT/js-errors.txt
[ -s $OUT/js-errors.txt ] && { ko "JavaScript errors"; cat $OUT/js-errors.txt | head -20; } || ok "no JavaScript errors"
grep -q "FATAL EXCEPTION" $OUT/logcat.txt && { ko "app crash"; grep -A15 "FATAL EXCEPTION" $OUT/logcat.txt | head -40; } || ok "no crash"
exit $FAIL
