package mr.erriwaya.calendar;

import android.app.Activity;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONArray;

/**
 * «الويدجت»: the app's widgets shown as they look (their own layouts, filled with sample content and shrunk), for all to
 * see; non-subscribers see a lock on each and the way to subscribe. Opened from its tile and from the lock screen.
 */
public class WidgetShow extends Activity {
    private float dp;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        dp = getResources().getDisplayMetrics().density;
        boolean paid = Sub.open(this);
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        box.setBackgroundColor(0xFF03062B);
        int p = (int) (16 * dp);
        box.setPadding(p, p, p, p);

        LinearLayout head = new LinearLayout(this);
        head.setGravity(Gravity.CENTER_VERTICAL);
        TextView t = text("الويدجت", 22, 0xFFE6BC62, true);
        head.addView(t, new LinearLayout.LayoutParams(0, -2, 1));
        TextView x = text("✕", 18, 0xFFF2EEDC, false);
        x.setGravity(Gravity.CENTER);
        GradientDrawable xb = new GradientDrawable();
        xb.setShape(GradientDrawable.OVAL);
        xb.setStroke((int) (1.5f * dp), 0xFFE6BC62);
        x.setBackground(xb);
        x.setOnClickListener(v -> finish());
        head.addView(x, new LinearLayout.LayoutParams((int) (38 * dp), (int) (38 * dp)));
        box.addView(head);
        box.addView(text(paid
                ? "لإضافة ويدجت: اضغط مطوّلًا على مكان فارغ في الشاشة الرئيسية ← الأدوات (Widgets) ← التقويم الموريتاني، ثم اسحبه. ولكل ويدجت إعداداته (الشكل، الخلفية، صورة من عندك): اضغط عليه مطوّلًا ثم «الإعدادات»."
                : "هذه ويدجت التقويم الموريتاني كما تظهر على الشاشة الرئيسية. تعمل للمشتركين؛ وتظهر لغيرهم باهتة ثابتة.", 14, 0xFFB9C2E8, false));

        float cardW = getResources().getDisplayMetrics().widthPixels / dp - 32;
        add(box, "آيات من القرآن", "آية برواية ورش تتبدّل كل ساعة، وباللمس تنتقل إلى غيرها", "widget_ayat", 250, 120, cardW, paid);
        add(box, "يوم الأسبوع بالخط العربي", "اسم اليوم بخط صاحب التطبيق، يُكبَّر كما تشاء", "widget_day", 250, 125, cardW, paid);
        add(box, "الأشهر", "الهجري والحساني والميلادي، معًا أو اثنان أو واحد", "widget_month", 300, 130, cardW, paid);
        add(box, "الساعة", "عشرة أشكال بأرقام طويلة، واثنا عشر ميناءً بعقاربها", "widget_clock_d1", 250, 120, cardW, paid);
        add(box, "الساعة بالعقارب", "", "widget_clock_a2", 180, 180, cardW * 0.6f, paid);
        add(box, "التقويم ومواقيت الصلاة", "التاريخان والصلوات والقادمة منها", "widget_calendar", 320, 170, cardW, paid);
        add(box, "إشعار اليوم على شاشة القفل", "لكل الهواتف ومنها سامسونغ: فعّله من الإعدادات", null, 0, 0, cardW, paid);

        ScrollView sv = new ScrollView(this);
        sv.addView(box);
        sv.setBackgroundColor(0xFF03062B);
        box.setOnApplyWindowInsetsListener((v, in) -> {
            v.setPadding(p, p + in.getSystemWindowInsetTop(), p, p + in.getSystemWindowInsetBottom());
            return in;
        });
        setContentView(sv);
    }

    private TextView text(String s, float size, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(size);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        t.setPadding(0, (int) (6 * dp), 0, (int) (6 * dp));
        return t;
    }

    /** One widget: its name, a line about it, and its own layout filled with sample content, shrunk to the card. */
    private void add(LinearLayout box, String name, String about, String layout, float wDp, float hDp, float cardW, boolean paid) {
        box.addView(text(name, 17, 0xFFF2EEDC, true));
        if (!about.isEmpty()) box.addView(text(about, 13, 0xFFB9C2E8, false));
        if (layout == null) return;
        try {
            int res = getResources().getIdentifier(layout, "layout", getPackageName());
            View w = getLayoutInflater().inflate(res, null, false);
            fill(w, layout, wDp, hDp);
            float sc = Math.min(cardW / wDp, 1.4f);
            FrameLayout frame = new FrameLayout(this);
            FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams((int) (wDp * dp), (int) (hDp * dp));
            lp.gravity = Gravity.TOP | Gravity.LEFT;
            w.setPivotX(0);
            w.setPivotY(0);
            w.setScaleX(sc);
            w.setScaleY(sc);
            frame.addView(w, lp);
            if (!paid) {   // a lock on it, and dimmed
                w.setAlpha(0.45f);
                TextView lock = text("🔒 للمشتركين", 13, 0xFF0B1F5C, true);
                GradientDrawable g = new GradientDrawable();
                g.setCornerRadius(8 * dp);
                g.setColor(0xFFE6BC62);
                lock.setBackground(g);
                lock.setPadding((int) (10 * dp), (int) (3 * dp), (int) (10 * dp), (int) (3 * dp));
                FrameLayout.LayoutParams ll = new FrameLayout.LayoutParams(-2, -2);
                ll.gravity = Gravity.CENTER;
                frame.addView(lock, ll);
            }
            LinearLayout.LayoutParams fl = new LinearLayout.LayoutParams((int) (wDp * sc * dp), (int) (hDp * sc * dp));
            fl.gravity = Gravity.CENTER_HORIZONTAL;
            fl.bottomMargin = (int) (14 * dp);
            box.addView(frame, fl);
        } catch (Throwable ignored) { }
    }

    /** Sample content, as the widget's own code would put it. */
    private void fill(View w, String layout, float wDp, float hDp) {
        java.util.Calendar cal = java.util.Calendar.getInstance();
        float scale = Math.min(2f, dp);
        ImageView fig = w.findViewById(R.id.cTimeImg);
        if (fig != null) fig.setImageBitmap(ClockArt.render(this, "d1", cal, scale));
        TextView nx = w.findViewById(R.id.cNext);
        if (nx != null) nx.setText("القادمة: العشاء 19:47");
        ImageView ai = w.findViewById(R.id.aImg);
        if (ai != null) {
            try {
                java.io.InputStream in = getAssets().open("data/ayat-warsh.json");
                java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream();
                byte[] buf = new byte[8192];
                int k;
                while ((k = in.read(buf)) > 0) bo.write(buf, 0, k);
                in.close();
                JSONArray l = new JSONArray(bo.toString("UTF-8"));
                ai.setImageBitmap(AyatWidget.render(this, l.getJSONObject(4), wDp - 12, hDp - 12, scale));
            } catch (Exception ignored) { }
        }
        int[] mv = {R.id.mH, R.id.mL, R.id.mG};
        String[] set = {"h", "l", "g"};
        for (int i = 0; i < 3; i++) {
            ImageView m = w.findViewById(mv[i]);
            if (m != null) {
                try { m.setImageBitmap(MonthWidget.card(this, MonthWidget.pic(this, set[i], i == 2 ? 11 : 5), i == 2 ? "16 · 2026 م" : "6 · 1448 هـ")); } catch (Exception ignored) { }
            }
        }
    }
}
