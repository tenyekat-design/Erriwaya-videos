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
 * «الساعة»: a clock in the widgets' look, in one of ten figure styles in tall typefaces (widget_clock_d1..d10: a picture
 * drawn by ClockArt every minute, since a widget cannot use the app's fonts) or twelve dials with their hands
 * (widget_clock_a1..a12, AnalogClock, kept by the system), chosen per widget (WidgetConfig; layouts and drawables from
 * tools/clock-models.py), with the next prayer under it if wished; no date (the owner's choice). The rest is redrawn at
 * midnight, at each prayer, and when the app locks. Like the other
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
        if (TICK.equals(a) || Intent.ACTION_TIME_CHANGED.equals(a) || Intent.ACTION_TIMEZONE_CHANGED.equals(a)
                ) updateAll(ctx);
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
            String nextLine = (fr ? "Prochaine : " : "القادمة: ") + names[CalendarWidget.PRAYERS[ni]]
                    + (tomorrow ? (fr ? " demain " : " غدًا ") : " ") + PrayerCalc.fmt(t[CalendarWidget.PRAYERS[ni]]);
            boolean open = Sub.open(ctx);
            long end = Math.max(Sub.trialEnd(ctx), Sub.paidUntil(ctx));
            if (open && end > now) next = Math.min(next, end);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
            Intent app = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            boolean figures = false;
            java.util.Calendar cal = java.util.Calendar.getInstance();
            cal.setTimeInMillis(now);
            float scale = Math.min(2f, ctx.getResources().getDisplayMetrics().density);   // keeps each picture well under the binder limit
            for (int id : ids) {
                String face = Widgets.clock(ctx, id);
                if (!open) face = "d1";   // not subscribed: a fixed time (10:08), dimmed, with the invitation
                int layout = ctx.getResources().getIdentifier("widget_clock_" + face, "layout", ctx.getPackageName());
                RemoteViews v = new RemoteViews(ctx.getPackageName(), layout != 0 ? layout : R.layout.widget_clock_d1);
                if (face.startsWith("d") && open) {   // the figures are a picture (ClockArt), redrawn every minute
                    figures = true;
                    v.setImageViewBitmap(R.id.cTimeImg, ClockArt.render(ctx, face, cal, scale));
                } else if (!open) {
                    java.util.Calendar fixed = java.util.Calendar.getInstance();
                    fixed.set(java.util.Calendar.HOUR_OF_DAY, 10);
                    fixed.set(java.util.Calendar.MINUTE, 8);
                    v.setImageViewBitmap(R.id.cTimeImg, ClockArt.render(ctx, "d1", fixed, scale));
                    v.setInt(R.id.cTimeImg, "setImageAlpha", 90);
                }
                v.setTextViewText(R.id.cNext, nextLine);
                v.setViewVisibility(R.id.cNext, open && Widgets.clockNext(ctx, id) ? View.VISIBLE : View.GONE);
                v.setViewVisibility(R.id.cBody, View.VISIBLE);
                v.setViewVisibility(R.id.cLock, open ? View.GONE : View.VISIBLE);
                Widgets.applyBg(ctx, v, R.id.cBg, id, R.drawable.widget_day_bg);
                v.setOnClickPendingIntent(R.id.cRoot, PendingIntent.getActivity(ctx, 10, app, flags));
                m.updateAppWidget(id, v);
            }
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            if (figures) {
                // the next minute, on the minute; RTC (not _WAKEUP): a sleeping phone is not woken, the alarm comes when it wakes
                long minute = (now / 60000L + 1) * 60000L;
                if (Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms()) am.setExact(AlarmManager.RTC, minute, tick(ctx));
                else am.setWindow(AlarmManager.RTC, minute, 5000, tick(ctx));
            } else {
                am.setWindow(AlarmManager.RTC, next + 1000, 60000, tick(ctx));
            }
        } catch (Exception ignored) { }
    }
}
