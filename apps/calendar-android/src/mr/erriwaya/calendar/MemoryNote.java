package mr.erriwaya.calendar;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import org.json.JSONObject;

/**
 * «ذاكرة اليوم»: an optional local notification, once a day at the hour the user picked, with the title of the day's
 * anniversary from «ذاكرة موريتانيا» (or a chosen reading, marked as not today's). Off by default; turned on from the
 * encyclopedia (#memory) only after the system's notification permission. The page passes the 366 days' lines
 * (setMemoryNote), so nothing is read from the internet.
 */
public class MemoryNote extends BroadcastReceiver {
    private static final String CH = "memory", FIRE = "mr.erriwaya.calendar.MEMORY_NOTE";
    private static final int ID = 4343;

    static JSONObject cfg(Context ctx) {
        try { return new JSONObject(ctx.getSharedPreferences("memory", Context.MODE_PRIVATE).getString("cfg", "{}")); }
        catch (Exception e) { return new JSONObject(); }
    }

    /** The settings without the days' lines, for the page. */
    static String state(Context ctx) {
        JSONObject c = cfg(ctx), o = new JSONObject();
        try { o.put("on", c.optBoolean("on")); o.put("h", c.optInt("h", 8)); o.put("m", c.optInt("m", 0)); } catch (Exception ignored) { }
        return o.toString();
    }

    static void save(Context ctx, String json) {
        try { new JSONObject(json); } catch (Exception e) { return; }
        ctx.getSharedPreferences("memory", Context.MODE_PRIVATE).edit().putString("cfg", json).apply();
        schedule(ctx);
    }

    private static PendingIntent fire(Context ctx) {
        int f = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        return PendingIntent.getBroadcast(ctx, 4343, new Intent(ctx, MemoryNote.class).setAction(FIRE), f);
    }

    static void schedule(Context ctx) {
        try {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            am.cancel(fire(ctx));
            JSONObject c = cfg(ctx);
            if (!c.optBoolean("on")) return;
            java.util.Calendar k = java.util.Calendar.getInstance();
            k.set(java.util.Calendar.HOUR_OF_DAY, c.optInt("h", 8));
            k.set(java.util.Calendar.MINUTE, c.optInt("m", 0));
            k.set(java.util.Calendar.SECOND, 0);
            k.set(java.util.Calendar.MILLISECOND, 0);
            if (k.getTimeInMillis() <= System.currentTimeMillis() + 30000) k.add(java.util.Calendar.DAY_OF_MONTH, 1);
            // a window of 15 minutes: no exact-alarm permission is needed for a reading
            am.setWindow(AlarmManager.RTC_WAKEUP, k.getTimeInMillis(), 15 * 60000L, fire(ctx));
        } catch (Exception ignored) { }
    }

    @Override
    public void onReceive(Context ctx, Intent i) {
        String a = i == null ? null : i.getAction();
        if (FIRE.equals(a)) show(ctx, false);
        schedule(ctx);   // also after a reboot or an update of the app
    }

    /** test: shows today's line now, whether or not the daily notification is on. */
    static void show(Context ctx, boolean test) {
        try {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            JSONObject c = cfg(ctx);
            if (!test && !c.optBoolean("on")) return;
            if (!Sub.open(ctx)) return;   // like the app itself: nothing once the trial has ended without a subscription
            if (Build.VERSION.SDK_INT >= 33 && ctx.checkSelfPermission("android.permission.POST_NOTIFICATIONS")
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) return;
            // the date in Nouakchott (UTC+0), as in the page
            java.text.SimpleDateFormat f = new java.text.SimpleDateFormat("MM-dd", java.util.Locale.US);
            f.setTimeZone(java.util.TimeZone.getTimeZone("GMT"));
            String key = f.format(new java.util.Date());
            JSONObject days = c.optJSONObject("days"), d = days == null ? null : days.optJSONObject(key);
            String title = d == null ? "ذاكرة موريتانيا" : d.optString("t", "ذاكرة موريتانيا");
            String text = d == null ? "افتح ذاكرة اليوم في التقويم الموريتاني" : d.optString("s", "");
            if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null) {
                NotificationChannel ch = new NotificationChannel(CH, "ذاكرة اليوم", NotificationManager.IMPORTANCE_DEFAULT);
                ch.setDescription("تنبيه يومي اختياري بحدث من تاريخ موريتانيا");
                nm.createNotificationChannel(ch);
            }
            int fl = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
            Intent app = new Intent(ctx, MainActivity.class).putExtra("hash", "#memory")
                    .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(ctx, CH) : new Notification.Builder(ctx);
            b.setSmallIcon(R.drawable.ic_stat_adhan).setContentTitle(title).setContentText(text)
                    .setStyle(new Notification.BigTextStyle().bigText(text).setSummaryText("ذاكرة اليوم"))
                    .setAutoCancel(true).setShowWhen(true)
                    .setContentIntent(PendingIntent.getActivity(ctx, 4344, app, fl));
            nm.notify(ID, b.build());
        } catch (Exception ignored) { }
    }
}
