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
 * «يوم الأسبوع»: the day's name in calligraphy (the owner's seven pictures, res/drawable-nodpi/day_0..6, Sunday first) with
 * the Hijri and Gregorian date under it, as a heading for the home screen and, where the phone takes widgets there, the
 * lock screen. Anyone can place it: it shows the day while the app is open (the free day, a paid year); otherwise the
 * day shows faintly under a line inviting to subscribe. The ground behind the lettering is as see-through as the user
 * chose (Widgets.bg).
 * The day changes at midnight in Mauritania's time (UTC), like the rest of the app.
 */
public class DayWidget extends AppWidgetProvider {
    static final String TICK = "mr.erriwaya.calendar.DAY_TICK";
    private static final int[] IMG = {R.drawable.day_0, R.drawable.day_1, R.drawable.day_2, R.drawable.day_3, R.drawable.day_4, R.drawable.day_5, R.drawable.day_6};
    private static final String[] G_MONTHS = {"يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"};
    private static final String[] H_MONTHS = {"محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"};

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
        return PendingIntent.getBroadcast(ctx, 5, new Intent(ctx, DayWidget.class).setAction(TICK), flags);
    }

    /** Redraws every placed widget and sets the alarm for the next redraw (midnight, or the end of the subscription). */
    static void updateAll(Context ctx) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(ctx);
            if (m == null) return;
            int[] ids = m.getAppWidgetIds(new ComponentName(ctx, DayWidget.class));
            if (ids == null || ids.length == 0) return;
            long now = System.currentTimeMillis();
            long day = PrayerCalc.fd(now, PrayerCalc.DAY);
            long next = (day + 1) * PrayerCalc.DAY;
            boolean open = Sub.open(ctx);
            long end = Math.max(Sub.trialEnd(ctx), Sub.paidUntil(ctx));
            if (open && end > now) next = Math.min(next, end);
            RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_day);
            JSONObject c = AdhanReceiver.config(ctx);
            int[] g = PrayerCalc.gregorian(day), h = CalendarWidget.hijri(day, c == null ? 0 : c.optInt("adj", 0));
            int di = (int) (((day + 4) % 7 + 7) % 7), hm = Math.max(1, Math.min(12, h[1])) - 1;   // 1970-01-01 was a Thursday
            v.setImageViewResource(R.id.dImg, IMG[di]);
            v.setInt(R.id.dImg, "setImageAlpha", open ? 255 : 70);   // not subscribed: the day shows faintly, as an invitation
            v.setInt(R.id.dBg, "setImageAlpha", Widgets.bg(ctx) * 255 / 100);
            v.setViewVisibility(R.id.dLock, open ? View.GONE : View.VISIBLE);
            v.setViewVisibility(R.id.dDate, open ? View.VISIBLE : View.GONE);
            v.setTextViewText(R.id.dDate, h[2] + " " + H_MONTHS[hm] + " " + h[0] + " هـ · " + g[2] + " " + G_MONTHS[g[1] - 1] + " " + g[0]);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
            Intent app = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            v.setOnClickPendingIntent(R.id.dRoot, PendingIntent.getActivity(ctx, 6, app, flags));
            m.updateAppWidget(ids, v);
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am != null) am.setWindow(AlarmManager.RTC, next + 1000, 60000, tick(ctx));   // need not wake a sleeping phone
        } catch (Exception ignored) { }
    }
}
