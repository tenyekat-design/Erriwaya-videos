#!/usr/bin/env bash
# Builds dist/mauritania-calendar.apk (and dist/mauritania-calendar-publisher.apk, the publisher's own) with the Android SDK's command-line tools (no Gradle).
# Needs ANDROID_HOME (preinstalled on GitHub's ubuntu runners) and a JDK. Run from this folder.
set -euo pipefail
cd "$(dirname "$0")"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:?set ANDROID_HOME}}"
BT=$(ls -d "$SDK"/build-tools/* | sort -V | tail -1)
PLAT=$(ls -d "$SDK"/platforms/android-[0-9]* | sort -V | tail -1)/android.jar
VERSION_NAME=${VERSION_NAME:-1.0}
VERSION_CODE=${VERSION_CODE:-1}
echo "build-tools: $BT"; echo "platform: $PLAT"
rm -rf build && mkdir -p build/gen build/classes build/dex dist
# the page shows its version (CI checkout only; the source keeps the placeholder)
cp -r assets build/assets && sed -i "s/__APP_VERSION__/$VERSION_NAME/" build/assets/index.html
"$BT/aapt2" compile --dir res -o build/res.zip
# Two APKs from the same code: the public one, and the publisher's own, which alone declares the notification listener
# that catches the banks' payment messages (see PUBLISHER-ONLY in AndroidManifest.xml).
python3 - <<'PY'
import re
m = open('AndroidManifest.xml', encoding='utf-8').read()
open('build/manifest-publisher.xml', 'w', encoding='utf-8').write(m)
pub, n = re.subn(r'<!-- PUBLISHER-ONLY.*?<!-- /PUBLISHER-ONLY -->', '', m, flags=re.S)
assert n == 1 and 'PayListener' not in pub and 'NOTIFICATION_LISTENER' not in pub
open('build/manifest-public.xml', 'w', encoding='utf-8').write(pub)
PY
"$BT/aapt2" link -o build/unsigned-public.apk -I "$PLAT" --manifest build/manifest-public.xml \
  -A build/assets -0 wav -0 m4a --java build/gen --min-sdk-version 21 --target-sdk-version 36 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" build/res.zip
"$BT/aapt2" link -o build/unsigned-publisher.apk -I "$PLAT" --manifest build/manifest-publisher.xml \
  -A build/assets -0 wav -0 m4a --min-sdk-version 21 --target-sdk-version 36 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" build/res.zip
javac --release 11 -classpath "$PLAT" -d build/classes $(find src build/gen -name '*.java')
"$BT/d8" --release --lib "$PLAT" --min-api 21 --output build/dex $(find build/classes -name '*.class')
for v in public publisher; do
  (cd build/dex && zip -q -u ../unsigned-$v.apk classes.dex)
  "$BT/zipalign" -f -p 4 build/unsigned-$v.apk build/aligned-$v.apk
done
# signing/calendar-release.jks is encrypted (PKCS12, AES-256) with a long random password that is
# NOT in the repository: CI passes it as the secret KEYSTORE_PASS. Without it nothing can be signed.
KS=signing/calendar-release.jks
# accept the password from either secret, ignoring stray spaces or line breaks from pasting
PW=""
for c in "${KEYSTORE_PASS:-}" "${KEYSTORE_ALT:-}"; do
  c=$(printf '%s' "$c" | tr -d '[:space:]'); [ -n "$c" ] || continue
  if KP="$c" keytool -list -keystore "$KS" -storepass:env KP >/dev/null 2>&1; then PW=$c; break; fi
done
if [ -z "$PW" ]; then echo "Signing password missing or wrong (secret CALENDAR_KEYSTORE_PASS)" >&2; exit 1; fi
KEYSTORE_PASS=$PW
export KEYSTORE_PASS
for v in public publisher; do
  out=dist/mauritania-calendar.apk; [ $v = publisher ] && out=dist/mauritania-calendar-publisher.apk
  "$BT/apksigner" sign --ks "$KS" --ks-pass env:KEYSTORE_PASS \
    --key-pass env:KEYSTORE_PASS --ks-key-alias calendar \
    --out $out build/aligned-$v.apk
  "$BT/apksigner" verify --print-certs $out | head -3
  ls -l $out
done
# the public APK must not carry what Play Protect blocks
if "$BT/aapt2" dump xmltree dist/mauritania-calendar.apk --file AndroidManifest.xml | grep -q "PayListener\|NOTIFICATION_LISTENER"; then
  echo "the public APK declares the notification listener" >&2; exit 1
fi
