package mr.erriwaya.calendar;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.widget.RemoteViews;

import org.json.JSONObject;

/**
 * The home-screen widget: the Hijri and Gregorian date, the city, and the day's five prayer times with the next one
 * marked. It is drawn from the settings the page hands over (AdhanReceiver.config) with PrayerCalc, so it needs neither
 * the page nor the network; before the first hand-over it shows Nouakchott with the default method.
 * It redraws itself at each prayer time and at midnight (Mauritania's time, UTC), and whenever the settings change.
 */
public class CalendarWidget extends AppWidgetProvider {
    static final String TICK = "mr.erriwaya.calendar.WIDGET_TICK";
    private static final String[] G_MONTHS = {"يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"};
    private static final String[] H_MONTHS = {"محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"};
    private static final String[] G_MONTHS_FR = {"janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"};
    private static final String[] H_MONTHS_FR = {"Mouharram", "Safar", "Rabi I", "Rabi II", "Joumada I", "Joumada II", "Rajab", "Chaabane", "Ramadan", "Chawwal", "Dhou al-Qi`da", "Dhou al-Hijja"};
    private static final String[] DAYS_FR = {"Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"};
    private static final String[] DAYS = {"الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"};
    private static final int[] PRAYERS = {PrayerCalc.FAJR, PrayerCalc.DHUHR, PrayerCalc.ASR, PrayerCalc.MAGHRIB, PrayerCalc.ISHA};
    private static final int[] CELL = {R.id.c0, R.id.c1, R.id.c2, R.id.c3, R.id.c4};
    private static final int[] NAME = {R.id.n0, R.id.n1, R.id.n2, R.id.n3, R.id.n4};
    private static final int[] TIME = {R.id.t0, R.id.t1, R.id.t2, R.id.t3, R.id.t4};

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
        return PendingIntent.getBroadcast(ctx, 3, new Intent(ctx, CalendarWidget.class).setAction(TICK), flags);
    }

    /** {year, month, day} in the Hijri calendar: Umm al-Qura as in the page (Android 7+), else the arithmetic calendar. */
    static int[] hijri(long epochDay, int adj) {
        long day = epochDay + adj;
        if (Build.VERSION.SDK_INT >= 24) {
            try {
                android.icu.util.IslamicCalendar c = new android.icu.util.IslamicCalendar(android.icu.util.TimeZone.GMT_ZONE, java.util.Locale.ROOT);
                c.setCalculationType(android.icu.util.IslamicCalendar.CalculationType.ISLAMIC_UMALQURA);
                c.setTimeInMillis(day * PrayerCalc.DAY + PrayerCalc.DAY / 2);
                return new int[]{c.get(android.icu.util.Calendar.YEAR), c.get(android.icu.util.Calendar.MONTH) + 1, c.get(android.icu.util.Calendar.DAY_OF_MONTH)};
            } catch (Throwable ignored) { }
        }
        return PrayerCalc.civil(day + 2440588);
    }

    /** Redraws every placed widget and sets the alarm for the next redraw. Safe to call when none is placed. */
    static void updateAll(Context ctx) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(ctx);
            if (m == null) return;
            int[] ids = m.getAppWidgetIds(new ComponentName(ctx, CalendarWidget.class));
            if (ids == null || ids.length == 0) return;
            long now = System.currentTimeMillis();
            long next = draw(ctx, m, ids, now);
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am != null) am.setWindow(AlarmManager.RTC, next, 60000, tick(ctx));   // need not wake a sleeping phone
        } catch (Exception ignored) { }
    }

    /** Draws the widgets for the moment `now` and returns when they must be drawn again. */
    private static long draw(Context ctx, AppWidgetManager m, int[] ids, long now) {
        JSONObject c = AdhanReceiver.config(ctx);
        if (c == null) c = new JSONObject();
        long day = PrayerCalc.fd(now, PrayerCalc.DAY);
        double[] t = AdhanReceiver.timesOf(c, day);
        // the next prayer: today's first one still ahead, else tomorrow's fajr
        int nextIdx = -1;
        long redraw = (day + 1) * PrayerCalc.DAY;   // midnight: the date changes
        for (int i = 0; i < PRAYERS.length; i++) {
            int mins = PrayerCalc.minutes(t[PRAYERS[i]]);
            if (mins < 0) continue;
            long at = day * PrayerCalc.DAY + mins * 60000L;
            if (at > now) { nextIdx = i; redraw = Math.min(redraw, at); break; }
        }
        boolean tomorrow = nextIdx < 0;
        double[] tn = tomorrow ? AdhanReceiver.timesOf(c, day + 1) : t;
        if (tomorrow) nextIdx = 0;

        int[] g = PrayerCalc.gregorian(day), h = hijri(day, c.optInt("adj", 0));
        boolean fr = AdhanReceiver.french(c);
        String[] names = AdhanReceiver.names(c);
        int di = (int) (((day + 4) % 7 + 7) % 7), hm = Math.max(1, Math.min(12, h[1])) - 1;   // 1970-01-01 was a Thursday
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_calendar);
        v.setInt(R.id.wRoot, "setLayoutDirection", fr ? 0 : 1);   // View.LAYOUT_DIRECTION_LTR / _RTL
        v.setTextViewText(R.id.wHijri, h[2] + " " + (fr ? H_MONTHS_FR : H_MONTHS)[hm] + " " + h[0] + (fr ? " H" : " هـ"));
        v.setTextViewText(R.id.wCity, AdhanReceiver.cityOf(c));
        v.setTextViewText(R.id.wGreg, (fr ? DAYS_FR : DAYS)[di] + " " + g[2] + " " + (fr ? G_MONTHS_FR : G_MONTHS)[g[1] - 1] + " " + g[0]);
        v.setTextViewText(R.id.wNext, (fr ? "Prochaine : " : "القادمة: ") + names[PRAYERS[nextIdx]]
                + (tomorrow ? (fr ? " demain " : " غدًا ") : " ") + PrayerCalc.fmt(tn[PRAYERS[nextIdx]]));
        boolean locked = !Sub.open(ctx);
        for (int i = 0; i < PRAYERS.length; i++) {
            v.setTextViewText(NAME[i], names[PRAYERS[i]]);
            v.setTextViewText(TIME[i], locked ? "—" : PrayerCalc.fmt((i == nextIdx ? tn : t)[PRAYERS[i]]));
        }
        // locked (the free day is over and there is no subscription): no date and no times, only the way back in
        if (locked) {
            v.setTextViewText(R.id.wHijri, fr ? "Calendrier mauritanien" : "التقويم الموريتاني");
            v.setTextViewText(R.id.wCity, "");
            v.setTextViewText(R.id.wGreg, fr ? "Essai gratuit terminé" : "انتهت التجربة المجانية");
            v.setTextViewText(R.id.wNext, fr ? "Abonnez-vous" : "اشترك لفتح التطبيق");
        } else {
            long end = Math.max(Sub.trialEnd(ctx), Sub.paidUntil(ctx));
            if (end > now) redraw = Math.min(redraw, end);   // redraw at the moment the app locks
        }
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        Intent open = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        v.setOnClickPendingIntent(R.id.wRoot, PendingIntent.getActivity(ctx, 4, open, flags));
        // each widget its own background (Widgets.bg); over a wallpaper (less than half solid) the texts turn white
        for (int id : ids) {
            int bg = Widgets.bg(ctx, id);
            boolean clear = bg < 50;
            int ink = clear ? 0xFFFFFFFF : color(ctx, R.color.w_ink), muted = clear ? 0xFFECECEC : color(ctx, R.color.w_muted),
                    hiInk = color(ctx, R.color.w_hi_ink);
            v.setInt(R.id.wBg, "setImageAlpha", bg * 255 / 100);
            v.setTextColor(R.id.wHijri, clear ? 0xFFFFFFFF : color(ctx, R.color.w_green));
            v.setTextColor(R.id.wCity, clear ? 0xFFFFE9A8 : color(ctx, R.color.w_gold));
            v.setTextColor(R.id.wGreg, muted);
            v.setTextColor(R.id.wNext, muted);
            for (int i = 0; i < PRAYERS.length; i++) {
                boolean hi = i == nextIdx && !locked;
                v.setInt(CELL[i], "setBackgroundResource", hi ? R.drawable.widget_hi : 0);
                v.setTextColor(NAME[i], hi ? hiInk : muted);
                v.setTextColor(TIME[i], hi ? hiInk : locked ? muted : ink);
            }
            m.updateAppWidget(id, v);
        }
        return redraw + 1000;
    }

    @SuppressWarnings("deprecation")
    private static int color(Context ctx, int id) {
        return Build.VERSION.SDK_INT >= 23 ? ctx.getColor(id) : ctx.getResources().getColor(id);
    }
}
