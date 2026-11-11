package mr.erriwaya.calendar;

import android.content.Context;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/** Downloads a mushaf's page images (one folder per narration) so they open instantly and offline. */
final class MushafDownload {
    private static volatile Thread worker;
    private static volatile boolean stop;
    private static volatile String error = "";
    private static volatile String running = "";

    /** One folder per narration. Warsh pages now come from the Athari mushaf (567 pages, folder mushaf-warsh); the
     *  folder "mushaf" held the pages of the earlier Moroccan mushaf and is removed the first time it is seen. */
    static File dir(Context ctx, String key) {
        String k = key == null || key.isEmpty() ? "warsh" : key.replaceAll("[^a-z]", "");
        File old = new File(ctx.getFilesDir(), "mushaf");
        if (old.isDirectory()) {
            File[] fs = old.listFiles();
            if (fs != null) for (File f : fs) f.delete();
            old.delete();
        }
        File d = new File(ctx.getFilesDir(), "mushaf-" + k);
        if (!d.exists()) d.mkdirs();
        return d;
    }

    static synchronized void start(Context ctx, String key, String pattern, int from, int to) {
        if (worker != null && worker.isAlive()) return;
        running = key;
        final Context app = ctx.getApplicationContext();
        stop = false;
        error = "";
        worker = new Thread(() -> {
            File d = dir(app, key);
            for (int n = from; n <= to && !stop; n++) {
                File f = new File(d, "page" + n + ".png");
                if (f.exists() && f.length() > 0) continue;
                File tmp = new File(d, "page" + n + ".part");
                for (int attempt = 0; attempt < 3 && !stop; attempt++) {
                    try {
                        HttpURLConnection c = (HttpURLConnection) new URL(pattern.replace("{n}", String.valueOf(n))).openConnection();
                        c.setConnectTimeout(15000);
                        c.setReadTimeout(30000);
                        if (c.getResponseCode() != 200) { error = "HTTP " + c.getResponseCode(); c.disconnect(); break; }
                        try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(tmp)) {
                            byte[] buf = new byte[65536];
                            int k;
                            while ((k = in.read(buf)) > 0) out.write(buf, 0, k);
                        }
                        c.disconnect();
                        if (tmp.renameTo(f)) { error = ""; break; }
                    } catch (Exception e) {
                        error = "network";
                        tmp.delete();
                        try { Thread.sleep(1500); } catch (InterruptedException ignored) { }
                    }
                }
            }
        }, "mushaf-download");
        worker.start();
    }

    static void cancel() { stop = true; }

    static String progress(Context ctx, String key, int total) {
        File[] fs = dir(ctx, key).listFiles();
        int done = 0;
        long bytes = 0;
        if (fs != null) for (File f : fs) if (f.getName().endsWith(".png")) { done++; bytes += f.length(); }
        boolean busy = worker != null && worker.isAlive() && key.equals(running);
        return done + "," + total + "," + bytes + "," + busy + "," + (key.equals(running) ? error : "");
    }

    static void deleteAll(Context ctx, String key) {
        if (key.equals(running)) stop = true;
        File[] fs = dir(ctx, key).listFiles();
        if (fs != null) for (File f : fs) f.delete();
    }
}
