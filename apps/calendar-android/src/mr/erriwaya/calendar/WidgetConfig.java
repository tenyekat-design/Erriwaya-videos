package mr.erriwaya.calendar;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProviderInfo;
import android.content.Intent;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.LinearLayout;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

/**
 * One widget's settings: how opaque its background is (solid, 75, 50, 25, none), and for the month widget which names it
 * shows (Hijri, Hassaniya, Gregorian: all, two or one). Opened by long-pressing the widget, then its settings (Android 12
 * and later), or when the widget is placed (older Android). Built in code: a short form, no page.
 */
public class WidgetConfig extends Activity {
    private static final int[] LEVELS = {100, 75, 50, 25, 0};
    private static final String[] LABELS = {"معتمة", "75٪", "50٪", "25٪", "بدون خلفية"};

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        final int id = getIntent().getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        final Intent result = new Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        setResult(RESULT_OK, result);   // leaving without a choice keeps the widget as it is
        if (id == AppWidgetManager.INVALID_APPWIDGET_ID) { finish(); return; }
        AppWidgetProviderInfo info = AppWidgetManager.getInstance(this).getAppWidgetInfo(id);
        final boolean month = info != null && info.provider != null && info.provider.getClassName().endsWith(".MonthWidget");
        final boolean clock = info != null && info.provider != null && info.provider.getClassName().endsWith(".ClockWidget");
        float dp = getResources().getDisplayMetrics().density;

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        box.setPadding((int) (20 * dp), (int) (16 * dp), (int) (20 * dp), (int) (12 * dp));

        // the clock's models as a grid of previews; the chosen one framed in gold
        final String[] chosen = {Widgets.clock(this, id)};
        final CheckBox next = new CheckBox(this);
        if (clock) {
            box.addView(title("نموذج الساعة", dp));
            final java.util.List<View> cards = new java.util.ArrayList<>();
            String[][] models = {
                    {"d1", "رفيع"}, {"d2", "عريض"}, {"d3", "مكثّف ذهبي"}, {"d4", "كلاسيكي"}, {"d5", "بالثواني"}, {"d6", "عمودي"}, {"d7", "12 ساعة"}, {"d8", "أحادي"},
                    {"a1", "ذهبي"}, {"a2", "أرقام عربية"}, {"a3", "أرقام لاتينية"}, {"a4", "بسيط"}, {"a5", "ميناء فاتح"}, {"a6", "نجمة"}};
            LinearLayout row = null;
            for (int i = 0; i < models.length; i++) {
                if (i % 3 == 0) {
                    row = new LinearLayout(this);
                    row.setOrientation(LinearLayout.HORIZONTAL);
                    row.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
                    box.addView(row);
                }
                final String key = models[i][0];
                LinearLayout card = new LinearLayout(this);
                card.setOrientation(LinearLayout.VERTICAL);
                card.setGravity(Gravity.CENTER);
                card.setPadding((int) (4 * dp), (int) (6 * dp), (int) (4 * dp), (int) (6 * dp));
                card.addView(preview(key, dp), new LinearLayout.LayoutParams((int) (88 * dp), (int) (88 * dp)));
                TextView l = new TextView(this);
                l.setText(models[i][1]);
                l.setTextSize(12);
                l.setGravity(Gravity.CENTER);
                card.addView(l);
                LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1);
                cp.setMargins((int) (3 * dp), (int) (3 * dp), (int) (3 * dp), (int) (3 * dp));
                row.addView(card, cp);
                card.setTag(key);
                cards.add(card);
                card.setOnClickListener(v -> { chosen[0] = key; for (View c : cards) frame(c, key.equals(c.getTag()), dp); });
                frame(card, key.equals(chosen[0]), dp);
            }
            next.setText("إظهار الصلاة القادمة تحت الساعة");
            next.setTextSize(15);
            next.setChecked(Widgets.clockNext(this, id));
            box.addView(next);
        }
        box.addView(title("خلفية الويدجت", dp));
        final RadioGroup rg = new RadioGroup(this);
        rg.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        int cur = Widgets.bg(this, id);
        for (int i = 0; i < LEVELS.length; i++) {
            RadioButton r = new RadioButton(this);
            r.setId(1000 + i);
            r.setText(LABELS[i]);
            r.setTextSize(16);
            rg.addView(r);
            if (LEVELS[i] == cur) rg.check(r.getId());
        }
        box.addView(rg);

        final CheckBox[] cb = new CheckBox[3];
        final String[] keys = {"h", "l", "g"};
        if (month) {
            box.addView(title("الأشهر المعروضة", dp));
            String[] names = {"الهجري", "الحساني (عاشور، اتبيّع، المولود…)", "الميلادي"};
            String show = Widgets.months(this, id);
            for (int i = 0; i < 3; i++) {
                cb[i] = new CheckBox(this);
                cb[i].setText(names[i]);
                cb[i].setTextSize(16);
                cb[i].setChecked(show.contains(keys[i]));
                box.addView(cb[i]);
            }
        }

        Button ok = new Button(this);
        ok.setText("تم");
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.topMargin = (int) (14 * dp);
        box.addView(ok, lp);
        ok.setOnClickListener(v -> {
            int sel = rg.getCheckedRadioButtonId() - 1000;
            if (sel >= 0 && sel < LEVELS.length) Widgets.setBg(this, id, LEVELS[sel]);
            if (clock) { Widgets.setClock(this, id, chosen[0]); Widgets.setClockNext(this, id, next.isChecked()); }
            if (month) {
                StringBuilder s = new StringBuilder();
                for (int i = 0; i < 3; i++) if (cb[i].isChecked()) s.append(keys[i]);
                if (s.length() == 0) { Toast.makeText(this, "اختر شهرًا واحدًا على الأقل", Toast.LENGTH_SHORT).show(); return; }
                Widgets.setMonths(this, id, s.toString());
            }
            Widgets.updateAll(this);
            setResult(RESULT_OK, result);
            finish();
        });

        ScrollView sv = new ScrollView(this);
        sv.addView(box);
        setContentView(sv);
        setTitle("إعداد الويدجت");
    }

    private static void frame(View card, boolean on, float dp) {
        android.graphics.drawable.GradientDrawable g = new android.graphics.drawable.GradientDrawable();
        g.setCornerRadius(12 * dp);
        g.setColor(on ? 0x22E6BC62 : 0x00000000);
        g.setStroke((int) ((on ? 2.5f : 1f) * dp), on ? 0xFFE6BC62 : 0x33888888);
        card.setBackground(g);
    }

    /** A small picture of a model: the dial with its hands at 10:10, or the figures in their font and colour. */
    private View preview(String key, float dp) {
        android.widget.FrameLayout f = new android.widget.FrameLayout(this);
        android.graphics.drawable.GradientDrawable ground = new android.graphics.drawable.GradientDrawable();
        ground.setCornerRadius(12 * dp);
        ground.setColor(0xFF06104A);
        f.setBackground(ground);
        android.widget.FrameLayout.LayoutParams full = new android.widget.FrameLayout.LayoutParams(-1, -1);
        if (key.startsWith("a")) {
            String n = key.substring(1);
            String[] parts = {"clock_dial_", "clock_hour_", "clock_minute_"};
            float[] rot = {0, 305, 60};
            for (int i = 0; i < 3; i++) {
                android.widget.ImageView iv = new android.widget.ImageView(this);
                iv.setImageResource(getResources().getIdentifier(parts[i] + n, "drawable", getPackageName()));
                iv.setScaleType(android.widget.ImageView.ScaleType.FIT_CENTER);
                iv.setPadding((int) (4 * dp), (int) (4 * dp), (int) (4 * dp), (int) (4 * dp));
                iv.setRotation(rot[i]);
                f.addView(iv, full);
            }
            return f;
        }
        TextView t = new TextView(this);
        t.setGravity(Gravity.CENTER);
        t.setTextDirection(View.TEXT_DIRECTION_LTR);
        String fam = "sans-serif-thin", txt = "10:10";
        int col = 0xFFFFFFFF, style = Typeface.NORMAL;
        float size = 24;
        switch (key) {
            case "d2": fam = "sans-serif-black"; break;
            case "d3": fam = "sans-serif-condensed"; col = 0xFFE6BC62; size = 27; break;
            case "d4": fam = "serif"; col = 0xFFF2EEDC; break;
            case "d5": fam = "sans-serif-light"; txt = "10:10:30"; size = 18; break;
            case "d6": fam = "sans-serif-light"; txt = "10\n10"; size = 22; break;
            case "d7": txt = "10:10 م"; size = 21; break;
            case "d8": fam = "monospace"; col = 0xFFF2EEDC; size = 20; break;
            default: break;
        }
        t.setText(txt);
        t.setTypeface(Typeface.create(fam, style));
        t.setTextColor(col);
        t.setTextSize(size);
        t.setLineSpacing(0, 0.85f);
        f.addView(t, full);
        return f;
    }

    private TextView title(String s, float dp) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(17);
        t.setTypeface(Typeface.DEFAULT_BOLD);
        t.setGravity(Gravity.START);
        t.setPadding(0, (int) (10 * dp), 0, (int) (4 * dp));
        return t;
    }
}
