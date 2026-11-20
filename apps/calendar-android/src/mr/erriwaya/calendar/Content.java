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
import android.net.Uri;
import android.os.Build;
import android.webkit.WebResourceResponse;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Iterator;

/**
 * Remote content: the app's content changes without a new APK (tools/build-content.py explains the content branch).
 *  - manifest.json on the branch `calendar-content`: {"files": {"c/library.json": 2, "data/book.js": 1, …}, "news": {…}}.
 *  - c/*.json (the page's tables) are downloaded as soon as their version is higher than the one the phone has
 *    (at first the versions built into the APK, assets/content-base.json); the page reads them through contentGet.
 *  - data/… and img/… (books, covers) are fetched the first time the page asks for them (intercept), then kept.
 *  - "news": {"id": n, "t": "title", "b": "text", "h": "#hash", "u": "https://…"} raises one notification per new id
 *    (the app opens and offers the link "u" in a dialog when there is one, otherwise the page "h").
 * Only content travels this way (JSON tables, book texts, images); the app's code changes only through an update.
 * Also the periodic job (about every 6 hours, with a network) that checks for new content when the app is closed.
 */
public class Content extends JobService {
    static final String BASE = "https://raw.githubusercontent.com/tenyekat-design/erriwaya-videos/calendar-content/";
    static final String PREFS = "content", CHANNEL = "content_1";
    static final int JOB_ID = 4311;
    private static final Object LOCK = new Object();

    static File dir(Context ctx) { return new File(ctx.getFilesDir(), "content"); }

    /** Only these paths, so nothing from the manifest can reach outside the content folder. */
    static boolean okPath(String p) {
        return p != null && p.matches("(c|data|img)/[A-Za-z0-9._/-]+") && !p.contains("..");
    }

    /** The versions built into the APK. */
    private static JSONObject base(Context ctx) {
        try (InputStream in = ctx.getAssets().open("content-base.json")) {
            return new JSONObject(new String(readAll(in), "UTF-8")).optJSONObject("files");
        } catch (Exception e) { return new JSONObject(); }
    }

    /** State kept between runs: "have" (path → version of the file on the phone) and "remote" (the last manifest's files). */
    private static JSONObject state(Context ctx) {
        try { return new JSONObject(ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("state", "{}")); }
        catch (Exception e) { return new JSONObject(); }
    }

    private static void saveState(Context ctx, JSONObject s) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("state", s.toString()).apply();
    }

    /** For the page: the downloaded c/<key>.json, or "" (then the page keeps its built-in table). */
    static String get(Context ctx, String path) {
        if (!okPath(path) || !path.startsWith("c/")) return "";
        File f = new File(dir(ctx), path);
        if (!f.isFile()) return "";
        try (InputStream in = new FileInputStream(f)) { return new String(readAll(in), "UTF-8"); }
        catch (Exception e) { return ""; }
    }

    /** Asks for the manifest and downloads the newer tables. True when something the page shows has changed. */
    static boolean sync(Context ctx) {
        synchronized (LOCK) {
            byte[] mb = fetch(BASE + "manifest.json?t=" + System.currentTimeMillis() / 60000);
            if (mb == null) return false;
            JSONObject man;
            try { man = new JSONObject(new String(mb, "UTF-8")); } catch (Exception e) { return false; }
            JSONObject files = man.optJSONObject("files");
            if (files == null) return false;
            JSONObject st = state(ctx), base = base(ctx);
            JSONObject have = st.optJSONObject("have");
            if (have == null) have = new JSONObject();
            boolean changed = false;
            try {
                for (Iterator<String> it = files.keys(); it.hasNext(); ) {
                    String p = it.next();
                    if (!okPath(p)) continue;
                    int rv = files.optInt(p, 0), hv = have.optInt(p, 0), bv = base.optInt(p, 0);
                    File f = new File(dir(ctx), p);
                    if (p.startsWith("c/")) {
                        if (rv <= Math.max(hv, bv)) continue;
                        byte[] b = fetch(BASE + p + "?v=" + rv);
                        if (b == null || !validJson(b)) continue;
                        if (write(f, b)) { have.put(p, rv); changed = true; }
                    } else if (f.isFile() && rv > hv) {
                        // a book or picture that changed: the old copy goes, the new one is fetched when next opened
                        if (f.delete()) { have.remove(p); changed = true; }
                    }
                }
                st.put("have", have);
                st.put("remote", files);
                saveState(ctx, st);
            } catch (Exception ignored) { }
            news(ctx, man.optJSONObject("news"));
            return changed;
        }
    }

    /**
     * The page asks for data/… or img/…: the kept copy if there is one; otherwise, if the content branch has a newer
     * version than the APK (or the APK lacks it), it is downloaded now and kept. null: the APK's own file.
     */
    static WebResourceResponse intercept(Context ctx, Uri u) {
        if (!"file".equals(u.getScheme())) return null;
        String path = u.getPath();
        if (path == null || !path.startsWith("/android_asset/")) return null;
        String p = path.substring("/android_asset/".length());
        if (!okPath(p) || p.startsWith("c/")) return null;
        File f = new File(dir(ctx), p);
        if (!f.isFile()) {
            JSONObject remote = state(ctx).optJSONObject("remote");
            int rv = remote == null ? 0 : remote.optInt(p, 0);
            if (rv <= 0 || rv <= base(ctx).optInt(p, 0)) return null;
            byte[] b = fetch(BASE + p + "?v=" + rv);
            if (b == null || !write(f, b)) return null;
            synchronized (LOCK) {
                JSONObject st = state(ctx);
                try {
                    JSONObject have = st.optJSONObject("have");
                    if (have == null) st.put("have", have = new JSONObject());
                    have.put(p, rv);
                    saveState(ctx, st);
                } catch (Exception ignored) { }
            }
        }
        try {
            return new WebResourceResponse(mime(p), p.endsWith(".js") || p.endsWith(".json") ? "UTF-8" : null, new FileInputStream(f));
        } catch (Exception e) { return null; }
    }

    private static String mime(String p) {
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".svg")) return "image/svg+xml";
        return "application/octet-stream";
    }

    /** One notification per new "news" id, opening the page it names (#lib for a new book…). */
    private static void news(Context ctx, JSONObject n) {
        if (n == null) return;
        int id = n.optInt("id", 0);
        String t = n.optString("t", "");
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int seen = sp.getInt("news", -1);
        if (seen < 0) { sp.edit().putInt("news", id).apply(); return; }   // a fresh install: no old news
        if (id <= seen || t.isEmpty()) return;
        sp.edit().putInt("news", id).apply();
        try {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            if (Build.VERSION.SDK_INT >= 26)
                nm.createNotificationChannel(new NotificationChannel(CHANNEL, "محتوى جديد", NotificationManager.IMPORTANCE_DEFAULT));
            Intent open = new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            String h = n.optString("h", "");
            if (h.matches("#[a-z0-9-]+")) open.putExtra("hash", h);
            // "u": an https link (the new APK's fixed download link…): the app opens and offers it in a dialog with a
            // download button (a link sent straight to the browser may only start a silent download)
            String u = n.optString("u", "");
            if (u.startsWith("https://") && u.length() < 500)
                open.putExtra("url", u).putExtra("urlTitle", t).putExtra("urlText", n.optString("b", ""));
            PendingIntent pi = PendingIntent.getActivity(ctx, JOB_ID, open,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
            Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(ctx, CHANNEL) : new Notification.Builder(ctx);
            String body = n.optString("b", "");
            b.setSmallIcon(ctx.getApplicationInfo().icon).setContentTitle(t).setContentIntent(pi).setAutoCancel(true);
            if (!body.isEmpty()) b.setContentText(body).setStyle(new Notification.BigTextStyle().bigText(body));
            nm.notify(JOB_ID, b.build());
        } catch (Exception ignored) { }
    }

    /** Every phone: a light check about every 6 hours when a network is there. */
    static void schedule(Context ctx) {
        JobScheduler js = (JobScheduler) ctx.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if (js == null || (Build.VERSION.SDK_INT >= 24 && js.getPendingJob(JOB_ID) != null)) return;
        JobInfo.Builder b = new JobInfo.Builder(JOB_ID, new ComponentName(ctx, Content.class))
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setPersisted(true)
                .setPeriodic(6 * 60 * 60 * 1000L);
        try { js.schedule(b.build()); } catch (Exception ignored) { }
    }

    @Override
    public boolean onStartJob(JobParameters params) {
        new Thread(() -> {
            try { sync(getApplicationContext()); } catch (Exception ignored) { }
            jobFinished(params, false);
        }).start();
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters params) { return true; }

    private static boolean validJson(byte[] b) {
        try {
            String s = new String(b, "UTF-8").trim();
            if (s.startsWith("[")) new org.json.JSONArray(s); else new JSONObject(s);
            return true;
        } catch (Exception e) { return false; }
    }

    /** Written beside, then renamed: a cut download never replaces a good file. */
    private static boolean write(File f, byte[] b) {
        File p = f.getParentFile();
        if (p != null && !p.isDirectory() && !p.mkdirs()) return false;
        File tmp = new File(f.getPath() + ".part");
        try (OutputStream o = new FileOutputStream(tmp)) { o.write(b); }
        catch (Exception e) { tmp.delete(); return false; }
        return tmp.renameTo(f) || (f.delete() && tmp.renameTo(f));
    }

    private static byte[] fetch(String url) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(15000);
            c.setReadTimeout(60000);
            c.setUseCaches(false);
            if (c.getResponseCode() != 200) return null;
            try (InputStream in = c.getInputStream()) { return readAll(in); }
        } catch (Exception e) { return null; }
        finally { if (c != null) c.disconnect(); }
    }

    private static byte[] readAll(InputStream in) throws java.io.IOException {
        ByteArrayOutputStream o = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) > 0) o.write(buf, 0, n);
        return o.toByteArray();
    }
}
