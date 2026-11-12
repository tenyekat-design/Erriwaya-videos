package mr.erriwaya.calendar;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * On the admin's phone only (after signing in on the «اقتراحات القرى» page): about every 15 minutes, asks Firestore for
 * village suggestions newer than the last one seen, and raises a notification that opens that page.
 * The sign-in is kept as the Firebase refresh token; signing out removes it and cancels the job.
 */
public class SuggestJob extends JobService {
    static final String PREFS = "suggest", CHANNEL = "suggest_1";
    static final int JOB_ID = 4207;
    static final String KEY = "AIzaSyBAPju15XYiYBEq7_AKVzqdd6KpVvH6Orc";
    static final String FS = "https://firestore.googleapis.com/v1/projects/erriwaya-68022/databases/(default)/documents";

    /** From the page: the refresh token after signing in ("" on signing out). */
    static void setAdmin(Context ctx, String rt) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JobScheduler js = (JobScheduler) ctx.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if (rt == null || rt.isEmpty()) {
            sp.edit().clear().apply();
            if (js != null) js.cancel(JOB_ID);
            return;
        }
        SharedPreferences.Editor e = sp.edit().putString("rt", rt);
        if (!sp.contains("seen")) e.putString("seen", iso(System.currentTimeMillis()));   // only what arrives from now on
        e.apply();
        if (js == null) return;
        JobInfo.Builder b = new JobInfo.Builder(JOB_ID, new ComponentName(ctx, SuggestJob.class))
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setPersisted(true)
                .setPeriodic(15 * 60 * 1000L);
        try { js.schedule(b.build()); } catch (Exception ignored) { }
    }

    static String iso(long ms) {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        f.setTimeZone(TimeZone.getTimeZone("UTC"));
        return f.format(new Date(ms));
    }

    @Override
    public boolean onStartJob(JobParameters params) {
        new Thread(() -> {
            try { check(getApplicationContext()); } catch (Exception ignored) { }
            jobFinished(params, false);
        }).start();
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters params) { return true; }

    static void check(Context ctx) throws Exception {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String rt = sp.getString("rt", null), seen = sp.getString("seen", iso(System.currentTimeMillis()));
        if (rt == null) return;
        // a fresh ID token from the refresh token
        String tok = http("https://securetoken.googleapis.com/v1/token?key=" + KEY, "application/x-www-form-urlencoded",
                "grant_type=refresh_token&refresh_token=" + URLEncoder.encode(rt, "UTF-8"), null);
        if (tok == null) return;
        JSONObject t = new JSONObject(tok);
        String id = t.getString("id_token");
        sp.edit().putString("rt", t.optString("refresh_token", rt)).apply();
        // the suggestions that arrived since the last one seen
        JSONObject q = new JSONObject().put("structuredQuery", new JSONObject()
                .put("from", new JSONArray().put(new JSONObject().put("collectionId", "village_suggestions")))
                .put("where", new JSONObject().put("fieldFilter", new JSONObject()
                        .put("field", new JSONObject().put("fieldPath", "t")).put("op", "GREATER_THAN")
                        .put("value", new JSONObject().put("timestampValue", seen))))
                .put("orderBy", new JSONArray().put(new JSONObject().put("field", new JSONObject().put("fieldPath", "t")).put("direction", "ASCENDING")))
                .put("limit", 50));
        String res = http(FS + ":runQuery", "application/json", q.toString(), id);
        if (res == null) return;
        JSONArray a = new JSONArray(res);
        int n = 0; String last = seen, name = "";
        for (int i = 0; i < a.length(); i++) {
            JSONObject d = a.getJSONObject(i).optJSONObject("document");
            if (d == null) continue;
            JSONObject f = d.optJSONObject("fields");
            if (f == null) continue;
            JSONObject tt = f.optJSONObject("t");
            if (tt != null) last = tt.optString("timestampValue", last);
            JSONObject st = f.optJSONObject("status");
            if (st != null && !"new".equals(st.optString("stringValue"))) continue;
            n++;
            JSONObject nm = f.optJSONObject("name");
            JSONObject kd = f.optJSONObject("kind");
            if (nm != null) name = ("fix".equals(kd == null ? "" : kd.optString("stringValue")) ? "تصحيح: " : "قرية جديدة: ") + nm.optString("stringValue");
        }
        sp.edit().putString("seen", last).apply();
        if (n > 0) notify(ctx, n == 1 ? "اقتراح جديد للقرى" : n + " اقتراحات جديدة للقرى", n == 1 ? name : "آخرها: " + name);
    }

    static String http(String url, String type, String body, String bearer) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(15000); c.setReadTimeout(20000);
            c.setRequestMethod("POST"); c.setDoOutput(true);
            c.setRequestProperty("Content-Type", type);
            if (bearer != null) c.setRequestProperty("Authorization", "Bearer " + bearer);
            try (OutputStream o = c.getOutputStream()) { o.write(body.getBytes("UTF-8")); }
            if (c.getResponseCode() / 100 != 2) return null;
            try (InputStream in = c.getInputStream()) {
                ByteArrayOutputStream b = new ByteArrayOutputStream(); byte[] buf = new byte[8192]; int k;
                while ((k = in.read(buf)) > 0) b.write(buf, 0, k);
                return b.toString("UTF-8");
            }
        } catch (Exception e) {
            return null;
        } finally { if (c != null) c.disconnect(); }
    }

    static void notify(Context ctx, String title, String text) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            if (nm.getNotificationChannel(CHANNEL) == null) {
                NotificationChannel ch = new NotificationChannel(CHANNEL, "اقتراحات القرى", NotificationManager.IMPORTANCE_DEFAULT);
                ch.setDescription("للمشرف: اقتراحات المشتركين بإضافة القرى أو تصحيحها");
                nm.createNotificationChannel(ch);
            }
            b = new Notification.Builder(ctx, CHANNEL);
        } else {
            b = new Notification.Builder(ctx).setDefaults(Notification.DEFAULT_SOUND);
        }
        Intent open = new Intent(ctx, MainActivity.class).putExtra("hash", "#sg-admin")
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        b.setSmallIcon(R.drawable.ic_stat_adhan).setContentTitle(title).setContentText(text).setAutoCancel(true)
                .setColor(0xFF0F5641).setContentIntent(PendingIntent.getActivity(ctx, 11, open, flags))
                .setStyle(new Notification.BigTextStyle().bigText(text));
        try { nm.notify(4207, b.build()); } catch (SecurityException ignored) { }
    }
}
