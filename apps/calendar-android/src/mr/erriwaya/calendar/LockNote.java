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
 * «إشعار اليوم»: a quiet, lasting notification shown on the lock screen of every phone (where widgets cannot go, as on
 * Samsung): the weekday, the Hijri and Gregorian dates, and the next prayer with a countdown to it. Turned on in the
 * settings (subscribers and the free day); redrawn at midnight, at each prayer, and when the app locks.
 */
public class LockNote extends BroadcastReceiver {
    private static final String CH = "today", TICK = "mr.erriwaya.calendar.LOCKNOTE_TICK";
    private static final int ID = 4242;

    static boolean on(Context ctx) { return ctx.getSharedPreferences("widgets", Context.MODE_PRIVATE).getBoolean("locknote", false); }

    static void set(Context ctx, boolean v) {
        ctx.getSharedPreferences("widgets", Context.MODE_PRIVATE).edit().putBoolean("locknote", v).apply();
        update(ctx);
    }

    @Override
    public void onReceive(Context ctx, Intent i) { update(ctx); }

    private static PendingIntent tick(Context ctx) {
        int f = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        return PendingIntent.getBroadcast(ctx, 42, new Intent(ctx, LockNote.class).setAction(TICK), f);
    }

    static void update(Context ctx) {
        try {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (nm == null) return;
            if (!on(ctx) || !Sub.open(ctx)) {
                nm.cancel(ID);
                if (am != null) am.cancel(tick(ctx));
                return;
            }
            long now = System.currentTimeMillis();
            long off = java.util.TimeZone.getDefault().getOffset(now);
            long day = PrayerCalc.fd(now + off, PrayerCalc.DAY);   // the phone's own day, as the widgets
            long next = (day + 1) * PrayerCalc.DAY - off;
            JSONObject c = AdhanReceiver.config(ctx);
            if (c == null) c = new JSONObject();
            int[] g = PrayerCalc.gregorian(day), h = CalendarWidget.hijri(day, c.optInt("adj", 0));
            int di = (int) (((day + 4) % 7 + 7) % 7), hm = Math.max(1, Math.min(12, h[1])) - 1;
            boolean fr = AdhanReceiver.french(c);
            String title = fr ? CalendarWidget.DAYS_FR[di] + " " + h[2] + " " + CalendarWidget.H_MONTHS_FR[hm] + " " + h[0]
                    : CalendarWidget.DAYS[di] + " " + h[2] + " " + CalendarWidget.H_MONTHS[hm] + " " + h[0] + " هـ";
            String greg = g[2] + " " + (fr ? CalendarWidget.G_MONTHS_FR[g[1] - 1] : CalendarWidget.G_MONTHS[g[1] - 1]) + " " + g[0];
            // the next prayer (Mauritanian time, as everywhere in the app)
            long pd = PrayerCalc.fd(now, PrayerCalc.DAY);
            double[] t = AdhanReceiver.timesOf(c, pd);
            int ni = -1;
            long at = 0;
            for (int i = 0; i < CalendarWidget.PRAYERS.length; i++) {
                int mins = PrayerCalc.minutes(t[CalendarWidget.PRAYERS[i]]);
                if (mins < 0) continue;
                long a = pd * PrayerCalc.DAY + mins * 60000L;
                if (a > now) { ni = i; at = a; break; }
            }
            if (ni < 0) {
                ni = 0;
                t = AdhanReceiver.timesOf(c, pd + 1);
                at = (pd + 1) * PrayerCalc.DAY + Math.max(0, PrayerCalc.minutes(t[CalendarWidget.PRAYERS[0]])) * 60000L;
            }
            String pname = AdhanReceiver.names(c)[CalendarWidget.PRAYERS[ni]];
            String line = greg + (fr ? " · Prochaine : " : " · القادمة: ") + pname + " " + PrayerCalc.fmt(t[CalendarWidget.PRAYERS[ni]]);
            next = Math.min(next, at + 1000);
            long end = Math.max(Sub.trialEnd(ctx), Sub.paidUntil(ctx));
            if (end > now) next = Math.min(next, end);

            if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null) {
                NotificationChannel ch = new NotificationChannel(CH, "إشعار اليوم على شاشة القفل", NotificationManager.IMPORTANCE_LOW);
                ch.setDescription("اليوم والتاريخ والصلاة القادمة، بلا صوت");
                ch.setShowBadge(false);
                ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                nm.createNotificationChannel(ch);
            }
            int f = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
            Intent app = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(ctx, CH) : new Notification.Builder(ctx);
            b.setSmallIcon(R.drawable.ic_stat_adhan).setContentTitle(title).setContentText(line)
                    .setOngoing(true).setOnlyAlertOnce(true).setShowWhen(true)
                    .setVisibility(Notification.VISIBILITY_PUBLIC).setCategory(Notification.CATEGORY_STATUS)
                    .setContentIntent(PendingIntent.getActivity(ctx, 43, app, f));
            if (Build.VERSION.SDK_INT >= 24) {   // a countdown to the prayer
                b.setWhen(at).setUsesChronometer(true).setChronometerCountDown(true);
            }
            if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_LOW);
            nm.notify(ID, b.build());
            if (am != null) am.setWindow(AlarmManager.RTC, next, 60000, tick(ctx));
        } catch (Exception ignored) { }
    }
}
