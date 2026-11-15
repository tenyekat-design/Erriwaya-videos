#!/usr/bin/env bash
# Checks the plain-Java half of Pay.java: a code it signs is accepted by Sub.java, and payment messages match as intended.
# usage: tools/sub-generator/PayCheck.sh <private-key-hex-file>     (needs a JDK)
set -euo pipefail
cd "$(dirname "$0")"
KEY=$(tr -d '[:space:]' < "$1")
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
S=../../src/mr/erriwaya/calendar
{ echo 'import java.nio.charset.StandardCharsets;import java.security.*;import java.security.spec.X509EncodedKeySpec;'
  echo 'class Sub { static final long DAY = 86400000L;'
  sed -n '/static final String PUBLIC_KEY/,/^    static final long DAY/p' $S/Sub.java | sed '$d'
  sed -n '/private static final String B32/,/^    \/\/ ---------- on the phone/p' $S/Sub.java | sed '$d'
  echo '}'; } > "$T/Sub.java"
{ echo 'import java.math.BigInteger;import java.nio.charset.StandardCharsets;import java.security.*;import java.security.interfaces.ECPublicKey;import java.security.spec.*;'
  echo 'public class PayCore {'
  sed -n '/^    \/\/ ---------- plain Java/,/^    \/\/ ---------- on the publisher/p' $S/Pay.java | sed '$d'
  cat <<'J'
    static int fails = 0;
    static void check(boolean ok, String what) { System.out.println((ok ? "ok   " : "FAIL ") + what); if (!ok) fails++; }
    public static void main(String[] a) {
        String id = Sub.idOf("a phone"); int day = 20800;
        String code = sign(a[0], id, day);
        check(code != null && Sub.lastDay(id, code) == day, "a signed code opens its phone");
        check(sign("11" + a[0].substring(2), id, day) == null, "another key is refused");
        String m1 = "Vous avez reçu un transfert de 200 MRU de la part de 44123456. ID: 1234567890. Solde: 5 430 MRU";
        check(matches(m1, "44123456", "", "200"), "payer number and amount");
        check(matches(m1, "+222 44 12 34 56", "", "200"), "number written with prefix and spaces");
        check(matches(m1, "", "1234567890", "200"), "reference and amount");
        check(!matches(m1, "44123457", "", "200"), "another number is refused");
        check(!matches(m1, "44123456", "", "20"), "amount 20 is not in 200");
        check(!matches(m1, "44123456", "", "430"), "430 is part of the balance 5 430, not the amount");
        check(matches("تم استلام 200.00 أوقية من 22244123456 رقم العملية TX9K2M4", "44123456", "", "200"), "Arabic message, 222 prefix, decimals");
        check(matches("تم استلام ٢٠٠ أوقية من ٤٤١٢٣٤٥٦", "44123456", "", "200"), "Arabic-Indic digits");
        check(matches("Reçu 1 200 MRU de 36 00 11 22", "36001122", "", "1200"), "thousands with a space");
        check(!matches("Reçu 2000 MRU de 44123456", "44123456", "", "200"), "2000 is not 200");
        check(!matches("Reçu 200,50 MRU de 44123456", "44123456", "", "200"), "200,50 is not 200");
        check(!matches("Reçu 200,000 MRU de 44123456", "44123456", "", "200"), "200,000 is not 200");
        check(!matches("Reçu 200 MRU", "44123456", "", "200"), "no payer in the message");
        check(!matches("Reçu 200 MRU ref AB12", "", "AB12", "200"), "a reference shorter than six is not enough");
        check(!matches(m1, "44123456", "", ""), "no amount set: nothing matches");
        if (fails > 0) System.exit(1);
    }
}
J
} > "$T/PayCore.java"
javac -d "$T" "$T/Sub.java" "$T/PayCore.java" 2>&1 | grep -v JAVA_TOOL_OPTIONS || true
java -cp "$T" PayCore "$KEY" 2>&1 | grep -v JAVA_TOOL_OPTIONS
