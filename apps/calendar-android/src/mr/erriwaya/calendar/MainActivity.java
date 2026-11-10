package mr.erriwaya.calendar;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.SoundPool;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.KeyEvent;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** The whole calendar lives in assets/index.html; this activity only hosts it, fully offline. */
public class MainActivity extends Activity {
    private WebView web;
    /** True while the tasbih page asks to count with the volume keys. */
    private volatile boolean volumeKeysCount = false;
    /** Tasbih sounds (assets/sounds/*.wav), played natively for a reliable, low-latency click. */
    private SoundPool pool;
    private int sClick, sClick2, sChime;

    /** Bridge the page calls as window.AndroidApp. */
    public class Bridge {
        @JavascriptInterface
        public void setVolumeKeys(boolean on) { volumeKeysCount = on; }

        /** click, click2 (every tenth) or chime (count complete). */
        @JavascriptInterface
        public void sound(String name) {
            if (pool == null) return;
            int id = "chime".equals(name) ? sChime : "click2".equals(name) ? sClick2 : sClick;
            if (id != 0) pool.play(id, 1f, 1f, 1, 0, 1f);
        }

        /** "40" vibrates 40 ms; "90,70,160" is on, off, on... in ms. */
        @JavascriptInterface
        public void vibrate(String pattern) {
            try {
                Vibrator v = (Vibrator) getSystemService(VIBRATOR_SERVICE);
                if (v == null || !v.hasVibrator()) return;
                String[] p = pattern.split(",");
                if (p.length == 1) {
                    long ms = Long.parseLong(p[0].trim());
                    if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
                    else v.vibrate(ms);
                } else {
                    long[] w = new long[p.length + 1];   // Android patterns start with a pause
                    for (int i = 0; i < p.length; i++) w[i + 1] = Long.parseLong(p[i].trim());
                    if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createWaveform(w, -1));
                    else v.vibrate(w, -1);
                }
            } catch (Exception ignored) { }
        }
    }

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        try {
            pool = new SoundPool.Builder().setMaxStreams(4).setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_GAME).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()).build();
            sClick = pool.load(getAssets().openFd("sounds/click.wav"), 1);
            sClick2 = pool.load(getAssets().openFd("sounds/click2.wav"), 1);
            sChime = pool.load(getAssets().openFd("sounds/chime.wav"), 1);
        } catch (Exception e) { pool = null; }
        web = new WebView(this);
        web.setBackgroundColor(Color.WHITE);   // the page opens on its white splash
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);   // remembers the city and settings
        s.setTextZoom(100);             // keep the layout stable with large system fonts
        s.setMediaPlaybackRequiresUserGesture(false);   // tasbih clicks also sound when counting with the volume keys
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if ("file".equals(u.getScheme())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "AndroidApp");
        setContentView(web);
        if (state != null) web.restoreState(state);
        else web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onDestroy() {
        if (pool != null) pool.release();
        super.onDestroy();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        int k = e.getKeyCode();
        if (volumeKeysCount && (k == KeyEvent.KEYCODE_VOLUME_UP || k == KeyEvent.KEYCODE_VOLUME_DOWN)) {
            if (e.getAction() == KeyEvent.ACTION_DOWN && e.getRepeatCount() == 0)
                web.evaluateJavascript("window.tasbihTick&&window.tasbihTick()", null);
            return true;
        }
        return super.dispatchKeyEvent(e);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
