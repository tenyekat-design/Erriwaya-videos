package mr.erriwaya.calendar;

import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

/**
 * The phone's rough position, once, for «أقرب بلدية إلى موقعي». Uses Android's own LocationManager (no Google
 * services needed) with the approximate-location permission only. The position goes to the page and nowhere else.
 */
final class Locator {
    interface Result { void at(double lat, double lng, boolean ok); }

    static final int REQUEST = 9;
    private static final String PERMISSION = "android.permission.ACCESS_COARSE_LOCATION";

    static boolean allowed(Context c) {
        return Build.VERSION.SDK_INT < 23 || c.checkSelfPermission(PERMISSION) == PackageManager.PERMISSION_GRANTED;
    }

    static void ask(Activity a) {
        if (Build.VERSION.SDK_INT >= 23) a.requestPermissions(new String[]{PERMISSION}, REQUEST);
    }

    /** Must be called on the main thread, with the permission granted. Calls back once, on the main thread. */
    static void locate(Context ctx, final Result out) {
        final LocationManager lm = (LocationManager) ctx.getSystemService(Context.LOCATION_SERVICE);
        if (lm == null) { out.at(0, 0, false); return; }
        // a position the phone already knows (at most two hours old) is enough to pick a commune
        Location best = null;
        java.util.List<String> on;
        try { on = lm.getProviders(true); } catch (Exception e) { on = new java.util.ArrayList<>(); }
        for (String p : on) {
            try {
                Location l = lm.getLastKnownLocation(p);
                if (l != null && (best == null || l.getTime() > best.getTime())) best = l;
            } catch (Exception ignored) { }
        }
        if (best != null && System.currentTimeMillis() - best.getTime() < 2 * 3600000L) {
            out.at(best.getLatitude(), best.getLongitude(), true);
            return;
        }
        final Location old = best;
        final boolean[] done = {false};
        final Handler h = new Handler(Looper.getMainLooper());
        final LocationListener listener = new LocationListener() {
            @Override public void onLocationChanged(Location l) {
                if (done[0] || l == null) return;
                done[0] = true;
                try { lm.removeUpdates(this); } catch (Exception ignored) { }
                out.at(l.getLatitude(), l.getLongitude(), true);
            }
            @Override public void onStatusChanged(String p, int s, Bundle b) { }
            @Override public void onProviderEnabled(String p) { }
            @Override public void onProviderDisabled(String p) { }
        };
        boolean asked = false;
        for (String p : new String[]{"fused", LocationManager.NETWORK_PROVIDER, LocationManager.GPS_PROVIDER}) {
            if (!on.contains(p)) continue;
            try { lm.requestLocationUpdates(p, 0, 0, listener, Looper.getMainLooper()); asked = true; } catch (Exception ignored) { }
        }
        if (!asked) {   // location is off, or no provider this permission may use: an older position is better than none
            if (old != null) out.at(old.getLatitude(), old.getLongitude(), true);
            else out.at(0, 0, false);
            return;
        }
        h.postDelayed(() -> {
            if (done[0]) return;
            done[0] = true;
            try { lm.removeUpdates(listener); } catch (Exception ignored) { }
            if (old != null) out.at(old.getLatitude(), old.getLongitude(), true);
            else out.at(0, 0, false);
        }, 20000);
    }
}
