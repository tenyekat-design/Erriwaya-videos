#!/usr/bin/env bash
# Builds dist/mauritania-calendar.apk with the Android SDK's command-line tools (no Gradle).
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
"$BT/aapt2" link -o build/unsigned.apk -I "$PLAT" --manifest AndroidManifest.xml \
  -A build/assets -0 wav -0 m4a --java build/gen --min-sdk-version 21 --target-sdk-version 34 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" build/res.zip
javac --release 11 -classpath "$PLAT" -d build/classes $(find src build/gen -name '*.java')
"$BT/d8" --release --lib "$PLAT" --min-api 21 --output build/dex $(find build/classes -name '*.class')
(cd build/dex && zip -q -u ../unsigned.apk classes.dex)
"$BT/zipalign" -f -p 4 build/unsigned.apk build/aligned.apk
# signing/calendar-release.jks is encrypted (PKCS12, AES-256) with a long random password that is
# NOT in the repository: CI passes it as the secret KEYSTORE_PASS. Without it nothing can be signed.
KS=signing/calendar-release.jks
if [ -z "${KEYSTORE_PASS:-}" ]; then echo "No signing password: set KEYSTORE_PASS" >&2; exit 1; fi
export KEYSTORE_PASS
"$BT/apksigner" sign --ks "$KS" --ks-pass env:KEYSTORE_PASS \
  --key-pass env:KEYSTORE_PASS --ks-key-alias calendar \
  --out dist/mauritania-calendar.apk build/aligned.apk
"$BT/apksigner" verify --print-certs dist/mauritania-calendar.apk | head -3
ls -l dist/mauritania-calendar.apk
