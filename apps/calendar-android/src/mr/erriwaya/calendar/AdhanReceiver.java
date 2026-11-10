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
 * The adhan sound is a recording the user picks on the phone (copied into the app's files); it is played in
 * full by AdhanService. Without one, the notification rings with the phone's alarm tone.
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
        if (audioFor(ctx, fajr).exists()) {
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

    static void scheduleNext(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(ctx, AdhanReceiver.class).setAction("mr.erriwaya.calendar.ADHAN");
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        long now = System.currentTimeMillis();
        try {
            JSONArray list = new JSONArray(sp.getString("list", "[]"));
            for (int k = 0; k < list.length(); k++) {
                JSONArray e = list.getJSONArray(k);
                long at = e.getLong(0);
                if (at <= now + 1000) continue;
                i.putExtra("title", e.getString(1)).putExtra("text", e.getString(2)).putExtra("fajr", e.optBoolean(3, false));
                PendingIntent pi = PendingIntent.getBroadcast(ctx, 1, i, flags);
                boolean exact = Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms();
                if (Build.VERSION.SDK_INT >= 23) {
                    if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                    else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                } else {
                    am.setExact(AlarmManager.RTC_WAKEUP, at, pi);
                }
                return;
            }
        } catch (Exception ignored) { }
        am.cancel(PendingIntent.getBroadcast(ctx, 1, i, flags));  // nothing ahead: alerts are off
    }
}
