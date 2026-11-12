package mr.erriwaya.calendar;

import android.content.Context;
import android.media.MediaCodec;
import android.media.MediaExtractor;
import android.media.MediaFormat;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.ShortBuffer;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Reads a recitation's loudness so the page can find the pauses between verses (for recordings without verse timings).
 * The sura file is downloaded to the cache, decoded, and its level written as one whole number of decibels per
 * 50 ms ("-38,-41,…") in cache/scan/<id>.txt; the file is then deleted. One scan at a time, in order.
 */
final class AudioScan {
    private static final ExecutorService ONE = Executors.newSingleThreadExecutor();
    private static final java.util.Map<String, String> STATE = new java.util.concurrent.ConcurrentHashMap<>();

    static File out(Context c, String id) {
        File d = new File(c.getCacheDir(), "scan");
        if (!d.exists()) d.mkdirs();
        return new File(d, id.replaceAll("[^A-Za-z0-9._-]", "_") + ".txt");
    }

    /** "" (never asked), "queued", "running", "done" or "error". */
    static String state(Context c, String id) {
        if (out(c, id).exists()) return "done";
        String s = STATE.get(id);
        return s == null ? "" : s;
    }

    static String result(Context c, String id) {
        File f = out(c, id);
        if (!f.exists()) return "";
        try (InputStream in = new java.io.FileInputStream(f)) {
            byte[] b = new byte[(int) f.length()];
            int k = 0, n;
            while (k < b.length && (n = in.read(b, k, b.length - k)) > 0) k += n;
            return new String(b, 0, k, "UTF-8");
        } catch (Exception e) { return ""; }
    }

    static void start(Context ctx, final String url, final String id) {
        final Context app = ctx.getApplicationContext();
        String s = state(app, id);
        if (s.equals("done") || s.equals("queued") || s.equals("running")) return;
        STATE.put(id, "queued");
        ONE.execute(() -> {
            STATE.put(id, "running");
            File tmp = new File(app.getCacheDir(), "scan-audio.tmp");
            try {
                String path;
                if (url.startsWith("file:")) path = android.net.Uri.parse(url).getPath();   // a downloaded khatma: read it in place
                else { download(url, tmp); path = tmp.getPath(); }
                String levels = levels(path);
                File o = out(app, id), part = new File(o.getPath() + ".part");
                try (OutputStream w = new FileOutputStream(part)) { w.write(levels.getBytes("UTF-8")); }
                if (!part.renameTo(o)) throw new Exception("rename");
                STATE.put(id, "done");
            } catch (Throwable e) {
                STATE.put(id, "error");
            } finally {
                tmp.delete();
            }
        });
    }

    /** Follows redirects across hosts and from http to https (archive.org sends the file from another server). */
    private static void download(String url, File to) throws Exception {
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
                while ((k = in.read(buf)) > 0) out.write(buf, 0, k);
            }
            c.disconnect();
            return;
        }
        throw new Exception("too many redirects");
    }

    /** Decodes the file and returns its level in dB (0 = full scale), one value per 50 ms, comma separated. */
    private static String levels(String path) throws Exception {
        MediaExtractor ex = new MediaExtractor();
        ex.setDataSource(path);
        int track = -1;
        MediaFormat fmt = null;
        for (int i = 0; i < ex.getTrackCount(); i++) {
            MediaFormat f = ex.getTrackFormat(i);
            String mime = f.getString(MediaFormat.KEY_MIME);
            if (mime != null && mime.startsWith("audio/")) { track = i; fmt = f; break; }
        }
        if (track < 0) throw new Exception("no audio");
        ex.selectTrack(track);
        MediaCodec dec = MediaCodec.createDecoderByType(fmt.getString(MediaFormat.KEY_MIME));
        dec.configure(fmt, null, null, 0);
        dec.start();
        int rate = fmt.containsKey(MediaFormat.KEY_SAMPLE_RATE) ? fmt.getInteger(MediaFormat.KEY_SAMPLE_RATE) : 44100;
        int ch = fmt.containsKey(MediaFormat.KEY_CHANNEL_COUNT) ? fmt.getInteger(MediaFormat.KEY_CHANNEL_COUNT) : 2;
        StringBuilder sb = new StringBuilder();
        double sum = 0;
        long n = 0, per = rate / 20;
        MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
        boolean inDone = false, outDone = false;
        while (!outDone) {
            if (!inDone) {
                int ib = dec.dequeueInputBuffer(10000);
                if (ib >= 0) {
                    ByteBuffer buf = dec.getInputBuffer(ib);
                    int size = buf == null ? -1 : ex.readSampleData(buf, 0);
                    if (size < 0) {
                        dec.queueInputBuffer(ib, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                        inDone = true;
                    } else {
                        dec.queueInputBuffer(ib, 0, size, ex.getSampleTime(), 0);
                        ex.advance();
                    }
                }
            }
            int ob = dec.dequeueOutputBuffer(info, 10000);
            if (ob == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                MediaFormat of = dec.getOutputFormat();
                if (of.containsKey(MediaFormat.KEY_SAMPLE_RATE)) { rate = of.getInteger(MediaFormat.KEY_SAMPLE_RATE); per = rate / 20; }
                if (of.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) ch = of.getInteger(MediaFormat.KEY_CHANNEL_COUNT);
            } else if (ob >= 0) {
                ByteBuffer o = dec.getOutputBuffer(ob);
                if (o != null && info.size > 0) {
                    o.position(info.offset);
                    o.limit(info.offset + info.size);
                    ShortBuffer sbuf = o.order(ByteOrder.LITTLE_ENDIAN).asShortBuffer();
                    int frames = sbuf.remaining() / Math.max(1, ch);
                    for (int i = 0; i < frames; i++) {
                        double v = 0;
                        for (int c = 0; c < ch; c++) v += sbuf.get(i * ch + c);
                        v = v / ch / 32768.0;
                        sum += v * v;
                        if (++n >= per) {
                            int db = (int) Math.round(10 * Math.log10(sum / n + 1e-10));
                            if (sb.length() > 0) sb.append(',');
                            sb.append(Math.max(-100, db));
                            sum = 0;
                            n = 0;
                        }
                    }
                }
                dec.releaseOutputBuffer(ob, false);
                if ((info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) outDone = true;
            }
        }
        dec.stop();
        dec.release();
        ex.release();
        return sb.toString();
    }
}
