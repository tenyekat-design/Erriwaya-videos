package mr.erriwaya.calendar;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Adhan alerts. The page computes the coming prayer times (it has the calculation and the user's city)
 * and hands them over as a JSON list [[epochMillis, "title", "text", isFajr], ...]; this class keeps that
 * list, sets one alarm for the next entry, raises the adhan when it fires and then sets the following one.
 * After a reboot or an app update the same list is read again.
 *
 * The page also hands over the settings behind those times (city, method, which prayers: setAdhanConfig). When they are
 * there, the next adhan is computed here from them (PrayerCalc, the page's own formulas) and the list is not needed:
 * the adhan keeps coming however long the app stays closed.
 *
 * The adhan sound is the Maliki adhan bundled in assets/sounds/adhan.m4a, or a recording the user picks on the
 * phone (copied into the app's files); AdhanService plays it in full. If the service cannot start, the
 * notification rings with the phone's alarm tone.
 */
public class AdhanReceiver extends BroadcastReceiver {
    static final String PREFS = "adhan";
    static final String CHANNEL = "adhan_maliki_1";        // rings the alarm tone
    static final String CHANNEL_PLAY = "adhan_play_1";     // silent: the recording plays through AdhanService

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if ("mr.erriwaya.calendar.ADHAN".equals(intent.getAction())) {
            fire(ctx, intent.getStringExtra("title"), intent.getStringExtra("text"), intent.getBooleanExtra("fajr", false));
        }
        scheduleNext(ctx);  // also on BOOT_COMPLETED and MY_PACKAGE_REPLACED
        CalendarWidget.updateAll(ctx);
    }

    // ---------- the user's recordings ----------
    static File fileFor(Context ctx, boolean fajr) { return new File(ctx.getFilesDir(), fajr ? "adhan_fajr" : "adhan"); }

    /** The recording to play: the Fajr one for Fajr when there is one, else the general one. */
    static File audioFor(Context ctx, boolean fajr) {
        File f = fileFor(ctx, true);
        return fajr && f.exists() ? f : fileFor(ctx, false);
    }

    static boolean saveAudio(Context ctx, Uri from, boolean fajr) {
        File to = fileFor(ctx, fajr);
        try (InputStream in = ctx.getContentResolver().openInputStream(from); OutputStream out = new FileOutputStream(to)) {
            if (in == null) return false;
            byte[] buf = new byte[65536];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            return to.length() > 0;
        } catch (Exception e) {
            to.delete();
            return false;
        }
    }

    // ---------- raising the adhan ----------
    static void fire(Context ctx, String title, String text, boolean fajr) {
        {   // always played in full by AdhanService (the bundled adhan when the user has not picked one)
            Intent s = new Intent(ctx, AdhanService.class).putExtra("title", title).putExtra("text", text).putExtra("fajr", fajr);
            try {
                if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(s);
                else ctx.startService(s);
                return;
            } catch (Exception ignored) { /* not allowed now: fall back to the ringing notification */ }
        }
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        try { nm.notify(7, build(ctx, title, text, false)); } catch (SecurityException ignored) { }
    }

    static void stop(Context ctx) {
        try { ctx.startService(new Intent(ctx, AdhanService.class).setAction(AdhanService.STOP)); } catch (Exception ignored) { }
    }

    static Notification build(Context ctx, String title, String text, boolean playing) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            String id = playing ? CHANNEL_PLAY : CHANNEL;
            if (nm != null && nm.getNotificationChannel(id) == null) {
                NotificationChannel ch = new NotificationChannel(id, playing ? "الأذان بالتسجيل" : "الأذان", NotificationManager.IMPORTANCE_HIGH);
                ch.setDescription("تنبيه بالأذان عند دخول وقت كل صلاة");
                if (playing) ch.setSound(null, null);
                else ch.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
                nm.createNotificationChannel(ch);
            }
            b = new Notification.Builder(ctx, id);
        } else {
            b = new Notification.Builder(ctx).setPriority(Notification.PRIORITY_HIGH);
            if (!playing) b.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM));
        }
        Intent open = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        b.setSmallIcon(R.drawable.ic_stat_adhan)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_ALARM)
                .setColor(0xFF0F5641)
                .setContentIntent(PendingIntent.getActivity(ctx, 0, open, flags));
        if (playing) {
            PendingIntent stop = PendingIntent.getService(ctx, 2, new Intent(ctx, AdhanService.class).setAction(AdhanService.STOP), flags);
            b.addAction(R.drawable.ic_stat_adhan, "إيقاف الأذان", stop).setDeleteIntent(stop).setOngoing(true);
        }
        return b.build();
    }

    // ---------- schedule ----------
    static void save(Context ctx, String json) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("list", json).apply();
        scheduleNext(ctx);
    }

    /** The settings the page handed over (see MainActivity.Bridge.setAdhanConfig), or null before the first hand-over. */
    static JSONObject config(Context ctx) {
        String c = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("config", null);
        if (c == null) return null;
        try { return new JSONObject(c); } catch (Exception e) { return null; }
    }

    static void saveConfig(Context ctx, String json) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("config", json).apply();
        scheduleNext(ctx);
        CalendarWidget.updateAll(ctx);
    }

    static final String[] NAMES = {"الفجر", "الشروق", "الظهر", "العصر", "المغرب", "العشاء"};
    static final String[] KEYS = {"fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"};

    /** The day's six times for the settings in c (hours, UTC = Mauritania's time). */
    static double[] timesOf(JSONObject c, long epochDay) {
        int[] g = PrayerCalc.gregorian(epochDay);
        return PrayerCalc.times(g[0], g[1], g[2], c.optDouble("lat", 18.0858), c.optDouble("lng", -15.9785),
                c.optDouble("fajr", 18), c.optDouble("isha", 17), c.optInt("ishaMin", 0), c.optDouble("asr", 1));
    }

    /** The next adhan after `now` for the settings in c: {epochMillis, title, text, isFajr}, or null when none is wanted. */
    static Object[] nextFromConfig(JSONObject c, long now) {
        if (!c.optBoolean("on", false)) return null;
        JSONObject p = c.optJSONObject("p");
        long day0 = PrayerCalc.fd(now, PrayerCalc.DAY);
        for (long day = day0; day <= day0 + 2; day++) {
            double[] t = timesOf(c, day);
            long best = Long.MAX_VALUE;
            int bk = -1;
            for (int k = 0; k < 6; k++) {
                if (k == PrayerCalc.SUNRISE || (p != null && !p.optBoolean(KEYS[k], true))) continue;
                int mins = PrayerCalc.minutes(t[k]);
                if (mins < 0) continue;
                long at = day * PrayerCalc.DAY + mins * 60000L;
                if (at > now + 1000 && at < best) { best = at; bk = k; }
            }
            if (bk >= 0) {
                boolean fajr = bk == PrayerCalc.FAJR;
                return new Object[]{best, "أذان " + NAMES[bk] + " · " + PrayerCalc.fmt(t[bk]),
                        "حان وقت صلاة " + NAMES[bk] + " في " + c.optString("city", "نواكشوط") + ". "
                                + (fajr ? "الصلاة خير من النوم." : "حيّ على الصلاة، حيّ على الفلاح."), fajr};
            }
        }
        return null;
    }

    private static void setAlarm(AlarmManager am, long at, PendingIntent pi) {
        boolean exact = Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms();
        try {
            if (Build.VERSION.SDK_INT >= 23) {
                if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, at, pi);
            }
        } catch (SecurityException e) {   // the permission was withdrawn in between: a few minutes late rather than never
            if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            else am.set(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    static void scheduleNext(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(ctx, AdhanReceiver.class).setAction("mr.erriwaya.calendar.ADHAN");
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        long now = System.currentTimeMillis();
        JSONObject c = config(ctx);
        if (c != null) {   // computed here: no list to run out of
            Object[] n = null;
            try { n = nextFromConfig(c, now); } catch (Exception ignored) { }
            if (n != null) {
                i.putExtra("title", (String) n[1]).putExtra("text", (String) n[2]).putExtra("fajr", (Boolean) n[3]);
                setAlarm(am, (Long) n[0], PendingIntent.getBroadcast(ctx, 1, i, flags));
            } else {
                am.cancel(PendingIntent.getBroadcast(ctx, 1, i, flags));
            }
            return;
        }
        try {
            JSONArray list = new JSONArray(sp.getString("list", "[]"));
            for (int k = 0; k < list.length(); k++) {
                JSONArray e = list.getJSONArray(k);
                long at = e.getLong(0);
                if (at <= now + 1000) continue;
                i.putExtra("title", e.getString(1)).putExtra("text", e.getString(2)).putExtra("fajr", e.optBoolean(3, false));
                PendingIntent pi = PendingIntent.getBroadcast(ctx, 1, i, flags);
                setAlarm(am, at, pi);
                return;
            }
        } catch (Exception ignored) { }
        am.cancel(PendingIntent.getBroadcast(ctx, 1, i, flags));  // nothing ahead: alerts are off
    }
}
