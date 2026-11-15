#!/usr/bin/env bash
# Checks that a code made by sign.js is accepted by the code-checking part of Sub.java (and that altered ones are not).
# usage: tools/sub-generator/SubCheck.sh <private-key-hex-file>     (needs node, npm install here, and a JDK)
set -euo pipefail
cd "$(dirname "$0")"
KEY=$(tr -d '[:space:]' < "$1")
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
# the plain-Java half of Sub.java, between its two section comments
{ echo 'import java.nio.charset.StandardCharsets;import java.security.*;import java.security.spec.X509EncodedKeySpec;'
  echo 'public class SubCore {'
  sed -n '/static final String PUBLIC_KEY/,/^    static final long DAY/p' ../../src/mr/erriwaya/calendar/Sub.java | sed '$d'
  sed -n '/private static final String B32/,/^    \/\/ ---------- on the phone/p' ../../src/mr/erriwaya/calendar/Sub.java | sed '$d'
  cat <<'J'
    public static void main(String[] a) {
        String id = a[0], code = a[1]; int day = Integer.parseInt(a[2]);
        check(lastDay(id, code) == day, "the code opens its phone");
        check(lastDay(id, "رمز التفعيل\nالجهاز: " + id.substring(0, 5) + "-" + id.substring(5) + "\nصالح حتى 15 نوفمبر 2027\n\n" + code + "\n\nانسخ هذه الرسالة") == day, "found inside a message");
        check(lastDay(id, code.replace("-", " ").toLowerCase()) == day, "spaces and small letters");
        check(lastDay(idOf("another phone"), code) == -1, "refused on another phone");
        char c = code.charAt(20) == 'A' ? 'B' : 'A';
        check(lastDay(id, code.substring(0, 20) + c + code.substring(21)) == -1, "refused when altered");
        String later = b32(new byte[]{(byte) ((day + 365) >> 8), (byte) (day + 365)}).substring(0, 3);
        check(lastDay(id, later + code.substring(3)) == -1, "refused with a later date");
        check(lastDay(id, "") == -1 && lastDay(id, null) == -1, "refused when empty");
        System.out.println("phone number of 'x': " + idOf("x"));
    }
    static void check(boolean ok, String what) { System.out.println((ok ? "ok   " : "FAIL ") + what); if (!ok) System.exit(1); }
}
J
} > "$T/SubCore.java"
ID=K7Q2M9XA4T; DAY=$(( $(date -u +%s) / 86400 + 365 ))
CODE=$(node --input-type=module -e "import {makeCode,publicKeyOf} from './sign.js';const c=makeCode('$KEY','$ID',$DAY);console.log(c.match(/.{1,6}/g).join('-'));console.error('public key: '+publicKeyOf('$KEY'))")
echo "code: $CODE"
javac -d "$T" "$T/SubCore.java" 2>&1 | grep -v JAVA_TOOL_OPTIONS || true
java -cp "$T" SubCore "$ID" "$CODE" "$DAY" 2>&1 | grep -v JAVA_TOOL_OPTIONS
