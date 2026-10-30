"""Switch the release signing to the Play Store upload key (android-ci/upload.p12) before `flutter build appbundle`.

The APKs on GitHub Releases stay signed with the fixed debug key so phones that installed them keep updating.
The store bundle is signed with the upload key; its password comes from the UPLOAD_KEY_PASSWORD secret.
Google Play re-signs the app with its own key (Play App Signing), so a lost upload key can be reset in Play Console.
"""
import os
import sys

root = sys.argv[1] if len(sys.argv) > 1 else "."
pw = os.environ["UPLOAD_KEY_PASSWORD"]
p = os.path.join(root, "android", "app", "build.gradle.kts")
g = open(p, encoding="utf-8").read()
block = f'''        create("upload") {{
            storeFile = file("../../android-ci/upload.p12")
            storeType = "PKCS12"
            storePassword = "{pw}"
            keyAlias = "upload"
            keyPassword = "{pw}"
        }}
'''
if 'create("upload")' not in g:
    g = g.replace('        create("erriwaya") {', block + '        create("erriwaya") {', 1)
    g = g.replace('signingConfig = signingConfigs.getByName("erriwaya")', 'signingConfig = signingConfigs.getByName("upload")')
assert 'getByName("upload")' in g, "release signing not switched"
open(p, "w", encoding="utf-8").write(g)
print("release signing -> upload key")
