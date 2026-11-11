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
    static final String CHANNEL_PRE = "adhan_pre_1";       // the reminder some minutes before the adhan: an ordinary notification
    static final String CHANNEL_NOTE = "notes_1";          // reminders of the user's own notes

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if ("mr.erriwaya.calendar.ADHAN".equals(intent.getAction())) {
            if (intent.getBooleanExtra("note", false)) remind(ctx, intent.getStringExtra("title"), intent.getStringExtra("text"), true);
            else if (intent.getBooleanExtra("pre", false)) remind(ctx, intent.getStringExtra("title"), intent.getStringExtra("text"), false);
            else fire(ctx, intent.getStringExtra("title"), intent.getStringExtra("text"), intent.getBooleanExtra("fajr", false));
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
    /**
     * A plain notification with the phone's notification sound: the reminder before the adhan (removed when the adhan
     * is raised), or the reminder of one of the user's notes (note = true; it stays until dismissed).
     */
    static void remind(Context ctx, String title, String text, boolean note) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            String id = note ? CHANNEL_NOTE : CHANNEL_PRE;
            if (nm.getNotificationChannel(id) == null) {
                NotificationChannel ch = new NotificationChannel(id, note ? "تذكيرات ملاحظاتي" : "تنبيه قبل الأذان", NotificationManager.IMPORTANCE_DEFAULT);
                ch.setDescription(note ? "تذكير بالملاحظات التي أضفتها إلى أيام التقويم" : "تذكير قبل دخول وقت الصلاة بدقائق");
                nm.createNotificationChannel(ch);
            }
            b = new Notification.Builder(ctx, id);
        } else {
            b = new Notification.Builder(ctx).setDefaults(Notification.DEFAULT_SOUND);
        }
        Intent open = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        b.setSmallIcon(R.drawable.ic_stat_adhan).setContentTitle(title).setContentText(text).setAutoCancel(true)
                .setCategory(Notification.CATEGORY_REMINDER).setColor(0xFF0F5641)
                .setContentIntent(PendingIntent.getActivity(ctx, 5, open, flags));
        b.setStyle(new Notification.BigTextStyle().bigText(text));
        int nid = note ? 100 + (int) (System.currentTimeMillis() / 60000 % 1000000) : 9;
        try { nm.notify(nid, b.build()); } catch (SecurityException ignored) { }
    }

    static void fire(Context ctx, String title, String text, boolean fajr) {
        try {   // the reminder has done its work
            NotificationManager n0 = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (n0 != null) n0.cancel(9);
        } catch (Exception ignored) { }
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
    static final String[] NAMES_FR = {"Fajr", "Lever", "Dhohr", "Asr", "Maghrib", "Icha"};

    /** True when the page is shown in French (the «Français» button): alerts and the widget follow it. */
    static boolean french(JSONObject c) { return "fr".equals(c.optString("lang", "ar")); }

    static String[] names(JSONObject c) { return french(c) ? NAMES_FR : NAMES; }

    static String cityOf(JSONObject c) {
        String fr = c.optString("cityFr", "");
        return french(c) ? (fr.length() > 0 ? fr : "Nouakchott") : c.optString("city", "نواكشوط");
    }
    static final String[] KEYS = {"fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"};

    /** The day's six times for the settings in c (hours, UTC = Mauritania's time). */
    static double[] timesOf(JSONObject c, long epochDay) {
        int[] g = PrayerCalc.gregorian(epochDay);
        return PrayerCalc.times(g[0], g[1], g[2], c.optDouble("lat", 18.0858), c.optDouble("lng", -15.9785),
                c.optDouble("fajr", 18), c.optDouble("isha", 17), c.optInt("ishaMin", 0), c.optDouble("asr", 1));
    }

    /**
     * The next alert after `now` for the settings in c: {epochMillis, title, text, isFajr, isReminder}, or null when none is
     * wanted. An alert is an adhan or, when c.pre > 0, the reminder that many minutes before it.
     */
    static Object[] nextFromConfig(JSONObject c, long now) {
        Object[] a = nextAdhan(c, now), n = nextNote(c, now);
        if (a == null || (n != null && (Long) n[0] < (Long) a[0])) return n;
        return new Object[]{a[0], a[1], a[2], a[3], a[4], false};
    }

    /**
     * The next reminder of the user's notes: c.notes is the page's list [[epochMillis, "text"], ...] of the coming ones
     * (about a year ahead; the page renews it each time it opens). {epochMillis, title, text, false, true, true} or null.
     */
    static Object[] nextNote(JSONObject c, long now) {
        JSONArray list = c.optJSONArray("notes");
        if (list == null) return null;
        long best = Long.MAX_VALUE;
        String text = null;
        for (int k = 0; k < list.length(); k++) {
            JSONArray e = list.optJSONArray(k);
            if (e == null) continue;
            long at = e.optLong(0, 0);
            if (at > now + 1000 && at < best) { best = at; text = e.optString(1, ""); }
        }
        if (text == null) return null;
        return new Object[]{best, french(c) ? "Rappel · Calendrier mauritanien" : "تذكير · التقويم الموريتاني", text, false, true, true};
    }

    /** {epochMillis, title, text, isFajr, isReminder} for the next adhan or reminder before one, or null when alerts are off. */
    static Object[] nextAdhan(JSONObject c, long now) {
        if (!c.optBoolean("on", false)) return null;
        JSONObject p = c.optJSONObject("p");
        long day0 = PrayerCalc.fd(now, PrayerCalc.DAY);
        for (long day = day0; day <= day0 + 2; day++) {
            double[] t = timesOf(c, day);
            long best = Long.MAX_VALUE;
            int bk = -1;
            boolean bpre = false;
            int pre = Math.max(0, Math.min(120, c.optInt("pre", 0)));
            for (int k = 0; k < 6; k++) {
                if (k == PrayerCalc.SUNRISE || (p != null && !p.optBoolean(KEYS[k], true))) continue;
                int mins = PrayerCalc.minutes(t[k]);
                if (mins < 0) continue;
                long at = day * PrayerCalc.DAY + mins * 60000L;
                if (at > now + 1000 && at < best) { best = at; bk = k; bpre = false; }
                long before = at - pre * 60000L;
                if (pre > 0 && before > now + 1000 && before < best) { best = before; bk = k; bpre = true; }
            }
            if (bk >= 0) {
                boolean fajr = bk == PrayerCalc.FAJR;
                String city = cityOf(c);
                if (french(c)) {
                    String nm = NAMES_FR[bk], at = PrayerCalc.fmt(t[bk]);
                    if (bpre) return new Object[]{best, "Dans " + pre + " min : adhan du " + nm, "L’adhan du " + nm + " à " + city + " est à " + at + ".", fajr, true};
                    return new Object[]{best, "Adhan du " + nm + " · " + at, "C’est l’heure de la prière du " + nm + " à " + city + ".", fajr, false};
                }
                if (bpre) return new Object[]{best, "بعد " + pre + (pre >= 3 && pre <= 10 ? " دقائق" : " دقيقة") + ": أذان " + NAMES[bk],
                        "يُرفع أذان " + NAMES[bk] + " في " + city + " عند " + PrayerCalc.fmt(t[bk]) + ".", fajr, true};
                return new Object[]{best, "أذان " + NAMES[bk] + " · " + PrayerCalc.fmt(t[bk]),
                        "حان وقت صلاة " + NAMES[bk] + " في " + c.optString("city", "نواكشوط") + ". "
                                + (fajr ? "الصلاة خير من النوم." : "حيّ على الصلاة، حيّ على الفلاح."), fajr, false};
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
                i.putExtra("title", (String) n[1]).putExtra("text", (String) n[2]).putExtra("fajr", (Boolean) n[3]).putExtra("pre", (Boolean) n[4]).putExtra("note", (Boolean) n[5]);
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
                i.putExtra("title", e.getString(1)).putExtra("text", e.getString(2)).putExtra("fajr", e.optBoolean(3, false)).putExtra("pre", false).putExtra("note", false);
                PendingIntent pi = PendingIntent.getBroadcast(ctx, 1, i, flags);
                setAlarm(am, at, pi);
                return;
            }
        } catch (Exception ignored) { }
        am.cancel(PendingIntent.getBroadcast(ctx, 1, i, flags));  // nothing ahead: alerts are off
    }
}
