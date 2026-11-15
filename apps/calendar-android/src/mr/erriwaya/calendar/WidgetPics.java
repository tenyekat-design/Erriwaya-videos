package mr.erriwaya.calendar;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;

import java.io.File;
import java.io.FileNotFoundException;

/**
 * Hands the widgets' photos (files/wbg/<id>.png, made by WidgetPhoto) to the launcher, which draws the widgets in its own
 * process: content://mr.erriwaya.calendar.widgetpics/<id>. Read-only, and nothing but those files.
 */
public class WidgetPics extends ContentProvider {
    static final String AUTHORITY = "mr.erriwaya.calendar.widgetpics";

    @Override public boolean onCreate() { return true; }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        String seg = uri.getLastPathSegment();
        if (seg == null || !seg.matches("\\d{1,10}") || !"r".equals(mode)) throw new FileNotFoundException();
        File f = Widgets.pic(getContext(), Integer.parseInt(seg));
        if (!f.isFile()) throw new FileNotFoundException();
        return ParcelFileDescriptor.open(f, ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override public String getType(Uri uri) { return "image/png"; }
    @Override public Cursor query(Uri u, String[] p, String s, String[] a, String o) { return null; }
    @Override public Uri insert(Uri u, ContentValues v) { return null; }
    @Override public int delete(Uri u, String s, String[] a) { return 0; }
    @Override public int update(Uri u, ContentValues v, String s, String[] a) { return 0; }
}
