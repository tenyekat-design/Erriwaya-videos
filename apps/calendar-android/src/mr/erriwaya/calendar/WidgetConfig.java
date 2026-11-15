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
        float dp = getResources().getDisplayMetrics().density;

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        box.setPadding((int) (20 * dp), (int) (16 * dp), (int) (20 * dp), (int) (12 * dp));

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
