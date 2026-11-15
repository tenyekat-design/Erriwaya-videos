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
 * «أشهر السنة»: the month's name in calligraphy, the owner's pictures: Hijri (mh_01..12), Hassaniya (ml_01..12, the
 * Hijri months' Mauritanian names) and Gregorian (mg_01..12). Each widget shows the names its owner chose (all three,
 * two or one: WidgetConfig) over a ground as opaque as he chose. Works on the free day and for subscribers; otherwise
 * only a line inviting to subscribe. Changes at midnight in Mauritania's time (UTC).
 */
public class MonthWidget extends AppWidgetProvider {
    static final String TICK = "mr.erriwaya.calendar.MONTH_TICK";

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
        return PendingIntent.getBroadcast(ctx, 7, new Intent(ctx, MonthWidget.class).setAction(TICK), flags);
    }

    private static int pic(Context ctx, String set, int month) {
        return ctx.getResources().getIdentifier(String.format(java.util.Locale.ROOT, "m%s_%02d", set, month), "drawable", ctx.getPackageName());
    }

    static void updateAll(Context ctx) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(ctx);
            if (m == null) return;
            int[] ids = m.getAppWidgetIds(new ComponentName(ctx, MonthWidget.class));
            if (ids == null || ids.length == 0) return;
            long now = System.currentTimeMillis();
            long day = PrayerCalc.fd(now, PrayerCalc.DAY);
            long next = (day + 1) * PrayerCalc.DAY;
            boolean open = Sub.open(ctx);
            long end = Math.max(Sub.trialEnd(ctx), Sub.paidUntil(ctx));
            if (open && end > now) next = Math.min(next, end);
            JSONObject c = AdhanReceiver.config(ctx);
            int[] g = PrayerCalc.gregorian(day), h = CalendarWidget.hijri(day, c == null ? 0 : c.optInt("adj", 0));
            int hm = Math.max(1, Math.min(12, h[1])), gm = Math.max(1, Math.min(12, g[1]));
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
            Intent app = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            for (int id : ids) {
                RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_month);
                String show = Widgets.months(ctx, id);
                v.setImageViewResource(R.id.mH, pic(ctx, "h", hm));
                v.setImageViewResource(R.id.mL, pic(ctx, "l", hm));
                v.setImageViewResource(R.id.mG, pic(ctx, "g", gm));
                v.setViewVisibility(R.id.mH, open && show.contains("h") ? View.VISIBLE : View.GONE);
                v.setViewVisibility(R.id.mL, open && show.contains("l") ? View.VISIBLE : View.GONE);
                v.setViewVisibility(R.id.mG, open && show.contains("g") ? View.VISIBLE : View.GONE);
                v.setViewVisibility(R.id.mLock, open ? View.GONE : View.VISIBLE);
                v.setInt(R.id.mBg, "setImageAlpha", Widgets.bg(ctx, id) * 255 / 100);
                v.setOnClickPendingIntent(R.id.mRoot, PendingIntent.getActivity(ctx, 8, app, flags));
                m.updateAppWidget(id, v);
            }
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am != null) am.setWindow(AlarmManager.RTC, next + 1000, 60000, tick(ctx));
        } catch (Exception ignored) { }
    }
}
