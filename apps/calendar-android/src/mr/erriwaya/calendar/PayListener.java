package mr.erriwaya.calendar;

import android.app.Notification;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.HandlerThread;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

/**
 * On the publisher's phone only, and only once he has given the app access to notifications and turned «اللاقط» on (Pay):
 * hears the notifications as they arrive. Those from the sources he trusts (a bank's app, or a bank's sender name in the
 * SMS app) are kept as payment messages and paired at once with the waiting subscription requests; of the others only
 * the sender is noted, so that he can pick his sources, never the content. While it is connected it also looks for new
 * requests every minute.
 */
public class PayListener extends NotificationListenerService {
    private HandlerThread thread;
    private Handler handler;
    private final Runnable tick = new Runnable() {
        @Override public void run() {
            try { if (Pay.on(PayListener.this)) Pay.sync(PayListener.this); } catch (Exception ignored) { }
            if (handler != null) handler.postDelayed(this, 60000);
        }
    };

    @Override
    public void onListenerConnected() {
        if (thread != null) return;
        thread = new HandlerThread("pay");
        thread.start();
        handler = new Handler(thread.getLooper());
        handler.postDelayed(tick, 5000);
    }

    @Override
    public void onListenerDisconnected() { stop(); }

    @Override
    public void onDestroy() { stop(); super.onDestroy(); }

    private void stop() {
        if (handler != null) handler.removeCallbacksAndMessages(null);
        if (thread != null) thread.quitSafely();
        handler = null; thread = null;
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            if (sbn == null || !Pay.on(this)) return;
            String pkg = sbn.getPackageName();
            if (pkg == null || pkg.equals(getPackageName())) return;
            Notification n = sbn.getNotification();
            if (n == null || (n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;
            Bundle x = n.extras;
            if (x == null) return;
            CharSequence title = x.getCharSequence(Notification.EXTRA_TITLE), text = x.getCharSequence(Notification.EXTRA_TEXT),
                    big = x.getCharSequence(Notification.EXTRA_BIG_TEXT);
            String body = big != null && big.length() > 0 ? big.toString() : text == null ? "" : text.toString();
            if (body.trim().isEmpty()) return;
            String label = pkg;
            try {
                PackageManager pm = getPackageManager();
                ApplicationInfo ai = pm.getApplicationInfo(pkg, 0);
                label = String.valueOf(pm.getApplicationLabel(ai));
            } catch (Exception ignored) { }
            String ttl = title == null ? "" : title.toString().trim();
            if (ttl.length() > 60) ttl = ttl.substring(0, 60);
            if (Pay.note(this, pkg, label, ttl, body.trim(), sbn.getPostTime()) && handler != null) {
                handler.removeCallbacks(tick);
                handler.post(tick);
            }
        } catch (Exception ignored) { }
    }
}
