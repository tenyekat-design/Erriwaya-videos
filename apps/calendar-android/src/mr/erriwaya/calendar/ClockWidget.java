package mr.erriwaya.calendar;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONObject;

/**
 * «الساعة»: a clock in the widgets' look, digital (large thin figures) or with hands (a gold-ringed dial), chosen per
 * widget (WidgetConfig), with the Hijri and Gregorian date and the next prayer. The time itself is kept by the system
 * (TextClock, AnalogClock); this redraws the rest at midnight, at each prayer, and when the app locks. Like the other
 * widgets: the free day and subscribers; otherwise only a line inviting to subscribe.
 */
public class ClockWidget extends AppWidgetProvider {
    static final String TICK = "mr.erriwaya.calendar.CLOCK_TICK";

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) { updateAll(ctx); }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        super.onReceive(ctx, intent);
        String a = intent.getAction();
        if (TICK.equals(a) || Intent.ACTION_TIME_CHANGED.equals(a) || Intent.ACTION_TIMEZONE_CHANGED.equals(a)) updateAll(ctx);
    }

    @Override
    public void onDisabled(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(tick(ctx));
    }

    private static PendingIntent tick(Context ctx) {
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        return PendingIntent.getBroadcast(ctx, 9, new Intent(ctx, ClockWidget.class).setAction(TICK), flags);
    }

    static void updateAll(Context ctx) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(ctx);
            if (m == null) return;
            int[] ids = m.getAppWidgetIds(new ComponentName(ctx, ClockWidget.class));
            if (ids == null || ids.length == 0) return;
            long now = System.currentTimeMillis();
            JSONObject c = AdhanReceiver.config(ctx);
            if (c == null) c = new JSONObject();
            long day = PrayerCalc.fd(now, PrayerCalc.DAY);
            long next = (day + 1) * PrayerCalc.DAY;
            // the next prayer: today's first one still ahead, else tomorrow's fajr
            double[] t = AdhanReceiver.timesOf(c, day);
            int ni = -1;
            for (int i = 0; i < CalendarWidget.PRAYERS.length; i++) {
                int mins = PrayerCalc.minutes(t[CalendarWidget.PRAYERS[i]]);
                if (mins < 0) continue;
                long at = day * PrayerCalc.DAY + mins * 60000L;
                if (at > now) { ni = i; next = Math.min(next, at); break; }
            }
            boolean tomorrow = ni < 0;
            if (tomorrow) { ni = 0; t = AdhanReceiver.timesOf(c, day + 1); }
            boolean fr = AdhanReceiver.french(c);
            String[] names = AdhanReceiver.names(c);
            int[] g = PrayerCalc.gregorian(day), h = CalendarWidget.hijri(day, c.optInt("adj", 0));
            int di = (int) (((day + 4) % 7 + 7) % 7), hm = Math.max(1, Math.min(12, h[1])) - 1;   // 1970-01-01 was a Thursday
            String hijri = h[2] + " " + (fr ? CalendarWidget.H_MONTHS_FR : CalendarWidget.H_MONTHS)[hm] + " " + h[0] + (fr ? " H" : " هـ");
            String greg = (fr ? CalendarWidget.DAYS_FR : CalendarWidget.DAYS)[di] + " " + g[2] + " "
                    + (fr ? CalendarWidget.G_MONTHS_FR : CalendarWidget.G_MONTHS)[g[1] - 1] + " " + g[0];
            String nextLine = (fr ? "Prochaine : " : "القادمة: ") + names[CalendarWidget.PRAYERS[ni]]
                    + (tomorrow ? (fr ? " demain " : " غدًا ") : " ") + PrayerCalc.fmt(t[CalendarWidget.PRAYERS[ni]]);
            boolean open = Sub.open(ctx);
            long end = Math.max(Sub.trialEnd(ctx), Sub.paidUntil(ctx));
            if (open && end > now) next = Math.min(next, end);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
            Intent app = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            for (int id : ids) {
                boolean analog = "a".equals(Widgets.clock(ctx, id));
                RemoteViews v = new RemoteViews(ctx.getPackageName(), analog ? R.layout.widget_clock_analog : R.layout.widget_clock_digital);
                v.setTextViewText(R.id.cHijri, hijri);
                v.setTextViewText(R.id.cGreg, greg);
                v.setTextViewText(R.id.cNext, nextLine);
                v.setViewVisibility(R.id.cBody, open ? View.VISIBLE : View.GONE);
                v.setViewVisibility(R.id.cLock, open ? View.GONE : View.VISIBLE);
                v.setInt(R.id.cBg, "setImageAlpha", Widgets.bg(ctx, id) * 255 / 100);
                v.setOnClickPendingIntent(R.id.cRoot, PendingIntent.getActivity(ctx, 10, app, flags));
                m.updateAppWidget(id, v);
            }
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am != null) am.setWindow(AlarmManager.RTC, next + 1000, 60000, tick(ctx));
        } catch (Exception ignored) { }
    }
}
