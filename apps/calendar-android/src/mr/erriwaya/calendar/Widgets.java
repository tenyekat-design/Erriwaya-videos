package mr.erriwaya.calendar;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * What the widgets share. The background's opacity (0 none … 100 solid): one value set from the app's settings, which
 * each widget can override from its own settings (WidgetConfig); and, for the month widget, which names it shows.
 */
final class Widgets {
    private Widgets() { }

    private static SharedPreferences sp(Context ctx) { return ctx.getSharedPreferences("widgets", Context.MODE_PRIVATE); }

    static int bg(Context ctx) { return clamp(sp(ctx).getInt("bg", 100)); }

    /** This widget's background: its own choice, or the app's. */
    static int bg(Context ctx, int id) { SharedPreferences p = sp(ctx); return clamp(p.getInt("bg_" + id, p.getInt("bg", 100))); }

    /** From the app's settings: every widget follows it (their own choices are cleared). */
    static void setBg(Context ctx, int percent) {
        SharedPreferences.Editor e = sp(ctx).edit().putInt("bg", clamp(percent));
        for (String k : sp(ctx).getAll().keySet()) if (k.startsWith("bg_")) e.remove(k);
        e.apply();
        updateAll(ctx);
    }

    static void setBg(Context ctx, int id, int percent) { sp(ctx).edit().putInt("bg_" + id, clamp(percent)).apply(); }

    /** The month widget's names: any of h (Hijri), l (Hassaniya), g (Gregorian); all three by default. */
    static String months(Context ctx, int id) { String m = sp(ctx).getString("m_" + id, "hlg"); return m.isEmpty() ? "hlg" : m; }

    static void setMonths(Context ctx, int id, String m) { sp(ctx).edit().putString("m_" + id, m).apply(); }

    /** The clock widget's model: d1..d8 (figures) or a1..a6 (hands); d1 by default ("d"/"a" from 1.139 mean d1/a1). */
    static String clock(Context ctx, int id) {
        String c = sp(ctx).getString("c_" + id, "d1");
        return c.length() == 1 ? c + "1" : c;
    }

    /** Whether the clock widget shows the next prayer under the time (yes by default). */
    static boolean clockNext(Context ctx, int id) { return sp(ctx).getBoolean("cn_" + id, true); }

    static void setClockNext(Context ctx, int id, boolean on) { sp(ctx).edit().putBoolean("cn_" + id, on).apply(); }

    static void setClock(Context ctx, int id, String c) { sp(ctx).edit().putString("c_" + id, c).apply(); }

    /** The widget's own photo (WidgetPhoto: picked, cropped to the widget, dimmed, rounded), or a file that does not exist. */
    static java.io.File pic(Context ctx, int id) { return new java.io.File(new java.io.File(ctx.getFilesDir(), "wbg"), id + ".png"); }

    static boolean hasPic(Context ctx, int id) { return pic(ctx, id).isFile(); }

    /**
     * Puts the widget's background into its ImageView: its photo if it has one (served to the launcher by WidgetPics; the
     * file's time in the address makes the launcher load a new crop), else the drawn ground at the chosen opacity.
     */
    static void applyBg(Context ctx, android.widget.RemoteViews v, int view, int id, int ground) {
        java.io.File f = pic(ctx, id);
        if (f.isFile()) {
            v.setImageViewUri(view, android.net.Uri.parse("content://" + WidgetPics.AUTHORITY + "/" + id + "?v=" + f.lastModified()));
            v.setInt(view, "setImageAlpha", 255);
        } else {
            v.setImageViewResource(view, ground);
            v.setInt(view, "setImageAlpha", bg(ctx, id) * 255 / 100);
        }
    }

    static void updateAll(Context ctx) {
        ClockWidget.updateAll(ctx);
        CalendarWidget.updateAll(ctx);
        DayWidget.updateAll(ctx);
        MonthWidget.updateAll(ctx);
        LockNote.update(ctx);
    }

    private static int clamp(int v) { return Math.max(0, Math.min(100, v)); }
}
