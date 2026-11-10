package mr.erriwaya.calendar;

import android.app.Notification;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;

import java.io.File;

/** Plays the user's adhan recording in full, at alarm volume, as a foreground service with a stop button. */
public class AdhanService extends Service {
    static final String STOP = "mr.erriwaya.calendar.STOP_ADHAN";
    private MediaPlayer mp;

    @Override
    public IBinder onBind(Intent i) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        String title = intent != null ? intent.getStringExtra("title") : null;
        String text = intent != null ? intent.getStringExtra("text") : null;
        boolean fajr = intent != null && intent.getBooleanExtra("fajr", false);
        Notification n = AdhanReceiver.build(this, title == null ? "الأذان" : title, text == null ? "" : text, true);
        if (Build.VERSION.SDK_INT >= 29) startForeground(8, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(8, n);
        File f = AdhanReceiver.audioFor(this, fajr);
        try {
            if (mp != null) mp.release();
            mp = new MediaPlayer();
            mp.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
            mp.setDataSource(f.getAbsolutePath());
            mp.setOnCompletionListener(m -> stopSelf());
            mp.prepare();
            mp.start();
        } catch (Exception e) {
            stopSelf();
        }
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        if (mp != null) {
            try { mp.stop(); } catch (Exception ignored) { }
            mp.release();
            mp = null;
        }
        stopForeground(true);
        super.onDestroy();
    }
}
