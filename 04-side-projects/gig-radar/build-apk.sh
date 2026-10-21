#!/usr/bin/env bash
# build/www(웹 페이지) + android/ 로 서명된 APK를 Gradle 없이 만든다.
# 필요: JDK 17+, Ubuntu 패키지 aapt apksigner zipalign android-sdk-platform-23 dalvik-exchange
set -euo pipefail
cd "$(dirname "$0")"

SDK=${ANDROID_SDK:-/usr/lib/android-sdk}
JAR=$SDK/platforms/android-23/android.jar
VERSION_CODE=${VERSION_CODE:-1}
VERSION_NAME=${VERSION_NAME:-0.1.0}
OUT=public/download/gig-radar.apk
KS=${KEYSTORE:-android/gig-radar.keystore}
KS_PASS=${KEYSTORE_PASS:-gigradar}

python3 build.py app
rm -rf build/apk && mkdir -p build/apk/assets build/apk/classes build/apk/dex public/download
cp -r build/www build/apk/assets/www

aapt2 compile --dir android/res -o build/apk/res.zip
aapt2 link -o build/apk/unsigned.apk -I "$JAR" \
  --manifest android/AndroidManifest.xml \
  --min-sdk-version 26 --target-sdk-version 34 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" \
  -A build/apk/assets build/apk/res.zip

javac -nowarn -source 8 -target 8 -bootclasspath "$JAR" -d build/apk/classes \
  $(find android/src -name '*.java') 2>build/apk/javac.log || { cat build/apk/javac.log; exit 1; }
dalvik-exchange --dex --min-sdk-version=26 --output=build/apk/dex/classes.dex build/apk/classes
(cd build/apk/dex && zip -q ../unsigned.apk classes.dex)

zipalign -p -f 4 build/apk/unsigned.apk build/apk/aligned.apk

if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -storepass "$KS_PASS" -keypass "$KS_PASS" -alias gigradar \
    -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Gig Radar" >/dev/null 2>&1
fi
apksigner sign --ks "$KS" --ks-pass pass:"$KS_PASS" --ks-key-alias gigradar --out "$OUT" build/apk/aligned.apk
apksigner verify --print-certs "$OUT" | head -2
ls -la "$OUT"
