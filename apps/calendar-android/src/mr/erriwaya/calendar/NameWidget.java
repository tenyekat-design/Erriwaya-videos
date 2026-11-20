package mr.erriwaya.calendar;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.view.View;
import android.widget.RemoteViews;

/**
 * «اسمك بالخط العربي»: a name in decorated Thuluth (the owner's pictures of 19 Nov 2026, res/drawable-nodpi/nm_*, cut by
 * tools/name-lettering.py), chosen per widget in its settings (WidgetConfig), over a ground as opaque as the user chose or
 * a photo of his own. Works on the free day and for subscribers; otherwise dimmed with the invitation, like the others.
 */
public class NameWidget extends AppWidgetProvider {
    /** key, name: the order shown in the settings. */
    static final String[][] NAMES = {
            {"mohamedsalem", "محمد سالم"}, {"abdurrahman", "عبد الرحمن"}, {"ahmed", "أحمد"}, {"mohamedahmed", "محمد أحمد"},
            {"mohamedlemine", "محمد الأمين"}, {"mohamedali", "محمد عالي"}, {"mohamedcheikh", "محمد الشيخ"},
            {"mohamedmahmoud", "محمد محمود"}};

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) { updateAll(ctx); }

    static int pic(Context ctx, String key) {
        int r = ctx.getResources().getIdentifier("nm_" + key, "drawable", ctx.getPackageName());
        return r != 0 ? r : R.drawable.nm_mohamedsalem;
    }

    static void updateAll(Context ctx) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(ctx);
            if (m == null) return;
            int[] ids = m.getAppWidgetIds(new ComponentName(ctx, NameWidget.class));
            if (ids == null || ids.length == 0) return;
            boolean open = Sub.open(ctx);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
            Intent app = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            for (int id : ids) {
                RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_name);
                v.setImageViewResource(R.id.nImg, pic(ctx, Widgets.name(ctx, id)));
                v.setInt(R.id.nImg, "setImageAlpha", open ? 255 : 90);
                v.setViewVisibility(R.id.nLock, open ? View.GONE : View.VISIBLE);
                Widgets.applyBg(ctx, v, R.id.nBg, id, R.drawable.widget_day_bg);
                v.setOnClickPendingIntent(R.id.nRoot, PendingIntent.getActivity(ctx, 9, app, flags));
                m.updateAppWidget(id, v);
            }
        } catch (Exception ignored) { }
    }
}
