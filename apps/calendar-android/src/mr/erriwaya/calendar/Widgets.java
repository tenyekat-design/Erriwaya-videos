package mr.erriwaya.calendar;

import android.content.Context;

/** What the two home-screen widgets share: how opaque their background is (0 see-through … 100 solid), set from the page. */
final class Widgets {
    private Widgets() { }

    static int bg(Context ctx) {
        return Math.max(0, Math.min(100, ctx.getSharedPreferences("widgets", Context.MODE_PRIVATE).getInt("bg", 100)));
    }

    static void setBg(Context ctx, int percent) {
        ctx.getSharedPreferences("widgets", Context.MODE_PRIVATE).edit().putInt("bg", Math.max(0, Math.min(100, percent))).apply();
        CalendarWidget.updateAll(ctx);
        DayWidget.updateAll(ctx);
    }
}
