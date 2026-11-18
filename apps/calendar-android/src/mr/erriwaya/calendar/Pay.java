package mr.erriwaya.calendar;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.math.BigInteger;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECPrivateKeySpec;
import java.security.spec.X509EncodedKeySpec;

/**
 * Automatic activation, the publisher's side («اللاقط»). It runs only on the publisher's own phone, after he signs in on the
 * admin page, gives the app access to notifications, pastes his private key and turns it on.
 *
 * A subscriber who has paid sends a request from the lock screen (Firestore sub_requests/<phone number of the app>: the
 * money app used, the number he paid from, and the operation's reference if he has it). On the publisher's phone,
 * PayListener keeps the payment messages of the sources he trusts (the banks' apps, or the banks' SMS sender names).
 * sync() pairs each waiting request with an unused message that carries the subscription's amount and the payer's number
 * or the reference, signs a year's code for that phone (the same code tools/sub-generator makes) and writes it to
 * sub_codes/<number>; the subscriber's app picks it up and unlocks. A request that finds no message stays in the admin
 * page, where one tap confirms it by hand.
 */
final class Pay {
    private Pay() { }

    static final String PREFS = "pay";
    static final int YEAR_DAYS = 365, KEEP_MSGS = 150, KEEP_SOURCES = 40;
    static final long MSG_LIFE = 10 * Sub.DAY;

    // ---------- plain Java (tools/sub-generator/PayCheck.sh tests it) ----------

    /** The activation code for a phone number, valid to the end of `day` (days since 1970), or null with a wrong key. */
    static String sign(String keyHex, String deviceId, int day) {
        try {
            KeyFactory kf = KeyFactory.getInstance("EC");
            ECPublicKey pub = (ECPublicKey) kf.generatePublic(new X509EncodedKeySpec(Sub.decode64(Sub.PUBLIC_KEY)));
            PrivateKey key = kf.generatePrivate(new ECPrivateKeySpec(new BigInteger(keyHex.trim(), 16), pub.getParams()));
            Signature s = Signature.getInstance("SHA256withECDSA");
            s.initSign(key);
            s.update(("mrcal-sub-1|" + deviceId + "|" + day).getBytes(StandardCharsets.UTF_8));
            byte[] der = s.sign(), raw = new byte[66];
            raw[0] = (byte) (day >> 8); raw[1] = (byte) day;
            // DER: 30 len 02 rl r 02 sl s  ->  r and s, 32 bytes each
            int p = 2;
            if ((der[1] & 0x80) != 0) p += der[1] & 0x7f;
            for (int k = 0; k < 2; k++) {
                int len = der[p + 1] & 255, from = p + 2;
                while (len > 32) { from++; len--; }
                System.arraycopy(der, from, raw, 2 + 32 * k + (32 - len), len);
                p += 2 + (der[p + 1] & 255);
            }
            String code = Sub.b32(raw);
            return Sub.lastDay(deviceId, code) == day ? code : null;   // a key that is not the app's own makes codes that open nothing
        } catch (Exception e) { return null; }
    }

    /** Western digits for Arabic-Indic ones. */
    static String digits(String s) {
        StringBuilder b = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c >= '٠' && c <= '٩') c = (char) ('0' + c - '٠');
            else if (c >= '۰' && c <= '۹') c = (char) ('0' + c - '۰');
            b.append(c);
        }
        return b.toString();
    }

    private static final java.util.regex.Pattern NUM = java.util.regex.Pattern.compile(
            "(?<![0-9.,])(?:[0-9]{1,3}(?:[ \\u00a0\\u202f][0-9]{3})+|[0-9]+)(?![0-9])");

    /** True when the text carries the amount as a whole number: "200", "200.00", "200,00 MRU", "1 200"… not "2000", "1200" or "200,5". */
    static boolean hasAmount(String text, String amount) {
        String want = amount == null ? "" : digits(amount).replaceAll("[^0-9]", "");
        if (want.isEmpty()) return false;
        String t = digits(text);
        java.util.regex.Matcher m = NUM.matcher(t);
        while (m.find()) {
            if (!m.group().replaceAll("[^0-9]", "").equals(want)) continue;
            int j = m.end();
            if (j + 1 < t.length() && (t.charAt(j) == '.' || t.charAt(j) == ',') && Character.isDigit(t.charAt(j + 1))) {
                int k = j + 1; boolean zeros = true;
                while (k < t.length() && Character.isDigit(t.charAt(k))) { if (t.charAt(k) != '0') zeros = false; k++; }
                if (!zeros || k - j - 1 > 2) continue;   // 200.50, or 200,000
            }
            return true;
        }
        return false;
    }

    /** True when the text names the payer: his number (8 digits or more, however it is spaced or prefixed) or the reference. */
    static boolean hasPayer(String text, String phone, String ref) {
        String t = digits(text);
        String ph = phone == null ? "" : digits(phone).replaceAll("[^0-9]", "");
        if (ph.length() >= 8) {
            String last = ph.substring(ph.length() - 8);
            // every run of digits in the text, read through the separators people put inside phone numbers
            StringBuilder run = new StringBuilder();
            for (int i = 0; i <= t.length(); i++) {
                char c = i < t.length() ? t.charAt(i) : 'x';
                if (Character.isDigit(c)) run.append(c);
                else if (run.length() > 0 && (c == ' ' || c == '-' || c == '.' || c == ' ') && i + 1 < t.length() && Character.isDigit(t.charAt(i + 1))) { /* inside a number */ }
                else {
                    if (run.length() >= 8 && run.length() <= 13 && run.toString().endsWith(last)) return true;
                    run.setLength(0);
                }
            }
            // and plainly, for numbers glued to other digits by the separators above
            if (t.replaceAll("[^0-9]+", " ").contains(last)) {
                for (String w : t.replaceAll("[^0-9]+", " ").trim().split(" ")) if (w.length() >= 8 && w.length() <= 13 && w.endsWith(last)) return true;
            }
        }
        String r = ref == null ? "" : digits(ref).toUpperCase(java.util.Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        if (r.length() >= 6) {
            String flat = t.toUpperCase(java.util.Locale.ROOT).replaceAll("[^A-Z0-9]+", " ");
            for (String w : flat.split(" ")) if (w.equals(r)) return true;
        }
        return false;
    }

    static boolean matches(String text, String phone, String ref, String amount) {
        return text != null && hasAmount(text, amount) && hasPayer(text, phone, ref);
    }

    // ---------- on the publisher's phone ----------

    static SharedPreferences sp(Context ctx) { return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static boolean on(Context ctx) { SharedPreferences p = sp(ctx); return p.getBoolean("on", false) && p.getString("key", null) != null; }

    static boolean access(Context ctx) {
        try {
            String s = android.provider.Settings.Secure.getString(ctx.getContentResolver(), "enabled_notification_listeners");
            return s != null && s.contains(ctx.getPackageName() + "/");
        } catch (Exception e) { return false; }
    }

    static JSONArray arr(Context ctx, String k) {
        try { return new JSONArray(sp(ctx).getString(k, "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    static boolean trusted(Context ctx, String pkg, String title) {
        JSONArray t = arr(ctx, "trust");
        for (int i = 0; i < t.length(); i++) {
            String k = t.optString(i);
            if (k.equals(pkg) || k.equals(pkg + "|" + title)) return true;
        }
        return false;
    }

    /** A notification arrived (PayListener). From a trusted source it is kept whole; otherwise only who sent it is noted. */
    static synchronized boolean note(Context ctx, String pkg, String label, String title, String text, long when) {
        try {
            boolean ok = trusted(ctx, pkg, title);
            JSONArray src = arr(ctx, "sources"), out = new JSONArray();
            String k = pkg + "|" + title;
            out.put(new JSONObject().put("k", k).put("pkg", pkg).put("label", label).put("title", title).put("t", when));
            for (int i = 0; i < src.length() && out.length() < KEEP_SOURCES; i++) if (!k.equals(src.getJSONObject(i).optString("k"))) out.put(src.getJSONObject(i));
            SharedPreferences.Editor e = sp(ctx).edit().putString("sources", out.toString());
            if (ok) {
                JSONArray m = arr(ctx, "msgs"), keep = new JSONArray();
                String body = text.length() > 600 ? text.substring(0, 600) : text;
                for (int i = 0; i < m.length(); i++) {   // the same message posted twice (a notification updated) is one message
                    JSONObject o = m.getJSONObject(i);
                    if (o.optString("text").equals(body) && o.optString("pkg").equals(pkg)) { e.apply(); return false; }
                }
                keep.put(new JSONObject().put("t", when).put("pkg", pkg).put("label", label).put("title", title).put("text", body).put("used", ""));
                for (int i = 0; i < m.length() && keep.length() < KEEP_MSGS; i++)
                    if (when - m.getJSONObject(i).optLong("t") < MSG_LIFE) keep.put(m.getJSONObject(i));
                e.putString("msgs", keep.toString());
            }
            e.apply();
            return ok;
        } catch (Exception e) { return false; }
    }

    /** An ID token for the admin's account, from the sign-in kept by the suggestions page (SuggestJob). */
    static String token(Context ctx) {
        try {
            SharedPreferences s = ctx.getSharedPreferences(SuggestJob.PREFS, Context.MODE_PRIVATE);
            String rt = s.getString("rt", null);
            if (rt == null) return null;
            String tok = SuggestJob.http("https://securetoken.googleapis.com/v1/token?key=" + SuggestJob.KEY, "application/x-www-form-urlencoded",
                    "grant_type=refresh_token&refresh_token=" + URLEncoder.encode(rt, "UTF-8"), null);
            if (tok == null) return null;
            JSONObject t = new JSONObject(tok);
            s.edit().putString("rt", t.optString("refresh_token", rt)).apply();
            return t.getString("id_token");
        } catch (Exception e) { return null; }
    }

    private static JSONObject str(String v) throws Exception { return new JSONObject().put("stringValue", v); }

    /** Writes the code for a phone and marks its request done, in one commit. */
    static boolean deliver(String token, String id, String code, int day, String how) { return deliver(token, id, code, day, how, "one"); }

    /** plan "family": the code's document also says so, and keeps the phones added to it (fam, up to FAMILY). */
    static boolean deliver(String token, String id, String code, int day, String how, String plan) {
        return deliver(token, id, code, day, how, plan, null, null);
    }

    /** With the key and the phone's current document: a family renewal keeps its phones, each re-signed to the new day. */
    static boolean deliver(String token, String id, String code, int day, String how, String plan, String key, JSONObject cur) {
        try {
            String docs = SuggestJob.FS.substring(SuggestJob.FS.indexOf("projects/"));
            JSONObject fields = new JSONObject().put("code", str(code)).put("day", new JSONObject().put("integerValue", String.valueOf(day)))
                    .put("how", str(how)).put("t", new JSONObject().put("timestampValue", SuggestJob.iso(System.currentTimeMillis())));
            JSONArray extra = new JSONArray();
            if ("family".equals(plan)) {
                String fam = cur != null && "family".equals(sv(cur, "plan")) && dayOf(cur) >= System.currentTimeMillis() / Sub.DAY ? sv(cur, "fam") : "";
                StringBuilder kept = new StringBuilder();
                for (String m : fam.split(",")) {
                    if (!m.matches("[A-Z2-7]{10}") || key == null) continue;
                    String mc = sign(key, m, day);
                    if (mc == null) continue;
                    extra.put(new JSONObject().put("update", new JSONObject().put("name", docs + "/sub_codes/" + m)
                            .put("fields", new JSONObject().put("code", str(mc)).put("day", new JSONObject().put("integerValue", String.valueOf(day)))
                                    .put("how", str("family:" + id)).put("t", new JSONObject().put("timestampValue", SuggestJob.iso(System.currentTimeMillis()))))));
                    if (kept.length() > 0) kept.append(',');
                    kept.append(m);
                }
                fields.put("plan", str("family")).put("fam", str(kept.toString()));
            }
            JSONObject w1 = new JSONObject().put("update", new JSONObject().put("name", docs + "/sub_codes/" + id).put("fields", fields));
            JSONObject w2 = new JSONObject().put("update", new JSONObject().put("name", docs + "/sub_requests/" + id)
                    .put("fields", new JSONObject().put("status", str("done"))))
                    .put("updateMask", new JSONObject().put("fieldPaths", new JSONArray().put("status")))
                    .put("currentDocument", new JSONObject().put("exists", true));
            JSONArray all = new JSONArray().put(w1).put(w2), alone = new JSONArray().put(w1);
            for (int i = 0; i < extra.length(); i++) { all.put(extra.get(i)); alone.put(extra.get(i)); }
            String url = SuggestJob.FS.replaceAll("/documents$", "") + "/documents:commit";
            if (SuggestJob.http(url, "application/json", new JSONObject().put("writes", all).toString(), token) != null) return true;
            // no request document (a code made by hand for a phone that never asked): the code alone
            return SuggestJob.http(url, "application/json", new JSONObject().put("writes", alone).toString(), token) != null;
        } catch (Exception e) { return false; }
    }

    /** A family subscription: the payer's phone and up to FAMILY more, each with its own code, all ending the same day. */
    static final int FAMILY = 4;

    private static String sv(JSONObject f, String k) { return f.optJSONObject(k) == null ? "" : f.optJSONObject(k).optString("stringValue"); }

    /**
     * The phones a family subscriber added (sub_family/<payer>: members, status "new"): each gets a code for the payer's
     * day, while the family has room; the payer's sub_codes document keeps them (fam). Returns how many were activated.
     */
    static int family(String key, String tok) {
        int done = 0;
        try {
            String docs = SuggestJob.FS.substring(SuggestJob.FS.indexOf("projects/"));
            String url = SuggestJob.FS.replaceAll("/documents$", "") + "/documents:commit";
            JSONObject q = new JSONObject().put("structuredQuery", new JSONObject()
                    .put("from", new JSONArray().put(new JSONObject().put("collectionId", "sub_family")))
                    .put("where", new JSONObject().put("fieldFilter", new JSONObject()
                            .put("field", new JSONObject().put("fieldPath", "status")).put("op", "EQUAL").put("value", str("new"))))
                    .put("limit", 40));
            String res = SuggestJob.http(SuggestJob.FS + ":runQuery", "application/json", q.toString(), tok);
            if (res == null) return 0;
            JSONArray a = new JSONArray(res);
            for (int i = 0; i < a.length(); i++) {
                JSONObject d = a.getJSONObject(i).optJSONObject("document");
                if (d == null) continue;
                String name = d.optString("name"), owner = name.substring(name.lastIndexOf('/') + 1);
                JSONObject f = d.optJSONObject("fields");
                if (f == null || !owner.matches("[A-Z2-7]{10}")) continue;
                java.util.List<String> want = new java.util.ArrayList<>();
                JSONObject mv = f.optJSONObject("members");
                JSONArray vals = mv == null || mv.optJSONObject("arrayValue") == null ? null : mv.getJSONObject("arrayValue").optJSONArray("values");
                if (vals != null) for (int k = 0; k < vals.length(); k++) want.add(vals.getJSONObject(k).optString("stringValue"));
                // the payer's code: a family one, still running?
                String got = SuggestJob.http(SuggestJob.FS + ":batchGet", "application/json",
                        new JSONObject().put("documents", new JSONArray().put(docs + "/sub_codes/" + owner)).toString(), tok);
                JSONObject of = null;
                if (got != null) {
                    JSONArray g = new JSONArray(got);
                    if (g.length() > 0 && g.getJSONObject(0).optJSONObject("found") != null) of = g.getJSONObject(0).getJSONObject("found").optJSONObject("fields");
                }
                JSONArray writes = new JSONArray();
                String status = "refused";
                if (of != null && "family".equals(sv(of, "plan"))) {
                    int day = Integer.parseInt(of.optJSONObject("day") == null ? "0" : of.getJSONObject("day").optString("integerValue", "0"));
                    java.util.LinkedHashSet<String> fam = new java.util.LinkedHashSet<>();
                    for (String x : sv(of, "fam").split(",")) if (x.matches("[A-Z2-7]{10}")) fam.add(x);
                    if (day > System.currentTimeMillis() / Sub.DAY) {
                        status = "done";
                        for (String m : want) {
                            if (!m.matches("[A-Z2-7]{10}") || m.equals(owner) || fam.contains(m)) continue;
                            if (fam.size() >= FAMILY) { status = "full"; break; }
                            String code = sign(key, m, day);
                            if (code == null) continue;
                            writes.put(new JSONObject().put("update", new JSONObject().put("name", docs + "/sub_codes/" + m)
                                    .put("fields", new JSONObject().put("code", str(code)).put("day", new JSONObject().put("integerValue", String.valueOf(day)))
                                            .put("how", str("family:" + owner)).put("t", new JSONObject().put("timestampValue", SuggestJob.iso(System.currentTimeMillis()))))));
                            fam.add(m);
                            done++;
                        }
                        writes.put(new JSONObject().put("update", new JSONObject().put("name", docs + "/sub_codes/" + owner)
                                .put("fields", new JSONObject().put("fam", str(android.text.TextUtils.join(",", fam)))))
                                .put("updateMask", new JSONObject().put("fieldPaths", new JSONArray().put("fam"))));
                    } else status = "ended";
                }
                writes.put(new JSONObject().put("update", new JSONObject().put("name", docs + "/sub_family/" + owner)
                        .put("fields", new JSONObject().put("status", str(status))))
                        .put("updateMask", new JSONObject().put("fieldPaths", new JSONArray().put("status"))));
                if (SuggestJob.http(url, "application/json", new JSONObject().put("writes", writes).toString(), tok) == null) done = Math.max(0, done - want.size());
            }
        } catch (Exception ignored) { }
        return done;
    }

    static int yearFromNow() { return (int) (System.currentTimeMillis() / Sub.DAY) + YEAR_DAYS; }

    /** The phone's sub_codes document (its fields), or null when it has none or the account cannot be read. */
    static JSONObject current(String tok, String id) {
        try {
            String docs = SuggestJob.FS.substring(SuggestJob.FS.indexOf("projects/"));
            String got = SuggestJob.http(SuggestJob.FS + ":batchGet", "application/json",
                    new JSONObject().put("documents", new JSONArray().put(docs + "/sub_codes/" + id)).toString(), tok);
            if (got == null) return null;
            JSONArray g = new JSONArray(got);
            return g.length() > 0 && g.getJSONObject(0).optJSONObject("found") != null ? g.getJSONObject(0).getJSONObject("found").optJSONObject("fields") : null;
        } catch (Exception e) { return null; }
    }

    private static int dayOf(JSONObject f) {
        try { return f == null || f.optJSONObject("day") == null ? -1 : Integer.parseInt(f.getJSONObject("day").optString("integerValue", "-1")); }
        catch (Exception e) { return -1; }
    }

    /**
     * The last day of a new paid year (the owner's choice, 18 Nov 2026): a year added to what is left of the running
     * subscription, so a renewal before the end loses no day and two payments make two years; from today otherwise.
     */
    static int nextDay(JSONObject cur) {
        int today = (int) (System.currentTimeMillis() / Sub.DAY), d = dayOf(cur);
        return (d >= today ? d : today) + YEAR_DAYS;
    }

    /** Pairs the waiting requests with the kept messages; returns how many phones were activated (-1: could not reach the account). */
    static synchronized int sync(Context ctx) {
        try {
            SharedPreferences p = sp(ctx);
            String key = p.getString("key", null), amount = p.getString("amount", ""), famAmount = p.getString("famAmount", "");
            if (key == null || !p.getBoolean("on", false)) return 0;
            String tok = token(ctx);
            if (tok == null) return -1;
            JSONObject q = new JSONObject().put("structuredQuery", new JSONObject()
                    .put("from", new JSONArray().put(new JSONObject().put("collectionId", "sub_requests")))
                    .put("where", new JSONObject().put("fieldFilter", new JSONObject()
                            .put("field", new JSONObject().put("fieldPath", "status")).put("op", "EQUAL").put("value", str("new"))))
                    .put("limit", 60));
            String res = SuggestJob.http(SuggestJob.FS + ":runQuery", "application/json", q.toString(), tok);
            if (res == null) return -1;
            JSONArray a = new JSONArray(res), msgs = arr(ctx, "msgs");
            java.util.Set<String> told = new java.util.HashSet<>(p.getStringSet("told", new java.util.HashSet<String>()));
            int done = 0, waiting = 0; String lastId = "";
            for (int i = 0; i < a.length(); i++) {
                JSONObject d = a.getJSONObject(i).optJSONObject("document");
                if (d == null) continue;
                JSONObject f = d.optJSONObject("fields");
                if (f == null) continue;
                String id = f.optJSONObject("id") == null ? "" : f.getJSONObject("id").optString("stringValue");
                String phone = f.optJSONObject("phone") == null ? "" : f.getJSONObject("phone").optString("stringValue");
                String ref = f.optJSONObject("ref") == null ? "" : f.getJSONObject("ref").optString("stringValue");
                String stamp = f.optJSONObject("t") == null ? "" : f.getJSONObject("t").optString("timestampValue");
                String plan = "family".equals(sv(f, "plan")) ? "family" : "one", want = "family".equals(plan) ? famAmount : amount;
                if (want.isEmpty()) want = amount;
                if (!id.matches("[A-Z2-7]{10}")) continue;
                boolean hit = false;
                for (int k = 0; k < msgs.length() && !hit; k++) {
                    JSONObject m = msgs.getJSONObject(k);
                    if (!m.optString("used").isEmpty() || !matches(m.optString("text"), phone, ref, want)) continue;
                    JSONObject cur = current(tok, id);
                    int day = nextDay(cur);
                    String code = sign(key, id, day);
                    if (code != null && deliver(tok, id, code, day, "auto", plan, key, cur)) {
                        m.put("used", id); hit = true; done++; lastId = id;
                    }
                }
                if (!hit && told.add(id + "@" + stamp)) { waiting++; lastId = id; }
            }
            int fam = family(key, tok);
            if (fam > 0) SuggestJob.notify(ctx, fam == 1 ? "أُضيف هاتف إلى اشتراك عائلي" : "أُضيف " + fam + " هواتف إلى اشتراكات عائلية",
                    "فُتح التطبيق تلقائيًا لأفراد العائلة", "#sub-admin", 4210);
            p.edit().putString("msgs", msgs.toString()).putStringSet("told", told).putLong("synced", System.currentTimeMillis()).apply();
            if (done > 0) SuggestJob.notify(ctx, done == 1 ? "تم تفعيل اشتراك تلقائيًا" : "تم تفعيل " + done + " اشتراكات تلقائيًا",
                    "وصل الدفع وفُتح التطبيق للمشترك " + lastId.substring(0, 5) + "-" + lastId.substring(5), "#sub-admin", 4208);
            if (waiting > 0) SuggestJob.notify(ctx, waiting == 1 ? "طلب اشتراك ينتظر" : waiting + " طلبات اشتراك تنتظر",
                    "لم تصل بعدُ رسالة دفع تطابقه. افتح الصفحة لتأكيده يدويًا إن كان الدفع قد وصل.", "#sub-admin", 4209);
            return done;
        } catch (Exception e) { return -1; }
    }

    /** For the admin page. */
    static String state(Context ctx) {
        try {
            SharedPreferences p = sp(ctx);
            boolean listener = true;   // false in the public build, which has no notification listener (see AndroidManifest.xml)
            try { ctx.getPackageManager().getServiceInfo(new android.content.ComponentName(ctx, PayListener.class), 0); } catch (Exception e) { listener = false; }
            return new JSONObject().put("listener", listener).put("key", p.getString("key", null) != null).put("on", p.getBoolean("on", false))
                    .put("access", access(ctx)).put("signed", ctx.getSharedPreferences(SuggestJob.PREFS, Context.MODE_PRIVATE).getString("rt", null) != null)
                    .put("amount", p.getString("amount", "")).put("famAmount", p.getString("famAmount", "")).put("synced", p.getLong("synced", 0))
                    .put("trust", arr(ctx, "trust")).put("sources", arr(ctx, "sources")).put("msgs", arr(ctx, "msgs")).toString();
        } catch (Exception e) { return "{}"; }
    }

    /** From the admin page: {"key":"<hex>"|"" , "on":bool, "amount":"200", "trust":[…]} (any subset). Returns "" or what is wrong. */
    static String set(Context ctx, String json) {
        try {
            JSONObject o = new JSONObject(json);
            SharedPreferences.Editor e = sp(ctx).edit();
            if (o.has("key")) {
                String k = o.getString("key").replaceAll("[^0-9a-fA-F]", "");
                if (k.isEmpty()) e.remove("key").putBoolean("on", false);
                else if (k.length() != 64 || sign(k, "AAAAAAAAAA", 20000) == null) return "key";
                else e.putString("key", k);
            }
            if (o.has("on")) e.putBoolean("on", o.getBoolean("on"));
            if (o.has("amount")) e.putString("amount", digits(o.getString("amount")).replaceAll("[^0-9]", ""));
            if (o.has("famAmount")) e.putString("famAmount", digits(o.getString("famAmount")).replaceAll("[^0-9]", ""));
            if (o.has("trust")) e.putString("trust", o.getJSONArray("trust").toString());
            e.apply();
            return "";
        } catch (Exception e) { return "bad"; }
    }

    /** A code made by hand from the admin page (one tap on a waiting request): "" when there is no key. */
    static String manual(Context ctx, String id, boolean deliverIt) { return manual(ctx, id, deliverIt, "one"); }

    static String manual(Context ctx, String id, boolean deliverIt, String plan) {
        String key = sp(ctx).getString("key", null);
        if (key == null || id == null || !id.matches("[A-Z2-7]{10}")) return "";
        String tok = token(ctx);
        JSONObject cur = tok == null ? null : current(tok, id);
        int day = nextDay(cur);
        String code = sign(key, id, day);
        if (code == null) return "";
        if (deliverIt) {
            if (tok == null || !deliver(tok, id, code, day, "manual", plan, key, cur)) return "";
        }
        return code;
    }
}
