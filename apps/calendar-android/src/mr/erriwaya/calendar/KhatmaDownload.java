package mr.erriwaya.calendar;

import android.content.Context;

import org.json.JSONArray;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Downloads a reciter's whole recitation (a khatma) into the app's files, so it plays without the internet:
 * one folder per riwaya and reciter (files/khatma/<riwaya>-<reciter>/), one file per sura (001.mp3 …) or, for the
 * reciters heard verse by verse, one file per verse (001001.mp3 …). Files already there are skipped, so a stopped
 * download goes on where it stopped. One khatma at a time, three files at once.
 */
final class KhatmaDownload {
    private static volatile Thread worker;
    private static volatile boolean stop;
    private static volatile String error = "";
    private static volatile String running = "";

    static File dir(Context ctx, String key) {
        File d = new File(new File(ctx.getFilesDir(), "khatma"), key.replaceAll("[^A-Za-z0-9_-]", ""));
        if (!d.exists()) d.mkdirs();
        return d;
    }

    /** The local copy of one file ("" if not downloaded), as a file:// URL. */
    static String file(Context ctx, String key, String name) {
        File f = new File(dir(ctx, key), name.replaceAll("[^A-Za-z0-9._-]", ""));
        return f.exists() && f.length() > 0 ? android.net.Uri.fromFile(f).toString() : "";
    }

    /** list: [["001.mp3","https://…"], …] */
    static synchronized void start(Context ctx, final String key, String list) {
        if (worker != null && worker.isAlive()) return;
        final JSONArray items;
        try { items = new JSONArray(list); } catch (Exception e) { error = "list"; return; }
        running = key;
        stop = false;
        error = "";
        final Context app = ctx.getApplicationContext();
        worker = new Thread(() -> {
            final File d = dir(app, key);
            ExecutorService pool = Executors.newFixedThreadPool(3);
            final AtomicInteger fails = new AtomicInteger();
            for (int i = 0; i < items.length(); i++) {
                final JSONArray it = items.optJSONArray(i);
                if (it == null) continue;
                pool.execute(() -> {
                    if (stop) return;
                    String name = it.optString(0).replaceAll("[^A-Za-z0-9._-]", "");
                    File f = new File(d, name);
                    if (name.isEmpty() || (f.exists() && f.length() > 0)) return;
                    File tmp = new File(d, name + ".part");
                    for (int attempt = 0; attempt < 3 && !stop; attempt++) {
                        try {
                            fetch(it.optString(1), tmp);
                            if (tmp.renameTo(f)) return;
                        } catch (Exception e) {
                            tmp.delete();
                            try { Thread.sleep(1500); } catch (InterruptedException ignored) { }
                        }
                    }
                    if (!stop) { fails.incrementAndGet(); error = "network"; }
                });
            }
            pool.shutdown();
            try { pool.awaitTermination(7, TimeUnit.DAYS); } catch (InterruptedException ignored) { }
        }, "khatma-download");
        worker.start();
    }

    /** Follows redirects across hosts and from http to https (archive.org sends the file from another server). */
    private static void fetch(String url, File to) throws Exception {
        String u = url;
        for (int hop = 0; hop < 6; hop++) {
            HttpURLConnection c = (HttpURLConnection) new URL(u).openConnection();
            c.setInstanceFollowRedirects(false);
            c.setConnectTimeout(20000);
            c.setReadTimeout(60000);
            int code = c.getResponseCode();
            if (code >= 300 && code < 400) {
                String loc = c.getHeaderField("Location");
                c.disconnect();
                if (loc == null) throw new Exception("redirect");
                u = new URL(new URL(u), loc).toString();
                continue;
            }
            if (code != 200) { c.disconnect(); throw new Exception("HTTP " + code); }
            try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(to)) {
                byte[] buf = new byte[65536];
                int k;
                while ((k = in.read(buf)) > 0) {
                    if (stop) throw new Exception("stopped");
                    out.write(buf, 0, k);
                }
            }
            c.disconnect();
            return;
        }
        throw new Exception("too many redirects");
    }

    static void cancel() { stop = true; }

    /** "done,total,bytes,running,error" */
    static String progress(Context ctx, String key, int total) {
        File[] fs = dir(ctx, key).listFiles();
        int done = 0;
        long bytes = 0;
        if (fs != null) for (File f : fs) if (f.getName().endsWith(".mp3")) { done++; bytes += f.length(); }
        boolean busy = worker != null && worker.isAlive() && key.equals(running);
        return done + "," + total + "," + bytes + "," + busy + "," + (key.equals(running) ? error : "");
    }

    static void deleteAll(Context ctx, String key) {
        if (key.equals(running)) stop = true;
        File[] fs = dir(ctx, key).listFiles();
        if (fs != null) for (File f : fs) f.delete();
    }
}
