package mr.erriwaya.calendar;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/**
 * Two reminders during the free day, for those who have not subscribed: two hours before it ends, and when it ends.
 * Each opens the subscription screen (#subscribe). Scheduled again whenever the subscription state is synced.
 */
public class TrialNote extends BroadcastReceiver {
    private static final String CH = "trial", SOON = "mr.erriwaya.calendar.TRIAL_SOON", END = "mr.erriwaya.calendar.TRIAL_END";

    private static PendingIntent pi(Context ctx, String action, int code) {
        int f = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        return PendingIntent.getBroadcast(ctx, code, new Intent(ctx, TrialNote.class).setAction(action), f);
    }

    static void schedule(Context ctx) {
        try {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            long now = Sub.now(ctx), end = Sub.trialEnd(ctx);
            boolean paid = Sub.paidUntil(ctx) > now;
            am.cancel(pi(ctx, SOON, 51));
            am.cancel(pi(ctx, END, 52));
            if (paid || end <= now || !Sub.verified(ctx)) return;
            long wall = System.currentTimeMillis() - now;   // Sub.now may be the server's clock: back to the phone's
            if (end - 2 * 3600000L > now) am.set(AlarmManager.RTC_WAKEUP, end - 2 * 3600000L + wall, pi(ctx, SOON, 51));
            am.set(AlarmManager.RTC_WAKEUP, end + 60000L + wall, pi(ctx, END, 52));
        } catch (Exception ignored) { }
    }

    @Override
    public void onReceive(Context ctx, Intent i) {
        try {
            if (Sub.paidUntil(ctx) > Sub.now(ctx)) return;
            boolean soon = SOON.equals(i.getAction());
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null)
                nm.createNotificationChannel(new NotificationChannel(CH, "التجربة المجانية", NotificationManager.IMPORTANCE_DEFAULT));
            String title = soon ? "بقيت ساعتان على نهاية التجربة المجانية" : "انتهت التجربة المجانية";
            String text = soon ? "اشترك الآن لتبقى معك المواقيت والأذان والمصحف والويدجت والخلفيات طوال السنة، والتفعيل تلقائي خلال دقائق."
                    : "التقويم الموريتاني أُقفل. اشترك ببنكيلي أو مصرفي أو السداد أو بيم بانك، ويُفتح تلقائيًا خلال دقائق.";
            int f = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
            Intent open = new Intent(ctx, MainActivity.class).putExtra("hash", "#subscribe")
                    .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(ctx, CH) : new Notification.Builder(ctx);
            b.setSmallIcon(R.drawable.ic_stat_adhan).setContentTitle(title).setContentText(text).setAutoCancel(true)
                    .setColor(0xFF0F5641).setStyle(new Notification.BigTextStyle().bigText(text))
                    .setContentIntent(PendingIntent.getActivity(ctx, 53, open, f));
            nm.notify(soon ? 4251 : 4252, b.build());
        } catch (Exception ignored) { }
    }
}
