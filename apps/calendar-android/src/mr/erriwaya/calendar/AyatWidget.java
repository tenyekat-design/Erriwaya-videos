package mr.erriwaya.calendar;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Bundle;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;

/**
 * «آيات من القرآن»: a verse in the Warsh script (assets/data/ayat-warsh.json: short, well-known verses picked by
 * tools in the session of 16 Nov 2026, text from the app's Warsh mushaf), drawn as a picture in the Warsh font
 * (assets/fonts/verse-warsh.ttf) with its sura under it. It turns every hour; a tap shows the next one. Not subscribed:
 * the first verse, dimmed, fixed, with the invitation.
 */
public class AyatWidget extends AppWidgetProvider {
    static final String NEXT = "mr.erriwaya.calendar.AYAT_NEXT", TICK = "mr.erriwaya.calendar.AYAT_TICK";
    private static JSONArray list;
    private static Typeface face;

    @Override
    public void onUpdate(Context ctx, AppWidgetManager m, int[] ids) { updateAll(ctx); }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager m, int id, Bundle o) { updateAll(ctx); }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        super.onReceive(ctx, intent);
        String a = intent.getAction();
        if (NEXT.equals(a) && Sub.open(ctx)) { step(ctx); updateAll(ctx); }
        else if (TICK.equals(a)) { step(ctx); updateAll(ctx); }
    }

    @Override
    public void onDisabled(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(pi(ctx, TICK, 21));
    }

    private static SharedPreferences sp(Context ctx) { return ctx.getSharedPreferences("widgets", Context.MODE_PRIVATE); }

    private static void step(Context ctx) {
        JSONArray l = list(ctx);
        int n = l == null ? 1 : l.length();
        sp(ctx).edit().putInt("ayah", (sp(ctx).getInt("ayah", -1) + 1 + n) % n).apply();
    }

    private static PendingIntent pi(Context ctx, String action, int code) {
        int f = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        return PendingIntent.getBroadcast(ctx, code, new Intent(ctx, AyatWidget.class).setAction(action), f);
    }

    private static synchronized JSONArray list(Context ctx) {
        if (list == null) {
            try (InputStream in = ctx.getAssets().open("data/ayat-warsh.json")) {
                java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream();
                byte[] buf = new byte[8192];
                int k;
                while ((k = in.read(buf)) > 0) bo.write(buf, 0, k);
                list = new JSONArray(bo.toString("UTF-8"));
            } catch (Exception e) { list = new JSONArray(); }
        }
        return list;
    }

    private static final String DIG = "٠١٢٣٤٥٦٧٨٩";

    private static String ar(int n) {
        StringBuilder b = new StringBuilder();
        for (char c : String.valueOf(n).toCharArray()) b.append(DIG.charAt(c - '0'));
        return b.toString();
    }

    /** The verse as a picture w x h dp (at most 2 px per dp): the text as large as fits, the sura under it in gold. */
    static Bitmap render(Context ctx, JSONObject v, float wDp, float hDp, float scale) {
        if (face == null) {
            try { face = Typeface.createFromAsset(ctx.getAssets(), "fonts/verse-warsh.ttf"); } catch (Exception e) { face = Typeface.SERIF; }
        }
        int W = Math.max(1, Math.round(wDp * scale)), H = Math.max(1, Math.round(hDp * scale));
        Bitmap b = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        String text = v.optString("t");
        JSONArray vs = v.optJSONArray("v");
        String ref = "سورة " + v.optString("n").replaceAll("[\\u064B-\\u0652]", "") + " · "
                + (vs == null || vs.length() == 0 ? "" : ar(vs.optInt(0)) + (vs.length() > 1 ? "–" + ar(vs.optInt(vs.length() - 1)) : ""));
        TextPaint rp = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        rp.setColor(0xFFE6BC62);
        rp.setTextSize(13 * scale);
        rp.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        float refH = 22 * scale, pad = 10 * scale, availW = W - 2 * pad, availH = H - refH - pad;
        TextPaint tp = new TextPaint(Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG);
        tp.setTypeface(face);
        tp.setColor(0xFFF2EEDC);
        tp.setShadowLayer(3 * scale, 0, scale, 0x88000000);
        // the largest size whose lines fit
        float size = 34 * scale;
        StaticLayout lay;
        while (true) {
            tp.setTextSize(size);
            lay = new StaticLayout(text, tp, (int) availW, Layout.Alignment.ALIGN_CENTER, 1.0f, 0, false);
            if (lay.getHeight() <= availH || size <= 11 * scale) break;
            size *= 0.92f;
        }
        float top = Math.max(pad * 0.5f, (availH - lay.getHeight()) / 2 + pad * 0.3f);
        c.save();
        c.translate(pad, top);
        lay.draw(c);
        c.restore();
        float rw = rp.measureText(ref);
        float ry = Math.min(H - pad * 0.6f, top + lay.getHeight() + refH * 0.85f);
        c.drawText(ref, (W - rw) / 2, ry, rp);
        // two small gold stars beside the reference
        Paint st = new Paint(Paint.ANTI_ALIAS_FLAG);
        st.setColor(0xFFE6BC62);
        for (int s = -1; s <= 1; s += 2) {
            float cx = W / 2f + s * (rw / 2 + 12 * scale), cy = ry - 4.5f * scale, r = 3.2f * scale;
            android.graphics.Path p = new android.graphics.Path();
            p.moveTo(cx, cy - r); p.lineTo(cx + r * 0.55f, cy); p.lineTo(cx, cy + r); p.lineTo(cx - r * 0.55f, cy); p.close();
            c.drawPath(p, st);
        }
        return b;
    }

    static void updateAll(Context ctx) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(ctx);
            if (m == null) return;
            int[] ids = m.getAppWidgetIds(new ComponentName(ctx, AyatWidget.class));
            if (ids == null || ids.length == 0) return;
            JSONArray l = list(ctx);
            if (l.length() == 0) return;
            boolean open = Sub.open(ctx);
            int i = open ? Math.max(0, sp(ctx).getInt("ayah", 0)) % l.length() : 0;
            JSONObject v = l.getJSONObject(i);
            float scale = Math.min(2f, ctx.getResources().getDisplayMetrics().density);
            int f = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
            Intent app = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            for (int id : ids) {
                Bundle o = m.getAppWidgetOptions(id);
                float w = 250, h = 110;
                if (o != null) {
                    int ow = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH), oh = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT);
                    if (ow > 60 && oh > 40) { w = ow; h = oh; }
                }
                RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.widget_ayat);
                rv.setImageViewBitmap(R.id.aImg, render(ctx, v, w - 12, h - 12, scale));
                rv.setInt(R.id.aImg, "setImageAlpha", open ? 255 : 90);
                rv.setViewVisibility(R.id.aLock, open ? View.GONE : View.VISIBLE);
                Widgets.applyBg(ctx, rv, R.id.aBg, id, R.drawable.widget_day_bg);
                rv.setOnClickPendingIntent(R.id.aRoot, open ? pi(ctx, NEXT, 20) : PendingIntent.getActivity(ctx, 22, app, f));
                m.updateAppWidget(id, rv);
            }
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am != null && open) {
                long now = System.currentTimeMillis(), next = (now / 3600000L + 1) * 3600000L;
                long end = Math.max(Sub.trialEnd(ctx), Sub.paidUntil(ctx));
                am.setWindow(AlarmManager.RTC, Math.min(next, end > now ? end : next), 120000, pi(ctx, TICK, 21));
            }
        } catch (Exception ignored) { }
    }
}
