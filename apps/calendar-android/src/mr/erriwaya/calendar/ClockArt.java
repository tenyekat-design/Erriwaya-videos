package mr.erriwaya.calendar;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Typeface;

import java.util.Calendar;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Draws the clock widget's figure styles (d1..d10) as a picture. A widget cannot use the app's own fonts (RemoteViews
 * allow only the system's), so the tall typefaces (assets/fonts/clk_*.ttf, SIL Open Font License, cut down to the digits
 * by tools/clock-models.py) are drawn here and ClockWidget sets the picture every minute. Sizes are in dp, given by the
 * height of the digits; the hours are mostly taller than the minutes.
 */
final class ClockArt {
    private ClockArt() { }

    static final int WHITE = 0xFFFFFFFF, GOLD = 0xFFE6BC62, CREAM = 0xFFF2EEDC, NAVY = 0xFF0B1F5C, MIST = 0xFFB9C2E8;
    private static final Map<String, Typeface> FONTS = new HashMap<>();

    private static Typeface font(Context ctx, String name) {
        Typeface t = FONTS.get(name);
        if (t == null) {
            try { t = Typeface.createFromAsset(ctx.getAssets(), "fonts/clk_" + name + ".ttf"); } catch (Exception e) { t = Typeface.create("sans-serif-condensed", Typeface.NORMAL); }
            FONTS.put(name, t);
        }
        return t;
    }

    /** One run of figures: its text, typeface, digit height (dp), colour, and a golden glow if wished. */
    private static final class Run {
        final String text; final Typeface tf; final float h; final int color; final boolean glow;
        final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG);
        float w;   // width, dp
        Run(Context ctx, String text, String font, float h, int color, boolean glow) {
            this.text = text; this.tf = font(ctx, font); this.h = h; this.color = color; this.glow = glow;
            p.setTypeface(tf);
            p.setTextSize(1000);
            Rect r = new Rect();
            p.getTextBounds("0", 0, 1, r);
            p.setTextSize(h * 1000f / Math.max(1, -r.top));
            p.setColor(color);
            w = p.measureText(text);
        }
        /** Draws with the digits' top at y (dp units; the canvas is scaled). */
        void draw(Canvas c, float x, float y) {
            if (glow) {
                p.setShadowLayer(h * 0.18f, 0, 0, 0xAAE6BC62);
                c.drawText(text, x, y + h, p);
                p.clearShadowLayer();
            } else {
                p.setShadowLayer(3, 0, 1, 0x66000000);
            }
            c.drawText(text, x, y + h, p);
            p.clearShadowLayer();
        }
    }

    /** The picture for model (d1..d10) at time cal, drawn at the given pixels per dp. */
    static Bitmap render(Context ctx, String model, Calendar cal, float scale) {
        String hh = String.format(Locale.US, "%02d", cal.get(Calendar.HOUR_OF_DAY));
        int h12 = cal.get(Calendar.HOUR); if (h12 == 0) h12 = 12;
        String mm = String.format(Locale.US, "%02d", cal.get(Calendar.MINUTE));
        boolean pm = cal.get(Calendar.AM_PM) == Calendar.PM;
        switch (model) {
            case "d2": return row(ctx, scale, new Run(ctx, hh, "sixcaps", 80, WHITE, false), new Run(ctx, ":" + mm, "sixcaps", 50, GOLD, false), 'b', 2, 0, null, false);
            case "d3": return one(ctx, scale, new Run(ctx, hh + ":" + mm, "shoulders_light", 76, WHITE, false));
            case "d4": return row(ctx, scale, new Run(ctx, hh, "shoulders_black", 80, WHITE, false), new Run(ctx, mm, "shoulders_black", 44, GOLD, false), 'b', 6, 0, null, false);
            case "d5": return row(ctx, scale, new Run(ctx, hh, "antonio", 78, WHITE, false), new Run(ctx, mm, "antonio", 38, GOLD, false), 't', 5, 0, null, false);
            case "d6": return stack(ctx, scale, new Run(ctx, hh, "league", 58, WHITE, false), new Run(ctx, mm, "league", 30, GOLD, false));
            case "d7": return one(ctx, scale, new Run(ctx, hh + ":" + mm, "tulpen", 80, GOLD, true));
            case "d8": return row(ctx, scale, new Run(ctx, hh, "saira", 78, WHITE, false), new Run(ctx, mm, "saira", 40, GOLD, false), 'c', 8, 2, null, false);
            case "d9": return row(ctx, scale, new Run(ctx, hh, "bebas", 76, WHITE, false), new Run(ctx, mm, "bebas", 28, NAVY, false), 'c', 8, 0, null, true);
            case "d10": return row(ctx, scale, new Run(ctx, String.valueOf(h12), "pathway", 78, WHITE, false), new Run(ctx, mm, "pathway", 40, GOLD, false), 'c', 7, 0, pm ? "م" : "ص", false);
            default: return one(ctx, scale, new Run(ctx, hh + ":" + mm, "sixcaps", 82, WHITE, false));
        }
    }

    private static final float PAD = 6;   // room for the shadow and the round digits' overshoot

    private static Bitmap canvas(float w, float h, float scale, Canvas[] out) {
        Bitmap b = Bitmap.createBitmap(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)), Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        c.scale(scale, scale);
        out[0] = c;
        return b;
    }

    private static Bitmap one(Context ctx, float scale, Run r) {
        float g = r.glow ? r.h * 0.25f : 0;
        Canvas[] c = new Canvas[1];
        Bitmap b = canvas(r.w + 2 * (PAD + g), r.h + 2 * (PAD + g), scale, c);
        r.draw(c[0], PAD + g, PAD + g);
        return b;
    }

    /** Hours then minutes: aligned at the bottom ('b'), top ('t') or centre ('c'); with a gold rule between them (bar dp
     *  wide), the minutes in a gold tab (chip), or ص/م under the minutes (ampm). */
    private static Bitmap row(Context ctx, float scale, Run a, Run m, char align, float gap, float bar, String ampm, boolean chip) {
        float chipX = chip ? 7 : 0, chipY = chip ? 7 : 0;
        Paint ap = null; float apH = 0, apW = 0;
        if (ampm != null) {
            ap = new Paint(Paint.ANTI_ALIAS_FLAG);
            ap.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
            ap.setTextSize(15);
            ap.setColor(MIST);
            apH = 18; apW = ap.measureText(ampm);
        }
        float mw = Math.max(m.w + 2 * chipX, apW), mh = m.h + 2 * chipY + (ap != null ? 4 + apH : 0);
        float barGap = bar > 0 ? bar + gap : 0;
        float w = a.w + gap + barGap + mw, h = Math.max(a.h, mh);
        Canvas[] cc = new Canvas[1];
        Bitmap b = canvas(w + 2 * PAD, h + 2 * PAD, scale, cc);
        Canvas c = cc[0];
        float x = PAD, top = PAD;
        a.draw(c, x, top + (h - a.h) / 2 * (align == 'c' ? 1 : 0) + (align == 'b' ? h - a.h : 0));
        x += a.w + gap;
        if (bar > 0) {
            Paint bp = new Paint(Paint.ANTI_ALIAS_FLAG);
            bp.setColor(GOLD);
            float bh = Math.min(h, a.h * 0.75f);
            c.drawRect(x, top + (h - bh) / 2, x + bar, top + (h - bh) / 2 + bh, bp);
            x += barGap;
        }
        float my = align == 't' ? top : align == 'b' ? top + h - m.h : top + (h - mh) / 2;
        if (chip) {
            Paint cp = new Paint(Paint.ANTI_ALIAS_FLAG);
            cp.setColor(GOLD);
            c.drawRoundRect(new RectF(x, my, x + m.w + 2 * chipX, my + m.h + 2 * chipY), 5, 5, cp);
            m.p.setColor(NAVY);
            c.drawText(m.text, x + chipX, my + chipY + m.h, m.p);
        } else {
            m.draw(c, x, my);
        }
        if (ap != null) c.drawText(ampm, x + (m.w - apW) / 2, my + m.h + 4 + 14, ap);
        return b;
    }

    /** Hours over a gold rule over the minutes. */
    private static Bitmap stack(Context ctx, float scale, Run a, Run m) {
        float rule = 2, gap = 5, w = Math.max(a.w, m.w), h = a.h + gap + rule + gap + m.h;
        Canvas[] cc = new Canvas[1];
        Bitmap b = canvas(w + 2 * PAD, h + 2 * PAD, scale, cc);
        Canvas c = cc[0];
        a.draw(c, PAD + (w - a.w) / 2, PAD);
        Paint bp = new Paint(Paint.ANTI_ALIAS_FLAG);
        bp.setColor(GOLD);
        float rw = w * 0.8f;
        c.drawRect(PAD + (w - rw) / 2, PAD + a.h + gap, PAD + (w + rw) / 2, PAD + a.h + gap + rule, bp);
        m.draw(c, PAD + (w - m.w) / 2, PAD + a.h + 2 * gap + rule);
        return b;
    }
}
