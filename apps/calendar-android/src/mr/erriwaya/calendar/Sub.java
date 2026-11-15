package mr.erriwaya.calendar;

import android.content.Context;
import android.content.SharedPreferences;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;

/**
 * The subscription: the app is free for 24 hours after it is installed, then it stays locked until a yearly activation
 * code is entered.
 *
 * A code belongs to one phone. The phone shows its number (deviceId: ten letters derived from ANDROID_ID); the publisher
 * signs "mrcal-sub-1|<number>|<last day>" with the private key that only he holds (tools/sub-generator, never in the
 * repository) and sends the code back. The app checks the signature with the public key below, so a code cannot be made
 * without the private key, and it works with no network and no server.
 *
 * The 24 hours count from the day the app was installed (PackageManager.firstInstallTime), so clearing the app's data
 * does not restart them; phones that had the app before subscriptions existed count from LAUNCH. Setting the phone's
 * clock back does not help either: the latest time ever seen is kept and the clock is never read as earlier than it.
 */
final class Sub {
    private Sub() { }

    /** ECDSA P-256 public key (X.509 SubjectPublicKeyInfo, base64). The private key is the publisher's alone. */
    static final String PUBLIC_KEY =
            "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEmpp6jaY8qEcB5elMPxvKDOPF3EaShcTScHdYnyJgdEZRrHFcUgIhisV1h9rvT6UdLv3stWHDGgUEXKS2Xp9nGw==";
    static final long DAY = 86400000L;
    static final long TRIAL = DAY;
    /** 16 Nov 2026 00:00 UTC: installs older than the subscription start their 24 hours here. */
    static final long LAUNCH = 1794787200000L;
    private static final String PREFS = "sub";
    private static final String B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    /** Bytes in a code: the last day (2, days since 1970) and the signature (r and s, 32 each). */
    private static final int CODE_BYTES = 66, CODE_CHARS = 106;

    // ---------- the code itself (plain Java, no Android: tools/sub-generator/SubCheck.java tests it) ----------

    static String b32(byte[] d) {
        StringBuilder s = new StringBuilder();
        int buf = 0, bits = 0;
        for (byte x : d) {
            buf = (buf << 8) | (x & 255); bits += 8;
            while (bits >= 5) { s.append(B32.charAt((buf >> (bits - 5)) & 31)); bits -= 5; }
        }
        if (bits > 0) s.append(B32.charAt((buf << (5 - bits)) & 31));
        return s.toString();
    }

    static byte[] unb32(String s, int n) {
        byte[] out = new byte[n];
        int buf = 0, bits = 0, k = 0;
        for (int i = 0; i < s.length() && k < n; i++) {
            int v = B32.indexOf(s.charAt(i));
            if (v < 0) return null;
            buf = (buf << 5) | v; bits += 5;
            if (bits >= 8) { out[k++] = (byte) (buf >> (bits - 8)); bits -= 8; }
        }
        return k == n ? out : null;
    }

    /** Ten letters for a phone, from any string that identifies it. */
    static String idOf(String seed) {
        try {
            byte[] h = MessageDigest.getInstance("SHA-256").digest(("mrcal-device|" + seed).getBytes(StandardCharsets.UTF_8));
            return b32(h).substring(0, 10);
        } catch (Exception e) { return "AAAAAAAAAA"; }
    }

    /**
     * Finds the code in whatever was pasted (a whole message is fine): a run of code letters and dashes that is exactly a
     * code long; or, when the text is the code alone broken by spaces or lines, the text without them.
     */
    static String extract(String text) {
        if (text == null) return null;
        String up = text.toUpperCase(java.util.Locale.ROOT);
        StringBuilder run = new StringBuilder(), all = new StringBuilder();
        for (int i = 0; i <= up.length(); i++) {
            char c = i < up.length() ? up.charAt(i) : ' ';
            if (B32.indexOf(c) >= 0) { run.append(c); all.append(c); }
            else if (c != '-') { if (run.length() == CODE_CHARS) return run.toString(); run.setLength(0); }
        }
        return all.length() == CODE_CHARS ? all.toString() : null;
    }

    private static byte[] derInt(byte[] v, int off) {
        int i = off, end = off + 32;
        while (i < end - 1 && v[i] == 0) i++;
        boolean pad = (v[i] & 0x80) != 0;
        byte[] out = new byte[2 + (pad ? 1 : 0) + end - i];
        out[0] = 2; out[1] = (byte) (out.length - 2);
        System.arraycopy(v, i, out, out.length - (end - i), end - i);
        return out;
    }

    /** The last day (days since 1970) a code opens the app for this phone number, or -1 when the code is not valid for it. */
    static int lastDay(String deviceId, String pasted) {
        try {
            String code = extract(pasted);
            if (code == null) return -1;
            byte[] raw = unb32(code, CODE_BYTES);
            if (raw == null) return -1;
            int day = ((raw[0] & 255) << 8) | (raw[1] & 255);
            byte[] r = derInt(raw, 2), s = derInt(raw, 34);
            byte[] der = new byte[2 + r.length + s.length];
            der[0] = 0x30; der[1] = (byte) (r.length + s.length);
            System.arraycopy(r, 0, der, 2, r.length);
            System.arraycopy(s, 0, der, 2 + r.length, s.length);
            PublicKey key = KeyFactory.getInstance("EC").generatePublic(new X509EncodedKeySpec(decode64(PUBLIC_KEY)));
            Signature sig = Signature.getInstance("SHA256withECDSA");
            sig.initVerify(key);
            sig.update(("mrcal-sub-1|" + deviceId + "|" + day).getBytes(StandardCharsets.UTF_8));
            return sig.verify(der) ? day : -1;
        } catch (Exception e) { return -1; }
    }

    private static byte[] decode64(String s) {
        final String A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        java.io.ByteArrayOutputStream o = new java.io.ByteArrayOutputStream();
        int buf = 0, bits = 0;
        for (int i = 0; i < s.length(); i++) {
            int v = A.indexOf(s.charAt(i));
            if (v < 0) continue;
            buf = (buf << 6) | v; bits += 6;
            if (bits >= 8) { o.write((buf >> (bits - 8)) & 255); bits -= 8; }
        }
        return o.toByteArray();
    }

    // ---------- on the phone ----------

    static String deviceId(Context ctx) {
        String a = null;
        try { a = android.provider.Settings.Secure.getString(ctx.getContentResolver(), android.provider.Settings.Secure.ANDROID_ID); } catch (Exception ignored) { }
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (a == null || a.isEmpty()) {   // no ANDROID_ID (rare): a random number kept in the app's data
            a = sp.getString("rid", null);
            if (a == null) { a = java.util.UUID.randomUUID().toString(); sp.edit().putString("rid", a).apply(); }
        }
        return idOf(a);
    }

    /** The time, never earlier than the latest time already seen. */
    static long now(Context ctx) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        long t = System.currentTimeMillis(), seen = sp.getLong("seen", 0);
        if (t > seen + 60000) sp.edit().putLong("seen", t).apply();
        return Math.max(t, seen);
    }

    static long trialEnd(Context ctx) {
        long first = 0;
        try { first = ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0).firstInstallTime; } catch (Exception ignored) { }
        return Math.max(first, LAUNCH) + TRIAL;
    }

    /** The moment the paid year ends (0 without a valid code). */
    static long paidUntil(Context ctx) {
        String code = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("code", null);
        if (code == null) return 0;
        int d = lastDay(deviceId(ctx), code);
        return d < 0 ? 0 : (d + 1L) * DAY;
    }

    static boolean open(Context ctx) {
        long n = now(ctx);
        return n < trialEnd(ctx) || n < paidUntil(ctx);
    }

    /** "ok", "old" (a real code for this phone whose year has ended) or "bad". A valid code replaces the stored one. */
    static String activate(Context ctx, String pasted) {
        int d = lastDay(deviceId(ctx), pasted);
        if (d < 0) return "bad";
        if ((d + 1L) * DAY <= now(ctx)) return "old";
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("code", extract(pasted)).apply();
        AdhanReceiver.scheduleNext(ctx);
        CalendarWidget.updateAll(ctx);
        return "ok";
    }

    /** For the page: {"id","now","trialEnd","until","open"}. */
    static String state(Context ctx) {
        long n = now(ctx), t = trialEnd(ctx), u = paidUntil(ctx);
        return "{\"id\":\"" + deviceId(ctx) + "\",\"now\":" + n + ",\"trialEnd\":" + t + ",\"until\":" + u + ",\"open\":" + (n < t || n < u) + "}";
    }
}
