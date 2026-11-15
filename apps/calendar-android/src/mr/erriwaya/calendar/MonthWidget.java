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

    /** The month's lettering with its date under it, as one picture (transparent around them). */
    private static android.graphics.Bitmap card(Context ctx, int res, String date) {
        android.graphics.BitmapFactory.Options o = new android.graphics.BitmapFactory.Options();
        o.inScaled = false;
        android.graphics.Bitmap art = android.graphics.BitmapFactory.decodeResource(ctx.getResources(), res, o);
        float tw = 64f, gap = 14f;
        android.graphics.Paint p = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        p.setColor(0xFFF2EEDC);
        p.setTextSize(tw);
        p.setTextAlign(android.graphics.Paint.Align.CENTER);
        p.setShadowLayer(6f, 0f, 2f, 0xC0000000);
        android.graphics.Paint.FontMetrics fm = p.getFontMetrics();
        int w = Math.max(art.getWidth(), (int) p.measureText(date) + 20);
        int h = art.getHeight() + (int) (gap + fm.descent - fm.ascent) + 6;
        android.graphics.Bitmap out = android.graphics.Bitmap.createBitmap(w, h, android.graphics.Bitmap.Config.ARGB_8888);
        android.graphics.Canvas c = new android.graphics.Canvas(out);
        c.drawBitmap(art, (w - art.getWidth()) / 2f, 0, null);
        c.drawText(date, w / 2f, art.getHeight() + gap - fm.ascent, p);
        art.recycle();
        return out;
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
                // each month one picture: its lettering with its date right under it, so the two always stay together
                String hd = h[2] + " · " + h[0] + " هـ", gd = g[2] + " · " + g[0] + " م";
                boolean[] on = {open && show.contains("h"), open && show.contains("l"), open && show.contains("g")};
                int[] view = {R.id.mH, R.id.mL, R.id.mG};
                String[] set = {"h", "l", "g"}, date = {hd, hd, gd};
                int count = 0;
                for (boolean b : on) if (b) count++;
                int gap = count == 2 ? (int) (18 * ctx.getResources().getDisplayMetrics().density) : 0, seen = 0;
                for (int k = 0; k < 3; k++) {
                    v.setViewVisibility(view[k], on[k] ? View.VISIBLE : View.GONE);
                    // two months: room between them (the first is on the right, in a right-to-left row)
                    v.setViewPadding(view[k], 0, 0, 0, 0);
                    if (on[k]) {
                        if (count == 2) v.setViewPadding(view[k], seen == 0 ? gap : 0, 0, seen == 1 ? gap : 0, 0);
                        v.setImageViewBitmap(view[k], card(ctx, pic(ctx, set[k], k == 2 ? gm : hm), date[k]));
                        seen++;
                    }
                }
                v.setViewVisibility(R.id.mLock, open ? View.GONE : View.VISIBLE);
                Widgets.applyBg(ctx, v, R.id.mBg, id, R.drawable.widget_day_bg);
                v.setOnClickPendingIntent(R.id.mRoot, PendingIntent.getActivity(ctx, 8, app, flags));
                m.updateAppWidget(id, v);
            }
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am != null) am.setWindow(AlarmManager.RTC, next + 1000, 60000, tick(ctx));
        } catch (Exception ignored) { }
    }
}
