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

/**
 * Adhan alerts. The page computes the coming prayer times (it has the calculation and the user's city)
 * and hands them over as a JSON list [[epochMillis, "title", "text"], ...]; this class keeps that list,
 * sets one alarm for the next entry, shows the notification when it fires and then sets the following one.
 * After a reboot the same list is read again.
 */
public class AdhanReceiver extends BroadcastReceiver {
    static final String PREFS = "adhan";
    static final String CHANNEL = "adhan_maliki_1";

    @Override
    public void onReceive(Context ctx, Intent intent) {
        String action = intent.getAction();
        if ("mr.erriwaya.calendar.ADHAN".equals(action)) {
            notify(ctx, intent.getStringExtra("title"), intent.getStringExtra("text"));
        }
        scheduleNext(ctx);  // also on BOOT_COMPLETED and after an app update
    }

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
                i.putExtra("title", e.getString(1)).putExtra("text", e.getString(2));
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
        // nothing ahead (alerts off): clear any pending alarm
        am.cancel(PendingIntent.getBroadcast(ctx, 1, i, flags));
    }

    /** The adhan recording, if one is bundled as res/raw/adhan; otherwise the phone's alarm sound. */
    static Uri sound(Context ctx) {
        int id = ctx.getResources().getIdentifier("adhan", "raw", ctx.getPackageName());
        if (id != 0) return Uri.parse("android.resource://" + ctx.getPackageName() + "/" + id);
        return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
    }

    static void notify(Context ctx, String title, String text) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            if (nm.getNotificationChannel(CHANNEL) == null) {
                NotificationChannel ch = new NotificationChannel(CHANNEL, "الأذان", NotificationManager.IMPORTANCE_HIGH);
                ch.setDescription("تنبيه بالأذان عند دخول وقت كل صلاة");
                ch.setSound(sound(ctx), new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
                nm.createNotificationChannel(ch);
            }
            b = new Notification.Builder(ctx, CHANNEL);
        } else {
            b = new Notification.Builder(ctx).setSound(sound(ctx)).setPriority(Notification.PRIORITY_HIGH);
        }
        Intent open = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        b.setSmallIcon(R.drawable.ic_stat_adhan)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setAutoCancel(true)
                .setContentIntent(PendingIntent.getActivity(ctx, 0, open, flags));
        if (Build.VERSION.SDK_INT >= 21) b.setCategory(Notification.CATEGORY_ALARM).setColor(0xFF0F5641);
        try { nm.notify(7, b.build()); } catch (SecurityException ignored) { }
    }
}
