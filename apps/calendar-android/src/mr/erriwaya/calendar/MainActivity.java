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
import android.content.res.Configuration;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** The whole calendar lives in assets/index.html; this activity only hosts it, fully offline. */
public class MainActivity extends Activity {
    private WebView web;
    private LinearLayout root;
    private View topBar, bottomBar;
    /** True while the tasbih page asks to count with the volume keys. */
    private volatile boolean volumeKeysCount = false;
    private volatile String pickKind = "adhan";
    /** Tasbih sounds and the page-turn sound (assets/sounds/*.wav), played natively for a reliable, low-latency sound. */
    private SoundPool pool;
    private int sClick, sClick2, sChime, sPage;

    /** Bridge the page calls as window.AndroidApp. */
    public class Bridge {
        @JavascriptInterface
        public void setVolumeKeys(boolean on) { volumeKeysCount = on; }

        /** The coming adhan times from the page: [[epochMillis, "title", "text"], ...] ("[]" turns alerts off). */
        @JavascriptInterface
        public void setAdhanSchedule(String json) { AdhanReceiver.save(MainActivity.this, json); }

        /**
         * The settings behind the times: {on, p:{fajr..isha}, city, lat, lng, fajr, isha, ishaMin, asr, adj}. With them the app
         * computes the adhan times itself (they never run out) and draws the home-screen widget.
         */
        @JavascriptInterface
        public void setAdhanConfig(String json) { AdhanReceiver.saveConfig(MainActivity.this, json); }

        /** «أقرب بلدية إلى موقعي»: asks for the approximate-location permission if needed, then calls window.onLocated(lat, lng, ok). */
        @JavascriptInterface
        public void locate() {
            runOnUiThread(() -> {
                if (Locator.allowed(MainActivity.this)) doLocate();
                else Locator.ask(MainActivity.this);
            });
        }

        /** True when the phone does not restrict the app's background work to save battery (which can silence the adhan). */
        @JavascriptInterface
        public boolean batteryUnrestricted() {
            if (Build.VERSION.SDK_INT < 23) return true;
            android.os.PowerManager pm = (android.os.PowerManager) getSystemService(POWER_SERVICE);
            return pm == null || pm.isIgnoringBatteryOptimizations(getPackageName());
        }

        /** Opens the app's page in the phone's settings, where its battery use can be set to unrestricted. */
        @JavascriptInterface
        public void openBatterySettings() {
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                            Uri.parse("package:" + getPackageName())));
                } catch (Exception ignored) { }
            });
        }

        /** Asks for the notification permission (Android 13+) when the user turns adhan alerts on. */
        @JavascriptInterface
        public void requestNotifications() {
            if (Build.VERSION.SDK_INT >= 33) runOnUiThread(() ->
                    requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 7));
        }

        /** Local copy of a mushaf page ("" if not downloaded), as a file:// URL; key = warsh, qaloon or hafs. */
        @JavascriptInterface
        public String mushafPage(String key, int n) {
            java.io.File f = new java.io.File(MushafDownload.dir(MainActivity.this, key), "page" + n + ".png");
            return f.exists() && f.length() > 0 ? Uri.fromFile(f).toString() : "";
        }

        /** Downloads every page (url pattern with {n}, pages from..to) into the app's files, in the background. */
        @JavascriptInterface
        public void downloadMushaf(String key, String pattern, int from, int to) { MushafDownload.start(MainActivity.this, key, pattern, from, to); }

        @JavascriptInterface
        public void cancelMushaf() { MushafDownload.cancel(); }

        /** Reads a sura recording's loudness in the background (AudioScan), for finding the pauses between verses. */
        @JavascriptInterface
        public void audioScan(String url, String id) { AudioScan.start(MainActivity.this, url, id); }

        @JavascriptInterface
        public String audioScanState(String id) { return AudioScan.state(MainActivity.this, id); }

        /** "-38,-41,…": dB per 50 ms, or "" if not scanned yet. */
        @JavascriptInterface
        public String audioScanResult(String id) { return AudioScan.result(MainActivity.this, id); }

        /** "done,total,bytes,running,error" */
        @JavascriptInterface
        public String mushafProgress(String key, int total) { return MushafDownload.progress(MainActivity.this, key, total); }

        @JavascriptInterface
        public void deleteMushaf(String key) { MushafDownload.deleteAll(MainActivity.this, key); }

        /** Exact alarms: Android 12+ lets the user allow them in Settings ("Alarms & reminders"). */
        @JavascriptInterface
        public boolean exactAlarmsAllowed() {
            if (Build.VERSION.SDK_INT < 31) return true;
            android.app.AlarmManager am = (android.app.AlarmManager) getSystemService(ALARM_SERVICE);
            return am != null && am.canScheduleExactAlarms();
        }

        @JavascriptInterface
        public void requestExactAlarms() {
            if (Build.VERSION.SDK_INT >= 31) runOnUiThread(() -> {
                try {
                    startActivity(new Intent(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                            Uri.parse("package:" + getPackageName())));
                } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface
        public boolean notificationsAllowed() {
            return Build.VERSION.SDK_INT < 33
                    || checkSelfPermission("android.permission.POST_NOTIFICATIONS") == android.content.pm.PackageManager.PERMISSION_GRANTED;
        }

        /** Raises the adhan now, so the user can hear it. */
        @JavascriptInterface
        public void testAdhan(String title, String text) { AdhanReceiver.fire(MainActivity.this, title, text, false); }

        @JavascriptInterface
        public void stopAdhan() { AdhanReceiver.stop(MainActivity.this); }

        /** Opens the phone's file picker for an adhan recording ("adhan" or "fajr"). */
        @JavascriptInterface
        public void pickAdhan(String kind) {
            pickKind = "fajr".equals(kind) ? "fajr" : "adhan";
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_GET_CONTENT).setType("audio/*").addCategory(Intent.CATEGORY_OPENABLE);
                try { startActivityForResult(Intent.createChooser(i, "اختر تسجيل الأذان"), 42); } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface
        public boolean hasAdhan(String kind) { return AdhanReceiver.fileFor(MainActivity.this, "fajr".equals(kind)).exists(); }

        @JavascriptInterface
        public void clearAdhan(String kind) { AdhanReceiver.fileFor(MainActivity.this, "fajr".equals(kind)).delete(); }

        /** click, click2 (every tenth), chime (count complete) or page (a mushaf page turning). */
        @JavascriptInterface
        public void sound(String name) {
            if (pool == null) return;
            int id = "page".equals(name) ? sPage : "chime".equals(name) ? sChime : "click2".equals(name) ? sClick2 : sClick;
            if (id != 0) pool.play(id, 1f, 1f, 1, 0, 1f);
        }

        /** Puts text on the clipboard (copied verses). */
        @JavascriptInterface
        public boolean copy(String text) {
            try {
                android.content.ClipboardManager cm = (android.content.ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                cm.setPrimaryClip(android.content.ClipData.newPlainText("آيات", text));
                return true;
            } catch (Exception e) { return false; }
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
            sPage = pool.load(getAssets().openFd("sounds/page.wav"), 1);
        } catch (Exception e) { pool = null; }
        web = new WebView(this);
        web.setBackgroundColor(Color.WHITE);   // the page opens on its white splash
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);   // remembers the city and settings
        s.setTextZoom(100);             // keep the layout stable with large system fonts
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);                     // downloaded mushaf pages live in the app's files
        s.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);  // pages seen once open again from the cache   // tasbih clicks also sound when counting with the volume keys
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
        // The page sits between two plain strips that take the place of the status and navigation bars: from Android 15 on
        // the window runs edge to edge (and from targetSdk 36 that cannot be turned off), so without them the page would
        // slide under the bars. Below Android 15 the strips stay 0 high and the theme colours the bars as before.
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        topBar = new View(this);
        bottomBar = new View(this);
        root.addView(topBar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0));
        root.addView(web, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        root.addView(bottomBar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0));
        barColors();
        setContentView(root);
        if (Build.VERSION.SDK_INT >= 35) Edge.apply(root, topBar, bottomBar);
        // Android 13+: the back gesture comes through this callback (onBackPressed is no longer called from targetSdk 36)
        if (Build.VERSION.SDK_INT >= 33) Back.register(this);
        if (state != null) web.restoreState(state);
        else web.loadUrl("file:///android_asset/index.html");
    }

    private void doLocate() {
        try {
            Locator.locate(this, (lat, lng, ok) -> located(lat, lng, ok));
        } catch (Exception e) {
            located(0, 0, false);
        }
    }

    private void located(double lat, double lng, boolean ok) {
        if (web != null) web.evaluateJavascript("window.onLocated&&window.onLocated(" + lat + "," + lng + "," + ok + ")", null);
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perms, int[] res) {
        super.onRequestPermissionsResult(req, perms, res);
        if (req != Locator.REQUEST) return;
        if (res.length > 0 && res[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) doLocate();
        else located(0, 0, false);
    }

    /** Back: the page's previous view (it navigates by #hash), or out of the app from the first one. */
    void goBack() {
        if (web != null && web.canGoBack()) web.goBack();
        else finish();
    }

    /** The strips' colours follow the day/night theme (the activity is not restarted when it changes). */
    private void barColors() {
        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        int bg = night ? 0xFF0C1511 : 0xFFF2F5F1;
        topBar.setBackgroundColor(night ? 0xFF04190F : 0xFF0A3528);
        bottomBar.setBackgroundColor(bg);
        root.setBackgroundColor(bg);
        if (Build.VERSION.SDK_INT >= 35) Edge.lightNavigationIcons(this, !night);
    }

    @Override
    public void onConfigurationChanged(Configuration c) {
        super.onConfigurationChanged(c);
        barColors();
    }

    /** Android 15+ only (kept in its own class so older phones never load these APIs). */
    static final class Edge {
        static void apply(final View root, final View top, final View bottom) {
            root.setOnApplyWindowInsetsListener((v, in) -> {
                android.graphics.Insets b = in.getInsets(android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout());
                android.graphics.Insets k = in.getInsets(android.view.WindowInsets.Type.ime());
                height(top, b.top);
                height(bottom, Math.max(b.bottom, k.bottom));   // the keyboard pushes the page up instead of covering it
                v.setPadding(b.left, 0, b.right, 0);
                return android.view.WindowInsets.CONSUMED;
            });
        }

        static void height(View v, int h) {
            ViewGroup.LayoutParams lp = v.getLayoutParams();
            if (lp.height != h) { lp.height = h; v.setLayoutParams(lp); }
        }

        static void lightNavigationIcons(Activity a, boolean dark) {
            android.view.WindowInsetsController c = a.getWindow().getInsetsController();
            if (c == null) return;
            int f = android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
            c.setSystemBarsAppearance(dark ? f : 0, f);
        }
    }

    /** Android 13+ only. */
    static final class Back {
        static void register(final MainActivity a) {
            a.getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, a::goBack);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req != 42) return;
        final String kind = pickKind;
        final boolean ok = res == RESULT_OK && data != null && data.getData() != null
                && AdhanReceiver.saveAudio(this, data.getData(), "fajr".equals(kind));
        web.evaluateJavascript("window.onAdhanPicked&&window.onAdhanPicked('" + kind + "'," + ok + ")", null);
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
    public void onBackPressed() { goBack(); }   // Android 12 and older
}
