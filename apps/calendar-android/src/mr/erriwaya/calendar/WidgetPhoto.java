package mr.erriwaya.calendar;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProviderInfo;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Shader;
import android.os.Bundle;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

/**
 * A photo behind one widget: picked from the gallery (no permission needed), then moved and pinched under a frame the
 * shape of the widget, with the widget itself drawn over it so the time (or the day, the months) stays readable, and a
 * darkening slider. Saved cropped, dimmed and with rounded corners to files/wbg/<id>.png (Widgets.applyBg shows it).
 */
public class WidgetPhoto extends Activity {
    private static final int PICK = 1;
    private int id;
    private float wDp = 250, hDp = 110;   // the widget's size, from the launcher
    private Bitmap photo;
    private Crop crop;
    private FrameLayout over;
    private View dim;
    private int darkness = 35;
    private float dp;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        dp = getResources().getDisplayMetrics().density;
        id = getIntent().getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        if (id == AppWidgetManager.INVALID_APPWIDGET_ID) { finish(); return; }
        Bundle o = AppWidgetManager.getInstance(this).getAppWidgetOptions(id);
        if (o != null) {
            // portrait: the narrow width and the tall height
            int w = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH), h = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT);
            if (w > 40 && h > 30) { wDp = w; hDp = h; }
        }
        Intent pick = new Intent(Intent.ACTION_GET_CONTENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE);
        try { startActivityForResult(Intent.createChooser(pick, "اختر صورة"), PICK); } catch (Exception e) { finish(); }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req != PICK) return;
        if (res != RESULT_OK || data == null || data.getData() == null) { finish(); return; }
        try {
            photo = load(data);
        } catch (Throwable t) {
            Toast.makeText(this, "تعذّر فتح الصورة", Toast.LENGTH_LONG).show();
            finish();
            return;
        }
        build();
    }

    /** The picture, at most 2048 px on its long side, turned upright as the camera recorded it. */
    private Bitmap load(Intent data) throws Exception {
        android.net.Uri u = data.getData();
        BitmapFactory.Options op = new BitmapFactory.Options();
        op.inJustDecodeBounds = true;
        try (InputStream in = getContentResolver().openInputStream(u)) { BitmapFactory.decodeStream(in, null, op); }
        int s = 1;
        while (Math.max(op.outWidth, op.outHeight) / s > 2048) s *= 2;
        op = new BitmapFactory.Options();
        op.inSampleSize = s;
        Bitmap bm;
        try (InputStream in = getContentResolver().openInputStream(u)) { bm = BitmapFactory.decodeStream(in, null, op); }
        if (bm == null) throw new Exception("no image");
        int rot = 0;
        if (android.os.Build.VERSION.SDK_INT >= 24) {
            try (InputStream in = getContentResolver().openInputStream(u)) {
                int or = new android.media.ExifInterface(in).getAttributeInt(android.media.ExifInterface.TAG_ORIENTATION, 1);
                rot = or == 6 ? 90 : or == 3 ? 180 : or == 8 ? 270 : 0;
            } catch (Exception ignored) { }
        }
        if (rot != 0) {
            Matrix m = new Matrix();
            m.postRotate(rot);
            bm = Bitmap.createBitmap(bm, 0, 0, bm.getWidth(), bm.getHeight(), m, true);
        }
        return bm;
    }

    private void build() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setBackgroundColor(0xFF101010);
        FrameLayout stage = new FrameLayout(this);
        crop = new Crop(this);
        stage.addView(crop, new FrameLayout.LayoutParams(-1, -1));
        dim = new View(this);
        stage.addView(dim, new FrameLayout.LayoutParams(0, 0));
        over = new FrameLayout(this);
        stage.addView(over, new FrameLayout.LayoutParams(0, 0));
        box.addView(stage, new LinearLayout.LayoutParams(-1, 0, 1));

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.VERTICAL);
        bar.setPadding((int) (16 * dp), (int) (10 * dp), (int) (16 * dp), (int) (12 * dp));
        TextView hint = new TextView(this);
        hint.setText("حرّك الصورة بإصبعك وكبّرها أو صغّرها بإصبعين حتى يظهر الوقت واضحًا، ثم اختر درجة التعتيم");
        hint.setTextColor(0xFFDDDDDD);
        hint.setTextSize(13);
        hint.setGravity(Gravity.CENTER);
        bar.addView(hint);
        final TextView dl = new TextView(this);
        dl.setTextColor(0xFFF2EEDC);
        dl.setTextSize(14);
        dl.setText("التعتيم: " + darkness + "٪");
        bar.addView(dl);
        SeekBar sb = new SeekBar(this);
        sb.setMax(80);
        sb.setProgress(darkness);
        sb.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override public void onProgressChanged(SeekBar s, int p, boolean u) { darkness = p; dl.setText("التعتيم: " + p + "٪"); tint(); }
            @Override public void onStartTrackingTouch(SeekBar s) { }
            @Override public void onStopTrackingTouch(SeekBar s) { }
        });
        bar.addView(sb);
        LinearLayout btns = new LinearLayout(this);
        btns.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        btns.setPadding(0, (int) (8 * dp), 0, 0);
        TextView save = button("حفظ الخلفية", 0xFFE6BC62, 0xFF0B1F5C, true);
        TextView cancel = button("إلغاء", 0x00000000, 0xFFF2EEDC, false);
        LinearLayout.LayoutParams bl = new LinearLayout.LayoutParams(0, (int) (50 * dp), 1);
        bl.setMargins((int) (6 * dp), 0, (int) (6 * dp), 0);
        btns.addView(save, bl);
        btns.addView(cancel, new LinearLayout.LayoutParams(bl));
        bar.addView(btns);
        box.addView(bar);
        cancel.setOnClickListener(v -> finish());
        save.setOnClickListener(v -> save());
        // Android 15 draws apps under the status and navigation bars: keep the buttons above the navigation bar
        box.setOnApplyWindowInsetsListener((v, in) -> {
            int top = in.getSystemWindowInsetTop(), bottom = in.getSystemWindowInsetBottom();
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets i = in.getInsets(android.view.WindowInsets.Type.systemBars());
                top = i.top; bottom = i.bottom;
            }
            v.setPadding(0, top, 0, bottom);
            return in;
        });
        setContentView(box);
        box.requestApplyInsets();
        tint();
    }

    /** A large, plain button: gold and filled for saving, outlined for cancelling. */
    private TextView button(String label, int fill, int ink, boolean bold) {
        TextView t = new TextView(this);
        t.setText(label);
        t.setTextSize(17);
        t.setTextColor(ink);
        t.setGravity(Gravity.CENTER);
        if (bold) t.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        android.graphics.drawable.GradientDrawable g = new android.graphics.drawable.GradientDrawable();
        g.setCornerRadius(12 * dp);
        g.setColor(fill);
        g.setStroke((int) (1.5f * dp), 0xFFE6BC62);
        t.setBackground(g);
        t.setClickable(true);
        t.setFocusable(true);
        return t;
    }

    private void tint() { if (dim != null) dim.setBackgroundColor(Color.argb(darkness * 255 / 100, 0, 0, 0)); }

    /** The widget drawn over the frame, without its ground, so the owner sees what the photo will sit behind. */
    private void overlay(RectF f) {
        ViewGroup.LayoutParams dlp = dim.getLayoutParams();
        FrameLayout.LayoutParams d = (FrameLayout.LayoutParams) dlp;
        d.width = (int) f.width(); d.height = (int) f.height(); d.leftMargin = (int) f.left; d.topMargin = (int) f.top;
        d.gravity = Gravity.TOP | Gravity.LEFT;
        dim.setLayoutParams(d);
        FrameLayout.LayoutParams o = (FrameLayout.LayoutParams) over.getLayoutParams();
        o.width = (int) f.width(); o.height = (int) f.height(); o.leftMargin = (int) f.left; o.topMargin = (int) f.top;
        o.gravity = Gravity.TOP | Gravity.LEFT;
        over.setLayoutParams(o);
        over.removeAllViews();
        try {
            AppWidgetProviderInfo info = AppWidgetManager.getInstance(this).getAppWidgetInfo(id);
            String cls = info != null && info.provider != null ? info.provider.getClassName() : "";
            String layout = cls.endsWith(".ClockWidget") ? "widget_clock_" + Widgets.clock(this, id)
                    : cls.endsWith(".DayWidget") ? "widget_day" : cls.endsWith(".AyatWidget") ? "widget_ayat" : cls.endsWith(".MonthWidget") ? "widget_month" : "widget_calendar";
            int res = getResources().getIdentifier(layout, "layout", getPackageName());
            View w = getLayoutInflater().inflate(res, over, false);
            for (int bgId : new int[]{R.id.cBg, R.id.dBg, R.id.mBg, R.id.wBg, R.id.aBg}) {
                View g = w.findViewById(bgId);
                if (g != null) g.setVisibility(View.INVISIBLE);
            }
            android.widget.ImageView fig = w.findViewById(R.id.cTimeImg);
            if (fig != null) fig.setImageBitmap(ClockArt.render(this, Widgets.clock(this, id), java.util.Calendar.getInstance(), Math.min(2f, dp)));
            View nx = w.findViewById(R.id.cNext);
            if (nx != null && !Widgets.clockNext(this, id)) nx.setVisibility(View.GONE);
            float sc = f.width() / (wDp * dp);
            FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams((int) (wDp * dp), (int) (hDp * dp));
            lp.gravity = Gravity.TOP | Gravity.LEFT;
            w.setPivotX(0);
            w.setPivotY(0);
            w.setScaleX(sc);
            w.setScaleY(sc);
            over.addView(w, lp);
        } catch (Throwable ignored) { }
    }

    private void save() {
        try {
            RectF src = crop.source();
            int outW = 900, outH = Math.max(1, Math.round(900 * hDp / wDp));
            if (outH > 900) { outH = 900; outW = Math.max(1, Math.round(900 * wDp / hDp)); }
            Bitmap cut = Bitmap.createBitmap(outW, outH, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(cut);
            Matrix m = new Matrix();
            m.setRectToRect(src, new RectF(0, 0, outW, outH), Matrix.ScaleToFit.FILL);
            Paint p = new Paint(Paint.FILTER_BITMAP_FLAG | Paint.ANTI_ALIAS_FLAG);
            c.drawBitmap(photo, m, p);
            c.drawColor(Color.argb(darkness * 255 / 100, 0, 0, 0));
            // the widgets' rounded corners (18 dp), baked in
            Bitmap out = Bitmap.createBitmap(outW, outH, Bitmap.Config.ARGB_8888);
            Canvas oc = new Canvas(out);
            Paint rp = new Paint(Paint.ANTI_ALIAS_FLAG);
            rp.setShader(new BitmapShader(cut, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP));
            float r = 18f * outW / wDp;
            oc.drawRoundRect(new RectF(0, 0, outW, outH), r, r, rp);
            File f = Widgets.pic(this, id);
            f.getParentFile().mkdirs();
            try (FileOutputStream fo = new FileOutputStream(f)) { out.compress(Bitmap.CompressFormat.PNG, 100, fo); }
            Widgets.updateAll(this);
            Toast.makeText(this, "تم وضع الخلفية", Toast.LENGTH_SHORT).show();
            setResult(RESULT_OK);
        } catch (Throwable t) {
            Toast.makeText(this, "تعذّر حفظ الخلفية", Toast.LENGTH_LONG).show();
        }
        finish();
    }

    static void remove(Context ctx, int id) {
        File f = Widgets.pic(ctx, id);
        if (f.isFile()) f.delete();
        Widgets.updateAll(ctx);
    }

    /** The photo under a frame of the widget's shape: one finger moves it, two scale it; it always covers the frame. */
    private final class Crop extends View {
        private final Matrix m = new Matrix();
        private final RectF frame = new RectF();
        private final Paint shade = new Paint(), edge = new Paint(Paint.ANTI_ALIAS_FLAG), pic = new Paint(Paint.FILTER_BITMAP_FLAG);
        private final ScaleGestureDetector sg;
        private float lx, ly;
        private boolean ready;

        Crop(Context c) {
            super(c);
            shade.setColor(0xB0000000);
            edge.setColor(0xFFE6BC62);
            edge.setStyle(Paint.Style.STROKE);
            edge.setStrokeWidth(2 * dp);
            sg = new ScaleGestureDetector(c, new ScaleGestureDetector.SimpleOnScaleGestureListener() {
                @Override public boolean onScale(ScaleGestureDetector d) {
                    m.postScale(d.getScaleFactor(), d.getScaleFactor(), d.getFocusX(), d.getFocusY());
                    keep();
                    invalidate();
                    return true;
                }
            });
        }

        @Override
        protected void onSizeChanged(int w, int h, int ow, int oh) {
            float pad = 20 * dp, fw = w - 2 * pad, fh = fw * hDp / wDp;
            if (fh > h - 2 * pad) { fh = h - 2 * pad; fw = fh * wDp / hDp; }
            frame.set((w - fw) / 2, (h - fh) / 2, (w + fw) / 2, (h + fh) / 2);
            float s = Math.max(fw / photo.getWidth(), fh / photo.getHeight());
            m.reset();
            m.postScale(s, s);
            m.postTranslate(frame.centerX() - photo.getWidth() * s / 2, frame.centerY() - photo.getHeight() * s / 2);
            ready = true;
            post(() -> overlay(new RectF(frame)));
        }

        /** No gap inside the frame: at least covering it, and not moved past its edges. */
        private void keep() {
            RectF r = new RectF(0, 0, photo.getWidth(), photo.getHeight());
            m.mapRect(r);
            float need = Math.max(frame.width() / r.width(), frame.height() / r.height());
            if (need > 1) { m.postScale(need, need, frame.centerX(), frame.centerY()); r = new RectF(0, 0, photo.getWidth(), photo.getHeight()); m.mapRect(r); }
            float dx = 0, dy = 0;
            if (r.left > frame.left) dx = frame.left - r.left;
            if (r.right < frame.right) dx = frame.right - r.right;
            if (r.top > frame.top) dy = frame.top - r.top;
            if (r.bottom < frame.bottom) dy = frame.bottom - r.bottom;
            m.postTranslate(dx, dy);
        }

        RectF source() {
            Matrix inv = new Matrix();
            m.invert(inv);
            RectF r = new RectF(frame);
            inv.mapRect(r);
            return r;
        }

        @Override
        public boolean onTouchEvent(MotionEvent e) {
            sg.onTouchEvent(e);
            switch (e.getActionMasked()) {
                case MotionEvent.ACTION_DOWN: lx = e.getX(); ly = e.getY(); break;
                case MotionEvent.ACTION_POINTER_UP: lx = e.getX(e.getActionIndex() == 0 ? 1 : 0); ly = e.getY(e.getActionIndex() == 0 ? 1 : 0); break;
                case MotionEvent.ACTION_MOVE:
                    if (e.getPointerCount() == 1 && !sg.isInProgress()) {
                        m.postTranslate(e.getX() - lx, e.getY() - ly);
                        keep();
                        invalidate();
                    }
                    lx = e.getX(); ly = e.getY();
                    break;
                default: break;
            }
            return true;
        }

        @Override
        protected void onDraw(Canvas c) {
            if (!ready) return;
            c.drawBitmap(photo, m, pic);
            Path p = new Path();
            p.addRect(0, 0, getWidth(), getHeight(), Path.Direction.CW);
            p.addRoundRect(frame, 18 * dp * frame.width() / (wDp * dp), 18 * dp * frame.width() / (wDp * dp), Path.Direction.CCW);
            p.setFillType(Path.FillType.EVEN_ODD);
            c.drawPath(p, shade);
            c.drawRoundRect(frame, 18 * dp * frame.width() / (wDp * dp), 18 * dp * frame.width() / (wDp * dp), edge);
        }
    }
}
